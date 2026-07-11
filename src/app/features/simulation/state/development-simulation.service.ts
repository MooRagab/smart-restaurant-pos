import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

import { SimulationCommand } from '../domain/simulation-command.model';

@Injectable({ providedIn: 'root' })
export class DevelopmentSimulationService {
  private readonly commandsSubject = new Subject<SimulationCommand>();

  readonly commands$: Observable<SimulationCommand> = this.commandsSubject.asObservable();

  dispatch(command: SimulationCommand): void {
    this.commandsSubject.next(command);
  }
}
