import { TestBed } from '@angular/core/testing';
import { NEVER, Observable, Subject, of } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';

import { NotificationService } from '../../../core/notifications/notification.service';
import { ConnectivityService } from '../../../core/connectivity/connectivity.service';
import { AppError } from '../../../shared/types/app-error';
import { createMockOrder } from '../data-access/order-mock.generator';
import { OrderLiveEvent, OrderLiveEventService } from '../data-access/order-live-event.service';
import {
  ORDERS_REPOSITORY,
  OrdersRepository,
  StatusUpdateCommand,
  StatusUpdateConfirmation,
} from '../data-access/orders.repository';
import { Order } from '../domain/order.model';
import { OrdersFacade } from './orders.facade';
import { KitchenOrdersCoordinator } from './kitchen-orders.coordinator';
import { OrdersStore } from './orders.store';
import { OfflineQueueFacade } from '../../offline-queue/state/offline-queue.facade';
import {
  FailedOperation,
  QueuedOperation,
  QueueExecutionResult,
} from '../../offline-queue/domain/queued-operation.model';

class ControlledOrdersRepository implements OrdersRepository {
  readonly response = new Subject<StatusUpdateConfirmation>();
  updateCalls = 0;
  lastCommand: StatusUpdateCommand | null = null;
  order: Order = {
    ...createMockOrder(0, new Date('2026-07-11T12:00:00Z')),
    id: 'order-0001',
    orderNumber: 'SH-2401',
    status: 'received',
    synchronizationState: 'synchronized',
  };

  loadOrders(): Observable<readonly Order[]> {
    return of([this.order]);
  }

  updateStatus(command: StatusUpdateCommand): Observable<StatusUpdateConfirmation> {
    this.updateCalls += 1;
    this.lastCommand = command;
    return this.response.asObservable();
  }
}

class SilentLiveEvents {
  readonly events$: Observable<OrderLiveEvent> = NEVER;
}

class SilentOfflineQueue {
  readonly resultSubject = new Subject<QueueExecutionResult>();
  readonly results$ = this.resultSubject.asObservable();
  readonly queued: QueuedOperation[] = [];
  restoredOperations(): readonly [] {
    return [];
  }

  enqueueOrderStatus(
    input: Parameters<OfflineQueueFacade['enqueueOrderStatus']>[0],
  ): QueuedOperation {
    const operation: QueuedOperation = {
      id: `queued-${this.queued.length + 1}`,
      idempotencyKey: `key-${this.queued.length + 1}`,
      type: 'order.status-change',
      entityId: input.entityId,
      payload: input.payload,
      createdAt: new Date(),
      retryCount: 0,
      state: 'pending',
      lastError: null,
    };
    this.queued.push(operation);
    return operation;
  }
}

describe('OrdersFacade optimistic status workflow', () => {
  let facade: OrdersFacade;
  let repository: ControlledOrdersRepository;
  let notifications: NotificationService;
  let connectivity: ConnectivityService;
  let offlineQueue: SilentOfflineQueue;

  beforeEach(() => {
    offlineQueue = new SilentOfflineQueue();
    TestBed.configureTestingModule({
      providers: [
        OrdersStore,
        OrdersFacade,
        { provide: KitchenOrdersCoordinator, useValue: { applyCurrentLoad: () => undefined } },
        NotificationService,
        ConnectivityService,
        ControlledOrdersRepository,
        { provide: ORDERS_REPOSITORY, useExisting: ControlledOrdersRepository },
        { provide: OrderLiveEventService, useClass: SilentLiveEvents },
        { provide: OfflineQueueFacade, useValue: offlineQueue },
      ],
    });
    facade = TestBed.inject(OrdersFacade);
    repository = TestBed.inject(ControlledOrdersRepository);
    notifications = TestBed.inject(NotificationService);
    connectivity = TestBed.inject(ConnectivityService);
    facade.load();
  });

  it('updates optimistically and confirms success', () => {
    facade.transitionStatus(repository.order.id, 'preparing');
    expect(facade.orders()[0]?.status).toBe('preparing');
    expect(facade.orders()[0]?.synchronizationState).toBe('pending');

    repository.response.next({ orderId: repository.order.id, status: 'preparing', revision: 2 });
    expect(facade.orders()[0]?.status).toBe('preparing');
    expect(facade.orders()[0]?.synchronizationState).toBe('synchronized');
    expect(facade.orders()[0]?.revision).toBe(2);
  });

  it('rolls back the status and notifies when synchronization fails', () => {
    facade.transitionStatus(repository.order.id, 'preparing');
    const error: AppError = {
      code: 'simulation',
      message: 'Status synchronization failed.',
      retryable: true,
    };
    repository.response.error(error);

    expect(facade.orders()[0]?.status).toBe('received');
    expect(facade.orders()[0]?.synchronizationState).toBe('failed');
    expect(notifications.notifications().at(-1)?.message).toBe(error.message);
  });

  it('prevents duplicate submissions while an operation is pending', () => {
    facade.transitionStatus(repository.order.id, 'preparing');
    facade.transitionStatus(repository.order.id, 'preparing');
    expect(repository.updateCalls).toBe(1);
  });

  it('does not call data access for an invalid transition', () => {
    facade.transitionStatus(repository.order.id, 'completed');
    expect(repository.updateCalls).toBe(0);
    expect(notifications.notifications().at(-1)?.tone).toBe('warning');
  });

  it('queues an optimistic action offline and prevents repeated submissions', () => {
    connectivity.setMode('offline');
    facade.transitionStatus(repository.order.id, 'preparing');
    facade.transitionStatus(repository.order.id, 'preparing');
    expect(repository.updateCalls).toBe(0);
    expect(offlineQueue.queued).toHaveLength(1);
    expect(facade.orders()[0]?.status).toBe('preparing');
    expect(facade.orders()[0]?.synchronizationState).toBe('pending');
  });

  it('reconciles optimistic state after a permanent queued failure', () => {
    connectivity.setMode('offline');
    facade.transitionStatus(repository.order.id, 'preparing');
    const pending = offlineQueue.queued[0]!;
    const failed: FailedOperation = {
      ...pending,
      state: 'failed',
      failedAt: new Date(),
      lastError: {
        code: 'invalid-operation',
        message: 'Permanently rejected.',
        retryable: false,
      },
    };
    offlineQueue.resultSubject.next({ outcome: 'failed', operation: failed });
    expect(facade.orders()[0]?.status).toBe('received');
    expect(facade.orders()[0]?.synchronizationState).toBe('failed');
  });
});
