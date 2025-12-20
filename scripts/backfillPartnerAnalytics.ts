/**
 * Partner Analytics Backfill Script
 * 
 * WHAT: One-time script to populate partner_analytics collection for all existing partners
 * WHY: Historical data aggregation - enables analytics dashboard for all partners immediately
 * 
 * Usage:
 *   npm run analytics:backfill-partners
 * 
 * Version: 11.39.0
 * Created: 2025-12-20T20:00:00.000Z (UTC)
 */

// WHAT: Load environment variables before importing config
// WHY: config.ts requires MONGODB_URI at module load time
import * as dotenv from 'dotenv';
import { MongoClient, ObjectId } from 'mongodb';

// Load .env.local explicitly
dotenv.config({ path: '.env.local' });

import config from '../lib/config.js';
import { aggregatePartnerAnalytics } from '../lib/analytics-aggregator.js';

/**
 * WHAT: Main backfill function
 * WHY: Populate partner_analytics collection for all partners
 */
async function runBackfill() {
  const startTime = new Date();
  const client = new MongoClient(config.mongodbUri);
  
  console.log('🚀 Starting partner analytics backfill...');
  console.log(`⏰ Start time: ${startTime.toISOString()}`);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db(config.dbName);
    const partnersCollection = db.collection('partners');
    
    // Fetch all partners
    const partners = await partnersCollection.find({}).toArray();
    console.log(`📊 Found ${partners.length} partners to process\n`);
    
    if (partners.length === 0) {
      console.log('✨ No partners found. Backfill complete.');
      return;
    }
    
    // Track results
    let partnersProcessed = 0;
    let partnersFailed = 0;
    let totalEventsProcessed = 0;
    const processingTimes: number[] = [];
    const errors: Array<{ partnerId: string; partnerName: string; errorMessage: string }> = [];
    
    // Process each partner
    for (let i = 0; i < partners.length; i++) {
      const partner = partners[i];
      const partnerId = partner._id.toString();
      const partnerName = partner.name;
      const partnerStartTime = Date.now();
      
      try {
        console.log(`[${i + 1}/${partners.length}] Processing partner: ${partnerName} (${partnerId})`);
        
        // Aggregate partner analytics
        const result = await aggregatePartnerAnalytics(partnerId);
        const processingTime = Date.now() - partnerStartTime;
        processingTimes.push(processingTime);
        
        if (result.success) {
          partnersProcessed++;
          totalEventsProcessed += result.recordsProcessed;
          console.log(`  ✓ Success: ${result.recordsProcessed} events processed in ${processingTime}ms`);
          
          if (result.recordsCreated > 0) {
            console.log(`    • Created new partner analytics record`);
          }
          if (result.recordsUpdated > 0) {
            console.log(`    • Updated existing partner analytics record`);
          }
        } else {
          partnersFailed++;
          const errorMessage = result.errors.join(', ');
          errors.push({ partnerId, partnerName, errorMessage });
          console.error(`  ❌ Failed: ${errorMessage}`);
        }
        
      } catch (error) {
        partnersFailed++;
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push({ partnerId, partnerName, errorMessage });
        console.error(`  ❌ Error: ${errorMessage}`);
      }
      
      console.log(''); // Blank line for readability
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
    
    // Print summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 BACKFILL SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  • Duration: ${(duration / 1000).toFixed(2)}s`);
    console.log(`  • Total partners: ${partners.length}`);
    console.log(`  • Partners processed: ${partnersProcessed}`);
    console.log(`  • Partners failed: ${partnersFailed}`);
    console.log(`  • Total events processed: ${totalEventsProcessed}`);
    console.log(`  • Avg processing time: ${avgProcessingTime.toFixed(2)}ms/partner`);
    console.log(`  • Max processing time: ${maxProcessingTime.toFixed(2)}ms`);
    
    if (errors.length > 0) {
      console.log('\n⚠️  ERRORS:');
      errors.forEach((err, idx) => {
        console.log(`  ${idx + 1}. Partner: ${err.partnerName} (${err.partnerId})`);
        console.log(`     Error: ${err.errorMessage}`);
      });
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (partnersFailed === 0) {
      console.log('\n✅ Backfill completed successfully!');
    } else if (partnersProcessed > 0) {
      console.log('\n⚠️  Backfill completed with some errors.');
      console.log('   Review the errors above and re-run for failed partners if needed.');
    } else {
      console.log('\n❌ Backfill failed - no partners were processed successfully.');
    }
    
    console.log('\n📋 Next steps:');
    console.log('   1. Verify partner_analytics collection in MongoDB');
    console.log('   2. Check that all partners have analytics records');
    console.log('   3. Test partner analytics dashboard at /admin/partners/[partnerId]/analytics');
    
  } catch (error) {
    console.error('\n❌ Fatal error during backfill:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n✨ Database connection closed.');
  }
}

// Run the backfill
runBackfill()
  .then(() => {
    console.log('\n✨ Backfill script complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Backfill script failed:', error);
    process.exit(1);
  });
