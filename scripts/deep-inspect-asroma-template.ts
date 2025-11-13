// WHAT: Deep inspection of AS Roma template structure
// WHY: Visualization Manager shows 12 blocks but Builder sees 0
// HOW: Check template document structure and data_blocks references

import { MongoClient, ObjectId } from 'mongodb';

async function deepInspectTemplate() {
  const uri = process.env.MONGODB_URI!;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('messmass');

    // Get AS Roma template
    const template = await db.collection('report_templates').findOne({
      _id: new ObjectId('691323a22c601d6a41780983')
    });

    console.log('AS Roma Template Document Structure:');
    console.log(JSON.stringify(template, null, 2));

    console.log('\n---\nField Analysis:');
    console.log('Has blocks field:', 'blocks' in (template || {}));
    console.log('Has dataBlocks field:', 'dataBlocks' in (template || {}));
    console.log('blocks value:', template?.blocks);
    console.log('dataBlocks value:', template?.dataBlocks);

    // Check data_blocks collection for this template
    console.log('\n---\nSearching data_blocks collection:');
    
    const blocks = await db.collection('data_blocks').find({
      templateId: new ObjectId('691323a22c601d6a41780983')
    }).toArray();

    console.log(`Found ${blocks.length} blocks with templateId matching AS Roma`);

    if (blocks.length > 0) {
      console.log('\nBlock IDs:');
      blocks.forEach(block => {
        console.log(`- ${block._id} (order: ${block.order}, charts: ${block.chartIds?.length || 0})`);
      });
    }

    // Also check without templateId filter
    const allBlocks = await db.collection('data_blocks').find({}).toArray();
    console.log(`\n\nTotal blocks in data_blocks collection: ${allBlocks.length}`);

  } finally {
    await client.close();
  }
}

deepInspectTemplate();
