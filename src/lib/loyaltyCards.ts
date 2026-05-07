// Catalogue of common South African rewards / loyalty cards.
// Used to pre-fill card details when adding or scanning a card.

export interface LoyaltyBrand {
  id: string;
  name: string;
  color: string;
  // Optional barcode hints used to auto-detect the brand from a scanned value.
  // `prefixes` matches the start of the barcode, `lengths` matches the total length.
  prefixes?: string[];
  lengths?: number[];
  category?: string;
}

export const SA_LOYALTY_BRANDS: LoyaltyBrand[] = [
  // Grocery & supermarkets
  { id: 'pnp-smartshopper', name: 'Pick n Pay Smart Shopper', color: '#0033a0', prefixes: ['633'], lengths: [13, 16], category: 'Groceries' },
  { id: 'checkers-xtra', name: 'Checkers Xtra Savings', color: '#e30613', category: 'Groceries' },
  { id: 'shoprite-xtra', name: 'Shoprite Xtra Savings', color: '#e2231a', category: 'Groceries' },
  { id: 'woolworths-wrewards', name: 'Woolworths WRewards', color: '#000000', category: 'Groceries' },
  { id: 'spar-rewards', name: 'SPAR Rewards', color: '#006837', category: 'Groceries' },
  { id: 'food-lovers', name: "Food Lover's Market Freshly Picked", color: '#76b82a', category: 'Groceries' },

  // Health & beauty
  { id: 'clicks-clubcard', name: 'Clicks ClubCard', color: '#e4002b', prefixes: ['9418'], lengths: [13], category: 'Health & Beauty' },
  { id: 'dischem-benefit', name: 'Dis-Chem Benefit', color: '#0072ce', category: 'Health & Beauty' },

  // Fashion & department
  { id: 'edgars-thanku', name: 'Edgars Thank U', color: '#c8102e', category: 'Fashion' },
  { id: 'tfg-rewards', name: 'TFG Rewards (Foschini, Markham, Totalsports)', color: '#000000', category: 'Fashion' },
  { id: 'mrp-mirewards', name: 'Mr Price miRewards', color: '#e4002b', category: 'Fashion' },
  { id: 'cotton-on', name: 'Cotton On & Co Perks', color: '#000000', category: 'Fashion' },
  { id: 'cape-union', name: 'Cape Union Mart Explorer', color: '#a52a2a', category: 'Outdoor' },
  { id: 'sportsmans', name: "Sportsmans Warehouse Pro", color: '#003087', category: 'Outdoor' },

  // Wholesale & home
  { id: 'makro-mcard', name: 'Makro mCard', color: '#003da5', category: 'Wholesale' },
  { id: 'game-world', name: 'Game World Rewards', color: '#e4002b', category: 'Wholesale' },
  { id: 'builders', name: 'Builders Rewards', color: '#f47920', category: 'Home & DIY' },

  // Fuel
  { id: 'engen-1plus', name: 'Engen 1Plus', color: '#003594', category: 'Fuel' },
  { id: 'shell-vplus', name: 'Shell V+ Rewards', color: '#fbce07', category: 'Fuel' },
  { id: 'bp-rewards', name: 'BP Rewards', color: '#009a44', category: 'Fuel' },
  { id: 'astron-rewards', name: 'Astron Energy Rewards', color: '#ed1c24', category: 'Fuel' },

  // Banking & lifestyle
  { id: 'fnb-ebucks', name: 'FNB eBucks', color: '#009edb', category: 'Banking' },
  { id: 'absa-rewards', name: 'Absa Rewards', color: '#af1685', category: 'Banking' },
  { id: 'standard-ucount', name: 'Standard Bank UCount', color: '#0033a1', category: 'Banking' },
  { id: 'nedbank-greenbacks', name: 'Nedbank Greenbacks', color: '#006a4e', category: 'Banking' },
  { id: 'discovery-vitality', name: 'Discovery Vitality', color: '#ed1c24', category: 'Lifestyle' },
  { id: 'momentum-multiply', name: 'Momentum Multiply', color: '#0090d4', category: 'Lifestyle' },

  // Food & coffee
  { id: 'kauai-nourish', name: 'Kauai Nourish', color: '#84bd00', category: 'Restaurants' },
  { id: 'mugg-bean', name: 'Mugg & Bean Rewards', color: '#5d3a1a', category: 'Restaurants' },
  { id: 'wimpy-rewards', name: 'Wimpy Rewards', color: '#d9232e', category: 'Restaurants' },
  { id: 'vida-club', name: 'Vida e Caffè Club', color: '#e4002b', category: 'Restaurants' },
  { id: 'seattle-coffee', name: 'Seattle Coffee Co Loyalty', color: '#1f3a5f', category: 'Restaurants' },

  // Books & entertainment
  { id: 'exclusive-books', name: 'Exclusive Books Fanatics', color: '#d4a017', category: 'Books' },
  { id: 'avis-preferred', name: 'Avis Preferred', color: '#d4002a', category: 'Travel' },
  { id: 'voyager', name: 'SAA Voyager', color: '#0033a0', category: 'Travel' },
  { id: 'protea-prokard', name: 'Protea Hotels Prokard', color: '#a8915d', category: 'Travel' },
];

/**
 * Best-effort match of a scanned barcode to a known SA loyalty brand.
 * Many cards do not embed a brand identifier in the barcode, so this only
 * returns a brand when there is a confident prefix/length match.
 */
export function detectBrandFromBarcode(value: string): LoyaltyBrand | null {
  if (!value) return null;
  const v = value.trim();
  for (const brand of SA_LOYALTY_BRANDS) {
    const prefixOk = brand.prefixes?.some((p) => v.startsWith(p));
    const lengthOk = brand.lengths ? brand.lengths.includes(v.length) : true;
    if (prefixOk && lengthOk) return brand;
  }
  return null;
}
