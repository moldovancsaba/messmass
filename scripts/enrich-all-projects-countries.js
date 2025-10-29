// WHAT: Enrich ALL projects with country names from Bitly links (not just partner-based)
// WHY: Some projects don't have partner1Id but still have Bitly links with country data
// HOW: Query all projects, find associated Bitly links, aggregate country data, update stats

const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

// WHAT: Load countries from MongoDB
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

async function enrichProject(db, projectId) {
  // Find all Bitly links associated with this project
  const junctions = await db.collection('bitly_link_project_junction').find({
    projectId: projectId
  }).toArray();
  
  if (junctions.length === 0) return null;
  
  const linkIds = junctions.map(j => j.bitlyLinkId);
  const links = await db.collection('bitly_links').find({
    _id: { $in: linkIds },
    'cachedMetrics.topCountries': { $exists: true }
  }).toArray();
  
  // Aggregate country data from all links
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
  
  if (countryMap.size === 0) return null;
  
  // Sort by clicks and get top 5
  const sorted = Array.from(countryMap.values()).sort((a, b) => b.clicks - a.clicks);
  const top5 = sorted.slice(0, 5);
  const topCountry = sorted[0];
  
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
    
    // Load countries
    await loadCountries(db);
    
    console.log('🔄 Finding ALL projects with Bitly links...\n');
    
    // Get all projects (not just partner-based)
    const projects = await db.collection('projects').find({}).toArray();
    
    console.log(`Found ${projects.length} total projects\n`);
    
    let enriched = 0;
    let skipped = 0;
    
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
      } else {
        skipped++;
      }
    }
    
    console.log(`\n📊 Enrichment Summary:`);
    console.log(`   ✅ Enriched: ${enriched} projects`);
    console.log(`   ⏭️  Skipped: ${skipped} projects (no Bitly data)`);
    console.log('\n🎉 Country charts should now display correctly on ALL projects!');
    
  } finally {
    await client.close();
  }
}

main().catch(console.error);
