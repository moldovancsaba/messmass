// lib/countryToFlag.ts
// WHAT: Convert country names to flag emojis using Unicode regional indicator symbols
// WHY: Display country flags in partner list for visual identification
// HOW: Maps country names to ISO 3166-1 alpha-2 codes, then to flag emojis

/**
 * WHAT: ISO 3166-1 alpha-2 country code to flag emoji converter
 * WHY: Unicode uses regional indicator symbols to represent flags
 * HOW: Each letter is mapped to a regional indicator symbol (🇦-🇿)
 * EXAMPLE: "US" → 🇺🇸, "ES" → 🇪🇸
 */
function countryCodeToFlag(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) {
    return '🏳️'; // Default flag for unknown/invalid codes
  }
  
  // Convert ISO alpha-2 code to regional indicator symbols
  // A = 🇦 (U+1F1E6), Z = 🇿 (U+1F1FF)
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0)); // 127397 = offset to regional indicators
  
  return String.fromCodePoint(...codePoints);
}

/**
 * WHAT: Map of country names to ISO 3166-1 alpha-2 codes
 * WHY: TheSportsDB uses full country names (e.g., "Spain", "Denmark")
 * NOTE: Covers major countries, can be expanded as needed
 */
const COUNTRY_NAME_TO_CODE: { [key: string]: string } = {
  // Europe (50+ countries)
  'albania': 'AL',
  'andorra': 'AD',
  'armenia': 'AM',
  'austria': 'AT',
  'azerbaijan': 'AZ',
  'belarus': 'BY',
  'belgium': 'BE',
  'bosnia and herzegovina': 'BA',
  'bulgaria': 'BG',
  'croatia': 'HR',
  'cyprus': 'CY',
  'czech republic': 'CZ',
  'czechia': 'CZ',
  'denmark': 'DK',
  'estonia': 'EE',
  'finland': 'FI',
  'france': 'FR',
  'georgia': 'GE',
  'germany': 'DE',
  'greece': 'GR',
  'hungary': 'HU',
  'iceland': 'IS',
  'ireland': 'IE',
  'italy': 'IT',
  'kosovo': 'XK',
  'latvia': 'LV',
  'liechtenstein': 'LI',
  'lithuania': 'LT',
  'luxembourg': 'LU',
  'malta': 'MT',
  'moldova': 'MD',
  'monaco': 'MC',
  'montenegro': 'ME',
  'netherlands': 'NL',
  'north macedonia': 'MK',
  'macedonia': 'MK',
  'norway': 'NO',
  'poland': 'PL',
  'portugal': 'PT',
  'romania': 'RO',
  'russia': 'RU',
  'russian federation': 'RU',
  'san marino': 'SM',
  'serbia': 'RS',
  'slovakia': 'SK',
  'slovenia': 'SI',
  'spain': 'ES',
  'sweden': 'SE',
  'switzerland': 'CH',
  'turkey': 'TR',
  'ukraine': 'UA',
  'united kingdom': 'GB',
  'england': 'GB',
  'scotland': 'GB',
  'wales': 'GB',
  'northern ireland': 'GB',
  'vatican city': 'VA',
  
  // Americas (35+ countries)
  'antigua and barbuda': 'AG',
  'argentina': 'AR',
  'bahamas': 'BS',
  'barbados': 'BB',
  'belize': 'BZ',
  'bolivia': 'BO',
  'brazil': 'BR',
  'canada': 'CA',
  'chile': 'CL',
  'colombia': 'CO',
  'costa rica': 'CR',
  'cuba': 'CU',
  'dominica': 'DM',
  'dominican republic': 'DO',
  'ecuador': 'EC',
  'el salvador': 'SV',
  'grenada': 'GD',
  'guatemala': 'GT',
  'guyana': 'GY',
  'haiti': 'HT',
  'honduras': 'HN',
  'jamaica': 'JM',
  'mexico': 'MX',
  'nicaragua': 'NI',
  'panama': 'PA',
  'paraguay': 'PY',
  'peru': 'PE',
  'saint kitts and nevis': 'KN',
  'saint lucia': 'LC',
  'saint vincent and the grenadines': 'VC',
  'suriname': 'SR',
  'trinidad and tobago': 'TT',
  'united states': 'US',
  'usa': 'US',
  'united states of america': 'US',
  'uruguay': 'UY',
  'venezuela': 'VE',
  
  // Asia (50+ countries)
  'afghanistan': 'AF',
  'bahrain': 'BH',
  'bangladesh': 'BD',
  'bhutan': 'BT',
  'brunei': 'BN',
  'cambodia': 'KH',
  'china': 'CN',
  'india': 'IN',
  'indonesia': 'ID',
  'iran': 'IR',
  'iraq': 'IQ',
  'israel': 'IL',
  'japan': 'JP',
  'jordan': 'JO',
  'kazakhstan': 'KZ',
  'kuwait': 'KW',
  'kyrgyzstan': 'KG',
  'laos': 'LA',
  'lebanon': 'LB',
  'malaysia': 'MY',
  'maldives': 'MV',
  'mongolia': 'MN',
  'myanmar': 'MM',
  'nepal': 'NP',
  'north korea': 'KP',
  'oman': 'OM',
  'pakistan': 'PK',
  'palestine': 'PS',
  'philippines': 'PH',
  'qatar': 'QA',
  'saudi arabia': 'SA',
  'singapore': 'SG',
  'south korea': 'KR',
  'korea': 'KR',
  'sri lanka': 'LK',
  'syria': 'SY',
  'taiwan': 'TW',
  'tajikistan': 'TJ',
  'thailand': 'TH',
  'timor-leste': 'TL',
  'east timor': 'TL',
  'turkmenistan': 'TM',
  'united arab emirates': 'AE',
  'uae': 'AE',
  'uzbekistan': 'UZ',
  'vietnam': 'VN',
  'yemen': 'YE',
  
  // Africa (54+ countries)
  'algeria': 'DZ',
  'angola': 'AO',
  'benin': 'BJ',
  'botswana': 'BW',
  'burkina faso': 'BF',
  'burundi': 'BI',
  'cameroon': 'CM',
  'cape verde': 'CV',
  'central african republic': 'CF',
  'chad': 'TD',
  'comoros': 'KM',
  'congo': 'CG',
  'democratic republic of the congo': 'CD',
  'drc': 'CD',
  'djibouti': 'DJ',
  'egypt': 'EG',
  'equatorial guinea': 'GQ',
  'eritrea': 'ER',
  'eswatini': 'SZ',
  'swaziland': 'SZ',
  'ethiopia': 'ET',
  'gabon': 'GA',
  'gambia': 'GM',
  'ghana': 'GH',
  'guinea': 'GN',
  'guinea-bissau': 'GW',
  'ivory coast': 'CI',
  'cote d\'ivoire': 'CI',
  'kenya': 'KE',
  'lesotho': 'LS',
  'liberia': 'LR',
  'libya': 'LY',
  'madagascar': 'MG',
  'malawi': 'MW',
  'mali': 'ML',
  'mauritania': 'MR',
  'mauritius': 'MU',
  'morocco': 'MA',
  'mozambique': 'MZ',
  'namibia': 'NA',
  'niger': 'NE',
  'nigeria': 'NG',
  'rwanda': 'RW',
  'sao tome and principe': 'ST',
  'senegal': 'SN',
  'seychelles': 'SC',
  'sierra leone': 'SL',
  'somalia': 'SO',
  'south africa': 'ZA',
  'south sudan': 'SS',
  'sudan': 'SD',
  'tanzania': 'TZ',
  'togo': 'TG',
  'tunisia': 'TN',
  'uganda': 'UG',
  'zambia': 'ZM',
  'zimbabwe': 'ZW',
  
  // Oceania (14+ countries)
  'australia': 'AU',
  'fiji': 'FJ',
  'kiribati': 'KI',
  'marshall islands': 'MH',
  'micronesia': 'FM',
  'nauru': 'NR',
  'new zealand': 'NZ',
  'palau': 'PW',
  'papua new guinea': 'PG',
  'samoa': 'WS',
  'solomon islands': 'SB',
  'tonga': 'TO',
  'tuvalu': 'TV',
  'vanuatu': 'VU',
};

/**
 * WHAT: Convert country name to flag emoji
 * WHY: Display country flags in partner list for visual identification
 * RETURNS: Flag emoji (e.g., 🇪🇸 for Spain) or 🏳️ for unknown countries
 * 
 * USAGE:
 * countryToFlag('Spain') → '🇪🇸'
 * countryToFlag('Denmark') → '🇩🇰'
 * countryToFlag('Unknown') → '🏳️'
 */
export function countryToFlag(countryName: string | undefined | null): string {
  if (!countryName || typeof countryName !== 'string') {
    return ''; // Return empty string for missing country
  }
  
  // Normalize country name (lowercase, trim)
  const normalizedName = countryName.toLowerCase().trim();
  
  // Look up ISO code
  const countryCode = COUNTRY_NAME_TO_CODE[normalizedName];
  
  if (!countryCode) {
    // Unknown country - return empty string (no flag displayed)
    console.warn(`[countryToFlag] Unknown country: "${countryName}"`);
    return '';
  }
  
  // Convert to flag emoji
  return countryCodeToFlag(countryCode);
}

/**
 * WHAT: Get country name and flag together
 * WHY: Useful for tooltips or combined display
 * RETURNS: "Spain 🇪🇸" or just country name if flag unavailable
 */
export function countryWithFlag(countryName: string | undefined | null): string {
  if (!countryName) return '';
  
  const flag = countryToFlag(countryName);
  return flag ? `${countryName} ${flag}` : countryName;
}

/**
 * WHAT: Check if country has a known flag
 * WHY: Determine if we should display flag or fallback
 */
export function hasKnownFlag(countryName: string | undefined | null): boolean {
  if (!countryName) return false;
  const normalizedName = countryName.toLowerCase().trim();
  return normalizedName in COUNTRY_NAME_TO_CODE;
}
