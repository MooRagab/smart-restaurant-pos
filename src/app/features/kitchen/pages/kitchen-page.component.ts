import { ChangeDetectionStrategy, Component, inject, isDevMode } from '@angular/core';

import { KitchenLoadStatus } from '../domain/kitchen.model';
import { KitchenFacade } from '../state/kitchen.facade';
import { KitchenMetricsComponent } from '../ui/kitchen-metrics/kitchen-metrics.component';
import { KitchenSimulationControlsComponent } from '../ui/kitchen-simulation-controls/kitchen-simulation-controls.component';
import { StationWorkloadComponent } from '../ui/station-workload/station-workload.component';
import { WorkloadHistoryComponent } from '../ui/workload-history/workload-history.component';

@Component({
  selector: 'app-kitchen-page',
  imports: [
    KitchenMetricsComponent,
    KitchenSimulationControlsComponent,
    StationWorkloadComponent,
    WorkloadHistoryComponent,
  ],
  templateUrl: './kitchen-page.component.html',
  styleUrl: './kitchen-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KitchenPageComponent {
  private readonly facade = inject(KitchenFacade);

  protected readonly load = this.facade.load;
  protected readonly developmentMode = isDevMode();

  protected setStatus(status: KitchenLoadStatus): void {
    this.facade.setStatus(status);
  }

  protected increaseLoad(): void {
    this.facade.increaseLoad();
  }

  protected decreaseLoad(): void {
    this.facade.decreaseLoad();
  }

  protected resetHistory(): void {
    this.facade.resetHistory();
  }
}
