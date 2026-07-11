import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import {
  PRODUCT_CATEGORIES,
  ProductAvailability,
  ProductCategory,
  ProductFilters,
} from '../../domain/product.model';
import { readEventValue } from '../../../../shared/utilities/dom-event';

@Component({
  selector: 'app-product-filters',
  templateUrl: './product-filters.component.html',
  styleUrl: './product-filters.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductFiltersComponent {
  readonly filters = input.required<ProductFilters>();
  readonly categoryChanged = output<ProductCategory | 'all'>();
  readonly availabilityChanged = output<ProductAvailability | 'all'>();
  protected readonly categories = PRODUCT_CATEGORIES;

  protected label(category: ProductCategory): string {
    return category
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  protected onAvailability(event: Event): void {
    const availability = readEventValue(event);
    if (availability === 'all' || availability === 'available' || availability === 'unavailable') {
      this.availabilityChanged.emit(availability);
    }
  }
}
