import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function syncLast30ViaAPI() {
  const client = new MongoClient(process.env.MONGODB_URI || '');
  
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'messmass');
    
    console.log('🔍 Fetching last 30 Bitly links...\\n');
    
    // Get the 30 most recently created Bitly links
    const links = await db.collection('bitly_links')
      .find({ archived: { $ne: true } })
      .sort({ createdAt: -1 })
      .limit(30)
      .toArray();
    
    console.log(`Found ${links.length} links to sync`);
    console.log(`\\n📝 Sample links:`);
    links.slice(0, 5).forEach((link, i) => {
      console.log(`   ${i + 1}. ${link.bitlink || link.shortUrl}`);
    });
    
    console.log(`\\n🚀 Starting sync via API endpoint...`);
    console.log(`   This will take about ${Math.ceil(links.length * 0.5)} seconds\\n`);
    
    const linkIds = links.map(l => l._id.toString());
    
    // Use CRON_SECRET for authentication (sync API accepts it)
    const cronSecret = process.env.CRON_SECRET || 'dev-secret-key';
    
    // Call the sync API endpoint with cron authentication
    const response = await fetch('http://localhost:3000/api/bitly/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cronSecret}`,
      },
      body: JSON.stringify({ linkIds })
    });
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    console.log(`\\n✅ Sync completed!`);
    console.log(`   Links synced: ${result.summary?.linksUpdated || 0}/${result.summary?.linksScanned || 0}`);
    console.log(`   Errors: ${result.summary?.errors || 0}`);
    
    if (result.summary?.linksUpdated > 0) {
      console.log(`\\n📊 Now enriching projects with country data...\\n`);
      
      // Now enrich projects
      const { execSync } = await import('child_process');
      execSync('npx ts-node scripts/fix-partner-event-connections.ts', {
        stdio: 'inherit',
        cwd: process.cwd()
      });
    }
    
  } catch (error) {
    if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
      console.error('\\n❌ Error: Development server is not running!');
      console.error('   Please start the server first: npm run dev');
    } else {
      console.error('\\n❌ Error:', error);
    }
  } finally {
    await client.close();
  }
}

syncLast30ViaAPI();
