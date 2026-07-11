import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { formatCurrency, formatDuration } from '../../../../shared/utilities/formatters';
import { Order, OrderId } from '../../domain/order.model';
import { OrderBadgeComponent } from '../order-badge/order-badge.component';

@Component({
  selector: 'app-order-list',
  imports: [OrderBadgeComponent],
  templateUrl: './order-list.component.html',
  styleUrl: './order-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderListComponent {
  readonly orders = input.required<readonly Order[]>();
  readonly currentTime = input.required<number>();
  readonly selected = output<OrderId>();

  protected readonly currency = formatCurrency;

  protected waitingTime(createdAt: Date): string {
    return formatDuration((this.currentTime() - createdAt.getTime()) / 1000);
  }
}
