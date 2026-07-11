import { describe, expect, it } from 'vitest';

import { createMockOrder } from '../data-access/order-mock.generator';
import { Order } from './order.model';
import { getAvailableTransitions, validateStatusTransition } from './order-transition.policy';

function orderWith(changes: Partial<Order>): Order {
  return { ...createMockOrder(0, new Date('2026-07-11T12:00:00Z')), ...changes };
}

describe('order transition policy', () => {
  it.each([
    ['received', 'preparing'],
    ['preparing', 'ready'],
    ['ready', 'delivered'],
    ['delivered', 'completed'],
  ] as const)('allows %s to move to %s', (from, to) => {
    expect(validateStatusTransition(orderWith({ status: from }), to)).toEqual({
      valid: true,
      from,
      to,
    });
  });

  it('allows a walk-in order to complete directly from ready', () => {
    const order = orderWith({ status: 'ready', channel: 'walk-in' });
    expect(getAvailableTransitions(order)).toContain('completed');
    expect(validateStatusTransition(order, 'completed').valid).toBe(true);
  });

  it('rejects ready to completed for delivery orders', () => {
    const result = validateStatusTransition(
      orderWith({ status: 'ready', channel: 'delivery' }),
      'completed',
    );
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toContain('cannot move');
    }
  });

  it('rejects transitions from terminal statuses', () => {
    expect(validateStatusTransition(orderWith({ status: 'completed' }), 'preparing').valid).toBe(
      false,
    );
    expect(validateStatusTransition(orderWith({ status: 'cancelled' }), 'received').valid).toBe(
      false,
    );
  });
});
