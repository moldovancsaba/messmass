// scripts/create-bitly-top-countries-clicks-chart.js
// WHAT: Create "Top Countries by Clicks" horizontal bar chart (5 elements)
// WHY: Visualize top 5 countries by Bitly click volume
// HOW: Uses enriched project.stats fields (bitlyCountry1Clicks - bitlyCountry5Clicks)

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || 'messmass';

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env.local');
  process.exit(1);
}

// WHAT: Chart configuration for Top Countries by Clicks
// WHY: Shows geographic distribution of Bitly engagement
// HOW: 5-element bar chart using enriched stats fields
// NOTE: Labels show "Country 1-5" as placeholders since names are dynamic
const chartConfig = {
  chartId: 'bitly-top-countries-clicks',
  title: 'Top Countries by Clicks',
  type: 'bar',
  order: 38,
  isActive: true,
  subtitle: 'Geographic distribution of Bitly link engagement',
  showTotal: true,
  totalLabel: 'Total Clicks',
  elements: [
    {
      id: 'country-1',
      label: 'Country 1',
      formula: 'bitlyCountry1Clicks',
      color: '#3b82f6',
      description: 'Top country by click count'
    },
    {
      id: 'country-2',
      label: 'Country 2',
      formula: 'bitlyCountry2Clicks',
      color: '#8b5cf6',
      description: '2nd country by click count'
    },
    {
      id: 'country-3',
      label: 'Country 3',
      formula: 'bitlyCountry3Clicks',
      color: '#ec4899',
      description: '3rd country by click count'
    },
    {
      id: 'country-4',
      label: 'Country 4',
      formula: 'bitlyCountry4Clicks',
      color: '#f59e0b',
      description: '4th country by click count'
    },
    {
      id: 'country-5',
      label: 'Country 5',
      formula: 'bitlyCountry5Clicks',
      color: '#10b981',
      description: '5th country by click count'
    }
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdBy: 'system-migration-v6.45.0',
  lastModifiedBy: 'system-migration-v6.45.0'
};

async function createChart() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const collection = db.collection('chart_configurations');
    
    // Check if chart already exists
    const existing = await collection.findOne({ chartId: chartConfig.chartId });
    
    if (existing) {
      console.log(`⚠️  Chart "${chartConfig.chartId}" already exists. Skipping.`);
      return;
    }
    
    // Insert chart configuration
    const result = await collection.insertOne(chartConfig);
    
    console.log(`\n✅ Top Countries by Clicks chart created successfully`);
    console.log(`   Chart ID: ${chartConfig.chartId}`);
    console.log(`   MongoDB _id: ${result.insertedId}`);
    console.log(`   Order: ${chartConfig.order}`);
    console.log(`\n📊 Chart Elements:`);
    chartConfig.elements.forEach((element, idx) => {
      console.log(`   ${idx + 1}. ${element.label}: ${element.formula}`);
    });
    console.log(`\n📝 Note: Labels are placeholders. Actual country names from bitlyCountry1-5 fields.`);
    console.log(`   Fields populated by bitlyStatsEnricher.ts during Bitly sync.`);
    
  } catch (error) {
    console.error('❌ Error creating chart:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n✅ MongoDB connection closed');
  }
}

// Run the script
createChart();
