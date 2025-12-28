// scripts/debug-pull-endpoint.ts
// WHAT: Debug the Google Sheets pull endpoint to find why sync isn't working
// WHY: Test the actual sync flow end-to-end
// HOW: Simulate the pull request and log every step

import { config } from 'dotenv';
config({ path: '.env.local' });

import clientPromise from '../lib/mongodb';
import { pullEventsFromSheet } from '../lib/googleSheets/pullEvents';
import { readSheetRows } from '../lib/googleSheets/client';
import { rowsToEvents } from '../lib/googleSheets/rowMapper';
import { SHEET_COLUMN_MAP } from '../lib/googleSheets/columnMap';
import { default as libConfig } from '../lib/config';
import { ObjectId } from 'mongodb';

async function debugPullEndpoint() {
  try {
    console.log('🔍 Debugging Google Sheets Pull Endpoint\n');

    // Get database connection
    const client = await clientPromise;
    const db = client.db(libConfig.dbName);
    const partnersCollection = db.collection('partners');
    const projectsCollection = db.collection('projects');

    // Find Szerencsejáték Zrt. partner
    console.log('📍 Step 1: Finding Szerencsejáték Zrt. partner...');
    const partner = await partnersCollection.findOne({
      name: { $regex: 'Szerencsejáték', $options: 'i' }
    });

    if (!partner) {
      console.error('❌ Partner not found');
      return;
    }

    console.log(`✅ Found partner: ${partner.name}`);
    console.log(`   Partner ID: ${partner._id}`);
    console.log(`   Google Sheet Config:`, partner.googleSheetConfig);

    if (!partner.googleSheetConfig || !partner.googleSheetConfig.enabled) {
      console.error('❌ Google Sheets not configured for this partner');
      return;
    }

    const { sheetId, sheetName } = partner.googleSheetConfig;
    console.log(`\n📄 Step 2: Reading sheet data...`);
    console.log(`   Sheet ID: ${sheetId}`);
    console.log(`   Sheet Name: ${sheetName}`);

    // Read the header row first
    try {
      const headerRow = await readSheetRows(sheetId, sheetName, 1);
      console.log(`✅ Header row read successfully (${headerRow.length} cells)`);
      console.log(`   First 10 headers: ${headerRow[0]?.slice(0, 10).join(' | ')}`);
    } catch (error) {
      console.error('❌ Failed to read header:', error instanceof Error ? error.message : error);
      return;
    }

    // Read data rows
    try {
      const rows = await readSheetRows(sheetId, sheetName, 2);
      console.log(`✅ Data rows read successfully (${rows.length} rows)`);

      if (rows.length === 0) {
        console.log('⚠️ No data rows found in sheet');
        return;
      }

      // Show first row for inspection
      console.log(`\n📋 Step 3: Inspecting first data row...`);
      const firstRow = rows[0];
      console.log(`   Row has ${firstRow.length} cells`);
      console.log(`   Cell 0 (UUID): ${firstRow[0]}`);
      console.log(`   Cell 1 (Partner 1): ${firstRow[1]}`);
      console.log(`   Cell 5 (Event Date): ${firstRow[5]}`);
      console.log(`   Cell 32 (Remote Images): ${firstRow[32]}`);
      console.log(`   Cell 27 (Remote Fans): ${firstRow[27]}`);

      // Test row mapping
      console.log(`\n🔄 Step 4: Testing row to event conversion...`);
      const { events, errors } = rowsToEvents(rows, SHEET_COLUMN_MAP);
      
      console.log(`✅ Conversion completed`);
      console.log(`   Successful events: ${events.length}`);
      console.log(`   Errors: ${errors.length}`);

      if (errors.length > 0) {
        console.error('❌ Conversion errors:');
        errors.forEach(err => {
          console.error(`   Row ${err.row}: ${err.error}`);
        });
      }

      if (events.length > 0) {
        console.log(`\n📊 First converted event:`);
        const firstEvent = events[0];
        console.log(`   eventName: ${firstEvent.eventName}`);
        console.log(`   eventDate: ${firstEvent.eventDate}`);
        console.log(`   googleSheetUuid: ${firstEvent.googleSheetUuid}`);
        console.log(`   stats.remoteImages: ${firstEvent.stats?.remoteImages}`);
        console.log(`   stats.hostessImages: ${firstEvent.stats?.hostessImages}`);
        console.log(`   stats.remoteFans: ${firstEvent.stats?.remoteFans}`);
      }

      // Check if events already exist
      console.log(`\n🔍 Step 5: Checking existing events in database...`);
      const existingCount = await projectsCollection.countDocuments({
        googleSheetUuid: { $exists: true }
      });
      console.log(`   Events with googleSheetUuid: ${existingCount}`);

      // Try to check if any of these UUIDs exist
      if (events.length > 0) {
        const firstUuid = rows[0][0]; // UUID from sheet
        const existing = await projectsCollection.findOne({
          googleSheetUuid: firstUuid
        });
        
        if (existing) {
          console.log(`✅ Event with UUID ${firstUuid} exists in database`);
          console.log(`   Existing event ID: ${existing._id}`);
          console.log(`   Existing stats.remoteImages: ${existing.stats?.remoteImages}`);
        } else {
          console.log(`ℹ️ Event with UUID ${firstUuid} does NOT exist in database (would be created)`);
        }
      }

    } catch (error) {
      console.error('❌ Failed to read data rows:', error instanceof Error ? error.message : error);
      return;
    }

    console.log(`\n✅ Debug complete - all steps passed`);

  } catch (error) {
    console.error('💥 Unexpected error:', error instanceof Error ? error.message : error);
  }
}

debugPullEndpoint();
