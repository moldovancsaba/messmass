#!/usr/bin/env node

// scripts/fix-chart-labels.js
// WHAT: Fix chart configurations with missing or undefined element labels
// WHY: Prevent "undefined is not an object (evaluating 'resolvedLabel.includes')" errors
// HOW: Find charts with undefined labels and fix them with default values

const { MongoClient } = require('mongodb');

// Load configuration
require('dotenv').config({ path: '.env.local' });
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

async function fixChartLabels() {
  console.log('🔧 Starting chart label fix...');
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(MONGODB_DB);
    const collection = db.collection('chart_configurations');
    
    // Find all chart configurations
    const charts = await collection.find({}).toArray();
    console.log(`📊 Found ${charts.length} chart configurations`);
    
    let fixedCount = 0;
    
    for (const chart of charts) {
      let needsUpdate = false;
      const updatedElements = [];
      
      if (!chart.elements || !Array.isArray(chart.elements)) {
        console.log(`⚠️  Chart "${chart.title}" has no elements array`);
        continue;
      }
      
      for (let i = 0; i < chart.elements.length; i++) {
        const element = chart.elements[i];
        
        if (!element) {
          console.log(`⚠️  Chart "${chart.title}" has null element at index ${i}`);
          updatedElements.push({
            id: `element-${i}`,
            label: `Element ${i + 1}`,
            formula: '[INDOOR]',
            color: '#cccccc'
          });
          needsUpdate = true;
          continue;
        }
        
        const updatedElement = { ...element };
        
        // Fix missing or undefined label
        if (!element.label || element.label === undefined || element.label === null) {
          console.log(`🔧 Fixing missing label for chart "${chart.title}" element ${i}`);
          updatedElement.label = `Element ${i + 1}`;
          needsUpdate = true;
        }
        
        // Fix missing or undefined id
        if (!element.id || element.id === undefined || element.id === null) {
          console.log(`🔧 Fixing missing id for chart "${chart.title}" element ${i}`);
          updatedElement.id = `element-${i}`;
          needsUpdate = true;
        }
        
        // Fix missing or undefined color
        if (!element.color || element.color === undefined || element.color === null) {
          console.log(`🔧 Fixing missing color for chart "${chart.title}" element ${i}`);
          updatedElement.color = '#cccccc';
          needsUpdate = true;
        }
        
        // Fix missing or undefined formula
        if (!element.formula || element.formula === undefined || element.formula === null) {
          console.log(`🔧 Fixing missing formula for chart "${chart.title}" element ${i}`);
          updatedElement.formula = '[INDOOR]';
          needsUpdate = true;
        }
        
        updatedElements.push(updatedElement);
      }
      
      if (needsUpdate) {
        console.log(`🔧 Updating chart "${chart.title}" with fixed elements`);
        
        await collection.updateOne(
          { _id: chart._id },
          { 
            $set: { 
              elements: updatedElements,
              updatedAt: new Date().toISOString()
            }
          }
        );
        
        fixedCount++;
      }
    }
    
    console.log(`✅ Fixed ${fixedCount} chart configurations`);
    
  } catch (error) {
    console.error('❌ Error fixing chart labels:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the fix
fixChartLabels().catch(console.error);