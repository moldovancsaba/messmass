// scripts/consolidate-chart-collections.js
// WHAT: Merge all chart collections into one canonical collection
// WHY: Multiple collections (chartConfigurations, chartconfigurations, chart_configurations) causing save issues
// HOW: Copy all unique charts to chartConfigurations, delete duplicates, drop old collections

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';
const CANONICAL_COLLECTION = 'chartConfigurations';

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

async function consolidateChartCollections() {
  const client = new MongoClient(MONGODB_URI);

  try {
    console.log('📊 Starting chart collections consolidation...\n');

    await client.connect();
    const db = client.db(MONGODB_DB);

    // WHAT: Find all chart-related collections
    const allCollections = await db.listCollections().toArray();
    const chartCollections = allCollections
      .filter(c => c.name.toLowerCase().includes('chart') && c.name.toLowerCase().includes('config'))
      .map(c => c.name);

    console.log('🔍 Found chart-related collections:');
    chartCollections.forEach(name => console.log(`   - ${name}`));
    console.log('');

    // WHAT: Use chartConfigurations as canonical
    const canonical = db.collection(CANONICAL_COLLECTION);
    const existingCharts = await canonical.find({}).toArray();
    console.log(`📋 Canonical collection (${CANONICAL_COLLECTION}) has ${existingCharts.length} charts\n`);

    // WHAT: Track charts by chartId to avoid duplicates
    const chartIdMap = new Map();
    existingCharts.forEach(chart => {
      chartIdMap.set(chart.chartId, {
        collection: CANONICAL_COLLECTION,
        _id: chart._id,
        updatedAt: chart.updatedAt || chart.createdAt
      });
    });

    // WHAT: Check other collections for charts not in canonical
    let totalMigrated = 0;
    let totalDuplicates = 0;

    for (const collectionName of chartCollections) {
      if (collectionName === CANONICAL_COLLECTION) continue;

      console.log(`\n🔄 Processing: ${collectionName}`);
      const collection = db.collection(collectionName);
      const charts = await collection.find({}).toArray();
      console.log(`   Found ${charts.length} charts`);

      for (const chart of charts) {
        const existing = chartIdMap.get(chart.chartId);

        if (!existing) {
          // WHAT: Chart doesn't exist in canonical - migrate it
          const { _id, ...chartData } = chart;
          await canonical.insertOne({
            ...chartData,
            migratedFrom: collectionName,
            migratedAt: new Date().toISOString()
          });
          chartIdMap.set(chart.chartId, {
            collection: collectionName,
            _id: chart._id,
            updatedAt: chart.updatedAt || chart.createdAt
          });
          console.log(`   ✅ Migrated: ${chart.chartId}`);
          totalMigrated++;
        } else {
          // WHAT: Duplicate found - compare timestamps
          const chartDate = chart.updatedAt || chart.createdAt || '';
          const existingDate = existing.updatedAt || '';
          
          if (chartDate > existingDate) {
            console.log(`   ⚠️  Duplicate (newer): ${chart.chartId} - keeping newer from ${collectionName}`);
            // Update canonical with newer data
            const { _id, ...chartData } = chart;
            await canonical.updateOne(
              { chartId: chart.chartId },
              { 
                $set: { 
                  ...chartData,
                  mergedFrom: collectionName,
                  mergedAt: new Date().toISOString()
                } 
              }
            );
          } else {
            console.log(`   ⏭️  Duplicate (older): ${chart.chartId} - skipping`);
          }
          totalDuplicates++;
        }
      }

      // WHAT: Drop the old collection
      if (charts.length > 0) {
        console.log(`   🗑️  Dropping collection: ${collectionName}`);
        await collection.drop();
      }
    }

    // WHAT: Final verification
    const finalCount = await canonical.countDocuments();
    console.log(`\n✅ Consolidation complete!`);
    console.log(`   - Canonical collection: ${CANONICAL_COLLECTION}`);
    console.log(`   - Total charts: ${finalCount}`);
    console.log(`   - Migrated: ${totalMigrated}`);
    console.log(`   - Duplicates handled: ${totalDuplicates}`);
    
    // WHAT: Show sample of chart IDs
    const sampleCharts = await canonical.find({}).limit(5).toArray();
    console.log(`\n📋 Sample charts in canonical collection:`);
    sampleCharts.forEach(chart => {
      console.log(`   - ${chart.chartId} (type: ${chart.type}, order: ${chart.order})`);
    });

    console.log('\n✨ All chart collections consolidated successfully!');
    console.log('⚠️  IMPORTANT: Restart Next.js dev server for changes to take effect\n');

  } catch (error) {
    console.error('❌ Consolidation failed:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run consolidation
consolidateChartCollections();
