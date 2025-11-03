/**
 * Database Migration Script: Emoji → Material Icon
 * 
 * WHAT: Migrates chartConfigurations collection from emoji field to icon field
 * WHY: Part of v10.4.0 Material Icons migration, replaces emoji with professional icon system
 * HOW: Finds all charts with emoji, maps to Material Icon names, updates database
 * 
 * Usage: npm run migrate:emoji-to-icon
 * 
 * Version: 10.4.0
 * Created: 2025-11-03T00:33:17.000Z
 */

import clientPromise from '../lib/mongodb';
import { EMOJI_TO_ICON_MAP, hasIconMapping } from '../lib/iconMapping';
import config from '../lib/config';

async function migrateEmojiToIcon() {
  console.log('\n🔄 Starting emoji → Material Icon migration...\n');
  console.log('=' .repeat(60));
  
  try {
    // WHAT: Connect to MongoDB using client promise
    // WHY: Uses the same connection pattern as other scripts
    const client = await clientPromise;
    const db = client.db(config.dbName);
    const collection = db.collection('chartConfigurations');
    
    // WHAT: Find all charts with emoji field
    // WHY: Only migrate charts that have emoji (some may already have icon)
    const charts = await collection.find({ emoji: { $exists: true } }).toArray();
    console.log(`\n📊 Found ${charts.length} chart(s) with emoji field\n`);
    
    if (charts.length === 0) {
      console.log('✅ No charts to migrate. All done!');
      return;
    }
    
    let migratedCount = 0;
    let skippedCount = 0;
    const skippedEmojis: Array<{ emoji: string; chartId: string; title: string }> = [];
    
    // WHAT: Process each chart individually
    // WHY: Allows logging of each migration and graceful handling of errors
    for (const chart of charts) {
      const emoji = chart.emoji;
      const iconName = EMOJI_TO_ICON_MAP[emoji];
      
      if (iconName) {
        // WHAT: Update chart with icon field, remove emoji field
        // WHY: Clean migration - new field replaces old field
        await collection.updateOne(
          { _id: chart._id },
          { 
            $set: { 
              icon: iconName,
              iconVariant: 'outlined' // WHAT: Default to outlined style
            },
            $unset: { emoji: '' } // WHAT: Remove emoji field completely
          }
        );
        
        console.log(`✅ ${chart.chartId} (${chart.title})`);
        console.log(`   ${emoji} → ${iconName}`);
        console.log(`   _id: ${chart._id}\n`);
        migratedCount++;
      } else {
        // WHAT: Log unmapped emojis for manual review
        // WHY: Some emojis might not have mappings yet
        console.warn(`⚠️  SKIPPED: ${chart.chartId} (${chart.title})`);
        console.warn(`   No icon mapping for emoji: ${emoji}`);
        console.warn(`   _id: ${chart._id}\n`);
        
        skippedEmojis.push({
          emoji,
          chartId: chart.chartId,
          title: chart.title
        });
        skippedCount++;
      }
    }
    
    // WHAT: Print summary report
    // WHY: Clear migration results for audit trail
    console.log('=' .repeat(60));
    console.log('\n✨ Migration Complete!\n');
    console.log(`📈 Statistics:`);
    console.log(`   • Total charts found:     ${charts.length}`);
    console.log(`   • Successfully migrated:  ${migratedCount}`);
    console.log(`   • Skipped (no mapping):   ${skippedCount}`);
    
    if (skippedEmojis.length > 0) {
      console.log(`\n⚠️  Skipped Charts (manual review needed):`);
      skippedEmojis.forEach(({ emoji, chartId, title }) => {
        console.log(`   • ${emoji} - ${chartId} (${title})`);
      });
      console.log(`\n💡 Add missing emoji mappings to lib/iconMapping.ts`);
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed with error:', error);
    process.exit(1);
  }
}

// WHAT: Execute migration
// WHY: Script entry point
migrateEmojiToIcon().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
