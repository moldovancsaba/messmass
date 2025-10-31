/**
 * Migration Script: Convert Legacy Chart Type to Formatting Field
 * 
 * WHAT: Migrates all charts from legacy `type: 'currency' | 'percentage' | 'number'`
 *       to new `formatting: { rounded, prefix, suffix }` field for clean system.
 * 
 * WHY: Remove backward compatibility dependencies and establish single formatting standard.
 *      Ensures all charts use the new flexible formatting system introduced in v8.17.0.
 * 
 * SCOPE:
 * - Updates `chart_configurations` collection
 * - Converts element-level `type` field to `formatting` object
 * - Removes deprecated `type` field after migration
 * - Preserves all other chart data
 * 
 * MAPPINGS:
 * - type: 'currency' → formatting: { rounded: false, prefix: '€', suffix: '' }
 * - type: 'percentage' → formatting: { rounded: false, prefix: '', suffix: '%' }
 * - type: 'number' → formatting: { rounded: true, prefix: '', suffix: '' }
 * 
 * SAFETY:
 * - Dry-run mode by default (preview changes without applying)
 * - Run with --execute flag to apply changes
 * - Logs all changes with before/after states
 * 
 * USAGE:
 * npm run migrate:chart-formatting-cleanup        # Dry run (preview only)
 * npm run migrate:chart-formatting-cleanup --execute  # Apply changes
 */

import { MongoClient, Db, ObjectId } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

// Type mappings from legacy to new formatting
const TYPE_TO_FORMATTING: Record<string, { rounded: boolean; prefix: string; suffix: string }> = {
  currency: { rounded: false, prefix: '€', suffix: '' },
  percentage: { rounded: false, prefix: '', suffix: '%' },
  number: { rounded: true, prefix: '', suffix: '' },
};

interface ChartElement {
  id: string;
  label: string;
  formula: string;
  color: string;
  type?: 'currency' | 'percentage' | 'number';
  formatting?: {
    rounded?: boolean;
    prefix?: string;
    suffix?: string;
  };
}

interface ChartConfiguration {
  _id: ObjectId;
  chartId: string;
  title: string;
  type: string;
  elements: ChartElement[];
}

async function migrateChartFormatting(dryRun: boolean = true): Promise<void> {
  const client = new MongoClient(MONGODB_URI!);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db: Db = client.db(MONGODB_DB);
    const chartsCollection = db.collection<ChartConfiguration>('chart_configurations');

    // Find all charts with elements that have legacy 'type' field
    const chartsWithLegacyType = await chartsCollection
      .find({
        'elements.type': { $exists: true },
      })
      .toArray();

    console.log(`\n📊 Found ${chartsWithLegacyType.length} charts with legacy 'type' field\n`);

    if (chartsWithLegacyType.length === 0) {
      console.log('✅ No charts need migration. System is clean!');
      return;
    }

    let migratedCount = 0;
    let elementsUpdated = 0;

    for (const chart of chartsWithLegacyType) {
      console.log(`\n🔄 Chart: ${chart.title} (${chart.chartId})`);

      let hasChanges = false;
      const updatedElements = chart.elements.map((element) => {
        if (element.type && !element.formatting) {
          const formatting = TYPE_TO_FORMATTING[element.type];

          console.log(`  📝 Element: ${element.label}`);
          console.log(`     BEFORE: type: '${element.type}'`);
          console.log(`     AFTER:  formatting: ${JSON.stringify(formatting)}`);

          hasChanges = true;
          elementsUpdated++;

          // Return element with formatting, removing type
          const { type, ...elementWithoutType } = element;
          return {
            ...elementWithoutType,
            formatting,
          };
        }

        return element;
      });

      if (hasChanges) {
        if (dryRun) {
          console.log(`  🔍 DRY RUN: Would update ${chart.title}`);
        } else {
          // Apply migration
          await chartsCollection.updateOne(
            { _id: chart._id },
            { $set: { elements: updatedElements } }
          );
          console.log(`  ✅ UPDATED: ${chart.title}`);
        }
        migratedCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`\n📈 MIGRATION SUMMARY:`);
    console.log(`   Charts to migrate: ${migratedCount}`);
    console.log(`   Elements updated: ${elementsUpdated}`);

    if (dryRun) {
      console.log(`\n⚠️  DRY RUN MODE - No changes applied`);
      console.log(`   Run with --execute flag to apply migration:`);
      console.log(`   npm run migrate:chart-formatting-cleanup --execute\n`);
    } else {
      console.log(`\n✅ MIGRATION COMPLETE - All charts now use formatting field`);
      console.log(`   Legacy 'type' field removed from all charts\n`);
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.close();
    console.log('🔌 MongoDB connection closed');
  }
}

// Check for --execute flag
const executeMode = process.argv.includes('--execute');

console.log('\n' + '='.repeat(60));
console.log('🔧 Chart Formatting Migration (v8.17.0)');
console.log('='.repeat(60));

migrateChartFormatting(!executeMode)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
