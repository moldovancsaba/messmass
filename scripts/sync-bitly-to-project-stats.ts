// WHAT: Sync Bitly cached metrics from junction table to project.stats
// WHY: Bitly data needs to be in project.stats for KYC visibility and reports
// HOW: Pull from bitly_project_links.cachedMetrics and ADD to existing values (never overwrite)

// CRITICAL RULE: Only ADD new data, never overwrite historical data
// Bitly deletes historical data, so we must preserve cumulative totals

import { MongoClient, ObjectId } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('❌ MONGODB_URI not found in environment');
  process.exit(1);
}

interface BitlyMetrics {
  totalClicks?: number;
  uniqueClicks?: number;
  countriesData?: Array<{ country: string; clicks: number }>;
  referrersData?: Array<{ referrer: string; clicks: number }>;
  devicesData?: Array<{ device: string; clicks: number }>;
}

interface ProjectStats {
  totalBitlyClicks?: number;
  uniqueBitlyClicks?: number;
  [key: string]: any; // Other stats fields
}

async function syncBitlyToProjectStats(options: { dryRun?: boolean; projectId?: string } = {}) {
  const client = new MongoClient(uri!);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db('messmass');
    const projects = db.collection('projects');
    const bitlyProjectLinks = db.collection('bitly_project_links');
    
    console.log('🔄 Syncing Bitly metrics to project.stats...\n');
    console.log('📋 Mode:', options.dryRun ? 'DRY RUN (no changes)' : 'LIVE UPDATE');
    if (options.projectId) {
      console.log('🎯 Target: Single project', options.projectId);
    } else {
      console.log('🎯 Target: All projects with Bitly junctions');
    }
    console.log('');
    
    // Step 1: Find all projects with Bitly junctions
    const query = options.projectId 
      ? { projectId: new ObjectId(options.projectId) }
      : {};
    
    const junctions = await bitlyProjectLinks.find(query).toArray();
    console.log(`📊 Found ${junctions.length} Bitly junctions to process\n`);
    
    if (junctions.length === 0) {
      console.log('✅ No junctions found. Exiting.');
      return;
    }
    
    // Step 2: Group junctions by projectId
    const projectJunctions = new Map<string, any[]>();
    junctions.forEach(junction => {
      const projectId = junction.projectId.toString();
      if (!projectJunctions.has(projectId)) {
        projectJunctions.set(projectId, []);
      }
      projectJunctions.get(projectId)!.push(junction);
    });
    
    console.log(`🎯 Processing ${projectJunctions.size} unique projects\n`);
    console.log('='.repeat(80));
    
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const [projectId, junctionsForProject] of projectJunctions.entries()) {
      try {
        // Step 3: Aggregate metrics from all junctions for this project
        let aggregatedTotalClicks = 0;
        let aggregatedUniqueClicks = 0;
        const countryClicksMap = new Map<string, number>();
        
        junctionsForProject.forEach(junction => {
          const metrics = junction.cachedMetrics as BitlyMetrics;
          if (!metrics) return;
          
          // Sum clicks
          aggregatedTotalClicks += metrics.totalClicks || 0;
          aggregatedUniqueClicks += metrics.uniqueClicks || 0;
          
          // Aggregate countries
          if (metrics.countriesData) {
            metrics.countriesData.forEach(({ country, clicks }) => {
              const current = countryClicksMap.get(country) || 0;
              countryClicksMap.set(country, current + clicks);
            });
          }
        });
        
        // Step 4: Get current project stats
        const project = await projects.findOne({ _id: new ObjectId(projectId) });
        if (!project) {
          console.log(`⚠️  Project ${projectId} not found, skipping`);
          skippedCount++;
          continue;
        }
        
        const currentStats = project.stats || {};
        const currentTotalClicks = currentStats.totalBitlyClicks || 0;
        const currentUniqueClicks = currentStats.uniqueBitlyClicks || 0;
        
        // CRITICAL: Only ADD new clicks, never reduce (historical preservation)
        // If current value is higher, keep it (Bitly may have deleted old data)
        const newTotalClicks = Math.max(currentTotalClicks, aggregatedTotalClicks);
        const newUniqueClicks = Math.max(currentUniqueClicks, aggregatedUniqueClicks);
        
        // Check if update needed
        const needsUpdate = 
          newTotalClicks !== currentTotalClicks ||
          newUniqueClicks !== currentUniqueClicks;
        
        if (!needsUpdate) {
          console.log(`✓ ${project.eventName}: Already up to date`);
          skippedCount++;
          continue;
        }
        
        // Step 5: Build update object
        const updateStats: any = {
          totalBitlyClicks: newTotalClicks,
          uniqueBitlyClicks: newUniqueClicks,
        };
        
        // Add country-specific clicks (top 10 countries)
        const topCountries = Array.from(countryClicksMap.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10);
        
        topCountries.forEach(([country, clicks]) => {
          const fieldName = `bitlyClicksByCountry${country}`;
          const currentValue = currentStats[fieldName] || 0;
          updateStats[fieldName] = Math.max(currentValue, clicks);
        });
        
        // Step 6: Apply update (or log for dry run)
        if (options.dryRun) {
          console.log(`📝 [DRY RUN] ${project.eventName}:`);
          console.log(`   Total: ${currentTotalClicks} → ${newTotalClicks} (+${newTotalClicks - currentTotalClicks})`);
          console.log(`   Unique: ${currentUniqueClicks} → ${newUniqueClicks} (+${newUniqueClicks - currentUniqueClicks})`);
          console.log(`   Countries: ${topCountries.length} updated`);
        } else {
          await projects.updateOne(
            { _id: new ObjectId(projectId) },
            { 
              $set: Object.keys(updateStats).reduce((acc, key) => {
                acc[`stats.${key}`] = updateStats[key];
                return acc;
              }, {} as any)
            }
          );
          
          console.log(`✅ ${project.eventName}:`);
          console.log(`   Total: ${currentTotalClicks} → ${newTotalClicks} (+${newTotalClicks - currentTotalClicks})`);
          console.log(`   Unique: ${currentUniqueClicks} → ${newUniqueClicks} (+${newUniqueClicks - currentUniqueClicks})`);
          console.log(`   Countries: ${topCountries.length} updated`);
        }
        
        updatedCount++;
        
      } catch (error) {
        console.error(`❌ Error processing project ${projectId}:`, error);
        errorCount++;
      }
    }
    
    console.log('='.repeat(80));
    console.log('\n📊 SYNC SUMMARY\n');
    console.log(`   ✅ Updated: ${updatedCount}`);
    console.log(`   ⏭️  Skipped: ${skippedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📋 Total: ${projectJunctions.size}`);
    
    if (options.dryRun) {
      console.log('\n⚠️  This was a DRY RUN. No changes were made.');
      console.log('   Run with --apply flag to apply changes.');
    } else {
      console.log('\n✅ Sync completed successfully!');
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n✅ Database connection closed\n');
  }
}

// Parse CLI arguments
const args = process.argv.slice(2);
const options = {
  dryRun: !args.includes('--apply'),
  projectId: args.find(arg => arg.startsWith('--project='))?.split('=')[1],
};

syncBitlyToProjectStats(options);
