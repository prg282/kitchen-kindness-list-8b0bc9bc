export type CategoryType = 
  | 'produce' 
  | 'dairy' 
  | 'meat' 
  | 'pantry' 
  | 'frozen' 
  | 'bakery' 
  | 'beverages' 
  | 'spices'
  | 'other';

export interface GroceryItem {
  id: string;
  name: string;
  category: CategoryType;
  checked: boolean;
  created_by?: string;
  quantity?: string;
}

export interface KnownItem {
  id: string;
  name: string;
  category: CategoryType;
  usage_count: number;
  last_used: string;
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
    name: 'Fruit & Veg',
    icon: '🥬',
    keywords: [
      'apple', 'banana', 'orange', 'lemon', 'lime', 'grape', 'strawberry', 'blueberry',
      'raspberry', 'blackberry', 'mango', 'pineapple', 'watermelon', 'cantaloupe', 'peach',
      'pear', 'plum', 'cherry', 'kiwi', 'avocado', 'tomato', 'cucumber', 'carrot', 'celery',
      'lettuce', 'spinach', 'kale', 'broccoli', 'cauliflower', 'pepper', 'onion', 'garlic',
      'potato', 'sweet potato', 'corn', 'courgette', 'zucchini', 'squash', 'mushroom', 'asparagus',
      'green bean', 'runner bean', 'pea', 'cabbage', 'radish', 'beetroot', 'beet', 'aubergine', 'eggplant', 'artichoke', 'leek',
      'herb', 'basil', 'coriander', 'cilantro', 'parsley', 'mint', 'ginger', 'jalapeño', 'chilli', 'fruit', 'vegetable', 'veg',
      'salad', 'greens', 'rocket', 'arugula', 'romaine', 'spring onion'
    ],
  },
  {
    id: 'dairy',
    name: 'Dairy & Eggs',
    icon: '🥛',
    keywords: [
      'milk', 'cheese', 'yoghurt', 'yogurt', 'butter', 'cream', 'egg', 'cottage cheese', 'sour cream',
      'cream cheese', 'mozzarella', 'cheddar', 'parmesan', 'feta', 'brie', 'gouda',
      'half and half', 'whipping cream', 'almond milk', 'oat milk', 'soya milk', 'soy milk', 'coconut milk',
      'greek yoghurt', 'greek yogurt', 'kefir', 'ghee', 'margarine'
    ],
  },
  {
    id: 'meat',
    name: 'Meat & Seafood',
    icon: '🥩',
    keywords: [
      'chicken', 'beef', 'pork', 'turkey', 'lamb', 'bacon', 'sausage', 'ham', 'steak',
      'mince', 'minced beef', 'minced turkey', 'ground beef', 'ground turkey', 'fish', 'salmon', 'tuna', 'prawns', 'shrimp', 'crab', 'lobster',
      'scallop', 'cod', 'tilapia', 'halibut', 'trout', 'mahi', 'duck', 'veal', 'ribs',
      'brisket', 'tenderloin', 'wing', 'thigh', 'breast', 'drumstick', 'hot dog', 'deli meat',
      'pepperoni', 'salami', 'prosciutto', 'anchovies', 'mussels', 'clam', 'oyster', 'calamari'
    ],
  },
  {
    id: 'spices',
    name: 'Spices & Seasonings',
    icon: '🧂',
    keywords: [
      'salt', 'pepper', 'cumin', 'paprika', 'turmeric', 'cinnamon', 'nutmeg', 'oregano',
      'thyme', 'rosemary', 'sage', 'bay leaf', 'bay leaves', 'coriander', 'cardamom',
      'clove', 'cloves', 'allspice', 'cayenne', 'chili powder', 'curry powder', 'curry',
      'garam masala', 'chinese five spice', 'italian seasoning', 'herbs de provence',
      'saffron', 'fennel seed', 'mustard seed', 'celery seed', 'poppy seed', 'sesame seed',
      'caraway', 'dill', 'tarragon', 'marjoram', 'savory', 'anise', 'star anise',
      'vanilla', 'vanilla extract', 'almond extract', 'peppercorn', 'white pepper',
      'red pepper flakes', 'crushed red pepper', 'seasoning', 'spice', 'spice blend',
      'everything bagel seasoning', 'garlic powder', 'onion powder', 'smoked paprika',
      'chili flakes', 'za\'atar', 'sumac', 'harissa', 'berbere', 'ras el hanout',
      'old bay', 'cajun seasoning', 'taco seasoning', 'ranch seasoning', 'lemon pepper'
    ],
  },
  {
    id: 'pantry',
    name: 'Cupboard',
    icon: '🫙',
    keywords: [
      'rice', 'pasta', 'bread', 'flour', 'sugar', 'oil', 'olive oil',
      'vinegar', 'soy sauce', 'ketchup', 'mustard', 'mayo', 'mayonnaise', 'sauce',
      'cereal', 'porridge', 'oatmeal', 'granola', 'nut', 'almond', 'peanut', 'walnut',
      'cashew', 'seed', 'bean', 'lentil', 'chickpea', 'tinned', 'canned', 'tomato sauce', 'broth',
      'stock', 'soup', 'noodle', 'cracker', 'crisp', 'chip', 'pretzel', 'popcorn', 'snack', 'biscuit', 'cookie',
      'sweets', 'candy', 'chocolate', 'honey', 'golden syrup', 'maple syrup', 'jam', 'jelly', 'marmalade', 'peanut butter',
      'nutella', 'tortilla', 'wrap', 'taco', 'quinoa', 'couscous', 'breadcrumb'
    ],
  },
  {
    id: 'frozen',
    name: 'Frozen',
    icon: '❄️',
    keywords: [
      'frozen', 'ice cream', 'pizza', 'frozen vegetable', 'frozen fruit', 'frozen meal',
      'frozen dinner', 'ice lolly', 'lolly', 'popsicle', 'sorbet', 'gelato', 'frozen yoghurt', 'frozen yogurt', 'waffle', 'pancake',
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
    name: 'Drinks',
    icon: '🧃',
    keywords: [
      'water', 'juice', 'fizzy drink', 'soda', 'pop', 'coffee', 'tea', 'beer', 'wine', 'alcohol', 'liquor',
      'sparkling water', 'seltzer', 'lemonade', 'iced tea', 'energy drink', 'sports drink',
      'smoothie', 'kombucha', 'coconut water', 'apple juice', 'orange juice', 'grape juice',
      'cranberry juice', 'espresso', 'cold brew', 'chai', 'matcha', 'hot chocolate', 'cocoa', 'squash', 'cordial'
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
