import { MongoClient, ObjectId } from 'mongodb';
import { optionalCameraUri, requireMessmassUri } from './lib/singleClusterConfig';

const CLUSTERS = [
  {
    name: 'Messmass (MONGODB_URI)',
    uri: requireMessmassUri(),
    hasCameraDb: Boolean(optionalCameraUri()),
  },
];

const SERIE_A_ORG_ID = new ObjectId('6a5e7c5396099ffc8fdcf567');
const AS_ROMA_PARTNER_ID = new ObjectId('68f6268feaea906244f28923');

async function run() {
  const nowIso = new Date().toISOString();

  for (const cluster of CLUSTERS) {
    console.log(`\n=== Fixing Serie A & AS Roma on ${cluster.name} ===`);
    const client = new MongoClient(cluster.uri);
    await client.connect();
    const db = client.db('messmass');

    // 1. Update organization in `organizations`
    const orgUpdateRes = await db.collection('organizations').updateOne(
      { _id: SERIE_A_ORG_ID },
      {
        $set: {
          name: 'Serie A - Lega Serie A',
          slug: 'serie-a',
          'metadata.name': 'Serie A - Lega Serie A',
          'metadata.orgType': 'league',
          'metadata.leagueTag': 'serie_a',
          'metadata.sport': 'football',
          'metadata.country': 'Italy',
          'metadata.emoji': '⚽',
          updatedAt: nowIso,
        },
      }
    );
    console.log(`Updated organization ${SERIE_A_ORG_ID} to "Serie A - Lega Serie A" (slug: serie-a): modified=${orgUpdateRes.modifiedCount}`);

    // If v3_organizations exists, sync it too
    await db.collection('v3_organizations').updateOne(
      { _id: SERIE_A_ORG_ID },
      {
        $set: {
          name: 'Serie A - Lega Serie A',
          slug: 'serie-a',
          type: 'league',
          sport: 'football',
          country: 'Italy',
          emoji: '⚽',
          updatedAt: nowIso,
        },
      }
    );

    // 2. Update partner AS Roma: ensure partnerKind is 'club' and organizationId points to Serie A
    const partnerUpdateRes = await db.collection('partners').updateOne(
      { _id: AS_ROMA_PARTNER_ID },
      {
        $set: {
          name: 'AS Roma',
          emoji: '⚽',
          organizationId: SERIE_A_ORG_ID,
          partnerKind: 'club',
          updatedAt: nowIso,
        },
      }
    );
    console.log(`Updated partner AS Roma (${AS_ROMA_PARTNER_ID}): modified=${partnerUpdateRes.modifiedCount}`);

    // 3. Ensure all AS Roma events link to partner AS Roma and organization Serie A
    const projectsUpdateRes = await db.collection('projects').updateMany(
      {
        $or: [
          { partner1: AS_ROMA_PARTNER_ID },
          { partner1Id: AS_ROMA_PARTNER_ID },
          { organizationId: SERIE_A_ORG_ID },
          { eventName: /^AS Roma/i },
          { eventName: /Lupetto Day/i },
        ],
      },
      {
        $set: {
          partner1: AS_ROMA_PARTNER_ID,
          partner1Id: AS_ROMA_PARTNER_ID,
          organizationId: SERIE_A_ORG_ID,
          updatedAt: nowIso,
        },
      }
    );
    console.log(`Updated AS Roma events to organization Serie A (${SERIE_A_ORG_ID}): matched=${projectsUpdateRes.matchedCount}, modified=${projectsUpdateRes.modifiedCount}`);

    // 4. Update Camera DB if present on this cluster
    if (cluster.hasCameraDb) {
      const cameraDb = client.db('camera');
      const camOrgRes = await cameraDb.collection('organizations').updateMany(
        {
          $or: [
            { messmassOrganizationId: SERIE_A_ORG_ID.toString() },
            { slug: 'as-roma' },
            { name: /AS Roma/i },
          ],
        },
        {
          $set: {
            name: 'Serie A - Lega Serie A',
            slug: 'serie-a',
            messmassOrganizationId: SERIE_A_ORG_ID.toString(),
            updatedAt: nowIso,
          },
        }
      );
      console.log(`Updated camera.organizations: modified=${camOrgRes.modifiedCount}`);

      // Ensure camera.partners for AS Roma is intact and linked to Serie A
      const camPartnerRes = await cameraDb.collection('partners').updateMany(
        {
          $or: [
            { messmassPartnerId: AS_ROMA_PARTNER_ID.toString() },
            { name: 'AS Roma' },
          ],
        },
        {
          $set: {
            name: 'AS Roma',
            messmassPartnerId: AS_ROMA_PARTNER_ID.toString(),
            organizationId: '8188935b-e5d5-4804-8ba6-48951922ca88',
            updatedAt: nowIso,
          },
        }
      );
      console.log(`Updated camera.partners: modified=${camPartnerRes.modifiedCount}`);
    }

    await client.close();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
