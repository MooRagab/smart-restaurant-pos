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
import { readEventValue } from '../../../../shared/utilities/dom-event';

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
    const value = readEventValue(event);
    if (value !== null) {
      this.searchChanged.emit(value);
    }
  }

  protected onSort(event: Event): void {
    const value = readEventValue(event);
    if (isOrderSort(value)) {
      this.sortChanged.emit(value);
    }
  }

  protected label(value: string): string {
    return value === 'walk-in' ? 'Walk-in' : value.charAt(0).toUpperCase() + value.slice(1);
  }
}

function isOrderSort(value: unknown): value is OrderSort {
  return (
    value === 'newest' ||
    value === 'oldest' ||
    value === 'highest-priority' ||
    value === 'longest-waiting'
  );
}
