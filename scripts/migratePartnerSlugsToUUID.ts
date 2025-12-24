// WHAT: Migrate partners with human-readable viewSlug to secure UUID format
// WHY: UUID security enforcement (v11.53.0) broke partners with old slug format
// HOW: Update all partners: if viewSlug is not UUID format, replace with _id

import { MongoClient, ObjectId } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is not set');
  process.exit(1);
}

// UUID v4 pattern (secure format)
const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Check if string is a valid MongoDB ObjectId (24 hex chars, no dashes)
function isMongoObjectId(str: string): boolean {
  return ObjectId.isValid(str) && str.length === 24 && /^[0-9a-f]{24}$/i.test(str);
}

// Check if string is a secure UUID (ObjectId or UUID v4)
function isSecureUUID(str: string): boolean {
  return isMongoObjectId(str) || UUID_V4_PATTERN.test(str);
}

async function migratePartnerSlugs() {
  const client = new MongoClient(MONGODB_URI!);
  
  try {
    console.log('🔗 Connecting to MongoDB...');
    await client.connect();
    await client.db(MONGODB_DB).admin().ping();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db(MONGODB_DB);
    const partnersCollection = db.collection('partners');
    
    // Fetch all partners
    const allPartners = await partnersCollection.find({}).toArray();
    console.log(`📊 Found ${allPartners.length} partners in database\n`);
    
    // Analyze partners
    const insecurePartners: any[] = [];
    const securePartners: any[] = [];
    const noSlugPartners: any[] = [];
    
    for (const partner of allPartners) {
      if (!partner.viewSlug) {
        noSlugPartners.push(partner);
      } else if (isSecureUUID(partner.viewSlug)) {
        securePartners.push(partner);
      } else {
        insecurePartners.push(partner);
      }
    }
    
    console.log('📈 Analysis:');
    console.log(`  ✅ Secure partners (UUID format): ${securePartners.length}`);
    console.log(`  ❌ Insecure partners (human-readable): ${insecurePartners.length}`);
    console.log(`  ⚠️  Partners without viewSlug: ${noSlugPartners.length}\n`);
    
    if (insecurePartners.length === 0 && noSlugPartners.length === 0) {
      console.log('✅ All partners already have secure UUID format. Nothing to migrate.');
      return;
    }
    
    // Show partners that need migration
    if (insecurePartners.length > 0) {
      console.log('❌ Partners with insecure viewSlug (human-readable):');
      insecurePartners.forEach(p => {
        console.log(`  - ${p.name} (${p._id.toString()}) → viewSlug: "${p.viewSlug}"`);
      });
      console.log('');
    }
    
    if (noSlugPartners.length > 0) {
      console.log('⚠️  Partners without viewSlug:');
      noSlugPartners.forEach(p => {
        console.log(`  - ${p.name} (${p._id.toString()})`);
      });
      console.log('');
    }
    
    // Confirm migration
    console.log('🔧 Migration Plan:');
    console.log('  1. Partners with insecure viewSlug → replace with _id (MongoDB ObjectId)');
    console.log('  2. Partners without viewSlug → set to _id (MongoDB ObjectId)');
    console.log('  3. Partners already secure → no changes\n');
    
    console.log('⚠️  IMPORTANT: This will update partner URLs!');
    console.log('   Old: /partner-report/szerencsejtk-zrt');
    console.log('   New: /partner-report/67478d95e6b1234567890abc\n');
    
    // Perform migration
    let migratedCount = 0;
    const partnersToMigrate = [...insecurePartners, ...noSlugPartners];
    
    console.log(`🚀 Migrating ${partnersToMigrate.length} partners...\n`);
    
    for (const partner of partnersToMigrate) {
      const partnerId = partner._id;
      const partnerName = partner.name;
      const oldViewSlug = partner.viewSlug || '(none)';
      const newViewSlug = partnerId.toString(); // Use MongoDB ObjectId as viewSlug
      
      // Update partner
      await partnersCollection.updateOne(
        { _id: partnerId },
        { 
          $set: { 
            viewSlug: newViewSlug,
            updatedAt: new Date().toISOString()
          } 
        }
      );
      
      migratedCount++;
      console.log(`  ✅ ${migratedCount}/${partnersToMigrate.length} - ${partnerName}`);
      console.log(`     Old: ${oldViewSlug} → New: ${newViewSlug}`);
    }
    
    console.log(`\n✅ Migration complete! Updated ${migratedCount} partners.`);
    console.log('\n📋 Summary:');
    console.log(`  - Total partners: ${allPartners.length}`);
    console.log(`  - Already secure: ${securePartners.length}`);
    console.log(`  - Migrated: ${migratedCount}`);
    console.log(`  - All partners now have secure UUID format ✅\n`);
    
    // Final verification
    const allPartnersAfter = await partnersCollection.find({}).toArray();
    const stillInsecure = allPartnersAfter.filter(p => 
      p.viewSlug && !isSecureUUID(p.viewSlug)
    );
    
    if (stillInsecure.length > 0) {
      console.log('⚠️  WARNING: Some partners still have insecure slugs:');
      stillInsecure.forEach(p => {
        console.log(`  - ${p.name}: ${p.viewSlug}`);
      });
    } else {
      console.log('✅ Verification passed: All partners have secure UUID format');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.close();
    console.log('\n🔗 MongoDB connection closed');
  }
}

// Run migration
console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║   Partner viewSlug Migration to Secure UUID Format       ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

migratePartnerSlugs()
  .then(() => {
    console.log('\n✅ Migration script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration script failed:', error);
    process.exit(1);
  });
