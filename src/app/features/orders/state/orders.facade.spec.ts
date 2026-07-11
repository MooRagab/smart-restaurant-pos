import { TestBed } from '@angular/core/testing';
import { NEVER, Observable, Subject, of } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';

import { NotificationService } from '../../../core/notifications/notification.service';
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
import { OrdersStore } from './orders.store';

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

describe('OrdersFacade optimistic status workflow', () => {
  let facade: OrdersFacade;
  let repository: ControlledOrdersRepository;
  let notifications: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        OrdersStore,
        OrdersFacade,
        NotificationService,
        ControlledOrdersRepository,
        { provide: ORDERS_REPOSITORY, useExisting: ControlledOrdersRepository },
        { provide: OrderLiveEventService, useClass: SilentLiveEvents },
      ],
    });
    facade = TestBed.inject(OrdersFacade);
    repository = TestBed.inject(ControlledOrdersRepository);
    notifications = TestBed.inject(NotificationService);
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
});
