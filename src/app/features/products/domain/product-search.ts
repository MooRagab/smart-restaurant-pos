import {
  HighlightSegment,
  Product,
  ProductFilters,
  ProductSearchResult,
  PRODUCT_RESULT_LIMIT,
} from './product.model';

export function searchProducts(
  products: readonly Product[],
  query: string,
  filters: ProductFilters,
  limit = PRODUCT_RESULT_LIMIT,
): ProductSearchResult {
  const normalizedQuery = normalize(query);
  const matches = products
    .filter((product) => {
      const categoryMatches = filters.category === 'all' || product.category === filters.category;
      const availabilityMatches =
        filters.availability === 'all' || product.availability === filters.availability;
      const queryMatches =
        normalizedQuery.length === 0 || normalize(product.name).includes(normalizedQuery);
      return categoryMatches && availabilityMatches && queryMatches;
    })
    .sort((left, right) => compareProducts(left, right, normalizedQuery));

  return {
    products: matches.slice(0, limit),
    totalMatches: matches.length,
    limited: matches.length > limit,
  };
}

export function createHighlightSegments(text: string, query: string): readonly HighlightSegment[] {
  const normalizedQuery = normalize(query);
  if (normalizedQuery.length === 0) {
    return [{ text, matched: false }];
  }

  const normalizedText = normalize(text);
  const segments: HighlightSegment[] = [];
  let cursor = 0;
  let matchIndex = normalizedText.indexOf(normalizedQuery, cursor);
  while (matchIndex >= 0) {
    if (matchIndex > cursor) {
      segments.push({ text: text.slice(cursor, matchIndex), matched: false });
    }
    const matchEnd = matchIndex + normalizedQuery.length;
    segments.push({ text: text.slice(matchIndex, matchEnd), matched: true });
    cursor = matchEnd;
    matchIndex = normalizedText.indexOf(normalizedQuery, cursor);
  }
  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), matched: false });
  }
  return segments.length === 0 ? [{ text, matched: false }] : segments;
}

export function navigateProductIndex(
  currentIndex: number,
  direction: 'next' | 'previous',
  products: readonly Product[],
): number {
  const selectableIndexes = products
    .map((product, index) => ({ product, index }))
    .filter(({ product }) => product.availability === 'available')
    .map(({ index }) => index);
  if (selectableIndexes.length === 0) {
    return -1;
  }
  const position = selectableIndexes.indexOf(currentIndex);
  if (position === -1) {
    return direction === 'next' ? selectableIndexes[0]! : selectableIndexes.at(-1)!;
  }
  const offset = direction === 'next' ? 1 : -1;
  return selectableIndexes[
    (position + offset + selectableIndexes.length) % selectableIndexes.length
  ]!;
}

function compareProducts(left: Product, right: Product, query: string): number {
  if (query.length > 0) {
    const leftStarts = normalize(left.name).startsWith(query);
    const rightStarts = normalize(right.name).startsWith(query);
    if (leftStarts !== rightStarts) {
      return leftStarts ? -1 : 1;
    }
  }
  return right.popularity - left.popularity || left.name.localeCompare(right.name, 'en-EG');
}

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase('en-EG');
}
