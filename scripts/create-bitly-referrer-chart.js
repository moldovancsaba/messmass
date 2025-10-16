// scripts/create-bitly-referrer-chart.js
// WHAT: Create Bitly Referrers horizontal bar chart showing top 5 traffic sources
// WHY: Understand where Bitly link clicks come from (QR, Instagram, Facebook, etc.)

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || 'messmass';

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env.local');
  process.exit(1);
}

// WHAT: Chart configuration for Bitly Referrers
// WHY: Shows top 5 traffic sources for Bitly links (QR code, Instagram, Facebook, Social, Direct)
const referrerChartConfig = {
  chartId: 'bitly-referrers',
  title: 'Bitly Referrers',
  type: 'bar',
  order: 36, // After device chart
  isActive: true,
  subtitle: 'Top traffic sources for Bitly links',
  showTotal: false, // No total needed for referrer breakdown
  elements: [
    {
      id: 'qr-code',
      label: 'QR Code',
      formula: '[SEYUBITLYQRCODECLICKS]',
      color: '#10b981',
      description: 'Clicks from QR code scans (qr.partners.bit.ly)'
    },
    {
      id: 'instagram',
      label: 'Instagram',
      formula: '[SEYUBITLYINSTAGRAMMOBILECLICKS] + [SEYUBITLYINSTAGRAMWEBCLICKS]',
      color: '#ec4899',
      description: 'Clicks from Instagram mobile and web'
    },
    {
      id: 'facebook',
      label: 'Facebook',
      formula: '[SEYUBITLYFACEBOOKMOBILECLICKS] + [SEYUBITLYFACEBOOKMESSENGERCLICKS]',
      color: '#3b82f6',
      description: 'Clicks from Facebook mobile and Messenger'
    },
    {
      id: 'social-other',
      label: 'Other Social',
      formula: '[SEYUBITLYSOCIALCLICKS]',
      color: '#8b5cf6',
      description: 'Clicks from other social platforms'
    },
    {
      id: 'direct',
      label: 'Direct',
      formula: '[SEYUBITLYDIRECTCLICKS]',
      color: '#6b7280',
      description: 'Direct clicks with no referrer'
    }
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdBy: 'system-migration',
  lastModifiedBy: 'system-migration'
};

async function createBitlyReferrerChart() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const collection = db.collection('chartConfigurations');
    
    // Check if chart already exists
    const existing = await collection.findOne({ chartId: referrerChartConfig.chartId });
    
    if (existing) {
      console.log(`⚠️  Chart "${referrerChartConfig.chartId}" already exists. Skipping.`);
      return;
    }
    
    // Insert chart configuration
    const result = await collection.insertOne(referrerChartConfig);
    
    console.log(`\n✅ Bitly Referrers chart created successfully`);
    console.log(`   Chart ID: ${referrerChartConfig.chartId}`);
    console.log(`   MongoDB _id: ${result.insertedId}`);
    console.log(`   Order: ${referrerChartConfig.order}`);
    console.log(`\n📊 Chart Elements:`);
    referrerChartConfig.elements.forEach((element, idx) => {
      console.log(`   ${idx + 1}. ${element.label}: ${element.formula}`);
    });
    
  } catch (error) {
    console.error('❌ Error creating Bitly Referrers chart:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n✅ MongoDB connection closed');
  }
}

// Run the migration
createBitlyReferrerChart();
