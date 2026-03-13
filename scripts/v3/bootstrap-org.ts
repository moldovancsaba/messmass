import mongoose from 'mongoose';
import Organization from '../../lib/models/v3/Organization';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function bootstrap() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('❌ MONGODB_URI is not defined in .env.local');
    process.exit(1);
  }

  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected.');

    const slug = 'master';
    const existingOrg = await Organization.findOne({ slug });

    if (existingOrg) {
      console.log(`ℹ️ Root Organization "${slug}" already exists (ID: ${existingOrg._id})`);
      process.exit(0);
    }

    console.log('🚀 Creating Master Organization...');
    const masterOrg = await Organization.create({
      name: 'Messmass Master Org',
      slug: slug,
      status: 'active',
      metadata: {
        description: 'Root tenant for Messmass V3 migration',
        bootstrappedAt: new Date().toISOString()
      }
    });

    console.log(`✅ Master Organization Created!`);
    console.log(`🆔 OrganizationID: ${masterOrg._id}`);
    
    // Write out ID to a temp file for the migration script to pick up if needed
    // or just rely on the slug lookup.
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Bootstrap failed:', error);
    process.exit(1);
  }
}

bootstrap();
