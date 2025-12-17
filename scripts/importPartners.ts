// WHAT: Import partners from JSON export to production database
// WHY: Restore 141 partners to production after MONGODB_URI update
// HOW: Read partners-export.json and insert into production database

import { MongoClient, ObjectId } from 'mongodb';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function importPartners() {
  const MONGODB_URI = process.env.MONGODB_URI;
  const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not set in .env.local');
  }

  const exportPath = path.join(process.cwd(), 'partners-export.json');
  
  if (!fs.existsSync(exportPath)) {
    throw new Error(`Export file not found: ${exportPath}\nRun: npm run export:partners first`);
  }

  console.log('📂 Reading partners-export.json...');
  const partnersData = JSON.parse(fs.readFileSync(exportPath, 'utf-8'));
  console.log(`✅ Found ${partnersData.length} partners in export file`);

  console.log('🔄 Connecting to MongoDB...');
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(MONGODB_DB);
    const partnersCollection = db.collection('partners');

    // Check if collection already has partners
    const existingCount = await partnersCollection.countDocuments();
    console.log(`📊 Current partners in database: ${existingCount}`);

    if (existingCount > 0) {
      console.log('⚠️  Database already has partners.');
      console.log('Do you want to:');
      console.log('  1. Skip import (safe)');
      console.log('  2. Clear and import (destructive)');
      console.log('  3. Merge (add only new partners)');
      console.log('\n🛑 Stopping. Modify script to choose import strategy.');
      return;
    }

    // Transform _id strings back to ObjectId
    const partnersToInsert = partnersData.map((partner: any) => {
      const transformed = { ...partner };
      
      // Convert _id string to ObjectId
      if (typeof transformed._id === 'string') {
        transformed._id = new ObjectId(transformed._id);
      }
      
      // Convert styleId if present
      if (transformed.styleId && typeof transformed.styleId === 'string') {
        transformed.styleId = new ObjectId(transformed.styleId);
      }
      
      // Convert reportTemplateId if present
      if (transformed.reportTemplateId && typeof transformed.reportTemplateId === 'string') {
        transformed.reportTemplateId = new ObjectId(transformed.reportTemplateId);
      }
      
      return transformed;
    });

    console.log('💾 Importing partners...');
    const result = await partnersCollection.insertMany(partnersToInsert, { ordered: false });
    
    console.log(`✅ Successfully imported ${result.insertedCount} partners`);
    console.log('\n🎉 Migration complete!');
    console.log('🔍 Verify at: https://www.messmass.com/admin/partners');
  } catch (error: any) {
    if (error.code === 11000) {
      console.error('❌ Duplicate key error: Some partners already exist');
      console.log('💡 Use merge strategy to add only new partners');
    } else {
      console.error('❌ Import failed:', error);
    }
    throw error;
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

importPartners().catch(console.error);
