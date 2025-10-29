import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import { getFullAnalytics } from '../lib/bitly';
import {
  mapClicksSummary,
  mapSeriesToDaily,
  mapCountries,
  mapReferrers,
  mapReferringDomains,
  mergeTimeseries,
} from '../lib/bitly-mappers';

dotenv.config({ path: '.env.local' });

async function syncLast30Links() {
  const client = new MongoClient(process.env.MONGODB_URI || '');
  
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'messmass');
    
    console.log('🔍 Fetching last 30 Bitly links...\n');
    
    // Get the 30 most recently created Bitly links
    const links = await db.collection('bitly_links')
      .find({ archived: { $ne: true } })
      .sort({ createdAt: -1 })
      .limit(30)
      .toArray();
    
    console.log(`Found ${links.length} links to sync\n`);
    
    if (links.length === 0) {
      console.log('⚠️ No links found');
      return;
    }
    
    let synced = 0;
    let errors = 0;
    
    for (const link of links) {
      try {
        console.log(`Syncing: ${link.bitlink || link.shortUrl}...`);
        
        // Fetch all analytics from Bitly API
        const analytics = await getFullAnalytics(link.bitlink);
        
        // Map API responses to MongoDB structures
        const updatedClickSummary = mapClicksSummary(analytics.summary);
        const newTimeseries = mapSeriesToDaily(analytics.series);
        const updatedCountries = mapCountries(analytics.countries);
        const updatedReferrers = mapReferrers(analytics.referrers);
        const updatedReferringDomains = mapReferringDomains(analytics.referring_domains);
        
        // Merge timeseries
        const mergedTimeseries = mergeTimeseries(link.clicks_timeseries || [], newTimeseries);
        const lastClicksSyncedUntil =
          mergedTimeseries.length > 0 ? mergedTimeseries[mergedTimeseries.length - 1].date : undefined;
        
        // Update MongoDB
        const now = new Date().toISOString();
        await db.collection('bitly_links').updateOne(
          { _id: link._id },
          {
            $set: {
              click_summary: updatedClickSummary,
              clicks_timeseries: mergedTimeseries,
              'geo.countries': updatedCountries,
              referrers: updatedReferrers,
              referring_domains: updatedReferringDomains,
              // IMPORTANT: Also update cachedMetrics for country enrichment
              'cachedMetrics.topCountries': updatedCountries,
              lastSyncAt: now,
              lastClicksSyncedUntil,
              updatedAt: now,
            },
          }
        );
        
        console.log(`  ✅ Synced (${updatedCountries?.length || 0} countries)\n`);
        synced++;
        
        // Small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`  ❌ Error:`, error instanceof Error ? error.message : error);
        errors++;
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   Successfully synced: ${synced}/${links.length}`);
    console.log(`   Errors: ${errors}`);
    
  } finally {
    await client.close();
  }
}

syncLast30Links();
