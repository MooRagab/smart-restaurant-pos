export type ProductId = string;
export type ProductCategory =
  'main-dishes' | 'sandwiches' | 'breakfast' | 'sides' | 'desserts' | 'drinks';
export type ProductAvailability = 'available' | 'unavailable';
export type DietaryTag = 'vegetarian' | 'vegan' | 'high-protein' | 'gluten-free' | 'dairy-free';
export type Allergen = 'gluten' | 'dairy' | 'sesame' | 'nuts' | 'eggs';
export type ProductIcon = 'bowl' | 'sandwich' | 'plate' | 'dessert' | 'drink';

export type Product = Readonly<{
  id: ProductId;
  name: string;
  category: ProductCategory;
  priceMinor: number;
  availability: ProductAvailability;
  preparationMinutes: number;
  dietaryTags: readonly DietaryTag[];
  allergens: readonly Allergen[];
  popularity: number;
  icon: ProductIcon;
}>;

export type ProductFilters = Readonly<{
  category: ProductCategory | 'all';
  availability: ProductAvailability | 'all';
}>;

export type ProductSearchResult = Readonly<{
  products: readonly Product[];
  totalMatches: number;
  limited: boolean;
}>;

export type HighlightSegment = Readonly<{
  text: string;
  matched: boolean;
}>;

export const PRODUCT_CATEGORIES: readonly ProductCategory[] = [
  'main-dishes',
  'sandwiches',
  'breakfast',
  'sides',
  'desserts',
  'drinks',
];

export const DEFAULT_PRODUCT_FILTERS: ProductFilters = {
  category: 'all',
  availability: 'all',
};

export const PRODUCT_RESULT_LIMIT = 60;
