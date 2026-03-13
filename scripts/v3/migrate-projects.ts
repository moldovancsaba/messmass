import clientPromise from '@/lib/mongodb';
import connectV3 from '@/lib/mongoose-v3';
import config from '@/lib/config';
import V3Activity from '@/lib/models/v3/Activity';
import V3ActivityParticipant from '@/lib/models/v3/ActivityParticipant';

/**
 * Migration Script: Project (V2) -> V3Activity + V3ActivityParticipant (V3)
 */
async function migrateProjects() {
  console.log('🏁 Starting Project migration...');
  
  const client = await clientPromise;
  const legacyDb = client.db(config.dbName);
  const projectsCol = legacyDb.collection('projects');
  
  await connectV3();

  const legacyProjects = await projectsCol.find({}).toArray();
  console.log(`📦 Found ${legacyProjects.length} legacy projects to migrate.`);

  // Default Organization ID
  const DEFAULT_ORG_ID = '111111111111111111111111';

  let migratedAct = 0;
  let migratedPart = 0;

  for (const p of legacyProjects) {
    // Check if already migrated
    const existing = await V3Activity.findById(p._id);
    if (existing) continue;

    try {
      // 1. Create Activity
      await V3Activity.create({
        _id: p._id,
        organizationId: DEFAULT_ORG_ID,
        ownerEntityId: p.partner1Id, // Assume partner1 is the primary owner
        name: p.eventName,
        type: 'event',
        status: p.isDraft ? 'planned' : 'active',
        startDate: p.eventDate ? new Date(p.eventDate) : null,
        metadata: {
          legacy_v2: true,
          hashtags: p.hashtags,
          categorizedHashtags: p.categorizedHashtags,
          footballDataFixture: p.footballDataFixture,
        }
      });
      migratedAct++;

      // 2. Create Participants (Partner 1 & Partner 2)
      if (p.partner1Id) {
        await V3ActivityParticipant.create({
          organizationId: DEFAULT_ORG_ID,
          activityId: p._id,
          entityId: p.partner1Id,
          role: 'primary_partner'
        });
        migratedPart++;
      }
      if (p.partner2Id) {
        await V3ActivityParticipant.create({
          organizationId: DEFAULT_ORG_ID,
          activityId: p._id,
          entityId: p.partner2Id,
          role: 'visitor'
        });
        migratedPart++;
      }

    } catch (err: any) {
      console.error(`❌ Failed to migrate project ${p.eventName}:`, err.message);
    }
  }

  console.log(`✅ Migration complete. Activities: ${migratedAct}, Participants: ${migratedPart}`);
  process.exit(0);
}

migrateProjects().catch(err => {
  console.error('🔥 Migration exploded:', err);
  process.exit(1);
});
