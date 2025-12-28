const { MongoClient, ObjectId } = require('mongodb');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const PARTNER_ID = '694a96990ad78323bea10660';
const SHEET_ID = '1W1GJX874wYmL5rJ6HviarC1q-GrZ6tYEUBQc1KuT96w';
const SHEET_NAME = 'Events';

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
      throw error;
    }
  }
  throw new Error('Missing .google-service-account.json');
}

async function main() {
  let mongoClient;
  try {
    const mongoUri = process.env.MONGODB_URI;
    mongoClient = new MongoClient(mongoUri);
    await mongoClient.connect();
    const db = mongoClient.db('messmass');

    console.log('🔍 Comparing Sheet vs Database for Szerencsejáték Zrt.\n');

    // Get sheet data
    const sheets = createSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A2:EG100`
    });

    const sheetRows = response.data.values || [];
    console.log(`📑 Sheet has ${sheetRows.length} rows\n`);

    // Get all events with googleSheetUuid
    const dbEvents = await db.collection('projects')
      .find({ googleSheetUuid: { $exists: true, $ne: null } })
      .toArray();

    console.log(`📊 Database has ${dbEvents.length} total events with googleSheetUuid\n`);

    // Column indices (0-based)
    const colUUID = 0;          // A
    const colEventName = 4;     // E
    const colEventDate = 5;     // F
    const colTotalGames = 6;    // G
    const colGamesNoAds = 7;    // H
    const colGamesWithAds = 8;  // I

    console.log('=== COMPARING FIRST 5 SHEET ROWS ===\n');

    for (let i = 0; i < Math.min(5, sheetRows.length); i++) {
      const sheetRow = sheetRows[i];
      const sheetUUID = sheetRow[colUUID];
      const sheetEventName = sheetRow[colEventName];
      const sheetEventDate = sheetRow[colEventDate];
      const sheetTotalGames = sheetRow[colTotalGames];

      // Find matching event in database
      const dbEvent = dbEvents.find(e => e.googleSheetUuid === sheetUUID);

      console.log(`Row ${i + 2}:`);
      console.log(`  Sheet UUID: ${sheetUUID}`);
      
      if (dbEvent) {
        console.log(`  ✅ FOUND in DB`);
        console.log(`    Event Name: "${dbEvent.eventName}" vs Sheet "${sheetEventName}" - ${dbEvent.eventName === sheetEventName ? '✓' : '❌'}`);
        console.log(`    Event Date: "${dbEvent.eventDate}" vs Sheet "${sheetEventDate}" - ${dbEvent.eventDate === sheetEventDate ? '✓' : '❌'}`);
        console.log(`    Total Games: ${dbEvent.stats?.totalGames} vs Sheet ${sheetTotalGames} - ${dbEvent.stats?.totalGames == sheetTotalGames ? '✓' : '❌'}`);
        console.log(`    Games No Ads: ${dbEvent.stats?.gamesWithoutAds} vs Sheet ${sheetRow[colGamesNoAds]} - ${dbEvent.stats?.gamesWithoutAds == sheetRow[colGamesNoAds] ? '✓' : '❌'}`);
        console.log(`    Games With Ads: ${dbEvent.stats?.gamesWithAds} vs Sheet ${sheetRow[colGamesWithAds]} - ${dbEvent.stats?.gamesWithAds == sheetRow[colGamesWithAds] ? '✓' : '❌'}`);
        console.log(`    Partner ID: ${dbEvent.partnerId}`);
      } else {
        console.log(`  ❌ NOT FOUND in DB`);
      }
      console.log('');
    }

    // Summary
    console.log('=== SUMMARY ===');
    const matchCount = sheetRows.slice(0, 5).filter(row => {
      return dbEvents.find(e => e.googleSheetUuid === row[colUUID]);
    }).length;
    console.log(`Found ${matchCount} out of ${Math.min(5, sheetRows.length)} sheet rows in database`);
    
    if (matchCount < sheetRows.length) {
      console.log(`\n⚠️ Missing ${sheetRows.length - matchCount} events from database!`);
      console.log('\nMissing Sheet UUIDs:');
      sheetRows.forEach((row, i) => {
        const sheetUUID = row[colUUID];
        if (!dbEvents.find(e => e.googleSheetUuid === sheetUUID)) {
          console.log(`  Row ${i + 2}: ${sheetUUID} - ${row[colEventName]}`);
        }
      });
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
