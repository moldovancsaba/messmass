// Script to check Bitly link data for fanselfie.me/ea
require('dotenv').config({ path: '.env.local' });
const { MongoClient, ObjectId } = require('mongodb');

async function checkLink() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'messmass');
    
    console.log('Connected to MongoDB\n');
    
    // Search for fanselfie.me/ea link
    const link = await db.collection('bitly_links').findOne({
      $or: [
        { bitlink: /fanselfie\.me\/ea/i },
        { long_url: /fanselfie\.me\/ea/i }
      ]
    });
    
    if (!link) {
      console.log('❌ Link fanselfie.me/ea not found in database');
      console.log('\nSearching for any fanselfie links...\n');
      
      const anyFanselfie = await db.collection('bitly_links').find({
        $or: [
          { bitlink: /fanselfie/i },
          { long_url: /fanselfie/i }
        ]
      }).toArray();
      
      if (anyFanselfie.length > 0) {
        console.log(`Found ${anyFanselfie.length} fanselfie link(s):`);
        anyFanselfie.forEach(l => {
          console.log(`  - ${l.bitlink} -> ${l.long_url}`);
        });
      } else {
        console.log('No fanselfie links found in database');
      }
      
      return;
    }
    
    console.log('✅ Link found!\n');
    console.log('=== BASIC INFO ===');
    console.log(`Bitlink: ${link.bitlink}`);
    console.log(`Long URL: ${link.long_url}`);
    console.log(`Title: ${link.title}`);
    console.log(`Project ID: ${link.projectId || 'Not assigned'}`);
    
    console.log('\n=== CLICK SUMMARY ===');
    console.log(JSON.stringify(link.click_summary, null, 2));
    
    console.log('\n=== GEO DATA (countries) ===');
    console.log(`Number of countries: ${link.geo?.countries?.length || 0}`);
    if (link.geo?.countries && link.geo.countries.length > 0) {
      console.log('Countries data:');
      console.log(JSON.stringify(link.geo.countries, null, 2));
    }
    
    console.log('\n=== REFERRERS ===');
    console.log(`Number of referrers: ${link.referrers?.length || 0}`);
    if (link.referrers && link.referrers.length > 0) {
      console.log('Referrers data:');
      console.log(JSON.stringify(link.referrers, null, 2));
    }
    
    console.log('\n=== TIMESERIES ===');
    console.log(`Number of daily data points: ${link.clicks_timeseries?.length || 0}`);
    if (link.clicks_timeseries && link.clicks_timeseries.length > 0) {
      const first = link.clicks_timeseries[0];
      const last = link.clicks_timeseries[link.clicks_timeseries.length - 1];
      console.log(`Date range: ${first.date} to ${last.date}`);
      console.log(`Sample (first 5 days):`);
      console.log(JSON.stringify(link.clicks_timeseries.slice(0, 5), null, 2));
    }
    
    console.log('\n=== SYNC INFO ===');
    console.log(`Last synced: ${link.lastSyncAt}`);
    console.log(`Last clicks synced until: ${link.lastClicksSyncedUntil || 'N/A'}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkLink();
