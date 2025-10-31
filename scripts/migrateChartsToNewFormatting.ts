/**
 * Migration: Convert All Existing Charts to New Formatting System
 * 
 * WHAT: Updates all KPI/PIE/BAR/VALUE charts to use new formatting structure
 * WHY: Database must match new UI with 3 checkboxes + predictive dropdowns
 * 
 * CHANGES:
 * - Adds default formatting to all element-level charts (KPI/PIE/BAR)
 * - Ensures VALUE charts have both kpiFormatting and barFormatting initialized
 * - Uses database defaults (€ prefix, rounded, no suffix)
 * 
 * SAFETY:
 * - Dry-run mode by default
 * - Only updates charts that need migration
 * - Preserves existing formatting if already set
 * 
 * USAGE:
 * npm run migrate:charts-formatting        # Preview changes
 * npm run migrate:charts-formatting --execute  # Apply changes
 */

import { MongoClient, Db, ObjectId } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

interface ChartElement {
  id: string;
  label: string;
  formula: string;
  color: string;
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
  type: 'kpi' | 'pie' | 'bar' | 'value' | 'text' | 'image';
  elements: ChartElement[];
  kpiFormatting?: {
    rounded?: boolean;
    prefix?: string;
    suffix?: string;
  };
  barFormatting?: {
    rounded?: boolean;
    prefix?: string;
    suffix?: string;
  };
}

async function migrateChartsToNewFormatting(dryRun: boolean = true): Promise<void> {
  const client = new MongoClient(MONGODB_URI!);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db: Db = client.db(MONGODB_DB);
    
    // Fetch formatting defaults from database
    const defaultsCollection = db.collection('chart_formatting_defaults');
    const defaultsDoc = await defaultsCollection.findOne({});
    
    const defaults = defaultsDoc?.defaults || {
      rounded: true,
      prefix: '€',
      suffix: '',
      visible: true
    };
    
    console.log(`📋 Using defaults: ${JSON.stringify(defaults)}\n`);

    const chartsCollection = db.collection<ChartConfiguration>('chart_configurations');
    const allCharts = await chartsCollection.find({}).toArray();

    console.log(`📊 Found ${allCharts.length} total charts\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const chart of allCharts) {
      let needsUpdate = false;
      const updates: any = {};

      // CASE 1: KPI/PIE/BAR charts - add element-level formatting
      if (['kpi', 'pie', 'bar'].includes(chart.type)) {
        const elementsNeedFormatting = chart.elements.some(el => !el.formatting);
        
        if (elementsNeedFormatting) {
          updates.elements = chart.elements.map(el => ({
            ...el,
            formatting: el.formatting || {
              rounded: defaults.rounded,
              prefix: defaults.prefix,
              suffix: ''
            }
          }));
          needsUpdate = true;
          console.log(`🔄 ${chart.type.toUpperCase()}: ${chart.title} (${chart.chartId})`);
          console.log(`   Adding element-level formatting to ${chart.elements.length} element(s)`);
        }
      }

      // CASE 2: VALUE charts - ensure dual formatting exists
      if (chart.type === 'value') {
        if (!chart.kpiFormatting) {
          updates.kpiFormatting = {
            rounded: defaults.rounded,
            prefix: defaults.prefix,
            suffix: ''
          };
          needsUpdate = true;
          console.log(`🔄 VALUE: ${chart.title} (${chart.chartId})`);
          console.log(`   Adding kpiFormatting`);
        }
        
        if (!chart.barFormatting) {
          updates.barFormatting = {
            rounded: defaults.rounded,
            prefix: defaults.prefix,
            suffix: ''
          };
          needsUpdate = true;
          if (!updates.kpiFormatting) {
            console.log(`🔄 VALUE: ${chart.title} (${chart.chartId})`);
          }
          console.log(`   Adding barFormatting`);
        }
      }

      if (needsUpdate) {
        if (dryRun) {
          console.log(`  🔍 DRY RUN: Would update chart\n`);
        } else {
          await chartsCollection.updateOne(
            { _id: chart._id },
            { $set: updates }
          );
          console.log(`  ✅ UPDATED\n`);
        }
        updatedCount++;
      } else {
        skippedCount++;
      }
    }

    console.log('='.repeat(60));
    console.log(`\n📈 MIGRATION SUMMARY:`);
    console.log(`   Total charts: ${allCharts.length}`);
    console.log(`   Charts updated: ${updatedCount}`);
    console.log(`   Charts skipped: ${skippedCount} (already have formatting)`);

    if (dryRun) {
      console.log(`\n⚠️  DRY RUN MODE - No changes applied`);
      console.log(`   Run with --execute flag to apply migration:`);
      console.log(`   npm run migrate:charts-formatting --execute\n`);
    } else {
      console.log(`\n✅ MIGRATION COMPLETE`);
      console.log(`   All charts now have proper formatting structure\n`);
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.close();
    console.log('🔌 MongoDB connection closed');
  }
}

const executeMode = process.argv.includes('--execute');

console.log('\n' + '='.repeat(60));
console.log('🔧 Chart Formatting Migration (v8.17.2)');
console.log('='.repeat(60));

migrateChartsToNewFormatting(!executeMode)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
