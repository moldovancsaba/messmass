import clientPromise from '@/lib/mongodb';
import connectV3 from '@/lib/mongoose-v3';
import config from '@/lib/config';
import V3MetricValue from '@/lib/models/v3/MetricValue';

/**
 * Migration Script: Project Stats (V2) -> MetricValue (V3)
 */
async function migrateStats() {
  console.log('🏁 Starting Stats migration...');
  
  const client = await clientPromise;
  const legacyDb = client.db(config.dbName);
  const projectsCol = legacyDb.collection('projects');
  
  await connectV3();

  const legacyProjects = await projectsCol.find({ stats: { $exists: true } }).toArray();
  console.log(`📦 Found ${legacyProjects.length} projects with stats to migrate.`);

  // Default Organization ID
  const DEFAULT_ORG_ID = '111111111111111111111111';

  let migrated = 0;

  for (const p of legacyProjects) {
    const stats = p.stats;
    const dataPoints: any[] = [];

    // Map legacy stats keys to V3 metric keys
    for (const [key, value] of Object.entries(stats)) {
      if (typeof value === 'number' && value > 0) {
        dataPoints.push({
          organizationId: DEFAULT_ORG_ID,
          entityId: p.partner1Id, // Attribute stats to the primary owner
          activityId: p._id,
          metricKey: key.toLowerCase(),
          value: value,
          timestamp: p.eventDate ? new Date(p.eventDate) : p.createdAt,
          metadata: { legacy_v2: true }
        });
      }
    }

    if (dataPoints.length > 0) {
      try {
        // Idempotency: skip if stats for this activity already exist
        const exists = await V3MetricValue.findOne({ activityId: p._id });
        if (!exists) {
          await V3MetricValue.insertMany(dataPoints);
          migrated += dataPoints.length;
        }
      } catch (err: any) {
        console.error(`❌ Failed to migrate stats for project ${p.eventName}:`, err.message);
      }
    }
  }

  console.log(`✅ Stats migration complete. Total data points created: ${migrated}`);
  process.exit(0);
}

migrateStats().catch(err => {
  console.error('🔥 Stats Migration exploded:', err);
  process.exit(1);
});
