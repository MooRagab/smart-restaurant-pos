import { Injectable } from '@angular/core';
import { Observable, Subject, interval, map, share, startWith } from 'rxjs';

import { LiveEvent } from '../../../core/live-events/live-event-source';
import { createMockOrder } from './order-mock.generator';
import { Order, OrderId, OrderPriority, OrderStatus, PaymentState } from '../domain/order.model';

export type OrderLiveEvent =
  | LiveEvent<'order.created', Readonly<{ order: Order }>>
  | LiveEvent<'order.status-changed', Readonly<{ orderId: OrderId; status: OrderStatus }>>
  | LiveEvent<'order.priority-changed', Readonly<{ orderId: OrderId; priority: OrderPriority }>>
  | LiveEvent<'order.delay-changed', Readonly<{ orderId: OrderId; isDelayed: boolean }>>
  | LiveEvent<'order.payment-changed', Readonly<{ orderId: OrderId; paymentState: PaymentState }>>;

@Injectable()
export class OrderLiveEventService {
  private readonly manualEvents = new Subject<OrderLiveEvent>();
  private readonly timedEvents = interval(8_000).pipe(
    startWith(-1),
    map((tick) => this.createEvent(tick + 1)),
  );

  readonly events$: Observable<OrderLiveEvent> = new Observable<OrderLiveEvent>((subscriber) => {
    const timedSubscription = this.timedEvents.subscribe(subscriber);
    const manualSubscription = this.manualEvents.subscribe(subscriber);
    return () => {
      timedSubscription.unsubscribe();
      manualSubscription.unsubscribe();
    };
  }).pipe(share());

  emit(event: OrderLiveEvent): void {
    this.manualEvents.next(event);
  }

  private createEvent(sequence: number): OrderLiveEvent {
    const timestamp = new Date();
    const base = {
      id: `order-event-${sequence}`,
      occurredAt: timestamp,
    };
    const orderIndex = (sequence * 7) % 56;
    const orderId = `order-${(orderIndex + 1).toString().padStart(4, '0')}`;

    switch (sequence % 5) {
      case 0:
        return {
          ...base,
          type: 'order.created',
          payload: { order: createMockOrder(56 + sequence, timestamp) },
        };
      case 1:
        return { ...base, type: 'order.status-changed', payload: { orderId, status: 'preparing' } };
      case 2:
        return {
          ...base,
          type: 'order.priority-changed',
          payload: { orderId, priority: 'urgent' },
        };
      case 3:
        return { ...base, type: 'order.delay-changed', payload: { orderId, isDelayed: true } };
      default:
        return {
          ...base,
          type: 'order.payment-changed',
          payload: { orderId, paymentState: 'paid' },
        };
    }
  }
}
