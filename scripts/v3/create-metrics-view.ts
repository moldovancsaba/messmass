import mongoose from 'mongoose';
import connectV3 from '@/lib/mongoose-v3';
import { V3_COLLECTIONS } from '@/lib/constants';

/**
 * Migration Script: Metric Aggregation MongoDB View
 *
 * Creates a materialized view 'v3_metrics_summary' that groups V3MetricValue
 * by 'entityId' and 'metricKey' to provide summed totals.
 */
async function createMetricsSummaryView() {
  console.log('🏁 Starting Metric Aggregation View Creation...');

  await connectV3();
  const db = mongoose.connection.db;

  if (!db) {
    throw new Error('Database connection failed.');
  }

  const viewName = 'v3_metrics_summary';
  const sourceCollection = V3_COLLECTIONS.METRIC_VALUES;

  // Check if view already exists and drop it if necessary to recreate
  const collections = await db.listCollections({ name: viewName }).toArray();
  if (collections.length > 0) {
    console.log(`⚠️ View ${viewName} already exists. Dropping it...`);
    await db.dropCollection(viewName);
  }

  // Create the view
  try {
    await db.createCollection(viewName, {
      viewOn: sourceCollection,
      pipeline: [
        {
          $group: {
            _id: {
              organizationId: '$organizationId',
              entityId: '$entityId',
              metricKey: '$metricKey'
            },
            total: { $sum: '$value' },
            minTimestamp: { $min: '$timestamp' },
            maxTimestamp: { $max: '$timestamp' }
          }
        },
        {
          $project: {
            _id: 0,
            organizationId: '$_id.organizationId',
            entityId: '$_id.entityId',
            metricKey: '$_id.metricKey',
            total: 1,
            minTimestamp: 1,
            maxTimestamp: 1
          }
        }
      ]
    });
    console.log(`✅ View ${viewName} created successfully.`);
  } catch (error: any) {
    console.error(`❌ Failed to create view ${viewName}:`, error.message);
    process.exit(1);
  }

  process.exit(0);
}

createMetricsSummaryView().catch(err => {
  console.error('🔥 Failed to create Metric Aggregation View:', err);
  process.exit(1);
});
