export type CategoryType = 
  | 'produce' 
  | 'dairy' 
  | 'meat' 
  | 'pantry' 
  | 'frozen' 
  | 'bakery' 
  | 'beverages' 
  | 'other';

export interface GroceryItem {
  id: string;
  name: string;
  category: CategoryType;
  checked: boolean;
  quantity?: string;
}

export interface Category {
  id: CategoryType;
  name: string;
  icon: string;
  keywords: string[];
}

export const categories: Category[] = [
  {
    id: 'produce',
    name: 'Produce',
    icon: '🥬',
    keywords: [
      'apple', 'banana', 'orange', 'lemon', 'lime', 'grape', 'strawberry', 'blueberry',
      'raspberry', 'blackberry', 'mango', 'pineapple', 'watermelon', 'cantaloupe', 'peach',
      'pear', 'plum', 'cherry', 'kiwi', 'avocado', 'tomato', 'cucumber', 'carrot', 'celery',
      'lettuce', 'spinach', 'kale', 'broccoli', 'cauliflower', 'pepper', 'onion', 'garlic',
      'potato', 'sweet potato', 'corn', 'zucchini', 'squash', 'mushroom', 'asparagus',
      'green bean', 'pea', 'cabbage', 'radish', 'beet', 'eggplant', 'artichoke', 'leek',
      'herb', 'basil', 'cilantro', 'parsley', 'mint', 'ginger', 'jalapeño', 'fruit', 'vegetable',
      'salad', 'greens', 'arugula', 'romaine'
    ],
  },
  {
    id: 'dairy',
    name: 'Dairy & Eggs',
    icon: '🥛',
    keywords: [
      'milk', 'cheese', 'yogurt', 'butter', 'cream', 'egg', 'cottage cheese', 'sour cream',
      'cream cheese', 'mozzarella', 'cheddar', 'parmesan', 'feta', 'brie', 'gouda',
      'half and half', 'whipping cream', 'almond milk', 'oat milk', 'soy milk', 'coconut milk',
      'greek yogurt', 'kefir', 'ghee', 'margarine'
    ],
  },
  {
    id: 'meat',
    name: 'Meat & Seafood',
    icon: '🥩',
    keywords: [
      'chicken', 'beef', 'pork', 'turkey', 'lamb', 'bacon', 'sausage', 'ham', 'steak',
      'ground beef', 'ground turkey', 'fish', 'salmon', 'tuna', 'shrimp', 'crab', 'lobster',
      'scallop', 'cod', 'tilapia', 'halibut', 'trout', 'mahi', 'duck', 'veal', 'ribs',
      'brisket', 'tenderloin', 'wing', 'thigh', 'breast', 'drumstick', 'hot dog', 'deli meat',
      'pepperoni', 'salami', 'prosciutto', 'anchovies', 'mussels', 'clam', 'oyster', 'calamari'
    ],
  },
  {
    id: 'pantry',
    name: 'Pantry',
    icon: '🫙',
    keywords: [
      'rice', 'pasta', 'bread', 'flour', 'sugar', 'salt', 'pepper', 'oil', 'olive oil',
      'vinegar', 'soy sauce', 'ketchup', 'mustard', 'mayo', 'mayonnaise', 'sauce', 'spice',
      'seasoning', 'cereal', 'oatmeal', 'granola', 'nut', 'almond', 'peanut', 'walnut',
      'cashew', 'seed', 'bean', 'lentil', 'chickpea', 'canned', 'tomato sauce', 'broth',
      'stock', 'soup', 'noodle', 'cracker', 'chip', 'pretzel', 'popcorn', 'snack', 'cookie',
      'candy', 'chocolate', 'honey', 'maple syrup', 'jam', 'jelly', 'peanut butter',
      'nutella', 'tortilla', 'wrap', 'taco', 'quinoa', 'couscous', 'breadcrumb'
    ],
  },
  {
    id: 'frozen',
    name: 'Frozen',
    icon: '❄️',
    keywords: [
      'frozen', 'ice cream', 'pizza', 'frozen vegetable', 'frozen fruit', 'frozen meal',
      'frozen dinner', 'popsicle', 'sorbet', 'gelato', 'frozen yogurt', 'waffle', 'pancake',
      'frozen fish', 'frozen chicken', 'frozen beef', 'ice', 'frozen berry', 'frozen pizza'
    ],
  },
  {
    id: 'bakery',
    name: 'Bakery',
    icon: '🥖',
    keywords: [
      'bread', 'bagel', 'croissant', 'muffin', 'donut', 'doughnut', 'cake', 'pie', 'pastry',
      'baguette', 'roll', 'bun', 'loaf', 'sourdough', 'rye', 'wheat bread', 'white bread',
      'pita', 'naan', 'focaccia', 'brioche', 'scone', 'danish', 'cinnamon roll', 'cupcake'
    ],
  },
  {
    id: 'beverages',
    name: 'Beverages',
    icon: '🧃',
    keywords: [
      'water', 'juice', 'soda', 'pop', 'coffee', 'tea', 'beer', 'wine', 'alcohol', 'liquor',
      'sparkling water', 'seltzer', 'lemonade', 'iced tea', 'energy drink', 'sports drink',
      'smoothie', 'kombucha', 'coconut water', 'apple juice', 'orange juice', 'grape juice',
      'cranberry juice', 'espresso', 'cold brew', 'chai', 'matcha', 'hot chocolate', 'cocoa'
    ],
  },
];

export function categorizeItem(itemName: string): CategoryType {
  const lowercaseName = itemName.toLowerCase();
  
  for (const category of categories) {
    for (const keyword of category.keywords) {
      if (lowercaseName.includes(keyword) || keyword.includes(lowercaseName)) {
        return category.id;
      }
    }
  }
  
  return 'other';
}

export function getCategoryInfo(categoryId: CategoryType): Category {
  return categories.find(c => c.id === categoryId) || {
    id: 'other',
    name: 'Other',
    icon: '📦',
    keywords: [],
  };
}
