import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(config.dbName);
    const dbs = await client.db().admin().listDatabases();
    const collectionsMess = await client.db('messmass').listCollections().toArray();
    const docInMess = await client.db('messmass').collection('szrt_vision_progress').findOne();
    const docInConfigDb = await db.collection('szrt_vision_progress').findOne();
    const partnersCount = await client.db('messmass').collection('partners').countDocuments();

    // Mask URI for security: show only cluster host
    const rawUri = process.env.MONGODB_URI || '';
    const clusterHost = rawUri.includes('@') ? rawUri.split('@')[1].split('/')[0] : 'unknown';

    return NextResponse.json({
      clusterHost,
      configDbName: config.dbName,
      databases: dbs.databases.map((d: any) => d.name),
      allCollectionsInMessmass: collectionsMess.map((c: any) => c.name),
      partnersCount,
      docInMess: docInMess ? { count: docInMess.processedCount, total: docInMess.totalImages } : null,
      docInConfigDb: docInConfigDb ? { count: docInConfigDb.processedCount } : null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message, stack: err?.stack });
  }
}
