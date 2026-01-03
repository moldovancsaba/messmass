#!/usr/bin/env tsx
/**
 * WHAT: Fix visitor-sources chart formula
 * WHY: Chart has malformed formula with missing bracket
 */

import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

async function fixVisitorSourcesChart() {
  const client = new MongoClient(MONGODB_URI!);
  
  try {
    await client.connect();
    const db = client.db(MONGODB_DB);
    
    const chart = await db.collection('chart_configurations').findOne({ chartId: 'visitor-sources' });
    
    if (chart && chart.elements && chart.elements.length > 0) {
      const updatedElements = chart.elements.map((el: any, i: number) => {
        if (!el.formula) return el;
        
        const oldFormula = el.formula;
        console.log(`Element ${i} current:`, oldFormula);
        
        // Fix: stats.visitQrCode] + [stats.visitShortUrl → [visitQrCode] + [visitShortUrl]
        let fixed = oldFormula
          .replace(/stats\.([a-zA-Z0-9_]+)\]/g, '[$1]') // Fix missing opening bracket: stats.field] → [field]
          .replace(/\[stats\.([a-zA-Z0-9_]+)\]/g, '[$1]'); // Fix normal format: [stats.field] → [field]
        
        console.log(`Element ${i} fixed:`, fixed);
        
        return { ...el, formula: fixed };
      });
      
      await db.collection('chart_configurations').updateOne(
        { _id: chart._id },
        { $set: { elements: updatedElements } }
      );
      
      console.log('✅ Fixed visitor-sources chart!');
    } else {
      console.log('Chart not found or has no elements');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

fixVisitorSourcesChart();

