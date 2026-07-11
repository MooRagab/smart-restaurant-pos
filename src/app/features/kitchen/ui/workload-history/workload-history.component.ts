import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { WorkloadHistoryPoint } from '../../domain/kitchen.model';

@Component({
  selector: 'app-workload-history',
  templateUrl: './workload-history.component.html',
  styleUrl: './workload-history.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkloadHistoryComponent {
  readonly history = input.required<readonly WorkloadHistoryPoint[]>();

  protected time(timestamp: Date): string {
    return timestamp.toLocaleTimeString('en-EG', { hour: '2-digit', minute: '2-digit' });
  }
}
