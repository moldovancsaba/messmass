// Script to fix Value chart issue - remove old chart and ensure Generated Value is properly configured
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://moldovancsaba:j8HxxytTjrtJXskz@messmass-cluster.r96vlxs.mongodb.net/messmass?retryWrites=true&w=majority&appName=messmass-cluster';
const DATABASE_NAME = 'messmass';
const COLLECTION_NAME = 'chartconfigurations';

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
  createdAt: new Date().toISOString(),
  lastModifiedBy: 'fix-script-v2.1.0',
  createdBy: 'fix-script-v2.1.0'
};

async function fixValueChart() {
  let client;
  
  try {
    console.log('Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db(DATABASE_NAME);
    const collection = db.collection(COLLECTION_NAME);
    
    // Step 1: Find ALL charts with chartId 'value'
    console.log('\n=== Finding all Value charts ===');
    const allValueCharts = await collection.find({ chartId: 'value' }).toArray();
    console.log(`Found ${allValueCharts.length} chart(s) with chartId 'value'`);
    
    allValueCharts.forEach(chart => {
      console.log(`- ${chart._id}: "${chart.title}" at order ${chart.order}`);
    });
    
    // Step 2: Delete ALL existing value charts
    if (allValueCharts.length > 0) {
      console.log('\n=== Deleting all existing Value charts ===');
      const deleteResult = await collection.deleteMany({ chartId: 'value' });
      console.log(`✅ Deleted ${deleteResult.deletedCount} chart(s)`);
    }
    
    // Step 3: Insert the new Generated Value chart
    console.log('\n=== Creating new Generated Value chart ===');
    const insertResult = await collection.insertOne(generatedValueChart);
    console.log(`✅ Created new Generated Value chart with ID: ${insertResult.insertedId}`);
    
    // Step 4: Verify the fix
    console.log('\n=== Verifying the fix ===');
    const verifiedChart = await collection.findOne({ chartId: 'value' });
    if (verifiedChart) {
      console.log('✅ Chart verified:');
      console.log(`- Title: ${verifiedChart.title}`);
      console.log(`- Subtitle: ${verifiedChart.subtitle}`);
      console.log(`- Order: ${verifiedChart.order}`);
      console.log(`- Total Label: ${verifiedChart.totalLabel}`);
      console.log(`- Elements: ${verifiedChart.elements.map(e => e.id).join(', ')}`);
    } else {
      console.log('❌ Error: Chart not found after creation!');
    }
    
    // Step 5: Show all charts by order
    console.log('\n=== All charts by order ===');
    const allCharts = await collection.find({}).sort({ order: 1 }).toArray();
    allCharts.forEach(chart => {
      console.log(`Order ${chart.order}: ${chart.chartId} - "${chart.title}"`);
    });
    
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

console.log('Starting Value chart fix...');
console.log('=======================================\n');

fixValueChart()
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
