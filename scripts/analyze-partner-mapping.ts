// WHAT: Analyze which projects should have which partners
// WHY: Projects missing partner1 field - need to identify correct mappings
// HOW: Match event names against partner names

import { MongoClient } from 'mongodb';

async function analyzePartnerMapping() {
  const uri = process.env.MONGODB_URI!;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('messmass');

    // Get all partners
    const partners = await db.collection('partners').find({}).toArray();
    console.log(`Found ${partners.length} partners\n`);

    // Get all projects
    const projects = await db.collection('projects')
      .find({})
      .sort({ createdAt: -1 })
      .limit(30)
      .toArray();

    console.log(`Analyzing ${projects.length} recent projects...\n`);
    console.log('='.repeat(80));

    let needsPartner = 0;
    let hasPartner = 0;
    const suggestions: any[] = [];

    for (const project of projects) {
      const eventName = project.eventName || 'Unknown';
      
      if (project.partner1) {
        hasPartner++;
        continue;
      }

      needsPartner++;

      // Try to find matching partner
      const matchedPartners = partners.filter(partner => {
        const partnerName = partner.name.toLowerCase();
        const eventNameLower = eventName.toLowerCase();
        
        // Check if event name contains partner name
        return eventNameLower.includes(partnerName) || partnerName.includes(eventNameLower);
      });

      if (matchedPartners.length > 0) {
        console.log(`\n📌 ${eventName}`);
        console.log(`   Edit Slug: ${project.editSlug}`);
        console.log(`   Potential partners (${matchedPartners.length}):`);
        
        matchedPartners.forEach(partner => {
          console.log(`   - ${partner.name} (${partner._id})`);
          
          suggestions.push({
            projectId: project._id,
            projectName: eventName,
            partnerId: partner._id,
            partnerName: partner.name
          });
        });
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('\nSummary:');
    console.log(`Projects with partner1: ${hasPartner}`);
    console.log(`Projects without partner1: ${needsPartner}`);
    console.log(`Projects with suggested partners: ${suggestions.length}`);

    if (suggestions.length > 0) {
      console.log('\n💡 To fix partner connections, you need to:');
      console.log('1. Create a script that sets project.partner1 = partnerId');
      console.log('2. Use the suggestions above to map projects to partners');
      console.log('3. Consider creating a UI for managing partner-project relationships');
    }

  } finally {
    await client.close();
  }
}

analyzePartnerMapping();
