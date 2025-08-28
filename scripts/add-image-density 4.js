// scripts/add-image-density.js
// Script to add the new "Image Density" KPI chart to the database
// This chart shows images per 100 fans to benchmark activation performance

const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

async function addImageDensityChart() {
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

    // Check if the Image Density chart already exists
    const existingChart = await collection.findOne({ chartId: 'image-density' });
    
    if (existingChart) {
      console.log('ℹ️ Image Density KPI chart already exists in the database');
      return;
    }

    // Define the new Image Density KPI chart configuration
    const now = new Date().toISOString();
    const imageDensityChart = {
      chartId: 'image-density',
      title: 'Image Density',
      type: 'kpi',
      order: 9,
      isActive: true,
      emoji: '🧮',
      elements: [
        {
          id: 'image-density-value',
          label: 'Images per 100 fans',
          formula: '([REMOTE_IMAGES] + [HOSTESS_IMAGES] + [SELFIES]) / ([FEMALE] + [MALE]) * 100',
          color: '#3b82f6',
          description: 'Show how actively fans created content. Help venues and rights holders benchmark activation performance. Derived from your counts - a simple, comparable index across events. Target audience: Event ops, sponsorship sales, client success.'
        }
      ],
      createdAt: now,
      updatedAt: now,
      createdBy: 'system'
    };

    // Insert the new Image Density chart
    const result = await collection.insertOne(imageDensityChart);
    console.log('✅ Successfully added Image Density KPI chart with ID:', result.insertedId);

    // Verify all charts are present
    const allCharts = await collection.find({}).sort({ order: 1 }).toArray();
    console.log(`\n📊 Total charts in database: ${allCharts.length}`);
    allCharts.forEach(chart => {
      console.log(`  ${chart.order}. ${chart.title} (${chart.type}) - ${chart.isActive ? '✅ Active' : '❌ Inactive'}`);
    });

  } catch (error) {
    console.error('❌ Error adding Image Density chart:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔒 MongoDB connection closed');
  }
}

// Run the script
addImageDensityChart();
