import { DestroyRef, Injectable, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  EMPTY,
  Observable,
  Subject,
  catchError,
  concatMap,
  defer,
  exhaustMap,
  finalize,
  from,
  map,
  of,
  switchMap,
  timer,
} from 'rxjs';

import { ConnectivityService } from '../../../core/connectivity/connectivity.service';
import { AppError, isAppError } from '../../../shared/types/app-error';
import {
  OFFLINE_OPERATION_EXECUTOR,
  OfflineOperationExecutor,
} from '../data-access/offline-operation-executor';
import { OFFLINE_QUEUE_RETRY_LIMIT, QueueExecutionResult } from '../domain/queued-operation.model';
import { OfflineQueueStore } from './offline-queue.store';

@Injectable({ providedIn: 'root' })
export class OfflineQueueProcessorService {
  private readonly store = inject(OfflineQueueStore);
  private readonly executor = inject<OfflineOperationExecutor>(OFFLINE_OPERATION_EXECUTOR);
  private readonly connectivity = inject(ConnectivityService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly triggerSubject = new Subject<void>();
  private readonly resultsSubject = new Subject<QueueExecutionResult>();
  private readonly processingSignal = signal(false);

  readonly results$ = this.resultsSubject.asObservable();
  readonly processing = this.processingSignal.asReadonly();

  constructor() {
    this.triggerSubject
      .pipe(
        exhaustMap(() => this.drainQueue()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();

    effect(() => {
      if (this.connectivity.state().isOnline) {
        this.requestSynchronization();
      }
    });
  }

  requestSynchronization(): void {
    if (this.connectivity.state().isOnline) {
      this.triggerSubject.next();
    }
  }

  private drainQueue(): Observable<void> {
    const pending = this.store.pendingInOrder();
    if (pending.length === 0 || !this.connectivity.state().isOnline) {
      return EMPTY;
    }
    this.processingSignal.set(true);
    return from(pending).pipe(
      concatMap((operation) => this.executeWithRetry(operation.id)),
      finalize(() => {
        this.processingSignal.set(false);
        if (this.store.pendingCount() > 0 && this.connectivity.state().isOnline) {
          queueMicrotask(() => this.requestSynchronization());
        }
      }),
    );
  }

  private executeWithRetry(operationId: string): Observable<void> {
    return defer(() => {
      const current = this.store.get(operationId);
      if (current === undefined || current.state !== 'pending') {
        return of(undefined);
      }
      const processing = this.store.markProcessing(operationId);
      if (processing === null) {
        return of(undefined);
      }
      return this.executor.execute(processing).pipe(
        map((confirmation) => {
          const completed = this.store.markCompleted(operationId);
          if (completed !== null) {
            this.resultsSubject.next({
              outcome: 'completed',
              operation: completed,
              confirmedRevision: confirmation.confirmedRevision,
            });
          }
          return undefined;
        }),
        catchError((cause: unknown) => {
          const error = toAppError(cause);
          if (!this.connectivity.state().isOnline) {
            this.store.returnToPending(operationId);
            return of(undefined);
          }
          if (error.retryable && processing.retryCount < OFFLINE_QUEUE_RETRY_LIMIT) {
            const pendingOperation = this.store.recordTransientFailure(operationId, error);
            if (pendingOperation === null) {
              return of(undefined);
            }
            const backoff = 200 * 2 ** Math.max(0, pendingOperation.retryCount - 1);
            return timer(backoff).pipe(switchMap(() => this.executeWithRetry(operationId)));
          }
          const failed = this.store.markFailed(operationId, error);
          if (failed !== null) {
            this.resultsSubject.next({ outcome: 'failed', operation: failed });
          }
          return of(undefined);
        }),
      );
    });
  }
}

function toAppError(cause: unknown): AppError {
  if (isAppError(cause)) {
    return cause;
  }
  return {
    code: 'unexpected',
    message: 'An unexpected synchronization error occurred.',
    retryable: false,
  };
}
