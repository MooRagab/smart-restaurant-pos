import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { PERSISTENCE, Persistence } from '../../../core/persistence/persistence';
import { PendingOperation } from '../domain/queued-operation.model';
import { OfflineQueuePersistenceService } from './offline-queue-persistence.service';

const STORAGE_KEY = 'sahm-food.offline-queue.v1';

class QueueMemoryPersistence implements Persistence {
  readonly values = new Map<string, unknown>();
  failRead = false;
  failWrite = false;

  read(key: string): unknown | null {
    if (this.failRead) throw new Error('read failed');
    return this.values.get(key) ?? null;
  }
  write(key: string, value: unknown): void {
    if (this.failWrite) throw new Error('write failed');
    this.values.set(key, value);
  }
  remove(key: string): void {
    this.values.delete(key);
  }
}

function pendingOperation(): PendingOperation {
  return {
    id: 'operation-1',
    idempotencyKey: 'order-status:order-1:received:preparing:1',
    type: 'order.status-change',
    entityId: 'order-1',
    payload: {
      orderNumber: 'SH-2401',
      fromStatus: 'received',
      toStatus: 'preparing',
      expectedRevision: 1,
    },
    createdAt: new Date('2026-07-11T12:00:00Z'),
    retryCount: 0,
    state: 'pending',
    lastError: null,
  };
}

describe('OfflineQueuePersistenceService', () => {
  let persistence: QueueMemoryPersistence;
  let service: OfflineQueuePersistenceService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        OfflineQueuePersistenceService,
        QueueMemoryPersistence,
        { provide: PERSISTENCE, useExisting: QueueMemoryPersistence },
      ],
    });
    persistence = TestBed.inject(QueueMemoryPersistence);
    service = TestBed.inject(OfflineQueuePersistenceService);
  });

  it('persists and restores typed operations with dates', () => {
    expect(service.save([pendingOperation()])).toBeNull();
    const restored = service.restore();
    expect(restored.error).toBeNull();
    expect(restored.operations[0]?.createdAt).toEqual(new Date('2026-07-11T12:00:00Z'));
    expect(restored.operations[0]?.payload.toStatus).toBe('preparing');
  });

  it('recovers interrupted processing operations as pending', () => {
    persistence.values.set(STORAGE_KEY, {
      version: 1,
      operations: [
        {
          id: 'operation-1',
          idempotencyKey: 'order-status:order-1:received:preparing:1',
          type: 'order.status-change',
          entityId: 'order-1',
          payload: {
            orderNumber: 'SH-2401',
            fromStatus: 'received',
            toStatus: 'preparing',
            expectedRevision: 1,
          },
          createdAt: '2026-07-11T12:00:00.000Z',
          retryCount: 0,
          state: 'processing',
          lastError: null,
          processingStartedAt: '2026-07-11T12:01:00.000Z',
        },
      ],
    });
    expect(service.restore().operations[0]?.state).toBe('pending');
  });

  it('rejects invalid schemas without throwing', () => {
    persistence.values.set(STORAGE_KEY, { version: 99, operations: 'invalid' });
    const restored = service.restore();
    expect(restored.operations).toEqual([]);
    expect(restored.error?.code).toBe('persistence');
  });

  it('rejects corrupt retry counts and revisions', () => {
    persistence.values.set(STORAGE_KEY, {
      version: 1,
      operations: [
        {
          id: 'operation-1',
          idempotencyKey: 'invalid-operation',
          type: 'order.status-change',
          entityId: 'order-1',
          payload: {
            orderNumber: 'SH-2401',
            fromStatus: 'received',
            toStatus: 'preparing',
            expectedRevision: Number.NaN,
          },
          createdAt: '2026-07-11T12:00:00.000Z',
          retryCount: -1,
          state: 'pending',
          lastError: null,
        },
      ],
    });

    const restored = service.restore();
    expect(restored.operations).toEqual([]);
    expect(restored.error?.code).toBe('persistence');
  });

  it('surfaces storage read and write failures', () => {
    persistence.failRead = true;
    expect(service.restore().error?.code).toBe('persistence');
    persistence.failRead = false;
    persistence.failWrite = true;
    expect(service.save([pendingOperation()])?.code).toBe('persistence');
  });
});
