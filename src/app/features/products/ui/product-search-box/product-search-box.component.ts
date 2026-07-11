import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { ProductSearchKey } from '../../state/products.facade';
import { readEventValue } from '../../../../shared/utilities/dom-event';

@Component({
  selector: 'app-product-search-box',
  templateUrl: './product-search-box.component.html',
  styleUrl: './product-search-box.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductSearchBoxComponent {
  readonly query = input.required<string>();
  readonly expanded = input.required<boolean>();
  readonly activeDescendant = input<string | null>(null);
  readonly queryChanged = output<string>();
  readonly keyPressed = output<ProductSearchKey>();
  readonly focused = output<void>();
  readonly clearRequested = output<void>();

  protected onInput(event: Event): void {
    const value = readEventValue(event);
    if (value !== null) {
      this.queryChanged.emit(value);
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (isProductSearchKey(event.key)) {
      event.preventDefault();
      this.keyPressed.emit(event.key);
    }
  }
}

function isProductSearchKey(key: string): key is ProductSearchKey {
  return key === 'ArrowDown' || key === 'ArrowUp' || key === 'Enter' || key === 'Escape';
}
