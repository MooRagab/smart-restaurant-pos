import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { ConnectivityService } from '../../../core/connectivity/connectivity.service';
import { NotificationService } from '../../../core/notifications/notification.service';
import { KitchenFacade } from '../../kitchen/state/kitchen.facade';
import { OfflineQueueFacade } from '../../offline-queue/state/offline-queue.facade';
import { DevelopmentSimulationService } from './development-simulation.service';
import { GlobalSimulationCoordinator } from './global-simulation.coordinator';

describe('GlobalSimulationCoordinator', () => {
  it('routes development commands through application services', () => {
    const kitchen = {
      increaseLoad: vi.fn(),
      decreaseLoad: vi.fn(),
      resetMockData: vi.fn(),
    };
    const queue = { requestSynchronization: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        GlobalSimulationCoordinator,
        DevelopmentSimulationService,
        ConnectivityService,
        NotificationService,
        { provide: KitchenFacade, useValue: kitchen },
        { provide: OfflineQueueFacade, useValue: queue },
      ],
    });
    TestBed.inject(GlobalSimulationCoordinator);
    const simulation = TestBed.inject(DevelopmentSimulationService);
    const connectivity = TestBed.inject(ConnectivityService);

    simulation.dispatch({ type: 'kitchen.increase' });
    simulation.dispatch({ type: 'kitchen.decrease' });
    simulation.dispatch({ type: 'connectivity.set', mode: 'offline' });
    simulation.dispatch({ type: 'queue.synchronize' });
    simulation.dispatch({ type: 'mock.reset' });

    expect(kitchen.increaseLoad).toHaveBeenCalledOnce();
    expect(kitchen.decreaseLoad).toHaveBeenCalledOnce();
    expect(kitchen.resetMockData).toHaveBeenCalledOnce();
    expect(queue.requestSynchronization).toHaveBeenCalledOnce();
    expect(connectivity.state().mode).toBe('offline');
  });
});
