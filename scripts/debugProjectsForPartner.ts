// scripts/debugProjectsForPartner.ts
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';
import { ObjectId } from 'mongodb';

async function main() {
  const partnerName = process.argv.slice(2).join(' ') || 'Szerencsejáték Zrt.';
  const client = await clientPromise;
  const db = client.db(config.dbName);

  const partner = await db.collection('partners').findOne({ name: partnerName });
  console.log('Partner doc:', partner ? { _id: String(partner._id), name: partner.name } : 'NOT FOUND');

  const partnerId = partner?._id as ObjectId | undefined;

  const or: any[] = [];
  if (partnerId) {
    or.push({ partnerId: partnerId });
    or.push({ 'partnerContext.partnerId': partnerId });
    or.push({ partnerUUID: String(partnerId) });
  }
  or.push({ partnerName: { $regex: partnerName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } });
  or.push({ 'partnerContext.partnerName': { $regex: partnerName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } });

  const cursor = db.collection('projects').find({ $or: or }).project({ _id: 1, eventName: 1, partnerId: 1, partnerName: 1, partnerContext: 1 }).limit(20);
  const docs = await cursor.toArray();
  console.log(`Found ${docs.length} projects matching partner criteria`);
  console.log(JSON.stringify(docs.map(d => ({
    _id: String(d._id),
    eventName: d.eventName,
    partnerId: d.partnerId,
    partnerIdType: d.partnerId ? typeof d.partnerId : null,
    partnerName: d.partnerName,
    partnerContext: d.partnerContext
  })), null, 2));
}

main().catch(e => { console.error(e); process.exit(1); });
