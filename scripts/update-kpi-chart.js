// scripts/update-kpi-chart.js
// Script to update the "Faces per Image" KPI chart in the database
// Removes subtitle and updates label

const { MongoClient } = require('mongodb');
const config = require('./config');

const MONGODB_URI = config.mongodbUri;
const MONGODB_DB = config.dbName;

async function updateKPIChart() {
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

    // Update the KPI chart - remove subtitle and update label
    const result = await collection.updateOne(
      { chartId: 'faces-per-image' },
      {
        $set: {
          'elements.0.label': 'Average faces per approved image',
          updatedAt: new Date().toISOString()
        },
        $unset: {
          subtitle: ""
        }
      }
    );

    if (result.modifiedCount > 0) {
      console.log('✅ Successfully updated Faces per Image KPI chart');
    } else {
      console.log('ℹ️ No changes made to Faces per Image KPI chart');
    }

    // Verify the update
    const updatedChart = await collection.findOne({ chartId: 'faces-per-image' });
    if (updatedChart) {
      console.log('\n📊 Updated chart configuration:');
      console.log(`  Title: ${updatedChart.title}`);
      console.log(`  Type: ${updatedChart.type}`);
      console.log(`  Label: ${updatedChart.elements[0].label}`);
      console.log(`  Subtitle: ${updatedChart.subtitle || '(none)'}`);
    }

  } catch (error) {
    console.error('❌ Error updating KPI chart:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔒 MongoDB connection closed');
  }
}

// Run the script
updateKPIChart();
