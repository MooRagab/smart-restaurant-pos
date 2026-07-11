export type OperationalOrderStatus =
  'received' | 'preparing' | 'ready' | 'delivered' | 'completed' | 'cancelled';

export type OrderStatusOperationPayload = Readonly<{
  orderNumber: string;
  fromStatus: OperationalOrderStatus;
  toStatus: OperationalOrderStatus;
  expectedRevision: number;
}>;

export function isOperationalOrderStatus(value: unknown): value is OperationalOrderStatus {
  return (
    value === 'received' ||
    value === 'preparing' ||
    value === 'ready' ||
    value === 'delivered' ||
    value === 'completed' ||
    value === 'cancelled'
  );
}
