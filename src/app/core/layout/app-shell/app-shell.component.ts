import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  isDevMode,
  signal,
} from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { ApplicationShell, Branch } from '../../../shared/types/application-shell';
import { ToastContainerComponent } from '../../../shared/ui/toast-container/toast-container.component';
import { OfflineQueueSummaryService } from '../../../features/offline-queue/state/offline-queue-summary.service';
import { ConnectivityService } from '../../connectivity/connectivity.service';
import { isConnectivityMode } from '../../../shared/types/connectivity';
import { readEventValue } from '../../../shared/utilities/dom-event';
import { SimulationCommand } from '../../../features/simulation/domain/simulation-command.model';
import { DevelopmentSimulationService } from '../../../features/simulation/state/development-simulation.service';
import { GlobalSimulationCoordinator } from '../../../features/simulation/state/global-simulation.coordinator';
import { SimulationPanelComponent } from '../../../features/simulation/ui/simulation-panel/simulation-panel.component';

const SHELL_DATA: ApplicationShell = {
  branches: [
    { id: 'nasr-city', name: 'Nasr City', location: 'Abbas El Akkad' },
    { id: 'new-cairo', name: 'New Cairo', location: 'Fifth Settlement' },
    { id: 'sheikh-zayed', name: 'Sheikh Zayed', location: 'Arkan Plaza' },
  ],
  currentUser: {
    id: 'usr-mohamed-ragab',
    displayName: 'Mohamed Ragab',
    initials: 'MR',
    role: 'Branch Manager',
  },
  navigation: [
    { label: 'Live Orders', shortLabel: 'Orders', path: '/orders', icon: 'orders' },
    { label: 'Product Search', shortLabel: 'Products', path: '/products', icon: 'products' },
    { label: 'Kitchen Monitor', shortLabel: 'Kitchen', path: '/kitchen', icon: 'kitchen' },
    { label: 'Offline Queue', shortLabel: 'Queue', path: '/offline-queue', icon: 'queue' },
  ],
};

@Component({
  selector: 'app-shell',
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    ToastContainerComponent,
    SimulationPanelComponent,
  ],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent {
  private readonly connectivity = inject(ConnectivityService);
  private readonly queueSummary = inject(OfflineQueueSummaryService);
  private readonly simulation = inject(DevelopmentSimulationService);

  protected readonly shell = SHELL_DATA;
  protected readonly navigationCollapsed = signal(false);
  protected readonly mobileNavigationOpen = signal(false);
  protected readonly selectedBranchId = signal(SHELL_DATA.branches[0]?.id ?? '');
  protected readonly selectedBranch = computed<Branch>(() => {
    return (
      this.shell.branches.find((branch) => branch.id === this.selectedBranchId()) ??
      this.shell.branches[0]!
    );
  });
  protected readonly connection = this.connectivity.state;
  protected readonly connectionLabel = this.connectivity.label;
  protected readonly pendingCount = this.queueSummary.pendingCount;
  protected readonly failedCount = this.queueSummary.failedCount;
  protected readonly synchronizationProcessing = this.queueSummary.processing;
  protected readonly synchronizationProgress = this.queueSummary.progress;
  protected readonly developmentMode = isDevMode();

  constructor() {
    inject(GlobalSimulationCoordinator);
  }

  protected toggleNavigation(): void {
    this.navigationCollapsed.update((collapsed) => !collapsed);
  }

  protected toggleMobileNavigation(): void {
    this.mobileNavigationOpen.update((open) => !open);
  }

  protected closeMobileNavigation(): void {
    this.mobileNavigationOpen.set(false);
  }

  protected selectBranch(event: Event): void {
    const branchId = readEventValue(event);
    if (branchId !== null && this.shell.branches.some((branch) => branch.id === branchId)) {
      this.selectedBranchId.set(branchId);
    }
  }

  protected setConnectivityMode(event: Event): void {
    const mode = readEventValue(event);
    if (isConnectivityMode(mode)) {
      this.connectivity.setMode(mode);
    }
  }

  protected runSimulation(command: SimulationCommand): void {
    this.simulation.dispatch(command);
  }
}
