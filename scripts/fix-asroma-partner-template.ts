// WHAT: Remove broken reportTemplateId from AS Roma partner
// WHY: Template has 0 blocks, causing "Chart not found" errors
// HOW: Unset reportTemplateId field so partner falls back to default template

import { MongoClient, ObjectId } from 'mongodb';

async function fixAsRomaPartnerTemplate() {
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

    console.log('Found partner:', partner.name);
    console.log('Current reportTemplateId:', partner.reportTemplateId);

    // Remove the broken template reference
    const result = await db.collection('partners').updateOne(
      { _id: partner._id },
      { $unset: { reportTemplateId: '' } }
    );

    console.log('\n✅ Removed reportTemplateId from AS Roma partner');
    console.log('Modified count:', result.modifiedCount);
    console.log('\n💡 Partner will now use default template');

  } finally {
    await client.close();
  }
}

fixAsRomaPartnerTemplate();
