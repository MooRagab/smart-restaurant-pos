import { Injectable } from '@angular/core';
import { Observable, delay, of, switchMap, throwError } from 'rxjs';

import { AppError } from '../../../shared/types/app-error';
import { generateMockOrders } from './order-mock.generator';
import {
  OrdersRepository,
  StatusUpdateCommand,
  StatusUpdateConfirmation,
} from './orders.repository';

@Injectable()
export class MockOrdersRepository implements OrdersRepository {
  loadOrders(): Observable<ReturnType<typeof generateMockOrders>> {
    return of(generateMockOrders(56, new Date())).pipe(delay(650));
  }

  updateStatus(command: StatusUpdateCommand): Observable<StatusUpdateConfirmation> {
    const numericId = Number(command.orderId.replace(/\D/g, ''));
    if (numericId > 0 && numericId % 13 === 0) {
      const error: AppError = {
        code: 'simulation',
        message: 'The status could not be synchronized. The previous status was restored.',
        retryable: true,
        technicalMessage: `Deterministic status failure for ${command.orderId}`,
      };
      return of(null).pipe(
        delay(700),
        switchMap(() => throwError(() => error)),
      );
    }

    return of({
      orderId: command.orderId,
      status: command.status,
      revision: command.expectedRevision + 1,
    }).pipe(delay(700));
  }
}
