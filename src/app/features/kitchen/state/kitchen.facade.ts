import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subject } from 'rxjs';

import { KitchenEventSimulatorService } from '../data-access/kitchen-event-simulator.service';
import { KitchenLoad, KitchenLoadChangedEvent, KitchenLoadStatus } from '../domain/kitchen.model';
import { KitchenStore } from './kitchen.store';

@Injectable({ providedIn: 'root' })
export class KitchenFacade {
  private readonly store = inject(KitchenStore);
  private readonly simulator = inject(KitchenEventSimulatorService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly loadChangedSubject = new Subject<KitchenLoadChangedEvent>();

  readonly load = this.store.load;
  readonly loadChanged$: Observable<KitchenLoadChangedEvent> =
    this.loadChangedSubject.asObservable();

  constructor() {
    this.simulator.events$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((tick) => {
      const previousLoad = this.load();
      this.publish(previousLoad, this.store.applySimulationTick(tick));
    });
  }

  increaseLoad(): void {
    const previousLoad = this.load();
    this.publish(previousLoad, this.store.increaseLoad());
  }

  decreaseLoad(): void {
    const previousLoad = this.load();
    this.publish(previousLoad, this.store.decreaseLoad());
  }

  setStatus(status: KitchenLoadStatus): void {
    const previousLoad = this.load();
    this.publish(previousLoad, this.store.setStatus(status));
  }

  resetHistory(): void {
    const previousLoad = this.load();
    this.publish(previousLoad, this.store.resetHistory());
  }

  private publish(previousLoad: KitchenLoad, load: KitchenLoad): void {
    this.loadChangedSubject.next({ type: 'kitchen.load-changed', load, previousLoad });
  }
}
