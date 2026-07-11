import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

import { QueuedOperation } from '../domain/queued-operation.model';

export type OperationExecutionConfirmation = Readonly<{
  operationId: string;
  confirmedRevision: number;
}>;

export type OfflineOperationExecutor = {
  execute(operation: QueuedOperation): Observable<OperationExecutionConfirmation>;
};

export const OFFLINE_OPERATION_EXECUTOR = new InjectionToken<OfflineOperationExecutor>(
  'OFFLINE_OPERATION_EXECUTOR',
);
