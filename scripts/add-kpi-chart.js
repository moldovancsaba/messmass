// scripts/add-kpi-chart.js
// Script to add the new "Faces per Image" KPI chart to the database
// This ensures the new KPI chart type is available in the system

const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

async function addKPIChart() {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI environment variable is not set');
    process.exit(1);
  }

  const client = new MongoClient(MONGODB_URI);

  try {
    console.log('🔗 Connecting to MongoDB Atlas...');
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');

    const db = client.db(MONGODB_DB);
    const collection = db.collection('chartConfigurations');

    // Check if the KPI chart already exists
    const existingKPI = await collection.findOne({ chartId: 'faces-per-image' });
    
    if (existingKPI) {
      console.log('ℹ️ Faces per Image KPI chart already exists in the database');
      return;
    }

    // Define the new KPI chart configuration
    const now = new Date().toISOString();
    const kpiChart = {
      chartId: 'faces-per-image',
      title: 'Faces per Image',
      type: 'kpi',
      order: 8,
      isActive: true,
      emoji: '👀',
      subtitle: 'Average faces per approved image',
      elements: [
        {
          id: 'faces-per-image-value',
          label: 'Faces per Image',
          formula: '([FEMALE] + [MALE]) / [APPROVED_IMAGES]',
          color: '#10b981',
          description: 'Calculation from your totals: total faces by gender divided by images to show authentic reach per asset. Target audience: Brand owner, media planners, sponsorship sales. Quantify how many branded faces appear per image on average. Capture the multiplier effect for on-screen brand exposure.'
        }
      ],
      createdAt: now,
      updatedAt: now,
      createdBy: 'system'
    };

    // Insert the new KPI chart
    const result = await collection.insertOne(kpiChart);
    console.log('✅ Successfully added Faces per Image KPI chart with ID:', result.insertedId);

    // Verify all charts are present
    const allCharts = await collection.find({}).sort({ order: 1 }).toArray();
    console.log(`\n📊 Total charts in database: ${allCharts.length}`);
    allCharts.forEach(chart => {
      console.log(`  ${chart.order}. ${chart.title} (${chart.type}) - ${chart.isActive ? '✅ Active' : '❌ Inactive'}`);
    });

  } catch (error) {
    console.error('❌ Error adding KPI chart:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔒 MongoDB connection closed');
  }
}

// Run the script
addKPIChart();
