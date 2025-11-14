// WHAT: Sync AS Roma partner's Bitly data (events + partner links)
// WHY: User requested immediate sync with proper data collection
// HOW: Find partner → get all events → sync all Bitly links with referrers/domains

import { MongoClient, ObjectId } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('❌ MONGODB_URI not found');
  process.exit(1);
}

async function main() {
  const client = new MongoClient(uri!);
  
  try {
    await client.connect();
    const db = client.db('messmass');
    
    console.log('\n🔍 Finding AS Roma partner...\n');
    
    // Find AS Roma partner
    const partner = await db.collection('partners').findOne({ name: /Roma/i });
    
    if (!partner) {
      console.error('❌ AS Roma partner not found');
      process.exit(1);
    }
    
    console.log(`✅ Found: ${partner.name}`);
    console.log(`   Partner ID: ${partner._id}`);
    console.log(`   Partner's own Bitly links: ${partner.bitlyLinkIds?.length || 0}\n`);
    
    // Get all events for this partner
    const events = await db.collection('projects').find({
      $or: [
        { partnerId: partner._id },
        { partner1Id: partner._id },
        { partner2Id: partner._id },
      ]
    }).toArray();
    
    console.log(`📊 Events: ${events.length}\n`);
    
    // Get all Bitly junctions for these events
    const eventIds = events.map(e => e._id);
    const junctions = await db.collection('bitly_project_links').find({
      projectId: { $in: eventIds }
    }).toArray();
    
    console.log(`🔗 Bitly junctions: ${junctions.length}\n`);
    
    // Get unique Bitly link IDs
    const linkIds = [...new Set(junctions.map(j => j.bitlyLinkId.toString()))];
    console.log(`📎 Unique Bitly links: ${linkIds.length}\n`);
    
    if (linkIds.length === 0) {
      console.log('⚠️  No Bitly links found for AS Roma');
      return;
    }
    
    // Call sync API for these specific links
    console.log('🔄 Calling sync API...\n');
    
    const response = await fetch('http://localhost:3000/api/bitly/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: In production, need admin auth cookie
      },
      body: JSON.stringify({
        linkIds: linkIds.map(id => id.toString())
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Sync completed successfully!\n');
      console.log(`   Links scanned: ${result.summary.linksScanned}`);
      console.log(`   Links updated: ${result.summary.linksUpdated}`);
      console.log(`   Errors: ${result.summary.errors}\n`);
    } else {
      console.error('❌ Sync failed:', result.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();
