import { Order, OrderFilters, OrderPriority, OrderSummary } from './order.model';

const PRIORITY_WEIGHT: Readonly<Record<OrderPriority, number>> = {
  normal: 0,
  high: 1,
  urgent: 2,
};

export function selectVisibleOrders(
  orders: readonly Order[],
  filters: OrderFilters,
): readonly Order[] {
  const query = filters.searchTerm.trim().toLocaleLowerCase('en');
  const filtered = orders.filter((order) => {
    const matchesStatus = filters.status === 'all' || order.status === filters.status;
    const matchesChannel =
      filters.channels.length === 0 || filters.channels.includes(order.channel);
    const matchesPriority =
      filters.priorities.length === 0 || filters.priorities.includes(order.priority);
    const matchesSearch =
      query.length === 0 ||
      order.orderNumber.toLocaleLowerCase('en').includes(query) ||
      (order.customerName?.toLocaleLowerCase('en').includes(query) ?? false);
    return matchesStatus && matchesChannel && matchesPriority && matchesSearch;
  });

  return [...filtered].sort((left, right) => compareOrders(left, right, filters.sort));
}

export function selectOrderSummary(orders: readonly Order[]): OrderSummary {
  return orders.reduce<OrderSummary>(
    (summary, order) => ({
      total: summary.total + 1,
      active:
        summary.active + (order.status !== 'completed' && order.status !== 'cancelled' ? 1 : 0),
      preparing: summary.preparing + (order.status === 'preparing' ? 1 : 0),
      ready: summary.ready + (order.status === 'ready' ? 1 : 0),
      delayed: summary.delayed + (order.isDelayed ? 1 : 0),
    }),
    { total: 0, active: 0, preparing: 0, ready: 0, delayed: 0 },
  );
}

function compareOrders(left: Order, right: Order, sort: OrderFilters['sort']): number {
  switch (sort) {
    case 'oldest':
    case 'longest-waiting':
      return left.createdAt.getTime() - right.createdAt.getTime();
    case 'highest-priority': {
      const priorityDifference = PRIORITY_WEIGHT[right.priority] - PRIORITY_WEIGHT[left.priority];
      return priorityDifference || right.createdAt.getTime() - left.createdAt.getTime();
    }
    case 'newest':
      return right.createdAt.getTime() - left.createdAt.getTime();
  }
}
