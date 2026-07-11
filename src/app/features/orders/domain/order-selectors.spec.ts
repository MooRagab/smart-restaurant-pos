import { describe, expect, it } from 'vitest';

import { createMockOrder } from '../data-access/order-mock.generator';
import { DEFAULT_ORDER_FILTERS, Order } from './order.model';
import { selectVisibleOrders } from './order-selectors';

const now = new Date('2026-07-11T12:00:00Z');
const ORDERS: readonly Order[] = [
  {
    ...createMockOrder(0, now),
    id: 'alpha',
    orderNumber: 'SH-1001',
    customerName: 'Ahmed Hassan',
    channel: 'delivery',
    priority: 'normal',
    status: 'received',
    createdAt: new Date('2026-07-11T11:30:00Z'),
  },
  {
    ...createMockOrder(1, now),
    id: 'bravo',
    orderNumber: 'SH-1002',
    customerName: 'Mariam Mohamed',
    channel: 'online',
    priority: 'urgent',
    status: 'preparing',
    createdAt: new Date('2026-07-11T11:50:00Z'),
  },
  {
    ...createMockOrder(2, now),
    id: 'charlie',
    orderNumber: 'SH-1003',
    channel: 'walk-in',
    priority: 'high',
    status: 'ready',
    createdAt: new Date('2026-07-11T11:40:00Z'),
  },
];

describe('order selectors', () => {
  it('filters by status, channels, and priorities together', () => {
    const result = selectVisibleOrders(ORDERS, {
      ...DEFAULT_ORDER_FILTERS,
      status: 'preparing',
      channels: ['online'],
      priorities: ['urgent'],
    });
    expect(result.map((order) => order.id)).toEqual(['bravo']);
  });

  it.each([
    ['sh-1002', 'bravo'],
    ['AHMED', 'alpha'],
  ])('searches case-insensitively for %s', (searchTerm, expectedId) => {
    const result = selectVisibleOrders(ORDERS, { ...DEFAULT_ORDER_FILTERS, searchTerm });
    expect(result.map((order) => order.id)).toEqual([expectedId]);
  });

  it('sorts newest and oldest', () => {
    expect(
      selectVisibleOrders(ORDERS, { ...DEFAULT_ORDER_FILTERS, sort: 'newest' }).map(
        (order) => order.id,
      ),
    ).toEqual(['bravo', 'charlie', 'alpha']);
    expect(
      selectVisibleOrders(ORDERS, { ...DEFAULT_ORDER_FILTERS, sort: 'oldest' }).map(
        (order) => order.id,
      ),
    ).toEqual(['alpha', 'charlie', 'bravo']);
  });

  it('sorts by highest priority with newest as the tie breaker', () => {
    expect(
      selectVisibleOrders(ORDERS, {
        ...DEFAULT_ORDER_FILTERS,
        sort: 'highest-priority',
      }).map((order) => order.id),
    ).toEqual(['bravo', 'charlie', 'alpha']);
  });

  it('does not mutate the source collection while sorting', () => {
    const sourceIds = ORDERS.map((order) => order.id);
    selectVisibleOrders(ORDERS, { ...DEFAULT_ORDER_FILTERS, sort: 'oldest' });
    expect(ORDERS.map((order) => order.id)).toEqual(sourceIds);
  });
});
