import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  viewChildren,
} from '@angular/core';

import { formatCurrency } from '../../../../shared/utilities/formatters';
import { Product, ProductIcon, ProductId } from '../../domain/product.model';
import { HighlightTextComponent } from '../highlight-text/highlight-text.component';

@Component({
  selector: 'app-product-results',
  imports: [HighlightTextComponent],
  templateUrl: './product-results.component.html',
  styleUrl: './product-results.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductResultsComponent {
  private readonly options = viewChildren<ElementRef<HTMLButtonElement>>('option');
  readonly products = input.required<readonly Product[]>();
  readonly query = input.required<string>();
  readonly activeIndex = input.required<number>();
  readonly selected = output<ProductId>();
  protected readonly currency = formatCurrency;

  constructor() {
    afterRenderEffect(() => {
      const activeOption = this.options()[this.activeIndex()]?.nativeElement;
      activeOption?.scrollIntoView?.({ block: 'nearest' });
    });
  }

  protected icon(icon: ProductIcon): string {
    const icons: Readonly<Record<ProductIcon, string>> = {
      bowl: '◒',
      sandwich: '▰',
      plate: '◉',
      dessert: '◇',
      drink: '▥',
    };
    return icons[icon];
  }

  protected select(product: Product): void {
    if (product.availability === 'available') {
      this.selected.emit(product.id);
    }
  }
}
