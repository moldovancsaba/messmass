#!/usr/bin/env tsx
/**
 * WHAT: Fix data_blocks to use chart IDs without "stats." prefix
 * WHY: Chart IDs were updated to remove "stats." prefix, but data_blocks still reference old format
 * HOW: Update all data_blocks.charts[].chartId to replace "stats.reportText*" and "stats.reportImage*"
 */

import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

function fixChartId(chartId: string): string {
  if (!chartId) return chartId;
  
  // Convert stats.reportText10 → report-text-10
  if (chartId.startsWith('stats.reportText')) {
    const num = chartId.replace('stats.reportText', '');
    return `report-text-${num}`;
  }
  
  // Convert stats.reportImage10 → report-image-10
  if (chartId.startsWith('stats.reportImage')) {
    const num = chartId.replace('stats.reportImage', '');
    return `report-image-${num}`;
  }
  
  return chartId;
}

async function fixDataBlocksChartIds() {
  const client = new MongoClient(MONGODB_URI!);
  
  try {
    await client.connect();
    const db = client.db(MONGODB_DB);
    
    const dataBlocksCollection = db.collection('data_blocks');
    const blocks = await dataBlocksCollection.find({}).toArray();
    
    console.log(`📊 Checking ${blocks.length} data blocks for "stats." prefix in chart IDs...\n`);
    console.log('='.repeat(80));
    
    let updatedCount = 0;
    
    for (const block of blocks) {
      if (!block.charts || !Array.isArray(block.charts)) continue;
      
      let needsUpdate = false;
      const updatedCharts = block.charts.map((chart: any) => {
        if (chart.chartId && (chart.chartId.startsWith('stats.reportText') || chart.chartId.startsWith('stats.reportImage'))) {
          const newChartId = fixChartId(chart.chartId);
          needsUpdate = true;
          console.log(`  ✅ Block "${block.name || block._id}":`);
          console.log(`     ${chart.chartId} → ${newChartId}`);
          return { ...chart, chartId: newChartId };
        }
        return chart;
      });
      
      if (needsUpdate) {
        await dataBlocksCollection.updateOne(
          { _id: block._id },
          { $set: { charts: updatedCharts } }
        );
        updatedCount++;
      }
    }
    
    console.log('='.repeat(80));
    console.log(`\n✅ Fixed ${updatedCount} data blocks\n`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

fixDataBlocksChartIds();

