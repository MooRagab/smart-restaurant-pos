import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  inject,
  OnDestroy,
  output,
  viewChild,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';

import {
  formatCurrency,
  formatDate,
  formatDuration,
} from '../../../../shared/utilities/formatters';
import { trapTabKey } from '../../../../shared/utilities/focus-management';
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
export class OrderDetailDrawerComponent implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly closeButton = viewChild<ElementRef<HTMLButtonElement>>('closeButton');
  private readonly drawer = viewChild<ElementRef<HTMLElement>>('drawer');
  private readonly previouslyFocused =
    this.document.activeElement instanceof HTMLElement ? this.document.activeElement : null;

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

  ngOnDestroy(): void {
    this.previouslyFocused?.focus();
  }

  protected handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closed.emit();
      return;
    }
    const drawer = this.drawer()?.nativeElement;
    if (drawer) {
      trapTabKey(event, drawer);
    }
  }

  protected waitingTime(): string {
    return formatDuration((this.currentTime() - this.order().createdAt.getTime()) / 1000);
  }
}
