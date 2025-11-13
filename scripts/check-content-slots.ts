// WHAT: Check how many reportImage/reportText chart configs exist
// WHY: Diagnose if minimum 10 slots are pre-seeded
// HOW: Query chart_configurations collection

import { MongoClient } from 'mongodb';

async function checkContentSlots() {
  const uri = process.env.MONGODB_URI!;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('messmass');

    // Find all reportImage charts
    const imageCharts = await db.collection('chart_configurations')
      .find({ chartId: /^report-image-/ })
      .sort({ chartId: 1 })
      .toArray();

    console.log(`Found ${imageCharts.length} reportImage chart configs:\n`);
    imageCharts.forEach(chart => {
      console.log(`- ${chart.chartId}: ${chart.name}`);
    });

    // Find all reportText charts
    const textCharts = await db.collection('chart_configurations')
      .find({ chartId: /^report-text-/ })
      .sort({ chartId: 1 })
      .toArray();

    console.log(`\nFound ${textCharts.length} reportText chart configs:\n`);
    textCharts.forEach(chart => {
      console.log(`- ${chart.chartId}: ${chart.name}`);
    });

    console.log('\n---');
    console.log('Summary:');
    console.log('Image slots:', imageCharts.length);
    console.log('Text slots:', textCharts.length);
    console.log('Minimum required: 10 each');
    console.log('Images shortage:', Math.max(0, 10 - imageCharts.length));
    console.log('Texts shortage:', Math.max(0, 10 - textCharts.length));

  } finally {
    await client.close();
  }
}

checkContentSlots();
