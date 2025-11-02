import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

// WHAT: Script to create "Top Countries" bar chart for Bitly geographical analytics
// WHY: Display top 5 countries by click count with dynamic country names from enriched stats
// HOW: Insert chart config into charts collection with dynamic label syntax {{fieldName}}

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const uri = process.env.MONGODB_URI || '';
const dbName = process.env.MONGODB_DB || 'messmass';

if (!uri) {
  console.error('❌ MONGODB_URI not found in .env.local');
  process.exit(1);
}

const chartConfig = {
  chartId: 'bitly-top-countries',
  title: 'Top Countries',
  emoji: '🌍',
  type: 'bar',
  order: 8, // After existing Bitly charts
  showTotal: false,
  isActive: true,
  elements: [
    {
      id: 'bitly-country-1',
      label: '{{bitlyCountry1}}', // Dynamic label: resolved from stats.bitlyCountry1
      formula: '[SEYUBITLYCOUNTRY1CLICKS]',
      color: '#FF6B35'
    },
    {
      id: 'bitly-country-2',
      label: '{{bitlyCountry2}}', // Dynamic label: resolved from stats.bitlyCountry2
      formula: '[SEYUBITLYCOUNTRY2CLICKS]',
      color: '#4ECDC4'
    },
    {
      id: 'bitly-country-3',
      label: '{{bitlyCountry3}}', // Dynamic label: resolved from stats.bitlyCountry3
      formula: '[SEYUBITLYCOUNTRY3CLICKS]',
      color: '#95E1D3'
    },
    {
      id: 'bitly-country-4',
      label: '{{bitlyCountry4}}', // Dynamic label: resolved from stats.bitlyCountry4
      formula: '[SEYUBITLYCOUNTRY4CLICKS]',
      color: '#FFD93D'
    },
    {
      id: 'bitly-country-5',
      label: '{{bitlyCountry5}}', // Dynamic label: resolved from stats.bitlyCountry5
      formula: '[SEYUBITLYCOUNTRY5CLICKS]',
      color: '#D4A5A5'
    }
  ]
};

async function createChart() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(dbName);
    const charts = db.collection('chart_configurations');
    
    // Check if chart already exists
    const existing = await charts.findOne({ chartId: chartConfig.chartId });
    if (existing) {
      console.log(`⚠️ Chart "${chartConfig.chartId}" already exists. Updating...`);
      await charts.updateOne(
        { chartId: chartConfig.chartId },
        { $set: chartConfig }
      );
      console.log(`✅ Updated chart "${chartConfig.chartId}"`);
    } else {
      await charts.insertOne(chartConfig);
      console.log(`✅ Created chart "${chartConfig.chartId}"`);
    }
    
    console.log('✅ Operation completed successfully');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

createChart();
