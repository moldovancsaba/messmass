import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function checkBitlyCountryData() {
  const client = new MongoClient(process.env.MONGODB_URI || '');
  
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'messmass');
    
    // Get a recent project
    const project = await db.collection('projects').findOne(
      {},
      { sort: { updatedAt: -1 } }
    );
    
    if (!project) {
      console.log('❌ No projects found');
      return;
    }
    
    console.log(`📊 Checking project: ${project.eventName}\n`);
    console.log(`_id: ${project._id}`);
    console.log(`viewSlug: ${project.viewSlug}\n`);
    
    console.log('🌍 Bitly Country Data:\n');
    
    const countryFields = [
      'bitlyCountry1',
      'bitlyCountry1Clicks',
      'bitlyCountry2',
      'bitlyCountry2Clicks',
      'bitlyCountry3',
      'bitlyCountry3Clicks',
      'bitlyCountry4',
      'bitlyCountry4Clicks',
      'bitlyCountry5',
      'bitlyCountry5Clicks',
      'bitlyCountryCount',
      'bitlyTopCountry',
      'bitlyClicksByCountry'
    ];
    
    countryFields.forEach(field => {
      const value = project.stats?.[field];
      if (value !== undefined) {
        console.log(`  ✅ ${field}: ${value}`);
      } else {
        console.log(`  ❌ ${field}: MISSING`);
      }
    });
    
    // Check if project has Bitly links associated
    const linkCount = await db.collection('bitly_link_project_junction').countDocuments({
      projectId: project._id
    });
    
    console.log(`\n🔗 Bitly Links Associated: ${linkCount}`);
    
  } finally {
    await client.close();
  }
}

checkBitlyCountryData();
