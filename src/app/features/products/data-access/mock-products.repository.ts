import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';

import { Product } from '../domain/product.model';
import { generateMockProducts } from './product-mock.generator';
import { ProductsRepository } from './products.repository';

@Injectable()
export class MockProductsRepository implements ProductsRepository {
  loadProducts(): Observable<readonly Product[]> {
    return of(generateMockProducts()).pipe(delay(550));
  }
}
