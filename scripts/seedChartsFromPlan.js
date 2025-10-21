// scripts/seedChartsFromPlan.js
// WHAT: Seed or update meaningful chart configurations based on current analytics plan
// WHY: Ensure stats pages and insights use clear, insight-driven charts without manual UI steps
// NOTE: Uses the same collection naming as API: "chartConfigurations" (camelCase)

const { MongoClient } = require('mongodb');
const config = require('./config');

const MONGODB_URI = config.mongodbUri;
const DATABASE_NAME = config.dbName;
const COLLECTION_NAME = 'chartConfigurations';

// Helper to get ISO 8601 with milliseconds
function isoNow() {
  return new Date().toISOString();
}

// Desired chart configurations (aligns with ChartConfiguration schema)
const DESIRED_CHARTS = [
  {
    chartId: 'gender-distribution',
    title: 'Gender Distribution',
    type: 'pie',
    order: 1,
    isActive: true,
    emoji: '👥',
    subtitle: 'Fan demographics',
    elements: [
      { id: 'female', label: 'Female', formula: '[SEYUFEMALE]', color: '#ff6b9d' },
      { id: 'male', label: 'Male', formula: '[SEYUMALE]', color: '#4a90e2' },
    ],
  },
  {
    chartId: 'fans-location',
    title: 'Fans Location',
    type: 'pie',
    order: 2,
    isActive: true,
    emoji: '📍',
    subtitle: 'Where fans engage',
    elements: [
      { id: 'remote', label: 'Remote', formula: '[SEYUREMOTEFANS]', color: '#3b82f6' },
      { id: 'event', label: 'Event', formula: '[SEYUSTADIUMFANS]', color: '#f59e0b' },
    ],
  },
  {
    chartId: 'age-groups',
    title: 'Age Groups',
    type: 'pie',
    order: 3,
    isActive: true,
    emoji: '👥',
    subtitle: 'Age demographics',
    elements: [
      { id: 'under-40', label: 'Under 40', formula: '[SEYUGENALPHA] + [SEYUGENYZ]', color: '#06b6d4' },
      { id: 'over-40', label: 'Over 40', formula: '[SEYUGENX] + [SEYUBOOMER]', color: '#f97316' },
    ],
  },
  {
    chartId: 'visitor-sources',
    title: 'Visitor Sources',
    type: 'pie',
    order: 4,
    isActive: true,
    emoji: '🌐',
    subtitle: 'Attribution',
    elements: [
      { id: 'qr-short', label: 'QR + Short URL', formula: '[SEYUQRCODEVISIT] + [SEYUSHORTURLVISIT]', color: '#3b82f6' },
      { id: 'other', label: 'Other', formula: '[SEYUWEBVISIT]', color: '#f59e0b' },
    ],
  },
  {
    chartId: 'engagement-rate',
    title: 'Engagement Rate',
    type: 'kpi',
    order: 5,
    isActive: true,
    emoji: '📈',
    subtitle: 'Total fans vs attendees (%)',
    elements: [
      { id: 'engagement-rate-kpi', label: 'Engagement %', formula: '([SEYUTOTALFANS]) / [SEYUATTENDEES] * 100', color: '#8b5cf6' },
    ],
  },
  {
    chartId: 'merch-penetration',
    title: 'Merchandise Penetration',
    type: 'kpi',
    order: 6,
    isActive: true,
    emoji: '🛍️',
    subtitle: 'Merched fans / total fans (%)',
    elements: [
      { id: 'merch-pen-kpi', label: 'Merch %', formula: '[SEYUMERCHEDFANS] / [SEYUTOTALFANS] * 100', color: '#10b981' },
    ],
  },
  {
    chartId: 'faces-per-image',
    title: 'Faces per Image',
    type: 'kpi',
    order: 7,
    isActive: true,
    emoji: '👀',
    subtitle: 'Average faces per approved image',
    elements: [
      { id: 'faces-kpi', label: 'Faces/Image', formula: '([SEYUFEMALE] + [SEYUMALE]) / [SEYUAPPROVEDIMAGES]', color: '#10b981' },
    ],
  },
  {
    chartId: 'merchandise-distribution',
    title: 'Merchandise Distribution',
    type: 'bar',
    order: 8,
    isActive: true,
    emoji: '🛍️',
    subtitle: 'Types of fan gear',
    showTotal: false,
    elements: [
      { id: 'jersey', label: 'Jersey', formula: '[SEYUMERCHJERSEY]', color: '#7b68ee' },
      { id: 'scarf', label: 'Scarf', formula: '[SEYUMERCHSCARF]', color: '#ff6b9d' },
      { id: 'flags', label: 'Flags', formula: '[SEYUMERCHFLAGS]', color: '#ffa726' },
      { id: 'cap', label: 'Baseball Cap', formula: '[SEYUMERCHBASEBALLCAP]', color: '#66bb6a' },
      { id: 'other', label: 'Other', formula: '[SEYUMERCHOTHER]', color: '#ef5350' },
    ],
  },
  {
    chartId: 'value',
    title: 'Generated Value',
    type: 'bar',
    order: 9,
    isActive: true,
    emoji: '📊',
    subtitle: 'Breakdown of event-generated brand value',
    showTotal: true,
    totalLabel: 'Total Generated Value',
    elements: [
      {
        id: 'marketing-optin',
        label: 'Marketing Opt-in Users',
        formula: '([SEYUREMOTEIMAGES] + [SEYUHOSTESSIMAGES] + [SEYUSELFIES]) * 4.87',
        color: '#3b82f6',
      },
      {
        id: 'value-prop-emails',
        label: 'Value Proposition Emails',
        formula: '([SEYUREMOTEIMAGES] + [SEYUHOSTESSIMAGES] + [SEYUSELFIES]) * 1.07',
        color: '#10b981',
      },
      {
        id: 'giant-screen-ads',
        label: 'Ads on Giant Screen',
        formula: '([SEYUATTENDEES] / 1000) * 6 * 0.2 * ([SEYUREMOTEIMAGES] + [SEYUHOSTESSIMAGES] + [SEYUSELFIES])',
        color: '#f59e0b',
      },
      {
        id: 'under40-engagement',
        label: 'Under-40 Engagement',
        formula: '([SEYUGENALPHA] + [SEYUGENYZ]) * 2.14',
        color: '#8b5cf6',
      },
      {
        id: 'brand-awareness',
        label: 'Brand Awareness Boost',
        formula: '200 * 300 * 0.0145',
        color: '#ef4444',
      },
    ],
  },
  {
    chartId: 'image-density',
    title: 'Image Density',
    type: 'kpi',
    order: 10,
    isActive: true,
    emoji: '🧮',
    subtitle: 'Images per 100 fans',
    elements: [
      {
        id: 'image-density-kpi',
        label: 'Images / 100 Fans',
        formula: '([SEYUREMOTEIMAGES] + [SEYUHOSTESSIMAGES] + [SEYUSELFIES]) / ([SEYUFEMALE] + [SEYUMALE]) * 100',
        color: '#3b82f6',
      },
    ],
  },
];

async function run() {
  let client;
  try {
    console.log('🔗 Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DATABASE_NAME);
    const col = db.collection(COLLECTION_NAME);

    console.log(`📦 Upserting ${DESIRED_CHARTS.length} chart configurations into ${DATABASE_NAME}.${COLLECTION_NAME}`);

    let upserts = 0;
    let updates = 0;

    for (const cfg of DESIRED_CHARTS) {
      const now = isoNow();
      const existing = await col.findOne({ chartId: cfg.chartId });
      if (!existing) {
        await col.insertOne({
          ...cfg,
          createdAt: now,
          updatedAt: now,
        });
        upserts++;
        console.log(`➕ Inserted: ${cfg.chartId}`);
      } else {
        await col.updateOne(
          { _id: existing._id },
          {
            $set: {
              title: cfg.title,
              type: cfg.type,
              order: cfg.order,
              isActive: cfg.isActive,
              elements: cfg.elements,
              emoji: cfg.emoji,
              subtitle: cfg.subtitle,
              showTotal: cfg.showTotal,
              totalLabel: cfg.totalLabel,
              updatedAt: now,
            },
          }
        );
        updates++;
        console.log(`♻️ Updated: ${cfg.chartId}`);
      }
    }

    console.log(`✅ Done. Inserted: ${upserts}, Updated: ${updates}`);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exitCode = 1;
  } finally {
    if (client) {
      await client.close();
    }
  }
}

if (require.main === module) {
  run();
}
