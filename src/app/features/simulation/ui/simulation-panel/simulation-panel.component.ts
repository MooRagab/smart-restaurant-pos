import { ChangeDetectionStrategy, Component, output } from '@angular/core';

import { isConnectivityMode } from '../../../../shared/types/connectivity';
import { readEventValue } from '../../../../shared/utilities/dom-event';
import { SimulationCommand } from '../../domain/simulation-command.model';

@Component({
  selector: 'app-simulation-panel',
  templateUrl: './simulation-panel.component.html',
  styleUrl: './simulation-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimulationPanelComponent {
  readonly commandRequested = output<SimulationCommand>();

  protected setConnectivity(event: Event): void {
    const mode = readEventValue(event);
    if (isConnectivityMode(mode)) {
      this.commandRequested.emit({ type: 'connectivity.set', mode });
    }
  }
}
