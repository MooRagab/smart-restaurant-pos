import { AppError } from '../../../shared/types/app-error';
import { OrderStatusOperationPayload } from '../../../core/operations/order-status-operation';

export type QueueOperationState = 'pending' | 'processing' | 'completed' | 'failed';

type OperationBase = Readonly<{
  id: string;
  idempotencyKey: string;
  type: 'order.status-change';
  entityId: string;
  payload: OrderStatusOperationPayload;
  createdAt: Date;
  retryCount: number;
  lastError: AppError | null;
}>;

export type PendingOperation = OperationBase & Readonly<{ state: 'pending' }>;
export type ProcessingOperation = OperationBase &
  Readonly<{ state: 'processing'; processingStartedAt: Date }>;
export type CompletedOperation = OperationBase &
  Readonly<{ state: 'completed'; completedAt: Date }>;
export type FailedOperation = OperationBase & Readonly<{ state: 'failed'; failedAt: Date }>;

export type QueuedOperation =
  PendingOperation | ProcessingOperation | CompletedOperation | FailedOperation;

export type EnqueueOrderStatusOperation = Readonly<{
  idempotencyKey: string;
  entityId: string;
  payload: OrderStatusOperationPayload;
}>;

export type QueueExecutionResult =
  | Readonly<{
      outcome: 'completed';
      operation: CompletedOperation;
      confirmedRevision: number;
    }>
  | Readonly<{
      outcome: 'failed';
      operation: FailedOperation;
    }>;

export const OFFLINE_QUEUE_SCHEMA_VERSION = 1;
export const OFFLINE_QUEUE_RETRY_LIMIT = 3;
