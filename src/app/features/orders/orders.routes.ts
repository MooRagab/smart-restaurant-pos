import { Routes } from '@angular/router';

export const ORDERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/orders-page.component').then((module) => module.OrdersPageComponent),
    title: 'Live Orders · Sahm Food',
  },
];
