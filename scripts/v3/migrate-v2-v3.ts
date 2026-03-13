import mongoose from 'mongoose';
import Organization from '../../lib/models/v3/Organization';
import Entity from '../../lib/models/v3/Entity';
import Activity from '../../lib/models/v3/Activity';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function migrate() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('❌ MONGODB_URI is not defined in .env.local');
    process.exit(1);
  }

  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected.');

    // 1. Resolve Master Organization
    const masterOrg = await Organization.findOne({ slug: 'master' });
    if (!masterOrg) {
      console.error('❌ Master Organization not found. Run bootstrap-org.ts first.');
      process.exit(1);
    }
    const orgId = masterOrg._id;

    // 2. Fetch V2 Partners
    // We use raw collection access to avoid model conflicts if V2 models are not fully compatible
    const partnersCollection = mongoose.connection.collection('partners');
    const partners = await partnersCollection.find({}).toArray();
    console.log(`Found ${partners.length} V2 Partners to migrate.`);

    let migratedCount = 0;

    for (const partner of partners) {
      // 3. Create V3 Entity
      const entitySlug = partner.slug || partner.name.toLowerCase().replace(/\s+/g, '-');
      
      const existingEntity = await Entity.findOne({ slug: entitySlug, organizationId: orgId });
      if (existingEntity) {
        console.log(`ℹ️ Entity "${entitySlug}" already exists, skipping.`);
        continue;
      }

      const entity = await Entity.create({
        organizationId: orgId,
        name: partner.name,
        slug: entitySlug,
        type: 'team', // lowercase as per schema
        metadata: {
          v2PartnerId: partner._id,
          migratedAt: new Date().toISOString(),
          originalData: partner
        }
      });

      // 4. Create V3 Activity (Default CORE activity)
      await Activity.create({
        organizationId: orgId,
        ownerEntityId: entity._id,
        name: `${partner.name} Core Operations`,
        type: 'project', // MUST be one of ['event', 'match', 'campaign', 'project']
        status: 'active',
        metadata: {
          description: `Master activity for ${partner.name} migrated from V2`
        }
      });

      migratedCount++;
    }

    console.log(`✅ Migration Complete! Migrated ${migratedCount} partners.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
