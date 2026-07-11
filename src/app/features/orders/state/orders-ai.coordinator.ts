import { Injectable, effect, inject } from '@angular/core';

import { AiAssistantFacade } from '../../ai-assistant/state/ai-assistant.facade';
import { OrdersStore } from './orders.store';

@Injectable()
export class OrdersAiCoordinator {
  private readonly orders = inject(OrdersStore);
  private readonly aiAssistant = inject(AiAssistantFacade);

  constructor() {
    effect(() => this.aiAssistant.selectOrder(this.orders.selectedOrder()));
  }
}
