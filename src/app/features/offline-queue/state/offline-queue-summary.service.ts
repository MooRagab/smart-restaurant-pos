import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class OfflineQueueSummaryService {
  private readonly pendingCountSignal = signal(0);

  readonly pendingCount = this.pendingCountSignal.asReadonly();

  setPendingCount(count: number): void {
    this.pendingCountSignal.set(Math.max(0, Math.floor(count)));
  }
}
