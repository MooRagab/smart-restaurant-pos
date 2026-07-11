import { Injectable, computed, inject, signal } from '@angular/core';

import { AppError } from '../../../shared/types/app-error';
import { IdGenerator } from '../../../shared/utilities/id-generator';
import { OfflineQueuePersistenceService } from '../data-access/offline-queue-persistence.service';
import {
  CompletedOperation,
  EnqueueOrderStatusOperation,
  FailedOperation,
  PendingOperation,
  ProcessingOperation,
  QueuedOperation,
} from '../domain/queued-operation.model';

@Injectable({ providedIn: 'root' })
export class OfflineQueueStore {
  private readonly persistence = inject(OfflineQueuePersistenceService);
  private readonly idGenerator = new IdGenerator();
  private readonly restoration = this.persistence.restore();
  private readonly operationsSignal = signal<readonly QueuedOperation[]>(
    [...this.restoration.operations].sort(
      (left, right) => left.createdAt.getTime() - right.createdAt.getTime(),
    ),
  );
  private readonly persistenceErrorSignal = signal<AppError | null>(this.restoration.error);

  readonly operations = this.operationsSignal.asReadonly();
  readonly persistenceError = this.persistenceErrorSignal.asReadonly();
  readonly pendingCount = computed(
    () =>
      this.operationsSignal().filter(
        (item) => item.state === 'pending' || item.state === 'processing',
      ).length,
  );
  readonly failedCount = computed(
    () => this.operationsSignal().filter((item) => item.state === 'failed').length,
  );
  readonly processingCount = computed(
    () => this.operationsSignal().filter((item) => item.state === 'processing').length,
  );
  readonly completedCount = computed(
    () => this.operationsSignal().filter((item) => item.state === 'completed').length,
  );
  readonly synchronizationProgress = computed(() => {
    const operations = this.operationsSignal();
    const active = operations.filter((item) => item.state !== 'completed').length;
    if (active === 0) {
      return 100;
    }
    const completed = operations.filter((item) => item.state === 'completed').length;
    return Math.round((completed / operations.length) * 100);
  });

  enqueueOrderStatus(input: EnqueueOrderStatusOperation): QueuedOperation {
    const duplicate = this.operationsSignal().find(
      (operation) => operation.idempotencyKey === input.idempotencyKey,
    );
    if (duplicate !== undefined) {
      return duplicate;
    }
    const operation: PendingOperation = {
      id: this.idGenerator.next('offline-operation'),
      idempotencyKey: input.idempotencyKey,
      type: 'order.status-change',
      entityId: input.entityId,
      payload: input.payload,
      createdAt: new Date(),
      retryCount: 0,
      state: 'pending',
      lastError: null,
    };
    this.operationsSignal.update((operations) => [...operations, operation]);
    this.persist();
    return operation;
  }

  get(operationId: string): QueuedOperation | undefined {
    return this.operationsSignal().find((operation) => operation.id === operationId);
  }

  pendingInOrder(): readonly PendingOperation[] {
    return this.operationsSignal()
      .filter((operation): operation is PendingOperation => operation.state === 'pending')
      .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime());
  }

  markProcessing(operationId: string): ProcessingOperation | null {
    if (this.get(operationId)?.state !== 'pending') {
      return null;
    }
    const updated = this.replace(operationId, (operation) => ({
      ...baseOperation(operation),
      state: 'processing',
      processingStartedAt: new Date(),
    }));
    return updated?.state === 'processing' ? updated : null;
  }

  recordTransientFailure(operationId: string, error: AppError): PendingOperation | null {
    if (this.get(operationId)?.state !== 'processing') {
      return null;
    }
    const updated = this.replace(operationId, (operation) => ({
      ...baseOperation(operation),
      retryCount: operation.retryCount + 1,
      state: 'pending',
      lastError: error,
    }));
    return updated?.state === 'pending' ? updated : null;
  }

  returnToPending(operationId: string): PendingOperation | null {
    if (this.get(operationId)?.state !== 'processing') {
      return null;
    }
    const updated = this.replace(operationId, (operation) => ({
      ...baseOperation(operation),
      state: 'pending',
    }));
    return updated?.state === 'pending' ? updated : null;
  }

  markCompleted(operationId: string): CompletedOperation | null {
    if (this.get(operationId)?.state !== 'processing') {
      return null;
    }
    const updated = this.replace(operationId, (operation) => ({
      ...baseOperation(operation),
      state: 'completed',
      lastError: null,
      completedAt: new Date(),
    }));
    return updated?.state === 'completed' ? updated : null;
  }

  markFailed(operationId: string, error: AppError): FailedOperation | null {
    if (this.get(operationId)?.state !== 'processing') {
      return null;
    }
    const updated = this.replace(operationId, (operation) => ({
      ...baseOperation(operation),
      state: 'failed',
      lastError: error,
      failedAt: new Date(),
    }));
    return updated?.state === 'failed' ? updated : null;
  }

  retryFailed(operationId: string): void {
    if (this.get(operationId)?.state !== 'failed') {
      return;
    }
    this.replace(operationId, (operation) => ({
      ...baseOperation(operation),
      retryCount: 0,
      state: 'pending',
      lastError: null,
    }));
  }

  removeFailed(operationId: string): FailedOperation | null {
    const operation = this.get(operationId);
    if (operation?.state !== 'failed') {
      return null;
    }
    this.operationsSignal.update((operations) =>
      operations.filter((item) => item.id !== operationId),
    );
    this.persist();
    return operation;
  }

  clearCompleted(): void {
    this.operationsSignal.update((operations) =>
      operations.filter((operation) => operation.state !== 'completed'),
    );
    this.persist();
  }

  private replace(
    operationId: string,
    updater: (operation: QueuedOperation) => QueuedOperation,
  ): QueuedOperation | null {
    let updated: QueuedOperation | null = null;
    this.operationsSignal.update((operations) =>
      operations.map((operation) => {
        if (operation.id !== operationId) {
          return operation;
        }
        updated = updater(operation);
        return updated;
      }),
    );
    if (updated !== null) {
      this.persist();
    }
    return updated;
  }

  private persist(): void {
    this.persistenceErrorSignal.set(this.persistence.save(this.operationsSignal()));
  }
}

function baseOperation(operation: QueuedOperation) {
  return {
    id: operation.id,
    idempotencyKey: operation.idempotencyKey,
    type: operation.type,
    entityId: operation.entityId,
    payload: operation.payload,
    createdAt: operation.createdAt,
    retryCount: operation.retryCount,
    lastError: operation.lastError,
  } as const;
}
