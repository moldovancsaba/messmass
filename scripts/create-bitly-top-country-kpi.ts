import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

// WHAT: Script to create "Top Country" KPI chart for Bitly geographical analytics
// WHY: Display the most engaging country name dynamically from enriched stats
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
  chartId: 'bitly-top-country',
  title: 'Top Country',
  emoji: '🏆',
  subtitle: 'Most Engaging Geography',
  type: 'kpi',
  order: 9, // After Top Countries bar chart
  isActive: true,
  elements: [
    {
      id: 'bitly-top-country-kpi-element',
      label: '{{bitlyTopCountry}}', // Dynamic label: resolved from stats.bitlyTopCountry
      formula: '[SEYUBITLYTOPCOUNTRY]',
      color: '#FF6B35'
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
