import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  viewChild,
} from '@angular/core';

import {
  formatCurrency,
  formatDate,
  formatDuration,
} from '../../../../shared/utilities/formatters';
import { Order, OrderStatus } from '../../domain/order.model';
import { formatStatus } from '../../domain/order-transition.policy';
import { OrderBadgeComponent } from '../order-badge/order-badge.component';

@Component({
  selector: 'app-order-detail-drawer',
  imports: [OrderBadgeComponent],
  templateUrl: './order-detail-drawer.component.html',
  styleUrl: './order-detail-drawer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderDetailDrawerComponent {
  private readonly closeButton = viewChild<ElementRef<HTMLButtonElement>>('closeButton');

  readonly order = input.required<Order>();
  readonly transitions = input.required<readonly OrderStatus[]>();
  readonly currentTime = input.required<number>();
  readonly closed = output<void>();
  readonly transitionRequested = output<OrderStatus>();

  protected readonly currency = formatCurrency;
  protected readonly date = formatDate;
  protected readonly statusLabel = formatStatus;

  constructor() {
    afterNextRender(() => this.closeButton()?.nativeElement.focus());
  }

  protected waitingTime(): string {
    return formatDuration((this.currentTime() - this.order().createdAt.getTime()) / 1000);
  }
}
