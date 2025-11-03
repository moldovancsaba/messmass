/**
 * Fix Invalid Material Icon Names
 * 
 * WHAT: Updates chart configurations with invalid Material Icon names to valid alternatives
 * WHY: Some icons were set to names that don't exist in Material Icons, causing "help_outline" fallback
 * HOW: Replaces invalid icon names with semantically similar valid Material Icon names
 * 
 * Usage: npm run chart:fix-icons
 */

import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI!;
const dbName = process.env.MONGODB_DB || 'messmass';

/**
 * WHAT: Mapping of invalid icon names to valid Material Icon alternatives
 * WHY: Replace non-existent icons with semantically similar valid ones
 * HOW: Key = invalid icon name, Value = valid replacement
 * 
 * Browse valid icons: https://fonts.google.com/icons
 */
const ICON_FIXES: Record<string, string> = {
  // Invalid → Valid replacements
  'trip_origin': 'location_on',       // Trip/location context
  'person_heart': 'favorite',         // Person + heart = favorite/like
  'money_range': 'payments',          // Money/payment context
};

async function fixInvalidIcons() {
  console.log('🔧 Fixing invalid Material Icon names...\n');
  
  const client = new MongoClient(uri);
  let updateCount = 0;
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db(dbName);
    const chartsCollection = db.collection('chart_configurations');
    
    // Find all charts with icon field
    const charts = await chartsCollection.find({ icon: { $exists: true } }).toArray();
    
    console.log(`📊 Found ${charts.length} charts with icon field\n`);
    console.log('─'.repeat(80));
    
    for (const chart of charts) {
      const iconName = chart.icon;
      
      if (ICON_FIXES[iconName]) {
        const newIcon = ICON_FIXES[iconName];
        console.log(`\n🔄 Updating: ${chart.title}`);
        console.log(`   Chart ID: ${chart.chartId}`);
        console.log(`   Old icon: "${iconName}" ❌`);
        console.log(`   New icon: "${newIcon}" ✅`);
        
        await chartsCollection.updateOne(
          { _id: chart._id },
          { $set: { icon: newIcon } }
        );
        
        updateCount++;
      }
    }
    
    console.log('\n' + '─'.repeat(80));
    
    if (updateCount > 0) {
      console.log(`\n✅ Updated ${updateCount} chart(s) with valid icon names`);
    } else {
      console.log('\n✅ No invalid icons found - all icons are valid!');
    }
    
    console.log('\n💡 Valid Material Icon names can be found at:');
    console.log('   https://fonts.google.com/icons\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔒 Database connection closed');
  }
}

// Run the script
fixInvalidIcons()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
