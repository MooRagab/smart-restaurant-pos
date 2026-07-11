import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { PERSISTENCE, Persistence } from '../../../core/persistence/persistence';
import { RecentSearchesService } from './recent-searches.service';

class MemoryPersistence implements Persistence {
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

describe('RecentSearchesService', () => {
  let persistence: MemoryPersistence;
  let service: RecentSearchesService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RecentSearchesService,
        MemoryPersistence,
        { provide: PERSISTENCE, useExisting: MemoryPersistence },
      ],
    });
    persistence = TestBed.inject(MemoryPersistence);
    service = TestBed.inject(RecentSearchesService);
  });

  it('ignores empty searches, deduplicates case-insensitively, and limits growth', () => {
    service.add('');
    service.add('Koshari');
    service.add('koshari');
    for (const query of ['Hawawshi', 'Fattah', 'Kofta', 'Tea', 'Sobya', 'Molokhia']) {
      service.add(query);
    }
    expect(service.searches()).toHaveLength(6);
    expect(service.searches()[0]).toBe('Molokhia');
    expect(service.searches().filter((query) => query.toLowerCase() === 'koshari')).toHaveLength(0);
  });

  it('persists and restores validated recent searches', () => {
    service.add('Koshari');
    const persisted = [...persistence.values.values()][0];
    expect(persisted).toEqual(['Koshari']);

    TestBed.resetTestingModule();
    const restoredPersistence = new MemoryPersistence();
    for (const [key, value] of persistence.values) {
      restoredPersistence.values.set(key, value);
    }
    TestBed.configureTestingModule({
      providers: [RecentSearchesService, { provide: PERSISTENCE, useValue: restoredPersistence }],
    });
    expect(TestBed.inject(RecentSearchesService).searches()).toEqual(['Koshari']);
  });

  it('clears both signal state and persistence', () => {
    service.add('Koshari');
    service.clear();
    expect(service.searches()).toEqual([]);
    expect(persistence.values.size).toBe(0);
  });
});
