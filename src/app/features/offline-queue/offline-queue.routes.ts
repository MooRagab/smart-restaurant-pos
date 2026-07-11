import { Routes } from '@angular/router';

export const OFFLINE_QUEUE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/offline-queue-page.component').then(
        (module) => module.OfflineQueuePageComponent,
      ),
    title: 'Offline Queue · Sahm Food',
  },
];
