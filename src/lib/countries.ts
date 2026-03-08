export type CountryCode = 'ZA' | 'BW' | 'NA' | 'MZ' | 'ZW' | 'SZ' | 'LS' | 'ZM' | 'MW' | 'NG' | 'KE' | 'GH' | 'TZ' | 'UG';

export interface Country {
  code: CountryCode;
  name: string;
  flag: string;
  currency: string;
  currencySymbol: string;
  defaultLanguage: string;
  stores: string[];
  localItems: string[];
}

export const countries: Country[] = [
  {
    code: 'ZA',
    name: 'South Africa',
    flag: '🇿🇦',
    currency: 'ZAR',
    currencySymbol: 'R',
    defaultLanguage: 'en',
    stores: ['Checkers', 'Pick n Pay', 'Woolworths', 'Spar', 'Shoprite', 'Food Lover\'s Market', 'Makro', 'Game'],
    localItems: ['boerewors', 'biltong', 'droëwors', 'chakalaka', 'pap', 'mealie meal', 'rooibos', 'mrs balls chutney', 'aromat', 'oros', 'pronutro', 'ouma rusks'],
  },
  {
    code: 'BW',
    name: 'Botswana',
    flag: '🇧🇼',
    currency: 'BWP',
    currencySymbol: 'P',
    defaultLanguage: 'en',
    stores: ['Choppies', 'Spar', 'Pick n Pay', 'Woolworths', 'Sefalana'],
    localItems: ['seswaa', 'bogobe', 'morogo', 'phane', 'vetkoek', 'magwinya'],
  },
  {
    code: 'NA',
    name: 'Namibia',
    flag: '🇳🇦',
    currency: 'NAD',
    currencySymbol: 'N$',
    defaultLanguage: 'en',
    stores: ['Checkers', 'Pick n Pay', 'Spar', 'Shoprite', 'Woermann Brock'],
    localItems: ['biltong', 'droëwors', 'potjiekos', 'kapana', 'oshifima', 'mopane worms'],
  },
  {
    code: 'MZ',
    name: 'Mozambique',
    flag: '🇲🇿',
    currency: 'MZN',
    currencySymbol: 'MT',
    defaultLanguage: 'en',
    stores: ['Shoprite', 'Game', 'Pick n Pay'],
    localItems: ['piri piri', 'matapa', 'xima', 'prawns', 'coconut milk', 'cashew nuts'],
  },
  {
    code: 'ZW',
    name: 'Zimbabwe',
    flag: '🇿🇼',
    currency: 'USD',
    currencySymbol: '$',
    defaultLanguage: 'en',
    stores: ['OK Zimbabwe', 'Pick n Pay', 'Spar', 'TM Supermarkets', 'Food World'],
    localItems: ['sadza', 'biltong', 'kapenta', 'muriwo', 'maheu', 'mazoe'],
  },
  {
    code: 'SZ',
    name: 'Eswatini',
    flag: '🇸🇿',
    currency: 'SZL',
    currencySymbol: 'E',
    defaultLanguage: 'en',
    stores: ['Spar', 'Pick n Pay', 'Shoprite'],
    localItems: ['emasi', 'sishwala', 'umfino', 'incwancwa'],
  },
  {
    code: 'LS',
    name: 'Lesotho',
    flag: '🇱🇸',
    currency: 'LSL',
    currencySymbol: 'L',
    defaultLanguage: 'en',
    stores: ['Shoprite', 'Pick n Pay', 'Spar'],
    localItems: ['papa', 'moroho', 'chakalaka', 'motoho'],
  },
  {
    code: 'ZM',
    name: 'Zambia',
    flag: '🇿🇲',
    currency: 'ZMW',
    currencySymbol: 'ZK',
    defaultLanguage: 'en',
    stores: ['Shoprite', 'Pick n Pay', 'Spar', 'Game', 'Melissa'],
    localItems: ['nshima', 'kapenta', 'ifisashi', 'chikanda', 'vitumbuwa', 'maheu'],
  },
  {
    code: 'MW',
    name: 'Malawi',
    flag: '🇲🇼',
    currency: 'MWK',
    currencySymbol: 'MK',
    defaultLanguage: 'en',
    stores: ['Shoprite', 'Spar', 'Chipiku'],
    localItems: ['nsima', 'chambo', 'mandasi', 'thobwa', 'kondowole'],
  },
  {
    code: 'NG',
    name: 'Nigeria',
    flag: '🇳🇬',
    currency: 'NGN',
    currencySymbol: '₦',
    defaultLanguage: 'en',
    stores: ['Shoprite', 'Spar', 'Justrite', 'Market Square', 'Hubmart'],
    localItems: ['garri', 'palm oil', 'egusi', 'ogbono', 'stockfish', 'crayfish', 'yam', 'plantain', 'suya spice', 'maggi'],
  },
  {
    code: 'KE',
    name: 'Kenya',
    flag: '🇰🇪',
    currency: 'KES',
    currencySymbol: 'KSh',
    defaultLanguage: 'en',
    stores: ['Naivas', 'Carrefour', 'Quickmart', 'Chandarana'],
    localItems: ['ugali', 'sukuma wiki', 'nyama choma', 'chapati', 'mandazi', 'tusker', 'royco'],
  },
  {
    code: 'GH',
    name: 'Ghana',
    flag: '🇬🇭',
    currency: 'GHS',
    currencySymbol: 'GH₵',
    defaultLanguage: 'en',
    stores: ['Shoprite', 'Palace', 'Melcom', 'MaxMart'],
    localItems: ['fufu', 'banku', 'kenkey', 'shito', 'palm oil', 'gari', 'plantain', 'groundnut paste'],
  },
  {
    code: 'TZ',
    name: 'Tanzania',
    flag: '🇹🇿',
    currency: 'TZS',
    currencySymbol: 'TSh',
    defaultLanguage: 'en',
    stores: ['Shoprite', 'Game', 'Uchumi'],
    localItems: ['ugali', 'pilau', 'chapati', 'mandazi', 'maharage', 'dagaa'],
  },
  {
    code: 'UG',
    name: 'Uganda',
    flag: '🇺🇬',
    currency: 'UGX',
    currencySymbol: 'USh',
    defaultLanguage: 'en',
    stores: ['Shoprite', 'Carrefour', 'Capital Shoppers', 'Quality Supermarket'],
    localItems: ['matoke', 'posho', 'groundnut sauce', 'rolex', 'chapati', 'simsim'],
  },
];

export function getCountry(code: CountryCode): Country {
  return countries.find(c => c.code === code) || countries[0];
}

export function formatPrice(amount: number, countryCode: CountryCode): string {
  const country = getCountry(countryCode);
  return `${country.currencySymbol}${amount.toFixed(2)}`;
}

// Monthly premium prices per country (in local currency)
export const premiumPrices: Record<CountryCode, number> = {
  ZA: 49.99,
  BW: 59.99,
  NA: 49.99,
  MZ: 299.99,
  ZW: 2.99,
  SZ: 49.99,
  LS: 49.99,
  ZM: 79.99,
  MW: 4999.99,
  NG: 2999.99,
  KE: 299.99,
  GH: 29.99,
  TZ: 9999.99,
  UG: 9999.99,
};
