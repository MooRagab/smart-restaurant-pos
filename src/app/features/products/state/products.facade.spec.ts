import { TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PERSISTENCE, Persistence } from '../../../core/persistence/persistence';
import { generateMockProducts } from '../data-access/product-mock.generator';
import { RecentSearchesService } from '../data-access/recent-searches.service';
import { PRODUCTS_REPOSITORY, ProductsRepository } from '../data-access/products.repository';
import { Product } from '../domain/product.model';
import { ProductsFacade } from './products.facade';
import { ProductsStore } from './products.store';

class ImmediateProductsRepository implements ProductsRepository {
  loadProducts(): Observable<readonly Product[]> {
    return of(generateMockProducts());
  }
}

class TestPersistence implements Persistence {
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

describe('ProductsFacade', () => {
  let facade: ProductsFacade;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [
        ProductsStore,
        ProductsFacade,
        RecentSearchesService,
        ImmediateProductsRepository,
        TestPersistence,
        { provide: PRODUCTS_REPOSITORY, useExisting: ImmediateProductsRepository },
        { provide: PERSISTENCE, useExisting: TestPersistence },
      ],
    });
    facade = TestBed.inject(ProductsFacade);
    facade.load();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
  });

  it('debounces query application while exposing typed input immediately', async () => {
    facade.setQuery('Ko');
    facade.setQuery('Koshari');
    expect(facade.rawQuery()).toBe('Koshari');
    expect(facade.appliedQuery()).toBe('');
    await vi.advanceTimersByTimeAsync(179);
    expect(facade.appliedQuery()).toBe('');
    await vi.advanceTimersByTimeAsync(1);
    expect(facade.appliedQuery()).toBe('Koshari');
    expect(
      facade.searchResult().products.every((product) => product.name.includes('Koshari')),
    ).toBe(true);
  });

  it('supports Arrow keys, Enter selection, and recent-search capture', async () => {
    facade.setQuery('Koshari');
    await vi.advanceTimersByTimeAsync(180);
    facade.handleKey('ArrowDown');
    const availableIndexes = facade
      .searchResult()
      .products.map((product, index) => ({ product, index }))
      .filter(({ product }) => product.availability === 'available')
      .map(({ index }) => index);
    expect(facade.activeIndex()).toBe(availableIndexes[0]);
    facade.handleKey('ArrowUp');
    expect(facade.activeIndex()).toBe(availableIndexes.at(-1));
    facade.handleKey('Enter');
    expect(facade.selectedProduct()).not.toBeNull();
    expect(facade.expanded()).toBe(false);
    expect(facade.recent()).toEqual(['Koshari']);
  });

  it('closes results and clears active navigation on Escape', () => {
    facade.open();
    facade.handleKey('ArrowDown');
    facade.handleKey('Escape');
    expect(facade.expanded()).toBe(false);
    expect(facade.activeIndex()).toBe(-1);
  });

  it('does not restore a stale debounced query after clearing or choosing a recent search', async () => {
    facade.setQuery('Koshari');
    facade.clear();
    await vi.advanceTimersByTimeAsync(180);
    expect(facade.appliedQuery()).toBe('');

    facade.setQuery('Molokhia');
    facade.useRecent('Fatta');
    await vi.advanceTimersByTimeAsync(180);
    expect(facade.rawQuery()).toBe('Fatta');
    expect(facade.appliedQuery()).toBe('Fatta');
  });

  it('does not keyboard-select or directly select unavailable products', () => {
    facade.setAvailability('unavailable');
    const unavailable = facade.searchResult().products[0];
    expect(unavailable).toBeDefined();

    facade.handleKey('ArrowDown');
    expect(facade.activeIndex()).toBe(-1);
    if (unavailable !== undefined) {
      facade.selectProduct(unavailable.id);
    }
    expect(facade.selectedProduct()).toBeNull();
  });
});
