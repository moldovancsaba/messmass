// WHAT: Export partners collection to JSON for migration to production
// WHY: Production database is missing partners after MONGODB_URI update
// HOW: Connect to local database, export all partners to partners-export.json

import { MongoClient } from 'mongodb';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function exportPartners() {
  const MONGODB_URI = process.env.MONGODB_URI;
  const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not set in .env.local');
  }

  console.log('🔄 Connecting to MongoDB...');
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(MONGODB_DB);
    const partnersCollection = db.collection('partners');

    console.log('📊 Fetching all partners...');
    const partners = await partnersCollection.find({}).toArray();

    console.log(`✅ Found ${partners.length} partners`);

    const exportPath = path.join(process.cwd(), 'partners-export.json');
    fs.writeFileSync(exportPath, JSON.stringify(partners, null, 2));

    console.log(`✅ Exported ${partners.length} partners to ${exportPath}`);
    console.log('\n📋 Next steps:');
    console.log('1. Review partners-export.json');
    console.log('2. Run: npm run import:partners (after setting production MONGODB_URI)');
  } catch (error) {
    console.error('❌ Export failed:', error);
    throw error;
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

exportPartners().catch(console.error);
