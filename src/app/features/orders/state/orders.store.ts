import { Injectable, computed, signal } from '@angular/core';

import { AppError } from '../../../shared/types/app-error';
import { AsyncState } from '../../../shared/types/async-state';
import { OrderLiveEvent } from '../data-access/order-live-event.service';
import {
  DEFAULT_ORDER_FILTERS,
  Order,
  OrderChannel,
  OrderFilters,
  OrderId,
  OrderPriority,
  OrderSort,
  OrderStatus,
} from '../domain/order.model';
import { selectOrderSummary, selectVisibleOrders } from '../domain/order-selectors';
import {
  getAvailableTransitions,
  validateStatusTransition,
} from '../domain/order-transition.policy';

export type OptimisticOrderSnapshot = Readonly<{
  orderId: OrderId;
  status: OrderStatus;
  synchronizationState: Order['synchronizationState'];
  revision: number;
}>;

@Injectable()
export class OrdersStore {
  private readonly entitiesSignal = signal<ReadonlyMap<OrderId, Order>>(new Map());
  private readonly orderedIdsSignal = signal<readonly OrderId[]>([]);
  private readonly filtersSignal = signal<OrderFilters>(DEFAULT_ORDER_FILTERS);
  private readonly selectedOrderIdSignal = signal<OrderId | null>(null);
  private readonly loadStateSignal = signal<AsyncState<true>>({ status: 'idle' });
  private readonly currentTimeSignal = signal(Date.now());

  readonly filters = this.filtersSignal.asReadonly();
  readonly selectedOrderId = this.selectedOrderIdSignal.asReadonly();
  readonly loadState = this.loadStateSignal.asReadonly();
  readonly currentTime = this.currentTimeSignal.asReadonly();
  readonly orders = computed<readonly Order[]>(() => {
    const entities = this.entitiesSignal();
    return this.orderedIdsSignal()
      .map((id) => entities.get(id))
      .filter((order): order is Order => order !== undefined);
  });
  readonly visibleOrders = computed(() => selectVisibleOrders(this.orders(), this.filtersSignal()));
  readonly summary = computed(() => selectOrderSummary(this.orders()));
  readonly selectedOrder = computed(() => {
    const selectedId = this.selectedOrderIdSignal();
    return selectedId === null ? null : (this.entitiesSignal().get(selectedId) ?? null);
  });
  readonly selectedTransitions = computed(() => {
    const order = this.selectedOrder();
    return order === null ? [] : getAvailableTransitions(order);
  });

  setLoading(): void {
    this.loadStateSignal.set({ status: 'loading' });
  }

  setOrders(orders: readonly Order[]): void {
    this.entitiesSignal.set(new Map(orders.map((order) => [order.id, order])));
    this.orderedIdsSignal.set(orders.map((order) => order.id));
    this.loadStateSignal.set(
      orders.length === 0 ? { status: 'empty' } : { status: 'success', data: true },
    );
  }

  setLoadError(error: AppError): void {
    this.loadStateSignal.set({ status: 'error', error });
  }

  setStatusFilter(status: OrderFilters['status']): void {
    this.filtersSignal.update((filters) => ({ ...filters, status }));
  }

  toggleChannel(channel: OrderChannel): void {
    this.filtersSignal.update((filters) => ({
      ...filters,
      channels: toggleValue(filters.channels, channel),
    }));
  }

  togglePriority(priority: OrderPriority): void {
    this.filtersSignal.update((filters) => ({
      ...filters,
      priorities: toggleValue(filters.priorities, priority),
    }));
  }

  setSearchTerm(searchTerm: string): void {
    this.filtersSignal.update((filters) => ({ ...filters, searchTerm }));
  }

  setSort(sort: OrderSort): void {
    this.filtersSignal.update((filters) => ({ ...filters, sort }));
  }

  clearFilters(): void {
    this.filtersSignal.set(DEFAULT_ORDER_FILTERS);
  }

  selectOrder(orderId: OrderId | null): void {
    this.selectedOrderIdSignal.set(orderId);
  }

  updateCurrentTime(timestamp: number): void {
    this.currentTimeSignal.set(timestamp);
  }

  beginOptimisticTransition(orderId: OrderId, status: OrderStatus): OptimisticOrderSnapshot | null {
    const order = this.entitiesSignal().get(orderId);
    if (order === undefined || order.synchronizationState === 'pending') {
      return null;
    }
    const snapshot: OptimisticOrderSnapshot = {
      orderId,
      status: order.status,
      synchronizationState: order.synchronizationState,
      revision: order.revision,
    };
    this.updateOrder(orderId, (current) => ({
      ...current,
      status,
      synchronizationState: 'pending',
    }));
    return snapshot;
  }

  confirmTransition(orderId: OrderId, status: OrderStatus, revision: number): void {
    this.updateOrder(orderId, (current) => ({
      ...current,
      status,
      synchronizationState: 'synchronized',
      revision,
    }));
  }

  rollbackTransition(snapshot: OptimisticOrderSnapshot): void {
    this.updateOrder(snapshot.orderId, (current) => ({
      ...current,
      status: snapshot.status,
      synchronizationState: 'failed',
      revision: snapshot.revision,
    }));
  }

  applyLiveEvent(event: OrderLiveEvent): void {
    switch (event.type) {
      case 'order.created':
        this.addOrder(event.payload.order);
        break;
      case 'order.status-changed':
        this.applyExternalStatus(event.payload.orderId, event.payload.status);
        break;
      case 'order.priority-changed':
        this.applyExternalUpdate(event.payload.orderId, { priority: event.payload.priority });
        break;
      case 'order.delay-changed':
        this.applyExternalUpdate(event.payload.orderId, { isDelayed: event.payload.isDelayed });
        break;
      case 'order.payment-changed':
        this.applyExternalUpdate(event.payload.orderId, {
          paymentState: event.payload.paymentState,
        });
        break;
    }
  }

  getOrder(orderId: OrderId): Order | undefined {
    return this.entitiesSignal().get(orderId);
  }

  private addOrder(order: Order): void {
    if (this.entitiesSignal().has(order.id)) {
      return;
    }
    this.entitiesSignal.update((entities) => new Map(entities).set(order.id, order));
    this.orderedIdsSignal.update((ids) => [order.id, ...ids]);
  }

  private applyExternalUpdate(orderId: OrderId, changes: Partial<Order>): void {
    const order = this.entitiesSignal().get(orderId);
    if (order === undefined || order.synchronizationState === 'pending') {
      return;
    }
    this.updateOrder(orderId, (current) => ({
      ...current,
      ...changes,
      revision: current.revision + 1,
    }));
  }

  private applyExternalStatus(orderId: OrderId, status: OrderStatus): void {
    const order = this.entitiesSignal().get(orderId);
    if (
      order === undefined ||
      order.synchronizationState === 'pending' ||
      !validateStatusTransition(order, status).valid
    ) {
      return;
    }
    this.applyExternalUpdate(orderId, { status });
  }

  private updateOrder(orderId: OrderId, updater: (order: Order) => Order): void {
    const current = this.entitiesSignal().get(orderId);
    if (current === undefined) {
      return;
    }
    this.entitiesSignal.update((entities) => new Map(entities).set(orderId, updater(current)));
  }
}

function toggleValue<T>(values: readonly T[], value: T): readonly T[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}
