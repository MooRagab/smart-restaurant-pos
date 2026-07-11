import { Injectable, signal } from '@angular/core';

import { createInitialKitchenLoad } from '../data-access/kitchen-mock.generator';
import {
  calculateKitchenStatus,
  calculatePreparationTime,
  clamp,
  updateStationLoad,
} from '../domain/kitchen-calculations';
import { KitchenLoad, KitchenLoadStatus, KitchenSimulationTick } from '../domain/kitchen.model';

@Injectable({ providedIn: 'root' })
export class KitchenStore {
  private readonly loadSignal = signal<KitchenLoad>(createInitialKitchenLoad());

  readonly load = this.loadSignal.asReadonly();

  applySimulationTick(tick: KitchenSimulationTick): KitchenLoad {
    return this.updateLoad(tick.overallDelta, tick.stationIndex, tick.stationDelta);
  }

  increaseLoad(): KitchenLoad {
    return this.updateLoad(8, this.loadSignal().revision % 5, 10);
  }

  decreaseLoad(): KitchenLoad {
    return this.updateLoad(-8, this.loadSignal().revision % 5, -10);
  }

  setStatus(status: KitchenLoadStatus): KitchenLoad {
    const target: Readonly<Record<KitchenLoadStatus, number>> = {
      normal: 45,
      busy: 72,
      critical: 92,
    };
    return this.replaceLoad(target[status]);
  }

  resetHistory(): KitchenLoad {
    const current = this.loadSignal();
    const next = {
      ...current,
      history: [
        {
          timestamp: new Date(),
          loadPercentage: current.overallLoadPercentage,
          status: current.status,
        },
      ],
      revision: current.revision + 1,
      updatedAt: new Date(),
    };
    this.loadSignal.set(next);
    return next;
  }

  private replaceLoad(targetLoad: number): KitchenLoad {
    const current = this.loadSignal();
    return this.updateLoad(
      targetLoad - current.overallLoadPercentage,
      current.revision % 5,
      targetLoad - current.stations[current.revision % 5]!.loadPercentage,
    );
  }

  private updateLoad(
    overallDelta: number,
    stationIndex: number,
    stationDelta: number,
  ): KitchenLoad {
    const current = this.loadSignal();
    const overallLoadPercentage = clamp(current.overallLoadPercentage + overallDelta, 0, 100);
    const stations = current.stations.map((station, index) =>
      updateStationLoad(
        station,
        index === stationIndex ? stationDelta : Math.round(overallDelta / 3),
        overallLoadPercentage,
      ),
    );
    const status = calculateKitchenStatus(overallLoadPercentage);
    const updatedAt = new Date();
    const next: KitchenLoad = {
      overallLoadPercentage,
      status,
      activeOrders: Math.max(4, Math.round(10 + overallLoadPercentage * 0.36)),
      averagePreparationMinutes: calculatePreparationTime(12, overallLoadPercentage)
        .estimatedMinutes,
      delayedOrders: Math.max(0, Math.round((overallLoadPercentage - 45) / 8)),
      availableStations: stations.filter((station) => station.availability === 'available').length,
      busyStations: stations.filter((station) => station.availability === 'busy').length,
      stations,
      history: [
        ...current.history,
        { timestamp: updatedAt, loadPercentage: overallLoadPercentage, status },
      ].slice(-24),
      revision: current.revision + 1,
      updatedAt,
    };
    this.loadSignal.set(next);
    return next;
  }
}
