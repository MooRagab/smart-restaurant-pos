import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { OrderChannel, OrderPriority, OrderStatus } from '../../domain/order.model';

type BadgeValue = OrderStatus | OrderChannel | OrderPriority;

@Component({
  selector: 'app-order-badge',
  template: `<span class="badge" [attr.data-value]="value()">{{ label() }}</span>`,
  styleUrl: './order-badge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderBadgeComponent {
  readonly value = input.required<BadgeValue>();
  protected readonly label = computed(() => {
    const value = this.value();
    return value === 'walk-in'
      ? 'Walk-in'
      : value.charAt(0).toUpperCase() + value.slice(1).replace('-', ' ');
  });
}
