require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function checkSihf() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'messmass');
    
    const partner = await db.collection('partners').findOne({ 
      viewSlug: '903f80ab-e105-4aaa-8c42-2caf71a46954' 
    });
    
    console.log('Partner found:', !!partner);
    if (partner) {
      console.log('Name:', partner.name);
      console.log('Template ID:', partner.reportTemplateId);
      
      if (partner.reportTemplateId) {
        const template = await db.collection('report_templates').findOne({ 
          _id: partner.reportTemplateId 
        });
        console.log('Template found:', !!template);
        if (template) {
          console.log('Template name:', template.name);
          console.log('Template blocks:', template.dataBlocks?.length || 0);
        }
      }
    }
  } finally {
    await client.close();
  }
}

checkSihf().catch(console.error);