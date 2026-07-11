import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ConnectivityService } from '../../../core/connectivity/connectivity.service';
import { NotificationService } from '../../../core/notifications/notification.service';
import { KitchenFacade } from '../../kitchen/state/kitchen.facade';
import { OfflineQueueFacade } from '../../offline-queue/state/offline-queue.facade';
import { DevelopmentSimulationService } from './development-simulation.service';

@Injectable({ providedIn: 'root' })
export class GlobalSimulationCoordinator {
  private readonly simulation = inject(DevelopmentSimulationService);
  private readonly connectivity = inject(ConnectivityService);
  private readonly kitchen = inject(KitchenFacade);
  private readonly queue = inject(OfflineQueueFacade);
  private readonly notifications = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.simulation.commands$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((command) => {
      switch (command.type) {
        case 'kitchen.increase':
          this.kitchen.increaseLoad();
          this.notifications.show('Kitchen load increased for simulation.', 'info');
          break;
        case 'kitchen.decrease':
          this.kitchen.decreaseLoad();
          this.notifications.show('Kitchen load decreased for simulation.', 'info');
          break;
        case 'connectivity.set':
          this.connectivity.setMode(command.mode);
          this.notifications.show(`Connection simulation changed to ${command.mode}.`, 'info');
          break;
        case 'queue.synchronize':
          this.queue.requestSynchronization();
          this.notifications.show('Queue synchronization requested.', 'info');
          break;
        case 'mock.reset':
          this.kitchen.resetMockData();
          break;
        case 'orders.add':
        case 'orders.status-update':
        case 'orders.payment-update':
        case 'ai.force-success':
        case 'ai.force-failure':
          break;
      }
    });
  }
}
