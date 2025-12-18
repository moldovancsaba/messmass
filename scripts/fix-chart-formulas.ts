// WHAT: Fix Chart Formulas Migration (v12.0.0 Hotfix)
// WHY: Phase 1 migration didn't properly extract formulas from elements array
// HOW: Copy formulas from old chart_configurations to new charts collection

import { config } from 'dotenv';
import { MongoClient } from 'mongodb';

config({ path: '.env.local' });

async function fixChartFormulas() {
  const client = await MongoClient.connect(process.env.MONGODB_URI!);
  const db = client.db('messmass');
  
  const chartsCollection = db.collection('charts');
  const oldChartsCollection = db.collection('chart_configurations');
  
  console.log('🔧 Fixing chart formulas...\n');
  
  // Get all charts with null formulas
  const nullCharts = await chartsCollection.find({ formula: null }).toArray();
  console.log(`Found ${nullCharts.length} charts with null formulas\n`);
  
  let fixed = 0;
  let failed = 0;
  
  for (const chart of nullCharts) {
    try {
      // Find corresponding old chart
      const oldChart = await oldChartsCollection.findOne({ chartId: chart.chartId });
      
      if (!oldChart) {
        console.log(`⚠️  No old chart found for: ${chart.chartId}`);
        failed++;
        continue;
      }
      
      let formula: string | null = null;
      
      // Extract formula based on chart type
      if (chart.type === 'kpi' || chart.type === 'text' || chart.type === 'image') {
        // For single-value charts, extract from first element
        if (oldChart.elements && oldChart.elements.length > 0) {
          formula = oldChart.elements[0].formula;
        }
      } else if (chart.type === 'pie' || chart.type === 'bar' || chart.type === 'value') {
        // For multi-element charts, keep elements as-is but add a summary formula
        if (oldChart.elements && oldChart.elements.length > 0) {
          // Use first element's formula as the main formula
          formula = oldChart.elements[0].formula;
        }
      }
      
      if (!formula) {
        console.log(`⚠️  No formula found in old chart: ${chart.chartId}`);
        failed++;
        continue;
      }
      
      // Update chart with formula
      await chartsCollection.updateOne(
        { _id: chart._id },
        { $set: { formula } }
      );
      
      console.log(`✅ Fixed: ${chart.chartId} | ${formula}`);
      fixed++;
      
    } catch (error) {
      console.error(`❌ Error fixing ${chart.chartId}:`, error);
      failed++;
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   Fixed: ${fixed}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Total: ${nullCharts.length}`);
  
  await client.close();
}

fixChartFormulas().catch(console.error);
