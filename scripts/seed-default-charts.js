// scripts/seed-default-charts.js
// Seeds the 9 hardcoded default charts from chartConfigTypes.ts into MongoDB

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });
// Node 24 strips the types when a plain script requires a .ts module.
const { CHART_COLOR } = require('../lib/theme/chartPalette.ts');

const DEFAULT_CHARTS = [
  // 1. Gender Distribution Pie Chart
  {
    chartId: 'gender-distribution',
    title: 'Gender Distribution',
    type: 'pie',
    order: 1,
    isActive: true,
    emoji: '👥',
    elements: [
      { id: 'female', label: 'Female', formula: '[stats.female]', color: CHART_COLOR.femalePink, description: 'Female attendees' },
      { id: 'male', label: 'Male', formula: '[stats.male]', color: CHART_COLOR.maleBlue, description: 'Male attendees' }
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
      { id: 'remote', label: 'Remote', formula: '[stats.remoteFans]', color: CHART_COLOR.blue, description: 'Remote fans (indoor + outdoor)' },
      { id: 'event', label: 'Event', formula: '[stats.stadium]', color: CHART_COLOR.amber, description: 'Stadium fans' }
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
      { id: 'under-40', label: 'Under 40', formula: '[stats.genAlpha] + [stats.genYZ]', color: CHART_COLOR.cyan, description: 'Gen Alpha + Gen Y/Z' },
      { id: 'over-40', label: 'Over 40', formula: '[stats.genX] + [stats.boomer]', color: CHART_COLOR.orange, description: 'Gen X + Boomer' }
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
      { id: 'qr-short', label: 'QR + Short URL', formula: '[stats.visitQrCode] + [stats.visitShortUrl]', color: CHART_COLOR.blue, description: 'QR code and short URL visits' },
      { id: 'other', label: 'Other', formula: '[stats.visitWeb]', color: CHART_COLOR.amber, description: 'Other web visits' }
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
      { id: 'jersey-sales', label: 'Jersey', formula: '[stats.jersey] * [PARAM:jerseyPrice]', color: CHART_COLOR.jerseyViolet, description: 'Jersey sales in EUR', formatting: { rounded: true, prefix: '€', suffix: '' } },
      { id: 'scarf-sales', label: 'Scarf', formula: '[stats.scarf] * [PARAM:scarfPrice]', color: CHART_COLOR.femalePink, description: 'Scarf sales in EUR', formatting: { rounded: true, prefix: '€', suffix: '' } },
      { id: 'flags-sales', label: 'Flags', formula: '[stats.flags] * [PARAM:flagsPrice]', color: CHART_COLOR.flagsOrange, description: 'Flag sales in EUR', formatting: { rounded: true, prefix: '€', suffix: '' } },
      { id: 'cap-sales', label: 'Baseball Cap', formula: '[stats.baseballCap] * [PARAM:capPrice]', color: CHART_COLOR.capGreen, description: 'Baseball cap sales in EUR', formatting: { rounded: true, prefix: '€', suffix: '' } },
      { id: 'other-sales', label: 'Other', formula: '[stats.other] * [PARAM:otherPrice]', color: CHART_COLOR.otherRed, description: 'Other merchandise sales in EUR', formatting: { rounded: true, prefix: '€', suffix: '' } }
    ]
  },
  
  // 6. Generated Value (VALUE type with dual formatting)
  {
    chartId: 'value',
    title: 'Generated Value',
    type: 'value',
    order: 6,
    isActive: true,
    showTotal: true,
    totalLabel: 'Total Generated Value',
    emoji: '📊',
    subtitle: 'Breakdown of Event-Generated Brand Value',
    kpiFormatting: { rounded: true, prefix: '€', suffix: '' },
    barFormatting: { rounded: true, prefix: '€', suffix: '' },
    elements: [
      { 
        id: 'marketing-optin', 
        label: 'Marketing Opt-in Users', 
        formula: '([stats.remoteImages] + [stats.hostessImages] + [stats.selfies]) * 4.87',
        color: CHART_COLOR.blue, 
        description: 'Every image corresponds to a GDPR-compliant opt-in fan. Each contact has measurable acquisition cost in digital marketing (€4.87 avg market cost per email opt-in in Europe, 2025)' 
      },
      { 
        id: 'value-prop-emails', 
        label: 'Value Proposition Emails', 
        formula: '([stats.remoteImages] + [stats.hostessImages] + [stats.selfies]) * 1.07',
        color: CHART_COLOR.green, 
        description: 'Every email delivered includes branded fan photo plus sponsor offer. Add-on ad space valued at €1.07 avg CPM email value add per send' 
      },
      { 
        id: 'giant-screen-ads', 
        label: 'Ads on Giant Screen', 
        formula: '([stats.eventAttendees] / 1000) * 6 * 0.2 * ([stats.remoteImages] + [stats.hostessImages] + [stats.selfies])',
        color: CHART_COLOR.amber, 
        description: 'Fans + brands shown on stadium big screen = in-stadium advertising equivalent. Stadium advertising CPM ≈ €6.00 per 1,000 attendees per 30s slot. 6s exposure = 0.2 of CPM' 
      },
      { 
        id: 'under40-engagement', 
        label: 'Under-40 Engagement', 
        formula: '([stats.genAlpha] + [stats.genYZ]) * 2.14',
        color: CHART_COLOR.purple, 
        description: '80% of engaged fans are under 40 - critical target for most brands. Each identified contact carries premium value (€2.14 avg value of youth contact vs older groups)' 
      },
      { 
        id: 'brand-awareness', 
        label: 'Brand Awareness Boost', 
        formula: '200 * 300 * 0.0145', 
        color: CHART_COLOR.red, 
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
      { id: 'engaged', label: 'Engaged', formula: '([stats.remoteFans] + [stats.stadium]) / [stats.eventAttendees] * 100', color: CHART_COLOR.purple, description: 'Fan Engagement %', formatting: { rounded: true, prefix: '', suffix: '%' } },
      { id: 'interactive', label: 'Interactive', formula: '([stats.socialVisit] + [stats.eventValuePropositionVisited] + [stats.eventValuePropositionPurchases]) / ([stats.remoteImages] + [stats.hostessImages] + [stats.selfies]) * 100', color: CHART_COLOR.amber, description: 'Fan Interaction %', formatting: { rounded: true, prefix: '', suffix: '%' } },
      { id: 'front-runners', label: 'Front-runners', formula: '[stats.merched] / ([stats.remoteFans] + [stats.stadium]) * 100', color: CHART_COLOR.green, description: 'Merched fans %', formatting: { rounded: true, prefix: '', suffix: '%' } },
      { id: 'fanaticals', label: 'Fanaticals', formula: '([stats.flags] + [stats.scarf]) / [stats.merched] * 100', color: CHART_COLOR.red, description: 'Flags & scarfs of merched %', formatting: { rounded: true, prefix: '', suffix: '%' } },
      { id: 'casuals', label: 'Casuals', formula: '(([stats.remoteFans] + [stats.stadium]) - [stats.merched]) / ([stats.remoteFans] + [stats.stadium]) * 100', color: CHART_COLOR.cyan, description: 'Non-merched fans %', formatting: { rounded: true, prefix: '', suffix: '%' } }
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
        formula: '([stats.female] + [stats.male]) / [stats.approvedImages]',
        color: CHART_COLOR.green, 
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
        formula: '([stats.remoteImages] + [stats.hostessImages] + [stats.selfies]) / ([stats.female] + [stats.male]) * 100',
        color: CHART_COLOR.blue, 
        description: 'Show how actively fans created content. Help venues and rights holders benchmark activation performance. Derived from your counts - a simple, comparable index across events. Target audience: Event ops, sponsorship sales, client success.' 
      }
    ]
  }
];

async function seedDefaultCharts() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'messmass');
    const collection = db.collection('chart_configurations');
    
    console.log('🌱 Seeding default charts to database...\n');
    
    const now = new Date().toISOString();
    let inserted = 0;
    let skipped = 0;
    
    for (const chart of DEFAULT_CHARTS) {
      // Check if chart already exists
      const existing = await collection.findOne({ chartId: chart.chartId });
      
      if (existing) {
        console.log(`⏭️  Skipping "${chart.title}" - already exists`);
        skipped++;
        continue;
      }
      
      // Add timestamps
      const chartWithMeta = {
        ...chart,
        createdAt: now,
        updatedAt: now,
        createdBy: 'system-seed'
      };
      
      await collection.insertOne(chartWithMeta);
      console.log(`✅ Seeded "${chart.title}" (${chart.type})`);
      inserted++;
    }
    
    console.log(`\n📊 Seeding complete: ${inserted} inserted, ${skipped} skipped`);
    
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

seedDefaultCharts();
