import {
  Allergen,
  DietaryTag,
  Product,
  ProductCategory,
  ProductIcon,
} from '../domain/product.model';

type DishFixture = Readonly<{
  name: string;
  category: ProductCategory;
  basePrice: number;
  preparationMinutes: number;
  dietaryTags: readonly DietaryTag[];
  allergens: readonly Allergen[];
  icon: ProductIcon;
}>;

const DISHES: readonly DishFixture[] = [
  {
    name: 'Koshari',
    category: 'main-dishes',
    basePrice: 3500,
    preparationMinutes: 10,
    dietaryTags: ['vegan'],
    allergens: ['gluten'],
    icon: 'bowl',
  },
  {
    name: 'Chicken Molokhia with Rice',
    category: 'main-dishes',
    basePrice: 8500,
    preparationMinutes: 22,
    dietaryTags: ['high-protein'],
    allergens: [],
    icon: 'plate',
  },
  {
    name: 'Cairo Fattah',
    category: 'main-dishes',
    basePrice: 10500,
    preparationMinutes: 24,
    dietaryTags: ['high-protein'],
    allergens: ['gluten'],
    icon: 'plate',
  },
  {
    name: 'Mahshi Selection',
    category: 'main-dishes',
    basePrice: 6800,
    preparationMinutes: 18,
    dietaryTags: ['vegan'],
    allergens: [],
    icon: 'plate',
  },
  {
    name: 'Grilled Kofta',
    category: 'main-dishes',
    basePrice: 11500,
    preparationMinutes: 20,
    dietaryTags: ['high-protein', 'gluten-free'],
    allergens: [],
    icon: 'plate',
  },
  {
    name: 'Baladi Hawawshi',
    category: 'sandwiches',
    basePrice: 5500,
    preparationMinutes: 14,
    dietaryTags: ['high-protein'],
    allergens: ['gluten'],
    icon: 'sandwich',
  },
  {
    name: 'Alexandrian Liver Sandwich',
    category: 'sandwiches',
    basePrice: 4200,
    preparationMinutes: 9,
    dietaryTags: ['high-protein'],
    allergens: ['gluten'],
    icon: 'sandwich',
  },
  {
    name: 'Chicken Shawerma Fino',
    category: 'sandwiches',
    basePrice: 5200,
    preparationMinutes: 11,
    dietaryTags: ['high-protein'],
    allergens: ['gluten', 'sesame'],
    icon: 'sandwich',
  },
  {
    name: 'Taameya Sandwich',
    category: 'breakfast',
    basePrice: 2200,
    preparationMinutes: 6,
    dietaryTags: ['vegan'],
    allergens: ['gluten', 'sesame'],
    icon: 'sandwich',
  },
  {
    name: 'Foul Medames',
    category: 'breakfast',
    basePrice: 2800,
    preparationMinutes: 7,
    dietaryTags: ['vegan', 'gluten-free'],
    allergens: [],
    icon: 'bowl',
  },
  {
    name: 'Shakshuka',
    category: 'breakfast',
    basePrice: 3800,
    preparationMinutes: 10,
    dietaryTags: ['vegetarian', 'high-protein'],
    allergens: ['eggs'],
    icon: 'plate',
  },
  {
    name: 'Baladi Pickles',
    category: 'sides',
    basePrice: 1200,
    preparationMinutes: 2,
    dietaryTags: ['vegan', 'gluten-free'],
    allergens: [],
    icon: 'bowl',
  },
  {
    name: 'Tahini Salad',
    category: 'sides',
    basePrice: 1800,
    preparationMinutes: 4,
    dietaryTags: ['vegan', 'gluten-free'],
    allergens: ['sesame'],
    icon: 'bowl',
  },
  {
    name: 'Roz Bel Laban',
    category: 'desserts',
    basePrice: 2800,
    preparationMinutes: 4,
    dietaryTags: ['vegetarian', 'gluten-free'],
    allergens: ['dairy'],
    icon: 'dessert',
  },
  {
    name: 'Om Ali',
    category: 'desserts',
    basePrice: 4200,
    preparationMinutes: 12,
    dietaryTags: ['vegetarian'],
    allergens: ['dairy', 'gluten', 'nuts'],
    icon: 'dessert',
  },
  {
    name: 'Basbousa',
    category: 'desserts',
    basePrice: 3200,
    preparationMinutes: 3,
    dietaryTags: ['vegetarian'],
    allergens: ['dairy', 'gluten', 'nuts'],
    icon: 'dessert',
  },
  {
    name: 'Karkadeh',
    category: 'drinks',
    basePrice: 1800,
    preparationMinutes: 3,
    dietaryTags: ['vegan', 'gluten-free'],
    allergens: [],
    icon: 'drink',
  },
  {
    name: 'Sobya',
    category: 'drinks',
    basePrice: 2200,
    preparationMinutes: 3,
    dietaryTags: ['vegetarian', 'gluten-free'],
    allergens: ['dairy'],
    icon: 'drink',
  },
  {
    name: 'Sugarcane Juice',
    category: 'drinks',
    basePrice: 2000,
    preparationMinutes: 3,
    dietaryTags: ['vegan', 'gluten-free'],
    allergens: [],
    icon: 'drink',
  },
  {
    name: 'Egyptian Tea',
    category: 'drinks',
    basePrice: 1500,
    preparationMinutes: 4,
    dietaryTags: ['vegan', 'gluten-free'],
    allergens: [],
    icon: 'drink',
  },
];

const STYLES = ['Classic', 'Sahm', 'Cairo', 'Alexandrian', "Chef's", 'Spicy'] as const;
const PORTIONS = ['Individual', 'Regular', 'Large', 'Sharing', 'Family', 'Value'] as const;

export function generateMockProducts(): readonly Product[] {
  const products: Product[] = [];
  for (const [dishIndex, dish] of DISHES.entries()) {
    for (const [styleIndex, style] of STYLES.entries()) {
      for (const [portionIndex, portion] of PORTIONS.entries()) {
        const index = products.length;
        products.push({
          id: `product-${(index + 1).toString().padStart(4, '0')}`,
          name: `${style} ${dish.name} · ${portion}`,
          category: dish.category,
          priceMinor: dish.basePrice + styleIndex * 250 + portionIndex * 450,
          availability: index % 13 === 0 ? 'unavailable' : 'available',
          preparationMinutes: dish.preparationMinutes + (portionIndex % 3) * 2,
          dietaryTags: dish.dietaryTags,
          allergens: dish.allergens,
          popularity: 40 + ((dishIndex * 17 + styleIndex * 11 + portionIndex * 7) % 61),
          icon: dish.icon,
        });
      }
    }
  }
  return products;
}
