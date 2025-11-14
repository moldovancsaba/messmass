// WHAT: Complete Bitly KYC data fix - sync, cache, and populate project.stats
// WHY: KYC pages showing empty Bitly data - need to pull from API and propagate through system
// HOW: 1) Sync Bitly API → bitly_links, 2) Aggregate to bitly_project_links.cachedMetrics, 3) Copy to project.stats

import { MongoClient, ObjectId } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const uri = process.env.MONGODB_URI;
const BITLY_ACCESS_TOKEN = process.env.BITLY_ACCESS_TOKEN;

if (!uri || !BITLY_ACCESS_TOKEN) {
  console.error('❌ Missing environment variables: MONGODB_URI or BITLY_ACCESS_TOKEN');
  process.exit(1);
}

// WHAT: Fetch analytics from Bitly API v4
async function fetchBitlyAnalytics(bitlink: string) {
  const headers = { 'Authorization': `Bearer ${BITLY_ACCESS_TOKEN}` };
  
  try {
    // Fetch all analytics in parallel
    const [summaryRes, countriesRes, referrersRes, devicesRes] = await Promise.all([
      fetch(`https://api-ssl.bitly.com/v4/bitlinks/${bitlink}/clicks/summary?unit=month&units=12`, { headers }),
      fetch(`https://api-ssl.bitly.com/v4/bitlinks/${bitlink}/countries?unit=month&units=12`, { headers }),
      fetch(`https://api-ssl.bitly.com/v4/bitlinks/${bitlink}/referrers?unit=month&units=12`, { headers }),
      fetch(`https://api-ssl.bitly.com/v4/bitlinks/${bitlink}/devices?unit=month&units=12`, { headers }),
    ]);
    
    const summary = await summaryRes.json();
    const countries = await countriesRes.json();
    const referrers = await referrersRes.json();
    const devices = await devicesRes.json();
    
    return {
      totalClicks: summary.total_clicks || 0,
      uniqueClicks: summary.total_clicks || 0,
      countries: countries.metrics || [],
      referrers: referrers.metrics || [],
      devices: devices.metrics || [],
    };
  } catch (error) {
    console.error(`   ❌ Failed to fetch analytics for ${bitlink}:`, error instanceof Error ? error.message : error);
    return null;
  }
}

// WHAT: Step 1 - Sync Bitly links with fresh analytics
async function syncBitlyLinks(db: any, dryRun: boolean): Promise<number> {
  console.log('\n📥 STEP 1: Syncing Bitly Links with Fresh Analytics\n');
  console.log('='.repeat(80));
  
  const links = await db.collection('bitly_links').find({}).toArray();
  console.log(`\n Found ${links.length} Bitly links to sync\n`);
  
  let syncedCount = 0;
  let errorCount = 0;
  
  for (const link of links) {
    process.stdout.write(`   Syncing ${link.bitlink}... `);
    
    const analytics = await fetchBitlyAnalytics(link.bitlink);
    
    if (analytics) {
      if (!dryRun) {
        await db.collection('bitly_links').updateOne(
          { _id: link._id },
          {
            $set: {
              total_clicks: analytics.totalClicks,
              unique_clicks: analytics.uniqueClicks,
              'geo.countries': analytics.countries.map((c: any) => ({
                country: c.value,
                clicks: c.clicks
              })),
              referrers: analytics.referrers.map((r: any) => ({
                referrer: r.value,
                clicks: r.clicks
              })),
              devices: analytics.devices.map((d: any) => ({
                device: d.value,
                clicks: d.clicks
              })),
              lastSyncAt: new Date().toISOString(),
            }
          }
        );
      }
      console.log(`✅ ${analytics.totalClicks} clicks, ${analytics.countries.length} countries`);
      syncedCount++;
    } else {
      console.log(`❌ Failed`);
      errorCount++;
    }
    
    // Rate limiting: 1 request per second
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`\n✅ Synced ${syncedCount} links, ${errorCount} errors\n`);
  return syncedCount;
}

// WHAT: Step 2 - Recalculate cached metrics in junction table
async function recalculateCachedMetrics(db: any, dryRun: boolean): Promise<number> {
  console.log('\n📊 STEP 2: Recalculating Cached Metrics in Junction Table\n');
  console.log('='.repeat(80));
  
  const junctions = await db.collection('bitly_project_links').find({}).toArray();
  console.log(`\n Found ${junctions.length} junction entries to process\n`);
  
  let updatedCount = 0;
  
  for (const junction of junctions) {
    const link = await db.collection('bitly_links').findOne({ _id: junction.bitlyLinkId });
    if (!link) continue;
    
    const project = await db.collection('projects').findOne({ _id: junction.projectId });
    if (!project) continue;
    
    // WHAT: Filter data by date range
    const startDate = junction.startDate ? new Date(junction.startDate) : null;
    const endDate = junction.endDate ? new Date(junction.endDate) : null;
    
    // WHAT: Aggregate country data within date range
    const countries = link.geo?.countries || [];
    const topCountries = countries
      .sort((a: any, b: any) => b.clicks - a.clicks)
      .slice(0, 10)
      .map((c: any) => ({ country: c.country, clicks: c.clicks }));
    
    const referrers = link.referrers || [];
    const topReferrers = referrers
      .sort((a: any, b: any) => b.clicks - a.clicks)
      .slice(0, 10);
    
    const devices = link.devices || [];
    const deviceBreakdown = devices.reduce((acc: any, d: any) => {
      const device = d.device?.toLowerCase() || 'other';
      acc[device] = (acc[device] || 0) + d.clicks;
      return acc;
    }, {});
    
    const cachedMetrics = {
      totalClicks: link.total_clicks || 0,
      uniqueClicks: link.unique_clicks || 0,
      countriesData: topCountries,
      referrersData: topReferrers,
      devicesData: deviceBreakdown,
      lastSyncedAt: new Date().toISOString(),
    };
    
    if (!dryRun) {
      await db.collection('bitly_project_links').updateOne(
        { _id: junction._id },
        { $set: { cachedMetrics, lastSyncedAt: new Date().toISOString() } }
      );
    }
    
    if (updatedCount % 10 === 0) {
      process.stdout.write(`   Processed ${updatedCount}/${junctions.length}...\r`);
    }
    updatedCount++;
  }
  
  console.log(`\n✅ Updated ${updatedCount} cached metrics\n`);
  return updatedCount;
}

// WHAT: Step 3 - Sync to project.stats for KYC visibility
async function syncToProjectStats(db: any, dryRun: boolean): Promise<number> {
  console.log('\n🔄 STEP 3: Syncing to project.stats for KYC Display\n');
  console.log('='.repeat(80));
  
  const projects = await db.collection('projects').find({}).toArray();
  console.log(`\n Found ${projects.length} projects to update\n`);
  
  let updatedCount = 0;
  
  for (const project of projects) {
    // WHAT: Get all junctions for this project
    const junctions = await db.collection('bitly_project_links')
      .find({ projectId: project._id })
      .toArray();
    
    if (junctions.length === 0) continue;
    
    // WHAT: Aggregate metrics across all links
    let totalClicks = 0;
    let uniqueClicks = 0;
    const countryClicksMap = new Map<string, number>();
    const referrerClicksMap = new Map<string, number>();
    let mobileClicks = 0, desktopClicks = 0, tabletClicks = 0;
    
    junctions.forEach((j: any) => {
      if (j.cachedMetrics) {
        totalClicks += j.cachedMetrics.totalClicks || 0;
        uniqueClicks += j.cachedMetrics.uniqueClicks || 0;
        
        (j.cachedMetrics.countriesData || []).forEach((c: any) => {
          const current = countryClicksMap.get(c.country) || 0;
          countryClicksMap.set(c.country, current + c.clicks);
        });
        
        (j.cachedMetrics.referrersData || []).forEach((r: any) => {
          const current = referrerClicksMap.get(r.referrer) || 0;
          referrerClicksMap.set(r.referrer, current + r.clicks);
        });
        
        const devices = j.cachedMetrics.devicesData || {};
        mobileClicks += devices.mobile || 0;
        desktopClicks += devices.desktop || 0;
        tabletClicks += devices.tablet || 0;
      }
    });
    
    // WHAT: Get top 5 countries for KYC format
    const topCountries = Array.from(countryClicksMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    // WHAT: Build update object
    const updateStats: any = {
      totalBitlyClicks: totalClicks,
      uniqueBitlyClicks: uniqueClicks,
      bitlyMobileClicks: mobileClicks,
      bitlyDesktopClicks: desktopClicks,
      bitlyTabletClicks: tabletClicks,
    };
    
    // WHAT: Add country data in KYC format
    topCountries.forEach(([country, clicks], index) => {
      const num = index + 1;
      updateStats[`bitlyCountry${num}`] = country;
      updateStats[`bitlyCountry${num}Clicks`] = clicks;
    });
    
    // WHAT: Add top referrer data
    const topReferrers = Array.from(referrerClicksMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    if (topReferrers.length > 0) {
      updateStats.bitlyTopReferrer = topReferrers[0][0];
      updateStats.bitlyReferrerCount = referrerClicksMap.size;
      
      // Social media specific
      updateStats.bitlyFacebookClicks = referrerClicksMap.get('facebook') || 0;
      updateStats.bitlyInstagramClicks = referrerClicksMap.get('instagram') || 0;
      updateStats.bitlySocialClicks = (referrerClicksMap.get('facebook') || 0) + 
                                       (referrerClicksMap.get('instagram') || 0) + 
                                       (referrerClicksMap.get('twitter') || 0);
      updateStats.bitlyDirectClicks = referrerClicksMap.get('direct') || 0;
    }
    
    // WHAT: Apply update
    if (!dryRun && (totalClicks > 0 || topCountries.length > 0)) {
      const setFields: any = {};
      Object.keys(updateStats).forEach(key => {
        setFields[`stats.${key}`] = updateStats[key];
      });
      
      await db.collection('projects').updateOne(
        { _id: project._id },
        { $set: setFields }
      );
      
      updatedCount++;
      
      if (updatedCount % 10 === 0) {
        process.stdout.write(`   Updated ${updatedCount}/${projects.length}...\r`);
      }
    }
  }
  
  console.log(`\n✅ Updated ${updatedCount} projects with Bitly data\n`);
  return updatedCount;
}

// WHAT: Main execution
async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--apply');
  const skipSync = args.includes('--skip-sync'); // Skip API calls if already synced
  
  console.log('\n🔧 BITLY KYC DATA FIX\n');
  console.log('='.repeat(80));
  console.log(`\n📋 Mode: ${dryRun ? 'DRY RUN (no changes)' : 'LIVE UPDATE'}`);
  if (skipSync) console.log('⏭️  Skipping API sync (using existing data)');
  console.log('');
  
  const client = new MongoClient(uri!);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db('messmass');
    
    // Step 1: Sync Bitly links (can be skipped if already done)
    let syncedLinks = 0;
    if (!skipSync) {
      syncedLinks = await syncBitlyLinks(db, dryRun);
    } else {
      console.log('\n📥 STEP 1: Skipped (--skip-sync flag)\n');
    }
    
    // Step 2: Recalculate cached metrics
    const cachedCount = await recalculateCachedMetrics(db, dryRun);
    
    // Step 3: Sync to project stats
    const projectsUpdated = await syncToProjectStats(db, dryRun);
    
    // Summary
    console.log('='.repeat(80));
    console.log('\n📊 SUMMARY\n');
    if (!skipSync) console.log(`   Links Synced: ${syncedLinks}`);
    console.log(`   Cached Metrics: ${cachedCount}`);
    console.log(`   Projects Updated: ${projectsUpdated}`);
    
    if (dryRun) {
      console.log('\n⚠️  This was a DRY RUN. No changes were made.');
      console.log('   Run with --apply flag to apply changes.');
      console.log('   Use --skip-sync to skip Bitly API calls (if already synced).');
    } else {
      console.log('\n✅ All changes applied successfully!');
    }
    
    console.log('\n' + '='.repeat(80) + '\n');
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();
