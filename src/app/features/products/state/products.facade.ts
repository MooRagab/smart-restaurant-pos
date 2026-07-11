import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, Subscription, debounceTime, distinctUntilChanged, take } from 'rxjs';

import { AppError } from '../../../shared/types/app-error';
import { RecentSearchesService } from '../data-access/recent-searches.service';
import { PRODUCTS_REPOSITORY, ProductsRepository } from '../data-access/products.repository';
import { ProductAvailability, ProductCategory, ProductId } from '../domain/product.model';
import { ProductsStore } from './products.store';

export type ProductSearchKey = 'ArrowDown' | 'ArrowUp' | 'Enter' | 'Escape';

@Injectable()
export class ProductsFacade {
  private readonly store = inject(ProductsStore);
  private readonly repository = inject<ProductsRepository>(PRODUCTS_REPOSITORY);
  private readonly recentSearches = inject(RecentSearchesService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly queryChanges = new Subject<string>();
  private loadSubscription: Subscription | null = null;

  readonly loadState = this.store.loadState;
  readonly rawQuery = this.store.rawQuery;
  readonly appliedQuery = this.store.appliedQuery;
  readonly filters = this.store.filters;
  readonly searchResult = this.store.searchResult;
  readonly activeIndex = this.store.activeIndex;
  readonly activeDescendant = this.store.activeDescendant;
  readonly expanded = this.store.expanded;
  readonly selectedProduct = this.store.selectedProduct;
  readonly productCount = this.store.productCount;
  readonly recent = this.recentSearches.searches;

  constructor() {
    this.queryChanges
      .pipe(debounceTime(180), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((query) => this.store.applyQuery(query));
  }

  load(): void {
    this.loadSubscription?.unsubscribe();
    this.store.setLoading();
    this.loadSubscription = this.repository
      .loadProducts()
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (products) => this.store.setProducts(products),
        error: (error: AppError) => this.store.setLoadError(error),
      });
  }

  setQuery(query: string): void {
    this.store.setRawQuery(query);
    this.queryChanges.next(query);
  }

  useRecent(query: string): void {
    this.store.setRawQuery(query);
    this.store.applyQuery(query);
    this.queryChanges.next(query);
  }

  setCategory(category: ProductCategory | 'all'): void {
    this.store.setCategory(category);
  }

  setAvailability(availability: ProductAvailability | 'all'): void {
    this.store.setAvailability(availability);
  }

  handleKey(key: ProductSearchKey): void {
    switch (key) {
      case 'ArrowDown':
        this.store.moveActive('next');
        break;
      case 'ArrowUp':
        this.store.moveActive('previous');
        break;
      case 'Enter': {
        const selected = this.store.selectActive();
        if (selected !== null) {
          this.commitRecentSearch();
        }
        break;
      }
      case 'Escape':
        this.store.close();
        break;
    }
  }

  selectProduct(productId: ProductId): void {
    if (this.store.selectProduct(productId) !== null) {
      this.commitRecentSearch();
    }
  }

  open(): void {
    this.store.open();
  }

  clear(): void {
    this.store.clear();
    this.queryChanges.next('');
  }

  clearRecent(): void {
    this.recentSearches.clear();
  }

  private commitRecentSearch(): void {
    this.recentSearches.add(this.store.rawQuery());
  }
}
