// WHAT: List all partners with template info
// WHY: Check if partners exist and have report templates
// HOW: Query partners collection

import { MongoClient } from 'mongodb';

async function listPartners() {
  const uri = process.env.MONGODB_URI!;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('messmass');

    const partners = await db.collection('partners').find({}).toArray();

    console.log(`Found ${partners.length} partners:\n`);

    for (const partner of partners) {
      console.log('---');
      console.log('Name:', partner.name || 'No name');
      console.log('ID:', partner._id);
      console.log('Has reportTemplateId:', !!partner.reportTemplateId);
      if (partner.reportTemplateId) {
        console.log('Template ID:', partner.reportTemplateId);
      }
      console.log('View Slug:', partner.viewSlug || 'No slug');
    }

    // Check templates
    console.log('\n\n=== REPORT TEMPLATES ===\n');
    const templates = await db.collection('report_templates').find({}).toArray();
    
    console.log(`Found ${templates.length} templates:\n`);
    for (const template of templates) {
      console.log('---');
      console.log('Name:', template.name);
      console.log('ID:', template._id);
      console.log('Is Default:', !!template.isDefault);
      console.log('Blocks:', template.blocks?.length || 0);
    }

  } finally {
    await client.close();
  }
}

listPartners();
