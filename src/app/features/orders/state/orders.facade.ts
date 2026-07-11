import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription, interval, take } from 'rxjs';

import { NotificationService } from '../../../core/notifications/notification.service';
import { ConnectivityService } from '../../../core/connectivity/connectivity.service';
import { AppError } from '../../../shared/types/app-error';
import { IdGenerator } from '../../../shared/utilities/id-generator';
import { OrderLiveEventService } from '../data-access/order-live-event.service';
import { ORDERS_REPOSITORY, OrdersRepository } from '../data-access/orders.repository';
import {
  OrderChannel,
  OrderFilters,
  OrderId,
  OrderPriority,
  OrderSort,
  OrderStatus,
} from '../domain/order.model';
import { validateStatusTransition } from '../domain/order-transition.policy';
import { OrdersStore } from './orders.store';
import { KitchenOrdersCoordinator } from './kitchen-orders.coordinator';
import { OfflineQueueFacade } from '../../offline-queue/state/offline-queue.facade';

@Injectable()
export class OrdersFacade {
  private readonly store = inject(OrdersStore);
  private readonly repository = inject<OrdersRepository>(ORDERS_REPOSITORY);
  private readonly liveEvents = inject(OrderLiveEventService);
  private readonly notifications = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly idGenerator = new IdGenerator();
  private readonly kitchenCoordinator = inject(KitchenOrdersCoordinator);
  private readonly connectivity = inject(ConnectivityService);
  private readonly offlineQueue = inject(OfflineQueueFacade);
  private readonly inFlightOrders = new Set<OrderId>();
  private loadSubscription: Subscription | null = null;

  readonly orders = this.store.orders;
  readonly visibleOrders = this.store.visibleOrders;
  readonly filters = this.store.filters;
  readonly summary = this.store.summary;
  readonly selectedOrder = this.store.selectedOrder;
  readonly selectedTransitions = this.store.selectedTransitions;
  readonly loadState = this.store.loadState;
  readonly currentTime = this.store.currentTime;

  constructor() {
    this.liveEvents.events$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => this.store.applyLiveEvent(event));
    interval(30_000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.store.updateCurrentTime(Date.now()));
    this.offlineQueue.results$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((result) => {
      this.inFlightOrders.delete(result.operation.entityId);
      this.store.reconcileQueueResult(result);
      this.notifications.show(
        result.outcome === 'completed'
          ? `${result.operation.payload.orderNumber} synchronized successfully.`
          : `${result.operation.payload.orderNumber} could not be synchronized and was restored.`,
        result.outcome === 'completed' ? 'success' : 'error',
      );
    });
  }

  load(): void {
    this.loadSubscription?.unsubscribe();
    this.store.setLoading();
    this.loadSubscription = this.repository
      .loadOrders()
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (orders) => {
          this.store.setOrders(orders);
          this.kitchenCoordinator.applyCurrentLoad();
          for (const operation of this.offlineQueue.restoredOperations()) {
            this.store.applyRestoredOperation(operation);
          }
        },
        error: (error: AppError) => this.store.setLoadError(error),
      });
  }

  retryLoad(): void {
    this.load();
  }

  setStatusFilter(status: OrderFilters['status']): void {
    this.store.setStatusFilter(status);
  }

  toggleChannel(channel: OrderChannel): void {
    this.store.toggleChannel(channel);
  }

  togglePriority(priority: OrderPriority): void {
    this.store.togglePriority(priority);
  }

  setSearchTerm(searchTerm: string): void {
    this.store.setSearchTerm(searchTerm);
  }

  setSort(sort: OrderSort): void {
    this.store.setSort(sort);
  }

  clearFilters(): void {
    this.store.clearFilters();
  }

  selectOrder(orderId: OrderId): void {
    this.store.selectOrder(orderId);
  }

  closeDetails(): void {
    this.store.selectOrder(null);
  }

  transitionStatus(orderId: OrderId, status: OrderStatus): void {
    const order = this.store.getOrder(orderId);
    if (order === undefined || this.inFlightOrders.has(orderId)) {
      return;
    }
    const validation = validateStatusTransition(order, status);
    if (!validation.valid) {
      this.notifications.show(validation.reason, 'warning');
      return;
    }

    const snapshot = this.store.beginOptimisticTransition(orderId, status);
    if (snapshot === null) {
      return;
    }
    this.inFlightOrders.add(orderId);
    if (this.connectivity.state().mode !== 'online') {
      this.offlineQueue.enqueueOrderStatus({
        entityId: orderId,
        payload: {
          orderNumber: order.orderNumber,
          fromStatus: snapshot.status,
          toStatus: status,
          expectedRevision: snapshot.revision,
        },
      });
      this.inFlightOrders.delete(orderId);
      this.notifications.show(
        `${order.orderNumber} updated locally and added to the synchronization queue.`,
        'warning',
      );
      return;
    }
    this.repository
      .updateStatus({
        orderId,
        status,
        expectedRevision: snapshot.revision,
        idempotencyKey: this.idGenerator.next(`status-${orderId}`),
      })
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (confirmation) => {
          this.inFlightOrders.delete(orderId);
          this.store.confirmTransition(orderId, confirmation.status, confirmation.revision);
          this.notifications.show(`${order.orderNumber} moved to ${status}.`, 'success');
        },
        error: (error: AppError) => {
          this.inFlightOrders.delete(orderId);
          this.store.rollbackTransition(snapshot);
          this.notifications.show(error.message, 'error');
        },
      });
  }
}
