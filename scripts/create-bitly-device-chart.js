// scripts/create-bitly-device-chart.js
// WHAT: Create Bitly Device Split pie chart showing mobile vs desktop+tablet clicks
// WHY: Visualize device preferences for Bitly link engagement

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || 'messmass';

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env.local');
  process.exit(1);
}

// WHAT: Chart configuration for Bitly Device Split
// WHY: Shows how users access Bitly links (mobile-first insights)
const deviceChartConfig = {
  chartId: 'bitly-device-split',
  title: 'Bitly Device Split',
  type: 'pie',
  order: 35, // After existing charts
  isActive: true,
  emoji: '📱',
  subtitle: 'Device types for Bitly link clicks',
  elements: [
    {
      id: 'mobile',
      label: 'Mobile',
      formula: '[SEYUBITLYMOBILECLICKS]',
      color: '#3b82f6',
      description: 'Clicks from mobile devices'
    },
    {
      id: 'desktop-tablet',
      label: 'Desktop + Tablet',
      formula: '[SEYUBITLYDESKTOPCLICKS] + [SEYUBITLYTABLETCLICKS]',
      color: '#8b5cf6',
      description: 'Clicks from desktop computers and tablets'
    }
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdBy: 'system-migration',
  lastModifiedBy: 'system-migration'
};

async function createBitlyDeviceChart() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const collection = db.collection('chart_configurations');
    
    // Check if chart already exists
    const existing = await collection.findOne({ chartId: deviceChartConfig.chartId });
    
    if (existing) {
      console.log(`⚠️  Chart "${deviceChartConfig.chartId}" already exists. Skipping.`);
      return;
    }
    
    // Insert chart configuration
    const result = await collection.insertOne(deviceChartConfig);
    
    console.log(`\n✅ Bitly Device Split chart created successfully`);
    console.log(`   Chart ID: ${deviceChartConfig.chartId}`);
    console.log(`   MongoDB _id: ${result.insertedId}`);
    console.log(`   Order: ${deviceChartConfig.order}`);
    console.log(`\n📊 Chart Elements:`);
    deviceChartConfig.elements.forEach((element, idx) => {
      console.log(`   ${idx + 1}. ${element.label}: ${element.formula}`);
    });
    
  } catch (error) {
    console.error('❌ Error creating Bitly Device Split chart:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n✅ MongoDB connection closed');
  }
}

// Run the migration
createBitlyDeviceChart();
