// WHAT: Migrate templates from old 'blocks' field to new 'dataBlocks' field
// WHY: Code expects template.dataBlocks but database has template.blocks
// HOW: Rename field in all report_templates documents

import { MongoClient } from 'mongodb';

async function migrateTemplates() {
  const uri = process.env.MONGODB_URI!;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('messmass');
    const templatesCollection = db.collection('report_templates');

    // Find all templates with 'blocks' field
    const templates = await templatesCollection.find({ blocks: { $exists: true } }).toArray();

    console.log(`Found ${templates.length} templates with 'blocks' field\n`);

    if (templates.length === 0) {
      console.log('✅ No migration needed - all templates already use dataBlocks');
      return;
    }

    let migrated = 0;

    for (const template of templates) {
      console.log(`Migrating template: ${template.name} (${template._id})`);
      console.log(`  Old blocks count: ${template.blocks?.length || 0}`);

      // Rename blocks → dataBlocks
      await templatesCollection.updateOne(
        { _id: template._id },
        { 
          $rename: { blocks: 'dataBlocks' },
          $set: { updatedAt: new Date().toISOString() }
        }
      );

      migrated++;
    }

    console.log(`\n✅ Migrated ${migrated} templates from 'blocks' to 'dataBlocks'`);

    // Verify
    const remaining = await templatesCollection.find({ blocks: { $exists: true } }).toArray();
    console.log(`\nVerification: ${remaining.length} templates still have 'blocks' field`);

    const withDataBlocks = await templatesCollection.find({ dataBlocks: { $exists: true } }).toArray();
    console.log(`Templates with 'dataBlocks': ${withDataBlocks.length}`);

  } finally {
    await client.close();
  }
}

migrateTemplates();
