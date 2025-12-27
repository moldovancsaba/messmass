// scripts/debugFindEvent.ts
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';

async function main() {
  const client = await clientPromise;
  const db = client.db(config.dbName);

  const name = process.argv.slice(2).join(' ') || '45. heti statisztika';
  console.log(`🔎 Searching projects for eventName == "${name}" or title match...`);

  const doc = await db.collection('projects').findOne({
    $or: [
      { eventName: name },
      { title: name },
      { eventTitle: name }
    ]
  });

  if (!doc) {
    console.log('❌ Not found');
    process.exit(0);
  }

  // Print key fields to understand linkage
  const out: any = {
    _id: String(doc._id),
    eventName: doc.eventName,
    eventDate: doc.eventDate,
    title: doc.title,
    eventTitle: doc.eventTitle,
    partnerId: doc.partnerId,
    partnerName: doc.partnerName,
    partner: doc.partner,
    partnerSlug: doc.partnerSlug,
    partnerUUID: doc.partnerUUID,
    partnerContext: doc.partnerContext,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    statsKeys: doc.stats ? Object.keys(doc.stats).length : 0,
    statsSample: doc.stats ? Object.fromEntries(Object.entries(doc.stats).slice(0,10)) : undefined,
  };

  console.log(JSON.stringify(out, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
