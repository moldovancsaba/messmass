// scripts/upload-partner-logos.js
// WHAT: Bulk migration script to upload existing partner badges to ImgBB
// WHY: Migrate partners that already have SportsDB data but no logoUrl
// USAGE: node scripts/upload-partner-logos.js [--dry-run]

require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

// WHAT: Script configuration
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';
const IMGBB_API_KEY = process.env.IMGBB_API_KEY;
const IMGBB_API_URL = 'https://api.imgbb.com/1/upload';

// WHAT: Parse command-line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');

/**
 * WHAT: Upload image to ImgBB from URL
 * WHY: Convert TheSportsDB badge to permanent ImgBB URL
 */
async function uploadToImgBB(imageUrl, partnerName) {
  try {
    // WHAT: Download image from source URL
    console.log(`  📥 Downloading from: ${imageUrl}`);
    const imageResponse = await fetch(imageUrl);
    
    if (!imageResponse.ok) {
      console.error(`  ❌ Failed to download: ${imageResponse.statusText}`);
      return null;
    }

    // WHAT: Convert to base64
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');

    // WHAT: Prepare form data
    const sanitizedName = partnerName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    const formData = new URLSearchParams();
    formData.append('key', IMGBB_API_KEY);
    formData.append('image', base64Image);
    formData.append('name', `partner-${sanitizedName}`);

    console.log(`  📤 Uploading to ImgBB...`);

    // WHAT: Upload to ImgBB
    const uploadResponse = await fetch(IMGBB_API_URL, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    });

    const result = await uploadResponse.json();

    if (result.success && result.data) {
      console.log(`  ✅ Uploaded: ${result.data.url}`);
      return result.data.url;
    } else {
      console.error(`  ❌ Upload failed:`, result.error);
      return null;
    }

  } catch (error) {
    console.error(`  ❌ Error:`, error.message);
    return null;
  }
}

/**
 * WHAT: Main migration logic
 * WHY: Process all partners with SportsDB badges but no logoUrl
 */
async function migrateLogos() {
  // WHAT: Validate environment
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI environment variable is required');
    process.exit(1);
  }

  if (!IMGBB_API_KEY) {
    console.error('❌ IMGBB_API_KEY environment variable is required');
    process.exit(1);
  }

  console.log('🚀 Partner Logo Migration Script');
  console.log('=================================\n');
  console.log(`Mode: ${isDryRun ? '🧪 DRY RUN (no changes)' : '💾 LIVE (will update database)'}\n`);

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db(MONGODB_DB);
    const partnersCollection = db.collection('partners');

    // WHAT: Find partners with SportsDB badge but no logoUrl
    // WHY: These need logo migration
    const query = {
      'sportsDb.badge': { $exists: true, $ne: null },
      $or: [
        { logoUrl: { $exists: false } },
        { logoUrl: null },
        { logoUrl: '' }
      ]
    };

    const partners = await partnersCollection.find(query).toArray();

    console.log(`📋 Found ${partners.length} partners needing logo upload\n`);

    if (partners.length === 0) {
      console.log('✅ No partners need logo migration');
      return;
    }

    // WHAT: Statistics tracking
    const stats = {
      total: partners.length,
      uploaded: 0,
      skipped: 0,
      errors: 0,
    };

    // WHAT: Process each partner
    for (let i = 0; i < partners.length; i++) {
      const partner = partners[i];
      console.log(`[${i + 1}/${partners.length}] ${partner.emoji} ${partner.name}`);

      if (!partner.sportsDb?.badge) {
        console.log(`  ⏭️  No badge URL found`);
        stats.skipped++;
        continue;
      }

      // WHAT: Upload badge to ImgBB
      const logoUrl = await uploadToImgBB(partner.sportsDb.badge, partner.name);

      if (logoUrl) {
        // WHAT: Update partner with logoUrl
        if (!isDryRun) {
          await partnersCollection.updateOne(
            { _id: partner._id },
            { 
              $set: { 
                logoUrl: logoUrl,
                updatedAt: new Date().toISOString(),
              } 
            }
          );
          console.log(`  💾 Saved to database`);
        } else {
          console.log(`  🧪 DRY RUN - would save to database`);
        }
        stats.uploaded++;
      } else {
        console.log(`  ❌ Failed to upload logo`);
        stats.errors++;
      }

      console.log('');

      // WHAT: Rate limiting (1 second delay between uploads)
      // WHY: Respect ImgBB API limits
      if (i < partners.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // WHAT: Print summary
    console.log('\n📊 Migration Summary');
    console.log('===================');
    console.log(`Total partners processed: ${stats.total}`);
    console.log(`✅ Successfully uploaded: ${stats.uploaded}`);
    console.log(`⏭️  Skipped: ${stats.skipped}`);
    console.log(`❌ Errors: ${stats.errors}`);

    console.log('\n✅ Migration complete!\n');

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// WHAT: Script entry point
migrateLogos();
