import { Injectable, inject } from '@angular/core';

import { OfflineQueueFacade } from './offline-queue.facade';

@Injectable({ providedIn: 'root' })
export class OfflineQueueSummaryService {
  private readonly facade = inject(OfflineQueueFacade);

  readonly pendingCount = this.facade.pendingCount;
  readonly failedCount = this.facade.failedCount;
  readonly processing = this.facade.processing;
  readonly progress = this.facade.progress;
}
