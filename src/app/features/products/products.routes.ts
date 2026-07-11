import { Routes } from '@angular/router';

export const PRODUCTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/products-page.component').then((module) => module.ProductsPageComponent),
    title: 'Product Search · Sahm Food',
  },
];
