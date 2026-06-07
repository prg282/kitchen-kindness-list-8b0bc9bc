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
  // Brand website domain — used to fetch a store logo via logo.clearbit.com.
  domain?: string;
}

export const SA_LOYALTY_BRANDS: LoyaltyBrand[] = [
  // Grocery & supermarkets
  { id: 'pnp-smartshopper', name: 'Pick n Pay Smart Shopper', color: '#0033a0', prefixes: ['633'], lengths: [13, 16], category: 'Groceries', domain: 'picknpay.co.za' },
  { id: 'checkers-xtra', name: 'Checkers Xtra Savings', color: '#e30613', category: 'Groceries', domain: 'checkers.co.za' },
  { id: 'shoprite-xtra', name: 'Shoprite Xtra Savings', color: '#e2231a', category: 'Groceries', domain: 'shoprite.co.za' },
  { id: 'woolworths-wrewards', name: 'Woolworths WRewards', color: '#000000', category: 'Groceries', domain: 'woolworths.co.za' },
  { id: 'spar-rewards', name: 'SPAR Rewards', color: '#006837', category: 'Groceries', domain: 'spar.co.za' },
  { id: 'food-lovers', name: "Food Lover's Market Freshly Picked", color: '#76b82a', category: 'Groceries', domain: 'foodloversmarket.co.za' },

  // Health & beauty
  { id: 'clicks-clubcard', name: 'Clicks ClubCard', color: '#e4002b', prefixes: ['9418'], lengths: [13], category: 'Health & Beauty', domain: 'clicks.co.za' },
  { id: 'dischem-benefit', name: 'Dis-Chem Benefit', color: '#0072ce', category: 'Health & Beauty', domain: 'dischem.co.za' },

  // Fashion & department
  { id: 'edgars-thanku', name: 'Edgars Thank U', color: '#c8102e', category: 'Fashion', domain: 'edgars.co.za' },
  { id: 'tfg-rewards', name: 'TFG Rewards (Foschini, Markham, Totalsports)', color: '#000000', category: 'Fashion', domain: 'tfg.co.za' },
  { id: 'mrp-mirewards', name: 'Mr Price miRewards', color: '#e4002b', category: 'Fashion', domain: 'mrp.com' },
  { id: 'cotton-on', name: 'Cotton On & Co Perks', color: '#000000', category: 'Fashion', domain: 'cottonon.com' },
  { id: 'cape-union', name: 'Cape Union Mart Explorer', color: '#a52a2a', category: 'Outdoor', domain: 'capeunionmart.co.za' },
  { id: 'sportsmans', name: "Sportsmans Warehouse Pro", color: '#003087', category: 'Outdoor', domain: 'sportsmanswarehouse.co.za' },

  // Wholesale & home
  { id: 'makro-mcard', name: 'Makro mCard', color: '#003da5', category: 'Wholesale', domain: 'makro.co.za' },
  { id: 'game-world', name: 'Game World Rewards', color: '#e4002b', category: 'Wholesale', domain: 'game.co.za' },
  { id: 'builders', name: 'Builders Rewards', color: '#f47920', category: 'Home & DIY', domain: 'builders.co.za' },

  // Fuel
  { id: 'engen-1plus', name: 'Engen 1Plus', color: '#003594', category: 'Fuel', domain: 'engen.co.za' },
  { id: 'shell-vplus', name: 'Shell V+ Rewards', color: '#fbce07', category: 'Fuel', domain: 'shell.co.za' },
  { id: 'bp-rewards', name: 'BP Rewards', color: '#009a44', category: 'Fuel', domain: 'bp.com' },
  { id: 'astron-rewards', name: 'Astron Energy Rewards', color: '#ed1c24', category: 'Fuel', domain: 'astronenergy.co.za' },

  // Banking & lifestyle
  { id: 'fnb-ebucks', name: 'FNB eBucks', color: '#009edb', category: 'Banking', domain: 'ebucks.com' },
  { id: 'absa-rewards', name: 'Absa Rewards', color: '#af1685', category: 'Banking', domain: 'absa.co.za' },
  { id: 'standard-ucount', name: 'Standard Bank UCount', color: '#0033a1', category: 'Banking', domain: 'standardbank.co.za' },
  { id: 'nedbank-greenbacks', name: 'Nedbank Greenbacks', color: '#006a4e', category: 'Banking', domain: 'nedbank.co.za' },
  { id: 'discovery-vitality', name: 'Discovery Vitality', color: '#ed1c24', category: 'Lifestyle', domain: 'discovery.co.za' },
  { id: 'momentum-multiply', name: 'Momentum Multiply', color: '#0090d4', category: 'Lifestyle', domain: 'momentum.co.za' },

  // Food & coffee
  { id: 'kauai-nourish', name: 'Kauai Nourish', color: '#84bd00', category: 'Restaurants', domain: 'kauai.co.za' },
  { id: 'mugg-bean', name: 'Mugg & Bean Rewards', color: '#5d3a1a', category: 'Restaurants', domain: 'muggandbean.co.za' },
  { id: 'wimpy-rewards', name: 'Wimpy Rewards', color: '#d9232e', category: 'Restaurants', domain: 'wimpy.co.za' },
  { id: 'vida-club', name: 'Vida e Caffè Club', color: '#e4002b', category: 'Restaurants', domain: 'vidaecaffe.com' },
  { id: 'seattle-coffee', name: 'Seattle Coffee Co Loyalty', color: '#1f3a5f', category: 'Restaurants', domain: 'seattlecoffeeco.co.za' },

  // Books & entertainment
  { id: 'exclusive-books', name: 'Exclusive Books Fanatics', color: '#d4a017', category: 'Books', domain: 'exclusivebooks.co.za' },
  { id: 'avis-preferred', name: 'Avis Preferred', color: '#d4002a', category: 'Travel', domain: 'avis.co.za' },
  { id: 'voyager', name: 'SAA Voyager', color: '#0033a0', category: 'Travel', domain: 'flysaa.com' },
  { id: 'protea-prokard', name: 'Protea Hotels Prokard', color: '#a8915d', category: 'Travel', domain: 'marriott.com' },
];

/**
 * Ordered list of public logo URLs for a brand domain. We try each in turn
 * because no single free service reliably covers every South African brand:
 *   1. Google's favicon service (high-quality, near-universal coverage)
 *   2. DuckDuckGo's icon service (often has crisper square logos)
 *   3. Clearbit (legacy, still works for many global brands)
 */
export function brandLogoCandidates(domain?: string | null): string[] {
  if (!domain) return [];
  return [
    `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
    `https://icons.duckduckgo.com/ip3/${domain}.ico`,
    `https://logo.clearbit.com/${domain}`,
  ];
}

/** Backwards-compatible single-URL helper — returns the best candidate. */
export function brandLogoUrl(domain?: string | null): string | null {
  return brandLogoCandidates(domain)[0] ?? null;
}

/** Look up a brand by exact name match (used when rendering saved cards). */
export function findBrandByName(name: string): LoyaltyBrand | undefined {
  return SA_LOYALTY_BRANDS.find((b) => b.name === name);
}

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
