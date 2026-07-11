import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ProductAvailability, ProductCategory, ProductId } from '../domain/product.model';
import { ProductSearchKey, ProductsFacade } from '../state/products.facade';
import { ProductFiltersComponent } from '../ui/product-filters/product-filters.component';
import { ProductResultsComponent } from '../ui/product-results/product-results.component';
import { ProductSearchBoxComponent } from '../ui/product-search-box/product-search-box.component';
import { RecentSearchesComponent } from '../ui/recent-searches/recent-searches.component';

@Component({
  selector: 'app-products-page',
  imports: [
    ProductFiltersComponent,
    ProductResultsComponent,
    ProductSearchBoxComponent,
    RecentSearchesComponent,
  ],
  templateUrl: './products-page.component.html',
  styleUrl: './products-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsPageComponent {
  protected readonly facade = inject(ProductsFacade);

  protected readonly loadState = this.facade.loadState;
  protected readonly query = this.facade.rawQuery;
  protected readonly appliedQuery = this.facade.appliedQuery;
  protected readonly filters = this.facade.filters;
  protected readonly result = this.facade.searchResult;
  protected readonly activeIndex = this.facade.activeIndex;
  protected readonly activeDescendant = this.facade.activeDescendant;
  protected readonly expanded = this.facade.expanded;
  protected readonly selectedProduct = this.facade.selectedProduct;
  protected readonly productCount = this.facade.productCount;
  protected readonly recent = this.facade.recent;

  constructor() {
    this.facade.load();
  }

  protected setCategory(category: ProductCategory | 'all'): void {
    this.facade.setCategory(category);
  }
  protected setAvailability(availability: ProductAvailability | 'all'): void {
    this.facade.setAvailability(availability);
  }
  protected handleKey(key: ProductSearchKey): void {
    this.facade.handleKey(key);
  }
  protected selectProduct(id: ProductId): void {
    this.facade.selectProduct(id);
  }
}
