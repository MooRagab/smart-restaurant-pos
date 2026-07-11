import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { KitchenLoad } from '../../domain/kitchen.model';

@Component({
  selector: 'app-kitchen-metrics',
  templateUrl: './kitchen-metrics.component.html',
  styleUrl: './kitchen-metrics.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KitchenMetricsComponent {
  readonly load = input.required<KitchenLoad>();
}
