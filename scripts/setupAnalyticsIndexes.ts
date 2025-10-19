/**
 * MongoDB Analytics Indexes Setup Script
 * 
 * WHAT: Creates indexes on analytics collections for optimal query performance
 * WHY: Ensure <500ms query response for 1-year datasets by indexing frequently queried fields
 * 
 * Collections with indexes:
 * - analytics_aggregates: projectId, eventDate, aggregationType, (partnerId + eventDate)
 * - partner_analytics: partnerId, partnerType, (partnerId + timeframe)
 * - event_comparisons: primaryProjectId, comparisonType
 * - aggregation_logs: startTime, status
 * 
 * Usage:
 *   npx ts-node scripts/setupAnalyticsIndexes.ts
 * 
 * Version: 6.25.0 (Phase 1 - Data Aggregation Infrastructure)
 * Created: 2025-10-19T11:12:27.000Z
 */

// WHAT: Load environment variables before importing config  
// WHY: config.ts requires MONGODB_URI at module load time
import * as dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

// Load .env.local explicitly
dotenv.config({ path: '.env.local' });

import config from '../lib/config.js';

async function setupAnalyticsIndexes() {
  const client = new MongoClient(config.mongodbUri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(config.dbName);
    
    // 1. analytics_aggregates collection indexes
    console.log('\n📊 Creating indexes for analytics_aggregates collection...');
    const aggregatesCollection = db.collection('analytics_aggregates');
    
    await aggregatesCollection.createIndex({ projectId: 1 }, {
      name: 'idx_projectId',
      background: true,
    });
    console.log('  ✓ Index created: projectId');
    
    await aggregatesCollection.createIndex({ eventDate: -1 }, {
      name: 'idx_eventDate',
      background: true,
    });
    console.log('  ✓ Index created: eventDate (descending for time-series queries)');
    
    await aggregatesCollection.createIndex({ aggregationType: 1 }, {
      name: 'idx_aggregationType',
      background: true,
    });
    console.log('  ✓ Index created: aggregationType');
    
    await aggregatesCollection.createIndex(
      { 'partnerContext.partnerId': 1, eventDate: -1 },
      {
        name: 'idx_partnerId_eventDate',
        background: true,
        sparse: true, // Only index documents with partnerId
      }
    );
    console.log('  ✓ Compound index created: partnerContext.partnerId + eventDate');
    
    await aggregatesCollection.createIndex({ updatedAt: -1 }, {
      name: 'idx_updatedAt',
      background: true,
    });
    console.log('  ✓ Index created: updatedAt (for incremental aggregation)');
    
    // 2. partner_analytics collection indexes
    console.log('\n👥 Creating indexes for partner_analytics collection...');
    const partnerAnalyticsCollection = db.collection('partner_analytics');
    
    await partnerAnalyticsCollection.createIndex({ partnerId: 1 }, {
      name: 'idx_partnerId',
      background: true,
    });
    console.log('  ✓ Index created: partnerId');
    
    await partnerAnalyticsCollection.createIndex({ partnerType: 1 }, {
      name: 'idx_partnerType',
      background: true,
    });
    console.log('  ✓ Index created: partnerType');
    
    await partnerAnalyticsCollection.createIndex(
      { partnerId: 1, timeframe: 1 },
      {
        name: 'idx_partnerId_timeframe',
        background: true,
        unique: true, // One document per partner per timeframe
      }
    );
    console.log('  ✓ Compound unique index created: partnerId + timeframe');
    
    await partnerAnalyticsCollection.createIndex({ updatedAt: -1 }, {
      name: 'idx_updatedAt',
      background: true,
    });
    console.log('  ✓ Index created: updatedAt');
    
    // 3. event_comparisons collection indexes
    console.log('\n🔄 Creating indexes for event_comparisons collection...');
    const comparisonsCollection = db.collection('event_comparisons');
    
    await comparisonsCollection.createIndex({ primaryProjectId: 1 }, {
      name: 'idx_primaryProjectId',
      background: true,
    });
    console.log('  ✓ Index created: primaryProjectId');
    
    await comparisonsCollection.createIndex({ comparisonType: 1 }, {
      name: 'idx_comparisonType',
      background: true,
    });
    console.log('  ✓ Index created: comparisonType');
    
    await comparisonsCollection.createIndex(
      { primaryProjectId: 1, comparisonType: 1 },
      {
        name: 'idx_primaryProjectId_comparisonType',
        background: true,
      }
    );
    console.log('  ✓ Compound index created: primaryProjectId + comparisonType');
    
    // 4. aggregation_logs collection indexes
    console.log('\n📝 Creating indexes for aggregation_logs collection...');
    const logsCollection = db.collection('aggregation_logs');
    
    await logsCollection.createIndex({ startTime: -1 }, {
      name: 'idx_startTime',
      background: true,
    });
    console.log('  ✓ Index created: startTime (descending for recent logs)');
    
    await logsCollection.createIndex({ status: 1 }, {
      name: 'idx_status',
      background: true,
    });
    console.log('  ✓ Index created: status');
    
    await logsCollection.createIndex({ jobType: 1, startTime: -1 }, {
      name: 'idx_jobType_startTime',
      background: true,
    });
    console.log('  ✓ Compound index created: jobType + startTime');
    
    // Optional: Create TTL index for automatic log cleanup (30 days retention)
    await logsCollection.createIndex({ createdAt: 1 }, {
      name: 'idx_createdAt_ttl',
      background: true,
      expireAfterSeconds: 60 * 60 * 24 * 30, // 30 days
    });
    console.log('  ✓ TTL index created: createdAt (30-day retention)');
    
    // List all indexes for verification
    console.log('\n📋 Verifying created indexes...');
    
    const aggregatesIndexes = await aggregatesCollection.indexes();
    console.log(`\n  analytics_aggregates: ${aggregatesIndexes.length} indexes`);
    aggregatesIndexes.forEach(idx => {
      console.log(`    - ${idx.name}`);
    });
    
    const partnerIndexes = await partnerAnalyticsCollection.indexes();
    console.log(`\n  partner_analytics: ${partnerIndexes.length} indexes`);
    partnerIndexes.forEach(idx => {
      console.log(`    - ${idx.name}`);
    });
    
    const comparisonsIndexes = await comparisonsCollection.indexes();
    console.log(`\n  event_comparisons: ${comparisonsIndexes.length} indexes`);
    comparisonsIndexes.forEach(idx => {
      console.log(`    - ${idx.name}`);
    });
    
    const logsIndexes = await logsCollection.indexes();
    console.log(`\n  aggregation_logs: ${logsIndexes.length} indexes`);
    logsIndexes.forEach(idx => {
      console.log(`    - ${idx.name}`);
    });
    
    console.log('\n✅ All analytics indexes created successfully!');
    console.log('\n📊 Performance expectations:');
    console.log('  • Single event query: <100ms');
    console.log('  • Time-series query (1 year): <500ms');
    console.log('  • Partner analytics query: <200ms');
    console.log('  • Comparison query: <300ms');
    
  } catch (error) {
    console.error('❌ Error setting up indexes:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the setup
setupAnalyticsIndexes()
  .then(() => {
    console.log('\n✨ Index setup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
