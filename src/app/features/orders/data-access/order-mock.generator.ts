import {
  Order,
  OrderChannel,
  OrderItem,
  OrderPriority,
  OrderStatus,
  PaymentState,
} from '../domain/order.model';

const CUSTOMERS = [
  'Ahmed Hassan',
  'Mariam Mohamed',
  'Omar Mahmoud',
  'Nourhan Ali',
  'Youssef Mostafa',
  'Salma Ibrahim',
  'Karim Adel',
  'Aya Tarek',
] as const;

const PRODUCTS = [
  { name: 'Egyptian Koshari Bowl', price: 2600 },
  { name: 'Alexandrian Liver Sandwich', price: 2200 },
  { name: 'Baladi Hawawshi', price: 2800 },
  { name: 'Chicken Molokhia with Rice', price: 3600 },
  { name: 'Cairo Fattah', price: 3800 },
  { name: 'Taameya and Baladi Bread', price: 1800 },
  { name: 'Roz Bel Laban', price: 1600 },
  { name: 'Karkadeh', price: 1200 },
] as const;

const STATUSES: readonly OrderStatus[] = [
  'received',
  'preparing',
  'ready',
  'delivered',
  'completed',
  'cancelled',
];
const CHANNELS: readonly OrderChannel[] = ['walk-in', 'delivery', 'online'];
const PRIORITIES: readonly OrderPriority[] = ['normal', 'normal', 'normal', 'high', 'urgent'];
const PAYMENTS: readonly PaymentState[] = ['paid', 'authorized', 'pending', 'paid', 'paid'];

export function generateMockOrders(
  count = 56,
  now = new Date('2026-07-11T12:00:00Z'),
): readonly Order[] {
  return Array.from({ length: count }, (_, index) => createMockOrder(index, now));
}

export function createMockOrder(index: number, now = new Date()): Order {
  const channel = CHANNELS[index % CHANNELS.length]!;
  const status = STATUSES[(index * 5 + 1) % STATUSES.length]!;
  const itemCount = 1 + (index % 3);
  const items = Array.from({ length: itemCount }, (_, itemIndex) => createItem(index, itemIndex));
  const customerName = channel === 'walk-in' ? undefined : CUSTOMERS[index % CUSTOMERS.length];

  return {
    id: `order-${(index + 1).toString().padStart(4, '0')}`,
    orderNumber: `SH-${(2401 + index).toString()}`,
    channel,
    ...(customerName === undefined ? {} : { customerName }),
    items,
    totalMinor: items.reduce((total, item) => total + item.unitPriceMinor * item.quantity, 0),
    createdAt: new Date(now.getTime() - (index * 4 + (index % 7)) * 60_000),
    status,
    priority: PRIORITIES[(index * 3) % PRIORITIES.length]!,
    paymentState: PAYMENTS[(index * 7) % PAYMENTS.length]!,
    isDelayed: index % 9 === 0,
    estimatedPreparationMinutes: 12 + (index % 6) * 3,
    synchronizationState: 'synchronized',
    aiRecommendationState: index % 4 === 0 ? 'available' : 'idle',
    revision: 1,
  };
}

function createItem(orderIndex: number, itemIndex: number): OrderItem {
  const productIndex = (orderIndex * 3 + itemIndex * 5) % PRODUCTS.length;
  const product = PRODUCTS[productIndex]!;
  return {
    id: `item-${orderIndex + 1}-${itemIndex + 1}`,
    productId: `product-${productIndex + 1}`,
    name: product.name,
    quantity: 1 + ((orderIndex + itemIndex) % 2),
    unitPriceMinor: product.price,
    ...((orderIndex + itemIndex) % 11 === 0 ? { notes: 'No onions' } : {}),
  };
}
