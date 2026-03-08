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
      'raspberry', 'blackberry', 'mango', 'pineapple', 'watermelon', 'spanspek', 'cantaloupe', 'peach',
      'pear', 'plum', 'cherry', 'kiwi', 'avocado', 'avo', 'tomato', 'tamatie', 'cucumber', 'komkommer', 'carrot', 'wortel', 'celery',
      'lettuce', 'spinach', 'kale', 'broccoli', 'cauliflower', 'pepper', 'capsicum', 'onion', 'ui', 'garlic', 'knoffel',
      'potato', 'aartappel', 'sweet potato', 'patats', 'corn', 'mielies', 'baby marrow', 'courgette', 'zucchini', 'squash', 'gem squash', 'butternut',
      'mushroom', 'sampioene', 'asparagus', 'green bean', 'boontjie', 'pea', 'cabbage', 'kool', 'radish', 'beetroot', 'beet',
      'brinjal', 'aubergine', 'eggplant', 'artichoke', 'leek', 'prei',
      'herb', 'basil', 'coriander', 'parsley', 'mint', 'ginger', 'gemmer', 'jalapeño', 'chilli', 'fruit', 'vegetable', 'veg',
      'salad', 'greens', 'rocket', 'romaine', 'spring onion', 'naartjie', 'granadilla', 'litchi', 'guava', 'koejawel', 'prickly pear', 'turksvy'
    ],
  },
  {
    id: 'dairy',
    name: 'Dairy & Eggs',
    icon: '🥛',
    keywords: [
      'milk', 'melk', 'cheese', 'kaas', 'yoghurt', 'yogurt', 'butter', 'botter', 'cream', 'room', 'egg', 'eier', 'cottage cheese', 'sour cream',
      'cream cheese', 'mozzarella', 'cheddar', 'parmesan', 'feta', 'brie', 'gouda',
      'half and half', 'whipping cream', 'almond milk', 'oat milk', 'soy milk', 'coconut milk',
      'greek yoghurt', 'greek yogurt', 'kefir', 'ghee', 'margarine', 'stork', 'maas', 'amasi',
      'condensed milk', 'evaporated milk', 'long life milk'
    ],
  },
  {
    id: 'meat',
    name: 'Meat & Seafood',
    icon: '🥩',
    keywords: [
      'chicken', 'hoender', 'beef', 'bees', 'pork', 'vark', 'turkey', 'lamb', 'lam', 'bacon', 'spek', 'sausage', 'wors', 'boerewors', 'ham', 'steak',
      'mince', 'minced beef', 'minced turkey', 'ground beef', 'ground turkey', 'fish', 'vis', 'salmon', 'tuna', 'prawns', 'shrimp', 'crab', 'lobster',
      'kreef', 'crayfish', 'scallop', 'cod', 'hake', 'snoek', 'kingklip', 'yellowtail', 'geelbek', 'kabeljou',
      'tilapia', 'halibut', 'trout', 'duck', 'veal', 'ribs', 'tjop', 'chop',
      'brisket', 'tenderloin', 'wing', 'thigh', 'breast', 'drumstick', 'hot dog', 'vienna', 'polony', 'deli meat',
      'pepperoni', 'salami', 'biltong', 'droëwors', 'dried sausage', 'sosatie',
      'mussels', 'clam', 'oyster', 'calamari', 'skilpadjies'
    ],
  },
  {
    id: 'spices',
    name: 'Spices & Seasonings',
    icon: '🧂',
    keywords: [
      'salt', 'sout', 'pepper', 'peper', 'cumin', 'komyn', 'paprika', 'turmeric', 'borrie', 'cinnamon', 'kaneel', 'nutmeg', 'neutmuskaat', 'oregano',
      'thyme', 'rosemary', 'sage', 'bay leaf', 'bay leaves', 'laurierblaar', 'coriander', 'cardamom',
      'clove', 'cloves', 'naeltjies', 'allspice', 'cayenne', 'chili powder', 'curry powder', 'curry',
      'garam masala', 'masala', 'chinese five spice', 'italian seasoning',
      'saffron', 'fennel seed', 'mustard seed', 'celery seed', 'poppy seed', 'sesame seed',
      'dill', 'tarragon', 'marjoram', 'anise', 'star anise',
      'vanilla', 'vanilla extract', 'almond extract', 'peppercorn', 'white pepper',
      'red pepper flakes', 'crushed red pepper', 'seasoning', 'spice', 'spice blend',
      'garlic powder', 'onion powder', 'smoked paprika', 'braai spice', 'braai salt',
      'chilli flakes', 'peri peri', 'piri piri', 'chakalaka spice', 'rajah', 'aromat',
      'mrs balls', 'chutney powder', 'lemon pepper', 'steak spice'
    ],
  },
  {
    id: 'pantry',
    name: 'Cupboard',
    icon: '🫙',
    keywords: [
      'rice', 'rys', 'pasta', 'bread', 'brood', 'flour', 'meel', 'sugar', 'suiker', 'oil', 'olie', 'olive oil',
      'vinegar', 'asyn', 'soy sauce', 'ketchup', 'tamatie sous', 'mustard', 'mosterd', 'mayo', 'mayonnaise', 'sauce', 'sous',
      'cereal', 'porridge', 'pap', 'mieliepap', 'oatmeal', 'granola', 'nut', 'almond', 'peanut', 'grondboontjie', 'walnut',
      'cashew', 'seed', 'bean', 'boontjie', 'lentil', 'chickpea', 'tinned', 'canned', 'tomato sauce', 'broth',
      'stock', 'soup', 'sop', 'noodle', 'cracker', 'crisp', 'chip', 'chips', 'simba', 'lays', 'pretzel', 'popcorn', 'snack', 'biscuit',
      'rusk', 'beskuit', 'ouma rusk', 'provita', 'pronutro',
      'sweets', 'chocolate', 'sjokolade', 'honey', 'heuning', 'golden syrup', 'maple syrup', 'jam', 'konfyt', 'marmalade', 'peanut butter', 'grondboontjiebotter',
      'nutella', 'tortilla', 'wrap', 'taco', 'quinoa', 'couscous', 'breadcrumb', 'paneermeel',
      'marmite', 'bovril', 'mrs balls chutney', 'atchar', 'blatjang', 'chakalaka',
      'mealie meal', 'samp', 'dried beans', 'sugar beans'
    ],
  },
  {
    id: 'frozen',
    name: 'Frozen',
    icon: '❄️',
    keywords: [
      'frozen', 'bevrore', 'ice cream', 'roomys', 'pizza', 'frozen vegetable', 'frozen fruit', 'frozen meal',
      'frozen dinner', 'ice lolly', 'lolly', 'popsicle', 'sorbet', 'gelato', 'frozen yoghurt', 'frozen yogurt', 'waffle', 'pancake',
      'frozen fish', 'frozen chicken', 'frozen beef', 'ice', 'ys', 'frozen berry', 'frozen pizza',
      'frozen boerewors', 'frozen wors'
    ],
  },
  {
    id: 'bakery',
    name: 'Bakery',
    icon: '🥖',
    keywords: [
      'bread', 'brood', 'bagel', 'croissant', 'muffin', 'donut', 'doughnut', 'cake', 'koek', 'pie', 'pastei', 'pastry',
      'baguette', 'roll', 'bun', 'bolletjie', 'loaf', 'sourdough', 'suurdeeg', 'rye', 'wheat bread', 'white bread',
      'pita', 'naan', 'roti', 'vetkoek', 'focaccia', 'brioche', 'scone', 'danish', 'cinnamon roll', 'cupcake',
      'koeksister', 'melktert', 'hertzoggies', 'pannekoek'
    ],
  },
  {
    id: 'beverages',
    name: 'Drinks',
    icon: '🧃',
    keywords: [
      'water', 'juice', 'sap', 'cold drink', 'cooldrink', 'soda', 'fizzy drink', 'coffee', 'koffie', 'tea', 'tee', 'rooibos',
      'beer', 'bier', 'wine', 'wyn', 'alcohol', 'liquor', 'drank',
      'sparkling water', 'seltzer', 'lemonade', 'iced tea', 'energy drink', 'sports drink',
      'smoothie', 'kombucha', 'coconut water', 'apple juice', 'orange juice', 'grape juice',
      'cranberry juice', 'espresso', 'cold brew', 'chai', 'matcha', 'hot chocolate', 'cocoa',
      'oros', 'cordial', 'squash', 'ceres', 'liqui fruit', 'appletiser', 'grapetiser',
      'castle', 'windhoek', 'savanna', 'hunters', 'amarula'
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
