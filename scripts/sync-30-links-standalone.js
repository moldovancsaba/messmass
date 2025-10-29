// Standalone sync script using CommonJS (no TypeScript/ESM issues)
const { MongoClient, ObjectId } = require('mongodb');
const https = require('https');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

// WHAT: Load country mappings from MongoDB instead of hardcoding
// WHY: Single source of truth for geographic data
let countryMap = null;

async function loadCountries(db) {
  if (countryMap) return countryMap;
  
  const countries = await db.collection('countries').find({ active: true }).toArray();
  countryMap = new Map();
  
  countries.forEach(c => {
    countryMap.set(c.code.toUpperCase(), c);
  });
  
  console.log(`Loaded ${countries.length} countries from MongoDB\n`);
  return countryMap;
}

function getCountryName(code) {
  if (!countryMap) return 'Unknown';
  const country = countryMap.get(code?.toUpperCase());
  return country?.name || code || 'Unknown';
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
    
    // Load countries from MongoDB
    await loadCountries(db);
    
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
