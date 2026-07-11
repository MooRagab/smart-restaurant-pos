import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

import { Order, OrderId, OrderStatus } from '../domain/order.model';

export type StatusUpdateCommand = Readonly<{
  orderId: OrderId;
  status: OrderStatus;
  expectedRevision: number;
  idempotencyKey: string;
}>;

export type StatusUpdateConfirmation = Readonly<{
  orderId: OrderId;
  status: OrderStatus;
  revision: number;
}>;

export type OrdersRepository = {
  loadOrders(): Observable<readonly Order[]>;
  updateStatus(command: StatusUpdateCommand): Observable<StatusUpdateConfirmation>;
};

export const ORDERS_REPOSITORY = new InjectionToken<OrdersRepository>('ORDERS_REPOSITORY');
