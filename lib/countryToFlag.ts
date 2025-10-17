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
  // Europe
  'spain': 'ES',
  'france': 'FR',
  'germany': 'DE',
  'italy': 'IT',
  'england': 'GB', // England uses GB flag
  'united kingdom': 'GB',
  'portugal': 'PT',
  'netherlands': 'NL',
  'belgium': 'BE',
  'denmark': 'DK',
  'sweden': 'SE',
  'norway': 'NO',
  'finland': 'FI',
  'poland': 'PL',
  'czech republic': 'CZ',
  'austria': 'AT',
  'switzerland': 'CH',
  'greece': 'GR',
  'turkey': 'TR',
  'russia': 'RU',
  'ukraine': 'UA',
  'croatia': 'HR',
  'serbia': 'RS',
  'romania': 'RO',
  'hungary': 'HU',
  'bulgaria': 'BG',
  'slovenia': 'SI',
  'slovakia': 'SK',
  'scotland': 'GB',
  'wales': 'GB',
  'ireland': 'IE',
  'northern ireland': 'GB',
  'iceland': 'IS',
  
  // Americas
  'united states': 'US',
  'usa': 'US',
  'canada': 'CA',
  'mexico': 'MX',
  'brazil': 'BR',
  'argentina': 'AR',
  'chile': 'CL',
  'colombia': 'CO',
  'peru': 'PE',
  'uruguay': 'UY',
  'venezuela': 'VE',
  
  // Asia
  'japan': 'JP',
  'china': 'CN',
  'south korea': 'KR',
  'korea': 'KR',
  'india': 'IN',
  'thailand': 'TH',
  'vietnam': 'VN',
  'indonesia': 'ID',
  'malaysia': 'MY',
  'singapore': 'SG',
  'philippines': 'PH',
  'israel': 'IL',
  'saudi arabia': 'SA',
  'uae': 'AE',
  'united arab emirates': 'AE',
  
  // Oceania
  'australia': 'AU',
  'new zealand': 'NZ',
  
  // Africa
  'south africa': 'ZA',
  'egypt': 'EG',
  'nigeria': 'NG',
  'morocco': 'MA',
  'algeria': 'DZ',
  'tunisia': 'TN',
  'kenya': 'KE',
  'ghana': 'GH',
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
