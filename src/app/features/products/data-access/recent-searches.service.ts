import { Injectable, inject, signal } from '@angular/core';

import { PERSISTENCE, Persistence } from '../../../core/persistence/persistence';

const STORAGE_KEY = 'sahm-food.product-recent-searches.v1';
const MAX_RECENT_SEARCHES = 6;

@Injectable()
export class RecentSearchesService {
  private readonly persistence = inject<Persistence>(PERSISTENCE);
  private readonly searchesSignal = signal<readonly string[]>(this.restore());

  readonly searches = this.searchesSignal.asReadonly();

  add(query: string): void {
    const normalized = query.trim();
    if (normalized.length === 0) {
      return;
    }
    const next = [
      normalized,
      ...this.searchesSignal().filter(
        (item) => item.toLocaleLowerCase('en-EG') !== normalized.toLocaleLowerCase('en-EG'),
      ),
    ].slice(0, MAX_RECENT_SEARCHES);
    this.searchesSignal.set(next);
    this.persist(next);
  }

  clear(): void {
    this.searchesSignal.set([]);
    try {
      this.persistence.remove(STORAGE_KEY);
    } catch {
      return;
    }
  }

  private restore(): readonly string[] {
    try {
      const stored = this.persistence.read(STORAGE_KEY);
      return Array.isArray(stored)
        ? stored
            .filter(
              (value): value is string => typeof value === 'string' && value.trim().length > 0,
            )
            .slice(0, MAX_RECENT_SEARCHES)
        : [];
    } catch {
      return [];
    }
  }

  private persist(searches: readonly string[]): void {
    try {
      this.persistence.write(STORAGE_KEY, searches);
    } catch {
      return;
    }
  }
}
