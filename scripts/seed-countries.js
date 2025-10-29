// WHAT: Seed countries collection with ISO codes, names, flags, regions, aliases
// WHY: Eliminate hardcoded country mappings across codebase
// HOW: Single source of truth in MongoDB with proper indexing

const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

// WHAT: Convert ISO code to flag emoji
// HOW: Regional indicator symbols (U+1F1E6-1F1FF)
function codeToFlag(code) {
  if (!code || code.length !== 2) return '';
  const codePoints = code.toUpperCase().split('').map(c => 127397 + c.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// WHAT: Complete ISO 3166-1 alpha-2 country database
// SOURCE: ISO standards + common aliases from existing codebase
const COUNTRIES = [
  // Europe (50 countries)
  { code: 'AL', name: 'Albania', region: 'Europe', subregion: 'Southern Europe', aliases: [] },
  { code: 'AD', name: 'Andorra', region: 'Europe', subregion: 'Southern Europe', aliases: [] },
  { code: 'AM', name: 'Armenia', region: 'Europe', subregion: 'Eastern Europe', aliases: [] },
  { code: 'AT', name: 'Austria', region: 'Europe', subregion: 'Central Europe', aliases: [] },
  { code: 'AZ', name: 'Azerbaijan', region: 'Europe', subregion: 'Eastern Europe', aliases: [] },
  { code: 'BY', name: 'Belarus', region: 'Europe', subregion: 'Eastern Europe', aliases: [] },
  { code: 'BE', name: 'Belgium', region: 'Europe', subregion: 'Western Europe', aliases: [] },
  { code: 'BA', name: 'Bosnia And Herzegovina', region: 'Europe', subregion: 'Southern Europe', aliases: ['bosnia'] },
  { code: 'BG', name: 'Bulgaria', region: 'Europe', subregion: 'Eastern Europe', aliases: [] },
  { code: 'HR', name: 'Croatia', region: 'Europe', subregion: 'Southern Europe', aliases: [] },
  { code: 'CY', name: 'Cyprus', region: 'Europe', subregion: 'Southern Europe', aliases: [] },
  { code: 'CZ', name: 'Czech Republic', region: 'Europe', subregion: 'Central Europe', aliases: ['czechia'] },
  { code: 'DK', name: 'Denmark', region: 'Europe', subregion: 'Northern Europe', aliases: [] },
  { code: 'EE', name: 'Estonia', region: 'Europe', subregion: 'Northern Europe', aliases: [] },
  { code: 'FI', name: 'Finland', region: 'Europe', subregion: 'Northern Europe', aliases: [] },
  { code: 'FR', name: 'France', region: 'Europe', subregion: 'Western Europe', aliases: [] },
  { code: 'GE', name: 'Georgia', region: 'Europe', subregion: 'Eastern Europe', aliases: [] },
  { code: 'DE', name: 'Germany', region: 'Europe', subregion: 'Central Europe', aliases: [] },
  { code: 'GR', name: 'Greece', region: 'Europe', subregion: 'Southern Europe', aliases: [] },
  { code: 'HU', name: 'Hungary', region: 'Europe', subregion: 'Central Europe', aliases: [] },
  { code: 'IS', name: 'Iceland', region: 'Europe', subregion: 'Northern Europe', aliases: [] },
  { code: 'IE', name: 'Ireland', region: 'Europe', subregion: 'Northern Europe', aliases: [] },
  { code: 'IT', name: 'Italy', region: 'Europe', subregion: 'Southern Europe', aliases: [] },
  { code: 'XK', name: 'Kosovo', region: 'Europe', subregion: 'Southern Europe', aliases: [] },
  { code: 'LV', name: 'Latvia', region: 'Europe', subregion: 'Northern Europe', aliases: [] },
  { code: 'LI', name: 'Liechtenstein', region: 'Europe', subregion: 'Central Europe', aliases: [] },
  { code: 'LT', name: 'Lithuania', region: 'Europe', subregion: 'Northern Europe', aliases: [] },
  { code: 'LU', name: 'Luxembourg', region: 'Europe', subregion: 'Western Europe', aliases: [] },
  { code: 'MT', name: 'Malta', region: 'Europe', subregion: 'Southern Europe', aliases: [] },
  { code: 'MD', name: 'Moldova', region: 'Europe', subregion: 'Eastern Europe', aliases: [] },
  { code: 'MC', name: 'Monaco', region: 'Europe', subregion: 'Western Europe', aliases: [] },
  { code: 'ME', name: 'Montenegro', region: 'Europe', subregion: 'Southern Europe', aliases: [] },
  { code: 'NL', name: 'Netherlands', region: 'Europe', subregion: 'Western Europe', aliases: [] },
  { code: 'MK', name: 'North Macedonia', region: 'Europe', subregion: 'Southern Europe', aliases: ['macedonia'] },
  { code: 'NO', name: 'Norway', region: 'Europe', subregion: 'Northern Europe', aliases: [] },
  { code: 'PL', name: 'Poland', region: 'Europe', subregion: 'Central Europe', aliases: [] },
  { code: 'PT', name: 'Portugal', region: 'Europe', subregion: 'Southern Europe', aliases: [] },
  { code: 'RO', name: 'Romania', region: 'Europe', subregion: 'Eastern Europe', aliases: [] },
  { code: 'RU', name: 'Russia', region: 'Europe', subregion: 'Eastern Europe', aliases: ['russian federation'] },
  { code: 'SM', name: 'San Marino', region: 'Europe', subregion: 'Southern Europe', aliases: [] },
  { code: 'RS', name: 'Serbia', region: 'Europe', subregion: 'Southern Europe', aliases: [] },
  { code: 'SK', name: 'Slovakia', region: 'Europe', subregion: 'Central Europe', aliases: [] },
  { code: 'SI', name: 'Slovenia', region: 'Europe', subregion: 'Southern Europe', aliases: [] },
  { code: 'ES', name: 'Spain', region: 'Europe', subregion: 'Southern Europe', aliases: [] },
  { code: 'SE', name: 'Sweden', region: 'Europe', subregion: 'Northern Europe', aliases: [] },
  { code: 'CH', name: 'Switzerland', region: 'Europe', subregion: 'Central Europe', aliases: [] },
  { code: 'TR', name: 'Turkey', region: 'Europe', subregion: 'Eastern Europe', aliases: [] },
  { code: 'UA', name: 'Ukraine', region: 'Europe', subregion: 'Eastern Europe', aliases: [] },
  { code: 'GB', name: 'United Kingdom', region: 'Europe', subregion: 'Northern Europe', aliases: ['england', 'scotland', 'wales', 'northern ireland', 'uk'] },
  { code: 'VA', name: 'Vatican City', region: 'Europe', subregion: 'Southern Europe', aliases: [] },

  // Americas (35 countries)
  { code: 'AG', name: 'Antigua And Barbuda', region: 'Americas', subregion: 'Caribbean', aliases: [] },
  { code: 'AR', name: 'Argentina', region: 'Americas', subregion: 'South America', aliases: [] },
  { code: 'BS', name: 'Bahamas', region: 'Americas', subregion: 'Caribbean', aliases: [] },
  { code: 'BB', name: 'Barbados', region: 'Americas', subregion: 'Caribbean', aliases: [] },
  { code: 'BZ', name: 'Belize', region: 'Americas', subregion: 'Central America', aliases: [] },
  { code: 'BO', name: 'Bolivia', region: 'Americas', subregion: 'South America', aliases: [] },
  { code: 'BR', name: 'Brazil', region: 'Americas', subregion: 'South America', aliases: [] },
  { code: 'CA', name: 'Canada', region: 'Americas', subregion: 'North America', aliases: [] },
  { code: 'CL', name: 'Chile', region: 'Americas', subregion: 'South America', aliases: [] },
  { code: 'CO', name: 'Colombia', region: 'Americas', subregion: 'South America', aliases: [] },
  { code: 'CR', name: 'Costa Rica', region: 'Americas', subregion: 'Central America', aliases: [] },
  { code: 'CU', name: 'Cuba', region: 'Americas', subregion: 'Caribbean', aliases: [] },
  { code: 'DM', name: 'Dominica', region: 'Americas', subregion: 'Caribbean', aliases: [] },
  { code: 'DO', name: 'Dominican Republic', region: 'Americas', subregion: 'Caribbean', aliases: [] },
  { code: 'EC', name: 'Ecuador', region: 'Americas', subregion: 'South America', aliases: [] },
  { code: 'SV', name: 'El Salvador', region: 'Americas', subregion: 'Central America', aliases: [] },
  { code: 'GD', name: 'Grenada', region: 'Americas', subregion: 'Caribbean', aliases: [] },
  { code: 'GT', name: 'Guatemala', region: 'Americas', subregion: 'Central America', aliases: [] },
  { code: 'GY', name: 'Guyana', region: 'Americas', subregion: 'South America', aliases: [] },
  { code: 'HT', name: 'Haiti', region: 'Americas', subregion: 'Caribbean', aliases: [] },
  { code: 'HN', name: 'Honduras', region: 'Americas', subregion: 'Central America', aliases: [] },
  { code: 'JM', name: 'Jamaica', region: 'Americas', subregion: 'Caribbean', aliases: [] },
  { code: 'MX', name: 'Mexico', region: 'Americas', subregion: 'Central America', aliases: [] },
  { code: 'NI', name: 'Nicaragua', region: 'Americas', subregion: 'Central America', aliases: [] },
  { code: 'PA', name: 'Panama', region: 'Americas', subregion: 'Central America', aliases: [] },
  { code: 'PY', name: 'Paraguay', region: 'Americas', subregion: 'South America', aliases: [] },
  { code: 'PE', name: 'Peru', region: 'Americas', subregion: 'South America', aliases: [] },
  { code: 'KN', name: 'Saint Kitts And Nevis', region: 'Americas', subregion: 'Caribbean', aliases: [] },
  { code: 'LC', name: 'Saint Lucia', region: 'Americas', subregion: 'Caribbean', aliases: [] },
  { code: 'VC', name: 'Saint Vincent And The Grenadines', region: 'Americas', subregion: 'Caribbean', aliases: [] },
  { code: 'SR', name: 'Suriname', region: 'Americas', subregion: 'South America', aliases: [] },
  { code: 'TT', name: 'Trinidad And Tobago', region: 'Americas', subregion: 'Caribbean', aliases: [] },
  { code: 'US', name: 'United States', region: 'Americas', subregion: 'North America', aliases: ['usa', 'united states of america', 'america'] },
  { code: 'UY', name: 'Uruguay', region: 'Americas', subregion: 'South America', aliases: [] },
  { code: 'VE', name: 'Venezuela', region: 'Americas', subregion: 'South America', aliases: [] },

  // Asia (50 countries)
  { code: 'AF', name: 'Afghanistan', region: 'Asia', subregion: 'Central Asia', aliases: [] },
  { code: 'BH', name: 'Bahrain', region: 'Asia', subregion: 'Middle East', aliases: [] },
  { code: 'BD', name: 'Bangladesh', region: 'Asia', subregion: 'South Asia', aliases: [] },
  { code: 'BT', name: 'Bhutan', region: 'Asia', subregion: 'South Asia', aliases: [] },
  { code: 'BN', name: 'Brunei', region: 'Asia', subregion: 'Southeast Asia', aliases: [] },
  { code: 'KH', name: 'Cambodia', region: 'Asia', subregion: 'Southeast Asia', aliases: [] },
  { code: 'CN', name: 'China', region: 'Asia', subregion: 'East Asia', aliases: [] },
  { code: 'IN', name: 'India', region: 'Asia', subregion: 'South Asia', aliases: [] },
  { code: 'ID', name: 'Indonesia', region: 'Asia', subregion: 'Southeast Asia', aliases: [] },
  { code: 'IR', name: 'Iran', region: 'Asia', subregion: 'Middle East', aliases: [] },
  { code: 'IQ', name: 'Iraq', region: 'Asia', subregion: 'Middle East', aliases: [] },
  { code: 'IL', name: 'Israel', region: 'Asia', subregion: 'Middle East', aliases: [] },
  { code: 'JP', name: 'Japan', region: 'Asia', subregion: 'East Asia', aliases: [] },
  { code: 'JO', name: 'Jordan', region: 'Asia', subregion: 'Middle East', aliases: [] },
  { code: 'KZ', name: 'Kazakhstan', region: 'Asia', subregion: 'Central Asia', aliases: [] },
  { code: 'KW', name: 'Kuwait', region: 'Asia', subregion: 'Middle East', aliases: [] },
  { code: 'KG', name: 'Kyrgyzstan', region: 'Asia', subregion: 'Central Asia', aliases: [] },
  { code: 'LA', name: 'Laos', region: 'Asia', subregion: 'Southeast Asia', aliases: [] },
  { code: 'LB', name: 'Lebanon', region: 'Asia', subregion: 'Middle East', aliases: [] },
  { code: 'MY', name: 'Malaysia', region: 'Asia', subregion: 'Southeast Asia', aliases: [] },
  { code: 'MV', name: 'Maldives', region: 'Asia', subregion: 'South Asia', aliases: [] },
  { code: 'MN', name: 'Mongolia', region: 'Asia', subregion: 'East Asia', aliases: [] },
  { code: 'MM', name: 'Myanmar', region: 'Asia', subregion: 'Southeast Asia', aliases: [] },
  { code: 'NP', name: 'Nepal', region: 'Asia', subregion: 'South Asia', aliases: [] },
  { code: 'KP', name: 'North Korea', region: 'Asia', subregion: 'East Asia', aliases: [] },
  { code: 'OM', name: 'Oman', region: 'Asia', subregion: 'Middle East', aliases: [] },
  { code: 'PK', name: 'Pakistan', region: 'Asia', subregion: 'South Asia', aliases: [] },
  { code: 'PS', name: 'Palestine', region: 'Asia', subregion: 'Middle East', aliases: [] },
  { code: 'PH', name: 'Philippines', region: 'Asia', subregion: 'Southeast Asia', aliases: [] },
  { code: 'QA', name: 'Qatar', region: 'Asia', subregion: 'Middle East', aliases: [] },
  { code: 'SA', name: 'Saudi Arabia', region: 'Asia', subregion: 'Middle East', aliases: [] },
  { code: 'SG', name: 'Singapore', region: 'Asia', subregion: 'Southeast Asia', aliases: [] },
  { code: 'KR', name: 'South Korea', region: 'Asia', subregion: 'East Asia', aliases: ['korea'] },
  { code: 'LK', name: 'Sri Lanka', region: 'Asia', subregion: 'South Asia', aliases: [] },
  { code: 'SY', name: 'Syria', region: 'Asia', subregion: 'Middle East', aliases: [] },
  { code: 'TW', name: 'Taiwan', region: 'Asia', subregion: 'East Asia', aliases: [] },
  { code: 'TJ', name: 'Tajikistan', region: 'Asia', subregion: 'Central Asia', aliases: [] },
  { code: 'TH', name: 'Thailand', region: 'Asia', subregion: 'Southeast Asia', aliases: [] },
  { code: 'TL', name: 'Timor-Leste', region: 'Asia', subregion: 'Southeast Asia', aliases: ['east timor'] },
  { code: 'TM', name: 'Turkmenistan', region: 'Asia', subregion: 'Central Asia', aliases: [] },
  { code: 'AE', name: 'United Arab Emirates', region: 'Asia', subregion: 'Middle East', aliases: ['uae'] },
  { code: 'UZ', name: 'Uzbekistan', region: 'Asia', subregion: 'Central Asia', aliases: [] },
  { code: 'VN', name: 'Vietnam', region: 'Asia', subregion: 'Southeast Asia', aliases: [] },
  { code: 'YE', name: 'Yemen', region: 'Asia', subregion: 'Middle East', aliases: [] },

  // Africa (54 countries)
  { code: 'DZ', name: 'Algeria', region: 'Africa', subregion: 'North Africa', aliases: [] },
  { code: 'AO', name: 'Angola', region: 'Africa', subregion: 'Central Africa', aliases: [] },
  { code: 'BJ', name: 'Benin', region: 'Africa', subregion: 'West Africa', aliases: [] },
  { code: 'BW', name: 'Botswana', region: 'Africa', subregion: 'Southern Africa', aliases: [] },
  { code: 'BF', name: 'Burkina Faso', region: 'Africa', subregion: 'West Africa', aliases: [] },
  { code: 'BI', name: 'Burundi', region: 'Africa', subregion: 'East Africa', aliases: [] },
  { code: 'CM', name: 'Cameroon', region: 'Africa', subregion: 'Central Africa', aliases: [] },
  { code: 'CV', name: 'Cape Verde', region: 'Africa', subregion: 'West Africa', aliases: [] },
  { code: 'CF', name: 'Central African Republic', region: 'Africa', subregion: 'Central Africa', aliases: [] },
  { code: 'TD', name: 'Chad', region: 'Africa', subregion: 'Central Africa', aliases: [] },
  { code: 'KM', name: 'Comoros', region: 'Africa', subregion: 'East Africa', aliases: [] },
  { code: 'CG', name: 'Congo', region: 'Africa', subregion: 'Central Africa', aliases: [] },
  { code: 'CD', name: 'Democratic Republic Of The Congo', region: 'Africa', subregion: 'Central Africa', aliases: ['drc', 'congo-kinshasa'] },
  { code: 'DJ', name: 'Djibouti', region: 'Africa', subregion: 'East Africa', aliases: [] },
  { code: 'EG', name: 'Egypt', region: 'Africa', subregion: 'North Africa', aliases: [] },
  { code: 'GQ', name: 'Equatorial Guinea', region: 'Africa', subregion: 'Central Africa', aliases: [] },
  { code: 'ER', name: 'Eritrea', region: 'Africa', subregion: 'East Africa', aliases: [] },
  { code: 'SZ', name: 'Eswatini', region: 'Africa', subregion: 'Southern Africa', aliases: ['swaziland'] },
  { code: 'ET', name: 'Ethiopia', region: 'Africa', subregion: 'East Africa', aliases: [] },
  { code: 'GA', name: 'Gabon', region: 'Africa', subregion: 'Central Africa', aliases: [] },
  { code: 'GM', name: 'Gambia', region: 'Africa', subregion: 'West Africa', aliases: [] },
  { code: 'GH', name: 'Ghana', region: 'Africa', subregion: 'West Africa', aliases: [] },
  { code: 'GN', name: 'Guinea', region: 'Africa', subregion: 'West Africa', aliases: [] },
  { code: 'GW', name: 'Guinea-Bissau', region: 'Africa', subregion: 'West Africa', aliases: [] },
  { code: 'CI', name: 'Ivory Coast', region: 'Africa', subregion: 'West Africa', aliases: ["cote d'ivoire"] },
  { code: 'KE', name: 'Kenya', region: 'Africa', subregion: 'East Africa', aliases: [] },
  { code: 'LS', name: 'Lesotho', region: 'Africa', subregion: 'Southern Africa', aliases: [] },
  { code: 'LR', name: 'Liberia', region: 'Africa', subregion: 'West Africa', aliases: [] },
  { code: 'LY', name: 'Libya', region: 'Africa', subregion: 'North Africa', aliases: [] },
  { code: 'MG', name: 'Madagascar', region: 'Africa', subregion: 'East Africa', aliases: [] },
  { code: 'MW', name: 'Malawi', region: 'Africa', subregion: 'East Africa', aliases: [] },
  { code: 'ML', name: 'Mali', region: 'Africa', subregion: 'West Africa', aliases: [] },
  { code: 'MR', name: 'Mauritania', region: 'Africa', subregion: 'West Africa', aliases: [] },
  { code: 'MU', name: 'Mauritius', region: 'Africa', subregion: 'East Africa', aliases: [] },
  { code: 'MA', name: 'Morocco', region: 'Africa', subregion: 'North Africa', aliases: [] },
  { code: 'MZ', name: 'Mozambique', region: 'Africa', subregion: 'East Africa', aliases: [] },
  { code: 'NA', name: 'Namibia', region: 'Africa', subregion: 'Southern Africa', aliases: [] },
  { code: 'NE', name: 'Niger', region: 'Africa', subregion: 'West Africa', aliases: [] },
  { code: 'NG', name: 'Nigeria', region: 'Africa', subregion: 'West Africa', aliases: [] },
  { code: 'RW', name: 'Rwanda', region: 'Africa', subregion: 'East Africa', aliases: [] },
  { code: 'ST', name: 'Sao Tome And Principe', region: 'Africa', subregion: 'Central Africa', aliases: [] },
  { code: 'SN', name: 'Senegal', region: 'Africa', subregion: 'West Africa', aliases: [] },
  { code: 'SC', name: 'Seychelles', region: 'Africa', subregion: 'East Africa', aliases: [] },
  { code: 'SL', name: 'Sierra Leone', region: 'Africa', subregion: 'West Africa', aliases: [] },
  { code: 'SO', name: 'Somalia', region: 'Africa', subregion: 'East Africa', aliases: [] },
  { code: 'ZA', name: 'South Africa', region: 'Africa', subregion: 'Southern Africa', aliases: [] },
  { code: 'SS', name: 'South Sudan', region: 'Africa', subregion: 'East Africa', aliases: [] },
  { code: 'SD', name: 'Sudan', region: 'Africa', subregion: 'North Africa', aliases: [] },
  { code: 'TZ', name: 'Tanzania', region: 'Africa', subregion: 'East Africa', aliases: [] },
  { code: 'TG', name: 'Togo', region: 'Africa', subregion: 'West Africa', aliases: [] },
  { code: 'TN', name: 'Tunisia', region: 'Africa', subregion: 'North Africa', aliases: [] },
  { code: 'UG', name: 'Uganda', region: 'Africa', subregion: 'East Africa', aliases: [] },
  { code: 'ZM', name: 'Zambia', region: 'Africa', subregion: 'East Africa', aliases: [] },
  { code: 'ZW', name: 'Zimbabwe', region: 'Africa', subregion: 'East Africa', aliases: [] },

  // Oceania (14 countries)
  { code: 'AU', name: 'Australia', region: 'Oceania', subregion: 'Australia And New Zealand', aliases: [] },
  { code: 'FJ', name: 'Fiji', region: 'Oceania', subregion: 'Melanesia', aliases: [] },
  { code: 'KI', name: 'Kiribati', region: 'Oceania', subregion: 'Micronesia', aliases: [] },
  { code: 'MH', name: 'Marshall Islands', region: 'Oceania', subregion: 'Micronesia', aliases: [] },
  { code: 'FM', name: 'Micronesia', region: 'Oceania', subregion: 'Micronesia', aliases: [] },
  { code: 'NR', name: 'Nauru', region: 'Oceania', subregion: 'Micronesia', aliases: [] },
  { code: 'NZ', name: 'New Zealand', region: 'Oceania', subregion: 'Australia And New Zealand', aliases: [] },
  { code: 'PW', name: 'Palau', region: 'Oceania', subregion: 'Micronesia', aliases: [] },
  { code: 'PG', name: 'Papua New Guinea', region: 'Oceania', subregion: 'Melanesia', aliases: [] },
  { code: 'WS', name: 'Samoa', region: 'Oceania', subregion: 'Polynesia', aliases: [] },
  { code: 'SB', name: 'Solomon Islands', region: 'Oceania', subregion: 'Melanesia', aliases: [] },
  { code: 'TO', name: 'Tonga', region: 'Oceania', subregion: 'Polynesia', aliases: [] },
  { code: 'TV', name: 'Tuvalu', region: 'Oceania', subregion: 'Polynesia', aliases: [] },
  { code: 'VU', name: 'Vanuatu', region: 'Oceania', subregion: 'Melanesia', aliases: [] },
];

async function main() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'messmass');
    const collection = db.collection('countries');
    
    console.log('🌍 Seeding countries collection...\n');
    
    // Clear existing data
    await collection.deleteMany({});
    console.log('✅ Cleared existing countries\n');
    
    // Prepare documents with flags and timestamps
    const now = new Date().toISOString();
    const documents = COUNTRIES.map(country => ({
      code: country.code,
      name: country.name,
      flag: codeToFlag(country.code),
      region: country.region,
      subregion: country.subregion,
      aliases: country.aliases,
      active: true,
      createdAt: now,
      updatedAt: now
    }));
    
    // Insert all countries
    const result = await collection.insertMany(documents);
    console.log(`✅ Inserted ${result.insertedCount} countries\n`);
    
    // Create indexes for performance
    await collection.createIndex({ code: 1 }, { unique: true });
    await collection.createIndex({ name: 'text' });
    await collection.createIndex({ aliases: 1 });
    await collection.createIndex({ region: 1 });
    
    console.log('✅ Created indexes: code (unique), name (text), aliases, region\n');
    
    // Summary by region
    const regions = await collection.aggregate([
      { $group: { _id: '$region', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();
    
    console.log('📊 Countries by region:');
    regions.forEach(r => console.log(`   ${r._id}: ${r.count} countries`));
    
    console.log('\n🎉 Country database seeded successfully!');
    console.log(`📚 Collection: countries`);
    console.log(`🔢 Total: ${result.insertedCount} countries`);
    
  } finally {
    await client.close();
  }
}

main().catch(console.error);
