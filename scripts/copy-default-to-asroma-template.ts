// WHAT: Copy default template blocks to AS Roma template
// WHY: AS Roma template exists but has 0 blocks - need to populate it
// HOW: Find default template, copy its blocks to AS Roma template

import { MongoClient, ObjectId } from 'mongodb';

async function copyDefaultToAsRomaTemplate() {
  const uri = process.env.MONGODB_URI!;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('messmass');

    // Find default template
    const defaultTemplate = await db.collection('report_templates').findOne({
      isDefault: true
    });

    if (!defaultTemplate) {
      console.log('❌ Default template not found');
      return;
    }

    console.log('✅ Default template found:', {
      _id: defaultTemplate._id,
      name: defaultTemplate.name,
      blocks: defaultTemplate.blocks?.length || 0
    });

    if (!defaultTemplate.blocks || defaultTemplate.blocks.length === 0) {
      console.log('❌ Default template has no blocks!');
      return;
    }

    // Find AS Roma template
    const asRomaTemplate = await db.collection('report_templates').findOne({
      _id: new ObjectId('691323a22c601d6a41780983')
    });

    if (!asRomaTemplate) {
      console.log('❌ AS Roma template not found');
      return;
    }

    console.log('\n📋 AS Roma template before:', {
      _id: asRomaTemplate._id,
      name: asRomaTemplate.name,
      blocks: asRomaTemplate.blocks?.length || 0
    });

    // Copy blocks from default to AS Roma
    const result = await db.collection('report_templates').updateOne(
      { _id: new ObjectId('691323a22c601d6a41780983') },
      { 
        $set: { 
          blocks: defaultTemplate.blocks,
          gridSettings: defaultTemplate.gridSettings,
          updatedAt: new Date().toISOString()
        } 
      }
    );

    console.log('\n✅ Copied blocks from default template to AS Roma template');
    console.log('Modified count:', result.modifiedCount);
    console.log('Blocks copied:', defaultTemplate.blocks.length);

    // Verify
    const updated = await db.collection('report_templates').findOne({
      _id: new ObjectId('691323a22c601d6a41780983')
    });

    console.log('\n📋 AS Roma template after:', {
      blocks: updated?.blocks?.length || 0
    });

  } finally {
    await client.close();
  }
}

copyDefaultToAsRomaTemplate();
