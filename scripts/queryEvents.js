const { MongoClient } = require('mongodb');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const PARTNER_ID = '694a96990ad78323bea10660';
const SHEET_ID = '1W1GJX874wYmL5rJ6HviarC1q-GrZ6tYEUBQc1KuT96w';
const SHEET_NAME = 'Events';

// Initialize Sheets client
function createSheetsClient() {
  const jsonPath = path.join(process.cwd(), '.google-service-account.json');
  if (fs.existsSync(jsonPath)) {
    try {
      const keyFile = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
      const auth = new google.auth.JWT({
        email: keyFile.client_email,
        key: keyFile.private_key,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });
      return google.sheets({ version: 'v4', auth });
    } catch (error) {
      console.error('Failed to load credentials:', error);
      throw error;
    }
  }
  throw new Error('Missing .google-service-account.json');
}

async function main() {
  let mongoClient;
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not set');
    }

    mongoClient = new MongoClient(mongoUri);
    await mongoClient.connect();
    const db = mongoClient.db(process.env.MONGODB_DB || 'messmass');

    console.log('🔍 Querying Szerencsejáték Zrt. events...\n');

    // Query database events
    const dbEvents = await db.collection('projects')
      .find({ partnerId: PARTNER_ID })
      .sort({ createdAt: 1 })
      .toArray();

    console.log(`📊 Database Events: ${dbEvents.length} found\n`);

    if (dbEvents.length > 0) {
      console.log('=== FIRST DATABASE EVENT ===');
      const sample = dbEvents[0];
      console.log(`ID: ${sample._id}`);
      console.log(`Event Name: ${sample.eventName}`);
      console.log(`Event Date: ${sample.eventDate}`);
      console.log(`Created At: ${sample.createdAt}`);
      console.log(`Updated At: ${sample.updatedAt}`);
      const statsKeys = Object.keys(sample.stats || {}).sort();
      console.log(`Stats Keys (${statsKeys.length}): ${statsKeys.slice(0, 20).join(', ')}${statsKeys.length > 20 ? '...' : ''}`);
      console.log(`\nSample Stats Values:`);
      console.log(`  totalGames: ${sample.stats?.totalGames}`);
      console.log(`  gamesWithoutAds: ${sample.stats?.gamesWithoutAds}`);
      console.log(`  gamesWithAds: ${sample.stats?.gamesWithAds}`);
      console.log(`  eventAttendees: ${sample.stats?.eventAttendees}`);
      console.log(`  uniqueUsers: ${sample.stats?.uniqueUsers}`);
      console.log('\n');
    }

    // Query sheet data
    console.log('📑 Reading Google Sheet...\n');
    try {
      const sheets = createSheetsClient();
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `${SHEET_NAME}!A2:EG100`
      });

      const sheetRows = response.data.values || [];
      console.log(`Sheet Rows: ${sheetRows.length} found\n`);

      if (sheetRows.length > 0) {
        console.log('=== FIRST SHEET ROW ===');
        const row = sheetRows[0];
        console.log(`UUID (A): ${row[0]}`);
        console.log(`Partner 1 (B): ${row[1]}`);
        console.log(`Partner 2 (C): ${row[2]}`);
        console.log(`Event Title (D): ${row[3]}`);
        console.log(`Event Name (E): ${row[4]}`);
        console.log(`Event Date (F): ${row[5]}`);
        console.log(`Total Games (G): ${row[6]}`);
        console.log(`Games No Ads (H): ${row[7]}`);
        console.log(`Games With Ads (I): ${row[8]}`);
        console.log(`Event Attendees (O): ${row[14]}`);
        console.log(`Unique Users (P): ${row[15]}`);
        console.log(`Row Length: ${row.length}`);
        console.log('\n');
      }

      // Compare
      if (dbEvents.length > 0 && sheetRows.length > 0) {
        console.log('=== COMPARISON (First Event vs First Row) ===');
        const dbEvent = dbEvents[0];
        const sheetRow = sheetRows[0];

        console.log(`Event Names Match: ${dbEvent.eventName === sheetRow[4]}`);
        console.log(`  DB: "${dbEvent.eventName}"`);
        console.log(`  Sheet: "${sheetRow[4]}"\n`);

        console.log(`Event Dates Match: ${dbEvent.eventDate === sheetRow[5]}`);
        console.log(`  DB: "${dbEvent.eventDate}"`);
        console.log(`  Sheet: "${sheetRow[5]}"\n`);

        console.log(`Stats Comparison:`);
        console.log(`  totalGames: DB=${dbEvent.stats?.totalGames} vs Sheet=${sheetRow[6]}`);
        console.log(`  gamesWithoutAds: DB=${dbEvent.stats?.gamesWithoutAds} vs Sheet=${sheetRow[7]}`);
        console.log(`  gamesWithAds: DB=${dbEvent.stats?.gamesWithAds} vs Sheet=${sheetRow[8]}`);
        console.log(`  eventAttendees: DB=${dbEvent.stats?.eventAttendees} vs Sheet=${sheetRow[14]}`);
        console.log(`  uniqueUsers: DB=${dbEvent.stats?.uniqueUsers} vs Sheet=${sheetRow[15]}\n`);

        // Check if UUID matches
        console.log(`UUID Match: ${dbEvent._id.toString() === sheetRow[0]}`);
        console.log(`  DB ID: ${dbEvent._id}`);
        console.log(`  Sheet UUID: ${sheetRow[0]}`);
      }

    } catch (sheetError) {
      console.error('❌ Failed to read sheet:', sheetError.message);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    if (mongoClient) {
      await mongoClient.close();
    }
  }
}

main();
