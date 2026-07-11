import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { OrderSummary } from '../../domain/order.model';

@Component({
  selector: 'app-order-summary',
  templateUrl: './order-summary.component.html',
  styleUrl: './order-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderSummaryComponent {
  readonly summary = input.required<OrderSummary>();
}
