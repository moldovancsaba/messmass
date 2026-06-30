import { MongoClient, ObjectId } from 'mongodb';
import { isUuidV4 } from '../lib/partnerIdentifier';

type PartnerRow = {
  _id: ObjectId;
  name?: string;
  viewSlug?: string | null;
  reportTemplateId?: ObjectId | string | null;
  styleId?: ObjectId | string | null;
};

function requireMongoUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri || (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://'))) {
    throw new Error('Missing or invalid MONGODB_URI. Expected mongodb:// or mongodb+srv://.');
  }
  return uri;
}

async function main() {
  const uri = requireMongoUri();
  const dbName = process.env.MONGODB_DB || 'messmass';
  const jsonOutput = process.argv.includes('--json');
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(dbName);
    const partners = await db
      .collection<PartnerRow>('partners')
      .find({})
      .project({ name: 1, viewSlug: 1, reportTemplateId: 1, styleId: 1 })
      .sort({ name: 1 })
      .toArray();

    const missing = partners.filter((partner) => typeof partner.viewSlug !== 'string' || partner.viewSlug.trim() === '');
    const uuid = partners.filter((partner) => typeof partner.viewSlug === 'string' && isUuidV4(partner.viewSlug));
    const objectIdLike = partners.filter(
      (partner) =>
        typeof partner.viewSlug === 'string' &&
        !isUuidV4(partner.viewSlug) &&
        ObjectId.isValid(partner.viewSlug)
    );
    const legacy = partners.filter(
      (partner) =>
        typeof partner.viewSlug === 'string' &&
        partner.viewSlug.trim() !== '' &&
        !isUuidV4(partner.viewSlug) &&
        !ObjectId.isValid(partner.viewSlug)
    );

    const summary = {
      auditedAt: new Date().toISOString(),
      totalPartners: partners.length,
      uuidViewSlugs: uuid.length,
      objectIdLikeViewSlugs: objectIdLike.length,
      legacyViewSlugs: legacy.length,
      missingViewSlugs: missing.length,
      legacyPartners: legacy.map((partner) => ({
        id: String(partner._id),
        name: partner.name || '(unnamed partner)',
        viewSlug: partner.viewSlug,
        reportTemplateId: partner.reportTemplateId ? String(partner.reportTemplateId) : null,
        styleId: partner.styleId ? String(partner.styleId) : null,
      })),
    };

    if (jsonOutput) {
      console.log(JSON.stringify(summary, null, 2));
      return;
    }

    console.log('Partner viewSlug audit');
    console.log(`Database: ${dbName}`);
    console.log(`Audited at: ${summary.auditedAt}`);
    console.log(`Total partners: ${summary.totalPartners}`);
    console.log(`UUID v4 viewSlugs: ${summary.uuidViewSlugs}`);
    console.log(`ObjectId-like viewSlugs: ${summary.objectIdLikeViewSlugs}`);
    console.log(`Legacy non-UUID viewSlugs: ${summary.legacyViewSlugs}`);
    console.log(`Missing viewSlugs: ${summary.missingViewSlugs}`);

    if (summary.legacyPartners.length > 0) {
      console.log('\nLegacy partner slugs:');
      summary.legacyPartners.forEach((partner, index) => {
        console.log(`${index + 1}. ${partner.name} -> ${partner.viewSlug}`);
      });
    }
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
