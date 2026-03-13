import clientPromise from '@/lib/mongodb';
import connectV3 from '@/lib/mongoose-v3';
import config from '@/lib/config';
import V3Entity from '@/lib/models/v3/Entity';
import { V3_COLLECTIONS } from '@/lib/constants';

/**
 * Migration Script: Partner (V2) -> V3Entity (V3)
 * 
 * Preserves legacy IDs to ensure reporting consistency and idempotency.
 */
async function migratePartners() {
  console.log('🏁 Starting Partner migration...');
  
  const client = await clientPromise;
  const legacyDb = client.db(config.dbName);
  const partnersCol = legacyDb.collection('partners');
  
  await connectV3();

  const legacyPartners = await partnersCol.find({}).toArray();
  console.log(`📦 Found ${legacyPartners.length} legacy partners to migrate.`);

  // Default Organization ID for bootstrapped data
  const DEFAULT_ORG_ID = '111111111111111111111111';

  let migrated = 0;
  let skipped = 0;

  for (const p of legacyPartners) {
    // Check if already migrated to avoid duplicates
    const existing = await V3Entity.findById(p._id);
    if (existing) {
      skipped++;
      continue;
    }

    try {
      await V3Entity.create({
        _id: p._id, // Preserve legacy ID
        organizationId: DEFAULT_ORG_ID,
        parentEntityId: null, // Legacy partners are root-level in V3
        name: p.name,
        type: 'partner',
        metadata: {
          legacy_v2: true,
          logoUrl: p.logoUrl,
          hashtags: p.hashtags,
          categorizedHashtags: p.categorizedHashtags,
          footballData: p.footballData,
        }
      });
      migrated++;
    } catch (err: any) {
      console.error(`❌ Failed to migrate partner ${p.name}:`, err.message);
    }
  }

  console.log(`✅ Migration complete. Migrated: ${migrated}, Skipped: ${skipped}`);
  process.exit(0);
}

migratePartners().catch(err => {
  console.error('🔥 Migration exploded:', err);
  process.exit(1);
});
