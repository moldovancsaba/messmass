// WHAT: List all templates and their block counts
// WHY: Need to find a template with actual blocks to copy from
// HOW: Query all templates and show their details

import { MongoClient } from 'mongodb';

async function listAllTemplates() {
  const uri = process.env.MONGODB_URI!;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('messmass');

    const templates = await db.collection('report_templates').find({}).toArray();

    console.log(`Found ${templates.length} templates:\n`);

    for (const template of templates) {
      console.log('---');
      console.log('Name:', template.name);
      console.log('ID:', template._id);
      console.log('Is Default:', !!template.isDefault);
      console.log('Blocks:', template.blocks?.length || 0);
      
      if (template.blocks && template.blocks.length > 0) {
        console.log('Block IDs:', template.blocks.map((b: any) => b.chartId).join(', '));
      }
    }

  } finally {
    await client.close();
  }
}

listAllTemplates();
