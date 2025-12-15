require('dotenv').config({ path: '.env.local' });
const { MongoClient, ObjectId } = require('mongodb');

async function testTemplateResolution() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'messmass');
    
    const identifier = '903f80ab-e105-4aaa-8c42-2caf71a46954';
    console.log('Testing template resolution for SIHF partner...');
    console.log('Identifier:', identifier);
    
    // Step 1: Find partner by viewSlug
    const partner = await db.collection('partners').findOne({ viewSlug: identifier });
    console.log('\n1. Partner lookup:');
    console.log('   Found:', !!partner);
    if (partner) {
      console.log('   Name:', partner.name);
      console.log('   reportTemplateId:', partner.reportTemplateId);
      console.log('   reportTemplateId type:', typeof partner.reportTemplateId);
    }
    
    // Step 2: Try to find the template
    if (partner?.reportTemplateId) {
      console.log('\n2. Template lookup:');
      
      // Try direct lookup first
      let template = await db.collection('report_templates').findOne({ 
        _id: partner.reportTemplateId 
      });
      console.log('   Direct lookup result:', !!template);
      
      // If that fails, try converting to ObjectId
      if (!template && typeof partner.reportTemplateId === 'string' && ObjectId.isValid(partner.reportTemplateId)) {
        template = await db.collection('report_templates').findOne({ 
          _id: new ObjectId(partner.reportTemplateId) 
        });
        console.log('   ObjectId lookup result:', !!template);
      }
      
      if (template) {
        console.log('   Template name:', template.name);
        console.log('   Template type:', template.type);
        console.log('   Template blocks:', template.dataBlocks?.length || 0);
      } else {
        console.log('   ❌ Template not found!');
      }
    }
    
    // Step 3: Check default template
    console.log('\n3. Default template lookup:');
    const defaultTemplate = await db.collection('report_templates').findOne({ 
      type: 'partner', 
      isDefault: true 
    });
    console.log('   Default partner template found:', !!defaultTemplate);
    if (defaultTemplate) {
      console.log('   Default template name:', defaultTemplate.name);
      console.log('   Default template blocks:', defaultTemplate.dataBlocks?.length || 0);
    }
    
  } finally {
    await client.close();
  }
}

testTemplateResolution().catch(console.error);