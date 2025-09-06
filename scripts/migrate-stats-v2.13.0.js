// scripts/migrate-stats-v2.13.0.js
// Purpose: Migrate existing projects' stats to new schema conveniences
// - remoteFans = indoor + outdoor
// - socialVisit = sum of individual social visits
// - remove eventTicketPurchases field
// Notes:
// - Keeps original fields for backward compatibility
// - Idempotent: safe to run multiple times

const { MongoClient, ObjectId } = require('mongodb');
const config = require('./config');

async function run() {
  const client = new MongoClient(config.mongodbUri);
  try {
    await client.connect();
    const db = client.db(config.dbName);
    const projects = db.collection('projects');

    const cursor = projects.find({});
    let updated = 0;
    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      const s = doc.stats || {};
      const indoor = Number(s.indoor || 0);
      const outdoor = Number(s.outdoor || 0);
      const stadium = Number(s.stadium || 0);

      const visitFacebook = Number(s.visitFacebook || 0);
      const visitInstagram = Number(s.visitInstagram || 0);
      const visitYoutube = Number(s.visitYoutube || 0);
      const visitTiktok = Number(s.visitTiktok || 0);
      const visitX = Number(s.visitX || 0);
      const visitTrustpilot = Number(s.visitTrustpilot || 0);

      const remoteFans = indoor + outdoor;
      const socialVisit = visitFacebook + visitInstagram + visitYoutube + visitTiktok + visitX + visitTrustpilot;

      const $set = { 'stats.remoteFans': remoteFans, 'stats.socialVisit': socialVisit, updatedAt: new Date().toISOString() };
      const $unset = { 'stats.eventTicketPurchases': '' };

      await projects.updateOne({ _id: new ObjectId(doc._id) }, { $set, $unset });
      updated += 1;
    }

    console.log(`✅ Migration complete. Updated ${updated} project(s).`);
    process.exit(0);
  } catch (e) {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  } finally {
    await client.close();
  }
}

run();

