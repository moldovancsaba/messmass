// WHAT: Verify chart configurations exist for AS Roma template blocks
// WHY: Builder shows "Chart not found" - need to check if chartIds exist
// HOW: Fetch blocks, get chartIds, check chart_configurations collection

import { MongoClient, ObjectId } from 'mongodb';

async function verifyCharts() {
  const uri = process.env.MONGODB_URI!;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('messmass');

    // Get AS Roma template
    const template = await db.collection('report_templates').findOne({
      _id: new ObjectId('691323a22c601d6a41780983')
    });

    if (!template || !template.dataBlocks) {
      console.log('❌ Template not found or has no dataBlocks');
      return;
    }

    console.log(`Template: ${template.name}`);
    console.log(`Blocks: ${template.dataBlocks.length}\n`);

    // Get all blocks
    const blockIds = template.dataBlocks.map((ref: any) => new ObjectId(ref.blockId));
    const blocks = await db.collection('data_blocks').find({
      _id: { $in: blockIds }
    }).toArray();

    console.log(`Found ${blocks.length} data_blocks documents\n`);

    // Check each block's charts
    for (const block of blocks) {
      console.log(`\nBlock: ${block.title || block._id}`);
      console.log(`  chartIds: ${block.chartIds?.join(', ') || 'NONE'}`);

      if (block.chartIds && block.chartIds.length > 0) {
        for (const chartId of block.chartIds) {
          const chart = await db.collection('chart_configurations').findOne({ chartId });
          
          if (chart) {
            console.log(`  ✅ ${chartId} EXISTS`);
          } else {
            console.log(`  ❌ ${chartId} NOT FOUND in chart_configurations`);
          }
        }
      }
    }

  } finally {
    await client.close();
  }
}

verifyCharts();
