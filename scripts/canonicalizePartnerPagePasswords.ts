// WHAT: Backfill canonical UUID page-password rows for partner report/edit pages
// WHY: Older share flows stored partner ObjectId or legacy slug identifiers, which keeps surfacing non-canonical URLs
// HOW: Resolve each partner pageId to the canonical UUID viewSlug and upsert a matching page_passwords row

import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { resolvePartnerIdentifier } from '../lib/partnerIdentifier';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || '';
const MONGODB_DB = process.env.MONGODB_DB || process.env.MONGODB_DATABASE || 'messmass';

function parseVariantPageId(pageId: string): { basePageId: string; variantSlug: string | null } {
  const [basePageId, variantPart] = pageId.split('::variant=');
  return {
    basePageId,
    variantSlug: variantPart || null,
  };
}

async function canonicalizePartnerPagePasswords() {
  if (!MONGODB_URI) {
    throw new Error('Missing MONGODB_URI or MONGO_URI');
  }

  const client = new MongoClient(MONGODB_URI);

  try {
    console.log('🔗 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(MONGODB_DB);
    const collection = db.collection('page_passwords');
    const partnerRows = await collection
      .find({ pageType: { $in: ['partner-report', 'partner-edit'] } })
      .toArray();

    let inserted = 0;
    let alreadyCanonical = 0;
    let unresolved = 0;

    for (const row of partnerRows) {
      const { basePageId, variantSlug } = parseVariantPageId(String(row.pageId || ''));
      const resolved = await resolvePartnerIdentifier(db as any, basePageId);

      if (!resolved?.canonicalSlug) {
        unresolved += 1;
        console.log(`⚠️  Unresolved page password row: ${row.pageType} ${row.pageId}`);
        continue;
      }

      const canonicalPageId = variantSlug
        ? `${resolved.canonicalSlug}::variant=${variantSlug}`
        : resolved.canonicalSlug;

      if (canonicalPageId === row.pageId) {
        alreadyCanonical += 1;
        continue;
      }

      await collection.updateOne(
        { pageId: canonicalPageId, pageType: row.pageType },
        {
          $setOnInsert: {
            pageId: canonicalPageId,
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

      inserted += 1;
      console.log(`✅ ${row.pageType}: ${row.pageId} → ${canonicalPageId}`);
    }

    console.log('\n📋 Summary');
    console.log(`  Total partner page passwords: ${partnerRows.length}`);
    console.log(`  Canonical rows already present: ${alreadyCanonical}`);
    console.log(`  Canonical rows upserted: ${inserted}`);
    console.log(`  Unresolved rows: ${unresolved}`);
  } finally {
    await client.close();
    console.log('🔗 MongoDB connection closed');
  }
}

canonicalizePartnerPagePasswords().catch((error) => {
  console.error('❌ Failed to canonicalize partner page passwords');
  console.error(error);
  process.exit(1);
});
