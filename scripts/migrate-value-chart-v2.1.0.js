// Migration Script: Update Value chart to Generated Value
// Version: 2.1.0
// Date: 2025-01-16
// Description: Updates the Value chart configuration with new business-relevant metrics

const { MongoClient } = require('mongodb');

// MongoDB connection string - update if needed
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/messmass';
const DATABASE_NAME = 'messmass';
const COLLECTION_NAME = 'chartconfigurations';

// New Generated Value chart configuration
const newValueChart = {
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
  lastModifiedBy: 'migration-v2.1.0'
};

async function migrateValueChart() {
  let client;
  
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db(DATABASE_NAME);
    const collection = db.collection(COLLECTION_NAME);
    
    // Check if the Value chart exists
    console.log('Checking for existing Value chart...');
    const existingChart = await collection.findOne({ chartId: 'value' });
    
    if (existingChart) {
      // Backup the existing chart
      console.log('Backing up existing chart...');
      const backupChart = { ...existingChart, chartId: `value-backup-${Date.now()}` };
      await collection.insertOne(backupChart);
      console.log(`Backup created with chartId: ${backupChart.chartId}`);
      
      // Update the existing chart
      console.log('Updating Value chart to Generated Value...');
      const result = await collection.updateOne(
        { chartId: 'value' },
        { 
          $set: newValueChart 
        }
      );
      
      if (result.modifiedCount === 1) {
        console.log('✅ Successfully updated Value chart to Generated Value');
      } else {
        console.log('⚠️ Chart found but not modified (may already be up to date)');
      }
    } else {
      // Insert new chart if it doesn't exist
      console.log('Value chart not found, creating new Generated Value chart...');
      newValueChart.createdAt = new Date().toISOString();
      newValueChart.createdBy = 'migration-v2.1.0';
      
      await collection.insertOne(newValueChart);
      console.log('✅ Successfully created new Generated Value chart');
    }
    
    // Verify the update
    const updatedChart = await collection.findOne({ chartId: 'value' });
    console.log('\nUpdated chart summary:');
    console.log(`- Title: ${updatedChart.title}`);
    console.log(`- Subtitle: ${updatedChart.subtitle}`);
    console.log(`- Total Label: ${updatedChart.totalLabel}`);
    console.log(`- Number of elements: ${updatedChart.elements.length}`);
    console.log(`- Element IDs: ${updatedChart.elements.map(e => e.id).join(', ')}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('\nDatabase connection closed');
    }
  }
}

// Run the migration
console.log('Starting Value chart migration to v2.1.0...');
console.log('=======================================\n');

migrateValueChart()
  .then(() => {
    console.log('\n=======================================');
    console.log('Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration error:', error);
    process.exit(1);
  });
