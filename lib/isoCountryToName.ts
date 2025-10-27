// lib/isoCountryToName.ts
// WHAT: Convert ISO 3166-1 alpha-2 country codes to full country names
// WHY: Bitly API returns ISO codes (e.g., "US", "HU", "ES") but charts need
//      human-readable names (e.g., "United States", "Hungary", "Spain")
// HOW: Reverse the existing COUNTRY_NAME_TO_CODE mapping from countryToFlag.ts

/**
 * WHAT: Reverse mapping from ISO country codes to country names
 * WHY: Bitly geographic data uses ISO codes, but UI displays full names
 * HOW: Built from existing 200+ country mappings in countryToFlag.ts
 * 
 * STRUCTURE:
 * - Key: ISO 3166-1 alpha-2 code (e.g., "US", "GB", "HU")
 * - Value: Title-cased country name (e.g., "United States", "United Kingdom", "Hungary")
 * 
 * EDGE CASES:
 * - Multiple names mapping to same code (e.g., "england"/"scotland"/"wales" → "GB")
 *   → Uses first match encountered (typically the primary name)
 * - Case-insensitive lookup (normalized to uppercase)
 * - Unknown codes fallback to original ISO code
 */
const ISO_TO_COUNTRY_NAME: Record<string, string> = {
  // Europe
  'AL': 'Albania',
  'AD': 'Andorra',
  'AM': 'Armenia',
  'AT': 'Austria',
  'AZ': 'Azerbaijan',
  'BY': 'Belarus',
  'BE': 'Belgium',
  'BA': 'Bosnia And Herzegovina',
  'BG': 'Bulgaria',
  'HR': 'Croatia',
  'CY': 'Cyprus',
  'CZ': 'Czech Republic',
  'DK': 'Denmark',
  'EE': 'Estonia',
  'FI': 'Finland',
  'FR': 'France',
  'GE': 'Georgia',
  'DE': 'Germany',
  'GR': 'Greece',
  'HU': 'Hungary',
  'IS': 'Iceland',
  'IE': 'Ireland',
  'IT': 'Italy',
  'XK': 'Kosovo',
  'LV': 'Latvia',
  'LI': 'Liechtenstein',
  'LT': 'Lithuania',
  'LU': 'Luxembourg',
  'MT': 'Malta',
  'MD': 'Moldova',
  'MC': 'Monaco',
  'ME': 'Montenegro',
  'NL': 'Netherlands',
  'MK': 'North Macedonia',
  'NO': 'Norway',
  'PL': 'Poland',
  'PT': 'Portugal',
  'RO': 'Romania',
  'RU': 'Russia',
  'SM': 'San Marino',
  'RS': 'Serbia',
  'SK': 'Slovakia',
  'SI': 'Slovenia',
  'ES': 'Spain',
  'SE': 'Sweden',
  'CH': 'Switzerland',
  'TR': 'Turkey',
  'UA': 'Ukraine',
  'GB': 'United Kingdom',
  'VA': 'Vatican City',

  // Americas
  'AG': 'Antigua And Barbuda',
  'AR': 'Argentina',
  'BS': 'Bahamas',
  'BB': 'Barbados',
  'BZ': 'Belize',
  'BO': 'Bolivia',
  'BR': 'Brazil',
  'CA': 'Canada',
  'CL': 'Chile',
  'CO': 'Colombia',
  'CR': 'Costa Rica',
  'CU': 'Cuba',
  'DM': 'Dominica',
  'DO': 'Dominican Republic',
  'EC': 'Ecuador',
  'SV': 'El Salvador',
  'GD': 'Grenada',
  'GT': 'Guatemala',
  'GY': 'Guyana',
  'HT': 'Haiti',
  'HN': 'Honduras',
  'JM': 'Jamaica',
  'MX': 'Mexico',
  'NI': 'Nicaragua',
  'PA': 'Panama',
  'PY': 'Paraguay',
  'PE': 'Peru',
  'KN': 'Saint Kitts And Nevis',
  'LC': 'Saint Lucia',
  'VC': 'Saint Vincent And The Grenadines',
  'SR': 'Suriname',
  'TT': 'Trinidad And Tobago',
  'US': 'United States',
  'UY': 'Uruguay',
  'VE': 'Venezuela',

  // Asia
  'AF': 'Afghanistan',
  'BH': 'Bahrain',
  'BD': 'Bangladesh',
  'BT': 'Bhutan',
  'BN': 'Brunei',
  'KH': 'Cambodia',
  'CN': 'China',
  'IN': 'India',
  'ID': 'Indonesia',
  'IR': 'Iran',
  'IQ': 'Iraq',
  'IL': 'Israel',
  'JP': 'Japan',
  'JO': 'Jordan',
  'KZ': 'Kazakhstan',
  'KW': 'Kuwait',
  'KG': 'Kyrgyzstan',
  'LA': 'Laos',
  'LB': 'Lebanon',
  'MY': 'Malaysia',
  'MV': 'Maldives',
  'MN': 'Mongolia',
  'MM': 'Myanmar',
  'NP': 'Nepal',
  'KP': 'North Korea',
  'OM': 'Oman',
  'PK': 'Pakistan',
  'PS': 'Palestine',
  'PH': 'Philippines',
  'QA': 'Qatar',
  'SA': 'Saudi Arabia',
  'SG': 'Singapore',
  'KR': 'South Korea',
  'LK': 'Sri Lanka',
  'SY': 'Syria',
  'TW': 'Taiwan',
  'TJ': 'Tajikistan',
  'TH': 'Thailand',
  'TL': 'Timor-leste',
  'TM': 'Turkmenistan',
  'AE': 'United Arab Emirates',
  'UZ': 'Uzbekistan',
  'VN': 'Vietnam',
  'YE': 'Yemen',

  // Africa
  'DZ': 'Algeria',
  'AO': 'Angola',
  'BJ': 'Benin',
  'BW': 'Botswana',
  'BF': 'Burkina Faso',
  'BI': 'Burundi',
  'CM': 'Cameroon',
  'CV': 'Cape Verde',
  'CF': 'Central African Republic',
  'TD': 'Chad',
  'KM': 'Comoros',
  'CG': 'Congo',
  'CD': 'Democratic Republic Of The Congo',
  'DJ': 'Djibouti',
  'EG': 'Egypt',
  'GQ': 'Equatorial Guinea',
  'ER': 'Eritrea',
  'SZ': 'Eswatini',
  'ET': 'Ethiopia',
  'GA': 'Gabon',
  'GM': 'Gambia',
  'GH': 'Ghana',
  'GN': 'Guinea',
  'GW': 'Guinea-bissau',
  'CI': 'Ivory Coast',
  'KE': 'Kenya',
  'LS': 'Lesotho',
  'LR': 'Liberia',
  'LY': 'Libya',
  'MG': 'Madagascar',
  'MW': 'Malawi',
  'ML': 'Mali',
  'MR': 'Mauritania',
  'MU': 'Mauritius',
  'MA': 'Morocco',
  'MZ': 'Mozambique',
  'NA': 'Namibia',
  'NE': 'Niger',
  'NG': 'Nigeria',
  'RW': 'Rwanda',
  'ST': 'Sao Tome And Principe',
  'SN': 'Senegal',
  'SC': 'Seychelles',
  'SL': 'Sierra Leone',
  'SO': 'Somalia',
  'ZA': 'South Africa',
  'SS': 'South Sudan',
  'SD': 'Sudan',
  'TZ': 'Tanzania',
  'TG': 'Togo',
  'TN': 'Tunisia',
  'UG': 'Uganda',
  'ZM': 'Zambia',
  'ZW': 'Zimbabwe',

  // Oceania
  'AU': 'Australia',
  'FJ': 'Fiji',
  'KI': 'Kiribati',
  'MH': 'Marshall Islands',
  'FM': 'Micronesia',
  'NR': 'Nauru',
  'NZ': 'New Zealand',
  'PW': 'Palau',
  'PG': 'Papua New Guinea',
  'WS': 'Samoa',
  'SB': 'Solomon Islands',
  'TO': 'Tonga',
  'TV': 'Tuvalu',
  'VU': 'Vanuatu',
};

/**
 * WHAT: Convert ISO 3166-1 alpha-2 code to full country name
 * WHY: Charts display full names, but Bitly data contains ISO codes
 * 
 * @param isoCode - ISO 3166-1 alpha-2 code (e.g., "US", "HU", "IT")
 * @returns Full country name (e.g., "United States", "Hungary", "Italy")
 * 
 * EDGE CASES:
 * - null/undefined → Returns "Unknown"
 * - Empty string → Returns "Unknown"
 * - Invalid code → Returns original ISO code as fallback
 * - Lowercase codes → Normalized to uppercase before lookup
 * 
 * EXAMPLES:
 * isoToCountryName('US') → 'United States'
 * isoToCountryName('hu') → 'Hungary' (case-insensitive)
 * isoToCountryName('XYZ') → 'XYZ' (unknown code, returns as-is)
 * isoToCountryName(null) → 'Unknown'
 * isoToCountryName('') → 'Unknown'
 */
export function isoToCountryName(isoCode: string | null | undefined): string {
  // Handle null, undefined, or empty string
  if (!isoCode || isoCode.trim() === '') {
    return 'Unknown';
  }

  // Normalize to uppercase for case-insensitive lookup
  const normalized = isoCode.toUpperCase().trim();

  // Return mapped name or fallback to original code if unknown
  return ISO_TO_COUNTRY_NAME[normalized] || isoCode;
}

/**
 * WHAT: Get country name with optional flag emoji
 * WHY: Useful for rich UI displays combining name + visual indicator
 * 
 * @param isoCode - ISO 3166-1 alpha-2 code
 * @param includeFlag - Whether to append flag emoji (default: false)
 * @returns Country name, optionally with flag (e.g., "Hungary 🇭🇺")
 * 
 * EXAMPLES:
 * isoToCountryNameWithFlag('US', true) → 'United States 🇺🇸'
 * isoToCountryNameWithFlag('HU', false) → 'Hungary'
 */
export function isoToCountryNameWithFlag(
  isoCode: string | null | undefined,
  includeFlag: boolean = false
): string {
  const name = isoToCountryName(isoCode);
  
  if (!includeFlag || !isoCode) {
    return name;
  }

  // Convert ISO code to flag emoji (regional indicator symbols)
  const normalized = isoCode.toUpperCase().trim();
  if (normalized.length === 2) {
    const codePoints = normalized.split('').map(char => 127397 + char.charCodeAt(0));
    const flag = String.fromCodePoint(...codePoints);
    return `${name} ${flag}`;
  }

  return name;
}

/**
 * WHAT: Check if ISO code is known/valid
 * WHY: Validate country codes before processing
 * 
 * @param isoCode - ISO 3166-1 alpha-2 code to validate
 * @returns true if code exists in mapping, false otherwise
 * 
 * EXAMPLES:
 * isValidIsoCode('US') → true
 * isValidIsoCode('XYZ') → false
 * isValidIsoCode(null) → false
 */
export function isValidIsoCode(isoCode: string | null | undefined): boolean {
  if (!isoCode) return false;
  const normalized = isoCode.toUpperCase().trim();
  return normalized in ISO_TO_COUNTRY_NAME;
}
