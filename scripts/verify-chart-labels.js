#!/usr/bin/env node

// scripts/verify-chart-labels.js
// WHAT: Verify that all chart configurations have proper element structure
// WHY: Ensure the fix worked and no more undefined labels exist

const { MongoClient } = require('mongodb');

// Load configuration
require('dotenv').config({ path: '.env.local' });
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

async function verifyChartLabels() {
  console.log('🔍 Verifying chart label integrity...');
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(MONGODB_DB);
    const collection = db.collection('chart_configurations');
    
    // Find all active chart configurations
    const charts = await collection.find({ isActive: true }).toArray();
    console.log(`📊 Found ${charts.length} active chart configurations`);
    
    let issuesFound = 0;
    
    for (const chart of charts) {
      if (!chart.elements || !Array.isArray(chart.elements)) {
        console.log(`❌ Chart "${chart.title}" has no elements array`);
        issuesFound++;
        continue;
      }
      
      for (let i = 0; i < chart.elements.length; i++) {
        const element = chart.elements[i];
        
        if (!element) {
          console.log(`❌ Chart "${chart.title}" has null element at index ${i}`);
          issuesFound++;
          continue;
        }
        
        // Check required fields
        if (!element.label || element.label === undefined || element.label === null) {
          console.log(`❌ Chart "${chart.title}" element ${i} has missing label`);
          issuesFound++;
        }
        
        if (!element.id || element.id === undefined || element.id === null) {
          console.log(`❌ Chart "${chart.title}" element ${i} has missing id`);
          issuesFound++;
        }
        
        if (!element.color || element.color === undefined || element.color === null) {
          console.log(`❌ Chart "${chart.title}" element ${i} has missing color`);
          issuesFound++;
        }
        
        if (!element.formula || element.formula === undefined || element.formula === null) {
          console.log(`❌ Chart "${chart.title}" element ${i} has missing formula`);
          issuesFound++;
        }
      }
    }
    
    if (issuesFound === 0) {
      console.log('✅ All chart configurations have proper element structure!');
    } else {
      console.log(`❌ Found ${issuesFound} issues in chart configurations`);
    }
    
  } catch (error) {
    console.error('❌ Error verifying chart labels:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the verification
verifyChartLabels().catch(console.error);