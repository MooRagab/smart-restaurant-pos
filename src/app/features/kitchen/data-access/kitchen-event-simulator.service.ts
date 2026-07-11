import { Injectable } from '@angular/core';
import { Observable, interval, map, share } from 'rxjs';

import { KitchenSimulationTick } from '../domain/kitchen.model';

@Injectable({ providedIn: 'root' })
export class KitchenEventSimulatorService {
  readonly events$: Observable<KitchenSimulationTick> = interval(7_000).pipe(
    map((sequence) => ({
      sequence,
      overallDelta: [4, -2, 7, -4, 3][sequence % 5]!,
      stationIndex: (sequence * 3) % 5,
      stationDelta: [8, -5, 11, -7][sequence % 4]!,
    })),
    share(),
  );
}
