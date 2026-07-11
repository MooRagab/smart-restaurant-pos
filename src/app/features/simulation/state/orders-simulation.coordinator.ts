import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { NotificationService } from '../../../core/notifications/notification.service';
import { AiAssistantFacade } from '../../ai-assistant/state/ai-assistant.facade';
import { createMockOrder, generateMockOrders } from '../../orders/data-access/order-mock.generator';
import { getAvailableTransitions } from '../../orders/domain/order-transition.policy';
import { OrdersStore } from '../../orders/state/orders.store';
import { DevelopmentSimulationService } from './development-simulation.service';
import { SimulationCommand } from '../domain/simulation-command.model';

@Injectable()
export class OrdersSimulationCoordinator {
  private readonly simulation = inject(DevelopmentSimulationService);
  private readonly orders = inject(OrdersStore);
  private readonly aiAssistant = inject(AiAssistantFacade);
  private readonly notifications = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);
  private sequence = 0;

  constructor() {
    this.simulation.commands$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((command) => this.handle(command.type));
  }

  private handle(type: SimulationCommand['type']): void {
    switch (type) {
      case 'orders.add': {
        this.sequence += 1;
        const order = createMockOrder(2_000 + this.sequence, new Date());
        this.orders.applyLiveEvent({
          id: `simulation-add-${this.sequence}`,
          type: 'order.created',
          occurredAt: new Date(),
          payload: { order },
        });
        this.notifications.show(`${order.orderNumber} added by simulation.`, 'success');
        break;
      }
      case 'orders.status-update':
        this.simulateStatusUpdate();
        break;
      case 'orders.payment-update':
        this.simulatePaymentUpdate();
        break;
      case 'ai.force-success':
        this.aiAssistant.setSimulationOutcome('success');
        this.notifications.show('The next AI generation will succeed.', 'info');
        break;
      case 'ai.force-failure':
        this.aiAssistant.setSimulationOutcome('failure');
        this.notifications.show('The next AI generation will fail.', 'warning');
        break;
      case 'mock.reset':
        this.orders.setOrders(generateMockOrders(56, new Date()));
        this.aiAssistant.reset();
        this.notifications.show('Order, kitchen, and AI mock state reset.', 'success');
        break;
      case 'kitchen.increase':
      case 'kitchen.decrease':
      case 'connectivity.set':
      case 'queue.synchronize':
        break;
    }
  }

  private simulateStatusUpdate(): void {
    const order = this.orders
      .orders()
      .find(
        (candidate) =>
          candidate.synchronizationState !== 'pending' &&
          getAvailableTransitions(candidate).length > 0,
      );
    const status = order === undefined ? undefined : getAvailableTransitions(order)[0];
    if (order === undefined || status === undefined) {
      this.notifications.show('No order is available for a simulated status update.', 'warning');
      return;
    }
    this.orders.applyLiveEvent({
      id: `simulation-status-${order.id}-${status}`,
      type: 'order.status-changed',
      occurredAt: new Date(),
      payload: { orderId: order.id, status },
    });
    this.notifications.show(`${order.orderNumber} moved to ${status} by simulation.`, 'info');
  }

  private simulatePaymentUpdate(): void {
    const order = this.orders.orders().find((candidate) => candidate.paymentState !== 'paid');
    if (order === undefined) {
      this.notifications.show('All visible orders are already paid.', 'info');
      return;
    }
    this.orders.applyLiveEvent({
      id: `simulation-payment-${order.id}`,
      type: 'order.payment-changed',
      occurredAt: new Date(),
      payload: { orderId: order.id, paymentState: 'paid' },
    });
    this.notifications.show(`${order.orderNumber} payment marked as paid.`, 'success');
  }
}
