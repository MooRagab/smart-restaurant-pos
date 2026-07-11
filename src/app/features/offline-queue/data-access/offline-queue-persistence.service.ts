import { Injectable, inject } from '@angular/core';

import { PERSISTENCE, Persistence } from '../../../core/persistence/persistence';
import {
  OperationalOrderStatus,
  isOperationalOrderStatus,
} from '../../../core/operations/order-status-operation';
import { AppError, isAppError } from '../../../shared/types/app-error';
import {
  OFFLINE_QUEUE_SCHEMA_VERSION,
  QueuedOperation,
  QueueOperationState,
} from '../domain/queued-operation.model';

const STORAGE_KEY = 'sahm-food.offline-queue.v1';

type StoredOperation = Readonly<{
  id: string;
  idempotencyKey: string;
  type: 'order.status-change';
  entityId: string;
  payload: Readonly<{
    orderNumber: string;
    fromStatus: OperationalOrderStatus;
    toStatus: OperationalOrderStatus;
    expectedRevision: number;
  }>;
  createdAt: string;
  retryCount: number;
  state: QueueOperationState;
  lastError: AppError | null;
  processingStartedAt?: string;
  completedAt?: string;
  failedAt?: string;
}>;

type StoredQueueEnvelope = Readonly<{
  version: number;
  operations: readonly StoredOperation[];
}>;

export type QueueRestoration = Readonly<{
  operations: readonly QueuedOperation[];
  error: AppError | null;
}>;

@Injectable({ providedIn: 'root' })
export class OfflineQueuePersistenceService {
  private readonly persistence = inject<Persistence>(PERSISTENCE);

  restore(): QueueRestoration {
    try {
      const value = this.persistence.read(STORAGE_KEY);
      if (value === null) {
        return { operations: [], error: null };
      }
      if (!isStoredEnvelope(value)) {
        this.persistence.remove(STORAGE_KEY);
        return {
          operations: [],
          error: persistenceError('Saved offline operations were invalid and were safely ignored.'),
        };
      }
      return {
        operations: value.operations.map(fromStoredOperation).filter(isDefined),
        error: null,
      };
    } catch {
      return {
        operations: [],
        error: persistenceError('Offline operations could not be restored from this browser.'),
      };
    }
  }

  save(operations: readonly QueuedOperation[]): AppError | null {
    try {
      const envelope: StoredQueueEnvelope = {
        version: OFFLINE_QUEUE_SCHEMA_VERSION,
        operations: operations.map(toStoredOperation),
      };
      this.persistence.write(STORAGE_KEY, envelope);
      return null;
    } catch {
      return persistenceError(
        'Offline operations could not be saved. Keep this page open and retry.',
      );
    }
  }
}

function isStoredEnvelope(value: unknown): value is StoredQueueEnvelope {
  if (!isRecord(value) || value['version'] !== OFFLINE_QUEUE_SCHEMA_VERSION) {
    return false;
  }
  return Array.isArray(value['operations']) && value['operations'].every(isStoredOperation);
}

function isStoredOperation(value: unknown): value is StoredOperation {
  if (!isRecord(value) || !isRecord(value['payload'])) {
    return false;
  }
  const state = value['state'];
  const lastError = value['lastError'];
  return (
    typeof value['id'] === 'string' &&
    typeof value['idempotencyKey'] === 'string' &&
    value['type'] === 'order.status-change' &&
    typeof value['entityId'] === 'string' &&
    isDateString(value['createdAt']) &&
    isNonNegativeInteger(value['retryCount']) &&
    (state === 'pending' ||
      state === 'processing' ||
      state === 'completed' ||
      state === 'failed') &&
    typeof value['payload']['orderNumber'] === 'string' &&
    isOperationalOrderStatus(value['payload']['fromStatus']) &&
    isOperationalOrderStatus(value['payload']['toStatus']) &&
    isNonNegativeInteger(value['payload']['expectedRevision']) &&
    (lastError === null || isStoredError(lastError)) &&
    (state !== 'completed' || isDateString(value['completedAt'])) &&
    (state !== 'failed' || isDateString(value['failedAt']))
  );
}

function fromStoredOperation(stored: StoredOperation): QueuedOperation | null {
  const base = {
    id: stored.id,
    idempotencyKey: stored.idempotencyKey,
    type: stored.type,
    entityId: stored.entityId,
    payload: {
      orderNumber: stored.payload.orderNumber,
      fromStatus: stored.payload.fromStatus,
      toStatus: stored.payload.toStatus,
      expectedRevision: stored.payload.expectedRevision,
    },
    createdAt: new Date(stored.createdAt),
    retryCount: stored.retryCount,
    lastError: stored.lastError,
  };
  if (Number.isNaN(base.createdAt.getTime())) {
    return null;
  }
  switch (stored.state) {
    case 'pending':
    case 'processing':
      return { ...base, state: 'pending' };
    case 'completed': {
      const completedAt = new Date(stored.completedAt ?? stored.createdAt);
      return { ...base, state: 'completed', completedAt };
    }
    case 'failed': {
      const failedAt = new Date(stored.failedAt ?? stored.createdAt);
      return { ...base, state: 'failed', failedAt };
    }
  }
}

function toStoredOperation(operation: QueuedOperation): StoredOperation {
  return {
    id: operation.id,
    idempotencyKey: operation.idempotencyKey,
    type: operation.type,
    entityId: operation.entityId,
    payload: operation.payload,
    createdAt: operation.createdAt.toISOString(),
    retryCount: operation.retryCount,
    state: operation.state,
    lastError: operation.lastError,
    ...(operation.state === 'processing'
      ? { processingStartedAt: operation.processingStartedAt.toISOString() }
      : {}),
    ...(operation.state === 'completed'
      ? { completedAt: operation.completedAt.toISOString() }
      : {}),
    ...(operation.state === 'failed' ? { failedAt: operation.failedAt.toISOString() } : {}),
  };
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isStoredError(value: unknown): value is AppError {
  return isAppError(value);
}

function isDateString(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(new Date(value).getTime());
}

function isDefined<T>(value: T | null): value is T {
  return value !== null;
}

function persistenceError(message: string): AppError {
  return { code: 'persistence', message, retryable: true };
}
