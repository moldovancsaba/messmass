// WHAT: Check if AS Roma project has partner1 field
// WHY: Diagnose event-partner connection issue
// HOW: Query project and partner collections

import { MongoClient, ObjectId } from 'mongodb';

async function checkPartnerConnection() {
  const uri = process.env.MONGODB_URI!;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('messmass');

    // Find AS Roma project
    const project = await db.collection('projects').findOne({ 
      editSlug: 'as-roma-x-udinese-36-2' 
    });

    if (!project) {
      console.log('❌ Project not found');
      return;
    }

    console.log('✅ Project found:', {
      eventName: project.eventName,
      editSlug: project.editSlug,
      hasPartner1: !!project.partner1,
      partner1Type: typeof project.partner1,
      partner1Value: project.partner1,
      reportTemplateId: project.reportTemplateId
    });

    // If partner1 exists, check the partner
    if (project.partner1) {
      const partnerId = typeof project.partner1 === 'object' && '_id' in project.partner1
        ? project.partner1._id
        : project.partner1;

      const partner = await db.collection('partners').findOne({ _id: partnerId });

      if (partner) {
        console.log('\n✅ Partner found:', {
          name: partner.name,
          _id: partner._id,
          reportTemplateId: partner.reportTemplateId
        });
      } else {
        console.log('\n❌ Partner not found for ID:', partnerId);
      }
    } else {
      console.log('\n⚠️ Project has NO partner1 field - this is the issue!');
      
      // Check if there's an AS Roma partner
      const asRomaPartner = await db.collection('partners').findOne({ 
        name: /AS Roma/i 
      });

      if (asRomaPartner) {
        console.log('\n💡 Found AS Roma partner:', {
          _id: asRomaPartner._id,
          name: asRomaPartner.name,
          reportTemplateId: asRomaPartner.reportTemplateId
        });
        console.log('\n🔧 This project should have partner1 = ObjectId("' + asRomaPartner._id + '")');
      }
    }

  } finally {
    await client.close();
  }
}

checkPartnerConnection();
