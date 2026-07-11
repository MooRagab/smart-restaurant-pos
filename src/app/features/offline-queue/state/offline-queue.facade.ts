import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subject } from 'rxjs';

import { ConnectivityService } from '../../../core/connectivity/connectivity.service';
import {
  EnqueueOrderStatusOperation,
  QueuedOperation,
  QueueExecutionResult,
} from '../domain/queued-operation.model';
import { OfflineQueueProcessorService } from './offline-queue-processor.service';
import { OfflineQueueStore } from './offline-queue.store';

@Injectable({ providedIn: 'root' })
export class OfflineQueueFacade {
  private readonly store = inject(OfflineQueueStore);
  private readonly processor = inject(OfflineQueueProcessorService);
  private readonly connectivity = inject(ConnectivityService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly reconciliationSubject = new Subject<QueueExecutionResult>();

  readonly operations = this.store.operations;
  readonly pendingCount = this.store.pendingCount;
  readonly failedCount = this.store.failedCount;
  readonly processingCount = this.store.processingCount;
  readonly completedCount = this.store.completedCount;
  readonly progress = this.store.synchronizationProgress;
  readonly persistenceError = this.store.persistenceError;
  readonly processing = this.processor.processing;
  readonly results$: Observable<QueueExecutionResult> = this.reconciliationSubject.asObservable();

  constructor() {
    this.processor.results$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => this.reconciliationSubject.next(result));
  }

  createOrderStatusIdempotencyKey(
    entityId: string,
    fromStatus: string,
    toStatus: string,
    expectedRevision: number,
  ): string {
    return `order-status:${entityId}:${fromStatus}:${toStatus}:${expectedRevision}`;
  }

  enqueueOrderStatus(input: Omit<EnqueueOrderStatusOperation, 'idempotencyKey'>): QueuedOperation {
    const operation = this.store.enqueueOrderStatus({
      ...input,
      idempotencyKey: this.createOrderStatusIdempotencyKey(
        input.entityId,
        input.payload.fromStatus,
        input.payload.toStatus,
        input.payload.expectedRevision,
      ),
    });
    if (this.connectivity.state().isOnline && operation.state === 'pending') {
      this.processor.requestSynchronization();
    }
    return operation;
  }

  requestSynchronization(): void {
    this.processor.requestSynchronization();
  }

  retryFailed(operationId: string): void {
    this.store.retryFailed(operationId);
    this.processor.requestSynchronization();
  }

  removeFailed(operationId: string): void {
    const failed = this.store.removeFailed(operationId);
    if (failed !== null) {
      this.reconciliationSubject.next({ outcome: 'failed', operation: failed });
    }
  }

  clearCompleted(): void {
    this.store.clearCompleted();
  }

  restoredOperations(): readonly QueuedOperation[] {
    return this.store.operations();
  }
}
