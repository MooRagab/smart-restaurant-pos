import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { KitchenStationName, KitchenStation } from '../../domain/kitchen.model';

@Component({
  selector: 'app-station-workload',
  templateUrl: './station-workload.component.html',
  styleUrl: './station-workload.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StationWorkloadComponent {
  readonly stations = input.required<readonly KitchenStation[]>();

  protected label(name: KitchenStationName): string {
    return name.charAt(0).toUpperCase() + name.slice(1);
  }
}
