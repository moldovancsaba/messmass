/**
 * Fix Google Sheet Sync for All Partners
 * 
 * WHAT: Ensure UUIDs in Google Sheets match database for all partners
 * WHY: Pull sync fails when UUIDs don't match between sheet and database
 * HOW: Read sheet, compare with database, update both sides to match
 */

import { MongoClient, ObjectId } from 'mongodb';
import { google } from 'googleapis';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI!;
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

// Google Sheets authentication
function createSheetsClient() {
  // Try file-based credentials first
  const credPath = '.google-service-account.json';
  if (fs.existsSync(credPath)) {
    const creds = JSON.parse(fs.readFileSync(credPath, 'utf-8'));
    const auth = new google.auth.GoogleAuth({
      credentials: creds,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    return google.sheets({ version: 'v4', auth });
  }

  // Fallback to environment variables
  const email = process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY;

  if (!email || !privateKey) {
    throw new Error('Google Sheets credentials not found');
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: email,
      private_key: privateKey.replace(/\\n/g, '\n')
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });

  return google.sheets({ version: 'v4', auth });
}

async function fixPartnerSync(partnerId: string, sheetId: string, sheetName: string) {
  console.log(`\n🔧 Fixing sync for partner ${partnerId}`);
  console.log(`   Sheet: ${sheetId}`);

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db(MONGODB_DB);
    const projectsCollection = db.collection('projects');

    // Get all projects for this partner
    const projects = await projectsCollection.find({
      $or: [
        { partnerId: new ObjectId(partnerId) },
        { partnerId: partnerId },
        { partner1Id: new ObjectId(partnerId) },
        { partnerName: { $exists: true } }
      ]
    }).toArray();

    console.log(`   Found ${projects.length} projects in database`);

    // Read sheet data
    const sheets = createSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${sheetName}!A2:E${projects.length + 10}` // Read UUID and Event Name columns
    });

    const sheetRows = response.data.values || [];
    console.log(`   Found ${sheetRows.length} rows in sheet`);

    // Build map of sheet UUIDs to row numbers
    const sheetUuidMap = new Map<string, number>();
    sheetRows.forEach((row, index) => {
      const uuid = row[0]; // Column A
      if (uuid) {
        sheetUuidMap.set(String(uuid).trim(), index + 2); // +2 because row 1 is header
      }
    });

    let fixed = 0;
    let matched = 0;
    let mismatched = 0;

    // Check each project
    for (const project of projects) {
      const projectId = project._id.toString();
      const dbUuid = project.googleSheetUuid;
      const eventName = project.eventName || 'Unnamed';

      if (!dbUuid) {
        console.log(`   ❌ ${eventName}: No UUID in database`);
        // Write UUID to database
        await projectsCollection.updateOne(
          { _id: project._id },
          {
            $set: {
              googleSheetUuid: projectId,
              googleSheetSource: 'messmass',
              googleSheetSyncedAt: new Date().toISOString()
            }
          }
        );
        fixed++;
        console.log(`      ✅ Fixed: Set UUID to ${projectId}`);
        continue;
      }

      // Check if UUID exists in sheet
      if (sheetUuidMap.has(dbUuid)) {
        matched++;
        console.log(`   ✅ ${eventName}: UUID matches (${dbUuid.substring(0, 8)}...)`);
      } else if (sheetUuidMap.has(projectId)) {
        // Sheet has project._id but database has different UUID
        mismatched++;
        console.log(`   ⚠️  ${eventName}: UUID mismatch`);
        console.log(`      Database: ${dbUuid}`);
        console.log(`      Sheet: ${projectId}`);
        
        // Update database to match sheet
        await projectsCollection.updateOne(
          { _id: project._id },
          {
            $set: {
              googleSheetUuid: projectId,
              googleSheetSyncedAt: new Date().toISOString()
            }
          }
        );
        fixed++;
        console.log(`      ✅ Fixed: Updated database UUID to match sheet`);
      } else {
        console.log(`   ❌ ${eventName}: UUID not found in sheet at all`);
        console.log(`      Database UUID: ${dbUuid}`);
        console.log(`      Project ID: ${projectId}`);
      }
    }

    console.log(`\n   📊 Summary:`);
    console.log(`      Matched: ${matched}`);
    console.log(`      Mismatched: ${mismatched}`);
    console.log(`      Fixed: ${fixed}`);

  } catch (error) {
    console.error(`   ❌ Error:`, error);
    throw error;
  } finally {
    await client.close();
  }
}

async function fixAllPartners() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(MONGODB_DB);
    const partnersCollection = db.collection('partners');

    // Find all partners with Google Sheets configured
    const partners = await partnersCollection.find({
      'googleSheetConfig.enabled': true,
      'googleSheetConfig.sheetId': { $exists: true }
    }).toArray();

    console.log(`\n📊 Found ${partners.length} partners with Google Sheets configured\n`);

    for (const partner of partners) {
      const config = partner.googleSheetConfig;
      await fixPartnerSync(
        partner._id.toString(),
        config.sheetId,
        config.sheetName || 'Events'
      );
    }

    console.log('\n✅ All partners fixed!');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

fixAllPartners()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
