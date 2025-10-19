/**
 * Background Analytics Aggregation Job
 * 
 * WHAT: Processes updated projects and generates pre-computed analytics aggregates
 * WHY: Enable <500ms query response by pre-computing all metrics instead of calculating on-demand
 * 
 * Schedule: Run every 5 minutes via cron or manual execution
 * Performance Target: Process 100+ projects within 5-minute window
 * 
 * Usage:
 *   node scripts/aggregateAnalytics.js                    # One-time run
 *   (cron) star-slash-5 * * * * node scripts/...         # Cron: every 5 minutes
 * 
 * Version: 6.25.0 (Phase 1 - Data Aggregation Infrastructure)
 * Created: 2025-10-19T11:12:27.000Z
 */

// WHAT: Load environment variables before importing config
// WHY: config.ts requires MONGODB_URI at module load time
import * as dotenv from 'dotenv';
import { MongoClient, ObjectId } from 'mongodb';

// Load .env.local explicitly
dotenv.config({ path: '.env.local' });

import config from '../lib/config.js';
import {
  aggregateEventMetrics,
  isProjectAggregatable,
} from '../lib/analyticsCalculator.js';
import type { AggregationLog } from '../lib/analytics.types.js';

// WHAT: Track last run time for incremental aggregation
// WHY: Only process projects updated since last run to minimize load
const LAST_RUN_KEY = 'analytics_aggregation_last_run';

// WHAT: Maximum projects to process in one run
// WHY: Prevent job from running too long and timing out
const MAX_PROJECTS_PER_RUN = 200;

// WHAT: Batch size for bulk upsert operations
// WHY: Balance between memory usage and database round-trips
const BATCH_SIZE = 50;

/**
 * WHAT: Get last successful run time from database
 * WHY: Implement incremental aggregation - only process updated projects
 */
async function getLastRunTime(db: any): Promise<Date> {
  const settingsCollection = db.collection('system_settings');
  const setting = await settingsCollection.findOne({ key: LAST_RUN_KEY });
  
  if (setting && setting.value) {
    return new Date(setting.value);
  }
  
  // If no last run, start from 7 days ago (initial backfill window)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  return sevenDaysAgo;
}

/**
 * WHAT: Update last successful run time in database
 * WHY: Track progress for next incremental run
 */
async function updateLastRunTime(db: any, timestamp: Date): Promise<void> {
  const settingsCollection = db.collection('system_settings');
  await settingsCollection.updateOne(
    { key: LAST_RUN_KEY },
    {
      $set: {
        key: LAST_RUN_KEY,
        value: timestamp.toISOString(),
        updatedAt: new Date().toISOString(),
      },
    },
    { upsert: true }
  );
}

/**
 * WHAT: Fetch projects updated since last run
 * WHY: Incremental processing - only aggregate changed data
 */
async function getUpdatedProjects(
  db: any,
  lastRunTime: Date,
  limit: number
): Promise<any[]> {
  const projectsCollection = db.collection('projects');
  
  // Fetch projects updated since last run, ordered by updatedAt
  const projects = await projectsCollection
    .find({
      updatedAt: { $gte: lastRunTime.toISOString() },
    })
    .sort({ updatedAt: 1 }) // Process oldest updates first
    .limit(limit)
    .toArray();
  
  return projects;
}

/**
 * WHAT: Upsert aggregated metrics to analytics_aggregates collection
 * WHY: Replace old aggregates with new calculations when projects are updated
 */
async function upsertAggregates(
  db: any,
  aggregates: any[]
): Promise<{ upserted: number; modified: number; errors: number }> {
  if (aggregates.length === 0) {
    return { upserted: 0, modified: 0, errors: 0 };
  }
  
  const collection = db.collection('analytics_aggregates');
  let upserted = 0;
  let modified = 0;
  let errors = 0;
  
  // Process in batches for better performance
  for (let i = 0; i < aggregates.length; i += BATCH_SIZE) {
    const batch = aggregates.slice(i, i + BATCH_SIZE);
    
    try {
      // Use bulkWrite for efficient upserts
      const operations = batch.map((aggregate) => ({
        replaceOne: {
          filter: { projectId: aggregate.projectId },
          replacement: aggregate,
          upsert: true,
        },
      }));
      
      const result = await collection.bulkWrite(operations, { ordered: false });
      upserted += result.upsertedCount;
      modified += result.modifiedCount;
    } catch (error) {
      console.error(`❌ Batch upsert error:`, error);
      errors += batch.length;
    }
  }
  
  return { upserted, modified, errors };
}

/**
 * WHAT: Create aggregation log entry
 * WHY: Track job performance, errors, and processing times for monitoring
 */
async function createAggregationLog(
  db: any,
  log: Omit<AggregationLog, '_id' | 'createdAt'>
): Promise<void> {
  const logsCollection = db.collection('aggregation_logs');
  await logsCollection.insertOne({
    _id: new ObjectId(),
    ...log,
    createdAt: new Date().toISOString(),
  });
}

/**
 * WHAT: Main aggregation function
 * WHY: Orchestrate the entire aggregation process
 */
async function runAggregation() {
  const startTime = new Date();
  const client = new MongoClient(config.mongodbUri);
  
  console.log('🚀 Starting analytics aggregation job...');
  console.log(`⏰ Start time: ${startTime.toISOString()}`);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(config.dbName);
    
    // Get last run time for incremental processing
    const lastRunTime = await getLastRunTime(db);
    console.log(`📅 Processing projects updated since: ${lastRunTime.toISOString()}`);
    
    // Fetch updated projects
    const projects = await getUpdatedProjects(db, lastRunTime, MAX_PROJECTS_PER_RUN);
    console.log(`📊 Found ${projects.length} updated projects`);
    
    if (projects.length === 0) {
      console.log('✨ No projects to process. Job complete.');
      await updateLastRunTime(db, startTime);
      return;
    }
    
    // Track processing metrics
    const processingTimes: number[] = [];
    const aggregates: any[] = [];
    const errors: Array<{ projectId: ObjectId; errorMessage: string }> = [];
    let projectsProcessed = 0;
    let projectsFailed = 0;
    
    // Process each project
    for (const project of projects) {
      const projectStartTime = Date.now();
      
      try {
        // Validate project has minimum required data
        if (!isProjectAggregatable(project)) {
          console.log(`⚠️  Skipping project ${project._id}: Incomplete data`);
          projectsFailed++;
          errors.push({
            projectId: project._id,
            errorMessage: 'Incomplete project data (missing eventAttendees or stats)',
          });
          continue;
        }
        
        // Calculate aggregated metrics
        const aggregate = aggregateEventMetrics(project, 'event');
        aggregates.push(aggregate);
        
        projectsProcessed++;
        const processingTime = Date.now() - projectStartTime;
        processingTimes.push(processingTime);
        
        // Log progress every 50 projects
        if (projectsProcessed % 50 === 0) {
          const avgTime = processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length;
          console.log(`  ✓ Processed ${projectsProcessed}/${projects.length} projects (avg ${avgTime.toFixed(2)}ms/project)`);
        }
        
      } catch (error) {
        console.error(`❌ Error processing project ${project._id}:`, error);
        projectsFailed++;
        errors.push({
          projectId: project._id,
          errorMessage: error instanceof Error ? error.message : String(error),
        });
      }
    }
    
    // Upsert aggregates to database
    console.log(`\n💾 Upserting ${aggregates.length} aggregates to database...`);
    const upsertResult = await upsertAggregates(db, aggregates);
    console.log(`  ✓ Upserted: ${upsertResult.upserted}`);
    console.log(`  ✓ Modified: ${upsertResult.modified}`);
    if (upsertResult.errors > 0) {
      console.log(`  ⚠️  Errors: ${upsertResult.errors}`);
    }
    
    // Calculate performance metrics
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    const avgProcessingTime = processingTimes.length > 0
      ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length
      : 0;
    const maxProcessingTime = processingTimes.length > 0
      ? Math.max(...processingTimes)
      : 0;
    
    // Determine job status
    let status: 'success' | 'partial_failure' | 'failed' = 'success';
    if (projectsFailed > 0 && projectsProcessed === 0) {
      status = 'failed';
    } else if (projectsFailed > 0) {
      status = 'partial_failure';
    }
    
    // Create aggregation log
    await createAggregationLog(db, {
      jobType: 'event',
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration,
      status,
      projectsProcessed,
      projectsFailed,
      errors: errors.length > 0 ? errors.slice(0, 20) : undefined, // Store up to 20 errors
      performanceMetrics: {
        avgProcessingTime,
        maxProcessingTime,
        totalQueries: projectsProcessed + projectsFailed, // Simplified metric
      },
    });
    
    // Update last run time if successful
    if (status !== 'failed') {
      await updateLastRunTime(db, startTime);
    }
    
    // Print summary
    console.log('\n📊 Aggregation Summary:');
    console.log(`  • Duration: ${(duration / 1000).toFixed(2)}s`);
    console.log(`  • Projects processed: ${projectsProcessed}`);
    console.log(`  • Projects failed: ${projectsFailed}`);
    console.log(`  • Avg processing time: ${avgProcessingTime.toFixed(2)}ms/project`);
    console.log(`  • Max processing time: ${maxProcessingTime.toFixed(2)}ms`);
    console.log(`  • Aggregates upserted: ${upsertResult.upserted}`);
    console.log(`  • Aggregates modified: ${upsertResult.modified}`);
    console.log(`  • Status: ${status === 'success' ? '✅' : status === 'partial_failure' ? '⚠️' : '❌'} ${status.toUpperCase()}`);
    
    // Check if job completed within 5-minute window
    if (duration > 300000) { // 5 minutes in milliseconds
      console.log('\n⚠️  WARNING: Job took longer than 5-minute window!');
      console.log('   Consider reducing MAX_PROJECTS_PER_RUN or optimizing calculations.');
    }
    
    console.log('\n✨ Aggregation job complete!');
    
  } catch (error) {
    console.error('\n❌ Fatal error during aggregation:', error);
    
    // Try to log the error
    try {
      const db = client.db(config.dbName);
      await createAggregationLog(db, {
        jobType: 'event',
        startTime: startTime.toISOString(),
        endTime: new Date().toISOString(),
        duration: Date.now() - startTime.getTime(),
        status: 'failed',
        projectsProcessed: 0,
        projectsFailed: 0,
        errors: [{
          projectId: new ObjectId(),
          errorMessage: error instanceof Error ? error.message : String(error),
        }],
        performanceMetrics: {
          avgProcessingTime: 0,
          maxProcessingTime: 0,
          totalQueries: 0,
        },
      });
    } catch (logError) {
      console.error('❌ Failed to log error:', logError);
    }
    
    throw error;
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB\n');
  }
}

// Run the aggregation job
runAggregation()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Unhandled error:', error);
    process.exit(1);
  });
