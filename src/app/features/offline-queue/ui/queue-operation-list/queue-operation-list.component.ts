import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { formatDate } from '../../../../shared/utilities/formatters';
import { QueuedOperation, QueueOperationState } from '../../domain/queued-operation.model';

@Component({
  selector: 'app-queue-operation-list',
  templateUrl: './queue-operation-list.component.html',
  styleUrl: './queue-operation-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QueueOperationListComponent {
  readonly title = input.required<string>();
  readonly state = input.required<QueueOperationState>();
  readonly operations = input.required<readonly QueuedOperation[]>();
  readonly retryRequested = output<string>();
  readonly removeRequested = output<string>();
  protected readonly date = formatDate;
}
