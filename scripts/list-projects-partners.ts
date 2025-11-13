// WHAT: List all projects with partner info
// WHY: Identify which projects have partner connections
// HOW: Query projects collection and show partner status

import { MongoClient } from 'mongodb';

async function listProjectsPartners() {
  const uri = process.env.MONGODB_URI!;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('messmass');

    const projects = await db.collection('projects')
      .find({})
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();

    console.log(`Found ${projects.length} recent projects:\n`);

    for (const project of projects) {
      console.log('---');
      console.log('Event:', project.eventName || 'No name');
      console.log('Edit Slug:', project.editSlug || 'No slug');
      console.log('Has partner1:', !!project.partner1);
      if (project.partner1) {
        const partnerId = typeof project.partner1 === 'object' && '_id' in project.partner1
          ? project.partner1._id
          : project.partner1;
        console.log('Partner ID:', partnerId);
      }
      console.log('Has reportTemplateId:', !!project.reportTemplateId);
    }

    // Show summary
    const withPartner = projects.filter(p => p.partner1).length;
    const withoutPartner = projects.length - withPartner;
    
    console.log('\n---');
    console.log('Summary:');
    console.log('With partner1:', withPartner);
    console.log('Without partner1:', withoutPartner);

  } finally {
    await client.close();
  }
}

listProjectsPartners();
