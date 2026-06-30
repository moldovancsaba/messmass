// WHAT: Migrate partners with legacy or missing viewSlug values to UUID v4
// WHY: Canonical UUID viewSlug values reduce guessable URLs while preserving old links safely
// HOW: Move legacy slugs into legacyViewSlugs, assign a new UUID v4 as viewSlug, and clone partner password rows

import { MongoClient, ObjectId } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { randomUUID } from 'crypto';

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

function isCanonicalPartnerSlug(str: string): boolean {
  return UUID_V4_PATTERN.test(str);
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function generateUniquePartnerSlug(partnersCollection: any): Promise<string> {
  let slug = randomUUID();
  while (
    await partnersCollection.findOne({
      $or: [
        { viewSlug: slug },
        { legacyViewSlugs: slug },
      ],
    })
  ) {
    slug = randomUUID();
  }
  return slug;
}

async function clonePagePasswords(db: any, oldSlug: string, newSlug: string) {
  const passwords = db.collection('page_passwords');
  const rows = await passwords
    .find({
      pageType: { $in: ['partner-report', 'partner-edit'] },
      $or: [
        { pageId: oldSlug },
        { pageId: { $regex: `^${escapeRegex(oldSlug)}::variant=` } },
      ],
    })
    .toArray();

  let cloned = 0;
  for (const row of rows) {
    const nextPageId = row.pageId === oldSlug
      ? newSlug
      : row.pageId.replace(`${oldSlug}::variant=`, `${newSlug}::variant=`);

    await passwords.updateOne(
      { pageId: nextPageId, pageType: row.pageType },
      {
        $setOnInsert: {
          pageId: nextPageId,
          pageType: row.pageType,
          password: row.password,
          createdAt: row.createdAt,
          expiresAt: row.expiresAt,
          usageCount: row.usageCount || 0,
          lastUsedAt: row.lastUsedAt,
        },
      },
      { upsert: true }
    );
    cloned += 1;
  }

  return cloned;
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
    await partnersCollection.createIndex({ viewSlug: 1 }, { unique: true, sparse: true, name: 'viewSlug_unique' });
    await partnersCollection.createIndex({ legacyViewSlugs: 1 }, { sparse: true, name: 'legacyViewSlugs_lookup' });
    
    // Fetch all partners
    const allPartners = await partnersCollection.find({}).toArray();
    console.log(`📊 Found ${allPartners.length} partners in database\n`);
    
    // Analyze partners
    const legacyPartners: any[] = [];
    const securePartners: any[] = [];
    const noSlugPartners: any[] = [];
    
    for (const partner of allPartners) {
      if (!partner.viewSlug) {
        noSlugPartners.push(partner);
      } else if (isCanonicalPartnerSlug(partner.viewSlug)) {
        securePartners.push(partner);
      } else {
        legacyPartners.push(partner);
      }
    }
    
    console.log('📈 Analysis:');
    console.log(`  ✅ Secure partners (UUID format): ${securePartners.length}`);
    console.log(`  ❌ Legacy partners (non-UUID): ${legacyPartners.length}`);
    console.log(`  ⚠️  Partners without viewSlug: ${noSlugPartners.length}\n`);
    
    if (legacyPartners.length === 0 && noSlugPartners.length === 0) {
      console.log('✅ All partners already have canonical UUID viewSlug values. Nothing to migrate.');
      return;
    }
    
    // Show partners that need migration
    if (legacyPartners.length > 0) {
      console.log('❌ Partners with legacy viewSlug values:');
      legacyPartners.forEach(p => {
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
    console.log('  1. Partners with legacy viewSlug → move old slug into legacyViewSlugs and assign new UUID v4');
    console.log('  2. Partners without viewSlug → assign new UUID v4');
    console.log('  3. Clone partner-report and partner-edit page passwords to the new canonical slug');
    console.log('  4. Partners already on UUID v4 → no changes\n');
    
    console.log('⚠️  IMPORTANT: Public partner URLs will move to UUID v4 while preserving redirects from old slugs.');
    console.log('   Old: /partner-report/mtk-budapest');
    console.log('   New: /partner-report/11329474-28a3-4089-8d28-1938689339a1\n');
    
    // Perform migration
    let migratedCount = 0;
    const partnersToMigrate = [...legacyPartners, ...noSlugPartners];
    
    console.log(`🚀 Migrating ${partnersToMigrate.length} partners...\n`);
    
    for (const partner of partnersToMigrate) {
      const partnerId = partner._id;
      const partnerName = partner.name;
      const oldViewSlug = partner.viewSlug || '(none)';
      const newViewSlug = await generateUniquePartnerSlug(partnersCollection);
      const legacyViewSlugs = Array.from(
        new Set(
          [
            ...(Array.isArray(partner.legacyViewSlugs) ? partner.legacyViewSlugs : []),
            ...(partner.viewSlug ? [partner.viewSlug] : []),
          ]
            .map((value: unknown) => String(value || '').trim())
            .filter(Boolean)
            .filter((value: string) => value !== newViewSlug)
        )
      );
      
      // Update partner
      await partnersCollection.updateOne(
        { _id: partnerId },
        { 
          $set: { 
            viewSlug: newViewSlug,
            legacyViewSlugs,
            updatedAt: new Date().toISOString()
          } 
        }
      );

      const clonedPasswords = partner.viewSlug
        ? await clonePagePasswords(db, partner.viewSlug, newViewSlug)
        : 0;
      
      migratedCount++;
      console.log(`  ✅ ${migratedCount}/${partnersToMigrate.length} - ${partnerName}`);
      console.log(`     Old: ${oldViewSlug} → New: ${newViewSlug}`);
      if (legacyViewSlugs.length > 0) {
        console.log(`     Legacy aliases: ${legacyViewSlugs.join(', ')}`);
      }
      if (clonedPasswords > 0) {
        console.log(`     Cloned page passwords: ${clonedPasswords}`);
      }
    }
    
    console.log(`\n✅ Migration complete! Updated ${migratedCount} partners.`);
    console.log('\n📋 Summary:');
    console.log(`  - Total partners: ${allPartners.length}`);
    console.log(`  - Already secure: ${securePartners.length}`);
    console.log(`  - Migrated: ${migratedCount}`);
    console.log(`  - All migrated partners now have canonical UUID viewSlug values ✅\n`);
    
    // Final verification
    const allPartnersAfter = await partnersCollection.find({}).toArray();
    const stillLegacy = allPartnersAfter.filter((p: any) =>
      p.viewSlug && !isCanonicalPartnerSlug(p.viewSlug)
    );
    
    if (stillLegacy.length > 0) {
      console.log('⚠️  WARNING: Some partners still have legacy viewSlug values:');
      stillLegacy.forEach((p: any) => {
        console.log(`  - ${p.name}: ${p.viewSlug}`);
      });
    } else {
      console.log('✅ Verification passed: All partner viewSlug values are canonical UUID v4');
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
