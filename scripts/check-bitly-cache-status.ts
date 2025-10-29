import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function checkBitlyCacheStatus() {
  const client = new MongoClient(process.env.MONGODB_URI || '');
  
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'messmass');
    
    console.log('🔍 Checking Bitly links cache status...\n');
    
    const totalLinks = await db.collection('bitly_links').countDocuments();
    const linksWithCache = await db.collection('bitly_links').countDocuments({
      'cachedMetrics': { $exists: true, $ne: null }
    });
    const linksWithCountries = await db.collection('bitly_links').countDocuments({
      'cachedMetrics.topCountries': { $exists: true, $not: { $in: [null, []] } }
    });
    
    console.log(`📊 Total Bitly links: ${totalLinks}`);
    console.log(`📦 Links with cached metrics: ${linksWithCache}`);
    console.log(`🌍 Links with country data: ${linksWithCountries}\n`);
    
    // Sample a few links to see their structure
    const sampleLinks = await db.collection('bitly_links').find({}).limit(3).toArray();
    
    console.log('📋 Sample links:\n');
    for (const link of sampleLinks) {
      console.log(`Link: ${link.shortUrl || link.bitlink || 'N/A'}`);
      console.log(`  Has cachedMetrics: ${!!link.cachedMetrics}`);
      console.log(`  Has topCountries: ${!!link.cachedMetrics?.topCountries}`);
      if (link.cachedMetrics?.topCountries) {
        console.log(`  Countries count: ${link.cachedMetrics.topCountries.length}`);
        console.log(`  First country: ${link.cachedMetrics.topCountries[0]?.country}`);
      }
      console.log('');
    }
    
    // Check if we need to run sync
    if (linksWithCountries === 0) {
      console.log('⚠️  NO BITLY LINKS HAVE COUNTRY DATA');
      console.log('\n📝 Next steps:');
      console.log('   1. Run Bitly sync to fetch analytics from Bitly API');
      console.log('   2. Options:');
      console.log('      - Via Admin UI: /admin/bitly → Sync button');
      console.log('      - Via API: POST http://localhost:3000/api/bitly/sync');
      console.log('      - Check if BITLY_ACCESS_TOKEN is configured in .env.local');
    }
    
  } finally {
    await client.close();
  }
}

checkBitlyCacheStatus();
