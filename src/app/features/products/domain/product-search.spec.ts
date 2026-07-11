import { describe, expect, it } from 'vitest';

import { generateMockProducts } from '../data-access/product-mock.generator';
import { DEFAULT_PRODUCT_FILTERS } from './product.model';
import { createHighlightSegments, navigateProductIndex, searchProducts } from './product-search';

const PRODUCTS = generateMockProducts();

describe('product search domain', () => {
  it('generates and searches the large dataset within a bounded result set', () => {
    expect(PRODUCTS.length).toBeGreaterThanOrEqual(500);
    const result = searchProducts(PRODUCTS, '', DEFAULT_PRODUCT_FILTERS);
    expect(result.totalMatches).toBe(PRODUCTS.length);
    expect(result.products).toHaveLength(60);
    expect(result.limited).toBe(true);
  });

  it('filters case-insensitively by product name', () => {
    const result = searchProducts(PRODUCTS, 'KOSHARI', DEFAULT_PRODUCT_FILTERS);
    expect(result.totalMatches).toBeGreaterThan(0);
    expect(result.products.every((product) => product.name.toLowerCase().includes('koshari'))).toBe(
      true,
    );
  });

  it('combines category and availability filters', () => {
    const result = searchProducts(PRODUCTS, '', {
      category: 'drinks',
      availability: 'unavailable',
    });
    expect(result.totalMatches).toBeGreaterThan(0);
    expect(
      result.products.every(
        (product) => product.category === 'drinks' && product.availability === 'unavailable',
      ),
    ).toBe(true);
  });

  it('navigates forward, backward, and wraps at the boundaries', () => {
    const products = PRODUCTS.slice(0, 3).map((product) => ({
      ...product,
      availability: 'available' as const,
    }));
    expect(navigateProductIndex(-1, 'next', products)).toBe(0);
    expect(navigateProductIndex(2, 'next', products)).toBe(0);
    expect(navigateProductIndex(0, 'previous', products)).toBe(2);
    expect(navigateProductIndex(-1, 'previous', [])).toBe(-1);
  });

  it('skips unavailable products during keyboard navigation', () => {
    const products = PRODUCTS.slice(0, 3).map((product, index) => ({
      ...product,
      availability: index === 1 ? ('unavailable' as const) : ('available' as const),
    }));
    expect(navigateProductIndex(0, 'next', products)).toBe(2);
    expect(navigateProductIndex(2, 'previous', products)).toBe(0);
  });

  it('splits every match into safe text segments without interpreting markup', () => {
    expect(createHighlightSegments('Classic Koshari Koshari', 'koshari')).toEqual([
      { text: 'Classic ', matched: false },
      { text: 'Koshari', matched: true },
      { text: ' ', matched: false },
      { text: 'Koshari', matched: true },
    ]);
    expect(createHighlightSegments('<img src=x> Koshari', '<img')).toEqual([
      { text: '<img', matched: true },
      { text: ' src=x> Koshari', matched: false },
    ]);
  });
});
