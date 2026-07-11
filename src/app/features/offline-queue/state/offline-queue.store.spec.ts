import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { PERSISTENCE, Persistence } from '../../../core/persistence/persistence';
import { OfflineQueuePersistenceService } from '../data-access/offline-queue-persistence.service';
import { OfflineQueueStore } from './offline-queue.store';

class StoreMemoryPersistence implements Persistence {
  readonly values = new Map<string, unknown>();
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

describe('OfflineQueueStore', () => {
  let store: OfflineQueueStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        OfflineQueueStore,
        OfflineQueuePersistenceService,
        StoreMemoryPersistence,
        { provide: PERSISTENCE, useExisting: StoreMemoryPersistence },
      ],
    });
    store = TestBed.inject(OfflineQueueStore);
  });

  it('deduplicates operations by idempotency key', () => {
    const input = {
      idempotencyKey: 'same-key',
      entityId: 'order-1',
      payload: {
        orderNumber: 'SH-2401',
        fromStatus: 'received' as const,
        toStatus: 'preparing' as const,
        expectedRevision: 1,
      },
    };
    const first = store.enqueueOrderStatus(input);
    const duplicate = store.enqueueOrderStatus(input);
    expect(duplicate.id).toBe(first.id);
    expect(store.operations()).toHaveLength(1);
  });

  it('allows a new idempotency key for a later entity revision', () => {
    const payload = {
      orderNumber: 'SH-2401',
      fromStatus: 'received' as const,
      toStatus: 'preparing' as const,
      expectedRevision: 1,
    };
    store.enqueueOrderStatus({ idempotencyKey: 'revision-1', entityId: 'order-1', payload });
    store.enqueueOrderStatus({
      idempotencyKey: 'revision-2',
      entityId: 'order-1',
      payload: { ...payload, expectedRevision: 2 },
    });
    expect(store.operations()).toHaveLength(2);
  });

  it('persists every queue state transition', () => {
    const operation = store.enqueueOrderStatus({
      idempotencyKey: 'state-test',
      entityId: 'order-1',
      payload: {
        orderNumber: 'SH-2401',
        fromStatus: 'received',
        toStatus: 'preparing',
        expectedRevision: 1,
      },
    });
    store.markProcessing(operation.id);
    store.markCompleted(operation.id);
    expect(store.operations()[0]?.state).toBe('completed');
    expect(TestBed.inject(StoreMemoryPersistence).values.size).toBe(1);
  });
});
