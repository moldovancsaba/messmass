// scripts/migrateExistingChartsFormatting.ts
// WHAT: Add formatting fields to all existing charts in database
// WHY: Charts created before v8.19.0 don't have formatting, causing prefix/suffix not to display
// HOW: Update all charts to add default formatting based on chart type

import { MongoClient, ObjectId } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

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
  type?: 'currency' | 'percentage' | 'number';
  formatting?: {
    rounded: boolean;
    prefix?: string;
    suffix?: string;
  };
}

interface ChartConfig {
  _id: ObjectId;
  chartId: string;
  title: string;
  type: 'pie' | 'bar' | 'kpi' | 'text' | 'image' | 'value';
  elements: ChartElement[];
  kpiFormatting?: {
    rounded: boolean;
    prefix?: string;
    suffix?: string;
  };
  barFormatting?: {
    rounded: boolean;
    prefix?: string;
    suffix?: string;
  };
}

async function migrateChartFormatting(dryRun: boolean = true) {
  const client = new MongoClient(MONGODB_URI!);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(MONGODB_DB);
    const collection = db.collection<ChartConfig>('chartConfigurations');
    
    // Find all charts
    const allCharts = await collection.find({}).toArray();
    console.log(`\n📊 Found ${allCharts.length} total charts`);
    
    let needsElementFormatting = 0;
    let needsValueFormatting = 0;
    let alreadyHaveFormatting = 0;
    
    const updates: Array<{
      _id: ObjectId;
      chartId: string;
      title: string;
      type: string;
      update: any;
    }> = [];
    
    // Check each chart
    for (const chart of allCharts) {
      const update: any = {};
      let needsUpdate = false;
      
      // WHAT: Check if elements need formatting
      // WHY: KPI, PIE, BAR charts need element-level formatting
      if (chart.type === 'kpi' || chart.type === 'pie' || chart.type === 'bar') {
        const elementsNeedFormatting = chart.elements.some(el => !el.formatting);
        
        if (elementsNeedFormatting) {
          needsElementFormatting++;
          needsUpdate = true;
          
          // Add formatting to all elements based on legacy type or defaults
          update.elements = chart.elements.map(el => {
            if (el.formatting) return el; // Already has formatting
            
            // Convert legacy type to formatting
            let formatting: { rounded: boolean; prefix?: string; suffix?: string };
            
            if (el.type === 'currency') {
              formatting = { rounded: false, prefix: '€', suffix: '' };
            } else if (el.type === 'percentage') {
              formatting = { rounded: false, prefix: '', suffix: '%' };
            } else {
              formatting = { rounded: true, prefix: '', suffix: '' };
            }
            
            return { ...el, formatting };
          });
        }
      }
      
      // WHAT: Check if VALUE charts need kpi/bar formatting
      // WHY: VALUE charts require both formatting configs
      if (chart.type === 'value') {
        if (!chart.kpiFormatting || !chart.barFormatting) {
          needsValueFormatting++;
          needsUpdate = true;
          
          if (!chart.kpiFormatting) {
            update.kpiFormatting = { rounded: true, prefix: '€', suffix: '' };
          }
          if (!chart.barFormatting) {
            update.barFormatting = { rounded: true, prefix: '€', suffix: '' };
          }
        }
      }
      
      if (needsUpdate) {
        updates.push({
          _id: chart._id,
          chartId: chart.chartId,
          title: chart.title,
          type: chart.type,
          update
        });
      } else {
        alreadyHaveFormatting++;
      }
    }
    
    // Summary
    console.log(`\n📈 Analysis:`);
    console.log(`   - ${needsElementFormatting} charts need element formatting`);
    console.log(`   - ${needsValueFormatting} VALUE charts need kpi/bar formatting`);
    console.log(`   - ${alreadyHaveFormatting} charts already have formatting`);
    console.log(`   - ${updates.length} charts need updates`);
    
    if (updates.length === 0) {
      console.log('\n✅ All charts already have formatting! No migration needed.');
      return;
    }
    
    // Show what will be updated
    console.log(`\n📋 Charts to update:`);
    updates.forEach((u, idx) => {
      console.log(`   ${idx + 1}. ${u.title} (${u.type}) - ${u.chartId}`);
      if (u.update.elements) {
        console.log(`      → Adding element formatting to ${u.update.elements.length} elements`);
      }
      if (u.update.kpiFormatting) {
        console.log(`      → Adding kpiFormatting: ${JSON.stringify(u.update.kpiFormatting)}`);
      }
      if (u.update.barFormatting) {
        console.log(`      → Adding barFormatting: ${JSON.stringify(u.update.barFormatting)}`);
      }
    });
    
    if (dryRun) {
      console.log(`\n⚠️  DRY RUN - No changes made to database`);
      console.log(`   Run with --execute flag to apply changes`);
      return;
    }
    
    // Apply updates
    console.log(`\n💾 Applying updates...`);
    let successCount = 0;
    let errorCount = 0;
    
    for (const u of updates) {
      try {
        await collection.updateOne(
          { _id: u._id },
          { 
            $set: {
              ...u.update,
              updatedAt: new Date().toISOString()
            }
          }
        );
        successCount++;
        console.log(`   ✅ Updated: ${u.title}`);
      } catch (error) {
        errorCount++;
        console.error(`   ❌ Failed: ${u.title} - ${error}`);
      }
    }
    
    console.log(`\n✅ Migration complete!`);
    console.log(`   - ${successCount} charts updated successfully`);
    console.log(`   - ${errorCount} charts failed`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n👋 Database connection closed');
  }
}

// Parse command line args
const args = process.argv.slice(2);
const dryRun = !args.includes('--execute');

console.log('🚀 Chart Formatting Migration');
console.log('=====================================');
if (dryRun) {
  console.log('Mode: DRY RUN (use --execute to apply changes)');
} else {
  console.log('Mode: EXECUTE (changes will be applied)');
}
console.log('=====================================\n');

migrateChartFormatting(dryRun);
