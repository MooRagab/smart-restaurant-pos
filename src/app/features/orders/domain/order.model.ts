import { OperationalOrderStatus } from '../../../core/operations/order-status-operation';

export type OrderId = string;
export type OrderStatus = OperationalOrderStatus;
export type OrderChannel = 'walk-in' | 'delivery' | 'online';
export type OrderPriority = 'normal' | 'high' | 'urgent';
export type PaymentState = 'pending' | 'authorized' | 'paid' | 'failed' | 'refunded';
export type SynchronizationState = 'synchronized' | 'pending' | 'failed';
export type AiRecommendationState = 'idle' | 'available' | 'outdated';
export type OrderSort = 'newest' | 'oldest' | 'highest-priority' | 'longest-waiting';

export type OrderItem = Readonly<{
  id: string;
  productId: string;
  name: string;
  quantity: number;
  unitPriceMinor: number;
  notes?: string;
}>;

export type Order = Readonly<{
  id: OrderId;
  orderNumber: string;
  channel: OrderChannel;
  customerName?: string;
  items: readonly OrderItem[];
  totalMinor: number;
  createdAt: Date;
  status: OrderStatus;
  priority: OrderPriority;
  paymentState: PaymentState;
  isDelayed: boolean;
  estimatedPreparationMinutes: number;
  synchronizationState: SynchronizationState;
  aiRecommendationState: AiRecommendationState;
  revision: number;
}>;

export type OrderFilters = Readonly<{
  status: OrderStatus | 'all';
  channels: readonly OrderChannel[];
  priorities: readonly OrderPriority[];
  searchTerm: string;
  sort: OrderSort;
}>;

export type StatusTransitionResult =
  | Readonly<{ valid: true; from: OrderStatus; to: OrderStatus }>
  | Readonly<{ valid: false; from: OrderStatus; to: OrderStatus; reason: string }>;

export type OrderSummary = Readonly<{
  total: number;
  active: number;
  preparing: number;
  ready: number;
  delayed: number;
}>;

export const DEFAULT_ORDER_FILTERS: OrderFilters = {
  status: 'all',
  channels: [],
  priorities: [],
  searchTerm: '',
  sort: 'newest',
};

export const ORDER_STATUSES: readonly OrderStatus[] = [
  'received',
  'preparing',
  'ready',
  'delivered',
  'completed',
  'cancelled',
];

export const ORDER_CHANNELS: readonly OrderChannel[] = ['walk-in', 'delivery', 'online'];
export const ORDER_PRIORITIES: readonly OrderPriority[] = ['normal', 'high', 'urgent'];
