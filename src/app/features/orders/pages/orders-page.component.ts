import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';

import { AiSimulationOutcome } from '../../ai-assistant/domain/ai-recommendation.model';
import { AiAssistantFacade } from '../../ai-assistant/state/ai-assistant.facade';
import { AiAssistantPanelComponent } from '../../ai-assistant/ui/ai-assistant-panel/ai-assistant-panel.component';
import { OrderChannel, OrderPriority, OrderSort, OrderStatus } from '../domain/order.model';
import { OrdersFacade } from '../state/orders.facade';
import { OrderDetailDrawerComponent } from '../ui/order-detail-drawer/order-detail-drawer.component';
import { OrderFiltersComponent } from '../ui/order-filters/order-filters.component';
import { OrderListComponent } from '../ui/order-list/order-list.component';
import { OrderSummaryComponent } from '../ui/order-summary/order-summary.component';
import { OrderWorkspaceStateComponent } from '../ui/order-workspace-state/order-workspace-state.component';

@Component({
  selector: 'app-orders-page',
  imports: [
    AiAssistantPanelComponent,
    OrderDetailDrawerComponent,
    OrderFiltersComponent,
    OrderListComponent,
    OrderSummaryComponent,
    OrderWorkspaceStateComponent,
  ],
  templateUrl: './orders-page.component.html',
  styleUrl: './orders-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersPageComponent {
  private readonly facade = inject(OrdersFacade);
  private readonly aiAssistant = inject(AiAssistantFacade);

  protected readonly visibleOrders = this.facade.visibleOrders;
  protected readonly filters = this.facade.filters;
  protected readonly summary = this.facade.summary;
  protected readonly selectedOrder = this.facade.selectedOrder;
  protected readonly selectedTransitions = this.facade.selectedTransitions;
  protected readonly loadState = this.facade.loadState;
  protected readonly currentTime = this.facade.currentTime;
  protected readonly aiState = this.aiAssistant.state;
  protected readonly aiSimulationOutcome = this.aiAssistant.simulationOutcome;
  protected readonly aiSlowStreaming = this.aiAssistant.slowStreaming;

  constructor() {
    this.facade.load();
    effect(() => this.aiAssistant.selectOrder(this.selectedOrder()));
  }

  protected setStatus(status: OrderStatus | 'all'): void {
    this.facade.setStatusFilter(status);
  }

  protected toggleChannel(channel: OrderChannel): void {
    this.facade.toggleChannel(channel);
  }

  protected togglePriority(priority: OrderPriority): void {
    this.facade.togglePriority(priority);
  }

  protected setSearch(searchTerm: string): void {
    this.facade.setSearchTerm(searchTerm);
  }

  protected setSort(sort: OrderSort): void {
    this.facade.setSort(sort);
  }

  protected retryLoad(): void {
    this.facade.retryLoad();
  }

  protected clearFilters(): void {
    this.facade.clearFilters();
  }

  protected selectOrder(orderId: string): void {
    this.facade.selectOrder(orderId);
  }

  protected closeDetails(): void {
    this.facade.closeDetails();
  }

  protected transition(status: OrderStatus): void {
    const order = this.selectedOrder();
    if (order !== null) {
      this.facade.transitionStatus(order.id, status);
    }
  }

  protected generateRecommendation(): void {
    this.aiAssistant.generate();
  }

  protected retryRecommendation(): void {
    this.aiAssistant.retry();
  }

  protected cancelRecommendation(): void {
    this.aiAssistant.cancel();
  }

  protected resetRecommendation(): void {
    this.aiAssistant.reset();
  }

  protected setAiSimulationOutcome(outcome: AiSimulationOutcome): void {
    this.aiAssistant.setSimulationOutcome(outcome);
  }

  protected setAiSlowStreaming(slow: boolean): void {
    this.aiAssistant.setSlowStreaming(slow);
  }
}
