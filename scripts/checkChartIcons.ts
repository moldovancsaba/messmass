/**
 * Check Chart Icons Script
 * 
 * WHAT: Inspects all chart configurations to verify icon field values
 * WHY: Identify which charts have invalid icon names causing "help_outline" fallback
 * HOW: Connects to MongoDB and lists all charts with their icon/emoji values
 * 
 * Usage: npx ts-node scripts/checkChartIcons.ts
 */

import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI!;
const dbName = process.env.MONGODB_DB || 'messmass';

async function checkChartIcons() {
  console.log('🔍 Checking chart icons in database...\n');
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db(dbName);
    const chartsCollection = db.collection('chart_configurations');
    
    const charts = await chartsCollection.find({}).toArray();
    
    console.log(`📊 Found ${charts.length} chart configurations:\n`);
    console.log('─'.repeat(80));
    
    for (const chart of charts) {
      const iconValue = chart.icon || chart.emoji || '(none)';
      const iconVariant = chart.iconVariant || 'outlined';
      const iconType = chart.icon ? '🔹 Material Icon' : (chart.emoji ? '😀 Emoji' : '❌ No Icon');
      
      console.log(`\nChart: ${chart.title} (${chart.chartId})`);
      console.log(`  Type: ${iconType}`);
      console.log(`  Value: "${iconValue}"`);
      console.log(`  Variant: ${iconVariant}`);
      console.log(`  Status: ${chart.isActive ? '✅ Active' : '❌ Inactive'}`);
    }
    
    console.log('\n' + '─'.repeat(80));
    console.log('\n💡 Common Material Icon names:');
    console.log('   analytics, trending_up, donut_small, star, lightbulb');
    console.log('   event, handshake, label, public, visibility, palette\n');
    console.log('🔗 Browse all icons: https://fonts.google.com/icons\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔒 Database connection closed');
  }
}

// Run the script
checkChartIcons()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
