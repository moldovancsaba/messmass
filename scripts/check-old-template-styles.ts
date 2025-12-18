// WHAT: Check old report_templates for styleId
// WHY: Verify if styleId was lost during v12 migration
// HOW: Query old report_templates collection

import clientPromise from '../lib/mongodb';
import config from '../lib/config';

async function checkOldTemplateStyles() {
  try {
    const client = await clientPromise;
    const db = client.db(config.dbName);

    console.log('🔍 Checking old report_templates for styleId...\n');

    const oldTemplates = await db
      .collection('report_templates')
      .find({})
      .toArray();

    if (oldTemplates.length === 0) {
      console.log('❌ No old report_templates found in database');
      process.exit(0);
    }

    console.log(`📊 Found ${oldTemplates.length} old templates:\n`);

    oldTemplates.forEach(template => {
      console.log(`  - ${template.name}`);
      console.log(`    ID: ${template._id}`);
      console.log(`    type: ${template.type}`);
      console.log(`    styleId: ${template.styleId || 'NOT SET'}`);
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkOldTemplateStyles();
