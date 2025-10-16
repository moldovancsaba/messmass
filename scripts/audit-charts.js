// Temporary script to retrieve all chart configurations for audit
const { MongoClient } = require('mongodb');
const config = require('./config');

const MONGODB_URI = config.mongodbUri;
const DATABASE_NAME = config.dbName;
const COLLECTION_NAME = 'chartconfigurations';

async function auditCharts() {
  let client;
  
  try {
    console.log('🔗 Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db(DATABASE_NAME);
    const collection = db.collection(COLLECTION_NAME);
    
    // Retrieve all chart configurations sorted by order
    const charts = await collection.find({}).sort({ order: 1 }).toArray();
    
    console.log(`\n📊 Total Charts Found: ${charts.length}\n`);
    console.log('='.repeat(120));
    
    // Output detailed information for each chart
    charts.forEach((chart, index) => {
      console.log(`\n${index + 1}. ${chart.emoji || '📊'} ${chart.title}`);
      console.log(`   ID: ${chart.chartId}`);
      console.log(`   Type: ${chart.type.toUpperCase()}`);
      console.log(`   Order: ${chart.order}`);
      console.log(`   Active: ${chart.isActive ? '✅' : '❌'}`);
      console.log(`   Elements: ${chart.elements.length}`);
      
      if (chart.subtitle) {
        console.log(`   Subtitle: ${chart.subtitle}`);
      }
      
      if (chart.showTotal) {
        console.log(`   Show Total: Yes (${chart.totalLabel || 'No label'})`);
      }
      
      console.log(`   Formulas:`);
      chart.elements.forEach((el, idx) => {
        console.log(`     ${idx + 1}. ${el.label}: ${el.formula}`);
        if (el.description) {
          console.log(`        → ${el.description.substring(0, 80)}${el.description.length > 80 ? '...' : ''}`);
        }
      });
      
      console.log(`   Created: ${chart.createdAt || 'Unknown'}`);
      console.log(`   Updated: ${chart.updatedAt || 'Unknown'}`);
      console.log('-'.repeat(120));
    });
    
    // Summary statistics
    console.log(`\n📈 CHART TYPE BREAKDOWN:`);
    const typeCount = charts.reduce((acc, chart) => {
      acc[chart.type] = (acc[chart.type] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(typeCount).forEach(([type, count]) => {
      console.log(`   ${type.toUpperCase()}: ${count} charts`);
    });
    
    // Active vs Inactive
    const activeCount = charts.filter(c => c.isActive).length;
    console.log(`\n✅ Active Charts: ${activeCount}`);
    console.log(`❌ Inactive Charts: ${charts.length - activeCount}`);
    
    // Export full JSON for detailed analysis
    const fs = require('fs');
    const outputPath = '/Users/moldovancsaba/Projects/messmass/scripts/chart-audit-export.json';
    fs.writeFileSync(outputPath, JSON.stringify(charts, null, 2));
    console.log(`\n💾 Full chart data exported to: ${outputPath}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('\n✅ Database connection closed');
    }
  }
}

auditCharts()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Audit error:', error);
    process.exit(1);
  });
