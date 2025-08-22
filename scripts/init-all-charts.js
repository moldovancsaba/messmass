// Script to initialize all chart configurations in MongoDB with the updated Generated Value chart
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://moldovancsaba:j8HxxytTjrtJXskz@messmass-cluster.r96vlxs.mongodb.net/messmass?retryWrites=true&w=majority&appName=messmass-cluster';
const DATABASE_NAME = 'messmass';
const COLLECTION_NAME = 'chartconfigurations';

// All chart configurations with the updated Generated Value chart
const ALL_CHART_CONFIGURATIONS = [
  // 1. Gender Distribution Pie Chart
  {
    chartId: 'gender-distribution',
    title: 'Gender Distribution',
    type: 'pie',
    order: 1,
    isActive: true,
    emoji: '👥',
    elements: [
      { id: 'female', label: 'Female', formula: '[FEMALE]', color: '#ff6b9d', description: 'Female attendees' },
      { id: 'male', label: 'Male', formula: '[MALE]', color: '#4a90e2', description: 'Male attendees' }
    ]
  },
  
  // 2. Fans Location Pie Chart
  {
    chartId: 'fans-location',
    title: 'Fans Location',
    type: 'pie',
    order: 2,
    isActive: true,
    emoji: '📍',
    elements: [
      { id: 'remote', label: 'Remote', formula: '[INDOOR] + [OUTDOOR]', color: '#3b82f6', description: 'Remote fans (indoor + outdoor)' },
      { id: 'event', label: 'Event', formula: '[STADIUM]', color: '#f59e0b', description: 'Stadium fans' }
    ]
  },
  
  // 3. Age Groups Pie Chart  
  {
    chartId: 'age-groups',
    title: 'Age Groups',
    type: 'pie',
    order: 3,
    isActive: true,
    emoji: '👥',
    elements: [
      { id: 'under-40', label: 'Under 40', formula: '[GEN_ALPHA] + [GEN_YZ]', color: '#06b6d4', description: 'Gen Alpha + Gen Y/Z' },
      { id: 'over-40', label: 'Over 40', formula: '[GEN_X] + [BOOMER]', color: '#f97316', description: 'Gen X + Boomer' }
    ]
  },
  
  // 4. Visitor Sources Pie Chart
  {
    chartId: 'visitor-sources',
    title: 'Visitor Sources',
    type: 'pie',
    order: 4,
    isActive: true,
    emoji: '🌐',
    elements: [
      { id: 'qr-short', label: 'QR + Short URL', formula: '[VISIT_QR_CODE] + [VISIT_SHORT_URL]', color: '#3b82f6', description: 'QR code and short URL visits' },
      { id: 'other', label: 'Other', formula: '[VISIT_WEB]', color: '#f59e0b', description: 'Other web visits' }
    ]
  },
  
  // 5. Merchandise Sales Horizontal Bar Chart
  {
    chartId: 'merchandise-sales',
    title: 'Merchandise Sales',
    type: 'bar',
    order: 5,
    isActive: true,
    showTotal: true,
    totalLabel: 'possible merch sales',
    emoji: '🛍️',
    elements: [
      { id: 'jersey-sales', label: 'Jersey', formula: '[JERSEY] * [JERSEY_PRICE]', color: '#7b68ee', description: 'Jersey sales in EUR' },
      { id: 'scarf-sales', label: 'Scarf', formula: '[SCARF] * [SCARF_PRICE]', color: '#ff6b9d', description: 'Scarf sales in EUR' },
      { id: 'flags-sales', label: 'Flags', formula: '[FLAGS] * [FLAGS_PRICE]', color: '#ffa726', description: 'Flag sales in EUR' },
      { id: 'cap-sales', label: 'Baseball Cap', formula: '[BASEBALL_CAP] * [CAP_PRICE]', color: '#66bb6a', description: 'Baseball cap sales in EUR' },
      { id: 'other-sales', label: 'Other', formula: '[OTHER] * [OTHER_PRICE]', color: '#ef5350', description: 'Other merchandise sales in EUR' }
    ]
  },
  
  // 6. Generated Value Horizontal Bar Chart (UPDATED)
  {
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
    ]
  },
  
  // 7. Engagement Horizontal Bar Chart  
  {
    chartId: 'engagement',
    title: 'Engagement',
    type: 'bar',
    order: 7,
    isActive: true,
    showTotal: true,
    totalLabel: 'Core Fan Team',
    elements: [
      { id: 'engaged', label: 'Engaged', formula: '([INDOOR] + [OUTDOOR] + [STADIUM]) / [EVENT_ATTENDEES] * 100', color: '#8b5cf6', description: 'Fan Engagement %' },
      { id: 'interactive', label: 'Interactive', formula: '([VISIT_FACEBOOK] + [VISIT_INSTAGRAM] + [VISIT_YOUTUBE] + [VISIT_TIKTOK] + [VISIT_X] + [VISIT_TRUSTPILOT] + [EVENT_VALUE_PROPOSITION_VISITED] + [EVENT_VALUE_PROPOSITION_PURCHASES]) / ([REMOTE_IMAGES] + [HOSTESS_IMAGES] + [SELFIES]) * 100', color: '#f59e0b', description: 'Fan Interaction %' },
      { id: 'front-runners', label: 'Front-runners', formula: '[MERCHED] / ([INDOOR] + [OUTDOOR] + [STADIUM]) * 100', color: '#10b981', description: 'Merched fans %' },
      { id: 'fanaticals', label: 'Fanaticals', formula: '([FLAGS] + [SCARF]) / [MERCHED] * 100', color: '#ef4444', description: 'Flags & scarfs of merched %' },
      { id: 'casuals', label: 'Casuals', formula: '(([INDOOR] + [OUTDOOR] + [STADIUM]) - [MERCHED]) / ([INDOOR] + [OUTDOOR] + [STADIUM]) * 100', color: '#06b6d4', description: 'Non-merched fans %' }
    ]
  },
  
  // 8. Faces per Image KPI Chart
  {
    chartId: 'faces-per-image',
    title: 'Faces per Image',
    type: 'kpi',
    order: 8,
    isActive: true,
    emoji: '👀',
    elements: [
      { 
        id: 'faces-per-image-value', 
        label: 'Average faces per approved image', 
        formula: '([FEMALE] + [MALE]) / [APPROVED_IMAGES]', 
        color: '#10b981', 
        description: 'Calculation from your totals: total faces by gender divided by images to show authentic reach per asset. Target audience: Brand owner, media planners, sponsorship sales. Quantify how many branded faces appear per image on average. Capture the multiplier effect for on-screen brand exposure.' 
      }
    ]
  },
  
  // 9. Image Density KPI Chart
  {
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
    ]
  }
];

async function initializeAllCharts() {
  let client;
  
  try {
    console.log('Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db(DATABASE_NAME);
    const collection = db.collection(COLLECTION_NAME);
    
    // Step 1: Clear all existing chart configurations
    console.log('\n=== Clearing existing chart configurations ===');
    const deleteResult = await collection.deleteMany({});
    console.log(`✅ Deleted ${deleteResult.deletedCount} existing chart(s)`);
    
    // Step 2: Insert all chart configurations with timestamps
    console.log('\n=== Inserting all chart configurations ===');
    const now = new Date().toISOString();
    const configurationsWithTimestamps = ALL_CHART_CONFIGURATIONS.map(config => ({
      ...config,
      createdAt: now,
      updatedAt: now,
      createdBy: 'init-script-v2.1.0',
      lastModifiedBy: 'init-script-v2.1.0'
    }));
    
    const insertResult = await collection.insertMany(configurationsWithTimestamps);
    console.log(`✅ Inserted ${insertResult.insertedCount} chart configurations`);
    
    // Step 3: Verify the results
    console.log('\n=== Verifying initialization ===');
    const allCharts = await collection.find({}).sort({ order: 1 }).toArray();
    console.log(`Total charts in database: ${allCharts.length}`);
    
    allCharts.forEach(chart => {
      console.log(`Order ${chart.order}: ${chart.chartId} - "${chart.title}" (${chart.type})`);
    });
    
    // Step 4: Specifically verify the Generated Value chart
    console.log('\n=== Generated Value Chart Details ===');
    const valueChart = await collection.findOne({ chartId: 'value' });
    if (valueChart) {
      console.log(`✅ Title: ${valueChart.title}`);
      console.log(`✅ Subtitle: ${valueChart.subtitle}`);
      console.log(`✅ Total Label: ${valueChart.totalLabel}`);
      console.log(`✅ Elements: ${valueChart.elements.map(e => e.id).join(', ')}`);
    } else {
      console.log('❌ Generated Value chart not found!');
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

console.log('Initializing all chart configurations...');
console.log('=======================================\n');

initializeAllCharts()
  .then(() => {
    console.log('\n=======================================');
    console.log('✅ All chart configurations initialized successfully!');
    console.log('Please refresh your browser to see the changes.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Initialization error:', error);
    process.exit(1);
  });
