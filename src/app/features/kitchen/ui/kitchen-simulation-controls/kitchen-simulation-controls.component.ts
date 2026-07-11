import { ChangeDetectionStrategy, Component, output } from '@angular/core';

import { KitchenLoadStatus } from '../../domain/kitchen.model';

@Component({
  selector: 'app-kitchen-simulation-controls',
  templateUrl: './kitchen-simulation-controls.component.html',
  styleUrl: './kitchen-simulation-controls.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KitchenSimulationControlsComponent {
  readonly increaseRequested = output<void>();
  readonly decreaseRequested = output<void>();
  readonly statusRequested = output<KitchenLoadStatus>();
  readonly historyResetRequested = output<void>();
}
