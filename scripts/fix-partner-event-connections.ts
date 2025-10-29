import { MongoClient, ObjectId } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Inline enrichment logic
async function enrichProject(db: any, projectId: ObjectId) {
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
  
  const linkIds = junctions.map((j: any) => j.bitlyLinkId);
  
  const links = await db.collection('bitly_links').find({
    _id: { $in: linkIds },
    'cachedMetrics.topCountries': { $exists: true, $ne: null }
  }).toArray();
  
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

async function fixPartnerEventConnections() {
  const client = new MongoClient(process.env.MONGODB_URI || '');
  
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'messmass');
    
    console.log('🔍 Step 1: Finding all projects with partner references...\n');
    
    const projectsWithPartners = await db.collection('projects').find({
      $or: [
        { partner1Id: { $exists: true } },
        { partner2Id: { $exists: true } }
      ]
    }).toArray();
    
    console.log(`Found ${projectsWithPartners.length} projects with partner references\n`);
    
    let associatedCount = 0;
    let enrichedCount = 0;
    
    for (const project of projectsWithPartners) {
      console.log(`\n📊 Processing: ${project.eventName}`);
      console.log(`   Partner 1: ${project.partner1Id || 'none'}`);
      console.log(`   Partner 2: ${project.partner2Id || 'none'}`);
      
      // Associate Partner 1's Bitly links with the project
      if (project.partner1Id) {
        try {
          const partner = await db.collection('partners').findOne({
            _id: new ObjectId(project.partner1Id)
          });
          
          if (partner && partner.bitlyLinkIds && partner.bitlyLinkIds.length > 0) {
            console.log(`   → Partner 1 "${partner.name}" has ${partner.bitlyLinkIds.length} Bitly links`);
            
            // Check how many are already associated
            const existingJunctions = await db.collection('bitly_link_project_junction').countDocuments({
              projectId: project._id
            });
            
            if (existingJunctions > 0) {
              console.log(`   ✓ Already has ${existingJunctions} Bitly links associated`);
            } else {
              console.log(`   → Associating ${partner.bitlyLinkIds.length} Bitly links...`);
              
              // Create junction entries for each Bitly link
              const junctionEntries = partner.bitlyLinkIds.map((linkId: any) => ({
                bitlyLinkId: new ObjectId(linkId),
                projectId: project._id,
                autoCalculated: true,
                createdAt: new Date().toISOString()
              }));
              
              await db.collection('bitly_link_project_junction').insertMany(junctionEntries);
              console.log(`   ✅ Associated ${junctionEntries.length} links`);
              associatedCount++;
            }
          } else {
            console.log(`   ⚠️ Partner 1 has no Bitly links`);
          }
        } catch (error) {
          console.error(`   ❌ Error associating Partner 1 links:`, error);
        }
      }
      
      // Now enrich the project with country data
      try {
        const enrichment = await enrichProject(db, project._id);
        
        if (enrichment.bitlyCountryCount > 0) {
          const updateFields: Record<string, any> = {};
          Object.entries(enrichment).forEach(([key, value]) => {
            updateFields[`stats.${key}`] = value;
          });
          
          await db.collection('projects').updateOne(
            { _id: project._id },
            { $set: updateFields }
          );
          
          console.log(`   ✅ Enriched with ${enrichment.bitlyCountryCount} countries`);
          console.log(`      Top country: ${enrichment.bitlyTopCountry} (${enrichment.bitlyClicksByCountry} clicks)`);
          enrichedCount++;
        } else {
          console.log(`   ⚠️ No country data available (no Bitly analytics yet)`);
        }
      } catch (error) {
        console.error(`   ❌ Error enriching project:`, error);
      }
    }
    
    console.log(`\n\n📊 Summary:`);
    console.log(`   Total projects processed: ${projectsWithPartners.length}`);
    console.log(`   Projects with new Bitly associations: ${associatedCount}`);
    console.log(`   Projects enriched with country data: ${enrichedCount}`);
    
    // Verify the fix worked
    console.log(`\n\n🔍 Verification - checking a sample project...`);
    const sampleProject = projectsWithPartners[0];
    if (sampleProject) {
      const updated = await db.collection('projects').findOne({ _id: sampleProject._id });
      const junctionCount = await db.collection('bitly_link_project_junction').countDocuments({
        projectId: sampleProject._id
      });
      
      console.log(`\nProject: ${updated?.eventName}`);
      console.log(`  Bitly links associated: ${junctionCount}`);
      console.log(`  bitlyCountry1: ${updated?.stats?.bitlyCountry1 || 'MISSING'}`);
      console.log(`  bitlyCountry1Clicks: ${updated?.stats?.bitlyCountry1Clicks || 'MISSING'}`);
      console.log(`  bitlyCountryCount: ${updated?.stats?.bitlyCountryCount || 'MISSING'}`);
      console.log(`  bitlyTopCountry: ${updated?.stats?.bitlyTopCountry || 'MISSING'}`);
    }
    
  } finally {
    await client.close();
  }
}

fixPartnerEventConnections();
