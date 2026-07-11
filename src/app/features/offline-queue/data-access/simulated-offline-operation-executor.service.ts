import { Injectable, inject } from '@angular/core';
import { Observable, delay, of, switchMap, throwError } from 'rxjs';

import { ConnectivityService } from '../../../core/connectivity/connectivity.service';
import { AppError } from '../../../shared/types/app-error';
import { QueuedOperation } from '../domain/queued-operation.model';
import {
  OfflineOperationExecutor,
  OperationExecutionConfirmation,
} from './offline-operation-executor';

@Injectable({ providedIn: 'root' })
export class SimulatedOfflineOperationExecutorService implements OfflineOperationExecutor {
  private readonly connectivity = inject(ConnectivityService);

  execute(operation: QueuedOperation): Observable<OperationExecutionConfirmation> {
    const mode = this.connectivity.state().mode;
    const numericId = Number(operation.entityId.replace(/\D/g, ''));
    if (mode === 'offline') {
      return delayedError({
        code: 'connectivity',
        message: 'Synchronization paused while the workspace is offline.',
        retryable: true,
      });
    }
    if (numericId > 0 && numericId % 23 === 0) {
      return delayedError({
        code: 'invalid-operation',
        message: 'The server permanently rejected this status transition.',
        retryable: false,
      });
    }
    if (mode === 'unstable' && operation.retryCount < 2) {
      return delayedError({
        code: 'connectivity',
        message: 'The unstable connection interrupted synchronization.',
        retryable: true,
      });
    }
    return of({
      operationId: operation.id,
      confirmedRevision: operation.payload.expectedRevision + 1,
    }).pipe(delay(mode === 'unstable' ? 900 : 500));
  }
}

function delayedError(error: AppError): Observable<never> {
  return of(null).pipe(
    delay(450),
    switchMap(() => throwError(() => error)),
  );
}
