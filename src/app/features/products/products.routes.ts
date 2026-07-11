import { Routes } from '@angular/router';

import { MockProductsRepository } from './data-access/mock-products.repository';
import { RecentSearchesService } from './data-access/recent-searches.service';
import { PRODUCTS_REPOSITORY } from './data-access/products.repository';
import { ProductsFacade } from './state/products.facade';
import { ProductsStore } from './state/products.store';

export const PRODUCTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/products-page.component').then((module) => module.ProductsPageComponent),
    title: 'Product Search · Sahm Food',
    providers: [
      ProductsStore,
      ProductsFacade,
      RecentSearchesService,
      MockProductsRepository,
      { provide: PRODUCTS_REPOSITORY, useExisting: MockProductsRepository },
    ],
  },
];
