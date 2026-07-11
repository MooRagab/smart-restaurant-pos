import { Injectable, computed, signal } from '@angular/core';

import { ConnectivityMode, ConnectivityState } from '../../shared/types/connectivity';

@Injectable({ providedIn: 'root' })
export class ConnectivityService {
  private readonly stateSignal = signal<ConnectivityState>({
    mode: 'online',
    isOnline: true,
    changedAt: new Date(),
  });

  readonly state = this.stateSignal.asReadonly();
  readonly isOnline = computed(() => this.stateSignal().isOnline);
  readonly label = computed(() => {
    const mode = this.stateSignal().mode;
    return mode === 'online' ? 'Online' : mode === 'offline' ? 'Offline' : 'Unstable';
  });

  setMode(mode: ConnectivityMode): void {
    this.stateSignal.set({ mode, isOnline: mode !== 'offline', changedAt: new Date() });
  }
}
