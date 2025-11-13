// WHAT: Check AS Roma partner template and its blocks
// WHY: Partner template resolution is working but blocks reference missing charts
// HOW: Query partner → template → blocks and verify chart existence

import { MongoClient, ObjectId } from 'mongodb';

async function checkAsRomaPartnerTemplate() {
  const uri = process.env.MONGODB_URI!;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('messmass');

    // Find AS Roma partner
    const partner = await db.collection('partners').findOne({ 
      name: /AS Roma/i 
    });

    if (!partner) {
      console.log('❌ AS Roma partner not found');
      return;
    }

    console.log('✅ AS Roma partner found:', {
      _id: partner._id,
      name: partner.name,
      reportTemplateId: partner.reportTemplateId
    });

    if (!partner.reportTemplateId) {
      console.log('⚠️  Partner has NO reportTemplateId - should use default');
      return;
    }

    // Find the template
    const template = await db.collection('report_templates').findOne({
      _id: partner.reportTemplateId
    });

    if (!template) {
      console.log('❌ Template not found for ID:', partner.reportTemplateId);
      return;
    }

    console.log('\n✅ Template found:', {
      _id: template._id,
      name: template.name,
      blocks: template.blocks?.length || 0
    });

    if (!template.blocks || template.blocks.length === 0) {
      console.log('⚠️  Template has ZERO blocks - this is the problem!');
      console.log('\n💡 Solution: Remove reportTemplateId from AS Roma partner');
      console.log('   This will make it fall back to default template');
      return;
    }

    // Check each block's chart
    console.log('\n📋 Checking blocks:\n');
    
    for (const block of template.blocks) {
      const chart = await db.collection('chart_configurations').findOne({
        chartId: block.chartId
      });

      if (chart) {
        console.log(`✅ ${block.chartId}: Chart exists`);
      } else {
        console.log(`❌ ${block.chartId}: Chart NOT FOUND`);
      }
    }

    // Count missing charts
    const missingCount = template.blocks.filter(async (block: any) => {
      const chart = await db.collection('chart_configurations').findOne({
        chartId: block.chartId
      });
      return !chart;
    }).length;

    console.log('\n---');
    console.log('Total blocks:', template.blocks.length);
    console.log('Missing charts:', missingCount);

    if (missingCount > 0) {
      console.log('\n🔧 FIX: Remove reportTemplateId from AS Roma partner');
      console.log('Command:');
      console.log(`db.partners.updateOne({ _id: ObjectId("${partner._id}") }, { $unset: { reportTemplateId: "" } })`);
    }

  } finally {
    await client.close();
  }
}

checkAsRomaPartnerTemplate();
