import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

import { Product } from '../domain/product.model';

export type ProductsRepository = {
  loadProducts(): Observable<readonly Product[]>;
};

export const PRODUCTS_REPOSITORY = new InjectionToken<ProductsRepository>('PRODUCTS_REPOSITORY');
