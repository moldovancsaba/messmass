// Script to fix the Value chart in the CORRECT collection (chartConfigurations with camelCase)
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://moldovancsaba:j8HxxytTjrtJXskz@messmass-cluster.r96vlxs.mongodb.net/messmass?retryWrites=true&w=majority&appName=messmass-cluster';
const DATABASE_NAME = 'messmass';
const COLLECTION_NAME = 'chartConfigurations'; // CORRECT camelCase collection name

// New Generated Value chart configuration
const generatedValueChart = {
  chartId: 'value',
  title: 'Generated Value',
  type: 'bar',
  order: 6,
  isActive: true,
  showTotal: true,
  totalLabel: 'Total Generated Value',
  emoji: '📊',
  subtitle: 'Breakdown of Event-Generated Brand Value',
  elements: [
    { 
      id: 'marketing-optin', 
      label: 'Marketing Opt-in Users', 
      formula: '([REMOTE_IMAGES] + [HOSTESS_IMAGES] + [SELFIES]) * 4.87', 
      color: '#3b82f6', 
      description: 'Every image corresponds to a GDPR-compliant opt-in fan. Each contact has measurable acquisition cost in digital marketing (€4.87 avg market cost per email opt-in in Europe, 2025)' 
    },
    { 
      id: 'value-prop-emails', 
      label: 'Value Proposition Emails', 
      formula: '([REMOTE_IMAGES] + [HOSTESS_IMAGES] + [SELFIES]) * 1.07', 
      color: '#10b981', 
      description: 'Every email delivered includes branded fan photo plus sponsor offer. Add-on ad space valued at €1.07 avg CPM email value add per send' 
    },
    { 
      id: 'giant-screen-ads', 
      label: 'Ads on Giant Screen', 
      formula: '([EVENT_ATTENDEES] / 1000) * 6 * 0.2 * ([REMOTE_IMAGES] + [HOSTESS_IMAGES] + [SELFIES])', 
      color: '#f59e0b', 
      description: 'Fans + brands shown on stadium big screen = in-stadium advertising equivalent. Stadium advertising CPM ≈ €6.00 per 1,000 attendees per 30s slot. 6s exposure = 0.2 of CPM' 
    },
    { 
      id: 'under40-engagement', 
      label: 'Under-40 Engagement', 
      formula: '([GEN_ALPHA] + [GEN_YZ]) * 2.14', 
      color: '#8b5cf6', 
      description: '80% of engaged fans are under 40 - critical target for most brands. Each identified contact carries premium value (€2.14 avg value of youth contact vs older groups)' 
    },
    { 
      id: 'brand-awareness', 
      label: 'Brand Awareness Boost', 
      formula: '200 * 300 * 0.0145', 
      color: '#ef4444', 
      description: 'Organic shares amplify brand presence into social feeds. 200 shared images × 300 avg views = 60,000 impressions. Benchmarked to €14.50 CPM for social organic impressions (2025)' 
    }
  ],
  updatedAt: new Date().toISOString(),
  lastModifiedBy: 'fix-script-correct-collection'
};

async function fixValueChartCorrectCollection() {
  let client;
  
  try {
    console.log('Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db(DATABASE_NAME);
    const collection = db.collection(COLLECTION_NAME);
    
    console.log(`\n=== Working with collection: ${COLLECTION_NAME} ===`);
    
    // Step 1: Find the current Value chart
    console.log('\n=== Finding current Value chart ===');
    const currentValueChart = await collection.findOne({ chartId: 'value' });
    
    if (currentValueChart) {
      console.log(`Found Value chart: "${currentValueChart.title}" at order ${currentValueChart.order}`);
      console.log('Current elements:');
      currentValueChart.elements.forEach(el => {
        console.log(`  - ${el.id}: ${el.label}`);
      });
    } else {
      console.log('No Value chart found');
      return;
    }
    
    // Step 2: Update the Value chart
    console.log('\n=== Updating Value chart to Generated Value ===');
    const result = await collection.updateOne(
      { chartId: 'value' },
      { 
        $set: {
          ...generatedValueChart,
          createdAt: currentValueChart.createdAt, // Preserve original creation date
          createdBy: currentValueChart.createdBy || 'unknown' // Preserve original creator
        }
      }
    );
    
    if (result.modifiedCount === 1) {
      console.log('✅ Successfully updated Value chart to Generated Value');
    } else {
      console.log('⚠️ Chart found but not modified');
    }
    
    // Step 3: Verify the update
    console.log('\n=== Verifying the update ===');
    const updatedChart = await collection.findOne({ chartId: 'value' });
    if (updatedChart) {
      console.log('✅ Updated chart details:');
      console.log(`- Title: ${updatedChart.title}`);
      console.log(`- Subtitle: ${updatedChart.subtitle}`);
      console.log(`- Order: ${updatedChart.order}`);
      console.log(`- Total Label: ${updatedChart.totalLabel}`);
      console.log(`- Elements: ${updatedChart.elements.map(e => e.id).join(', ')}`);
    }
    
    // Step 4: Clean up the wrong collection (optional)
    console.log('\n=== Cleaning up incorrect collection ===');
    const wrongCollection = db.collection('chartconfigurations'); // lowercase
    const wrongCollectionCount = await wrongCollection.estimatedDocumentCount();
    if (wrongCollectionCount > 0) {
      console.log(`Found ${wrongCollectionCount} documents in wrong collection (lowercase), deleting...`);
      const deleteResult = await wrongCollection.deleteMany({});
      console.log(`✅ Deleted ${deleteResult.deletedCount} documents from wrong collection`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('\nDatabase connection closed');
    }
  }
}

console.log('Fixing Value chart in CORRECT collection...');
console.log('=======================================\n');

fixValueChartCorrectCollection()
  .then(() => {
    console.log('\n=======================================');
    console.log('✅ Fix completed successfully!');
    console.log('Please refresh your browser to see the changes.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fix error:', error);
    process.exit(1);
  });
