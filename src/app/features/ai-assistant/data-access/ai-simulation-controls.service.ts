import { Injectable, computed, signal } from '@angular/core';

import { AiSimulationOptions, AiSimulationOutcome } from '../domain/ai-recommendation.model';

@Injectable()
export class AiSimulationControlsService {
  private readonly outcomeSignal = signal<AiSimulationOutcome>('auto');
  private readonly slowSignal = signal(false);

  readonly outcome = this.outcomeSignal.asReadonly();
  readonly slow = this.slowSignal.asReadonly();
  readonly options = computed<AiSimulationOptions>(() => ({
    outcome: this.outcomeSignal(),
    slow: this.slowSignal(),
  }));

  setOutcome(outcome: AiSimulationOutcome): void {
    this.outcomeSignal.set(outcome);
  }

  setSlow(slow: boolean): void {
    this.slowSignal.set(slow);
  }

  reset(): void {
    this.outcomeSignal.set('auto');
    this.slowSignal.set(false);
  }
}
