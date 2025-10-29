// Standalone sync script using CommonJS (no TypeScript/ESM issues)
const { MongoClient, ObjectId } = require('mongodb');
const https = require('https');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

// Country code to name mapping (ISO 3166-1 alpha-2)
const COUNTRY_NAMES = {
  'US': 'United States',
  'GB': 'United Kingdom',
  'DE': 'Germany',
  'FR': 'France',
  'ES': 'Spain',
  'IT': 'Italy',
  'CA': 'Canada',
  'AU': 'Australia',
  'NL': 'Netherlands',
  'BE': 'Belgium',
  'CH': 'Switzerland',
  'AT': 'Austria',
  'SE': 'Sweden',
  'NO': 'Norway',
  'DK': 'Denmark',
  'FI': 'Finland',
  'PL': 'Poland',
  'CZ': 'Czech Republic',
  'PT': 'Portugal',
  'IE': 'Ireland',
  'RO': 'Romania',
  'HU': 'Hungary',
  'GR': 'Greece',
  'BR': 'Brazil',
  'MX': 'Mexico',
  'AR': 'Argentina',
  'CL': 'Chile',
  'CO': 'Colombia',
  'IN': 'India',
  'JP': 'Japan',
  'CN': 'China',
  'KR': 'South Korea',
  'SG': 'Singapore',
  'HK': 'Hong Kong',
  'TW': 'Taiwan',
  'MY': 'Malaysia',
  'TH': 'Thailand',
  'ID': 'Indonesia',
  'PH': 'Philippines',
  'VN': 'Vietnam',
  'NZ': 'New Zealand',
  'ZA': 'South Africa',
  'RU': 'Russia',
  'UA': 'Ukraine',
  'TR': 'Turkey',
  'IL': 'Israel',
  'AE': 'United Arab Emirates',
  'SA': 'Saudi Arabia',
  'EG': 'Egypt',
  'NG': 'Nigeria',
  'KE': 'Kenya',
  'LU': 'Luxembourg',
  'HR': 'Croatia',
  'SI': 'Slovenia',
  'SK': 'Slovakia',
  'BG': 'Bulgaria',
  'LT': 'Lithuania',
  'LV': 'Latvia',
  'EE': 'Estonia',
  'IS': 'Iceland',
  'MT': 'Malta',
  'CY': 'Cyprus',
};

function getCountryName(code) {
  return COUNTRY_NAMES[code?.toUpperCase()] || code || 'Unknown';
}

// Bitly API helper
async function fetchBitlyAnalytics(bitlink, endpoint) {
  return new Promise((resolve, reject) => {
    const url = `https://api-ssl.bitly.com/v4/bitlinks/${bitlink}/${endpoint}`;
    
    const options = {
      headers: {
        'Authorization': `Bearer ${process.env.BITLY_ACCESS_TOKEN}`,
        'Accept': 'application/json'
      }
    };
    
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Bitly API error: ${res.statusCode} - ${data}`));
        }
      });
    }).on('error', reject);
  });
}

async function syncLink(db, link) {
  try {
    console.log(`Syncing: ${link.bitlink}...`);
    
    // Fetch countries data from Bitly
    const countriesData = await fetchBitlyAnalytics(link.bitlink, 'countries');
    
    // Map to our format
    const countries = (countriesData.metrics || []).map(metric => ({
      country: metric.value,
      clicks: metric.clicks
    }));
    
    // Update MongoDB
    const now = new Date().toISOString();
    await db.collection('bitly_links').updateOne(
      { _id: link._id },
      {
        $set: {
          'geo.countries': countries,
          'cachedMetrics.topCountries': countries,
          lastSyncAt: now,
          updatedAt: now,
        },
      }
    );
    
    console.log(`  ✅ Synced (${countries.length} countries)\n`);
    return true;
  } catch (error) {
    console.error(`  ❌ Error: ${error.message}\n`);
    return false;
  }
}

async function enrichProject(db, projectId) {
  const junctions = await db.collection('bitly_link_project_junction').find({
    projectId: projectId
  }).toArray();
  
  if (junctions.length === 0) return null;
  
  const linkIds = junctions.map(j => j.bitlyLinkId);
  const links = await db.collection('bitly_links').find({
    _id: { $in: linkIds },
    'cachedMetrics.topCountries': { $exists: true }
  }).toArray();
  
  const countryMap = new Map();
  
  for (const link of links) {
    const topCountries = link.cachedMetrics?.topCountries || [];
    for (const country of topCountries) {
      if (country.country && country.clicks) {
        const countryCode = country.country;
        const countryName = getCountryName(countryCode);
        const existing = countryMap.get(countryCode);
        if (existing) {
          existing.clicks += country.clicks;
        } else {
          countryMap.set(countryCode, {
            name: countryName,
            clicks: country.clicks
          });
        }
      }
    }
  }
  
  const sorted = Array.from(countryMap.values()).sort((a, b) => b.clicks - a.clicks);
  const top5 = sorted.slice(0, 5);
  const topCountry = sorted[0];
  
  if (!topCountry) return null;
  
  return {
    bitlyCountry1: top5[0]?.name,
    bitlyCountry1Clicks: top5[0]?.clicks,
    bitlyCountry2: top5[1]?.name,
    bitlyCountry2Clicks: top5[1]?.clicks,
    bitlyCountry3: top5[2]?.name,
    bitlyCountry3Clicks: top5[2]?.clicks,
    bitlyCountry4: top5[3]?.name,
    bitlyCountry4Clicks: top5[3]?.clicks,
    bitlyCountry5: top5[4]?.name,
    bitlyCountry5Clicks: top5[4]?.clicks,
    bitlyCountryCount: countryMap.size,
    bitlyTopCountry: topCountry.name,
    bitlyClicksByCountry: topCountry.clicks
  };
}

async function main() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'messmass');
    
    console.log('🔍 Fetching last 30 Bitly links...\n');
    
    const links = await db.collection('bitly_links')
      .find({ archived: { $ne: true } })
      .sort({ createdAt: -1 })
      .limit(30)
      .toArray();
    
    console.log(`Found ${links.length} links to sync\n`);
    
    let synced = 0;
    for (const link of links) {
      const success = await syncLink(db, link);
      if (success) synced++;
      
      // Rate limiting delay
      await new Promise(resolve => setTimeout(resolve, 600));
    }
    
    console.log(`\n📊 Sync Summary: ${synced}/${links.length} links synced\n`);
    
    if (synced > 0) {
      console.log('🔄 Enriching projects with country data...\n');
      
      const projects = await db.collection('projects').find({
        partner1Id: { $exists: true }
      }).toArray();
      
      let enriched = 0;
      for (const project of projects) {
        const enrichment = await enrichProject(db, project._id);
        if (enrichment && enrichment.bitlyCountryCount > 0) {
          const updateFields = {};
          Object.entries(enrichment).forEach(([key, value]) => {
            updateFields[`stats.${key}`] = value;
          });
          
          await db.collection('projects').updateOne(
            { _id: project._id },
            { $set: updateFields }
          );
          
          console.log(`  ✅ ${project.eventName}: ${enrichment.bitlyTopCountry} (${enrichment.bitlyCountryCount} countries)`);
          enriched++;
        }
      }
      
      console.log(`\n✅ Done! Enriched ${enriched} projects with country data`);
      console.log('\n🎉 Country charts should now be visible on stats pages!');
    }
    
  } finally {
    await client.close();
  }
}

main().catch(console.error);
