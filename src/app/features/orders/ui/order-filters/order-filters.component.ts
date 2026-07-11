import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import {
  ORDER_CHANNELS,
  ORDER_PRIORITIES,
  ORDER_STATUSES,
  OrderChannel,
  OrderFilters,
  OrderPriority,
  OrderSort,
  OrderStatus,
} from '../../domain/order.model';

@Component({
  selector: 'app-order-filters',
  templateUrl: './order-filters.component.html',
  styleUrl: './order-filters.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderFiltersComponent {
  readonly filters = input.required<OrderFilters>();
  readonly resultCount = input.required<number>();
  readonly statusChanged = output<OrderStatus | 'all'>();
  readonly channelToggled = output<OrderChannel>();
  readonly priorityToggled = output<OrderPriority>();
  readonly searchChanged = output<string>();
  readonly sortChanged = output<OrderSort>();
  readonly cleared = output<void>();

  protected readonly statuses = ORDER_STATUSES;
  protected readonly channels = ORDER_CHANNELS;
  protected readonly priorities = ORDER_PRIORITIES;

  protected onSearch(event: Event): void {
    this.searchChanged.emit((event.target as HTMLInputElement).value);
  }

  protected onSort(event: Event): void {
    this.sortChanged.emit((event.target as HTMLSelectElement).value as OrderSort);
  }

  protected label(value: string): string {
    return value === 'walk-in' ? 'Walk-in' : value.charAt(0).toUpperCase() + value.slice(1);
  }
}
