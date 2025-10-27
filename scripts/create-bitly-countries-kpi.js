// scripts/create-bitly-countries-kpi.js
// WHAT: Create Bitly Countries Reached KPI chart showing total unique countries
// WHY: Visualize geographic reach of Bitly link campaigns
// NOTE: This aligns with existing chart system which uses project.stats fields

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || 'messmass';

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env.local');
  process.exit(1);
}

// WHAT: Chart configuration for Bitly Countries Reached KPI
// WHY: Shows total number of unique countries accessing Bitly links
// HOW: Uses existing bitlyCountryCount variable (camelCase naming convention)
const countriesKpiConfig = {
  chartId: 'bitly-countries-reached',
  title: 'Countries Reached',
  type: 'kpi',
  order: 38, // After existing Bitly charts (geo-chart is order 37)
  isActive: true,
  emoji: '🌍',
  subtitle: 'Unique countries accessing Bitly links',
  elements: [
    {
      id: 'countries-count',
      label: 'Countries Reached',
      formula: 'bitlyCountryCount',
      color: '#10b981',
      description: 'Total number of unique countries from all Bitly links'
    }
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdBy: 'system-migration-v6.44.2',
  lastModifiedBy: 'system-migration-v6.44.2'
};

async function createBitlyCountriesKpi() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const collection = db.collection('chartConfigurations');
    
    // Check if chart already exists
    const existing = await collection.findOne({ chartId: countriesKpiConfig.chartId });
    
    if (existing) {
      console.log(`⚠️  Chart "${countriesKpiConfig.chartId}" already exists. Skipping.`);
      return;
    }
    
    // Insert chart configuration
    const result = await collection.insertOne(countriesKpiConfig);
    
    console.log(`\n✅ Bitly Countries Reached KPI chart created successfully`);
    console.log(`   Chart ID: ${countriesKpiConfig.chartId}`);
    console.log(`   MongoDB _id: ${result.insertedId}`);
    console.log(`   Order: ${countriesKpiConfig.order}`);
    console.log(`\n📊 Chart Element:`);
    console.log(`   1. ${countriesKpiConfig.elements[0].label}: ${countriesKpiConfig.elements[0].formula}`);
    console.log(`\n📝 Note: This chart uses existing bitlyCountryCount field from project.stats`);
    console.log(`   The field is populated by Bitly sync aggregation process.`);
    
  } catch (error) {
    console.error('❌ Error creating Bitly Countries Reached KPI:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n✅ MongoDB connection closed');
  }
}

// Run the migration
createBitlyCountriesKpi();
