import { Routes } from '@angular/router';

import { AppShellComponent } from './core/layout/app-shell/app-shell.component';

export const routes: Routes = [
  {
    path: '',
    component: AppShellComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'orders' },
      {
        path: 'orders',
        loadChildren: () =>
          import('./features/orders/orders.routes').then((module) => module.ORDERS_ROUTES),
      },
      {
        path: 'products',
        loadChildren: () =>
          import('./features/products/products.routes').then((module) => module.PRODUCTS_ROUTES),
      },
      {
        path: 'kitchen',
        loadChildren: () =>
          import('./features/kitchen/kitchen.routes').then((module) => module.KITCHEN_ROUTES),
      },
      {
        path: 'offline-queue',
        loadChildren: () =>
          import('./features/offline-queue/offline-queue.routes').then(
            (module) => module.OFFLINE_QUEUE_ROUTES,
          ),
      },
    ],
  },
  {
    path: '**',
    loadComponent: () =>
      import('./shared/ui/not-found/not-found.component').then(
        (module) => module.NotFoundComponent,
      ),
  },
];
