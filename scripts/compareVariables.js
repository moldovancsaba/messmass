const { MongoClient } = require('mongodb');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function main() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('messmass');

  // Get database event
  const event = await db.collection('projects').findOne({ googleSheetUuid: '694ab5b2da5515da37d54a66' });

  console.log('🔍 DATABASE VALUES:');
  console.log('\n❌ Reported as NOT WORKING:');
  console.log('  selfies:', event?.stats?.selfies);
  console.log('  stadium:', event?.stats?.stadium);
  console.log('  female:', event?.stats?.female);
  console.log('  male:', event?.stats?.male);

  console.log('\n✓ Reported as WORKING:');
  console.log('  remoteImages:', event?.stats?.remoteImages);
  console.log('  hostessImages:', event?.stats?.hostessImages);
  console.log('  remoteFans:', event?.stats?.remoteFans);

  // Get sheet data
  const jsonPath = path.join(process.cwd(), '.google-service-account.json');
  const keyFile = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  const auth = new google.auth.JWT({
    email: keyFile.client_email,
    key: keyFile.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });
  const sheets = google.sheets({ version: 'v4', auth });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: '1W1GJX874wYmL5rJ6HviarC1q-GrZ6tYEUBQc1KuT96w',
    range: 'Events!A1:DA10'
  });

  const headerRow = response.data.values[0];
  const dataRow = response.data.values[1];

  console.log('\n\n📑 SHEET VALUES (First Event Row):');

  const findColIndex = (label) => {
    const idx = headerRow.findIndex(h => h && h.toString() === label);
    return idx >= 0 ? idx : -1;
  };

  const cols = {
    'Selfies': findColIndex('Selfies'),
    'Stadium Fans': findColIndex('Stadium Fans'),
    'Female': findColIndex('Female'),
    'Male': findColIndex('Male'),
    'Remote Images': findColIndex('Remote Images'),
    'Hostess Images': findColIndex('Hostess Images'),
    'Remote Fans': findColIndex('Remote Fans')
  };

  console.log('\n❌ Reported as NOT WORKING:');
  ['Selfies', 'Stadium Fans', 'Female', 'Male'].forEach(name => {
    const idx = cols[name];
    const value = idx >= 0 ? dataRow[idx] : 'COLUMN NOT FOUND';
    const colLetter = idx >= 0 ? String.fromCharCode(65 + Math.floor(idx / 26) > 0 ? Math.floor(idx / 26) + 64 : 0, 65 + (idx % 26)) : 'N/A';
    console.log(`  ${name} (Col ${colLetter}): "${value}" (Index: ${idx})`);
  });

  console.log('\n✓ Reported as WORKING:');
  ['Remote Images', 'Hostess Images', 'Remote Fans'].forEach(name => {
    const idx = cols[name];
    const value = idx >= 0 ? dataRow[idx] : 'COLUMN NOT FOUND';
    const colLetter = idx >= 0 ? String.fromCharCode(65 + Math.floor(idx / 26) > 0 ? Math.floor(idx / 26) + 64 : 0, 65 + (idx % 26)) : 'N/A';
    console.log(`  ${name} (Col ${colLetter}): "${value}" (Index: ${idx})`);
  });

  console.log('\n\nAll sheet headers:');
  headerRow.forEach((h, i) => {
    const letter = i < 26 ? String.fromCharCode(65 + i) : String.fromCharCode(65 + Math.floor(i / 26), 65 + (i % 26));
    console.log(`  ${letter}: ${h}`);
  });

  await client.close();
}

main().catch(console.error);
