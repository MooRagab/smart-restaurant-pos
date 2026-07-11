import { TestBed } from '@angular/core/testing';
import { Observable, Subject, defer, of, throwError } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ConnectivityService } from '../../../core/connectivity/connectivity.service';
import { PERSISTENCE, Persistence } from '../../../core/persistence/persistence';
import { AppError } from '../../../shared/types/app-error';
import {
  OFFLINE_OPERATION_EXECUTOR,
  OfflineOperationExecutor,
  OperationExecutionConfirmation,
} from '../data-access/offline-operation-executor';
import { OfflineQueuePersistenceService } from '../data-access/offline-queue-persistence.service';
import { QueuedOperation } from '../domain/queued-operation.model';
import { OfflineQueueProcessorService } from './offline-queue-processor.service';
import { OfflineQueueFacade } from './offline-queue.facade';
import { OfflineQueueStore } from './offline-queue.store';

type Outcome = 'success' | 'transient' | 'permanent';

class ProcessorMemoryPersistence implements Persistence {
  private readonly values = new Map<string, unknown>();
  read(key: string): unknown | null {
    return this.values.get(key) ?? null;
  }
  write(key: string, value: unknown): void {
    this.values.set(key, value);
  }
  remove(key: string): void {
    this.values.delete(key);
  }
}

class SequenceExecutor implements OfflineOperationExecutor {
  outcomes: Outcome[] = [];
  readonly calls: string[] = [];

  execute(operation: QueuedOperation): Observable<OperationExecutionConfirmation> {
    return defer(() => {
      this.calls.push(operation.id);
      const outcome = this.outcomes.shift() ?? 'success';
      if (outcome === 'success') {
        return of({
          operationId: operation.id,
          confirmedRevision: operation.payload.expectedRevision + 1,
        });
      }
      const error: AppError = {
        code: outcome === 'transient' ? 'connectivity' : 'invalid-operation',
        message: `${outcome} failure`,
        retryable: outcome === 'transient',
      };
      return throwError(() => error);
    });
  }
}

class BlockingExecutor implements OfflineOperationExecutor {
  readonly response = new Subject<OperationExecutionConfirmation>();
  calls = 0;
  execute(): Observable<OperationExecutionConfirmation> {
    this.calls += 1;
    return this.response.asObservable();
  }
}

type ProcessorSetup = Readonly<{
  connectivity: ConnectivityService;
  store: OfflineQueueStore;
  processor: OfflineQueueProcessorService;
  executor: SequenceExecutor;
}>;

function setupProcessor(mode: 'online' | 'offline' = 'offline'): ProcessorSetup {
  TestBed.configureTestingModule({
    providers: [
      ConnectivityService,
      OfflineQueuePersistenceService,
      OfflineQueueStore,
      OfflineQueueProcessorService,
      SequenceExecutor,
      ProcessorMemoryPersistence,
      { provide: PERSISTENCE, useExisting: ProcessorMemoryPersistence },
      { provide: OFFLINE_OPERATION_EXECUTOR, useExisting: SequenceExecutor },
    ],
  });
  const connectivity = TestBed.inject(ConnectivityService);
  connectivity.setMode(mode);
  return {
    connectivity,
    store: TestBed.inject(OfflineQueueStore),
    processor: TestBed.inject(OfflineQueueProcessorService),
    executor: TestBed.inject(SequenceExecutor),
  };
}

function enqueue(store: OfflineQueueStore, suffix: number): QueuedOperation {
  return store.enqueueOrderStatus({
    idempotencyKey: `operation-${suffix}`,
    entityId: `order-${suffix}`,
    payload: {
      orderNumber: `SH-${suffix}`,
      fromStatus: 'received',
      toStatus: 'preparing',
      expectedRevision: 1,
    },
  });
}

describe('OfflineQueueProcessorService', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
  });

  it('processes pending operations strictly in creation order', () => {
    const setup = setupProcessor();
    const operations = [enqueue(setup.store, 1), enqueue(setup.store, 2), enqueue(setup.store, 3)];
    setup.connectivity.setMode('online');
    setup.processor.requestSynchronization();
    expect(setup.executor.calls).toEqual(operations.map((operation) => operation.id));
    expect(setup.store.operations().every((operation) => operation.state === 'completed')).toBe(
      true,
    );
  });

  it('retries transient failures and completes within the retry limit', async () => {
    vi.useFakeTimers();
    const setup = setupProcessor();
    setup.executor.outcomes = ['transient', 'transient', 'success'];
    enqueue(setup.store, 4);
    setup.connectivity.setMode('online');
    setup.processor.requestSynchronization();
    await vi.runAllTimersAsync();
    expect(setup.executor.calls).toHaveLength(3);
    expect(setup.store.operations()[0]?.state).toBe('completed');
    expect(setup.store.operations()[0]?.retryCount).toBe(2);
  });

  it('stops transient retries at the configured limit', async () => {
    vi.useFakeTimers();
    const setup = setupProcessor();
    setup.executor.outcomes = ['transient', 'transient', 'transient', 'transient', 'success'];
    enqueue(setup.store, 5);
    setup.connectivity.setMode('online');
    setup.processor.requestSynchronization();
    await vi.runAllTimersAsync();
    expect(setup.executor.calls).toHaveLength(4);
    expect(setup.store.operations()[0]?.state).toBe('failed');
    expect(setup.store.operations()[0]?.retryCount).toBe(3);
  });

  it('surfaces permanent failure without retrying', () => {
    const setup = setupProcessor();
    setup.executor.outcomes = ['permanent'];
    enqueue(setup.store, 6);
    setup.connectivity.setMode('online');
    setup.processor.requestSynchronization();
    expect(setup.executor.calls).toHaveLength(1);
    expect(setup.store.operations()[0]?.state).toBe('failed');
  });

  it('synchronizes automatically after reconnection', () => {
    const setup = setupProcessor();
    enqueue(setup.store, 7);
    setup.processor.requestSynchronization();
    expect(setup.executor.calls).toHaveLength(0);
    setup.connectivity.setMode('online');
    TestBed.flushEffects();
    expect(setup.executor.calls).toHaveLength(1);
    expect(setup.store.operations()[0]?.state).toBe('completed');
  });

  it('supports manual retry after a permanent failure', () => {
    const setup = setupProcessor();
    const facade = TestBed.inject(OfflineQueueFacade);
    setup.executor.outcomes = ['permanent'];
    const operation = enqueue(setup.store, 8);
    setup.connectivity.setMode('online');
    setup.processor.requestSynchronization();
    expect(setup.store.get(operation.id)?.state).toBe('failed');
    setup.executor.outcomes = ['success'];
    facade.retryFailed(operation.id);
    expect(setup.store.get(operation.id)?.state).toBe('completed');
  });

  it('prevents concurrent queue processors', () => {
    TestBed.configureTestingModule({
      providers: [
        ConnectivityService,
        OfflineQueuePersistenceService,
        OfflineQueueStore,
        OfflineQueueProcessorService,
        BlockingExecutor,
        ProcessorMemoryPersistence,
        { provide: PERSISTENCE, useExisting: ProcessorMemoryPersistence },
        { provide: OFFLINE_OPERATION_EXECUTOR, useExisting: BlockingExecutor },
      ],
    });
    const connectivity = TestBed.inject(ConnectivityService);
    connectivity.setMode('offline');
    const store = TestBed.inject(OfflineQueueStore);
    enqueue(store, 9);
    const processor = TestBed.inject(OfflineQueueProcessorService);
    const executor = TestBed.inject(BlockingExecutor);
    connectivity.setMode('online');
    processor.requestSynchronization();
    processor.requestSynchronization();
    expect(executor.calls).toBe(1);
    const operation = store.operations()[0]!;
    executor.response.next({ operationId: operation.id, confirmedRevision: 2 });
    executor.response.complete();
    expect(store.operations()[0]?.state).toBe('completed');
  });
});
