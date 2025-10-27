import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

// WHAT: Script to create "Countries Reached" KPI chart for Bitly geographical analytics
// WHY: Display total count of unique countries engaged with Bitly links
// HOW: Insert chart config into charts collection with static label (this is a count metric)

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const uri = process.env.MONGODB_URI || '';
const dbName = process.env.MONGODB_DB || 'messmass';

if (!uri) {
  console.error('❌ MONGODB_URI not found in .env.local');
  process.exit(1);
}

const chartConfig = {
  chartId: 'bitly-countries-reached',
  title: 'Countries Reached',
  emoji: '🌐',
  subtitle: 'Unique Countries',
  type: 'kpi',
  order: 10, // After Top Country KPI
  isActive: true,
  elements: [
    {
      id: 'bitly-countries-reached-kpi-element',
      label: 'Countries Reached', // Static label (this is a count, not a country name)
      formula: '[bitlyCountryCount]',
      color: '#4ECDC4'
    }
  ]
};

async function createChart() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(dbName);
    const charts = db.collection('chartConfigurations');
    
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
