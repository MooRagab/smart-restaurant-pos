import { calculatePreparationTime } from '../../kitchen/domain/kitchen-calculations';
import { KitchenLoad } from '../../kitchen/domain/kitchen.model';
import { Order, OrderPriority } from './order.model';

export type KitchenOrderImpact = Readonly<{
  isDelayed: boolean;
  priority: OrderPriority;
  estimatedPreparationMinutes: number;
}>;

export function calculateKitchenOrderImpact(
  order: Order,
  kitchen: KitchenLoad,
): KitchenOrderImpact {
  const active = order.status === 'received' || order.status === 'preparing';
  const isDelayed =
    active &&
    (kitchen.status === 'critical' ||
      (kitchen.status === 'busy' &&
        order.status === 'preparing' &&
        kitchen.overallLoadPercentage >= 72));
  const priority = calculateInfluencedPriority(order.priority, kitchen.status, active);
  const baseMinutes = 7 + order.items.reduce((total, item) => total + item.quantity * 2, 0);
  const estimatedPreparationMinutes = calculatePreparationTime(
    baseMinutes,
    kitchen.overallLoadPercentage,
  ).estimatedMinutes;
  return { isDelayed, priority, estimatedPreparationMinutes };
}

function calculateInfluencedPriority(
  priority: OrderPriority,
  status: KitchenLoad['status'],
  active: boolean,
): OrderPriority {
  if (!active) {
    return priority;
  }
  if (status === 'critical') {
    return 'urgent';
  }
  if (status === 'busy' && priority === 'normal') {
    return 'high';
  }
  return priority;
}
