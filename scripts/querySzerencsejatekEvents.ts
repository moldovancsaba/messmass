// scripts/querySzerencsejatekEvents.ts
// WHAT: Query Szerencsejáték Zrt. events and sheet data for comparison
// WHY: Investigate discrepancies in sheet sync

import clientPromise from '../lib/mongodb';
import config from '../lib/config';
import { readSheetRows } from '../lib/googleSheets/client';

const PARTNER_ID = '694a96990ad78323bea10660';
const SHEET_ID = '1W1GJX874wYmL5rJ6HviarC1q-GrZ6tYEUBQc1KuT96w';
const SHEET_NAME = 'Events';

async function main() {
  try {
    const client = await clientPromise;
    const db = client.db(config.dbName);

    console.log('🔍 Querying Szerencsejáték Zrt. events...\n');

    // Query events in database
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
      console.log(`Stats Keys: ${Object.keys(sample.stats || {}).sort().join(', ')}`);
      console.log(`Sample Stats:`, {
        totalGames: sample.stats?.totalGames,
        gamesWithoutAds: sample.stats?.gamesWithoutAds,
        gamesWithAds: sample.stats?.gamesWithAds,
        eventAttendees: sample.stats?.eventAttendees,
        uniqueUsers: sample.stats?.uniqueUsers,
      });
      console.log('\n');
    }

    // Query sheet data
    console.log('📑 Reading Google Sheet...\n');
    try {
      const sheetRows = await readSheetRows(SHEET_ID, SHEET_NAME, 2);
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

      // Compare specific events
      if (dbEvents.length > 0 && sheetRows.length > 0) {
        console.log('=== COMPARISON ===');
        const dbEvent = dbEvents[0];
        const sheetRow = sheetRows[0];
        
        console.log(`✓ Event Names Match: ${dbEvent.eventName === sheetRow[4]} (DB: "${dbEvent.eventName}", Sheet: "${sheetRow[4]}")`);
        console.log(`✓ Event Dates Match: ${dbEvent.eventDate === sheetRow[5]} (DB: "${dbEvent.eventDate}", Sheet: "${sheetRow[5]}")`);
        console.log(`✓ Stats.totalGames: DB=${dbEvent.stats?.totalGames} vs Sheet=${sheetRow[6]}`);
        console.log(`✓ Stats.gamesWithoutAds: DB=${dbEvent.stats?.gamesWithoutAds} vs Sheet=${sheetRow[7]}`);
        console.log(`✓ Stats.gamesWithAds: DB=${dbEvent.stats?.gamesWithAds} vs Sheet=${sheetRow[8]}`);
      }

    } catch (sheetError) {
      console.error('❌ Failed to read sheet:', sheetError);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
