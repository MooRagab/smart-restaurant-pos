import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { AppError } from '../../../../shared/types/app-error';

@Component({
  selector: 'app-order-workspace-state',
  templateUrl: './order-workspace-state.component.html',
  styleUrl: './order-workspace-state.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderWorkspaceStateComponent {
  readonly state = input.required<'loading' | 'empty' | 'error'>();
  readonly error = input<AppError | null>(null);
  readonly retry = output<void>();
  readonly clearFilters = output<void>();
}
