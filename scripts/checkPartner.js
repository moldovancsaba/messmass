const { MongoClient, ObjectId } = require('mongodb');

const PARTNER_ID = '694a96990ad78323bea10660';

async function main() {
  let mongoClient;
  try {
    const mongoUri = process.env.MONGODB_URI;
    mongoClient = new MongoClient(mongoUri);
    await mongoClient.connect();
    const db = mongoClient.db('messmass');

    console.log('🔍 Checking Szerencsejáték Zrt. partner configuration...\n');

    // Find partner
    const partner = await db.collection('partners').findOne({
      _id: new ObjectId(PARTNER_ID)
    });

    if (!partner) {
      console.error(`❌ Partner not found with ID: ${PARTNER_ID}`);
      process.exit(1);
    }

    console.log('=== PARTNER INFO ===');
    console.log(`Name: ${partner.name}`);
    console.log(`ID: ${partner._id}`);
    console.log(`Google Sheets URL: ${partner.googleSheetsUrl || 'Not set'}`);
    console.log('\n');

    console.log('=== GOOGLE SHEETS CONFIG ===');
    if (partner.googleSheetConfig) {
      console.log(`Enabled: ${partner.googleSheetConfig.enabled}`);
      console.log(`Sheet ID: ${partner.googleSheetConfig.sheetId}`);
      console.log(`Sheet Name: ${partner.googleSheetConfig.sheetName}`);
      console.log(`Sync Mode: ${partner.googleSheetConfig.syncMode}`);
      console.log(`Last Sync At: ${partner.googleSheetConfig.lastSyncAt || 'Never'}`);
      console.log(`Last Sync Status: ${partner.googleSheetConfig.lastSyncStatus || 'Never'}`);
      console.log(`Last Sync Error: ${partner.googleSheetConfig.lastSyncError || 'None'}`);
    } else {
      console.log('No Google Sheets config found!');
    }
    console.log('\n');

    console.log('=== GOOGLE SHEETS STATS ===');
    if (partner.googleSheetStats) {
      console.log(`Total Events: ${partner.googleSheetStats.totalEvents || 0}`);
      console.log(`Events Created: ${partner.googleSheetStats.eventsCreated || 0}`);
      console.log(`Events Updated: ${partner.googleSheetStats.eventsUpdated || 0}`);
      console.log(`Pull Count: ${partner.googleSheetStats.pullCount || 0}`);
      console.log(`Push Count: ${partner.googleSheetStats.pushCount || 0}`);
    } else {
      console.log('No Google Sheets stats found!');
    }
    console.log('\n');

    // Check for events with various partner references
    console.log('=== CHECKING EVENTS IN DATABASE ===');
    const eventsByPartnerIdStr = await db.collection('projects')
      .find({ partnerId: PARTNER_ID })
      .toArray();
    console.log(`Events with partnerId (string): ${eventsByPartnerIdStr.length}`);

    const eventsByPartnerIdObj = await db.collection('projects')
      .find({ partnerId: new ObjectId(PARTNER_ID) })
      .toArray();
    console.log(`Events with partnerId (ObjectId): ${eventsByPartnerIdObj.length}`);

    const eventsByPartnerName = await db.collection('projects')
      .find({ partnerName: 'Szerencsejáték Zrt.' })
      .toArray();
    console.log(`Events with partnerName: ${eventsByPartnerName.length}`);

    const eventsByGoogleSheetUuid = await db.collection('projects')
      .find({ googleSheetUuid: { $exists: true } })
      .toArray();
    console.log(`Events with googleSheetUuid (any): ${eventsByGoogleSheetUuid.length}`);

    if (eventsByGoogleSheetUuid.length > 0) {
      console.log('\n=== FIRST EVENT WITH GOOGLE SHEET UUID ===');
      const evt = eventsByGoogleSheetUuid[0];
      console.log(`Event: ${evt.eventName}`);
      console.log(`Google Sheet UUID: ${evt.googleSheetUuid}`);
      console.log(`Partner ID: ${evt.partnerId}`);
      console.log(`Partner Name: ${evt.partnerName}`);
      console.log(`Created At: ${evt.createdAt}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (mongoClient) {
      await mongoClient.close();
    }
  }
}

main();
