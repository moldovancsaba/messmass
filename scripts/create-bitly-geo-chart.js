// scripts/create-bitly-geo-chart.js
// WHAT: Create Bitly Geographic Reach KPI chart showing number of countries reached
// WHY: Visualize international reach of Bitly link campaigns

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || 'messmass';

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env.local');
  process.exit(1);
}

// WHAT: Chart configuration for Bitly Geographic Reach
// WHY: Single KPI showing global audience reach via country count
const geoChartConfig = {
  chartId: 'bitly-geographic-reach',
  title: 'Bitly Geographic Reach',
  type: 'kpi',
  order: 37, // After referrer chart
  isActive: true,
  emoji: '🌍',
  subtitle: 'International audience reach',
  elements: [
    {
      id: 'countries-reached',
      label: 'Countries Reached',
      formula: '[SEYUBITLYCOUNTRYCOUNT]',
      color: '#3b82f6',
      description: 'Number of unique countries accessing Bitly links'
    }
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdBy: 'system-migration',
  lastModifiedBy: 'system-migration'
};

async function createBitlyGeoChart() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const collection = db.collection('chartConfigurations');
    
    // Check if chart already exists
    const existing = await collection.findOne({ chartId: geoChartConfig.chartId });
    
    if (existing) {
      console.log(`⚠️  Chart "${geoChartConfig.chartId}" already exists. Skipping.`);
      return;
    }
    
    // Insert chart configuration
    const result = await collection.insertOne(geoChartConfig);
    
    console.log(`\n✅ Bitly Geographic Reach chart created successfully`);
    console.log(`   Chart ID: ${geoChartConfig.chartId}`);
    console.log(`   MongoDB _id: ${result.insertedId}`);
    console.log(`   Order: ${geoChartConfig.order}`);
    console.log(`\n📊 Chart Element:`);
    geoChartConfig.elements.forEach((element, idx) => {
      console.log(`   ${idx + 1}. ${element.label}: ${element.formula}`);
    });
    
  } catch (error) {
    console.error('❌ Error creating Bitly Geographic Reach chart:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n✅ MongoDB connection closed');
  }
}

// Run the migration
createBitlyGeoChart();
