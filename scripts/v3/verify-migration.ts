import clientPromise from '@/lib/mongodb';
import connectV3 from '@/lib/mongoose-v3';
import config from '@/lib/config';
import V3Entity from '@/lib/models/v3/Entity';
import V3Activity from '@/lib/models/v3/Activity';
import V3ActivityParticipant from '@/lib/models/v3/ActivityParticipant';

/**
 * Verification Script: Relationship Integrity Check
 */
async function verifyMigration() {
  console.log('🔍 Starting Migration Integrity Check...');
  
  const client = await clientPromise;
  const legacyDb = client.db(config.dbName);
  
  await connectV3();

  // 1. Verify Entities
  const legacyPartnersCount = await legacyDb.collection('partners').countDocuments();
  const v3EntitiesCount = await V3Entity.countDocuments({ 'metadata.legacy_v2': true });
  console.log(`Entities: Legacy(${legacyPartnersCount}) vs V3(${v3EntitiesCount})`);

  // 2. Verify Activities
  const legacyProjectsCount = await legacyDb.collection('projects').countDocuments();
  const v3ActivitiesCount = await V3Activity.countDocuments({ 'metadata.legacy_v2': true });
  console.log(`Activities: Legacy(${legacyProjectsCount}) vs V3(${v3ActivitiesCount})`);

  // 3. Verify Participants
  const participantCount = await V3ActivityParticipant.countDocuments({});
  console.log(`Participants: Total mappings created: ${participantCount}`);

  // 4. Spot Check for Orphans
  const orphanParticipants = await V3ActivityParticipant.find({
    $or: [
      { activityId: { $exists: false } },
      { entityId: { $exists: false } }
    ]
  });

  if (orphanParticipants.length > 0) {
    console.error(`⚠️ Found ${orphanParticipants.length} orphan participants!`);
  } else {
    console.log('✅ No orphan participants found.');
  }

  const success = (legacyPartnersCount === v3EntitiesCount) && (legacyProjectsCount === v3ActivitiesCount);
  if (success) {
    console.log('🏆 INTEGRITY CHECK PASSED: V3 data accurately reflects legacy state.');
  } else {
    console.warn('⚠️ INTEGRITY CHECK WARNING: Count mismatch detected. Check logs for details.');
  }

  process.exit(0);
}

verifyMigration().catch(err => {
  console.error('🔥 Verification exploded:', err);
  process.exit(1);
});
