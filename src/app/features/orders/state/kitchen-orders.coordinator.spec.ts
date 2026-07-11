import { TestBed } from '@angular/core/testing';
import { NEVER } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';

import { AiAssistantFacade } from '../../ai-assistant/state/ai-assistant.facade';
import { KitchenEventSimulatorService } from '../../kitchen/data-access/kitchen-event-simulator.service';
import { KitchenFacade } from '../../kitchen/state/kitchen.facade';
import { KitchenStore } from '../../kitchen/state/kitchen.store';
import { createMockOrder } from '../data-access/order-mock.generator';
import { KitchenOrdersCoordinator } from './kitchen-orders.coordinator';
import { OrdersStore } from './orders.store';

class AiInvalidationSpy {
  calls = 0;

  invalidateForKitchenChange(): void {
    this.calls += 1;
  }
}

describe('KitchenOrdersCoordinator', () => {
  let kitchen: KitchenFacade;
  let orders: OrdersStore;
  let ai: AiInvalidationSpy;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        KitchenStore,
        KitchenFacade,
        OrdersStore,
        KitchenOrdersCoordinator,
        AiInvalidationSpy,
        { provide: AiAssistantFacade, useExisting: AiInvalidationSpy },
        { provide: KitchenEventSimulatorService, useValue: { events$: NEVER } },
      ],
    });
    kitchen = TestBed.inject(KitchenFacade);
    orders = TestBed.inject(OrdersStore);
    ai = TestBed.inject(AiInvalidationSpy);
    orders.setOrders([
      {
        ...createMockOrder(1),
        status: 'preparing',
        priority: 'normal',
        isDelayed: false,
      },
    ]);
    TestBed.inject(KitchenOrdersCoordinator);
  });

  it('handles typed kitchen events across orders and AI state', () => {
    kitchen.setStatus('critical');
    const updated = orders.orders()[0];
    expect(updated?.priority).toBe('urgent');
    expect(updated?.isDelayed).toBe(true);
    expect(updated?.estimatedPreparationMinutes).toBeGreaterThan(0);
    expect(ai.calls).toBe(1);
  });
});
