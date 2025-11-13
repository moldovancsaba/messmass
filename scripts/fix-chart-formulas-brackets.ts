// WHAT: Fix chart formulas with square brackets and missing formulas
// WHY: BuilderMode shows "No image uploaded" because formulas like [stats.fanSelfiePortrait1] don't parse correctly
// HOW: Remove brackets from formulas and add missing formulas for reportImage/reportText charts

import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI || '';
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

async function fixChartFormulas() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db(MONGODB_DB);
    const collection = db.collection('chart_configurations');
    
    // Get all charts
    const charts = await collection.find({}).toArray();
    console.log(`📊 Checking ${charts.length} charts...\n`);
    
    let fixed = 0;
    
    for (const chart of charts) {
      let needsUpdate = false;
      const updates: any = {};
      
      // Fix elements with bracket formulas
      if (chart.elements && Array.isArray(chart.elements)) {
        const fixedElements = chart.elements.map((el: any) => {
          if (el.formula && typeof el.formula === 'string') {
            // Remove square brackets from formula
            if (el.formula.startsWith('[') && el.formula.endsWith(']')) {
              needsUpdate = true;
              return { ...el, formula: el.formula.slice(1, -1) };
            }
          }
          return el;
        });
        
        if (needsUpdate) {
          updates.elements = fixedElements;
        }
      }
      
      // Fix report-image-* and report-text-* charts with missing formulas
      if (chart.chartId?.startsWith('report-image-')) {
        const num = chart.chartId.replace('report-image-', '');
        if (!chart.elements || chart.elements.length === 0 || !chart.elements[0]?.formula) {
          needsUpdate = true;
          updates.elements = [{ formula: `stats.reportImage${num}` }];
          updates.type = 'image';
          updates.isActive = true;
        }
      }
      
      if (chart.chartId?.startsWith('report-text-')) {
        const num = chart.chartId.replace('report-text-', '');
        if (!chart.elements || chart.elements.length === 0 || !chart.elements[0]?.formula) {
          needsUpdate = true;
          updates.elements = [{ formula: `stats.reportText${num}` }];
          updates.type = 'text';
          updates.isActive = true;
        }
      }
      
      // Apply updates
      if (needsUpdate) {
        await collection.updateOne(
          { _id: chart._id },
          { 
            $set: { 
              ...updates,
              updatedAt: new Date().toISOString()
            } 
          }
        );
        fixed++;
        console.log(`✅ Fixed: ${chart.chartId}`);
        if (updates.elements) {
          console.log(`   Formula: ${updates.elements[0]?.formula || 'N/A'}`);
        }
      }
    }
    
    console.log(`\n✅ Fixed ${fixed} charts`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

fixChartFormulas()
  .then(() => {
    console.log('\n✅ Fix complete');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Fix failed:', err);
    process.exit(1);
  });
