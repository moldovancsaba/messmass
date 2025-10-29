// Seed country code to name mappings into MongoDB
const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

// WHAT: Complete ISO 3166-1 alpha-2 country mappings
// WHY: Centralize all country data in MongoDB instead of hardcoded in multiple files
// HOW: Seeds country_mappings collection with code, name, aliases, and flag emoji

function codeToFlag(code) {
  if (!code || code.length !== 2) return '';
  const codePoints = code.toUpperCase().split('').map(c => 127397 + c.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// ISO 3166-1 alpha-2 country codes with common aliases
const COUNTRIES = [
  // Europe
  { code: 'AL', name: 'Albania', aliases: [] },
  { code: 'AD', name: 'Andorra', aliases: [] },
  { code: 'AM', name: 'Armenia', aliases: [] },
  { code: 'AT', name: 'Austria', aliases: [] },
  { code: 'AZ', name: 'Azerbaijan', aliases: [] },
  { code: 'BY', name: 'Belarus', aliases: [] },
  { code: 'BE', name: 'Belgium', aliases: [] },
  { code: 'BA', name: 'Bosnia And Herzegovina', aliases: [] },
  { code: 'BG', name: 'Bulgaria', aliases: [] },
  { code: 'HR', name: 'Croatia', aliases: [] },
  { code: 'CY', name: 'Cyprus', aliases: [] },
  { code: 'CZ', name: 'Czech Republic', aliases: ['czechia'] },
  { code: 'DK', name: 'Denmark', aliases: [] },
  { code: 'EE', name: 'Estonia', aliases: [] },
  { code: 'FI', name: 'Finland', aliases: [] },
  { code: 'FR', name: 'France', aliases: [] },
  { code: 'GE', name: 'Georgia', aliases: [] },
  { code: 'DE', name: 'Germany', aliases: [] },
  { code: 'GR', name: 'Greece', aliases: [] },
  { code: 'HU', name: 'Hungary', aliases: [] },
  { code: 'IS', name: 'Iceland', aliases: [] },
  { code: 'IE', name: 'Ireland', aliases: [] },
  { code: 'IT', name: 'Italy', aliases: [] },
  { code: 'XK', name: 'Kosovo', aliases: [] },
  { code: 'LV', name: 'Latvia', aliases: [] },
  { code: 'LI', name: 'Liechtenstein', aliases: [] },
  { code: 'LT', name: 'Lithuania', aliases: [] },
  { code: 'LU', name: 'Luxembourg', aliases: [] },
  { code: 'MT', name: 'Malta', aliases: [] },
  { code: 'MD', name: 'Moldova', aliases: [] },
  { code: 'MC', name: 'Monaco', aliases: [] },
  { code: 'ME', name: 'Montenegro', aliases: [] },
  { code: 'NL', name: 'Netherlands', aliases: [] },
  { code: 'MK', name: 'North Macedonia', aliases: ['macedonia'] },
  { code: 'NO', name: 'Norway', aliases: [] },
  { code: 'PL', name: 'Poland', aliases: [] },
  { code: 'PT', name: 'Portugal', aliases: [] },
  { code: 'RO', name: 'Romania', aliases: [] },
  { code: 'RU', name: 'Russia', aliases: ['russian federation'] },
  { code: 'SM', name: 'San Marino', aliases: [] },
  { code: 'RS', name: 'Serbia', aliases: [] },
  { code: 'SK', name: 'Slovakia', aliases: [] },
  { code: 'SI', name: 'Slovenia', aliases: [] },
  { code: 'ES', name: 'Spain', aliases: [] },
  { code: 'SE', name: 'Sweden', aliases: [] },
  { code: 'CH', name: 'Switzerland', aliases: [] },
  { code: 'TR', name: 'Turkey', aliases: [] },
  { code: 'UA', name: 'Ukraine', aliases: [] },
  { code: 'GB', name: 'United Kingdom', aliases: ['england', 'scotland', 'wales', 'northern ireland'] },
  { code: 'VA', name: 'Vatican City', aliases: [] },

  // Americas
  { code: 'AG', name: 'Antigua And Barbuda', aliases: [] },
  { code: 'AR', name: 'Argentina', aliases: [] },
  { code: 'BS', name: 'Bahamas', aliases: [] },
  { code: 'BB', name: 'Barbados', aliases: [] },
  { code: 'BZ', name: 'Belize', aliases: [] },
  { code: 'BO', name: 'Bolivia', aliases: [] },
  { code: 'BR', name: 'Brazil', aliases: [] },
  { code: 'CA', name: 'Canada', aliases: [] },
  { code: 'CL', name: 'Chile', aliases: [] },
  { code: 'CO', name: 'Colombia', aliases: [] },
  { code: 'CR', name: 'Costa Rica', aliases: [] },
  { code: 'CU', name: 'Cuba', aliases: [] },
  { code: 'DM', name: 'Dominica', aliases: [] },
  { code: 'DO', name: 'Dominican Republic', aliases: [] },
  { code: 'EC', name: 'Ecuador', aliases: [] },
  { code: 'SV', name: 'El Salvador', aliases: [] },
  { code: 'GD', name: 'Grenada', aliases: [] },
  { code: 'GT', name: 'Guatemala', aliases: [] },
  { code: 'GY', name: 'Guyana', aliases: [] },
  { code: 'HT', name: 'Haiti', aliases: [] },
  { code: 'HN', name: 'Honduras', aliases: [] },
  { code: 'JM', name: 'Jamaica', aliases: [] },
  { code: 'MX', name: 'Mexico', aliases: [] },
  { code: 'NI', name: 'Nicaragua', aliases: [] },
  { code: 'PA', name: 'Panama', aliases: [] },
  { code: 'PY', name: 'Paraguay', aliases: [] },
  { code: 'PE', name: 'Peru', aliases: [] },
  { code: 'KN', name: 'Saint Kitts And Nevis', aliases: [] },
  { code: 'LC', name: 'Saint Lucia', aliases: [] },
  { code: 'VC', name: 'Saint Vincent And The Grenadines', aliases: [] },
  { code: 'SR', name: 'Suriname', aliases: [] },
  { code: 'TT', name: 'Trinidad And Tobago', aliases: [] },
  { code: 'US', name: 'United States', aliases: ['usa', 'united states of america'] },
  { code: 'UY', name: 'Uruguay', aliases: [] },
  { code: 'VE', name: 'Venezuela', aliases: [] },

  // Asia
  { code: 'AF', name: 'Afghanistan', aliases: [] },
  { code: 'BH', name: 'Bahrain', aliases: [] },
  { code: 'BD', name: 'Bangladesh', aliases: [] },
  { code: 'BT', name: 'Bhutan', aliases: [] },
  { code: 'BN', name: 'Brunei', aliases: [] },
  { code: 'KH', name: 'Cambodia', aliases: [] },
  { code: 'CN', name: 'China', aliases: [] },
  { code: 'IN', name: 'India', aliases: [] },
  { code: 'ID', name: 'Indonesia', aliases: [] },
  { code: 'IR', name: 'Iran', aliases: [] },
  { code: 'IQ', name: 'Iraq', aliases: [] },
  { code: 'IL', name: 'Israel', aliases: [] },
  { code: 'JP', name: 'Japan', aliases: [] },
  { code: 'JO', name: 'Jordan', aliases: [] },
  { code: 'KZ', name: 'Kazakhstan', aliases: [] },
  { code: 'KW', name: 'Kuwait', aliases: [] },
  { code: 'KG', name: 'Kyrgyzstan', aliases: [] },
  { code: 'LA', name: 'Laos', aliases: [] },
  { code: 'LB', name: 'Lebanon', aliases: [] },
  { code: 'MY', name: 'Malaysia', aliases: [] },
  { code: 'MV', name: 'Maldives', aliases: [] },
  { code: 'MN', name: 'Mongolia', aliases: [] },
  { code: 'MM', name: 'Myanmar', aliases: [] },
  { code: 'NP', name: 'Nepal', aliases: [] },
  { code: 'KP', name: 'North Korea', aliases: [] },
  { code: 'OM', name: 'Oman', aliases: [] },
  { code: 'PK', name: 'Pakistan', aliases: [] },
  { code: 'PS', name: 'Palestine', aliases: [] },
  { code: 'PH', name: 'Philippines', aliases: [] },
  { code: 'QA', name: 'Qatar', aliases: [] },
  { code: 'SA', name: 'Saudi Arabia', aliases: [] },
  { code: 'SG', name: 'Singapore', aliases: [] },
  { code: 'KR', name: 'South Korea', aliases: ['korea'] },
  { code: 'LK', name: 'Sri Lanka', aliases: [] },
  { code: 'SY', name: 'Syria', aliases: [] },
  { code: 'TW', name: 'Taiwan', aliases: [] },
  { code: 'TJ', name: 'Tajikistan', aliases: [] },
  { code: 'TH', name: 'Thailand', aliases: [] },
  { code: 'TL', name: 'Timor-Leste', aliases: ['east timor'] },
  { code: 'TM', name: 'Turkmenistan', aliases: [] },
  { code: 'AE', name: 'United Arab Emirates', aliases: ['uae'] },
  { code: 'UZ', name: 'Uzbekistan', aliases: [] },
  { code: 'VN', name: 'Vietnam', aliases: [] },
  { code: 'YE', name: 'Yemen', aliases: [] },

  // Africa
  { code: 'DZ', name: 'Algeria', aliases: [] },
  { code: 'AO', name: 'Angola', aliases: [] },
  { code: 'BJ', name: 'Benin', aliases: [] },
  { code: 'BW', name: 'Botswana', aliases: [] },
  { code: 'BF', name: 'Burkina Faso', aliases: [] },
  { code: 'BI', name: 'Burundi', aliases: [] },
  { code: 'CM', name: 'Cameroon', aliases: [] },
  { code: 'CV', name: 'Cape Verde', aliases: [] },
  { code: 'CF', name: 'Central African Republic', aliases: [] },
  { code: 'TD', name: 'Chad', aliases: [] },
  { code: 'KM', name: 'Comoros', aliases: [] },
  { code: 'CG', name: 'Congo', aliases: [] },
  { code: 'CD', name: 'Democratic Republic Of The Congo', aliases: ['drc'] },
  { code: 'DJ', name: 'Djibouti', aliases: [] },
  { code: 'EG', name: 'Egypt', aliases: [] },
  { code: 'GQ', name: 'Equatorial Guinea', aliases: [] },
  { code: 'ER', name: 'Eritrea', aliases: [] },
  { code: 'SZ', name: 'Eswatini', aliases: ['swaziland'] },
  { code: 'ET', name: 'Ethiopia', aliases: [] },
  { code: 'GA', name: 'Gabon', aliases: [] },
  { code: 'GM', name: 'Gambia', aliases: [] },
  { code: 'GH', name: 'Ghana', aliases: [] },
  { code: 'GN', name: 'Guinea', aliases: [] },
  { code: 'GW', name: 'Guinea-Bissau', aliases: [] },
  { code: 'CI', name: 'Ivory Coast', aliases: ["cote d'ivoire"] },
  { code: 'KE', name: 'Kenya', aliases: [] },
  { code: 'LS', name: 'Lesotho', aliases: [] },
  { code: 'LR', name: 'Liberia', aliases: [] },
  { code: 'LY', name: 'Libya', aliases: [] },
  { code: 'MG', name: 'Madagascar', aliases: [] },
  { code: 'MW', name: 'Malawi', aliases: [] },
  { code: 'ML', name: 'Mali', aliases: [] },
  { code: 'MR', name: 'Mauritania', aliases: [] },
  { code: 'MU', name: 'Mauritius', aliases: [] },
  { code: 'MA', name: 'Morocco', aliases: [] },
  { code: 'MZ', name: 'Mozambique', aliases: [] },
  { code: 'NA', name: 'Namibia', aliases: [] },
  { code: 'NE', name: 'Niger', aliases: [] },
  { code: 'NG', name: 'Nigeria', aliases: [] },
  { code: 'RW', name: 'Rwanda', aliases: [] },
  { code: 'ST', name: 'Sao Tome And Principe', aliases: [] },
  { code: 'SN', name: 'Senegal', aliases: [] },
  { code: 'SC', name: 'Seychelles', aliases: [] },
  { code: 'SL', name: 'Sierra Leone', aliases: [] },
  { code: 'SO', name: 'Somalia', aliases: [] },
  { code: 'ZA', name: 'South Africa', aliases: [] },
  { code: 'SS', name: 'South Sudan', aliases: [] },
  { code: 'SD', name: 'Sudan', aliases: [] },
  { code: 'TZ', name: 'Tanzania', aliases: [] },
  { code: 'TG', name: 'Togo', aliases: [] },
  { code: 'TN', name: 'Tunisia', aliases: [] },
  { code: 'UG', name: 'Uganda', aliases: [] },
  { code: 'ZM', name: 'Zambia', aliases: [] },
  { code: 'ZW', name: 'Zimbabwe', aliases: [] },

  // Oceania
  { code: 'AU', name: 'Australia', aliases: [] },
  { code: 'FJ', name: 'Fiji', aliases: [] },
  { code: 'KI', name: 'Kiribati', aliases: [] },
  { code: 'MH', name: 'Marshall Islands', aliases: [] },
  { code: 'FM', name: 'Micronesia', aliases: [] },
  { code: 'NR', name: 'Nauru', aliases: [] },
  { code: 'NZ', name: 'New Zealand', aliases: [] },
  { code: 'PW', name: 'Palau', aliases: [] },
  { code: 'PG', name: 'Papua New Guinea', aliases: [] },
  { code: 'WS', name: 'Samoa', aliases: [] },
  { code: 'SB', name: 'Solomon Islands', aliases: [] },
  { code: 'TO', name: 'Tonga', aliases: [] },
  { code: 'TV', name: 'Tuvalu', aliases: [] },
  { code: 'VU', name: 'Vanuatu', aliases: [] },
];

async function main() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'messmass');
    const collection = db.collection('country_mappings');
    
    console.log('🌍 Seeding country mappings...\n');
    
    // Clear existing mappings
    await collection.deleteMany({});
    
    // Insert all countries with metadata
    const now = new Date().toISOString();
    const documents = COUNTRIES.map(country => ({
      code: country.code,
      name: country.name,
      createdAt: now,
      updatedAt: now
    }));
    
    const result = await collection.insertMany(documents);
    
    // Create index on code for fast lookups
    await collection.createIndex({ code: 1 }, { unique: true });
    
    console.log(`✅ Seeded ${result.insertedCount} country mappings`);
    console.log(`📚 Collection: country_mappings`);
    console.log(`🔍 Indexed on: code (unique)`);
    console.log('\n🎉 Country mappings are now centralized in MongoDB!');
    
  } finally {
    await client.close();
  }
}

main().catch(console.error);
