import { MongoClient, ObjectId } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/messmass';
const DB_NAME = 'messmass';
const MASTER_ORG_ID = '69b322e0cb8e841f95de9aa1';

/**
 * WHAT: Migrates numerical statistics from V2 Projects/Partners to V3 MetricValues
 * WHY: Fill the empty V3 time-series engine with historical data
 */
async function migrateStatsToMetrics() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    const db = client.db(DB_NAME);

    // 1. Migrate Project Stats to Metric Values
    const projects = await db.collection('projects').find({ stats: { $exists: true, $ne: {} } }).toArray();
    console.log(`🏗️  Processing stats for ${projects.length} projects...`);

    let migratedCount = 0;
    let definitionCount = 0;

    for (const project of projects) {
      if (!project.stats) continue;

      // Find matching V3 Activity
      const activity = await db.collection('v3_activities').findOne({ "metadata.originalId": project._id.toString() });
      if (!activity) {
        console.warn(`⚠️  No V3 Activity found for Project: ${project.eventName} (${project._id.toString()})`);
        continue;
      }

      const timestamp = project.eventDate ? new Date(project.eventDate) : new Date(project.createdAt);

      for (const [key, value] of Object.entries(project.stats)) {
        // Skip non-numerical keys
        if (key === 'flags' || key === 'hostessImages' || key === 'rejectedImages' || key === 'remoteImages') continue;
        
        const numValue = Number(value);
        if (isNaN(numValue)) continue;

        // Ensure Metric Definition exists
        await db.collection('v3_metric_definitions').updateOne(
          { key: key },
          {
            $set: {
              name: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()), // Auto-label
              key: key,
              type: 'number',
              unit: '',
            },
            $setOnInsert: {
              organizationId: new ObjectId(MASTER_ORG_ID)
            }
          },
          { upsert: true }
        );

        await db.collection('v3_metric_values').insertOne({
          organizationId: new ObjectId(MASTER_ORG_ID),
          metricKey: key,
          entityId: activity.ownerEntityId || null,
          activityId: activity._id,
          value: numValue,
          timestamp: timestamp,
          metadata: {
            source: 'v2-migration',
            originalProjectId: project._id
          },
          createdAt: new Date(),
          updatedAt: new Date()
        });
        migratedCount++;
      }
    }

    console.log(`\n✨ Migration complete. Injected ${migratedCount} V3MetricValue records.`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await client.close();
  }
}

migrateStatsToMetrics();
