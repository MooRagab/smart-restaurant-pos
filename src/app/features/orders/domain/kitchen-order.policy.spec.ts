import { describe, expect, it } from 'vitest';

import { createInitialKitchenLoad } from '../../kitchen/data-access/kitchen-mock.generator';
import { KitchenLoad } from '../../kitchen/domain/kitchen.model';
import { createMockOrder } from '../data-access/order-mock.generator';
import { Order } from './order.model';
import { calculateKitchenOrderImpact } from './kitchen-order.policy';

function kitchenAt(load: number, status: KitchenLoad['status']): KitchenLoad {
  return { ...createInitialKitchenLoad(), overallLoadPercentage: load, status };
}

function activeOrder(changes: Partial<Order> = {}): Order {
  return {
    ...createMockOrder(1),
    status: 'preparing',
    priority: 'normal',
    isDelayed: false,
    ...changes,
  };
}

describe('kitchen influence on orders', () => {
  it('marks active orders delayed under critical load', () => {
    expect(calculateKitchenOrderImpact(activeOrder(), kitchenAt(92, 'critical')).isDelayed).toBe(
      true,
    );
  });

  it('does not delay a completed order', () => {
    const impact = calculateKitchenOrderImpact(
      activeOrder({ status: 'completed' }),
      kitchenAt(95, 'critical'),
    );
    expect(impact.isDelayed).toBe(false);
  });

  it('raises normal priority to high when busy and urgent when critical', () => {
    expect(calculateKitchenOrderImpact(activeOrder(), kitchenAt(72, 'busy')).priority).toBe('high');
    expect(calculateKitchenOrderImpact(activeOrder(), kitchenAt(92, 'critical')).priority).toBe(
      'urgent',
    );
  });

  it('increases the preparation estimate as load increases', () => {
    const order = activeOrder();
    const normal = calculateKitchenOrderImpact(order, kitchenAt(40, 'normal'));
    const critical = calculateKitchenOrderImpact(order, kitchenAt(92, 'critical'));
    expect(critical.estimatedPreparationMinutes).toBeGreaterThan(
      normal.estimatedPreparationMinutes,
    );
  });
});
