import { Routes } from '@angular/router';

export const KITCHEN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/kitchen-page.component').then((module) => module.KitchenPageComponent),
    title: 'Kitchen Monitor · Sahm Food',
  },
];
