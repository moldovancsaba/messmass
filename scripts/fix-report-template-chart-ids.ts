#!/usr/bin/env tsx
/**
 * WHAT: Fix report templates to use chart IDs without "stats." prefix
 * WHY: Chart IDs were updated to remove "stats." prefix, but report templates still reference old format
 * HOW: Update all report.blocks to replace "stats.reportText*" and "stats.reportImage*" with correct chart IDs
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

async function fixReportTemplateChartIds() {
  const client = new MongoClient(MONGODB_URI!);
  
  try {
    await client.connect();
    const db = client.db(MONGODB_DB);
    
    const reportsCollection = db.collection('reports');
    const reports = await reportsCollection.find({}).toArray();
    
    console.log(`📊 Checking ${reports.length} reports for "stats." prefix in chart IDs...\n`);
    console.log('='.repeat(80));
    
    let updatedCount = 0;
    
    for (const report of reports) {
      if (!report.blocks || !Array.isArray(report.blocks)) continue;
      
      let needsUpdate = false;
      const updatedBlocks = report.blocks.map((block: any) => {
        if (!block.charts || !Array.isArray(block.charts)) return block;
        
        const updatedCharts = block.charts.map((chart: any) => {
          if (chart.chartId && (chart.chartId.startsWith('stats.reportText') || chart.chartId.startsWith('stats.reportImage'))) {
            const newChartId = fixChartId(chart.chartId);
            needsUpdate = true;
            console.log(`  ✅ Report "${report.title || report._id}":`);
            console.log(`     ${chart.chartId} → ${newChartId}`);
            return { ...chart, chartId: newChartId };
          }
          return chart;
        });
        
        return { ...block, charts: updatedCharts };
      });
      
      if (needsUpdate) {
        await reportsCollection.updateOne(
          { _id: report._id },
          { $set: { blocks: updatedBlocks } }
        );
        updatedCount++;
      }
    }
    
    console.log('='.repeat(80));
    console.log(`\n✅ Fixed ${updatedCount} reports\n`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

fixReportTemplateChartIds();

