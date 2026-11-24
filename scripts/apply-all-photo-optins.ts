// scripts/apply-all-photo-optins.ts
// WHAT: Sets active consent and opt-in on photos and images on the single configured Messmass cluster
//       (and optionally Camera DB when CAMERA_MONGODB_URI is provided).

import { MongoClient } from 'mongodb';
import { optionalCameraUri, requireMessmassUri } from './lib/singleClusterConfig';

async function run() {
  const messmassUri = requireMessmassUri();
  const cameraUri = optionalCameraUri();
  const clientMessmass = new MongoClient(messmassUri);
  await clientMessmass.connect();
  const dbMessmass = clientMessmass.db('messmass');
  const optInTimestamp = new Date().toISOString();

  await dbMessmass.collection('fanmass_event_drive_photos').updateMany(
    {},
    { $set: { optIn: { received: true, basis: 'local_drive_policy' } } }
  );

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
  const resAnalyses = await dbMessmass.collection('fanmass_camera_photo_analyses').updateMany({}, cameraOptInUpdate);
  console.log(`fanmass_camera_photo_analyses matched: ${resAnalyses.matchedCount}, modified: ${resAnalyses.modifiedCount}`);

  const szrtOptInUpdate = {
    $set: {
      optIn: {
        received: true,
        basis: 'user_consent_action',
        recordedAt: optInTimestamp,
      },
    },
  };
  const resSzrt = await dbMessmass.collection('szrt_vision_analysis').updateMany({}, szrtOptInUpdate);
  console.log(`szrt_vision_analysis matched: ${resSzrt.matchedCount}, modified: ${resSzrt.modifiedCount}`);

  if (cameraUri) {
    const clientCam = new MongoClient(cameraUri);
    await clientCam.connect();
    const dbCamera = clientCam.db('camera');
    await dbCamera.collection('submissions').updateMany(
      {},
      {
        $set: {
          consentStatus: 'given',
          marketingConsent: true,
          optIn: { received: true, recordedAt: optInTimestamp, kinds: ['terms', 'privacy', 'marketing'] },
        },
      }
    );
    await dbCamera.collection('images').updateMany(
      {},
      { $set: { optIn: { received: true, recordedAt: optInTimestamp } } }
    );
    await clientCam.close();
  }

  await clientMessmass.close();
  console.log('Done.');
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
