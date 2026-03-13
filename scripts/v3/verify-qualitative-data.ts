import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';
import V3Entity from '../../lib/models/v3/Entity';
import V3Activity from '../../lib/models/v3/Activity';
import V3ActivityParticipant from '../../lib/models/v3/ActivityParticipant';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function verify() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('❌ MONGODB_URI is not defined');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const entityCount = await V3Entity.countDocuments({});
    const activityCount = await V3Activity.countDocuments({});
    const participantCount = await V3ActivityParticipant.countDocuments({});

    console.log(`\n📊 V3 Data Overview:`);
    console.log(`- Entities: ${entityCount}`);
    console.log(`- Activities: ${activityCount}`);
    console.log(`- Participants: ${participantCount}`);

    // Check sample Entity metadata
    const sampleEntity = await V3Entity.findOne({ "metadata.logoUrl": { $exists: true, $ne: null } });
    if (sampleEntity) {
      console.log(`\n✅ Sample Entity Metadata (${sampleEntity.name}):`);
      console.log(JSON.stringify(sampleEntity.metadata, null, 2).substring(0, 500) + '...');
    } else {
      console.log(`\n⚠️ No Entities found with logoUrl in metadata!`);
    }

    // Check sample Activity metadata
    const sampleActivity = await V3Activity.findOne({ "metadata.viewSlug": { $exists: true, $ne: null } });
    if (sampleActivity) {
      console.log(`\n✅ Sample Activity Metadata (${sampleActivity.name}):`);
      console.log(JSON.stringify(sampleActivity.metadata, null, 2).substring(0, 500) + '...');
    } else {
      console.log(`\n⚠️ No Activities found with viewSlug in metadata!`);
    }

    // Check participants by activity
    const participantsByActivity = await V3ActivityParticipant.aggregate([
      { $group: { _id: "$activityId", count: { $sum: 1 } } },
      { $limit: 5 }
    ]);
    console.log(`\n👥 Sample Activity Participant counts:`);
    console.log(participantsByActivity);

    process.exit(0);
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
}

verify();
