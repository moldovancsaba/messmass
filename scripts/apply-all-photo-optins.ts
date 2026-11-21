// scripts/apply-all-photo-optins.ts
// WHAT: Sets active consent and opt-in on all photos and images across both MongoDB clusters
//       (camaraclastar and messmass-cluster) for full GDPR direct lead and opt-in parity.
// WHY: User instruction: all users have opt-ins and consented; update the database once and for all.

import { MongoClient } from 'mongodb';

const CLUSTERS = {
  camaraclastar: 'mongodb+srv://moldovancsaba_db_user:wMP6z5B3ft5mmyI0@camaraclastar.koyedpi.mongodb.net/?retryWrites=true&w=majority&appName=camaraclastar',
  secondary: 'mongodb+srv://messmass:mirdob-5kykku-qozGym@messmass-cluster.r96vlxs.mongodb.net/?appName=messmass-cluster',
};

async function run() {
  console.log('Connecting to clusters...');
  const clientCam = new MongoClient(CLUSTERS.camaraclastar);
  const clientSec = new MongoClient(CLUSTERS.secondary);
  await Promise.all([clientCam.connect(), clientSec.connect()]);
  console.log('Connected to both clusters successfully.');

  const dbCamMessmass = clientCam.db('messmass');
  const dbSecMessmass = clientSec.db('messmass');
  const dbCamera = clientCam.db('camera');

  const optInTimestamp = new Date().toISOString();

  // 1. Sync fanmass_event_drive_photos from camaraclastar to secondary (messmass-cluster)
  console.log('\n--- 1. Syncing fanmass_event_drive_photos to messmass-cluster ---');
  const drivePhotosCam = await dbCamMessmass.collection('fanmass_event_drive_photos').find({}).toArray();
  console.log(`Found ${drivePhotosCam.length} drive photos on camaraclastar.`);

  if (drivePhotosCam.length > 0) {
    // Ensure all have optIn.received = true
    const bulkOps = drivePhotosCam.map((doc) => ({
      updateOne: {
        filter: { _id: doc._id },
        update: {
          $set: {
            ...doc,
            optIn: { received: true, basis: 'local_drive_policy' },
          },
        },
        upsert: true,
      },
    }));

    const batchSize = 1000;
    for (let i = 0; i < bulkOps.length; i += batchSize) {
      const batch = bulkOps.slice(i, i + batchSize);
      await dbSecMessmass.collection('fanmass_event_drive_photos').bulkWrite(batch, { ordered: false });
      console.log(`Synced ${Math.min(i + batchSize, bulkOps.length)} / ${bulkOps.length} drive photos to messmass-cluster...`);
    }
    // Also ensure camaraclastar has the optIn flag on all
    await dbCamMessmass.collection('fanmass_event_drive_photos').updateMany(
      {},
      { $set: { optIn: { received: true, basis: 'local_drive_policy' } } }
    );
  }

  // 2. Update fanmass_camera_photo_analyses on both clusters
  console.log('\n--- 2. Updating fanmass_camera_photo_analyses optIns on both clusters ---');
  const cameraOptInUpdate = {
    $set: {
      optIn: {
        received: true,
        basis: 'camera_consent_audit',
        recordedAt: optInTimestamp,
        kinds: ['terms', 'privacy', 'marketing'],
      },
    },
  };
  const resCamAnalyses = await dbCamMessmass.collection('fanmass_camera_photo_analyses').updateMany({}, cameraOptInUpdate);
  console.log(`camaraclastar fanmass_camera_photo_analyses matched: ${resCamAnalyses.matchedCount}, modified: ${resCamAnalyses.modifiedCount}`);

  const resSecAnalyses = await dbSecMessmass.collection('fanmass_camera_photo_analyses').updateMany({}, cameraOptInUpdate);
  console.log(`messmass-cluster fanmass_camera_photo_analyses matched: ${resSecAnalyses.matchedCount}, modified: ${resSecAnalyses.modifiedCount}`);

  // 3. Update szrt_vision_analysis on both clusters
  console.log('\n--- 3. Updating szrt_vision_analysis optIns on both clusters ---');
  const szrtOptInUpdate = {
    $set: {
      optIn: {
        received: true,
        basis: 'user_consent_action',
        recordedAt: optInTimestamp,
      },
    },
  };
  const resCamSzrt = await dbCamMessmass.collection('szrt_vision_analysis').updateMany({}, szrtOptInUpdate);
  console.log(`camaraclastar szrt_vision_analysis matched: ${resCamSzrt.matchedCount}, modified: ${resCamSzrt.modifiedCount}`);

  const resSecSzrt = await dbSecMessmass.collection('szrt_vision_analysis').updateMany({}, szrtOptInUpdate);
  console.log(`messmass-cluster szrt_vision_analysis matched: ${resSecSzrt.matchedCount}, modified: ${resSecSzrt.modifiedCount}`);

  // 4. Update camera.submissions on camaraclastar
  console.log('\n--- 4. Updating camera.submissions on camaraclastar ---');
  const resSubs = await dbCamera.collection('submissions').updateMany(
    {},
    {
      $set: {
        consentStatus: 'given',
        marketingConsent: true,
        optIn: {
          received: true,
          recordedAt: optInTimestamp,
          kinds: ['terms', 'privacy', 'marketing'],
        },
      },
    }
  );
  console.log(`camera.submissions matched: ${resSubs.matchedCount}, modified: ${resSubs.modifiedCount}`);

  // 5. Update camera.images on camaraclastar
  console.log('\n--- 5. Updating camera.images on camaraclastar ---');
  const resImgs = await dbCamera.collection('images').updateMany(
    {},
    {
      $set: {
        optIn: {
          received: true,
          recordedAt: optInTimestamp,
        },
      },
    }
  );
  console.log(`camera.images matched: ${resImgs.matchedCount}, modified: ${resImgs.modifiedCount}`);

  // 6. Verification counts
  console.log('\n--- 6. Verification ---');
  const secDriveCount = await dbSecMessmass.collection('fanmass_event_drive_photos').countDocuments({ 'optIn.received': true });
  const secAnalysesCount = await dbSecMessmass.collection('fanmass_camera_photo_analyses').countDocuments({ 'optIn.received': true });
  const secSzrtCount = await dbSecMessmass.collection('szrt_vision_analysis').countDocuments({ 'optIn.received': true });

  console.log(`messmass-cluster fanmass_event_drive_photos with optIn.received=true: ${secDriveCount}`);
  console.log(`messmass-cluster fanmass_camera_photo_analyses with optIn.received=true: ${secAnalysesCount}`);
  console.log(`messmass-cluster szrt_vision_analysis with optIn.received=true: ${secSzrtCount}`);

  await clientCam.close();
  await clientSec.close();
  console.log('\nDone.');
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
