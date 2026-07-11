import { Injectable, computed, signal } from '@angular/core';

import { AppError } from '../../../shared/types/app-error';
import { AsyncState } from '../../../shared/types/async-state';
import {
  DEFAULT_PRODUCT_FILTERS,
  Product,
  ProductAvailability,
  ProductCategory,
  ProductFilters,
  ProductId,
} from '../domain/product.model';
import { navigateProductIndex, searchProducts } from '../domain/product-search';

@Injectable()
export class ProductsStore {
  private readonly productsSignal = signal<readonly Product[]>([]);
  private readonly loadStateSignal = signal<AsyncState<true>>({ status: 'idle' });
  private readonly rawQuerySignal = signal('');
  private readonly appliedQuerySignal = signal('');
  private readonly filtersSignal = signal<ProductFilters>(DEFAULT_PRODUCT_FILTERS);
  private readonly activeIndexSignal = signal(-1);
  private readonly expandedSignal = signal(false);
  private readonly selectedProductIdSignal = signal<ProductId | null>(null);

  readonly loadState = this.loadStateSignal.asReadonly();
  readonly rawQuery = this.rawQuerySignal.asReadonly();
  readonly appliedQuery = this.appliedQuerySignal.asReadonly();
  readonly filters = this.filtersSignal.asReadonly();
  readonly activeIndex = this.activeIndexSignal.asReadonly();
  readonly expanded = this.expandedSignal.asReadonly();
  readonly searchResult = computed(() =>
    searchProducts(this.productsSignal(), this.appliedQuerySignal(), this.filtersSignal()),
  );
  readonly activeProduct = computed(
    () => this.searchResult().products[this.activeIndexSignal()] ?? null,
  );
  readonly activeDescendant = computed(() => {
    const product = this.activeProduct();
    return product === null ? null : `product-option-${product.id}`;
  });
  readonly selectedProduct = computed(() => {
    const id = this.selectedProductIdSignal();
    return id === null
      ? null
      : (this.productsSignal().find((product) => product.id === id) ?? null);
  });
  readonly productCount = computed(() => this.productsSignal().length);

  setLoading(): void {
    this.loadStateSignal.set({ status: 'loading' });
  }

  setProducts(products: readonly Product[]): void {
    this.productsSignal.set(products);
    this.loadStateSignal.set(
      products.length === 0 ? { status: 'empty' } : { status: 'success', data: true },
    );
  }

  setLoadError(error: AppError): void {
    this.loadStateSignal.set({ status: 'error', error });
  }

  setRawQuery(query: string): void {
    this.rawQuerySignal.set(query);
    this.expandedSignal.set(true);
    this.activeIndexSignal.set(-1);
  }

  applyQuery(query: string): void {
    this.appliedQuerySignal.set(query.trim());
    this.activeIndexSignal.set(-1);
  }

  setCategory(category: ProductCategory | 'all'): void {
    this.filtersSignal.update((filters) => ({ ...filters, category }));
    this.expandedSignal.set(true);
    this.activeIndexSignal.set(-1);
  }

  setAvailability(availability: ProductAvailability | 'all'): void {
    this.filtersSignal.update((filters) => ({ ...filters, availability }));
    this.expandedSignal.set(true);
    this.activeIndexSignal.set(-1);
  }

  moveActive(direction: 'next' | 'previous'): void {
    this.expandedSignal.set(true);
    this.activeIndexSignal.update((index) =>
      navigateProductIndex(index, direction, this.searchResult().products),
    );
  }

  selectActive(): Product | null {
    const product = this.activeProduct();
    if (product?.availability !== 'available') {
      return null;
    }
    this.selectProduct(product.id);
    return product;
  }

  selectProduct(productId: ProductId): Product | null {
    const product = this.productsSignal().find((item) => item.id === productId) ?? null;
    if (product?.availability !== 'available') {
      return null;
    }
    this.selectedProductIdSignal.set(product.id);
    this.expandedSignal.set(false);
    return product;
  }

  open(): void {
    this.expandedSignal.set(true);
  }

  close(): void {
    this.expandedSignal.set(false);
    this.activeIndexSignal.set(-1);
  }

  clear(): void {
    this.rawQuerySignal.set('');
    this.appliedQuerySignal.set('');
    this.filtersSignal.set(DEFAULT_PRODUCT_FILTERS);
    this.activeIndexSignal.set(-1);
    this.expandedSignal.set(false);
  }
}
