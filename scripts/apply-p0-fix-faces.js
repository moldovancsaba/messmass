// scripts/apply-p0-fix-faces.js
// P0-005: Deactivate the "faces" KPI chart
// WHY: Duplicate/misleading metric - keeping "faces-per-image" instead

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function deactivateFacesChart() {
  let client;
  try {
    console.log('🔗 Connecting to MongoDB Atlas...');
    console.log('📍 Database: messmass');
    console.log('📂 Collection: chartConfigurations\n');
    
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db('messmass');
    const col = db.collection('chart_configurations');

    // Verify chart exists before update
    const facesChart = await col.findOne({ chartId: 'faces' });
    
    if (!facesChart) {
      console.error('❌ Chart "faces" not found in database');
      process.exit(1);
    }

    console.log('📊 Current state:');
    console.log(`   chartId: ${facesChart.chartId}`);
    console.log(`   title: ${facesChart.title}`);
    console.log(`   isActive: ${facesChart.isActive}`);
    console.log(`   type: ${facesChart.type}\n`);

    if (facesChart.isActive === false) {
      console.log('✅ Chart is already deactivated. No action needed.');
      process.exit(0);
    }

    // Apply P0-005 fix
    console.log('🔧 Applying P0-005: Deactivating faces KPI...');
    
    const result = await col.updateOne(
      { chartId: 'faces' },
      { 
        $set: { 
          isActive: false,
          updatedAt: new Date().toISOString()
        } 
      }
    );

    if (result.modifiedCount === 1) {
      console.log('✅ Successfully deactivated "faces" chart\n');
      
      // Verify the change
      const updated = await col.findOne({ chartId: 'faces' });
      console.log('📊 Updated state:');
      console.log(`   isActive: ${updated.isActive}`);
      console.log(`   updatedAt: ${updated.updatedAt}\n`);
      
      console.log('═══════════════════════════════════════════════');
      console.log('✅ P0-005 FIX APPLIED SUCCESSFULLY');
      console.log('═══════════════════════════════════════════════\n');
      
      console.log('📌 Note: "faces-per-image" KPI remains active as intended.');
    } else {
      console.error('❌ Update failed - no documents modified');
      process.exit(1);
    }

  } catch (err) {
    console.error('❌ Error applying P0-005 fix:', err);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('✅ Database connection closed');
    }
  }
}

deactivateFacesChart();
