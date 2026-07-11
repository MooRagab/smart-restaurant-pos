import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  isDevMode,
  signal,
} from '@angular/core';

import { ConnectivityService } from '../../../core/connectivity/connectivity.service';
import { ConfirmationDialogComponent } from '../../../shared/ui/confirmation-dialog/confirmation-dialog.component';
import { isConnectivityMode } from '../../../shared/types/connectivity';
import { readEventValue } from '../../../shared/utilities/dom-event';
import { OfflineQueueFacade } from '../state/offline-queue.facade';
import { QueueOperationListComponent } from '../ui/queue-operation-list/queue-operation-list.component';

@Component({
  selector: 'app-offline-queue-page',
  imports: [ConfirmationDialogComponent, QueueOperationListComponent],
  templateUrl: './offline-queue-page.component.html',
  styleUrl: './offline-queue-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfflineQueuePageComponent {
  protected readonly facade = inject(OfflineQueueFacade);
  protected readonly connectivity = inject(ConnectivityService);
  protected readonly developmentMode = isDevMode();
  protected readonly pending = computed(() =>
    this.facade.operations().filter((operation) => operation.state === 'pending'),
  );
  protected readonly processing = computed(() =>
    this.facade.operations().filter((operation) => operation.state === 'processing'),
  );
  protected readonly failed = computed(() =>
    this.facade.operations().filter((operation) => operation.state === 'failed'),
  );
  protected readonly completed = computed(() =>
    this.facade.operations().filter((operation) => operation.state === 'completed'),
  );
  protected readonly confirmation = signal<
    | { readonly type: 'clear-completed' }
    | { readonly type: 'remove-failed'; readonly id: string }
    | null
  >(null);

  protected setConnectivity(event: Event): void {
    const mode = readEventValue(event);
    if (isConnectivityMode(mode)) {
      this.connectivity.setMode(mode);
    }
  }

  protected requestClearCompleted(): void {
    this.confirmation.set({ type: 'clear-completed' });
  }

  protected requestRemoveFailed(id: string): void {
    this.confirmation.set({ type: 'remove-failed', id });
  }

  protected confirmAction(): void {
    const action = this.confirmation();
    this.confirmation.set(null);
    if (action?.type === 'clear-completed') {
      this.facade.clearCompleted();
    } else if (action?.type === 'remove-failed') {
      this.facade.removeFailed(action.id);
    }
  }
}
