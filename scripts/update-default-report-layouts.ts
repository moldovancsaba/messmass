import { MongoClient, ObjectId } from 'mongodb';
import { requireMessmassUri } from './lib/singleClusterConfig';

const CLUSTERS = [
  {
    name: 'Messmass (MONGODB_URI)',
    uri: requireMessmassUri(),
  },
];

const DEFAULT_STYLE_ID = new ObjectId('6999bbd2680bbfd7dec08b1e'); // messmass.com valid style
const DEFAULT_EVENT_TEMPLATE_ID = new ObjectId('691319a0d50e0e374b45fdef');
const DEFAULT_PARTNER_TEMPLATE_ID = new ObjectId('691319a0d50e0e374b45fdf0');

const DEFAULT_BLOCKS = [
  {
    _id: new ObjectId('6b1000000000000000000001'),
    name: 'Event Visual Highlights',
    showTitle: false,
    order: 0,
    isActive: true,
    charts: [
      { chartId: 'report-image-1', width: 2, order: 0 },
      { chartId: 'report-image-2', width: 2, order: 1 },
      { chartId: 'report-image-3', width: 2, order: 2 },
      { chartId: 'report-image-4', width: 2, order: 3 },
    ],
  },
  {
    _id: new ObjectId('6b1000000000000000000002'),
    name: 'Photo Capture & Brand Safety',
    showTitle: true,
    order: 1,
    isActive: true,
    charts: [
      { chartId: 'all-images-captured', width: 1, order: 0 },
      { chartId: 'approved-photos', width: 1, order: 1 },
      { chartId: 'hostess-images', width: 1, order: 2 },
      { chartId: 'fan-selfies', width: 1, order: 3 },
      { chartId: 'hostess-image-ratio', width: 1, order: 4 },
      { chartId: 'brand-protection', width: 1, order: 5 },
    ],
  },
  {
    _id: new ObjectId('6b1000000000000000000003'),
    name: 'Fan Engagement & Venue Presence',
    showTitle: true,
    order: 2,
    isActive: true,
    charts: [
      { chartId: 'fans-engaged', width: 1, order: 0 },
      { chartId: 'fans-per-image', width: 1, order: 1 },
      { chartId: 'image-density', width: 1, order: 2 },
      { chartId: 'fans-location', width: 2, order: 3 },
      { chartId: 'engagement-rate', width: 1, order: 4 },
    ],
  },
  {
    _id: new ObjectId('6b1000000000000000000004'),
    name: 'Fan Demographics & Age Breakdown',
    showTitle: true,
    order: 3,
    isActive: true,
    charts: [
      { chartId: 'gender-distribution', width: 2, order: 0 },
      { chartId: 'age-groups', width: 3, order: 1 },
      { chartId: 'marketing-value-kpi', width: 1, order: 2 },
    ],
  },
  {
    _id: new ObjectId('6b1000000000000000000005'),
    name: 'Merchandise & Team Apparel',
    showTitle: true,
    order: 4,
    isActive: true,
    charts: [
      { chartId: 'merched-fans', width: 1, order: 0 },
      { chartId: 'merch-penetration', width: 1, order: 1 },
      { chartId: 'merch-ratio', width: 2, order: 2 },
      { chartId: 'merchandise-distribution', width: 2, order: 3 },
    ],
  },
  {
    _id: new ObjectId('6b1000000000000000000006'),
    name: 'Digital Reach, QR Scans & Conversions',
    showTitle: true,
    order: 5,
    isActive: true,
    charts: [
      { chartId: 'qr-scans', width: 1, order: 0 },
      { chartId: 'qrscan-device', width: 2, order: 1 },
      { chartId: 'unique-users', width: 1, order: 2 },
      { chartId: 'marketing-opt-in', width: 1, order: 3 },
      { chartId: 'pop-up-banner-clicks', width: 1, order: 4 },
      { chartId: 'VentCtaemail', width: 1, order: 5 },
      { chartId: 'bitly.click', width: 2, order: 6 },
      { chartId: 'bitly-top-countries', width: 3, order: 7 },
    ],
  },
];

async function run() {
  const nowIso = new Date().toISOString();

  for (const cluster of CLUSTERS) {
    const client = new MongoClient(cluster.uri);
    await client.connect();
    const db = client.db('messmass');
    console.log(`\n=== Updating ${cluster.name} ===`);

    // 1. Fix marketing-opt-in formula so 0/0 returns 'NA' instead of (0+1)/(0+1)*100 = 100%
    const mktRes = await db.collection('chart_configurations').updateMany(
      { chartId: 'marketing-opt-in' },
      {
        $set: {
          formula: '([marketingOptin] / [uniqueUsers]) * 100',
          'elements.0.formula': '([marketingOptin] / [uniqueUsers]) * 100',
          updatedAt: nowIso,
        },
      }
    );
    console.log(`Updated marketing-opt-in chart formula: ${mktRes.modifiedCount}`);

    // 2. Clean up dummy 'Other: [boomer] * 0' element on age-groups chart
    const ageChart = await db.collection('chart_configurations').findOne({ chartId: 'age-groups' });
    if (ageChart && Array.isArray(ageChart.elements)) {
      const cleanedElements = ageChart.elements.filter(
        (el: any) => !String(el.formula || '').includes('* 0')
      );
      if (cleanedElements.length !== ageChart.elements.length) {
        await db.collection('chart_configurations').updateOne(
          { _id: ageChart._id },
          { $set: { elements: cleanedElements, updatedAt: nowIso } }
        );
        console.log(`Cleaned dummy 0-multiplier element from age-groups (${ageChart.elements.length} -> ${cleanedElements.length})`);
      }
    }

    // 3. Upsert all 6 default data_blocks
    for (const block of DEFAULT_BLOCKS) {
      await db.collection('data_blocks').updateOne(
        { _id: block._id },
        {
          $set: {
            name: block.name,
            showTitle: block.showTitle,
            order: block.order,
            isActive: block.isActive,
            charts: block.charts,
            updatedAt: nowIso,
          },
          $setOnInsert: {
            createdAt: nowIso,
          },
        },
        { upsert: true }
      );
    }
    console.log(`Upserted ${DEFAULT_BLOCKS.length} default data_blocks`);

    const dataBlockRefs = DEFAULT_BLOCKS.map((b, idx) => ({
      blockId: b._id.toString(),
      order: idx,
    }));

    const legacyEmbeddedBlocks = DEFAULT_BLOCKS.map((b, idx) => ({
      id: b._id.toString(),
      title: b.name,
      showTitle: b.showTitle,
      order: idx,
      charts: b.charts,
    }));

    // 4. Update Default Event Report & Default Partner Report in report_templates
    for (const tplSpec of [
      {
        _id: DEFAULT_EVENT_TEMPLATE_ID,
        name: 'Default Event Report',
        description: 'Comprehensive default template for event reports with automatic empty/zero chart hiding',
        type: 'event',
      },
      {
        _id: DEFAULT_PARTNER_TEMPLATE_ID,
        name: 'Default Partner Report',
        description: 'Comprehensive default template for partner and organization reports with automatic empty/zero chart hiding',
        type: 'partner',
      },
    ]) {
      await db.collection('report_templates').updateOne(
        { _id: tplSpec._id },
        {
          $set: {
            name: tplSpec.name,
            description: tplSpec.description,
            type: tplSpec.type,
            isDefault: true,
            styleId: DEFAULT_STYLE_ID,
            dataBlocks: dataBlockRefs,
            gridSettings: {
              desktopUnits: 6,
              tabletUnits: 3,
              mobileUnits: 2,
            },
            heroSettings: {
              showEmoji: true,
              showDateInfo: true,
              showExportOptions: true,
            },
            alignmentSettings: {
              alignTitles: true,
              alignDescriptions: true,
              alignCharts: true,
            },
            updatedAt: nowIso,
          },
          $setOnInsert: {
            createdBy: 'system',
            createdAt: nowIso,
          },
        },
        { upsert: true }
      );

      // Also sync legacy `reports` collection documents with the same IDs
      await db.collection('reports').updateOne(
        { _id: tplSpec._id },
        {
          $set: {
            name: tplSpec.name,
            description: tplSpec.description,
            type: tplSpec.type,
            isDefault: true,
            styleId: DEFAULT_STYLE_ID.toString(),
            blocks: legacyEmbeddedBlocks,
            gridSettings: {
              desktopUnits: 6,
              tabletUnits: 3,
              mobileUnits: 2,
            },
            heroSettings: {
              showEmoji: true,
              showDateInfo: true,
              showExportOptions: true,
            },
            alignmentSettings: {
              alignTitles: true,
              alignDescriptions: true,
              alignCharts: true,
            },
            updatedAt: nowIso,
          },
          $setOnInsert: {
            createdBy: 'system',
            createdAt: nowIso,
          },
        },
        { upsert: true }
      );
    }
    console.log('Updated Default Event Report and Default Partner Report in report_templates & reports');

    await client.close();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
