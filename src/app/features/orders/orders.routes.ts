import { Routes } from '@angular/router';

import { AiRecommendationSimulatorService } from '../ai-assistant/data-access/ai-recommendation-simulator.service';
import { AiSimulationControlsService } from '../ai-assistant/data-access/ai-simulation-controls.service';
import { AiAssistantFacade } from '../ai-assistant/state/ai-assistant.facade';
import { AiAssistantStore } from '../ai-assistant/state/ai-assistant.store';
import { MockOrdersRepository } from './data-access/mock-orders.repository';
import { OrderLiveEventService } from './data-access/order-live-event.service';
import { ORDERS_REPOSITORY } from './data-access/orders.repository';
import { OrdersFacade } from './state/orders.facade';
import { OrdersAiCoordinator } from './state/orders-ai.coordinator';
import { KitchenOrdersCoordinator } from './state/kitchen-orders.coordinator';
import { OrdersStore } from './state/orders.store';
import { OrdersSimulationCoordinator } from '../simulation/state/orders-simulation.coordinator';

export const ORDERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/orders-page.component').then((module) => module.OrdersPageComponent),
    title: 'Live Orders · Sahm Food',
    providers: [
      OrdersStore,
      OrdersFacade,
      OrdersAiCoordinator,
      KitchenOrdersCoordinator,
      OrdersSimulationCoordinator,
      AiAssistantStore,
      AiAssistantFacade,
      AiRecommendationSimulatorService,
      AiSimulationControlsService,
      OrderLiveEventService,
      MockOrdersRepository,
      { provide: ORDERS_REPOSITORY, useExisting: MockOrdersRepository },
    ],
  },
];
