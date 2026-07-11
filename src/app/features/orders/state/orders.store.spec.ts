import { describe, expect, it } from 'vitest';

import { createMockOrder } from '../data-access/order-mock.generator';
import { OrdersStore } from './orders.store';

describe('OrdersStore live-event reliability', () => {
  it('applies an event ID at most once', () => {
    const store = new OrdersStore();
    const order = createMockOrder(1, new Date('2026-01-01T10:00:00Z'));
    store.setOrders([order]);
    const event = {
      id: 'payment-event-1',
      type: 'order.payment-changed' as const,
      occurredAt: new Date('2026-01-01T10:01:00Z'),
      payload: { orderId: order.id, paymentState: 'paid' as const },
    };

    store.applyLiveEvent(event);
    store.applyLiveEvent(event);

    expect(store.getOrder(order.id)?.paymentState).toBe('paid');
    expect(store.getOrder(order.id)?.revision).toBe(order.revision + 1);
  });
});
