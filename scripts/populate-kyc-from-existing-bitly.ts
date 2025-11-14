// WHAT: Populate KYC with ALL Bitly metrics from existing database data
// WHY: We have Bitly data in bitly_links but not all fields copied to project.stats
// HOW: Use existing data from junctions - NO API CALLS

import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('❌ MONGODB_URI not found');
  process.exit(1);
}

async function populateKYC() {
  const client = new MongoClient(uri!);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db('messmass');
    
    // Get all projects with Bitly junctions
    const junctions = await db.collection('bitly_project_links').find({}).toArray();
    const projectIds = [...new Set(junctions.map(j => j.projectId.toString()))];
    
    console.log(`📊 Processing ${projectIds.length} projects with Bitly links\n`);
    
    let updated = 0;
    for (const projectIdStr of projectIds) {
      const projectId = junctions.find(j => j.projectId.toString() === projectIdStr)!.projectId;
      const projectJunctions = junctions.filter(j => j.projectId.toString() === projectIdStr);
      
      // Aggregate ALL metrics
      let totalClicks = 0, uniqueClicks = 0;
      const countryMap = new Map<string, number>();
      const referrerMap = new Map<string, number>(); // Platform-level (Facebook, Instagram)
      const domainMap = new Map<string, number>(); // Domain-level (l.instagram.com, m.facebook.com)
      
      for (const junction of projectJunctions) {
        // Get link data
        const link = await db.collection('bitly_links').findOne({ _id: junction.bitlyLinkId });
        if (!link) continue;
        
        totalClicks += link.total_clicks || 0;
        uniqueClicks += link.unique_clicks || 0;
        
        // Countries
        (link.geo?.countries || []).forEach((c: any) => {
          countryMap.set(c.country, (countryMap.get(c.country) || 0) + c.clicks);
        });
        
        // Referrers (platform-level)
        (link.referrers || []).forEach((r: any) => {
          referrerMap.set(r.referrer, (referrerMap.get(r.referrer) || 0) + r.clicks);
        });
        
        // Referring domains (domain-level, more granular)
        (link.referring_domains || []).forEach((d: any) => {
          domainMap.set(d.domain, (domainMap.get(d.domain) || 0) + d.clicks);
        });
      }
      
      // Build update
      const updates: any = {
        'stats.bitlyTotalClicks': totalClicks,
        'stats.bitlyUniqueClicks': uniqueClicks,
      };
      
      // Top 5 countries (match Bitly API country codes)
      const topCountries = [...countryMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
      updates['stats.bitlyClicksByCountryUS'] = countryMap.get('US') || 0;
      updates['stats.bitlyClicksByCountryGB'] = countryMap.get('GB') || 0;
      updates['stats.bitlyClicksByCountryCA'] = countryMap.get('CA') || 0;
      updates['stats.bitlyClicksByCountryIT'] = countryMap.get('IT') || 0;
      updates['stats.bitlyClicksByCountryDE'] = countryMap.get('DE') || 0;
      
      // Platform-level referrers (case-insensitive matching)
      updates['stats.bitlyClicksFromFacebook'] = referrerMap.get('Facebook') || 0;
      updates['stats.bitlyClicksFromInstagram'] = referrerMap.get('Instagram') || 0;
      updates['stats.bitlyClicksFromTwitter'] = referrerMap.get('Twitter') || 0;
      updates['stats.bitlyClicksFromLinkedIn'] = referrerMap.get('LinkedIn') || 0;
      updates['stats.bitlyClicksFromDirect'] = referrerMap.get('direct') || 0;
      updates['stats.bitlyClicksFromQRCode'] = referrerMap.get('Bitly QR Code') || 0;
      updates['stats.bitlyClicksFromGoogle'] = referrerMap.get('Google') || 0;
      
      // Domain-level referrers (more granular)
      updates['stats.bitlyClicksFromInstagramApp'] = domainMap.get('l.instagram.com') || 0;
      updates['stats.bitlyClicksFromFacebookMobile'] = domainMap.get('m.facebook.com') || 0;
      
      // Update project
      await db.collection('projects').updateOne(
        { _id: projectId },
        { $set: updates }
      );
      
      updated++;
      if (updated % 10 === 0) {
        process.stdout.write(`\r   Updated ${updated}/${projectIds.length}...`);
      }
    }
    
    console.log(`\n\n✅ Updated ${updated} projects with complete Bitly data\n`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

populateKYC();
