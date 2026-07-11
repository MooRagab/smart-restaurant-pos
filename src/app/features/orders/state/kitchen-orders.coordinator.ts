import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AiAssistantFacade } from '../../ai-assistant/state/ai-assistant.facade';
import { KitchenFacade } from '../../kitchen/state/kitchen.facade';
import { OrdersStore } from './orders.store';

@Injectable()
export class KitchenOrdersCoordinator {
  private readonly kitchen = inject(KitchenFacade);
  private readonly orders = inject(OrdersStore);
  private readonly aiAssistant = inject(AiAssistantFacade);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.applyCurrentLoad();
    this.kitchen.loadChanged$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      this.orders.applyKitchenLoad(event.load);
      this.aiAssistant.invalidateForKitchenChange();
    });
  }

  applyCurrentLoad(): void {
    this.orders.applyKitchenLoad(this.kitchen.load());
  }
}
