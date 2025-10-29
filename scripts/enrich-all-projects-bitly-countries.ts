import { MongoClient, ObjectId } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Inline the enrichment logic to avoid module resolution issues
async function enrichProject(db: any, projectId: ObjectId) {
  // Get all Bitly links for this project
  const junctions = await db.collection('bitly_link_project_junction').find({
    projectId: projectId
  }).toArray();
  
  if (junctions.length === 0) {
    return {
      bitlyCountryCount: 0,
      bitlyTopCountry: '',
      bitlyClicksByCountry: 0
    };
  }
  
  // Get link IDs
  const linkIds = junctions.map((j: any) => j.bitlyLinkId);
  
  // Get links with country data
  const links = await db.collection('bitly_links').find({
    _id: { $in: linkIds },
    'cachedMetrics.topCountries': { $exists: true, $ne: null }
  }).toArray();
  
  // Aggregate country clicks
  const countryMap = new Map<string, { name: string; clicks: number }>();
  
  for (const link of links) {
    const topCountries = link.cachedMetrics?.topCountries || [];
    for (const country of topCountries) {
      if (country.country && country.clicks) {
        const existing = countryMap.get(country.country);
        if (existing) {
          existing.clicks += country.clicks;
        } else {
          countryMap.set(country.country, {
            name: country.country,
            clicks: country.clicks
          });
        }
      }
    }
  }
  
  // Sort by clicks and get top 5
  const sorted = Array.from(countryMap.values())
    .sort((a, b) => b.clicks - a.clicks);
  
  const top5 = sorted.slice(0, 5);
  const topCountry = sorted[0];
  
  if (!topCountry) {
    return {
      bitlyCountryCount: 0,
      bitlyTopCountry: '',
      bitlyClicksByCountry: 0
    };
  }
  
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

async function enrichAllProjects() {
  const client = new MongoClient(process.env.MONGODB_URI || '');
  
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'messmass');
    
    console.log('🔍 Finding projects with Bitly links...\n');
    
    // Get all projects that have associated Bitly links
    const junctions = await db.collection('bitly_link_project_junction')
      .aggregate([
        {
          $group: {
            _id: '$projectId',
            linkCount: { $sum: 1 }
          }
        }
      ])
      .toArray();
    
    console.log(`Found ${junctions.length} projects with Bitly links\n`);
    
    if (junctions.length === 0) {
      console.log('⚠️ No projects have Bitly links associated');
      console.log('   Run the Bitly sync or associate links with projects first');
      return;
    }
    
    const projectIds = junctions.map(j => j._id);
    
    console.log('📊 Sample projects to enrich:');
    for (let i = 0; i < Math.min(5, projectIds.length); i++) {
      const project = await db.collection('projects').findOne({ _id: projectIds[i] });
      console.log(`  - ${project?.eventName} (${junctions[i].linkCount} links)`);
    }
    
    console.log(`\n🔄 Enriching ${projectIds.length} projects with Bitly country data...\n`);
    
    let enrichedCount = 0;
    for (const projectId of projectIds) {
      const enrichment = await enrichProject(db, projectId);
      
      // Build update object
      const updateFields: Record<string, any> = {};
      Object.entries(enrichment).forEach(([key, value]) => {
        updateFields[`stats.${key}`] = value;
      });
      
      await db.collection('projects').updateOne(
        { _id: projectId },
        { $set: updateFields }
      );
      
      enrichedCount++;
      if (enrichedCount % 10 === 0) {
        console.log(`  Enriched ${enrichedCount}/${projectIds.length} projects...`);
      }
    }
    
    console.log(`\n✅ Successfully enriched ${enrichedCount} projects`);
    
    // Verify enrichment worked
    console.log('\n🔍 Verifying enrichment...\n');
    const sampleProject = await db.collection('projects').findOne({ _id: projectIds[0] });
    if (sampleProject) {
      console.log(`Sample project: ${sampleProject.eventName}`);
      console.log(`  bitlyCountry1: ${sampleProject.stats?.bitlyCountry1 || 'MISSING'}`);
      console.log(`  bitlyCountry1Clicks: ${sampleProject.stats?.bitlyCountry1Clicks || 'MISSING'}`);
      console.log(`  bitlyCountryCount: ${sampleProject.stats?.bitlyCountryCount || 'MISSING'}`);
      console.log(`  bitlyTopCountry: ${sampleProject.stats?.bitlyTopCountry || 'MISSING'}`);
    }
    
  } finally {
    await client.close();
  }
}

enrichAllProjects();
