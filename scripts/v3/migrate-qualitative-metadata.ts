import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables MUST happen before other imports that use config
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import mongoose from 'mongoose';

async function backfillQualitativeMetadata() {
  // Use dynamic import so that config is not accessed until env is loaded
  const { syncPartnerToV3Entity, syncProjectToV3Activity } = await import('../../lib/v3/syncEngine');
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('❌ MONGODB_URI is not defined in .env.local');
    process.exit(1);
  }

  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected.');

    const partnersCollection = mongoose.connection.collection('partners');
    const projectsCollection = mongoose.connection.collection('projects');

    // 1. Migrate Partners -> Entities
    const partners = await partnersCollection.find({}).toArray();
    console.log(`📦 Found ${partners.length} V2 Partners to backfill.`);
    
    let partnerCount = 0;
    for (const partner of partners) {
      await syncPartnerToV3Entity(partner);
      partnerCount++;
      if (partnerCount % 10 === 0) console.log(`   - Processed ${partnerCount}/${partners.length} Partners`);
    }

    // 2. Migrate Projects -> Activities + Participants
    const projects = await projectsCollection.find({}).toArray();
    console.log(`🚀 Found ${projects.length} V2 Projects to backfill.`);

    let projectCount = 0;
    for (const project of projects) {
      await syncProjectToV3Activity(project);
      projectCount++;
      if (projectCount % 20 === 0) console.log(`   - Processed ${projectCount}/${projects.length} Projects`);
    }

    console.log(`\n✨ Qualitative backfill complete!`);
    console.log(`✅ Partners/Entities: ${partnerCount}`);
    console.log(`✅ Projects/Activities/Participants: ${projectCount}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Backfill failed:', error);
    process.exit(1);
  }
}

backfillQualitativeMetadata();
