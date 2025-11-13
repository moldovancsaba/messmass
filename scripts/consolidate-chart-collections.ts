// WHAT: Consolidate chart_algorithms into chart_configurations (single source of truth)
// WHY: System has 2 collections causing confusion - BuilderMode uses chart_configurations
// HOW: Migrate any charts from chart_algorithms to chart_configurations, then delete chart_algorithms

import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI || '';
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

async function consolidateCharts() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db(MONGODB_DB);
    
    // Check both collections
    const algorithms = await db.collection('chart_algorithms').find({}).toArray();
    const configurations = await db.collection('chart_configurations').find({}).toArray();
    
    console.log('📊 Current state:');
    console.log(`   chart_algorithms: ${algorithms.length} charts`);
    console.log(`   chart_configurations: ${configurations.length} charts`);
    
    // Get existing chart IDs in configurations
    const configIds = new Set(configurations.map(c => c.chartId));
    
    // Find charts in algorithms that aren't in configurations
    const missingCharts = algorithms.filter(a => !configIds.has(a.chartId));
    
    if (missingCharts.length > 0) {
      console.log(`\n🔄 Migrating ${missingCharts.length} charts from chart_algorithms to chart_configurations...`);
      
      for (const chart of missingCharts) {
        // Ensure timestamp fields
        const { _id, ...chartWithoutId } = chart;
        const chartToInsert = {
          ...chartWithoutId,
          createdAt: chart.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        await db.collection('chart_configurations').insertOne(chartToInsert);
        console.log(`   ✅ Migrated: ${chart.chartId}`);
      }
    } else {
      console.log('\n✅ All charts from chart_algorithms already exist in chart_configurations');
    }
    
    // BACKUP chart_algorithms before deletion
    console.log('\n📦 Creating backup of chart_algorithms...');
    const backup = await db.collection('chart_algorithms').find({}).toArray();
    await db.collection('chart_algorithms_backup').deleteMany({}); // Clear old backup
    if (backup.length > 0) {
      await db.collection('chart_algorithms_backup').insertMany(backup);
      console.log(`✅ Backed up ${backup.length} charts to chart_algorithms_backup`);
    }
    
    // DELETE chart_algorithms collection
    console.log('\n🗑️  Deleting chart_algorithms collection...');
    await db.collection('chart_algorithms').drop();
    console.log('✅ chart_algorithms collection deleted');
    
    // Verify final state
    const finalConfigs = await db.collection('chart_configurations').countDocuments();
    console.log(`\n✅ CONSOLIDATION COMPLETE`);
    console.log(`   Single source of truth: chart_configurations (${finalConfigs} charts)`);
    console.log(`   Backup available: chart_algorithms_backup`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

consolidateCharts()
  .then(() => {
    console.log('\n✅ Consolidation complete');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Consolidation failed:', err);
    process.exit(1);
  });
