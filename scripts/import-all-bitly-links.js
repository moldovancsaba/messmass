// scripts/import-all-bitly-links.js
// WHAT: One-time bulk import of ALL Bitly links from group into {messmass} database
// WHY: Initial setup to import hundreds/thousands of existing links at once
// USAGE: node scripts/import-all-bitly-links.js

require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

// WHAT: Bitly API client setup
// WHY: Need to fetch links from Bitly group using configured credentials
const BITLY_API_BASE = 'https://api-ssl.bitly.com/v4';
const BITLY_ACCESS_TOKEN = process.env.BITLY_ACCESS_TOKEN;
const BITLY_GROUP_GUID = process.env.BITLY_GROUP_GUID;
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

// WHAT: Validate environment variables
if (!BITLY_ACCESS_TOKEN) {
  console.error('❌ BITLY_ACCESS_TOKEN not found in .env.local');
  process.exit(1);
}
if (!BITLY_GROUP_GUID) {
  console.error('❌ BITLY_GROUP_GUID not found in .env.local');
  process.exit(1);
}
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env.local');
  process.exit(1);
}

console.log('✓ Environment variables loaded');
console.log(`  Group GUID: ${BITLY_GROUP_GUID}`);
console.log(`  Database: ${MONGODB_DB}`);
console.log('');

/**
 * WHAT: Fetch links from Bitly with pagination support
 * WHY: Bitly returns max 100 links per request; need to paginate through all
 */
async function fetchAllBitlyLinks() {
  const allLinks = [];
  let searchAfter = null;
  let page = 1;

  console.log('🔗 Fetching all links from Bitly...\n');

  while (true) {
    try {
      // WHAT: Build API URL with pagination
      let url = `${BITLY_API_BASE}/groups/${BITLY_GROUP_GUID}/bitlinks?size=100`;
      if (searchAfter) {
        url += `&search_after=${encodeURIComponent(searchAfter)}`;
      }

      console.log(`📄 Fetching page ${page}...`);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${BITLY_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Bitly API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.links || data.links.length === 0) {
        console.log(`✓ Page ${page}: No more links\n`);
        break;
      }

      console.log(`✓ Page ${page}: Found ${data.links.length} links`);
      allLinks.push(...data.links);

      // WHAT: Check if there are more pages
      if (data.pagination && data.pagination.search_after) {
        searchAfter = data.pagination.search_after;
        page++;
        // WHAT: Small delay between requests to be nice to API
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        console.log(`✓ Page ${page}: Last page\n`);
        break;
      }

    } catch (error) {
      console.error(`❌ Error fetching page ${page}:`, error.message);
      throw error;
    }
  }

  return allLinks;
}

/**
 * WHAT: Import links into MongoDB database
 * WHY: Store links for {messmass} project association and analytics
 */
async function importLinksToDatabase(links) {
  const client = new MongoClient(MONGODB_URI);

  try {
    console.log('📦 Connecting to MongoDB...');
    await client.connect();
    console.log('✓ Connected to MongoDB\n');

    const db = client.db(MONGODB_DB);
    const linksCollection = db.collection('bitly_links');

    // WHAT: Get existing links to avoid duplicates
    console.log('🔍 Checking for existing links...');
    const allBitlinks = links.map(link => link.id);
    const existingLinks = await linksCollection.find(
      { bitlink: { $in: allBitlinks } },
      { projection: { bitlink: 1 } }
    ).toArray();
    const existingBitlinksSet = new Set(existingLinks.map(doc => doc.bitlink));
    
    console.log(`✓ Found ${existingBitlinksSet.size} existing links in database`);

    // WHAT: Filter to only new links
    const newLinks = links.filter(link => !existingBitlinksSet.has(link.id));
    console.log(`✓ ${newLinks.length} new links to import\n`);

    if (newLinks.length === 0) {
      console.log('✅ All links already imported! Nothing to do.\n');
      return { total: links.length, imported: 0, skipped: existingBitlinksSet.size };
    }

    // WHAT: Prepare documents for insertion
    console.log('📝 Preparing documents...');
    const now = new Date().toISOString();
    const documentsToInsert = newLinks.map(link => ({
      projectId: null, // Unassigned by default
      bitlink: link.id,
      long_url: link.long_url,
      title: link.title || 'Untitled',
      tags: link.tags || [],
      click_summary: {
        total: 0,
        unique: 0,
        updatedAt: now
      },
      clicks_timeseries: [],
      geo: {
        countries: [],
        cities: [],
      },
      referrers: [],
      lastSyncAt: now,
      createdAt: now,
      updatedAt: now,
    }));

    // WHAT: Bulk insert all new links
    console.log(`💾 Inserting ${documentsToInsert.length} links...`);
    const result = await linksCollection.insertMany(documentsToInsert, { ordered: false });
    console.log(`✓ Inserted ${result.insertedCount} links\n`);

    return {
      total: links.length,
      imported: result.insertedCount,
      skipped: existingBitlinksSet.size
    };

  } finally {
    await client.close();
    console.log('✓ Database connection closed\n');
  }
}

/**
 * WHAT: Main execution function
 */
async function main() {
  try {
    console.log('🚀 Starting Bitly bulk import...\n');
    console.log('═'.repeat(60));
    console.log('');

    // WHAT: Fetch all links from Bitly
    const links = await fetchAllBitlyLinks();
    console.log('═'.repeat(60));
    console.log(`\n📊 Total links fetched from Bitly: ${links.length}\n`);

    if (links.length === 0) {
      console.log('⚠️  No links found in Bitly group\n');
      return;
    }

    // WHAT: Import into database
    console.log('═'.repeat(60));
    console.log('');
    const result = await importLinksToDatabase(links);

    // WHAT: Print summary
    console.log('═'.repeat(60));
    console.log('\n✅ IMPORT COMPLETE!\n');
    console.log(`📊 Summary:`);
    console.log(`   Total links in Bitly: ${result.total}`);
    console.log(`   Newly imported: ${result.imported}`);
    console.log(`   Already existed: ${result.skipped}`);
    console.log('');
    console.log('═'.repeat(60));
    console.log('');

    if (result.imported > 0) {
      console.log('💡 Next steps:');
      console.log('   1. Go to /admin/bitly to see all imported links');
      console.log('   2. Use "Get Links from Bitly" button to pull latest 100');
      console.log('   3. Associate links with projects as needed');
      console.log('');
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Run the script
main();
