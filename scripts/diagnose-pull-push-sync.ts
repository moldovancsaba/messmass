/**
 * Pull/Push Sync Diagnostic Script
 * 
 * WHAT: Diagnose why Pull operation reports "created 0, updated 0"
 * WHY: User reports Pull doesn't detect changes even after modifying sheet data
 * HOW: Simulate the Pull operation and check each step
 * 
 * Usage: MONGODB_URI="..." npx tsx scripts/diagnose-pull-push-sync.ts <partnerId>
 */

import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

import clientPromise from '../lib/mongodb';
import config from '../lib/config';
import { createSheetsClient } from '../lib/googleSheets/client';
import { readSheetRows } from '../lib/googleSheets/client';
import { rowsToEvents } from '../lib/googleSheets/rowMapper';
import { SHEET_COLUMN_MAP } from '../lib/googleSheets/columnMap';
import { ObjectId } from 'mongodb';

async function diagnosePartner(partnerId: string) {
  console.log('🔍 Pull/Push Sync Diagnostic\n');
  console.log('='.repeat(80));
  
  const client = await clientPromise;
  const db = client.db(config.dbName);
  const partnersCollection = db.collection('partners');
  const projectsCollection = db.collection('projects');
  
  // Step 1: Get partner
  console.log(`\n📋 Step 1: Fetching partner ${partnerId}...`);
  const partner = await partnersCollection.findOne({ _id: new ObjectId(partnerId) });
  
  if (!partner) {
    console.error('❌ Partner not found');
    process.exit(1);
  }
  
  console.log(`✅ Found partner: ${partner.name}`);
  
  if (!partner.googleSheetConfig || !partner.googleSheetConfig.enabled) {
    console.error('❌ Google Sheets not configured for this partner');
    process.exit(1);
  }
  
  const { sheetId, sheetName } = partner.googleSheetConfig;
  console.log(`✅ Sheet ID: ${sheetId}`);
  console.log(`✅ Sheet Name: ${sheetName}`);
  
  // Step 2: Read sheet rows
  console.log(`\n📋 Step 2: Reading rows from Google Sheet...`);
  const rows = await readSheetRows(sheetId, sheetName, 2);
  console.log(`✅ Read ${rows.length} rows from sheet`);
  
  if (rows.length === 0) {
    console.log('⚠️ Sheet is empty - nothing to pull');
    process.exit(0);
  }
  
  // Sample first 3 rows
  console.log(`\n📊 Sample rows (first 3):`);
  rows.slice(0, 3).forEach((row, idx) => {
    console.log(`\nRow ${idx + 2}:`);
    console.log(`  UUID (A): ${row[0]}`);
    console.log(`  Partner 1 (B): ${row[1]}`);
    console.log(`  Partner 2 (C): ${row[2]}`);
    console.log(`  Event Title (D): ${row[3]}`);
    console.log(`  Event Name (E): ${row[4]}`);
    console.log(`  Event Date (F): ${row[5]}`);
    console.log(`  Total Games (G): ${row[6]}`);
    console.log(`  Unique Users (P): ${row[15]}`); // Column P = index 15
    console.log(`  Marketing Optin (U): ${row[20]}`); // Column U = index 20
  });
  
  // Step 3: Parse rows to events
  console.log(`\n📋 Step 3: Parsing rows to events...`);
  const { events, errors } = rowsToEvents(rows, SHEET_COLUMN_MAP);
  console.log(`✅ Parsed ${events.length} valid events`);
  console.log(`❌ Errors: ${errors.length}`);
  
  if (errors.length > 0) {
    console.log('\n⚠️ Parse errors:');
    errors.slice(0, 5).forEach(err => {
      console.log(`  Row ${err.row}: ${err.error}`);
    });
  }
  
  if (events.length === 0) {
    console.log('❌ No valid events parsed - cannot proceed');
    process.exit(1);
  }
  
  // Sample first parsed event
  console.log(`\n📊 Sample parsed event:`);
  const sampleEvent = events[0];
  console.log(`  UUID: ${sampleEvent.googleSheetUuid}`);
  console.log(`  Event Name: ${sampleEvent.eventName}`);
  console.log(`  Event Date: ${sampleEvent.eventDate}`);
  console.log(`  Stats keys: ${Object.keys(sampleEvent.stats || {}).length} fields`);
  console.log(`  Stats.uniqueUsers: ${sampleEvent.stats?.uniqueUsers}`);
  console.log(`  Stats.marketingOptin: ${sampleEvent.stats?.marketingOptin}`);
  console.log(`  Stats.totalGames: ${sampleEvent.stats?.totalGames}`);
  
  // Step 4: Check existing projects by UUID
  console.log(`\n📋 Step 4: Checking for existing projects by UUID...`);
  const uuids = events.map(e => e.googleSheetUuid).filter(Boolean);
  console.log(`  UUIDs to check: ${uuids.length}`);
  
  const existingProjects = await projectsCollection.find({
    googleSheetUuid: { $in: uuids }
  }).toArray();
  
  console.log(`✅ Found ${existingProjects.length} existing projects with matching UUIDs`);
  
  // Map existing projects
  const existingMap = new Map(existingProjects.map(p => [p.googleSheetUuid, p]));
  
  // Analyze what would happen in Pull
  let wouldCreate = 0;
  let wouldUpdate = 0;
  let wouldSkip = 0;
  
  const updateAnalysis: any[] = [];
  
  for (const event of events) {
    const uuid = event.googleSheetUuid;
    if (!uuid) {
      wouldCreate++;
      continue;
    }
    
    const existing = existingMap.get(uuid);
    if (!existing) {
      wouldCreate++;
    } else {
      // Check if update would actually change anything
      const changes: string[] = [];
      
      if (existing.eventName !== event.eventName) {
        changes.push(`eventName: "${existing.eventName}" → "${event.eventName}"`);
      }
      if (existing.eventDate !== event.eventDate) {
        changes.push(`eventDate: "${existing.eventDate}" → "${event.eventDate}"`);
      }
      
      // Check stats fields
      const sheetStats = event.stats || {};
      const dbStats = existing.stats || {};
      
      for (const key of Object.keys(sheetStats)) {
        if (sheetStats[key] !== dbStats[key]) {
          changes.push(`stats.${key}: ${dbStats[key]} → ${sheetStats[key]}`);
        }
      }
      
      if (changes.length > 0) {
        wouldUpdate++;
        updateAnalysis.push({
          uuid,
          eventName: event.eventName,
          changes
        });
      } else {
        wouldSkip++;
      }
    }
  }
  
  console.log(`\n📊 Pull Operation Simulation:`);
  console.log(`  Would CREATE: ${wouldCreate} events`);
  console.log(`  Would UPDATE: ${wouldUpdate} events`);
  console.log(`  Would SKIP: ${wouldSkip} events (no changes detected)`);
  
  if (updateAnalysis.length > 0) {
    console.log(`\n📝 Update Analysis (first 5):`);
    updateAnalysis.slice(0, 5).forEach(analysis => {
      console.log(`\n  Event: ${analysis.eventName} (${analysis.uuid})`);
      console.log(`  Changes detected: ${analysis.changes.length}`);
      analysis.changes.slice(0, 3).forEach((change: string) => {
        console.log(`    - ${change}`);
      });
      if (analysis.changes.length > 3) {
        console.log(`    ... and ${analysis.changes.length - 3} more`);
      }
    });
  }
  
  // Step 5: Check for projects without UUID
  console.log(`\n📋 Step 5: Checking for projects without googleSheetUuid...`);
  const projectsWithoutUuid = await projectsCollection.countDocuments({
    $or: [
      { partnerId: partner._id },
      { partnerId: String(partner._id) },
      { partnerName: partner.name }
    ],
    googleSheetUuid: { $exists: false }
  });
  
  console.log(`⚠️ Projects without UUID: ${projectsWithoutUuid}`);
  
  if (projectsWithoutUuid > 0) {
    console.log(`\n💡 INSIGHT: ${projectsWithoutUuid} projects don't have googleSheetUuid.`);
    console.log(`   These won't be matched during Pull and could cause duplicate creation.`);
    console.log(`   Consider running Setup again to populate UUIDs.`);
  }
  
  // Step 6: Summary and recommendations
  console.log(`\n${'='.repeat(80)}`);
  console.log('📊 DIAGNOSIS SUMMARY\n');
  
  if (wouldUpdate === 0 && wouldCreate === 0) {
    console.log('❌ PROBLEM: Pull would not create or update any events');
    console.log('\nPossible causes:');
    console.log('  1. All UUIDs already exist in database');
    console.log('  2. Sheet data matches database exactly (no changes detected)');
    console.log('  3. Parse errors preventing valid events');
    console.log('\n💡 Recommendation: Check if sheet contains actual new/modified data');
  } else {
    console.log('✅ Pull operation would process changes:');
    console.log(`   - Create ${wouldCreate} new events`);
    console.log(`   - Update ${wouldUpdate} existing events`);
    console.log(`   - Skip ${wouldSkip} unchanged events`);
  }
  
  if (errors.length > 0) {
    console.log(`\n⚠️ ${errors.length} row(s) have parse errors - fix these for complete sync`);
  }
  
  process.exit(0);
}

// Main
const partnerId = process.argv[2];
if (!partnerId) {
  console.error('❌ Usage: npx tsx scripts/diagnose-pull-push-sync.ts <partnerId>');
  process.exit(1);
}

diagnosePartner(partnerId).catch(error => {
  console.error('❌ Diagnostic failed:', error);
  process.exit(1);
});
