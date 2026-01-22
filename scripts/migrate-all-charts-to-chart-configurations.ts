// WHAT: Migrate ALL charts from ALL collections to chart_configurations (single source of truth)
// WHY: Multiple chart collections (chartConfigurations, chart_configurations, chart_algorithms, charts) causing missing algorithms
// HOW: Find all chart-related collections, migrate unique charts to chart_configurations, preserve existing reports
// SAFETY: Only migrates charts that don't already exist (by chartId), preserves all existing data

import { MongoClient, ObjectId } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI || '';
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';
const CANONICAL_COLLECTION = 'chart_configurations';

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

async function migrateAllCharts() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db(MONGODB_DB);
    
    // WHAT: Find ALL chart-related collections
    // WHY: Charts might be in multiple collections (chartConfigurations, chart_configurations, chart_algorithms, charts, etc.)
    const allCollections = await db.listCollections().toArray();
    const chartCollections = allCollections
      .filter(c => {
        const name = c.name.toLowerCase();
        return (name.includes('chart') && (name.includes('config') || name.includes('algorithm'))) || name === 'charts';
      })
      .map(c => c.name);
    
    console.log('🔍 Found chart-related collections:');
    chartCollections.forEach(name => console.log(`   - ${name}`));
    console.log('');
    
    // WHAT: Get existing charts from canonical collection
    // WHY: Track what already exists to avoid duplicates
    const canonical = db.collection(CANONICAL_COLLECTION);
    const existingCharts = await canonical.find({}).toArray();
    const existingChartIds = new Set(existingCharts.map(c => c.chartId));
    
    console.log(`📋 Canonical collection (${CANONICAL_COLLECTION}) has ${existingCharts.length} charts`);
    console.log(`   Existing chartIds: ${Array.from(existingChartIds).slice(0, 10).join(', ')}${existingChartIds.size > 10 ? '...' : ''}\n`);
    
    let totalMigrated = 0;
    let totalSkipped = 0;
    let totalCollections = 0;
    
    // WHAT: Process each chart collection
    // WHY: Migrate all unique charts to canonical collection
    for (const collectionName of chartCollections) {
      if (collectionName === CANONICAL_COLLECTION) {
        console.log(`⏭️  Skipping canonical collection: ${collectionName}`);
        continue;
      }
      
      totalCollections++;
      console.log(`\n🔄 Processing: ${collectionName}`);
      const collection = db.collection(collectionName);
      const charts = await collection.find({}).toArray();
      console.log(`   Found ${charts.length} charts`);
      
      for (const chart of charts) {
        // WHAT: Normalize chartId (handle case sensitivity)
        // WHY: chartId should be case-insensitive for matching
        const chartId = chart.chartId || chart.id || '';
        if (!chartId) {
          console.log(`   ⚠️  Skipping chart without chartId: ${JSON.stringify(chart).substring(0, 100)}`);
          totalSkipped++;
          continue;
        }
        
        // WHAT: Check if chart already exists (case-insensitive)
        // WHY: Avoid duplicates while preserving existing data
        const chartIdLower = chartId.toLowerCase();
        const exists = Array.from(existingChartIds).some(id => id.toLowerCase() === chartIdLower);
        
        if (exists) {
          console.log(`   ⏭️  Already exists: ${chartId}`);
          totalSkipped++;
        } else {
          // WHAT: Migrate chart to canonical collection
          // WHY: Ensure all algorithms are available in single source of truth
          const { _id, ...chartData } = chart;
          
          // WHAT: Normalize chart data structure
          // WHY: Ensure consistent schema (isActive vs active, etc.)
          const normalizedChart: any = {
            ...chartData,
            chartId: chartId, // Ensure chartId is set
            isActive: chart.isActive !== undefined ? chart.isActive : (chart.active !== undefined ? chart.active : true),
            createdAt: chart.createdAt || chart.created_at || new Date().toISOString(),
            updatedAt: chart.updatedAt || chart.updated_at || new Date().toISOString(),
            migratedFrom: collectionName,
            migratedAt: new Date().toISOString()
          };
          
          // WHAT: Remove legacy fields that might conflict
          // WHY: Clean up old field names (active -> isActive)
          if ('active' in normalizedChart && 'isActive' in normalizedChart) {
            delete normalizedChart.active;
          }
          
          await canonical.insertOne(normalizedChart);
          existingChartIds.add(chartId);
          console.log(`   ✅ Migrated: ${chartId} (type: ${chart.type || 'unknown'})`);
          totalMigrated++;
        }
      }
    }
    
    // WHAT: Final verification
    const finalCount = await canonical.countDocuments();
    const finalCharts = await canonical.find({}).sort({ chartId: 1 }).toArray();
    
    console.log(`\n✅ MIGRATION COMPLETE!`);
    console.log(`   - Processed ${totalCollections} collections`);
    console.log(`   - Migrated ${totalMigrated} new charts`);
    console.log(`   - Skipped ${totalSkipped} duplicates`);
    console.log(`   - Total charts in ${CANONICAL_COLLECTION}: ${finalCount}`);
    
    // WHAT: Show sample of chart IDs including the ones user mentioned
    console.log(`\n📋 Sample charts (first 20):`);
    finalCharts.slice(0, 20).forEach(chart => {
      console.log(`   - ${chart.chartId} (type: ${chart.type}, active: ${chart.isActive})`);
    });
    
    // WHAT: Check for specific algorithms user mentioned
    const userMentioned = ['gender-distribution', 'szerencse-gender', 'tippmixpro-gender-distribution'];
    console.log(`\n🔍 Checking for user-mentioned algorithms:`);
    for (const chartId of userMentioned) {
      const found = finalCharts.find(c => c.chartId.toLowerCase() === chartId.toLowerCase());
      if (found) {
        console.log(`   ✅ Found: ${found.chartId} (type: ${found.type}, active: ${found.isActive})`);
      } else {
        console.log(`   ❌ Missing: ${chartId}`);
      }
    }
    
    console.log('\n✨ All charts consolidated successfully!');
    console.log('⚠️  IMPORTANT: Restart Next.js dev server for changes to take effect\n');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Run migration
migrateAllCharts()
  .then(() => {
    console.log('\n✅ Migration complete');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  });
