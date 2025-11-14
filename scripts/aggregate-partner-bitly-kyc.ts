// WHAT: Aggregate Bitly data for partner-level KYC
// WHY: Partners need total Bitly metrics from partner links + all their event links
// HOW: Sum partner's own links + all links from partner's events

import { MongoClient, ObjectId } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('❌ MONGODB_URI not found');
  process.exit(1);
}

async function aggregatePartnerBitly(partnerId: string) {
  const client = new MongoClient(uri!);
  
  try {
    await client.connect();
    const db = client.db('messmass');
    
    const partnerObjId = new ObjectId(partnerId);
    
    // 1. Get partner's own Bitly links
    const partnerLinks = await db.collection('bitly_links').find({
      // Partner links are associated via partners.bitlyLinkIds
    }).toArray();
    
    const partner = await db.collection('partners').findOne({ _id: partnerObjId });
    const partnerBitlyIds = (partner?.bitlyLinkIds || []).map((id: any) => id.toString());
    
    // 2. Get all events for this partner
    const events = await db.collection('projects').find({
      $or: [
        { partnerId: partnerObjId },
        { partner1Id: partnerObjId },
        { partner2Id: partnerObjId },
      ]
    }).toArray();
    
    console.log(`\n📊 Partner: ${partner?.name}`);
    console.log(`   Partner's own Bitly links: ${partnerBitlyIds.length}`);
    console.log(`   Events: ${events.length}\n`);
    
    // 3. Get ALL Bitly junctions for partner's own links + event links
    const eventIds = events.map(e => e._id);
    
    const junctions = await db.collection('bitly_project_links').find({
      $or: [
        { bitlyLinkId: { $in: partnerBitlyIds.map((id: string) => new ObjectId(id)) } },
        { projectId: { $in: eventIds } }
      ]
    }).toArray();
    
    console.log(`   Total Bitly junctions: ${junctions.length}\n`);
    
    // 4. Aggregate ALL metrics
    let totalClicks = 0, uniqueClicks = 0;
    let mobile = 0, desktop = 0, tablet = 0;
    const countryMap = new Map<string, number>();
    const referrerMap = new Map<string, number>();
    
    for (const junction of junctions) {
      const link = await db.collection('bitly_links').findOne({ _id: junction.bitlyLinkId });
      if (!link) continue;
      
      totalClicks += link.total_clicks || 0;
      uniqueClicks += link.unique_clicks || 0;
      
      (link.geo?.countries || []).forEach((c: any) => {
        countryMap.set(c.country, (countryMap.get(c.country) || 0) + c.clicks);
      });
      
      (link.referrers || []).forEach((r: any) => {
        referrerMap.set(r.referrer, (referrerMap.get(r.referrer) || 0) + r.clicks);
      });
      
      (link.devices || []).forEach((d: any) => {
        const device = d.device?.toLowerCase();
        if (device?.includes('mobile')) mobile += d.clicks;
        else if (device?.includes('desktop')) desktop += d.clicks;
        else if (device?.includes('tablet')) tablet += d.clicks;
      });
    }
    
    // 5. Display results
    console.log('📈 AGGREGATED METRICS\n');
    console.log(`   Total Clicks: ${totalClicks}`);
    console.log(`   Unique Clicks: ${uniqueClicks}`);
    console.log(`   Mobile: ${mobile}, Desktop: ${desktop}, Tablet: ${tablet}\n`);
    
    console.log('🌍 TOP COUNTRIES:');
    [...countryMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([country, clicks], i) => {
        console.log(`   ${i+1}. ${country}: ${clicks} clicks`);
      });
    
    console.log('\n📊 TOP REFERRERS:');
    [...referrerMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([ref, clicks], i) => {
        console.log(`   ${i+1}. ${ref}: ${clicks} clicks`);
      });
    
    console.log('');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Get partner ID from command line
const partnerId = process.argv[2];
if (!partnerId || !ObjectId.isValid(partnerId)) {
  console.error('Usage: npx tsx scripts/aggregate-partner-bitly-kyc.ts <partnerId>');
  process.exit(1);
}

aggregatePartnerBitly(partnerId);
