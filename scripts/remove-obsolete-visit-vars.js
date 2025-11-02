// scripts/remove-obsolete-visit-vars.js
// WHAT: Remove obsolete pre-Bitly visit variables and delete dependent charts
// WHY: Clean up system after Bitly integration made these variables redundant

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || 'messmass';

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env.local');
  process.exit(1);
}

// WHAT: Obsolete variable names to remove
// WHY: These were manual entry fields before Bitly integration
const OBSOLETE_VARIABLES = [
  'visitQrCode',
  'visitShortUrl',
  'visitWeb',
  'socialVisit',
  'eventValuePropositionVisited',
  'eventValuePropositionPurchases'
];

// WHAT: Charts using obsolete variables (found via search)
// WHY: Must be deleted as their formulas reference removed variables
const CHARTS_TO_DELETE = [
  'visitor-sources',
  'engagement',
  'value-prop-conversion-rate',
  'social-per-image',
  'social-vs-direct',
  'qr-vs-short',
  'vp-funnel',
  'activation-funnel'
];

async function removeObsoleteVariables() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    
    // Step 1: Delete charts using obsolete variables
    console.log('\n📊 Deleting charts with obsolete variables...');
    const chartResult = await db.collection('chart_configurations').deleteMany({
      chartId: { $in: CHARTS_TO_DELETE }
    });
    console.log(`   Deleted ${chartResult.deletedCount} charts`);
    CHARTS_TO_DELETE.forEach(chartId => {
      console.log(`   - ${chartId}`);
    });
    
    // Step 2: Remove from variablesConfig collection
    console.log('\n🔧 Removing from variablesConfig...');
    const configResult = await db.collection('variablesConfig').deleteMany({
      name: { $in: OBSOLETE_VARIABLES }
    });
    console.log(`   Deleted ${configResult.deletedCount} variable configs`);
    
    // Step 3: Remove obsolete fields from all project documents
    console.log('\n📁 Cleaning project.stats fields...');
    const updateFields = {};
    OBSOLETE_VARIABLES.forEach(varName => {
      updateFields[`stats.${varName}`] = '';
    });
    
    const projectResult = await db.collection('projects').updateMany(
      {},
      { $unset: updateFields }
    );
    console.log(`   Updated ${projectResult.modifiedCount} projects`);
    
    // Step 4: Summary
    console.log('\n✅ Cleanup complete!');
    console.log('\n📝 Summary:');
    console.log(`   - ${chartResult.deletedCount} charts deleted`);
    console.log(`   - ${configResult.deletedCount} variable configs removed`);
    console.log(`   - ${projectResult.modifiedCount} projects cleaned`);
    console.log(`   - ${OBSOLETE_VARIABLES.length} variables removed from system`);
    
    console.log('\n⚠️  Next steps:');
    console.log('   1. Remove variables from lib/variablesRegistry.ts');
    console.log('   2. Remove from lib/formulaEngine.ts VARIABLE_MAPPINGS');
    console.log('   3. Remove from lib/chartConfigTypes.ts AVAILABLE_VARIABLES');
    console.log('   4. Remove from ProjectStats interface in all files');
    console.log('   5. Update derived variable formulas (totalVisit)');
    console.log('   6. Update documentation');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n✅ MongoDB connection closed');
  }
}

// Run the cleanup
removeObsoleteVariables();
