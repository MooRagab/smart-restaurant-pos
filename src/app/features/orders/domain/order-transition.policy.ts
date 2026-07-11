import { Order, OrderStatus, StatusTransitionResult } from './order.model';

const TRANSITIONS: Readonly<Record<OrderStatus, readonly OrderStatus[]>> = {
  received: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['delivered', 'cancelled'],
  delivered: ['completed'],
  completed: [],
  cancelled: [],
};

export function getAvailableTransitions(order: Order): readonly OrderStatus[] {
  const transitions = TRANSITIONS[order.status];
  return order.status === 'ready' && order.channel === 'walk-in'
    ? [...transitions, 'completed']
    : transitions;
}

export function validateStatusTransition(order: Order, to: OrderStatus): StatusTransitionResult {
  if (getAvailableTransitions(order).includes(to)) {
    return { valid: true, from: order.status, to };
  }

  return {
    valid: false,
    from: order.status,
    to,
    reason: `${formatStatus(order.status)} orders cannot move to ${formatStatus(to)}.`,
  };
}

export function formatStatus(status: OrderStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}
