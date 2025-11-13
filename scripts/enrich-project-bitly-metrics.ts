// WHAT: Enrich project.stats with Bitly metrics from bitly_project_links junction table
// WHY: BuilderMode and reports show 0 for Bitly data because project.stats is not populated
// HOW: Aggregate cachedMetrics from all junction entries and copy to project.stats

import { MongoClient, ObjectId } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI || '';
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

async function enrichProjectBitlyMetrics(projectId?: string) {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db(MONGODB_DB);
    
    // Find projects to enrich
    const query = projectId ? { _id: new ObjectId(projectId) } : {};
    const projects = await db.collection('projects').find(query).toArray();
    
    console.log(`📊 Enriching ${projects.length} project(s)...\n`);
    
    let enriched = 0;
    
    for (const project of projects) {
      // Get all Bitly associations
      const junctions = await db.collection('bitly_project_links').find({
        projectId: project._id
      }).toArray();
      
      if (junctions.length === 0) {
        console.log(`  ⏭️  ${project.eventName}: No Bitly links`);
        continue;
      }
      
      // Aggregate metrics from all links
      let totalClicks = 0;
      let totalUniqueClicks = 0;
      const countryMap = new Map<string, number>();
      
      for (const j of junctions) {
        const metrics = j.cachedMetrics || {};
        totalClicks += metrics.clicks || 0;
        totalUniqueClicks += metrics.uniqueClicks || 0;
        
        // Aggregate countries
        if (metrics.topCountries && Array.isArray(metrics.topCountries)) {
          for (const c of metrics.topCountries) {
            const current = countryMap.get(c.country) || 0;
            countryMap.set(c.country, current + c.clicks);
          }
        }
      }
      
      // Sort countries by clicks
      const topCountries = Array.from(countryMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
      
      // Build update object
      const update: Record<string, any> = {
        'stats.bitlyTotalClicks': totalClicks,
        'stats.bitlyUniqueClicks': totalUniqueClicks,
        'stats.bitlyCountryCount': topCountries.length,
      };
      
      if (topCountries.length > 0) {
        update['stats.bitlyTopCountry'] = topCountries[0][0];
        update['stats.bitlyClicksByCountry'] = topCountries[0][1];
        
        // Add individual country clicks
        topCountries.forEach(([country, clicks], index) => {
          const isoCode = country; // Already in ISO format from Bitly
          update[`stats.bitlyClicksByCountry${isoCode}`] = clicks;
        });
      }
      
      // Update project
      await db.collection('projects').updateOne(
        { _id: project._id },
        { $set: update }
      );
      
      enriched++;
      console.log(`  ✅ ${project.eventName}: ${totalClicks} clicks, ${topCountries.length} countries`);
    }
    
    console.log(`\n✅ Enriched ${enriched}/${projects.length} projects`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Get project ID from command line argument
const projectId = process.argv[2];

if (projectId && projectId !== 'undefined' && !ObjectId.isValid(projectId)) {
  console.error('❌ Invalid project ID format');
  process.exit(1);
}

// If no valid ID provided, enrich all projects
const projectIdToUse = (projectId && projectId !== 'undefined' && ObjectId.isValid(projectId)) ? projectId : undefined;

enrichProjectBitlyMetrics(projectIdToUse)
  .then(() => {
    console.log('\n✅ Enrichment complete');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Enrichment failed:', err);
    process.exit(1);
  });
