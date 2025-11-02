#!/usr/bin/env ts-node

import { MongoClient, ObjectId } from 'mongodb';
import * as fs from 'fs';

const MONGODB_URI = process.env.MONGODB_URI || '';
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';
const BACKUP_FILE = '/Users/moldovancsaba/Projects/messmass/backups/messmass_backup_2025-11-02T19-25-48-945Z/collections/users.json';

async function restoreUsers() {
  console.log('🔄 Restoring users collection from backup...\n');

  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is required');
  }

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db(MONGODB_DB);
    const usersCollection = db.collection('users');

    // Read backup file
    console.log(`📂 Reading backup file: ${BACKUP_FILE}`);
    const backupData = fs.readFileSync(BACKUP_FILE, 'utf-8');
    const backup = JSON.parse(backupData);
    const users = backup.documents.map((doc: any) => ({
      ...doc,
      _id: new ObjectId(doc._id)
    }));

    console.log(`   Found ${users.length} users in backup\n`);

    // Clear existing users (if any)
    const existingCount = await usersCollection.countDocuments();
    if (existingCount > 0) {
      console.log(`🗑️  Clearing ${existingCount} existing documents...`);
      await usersCollection.deleteMany({});
    }

    // Restore users
    console.log('📥 Restoring users...');
    if (users.length > 0) {
      await usersCollection.insertMany(users);
      console.log(`✅ Restored ${users.length} users\n`);
    }

    // Verify
    const finalCount = await usersCollection.countDocuments();
    console.log('═'.repeat(60));
    console.log(`✅ Users collection now has ${finalCount} documents`);
    console.log('✅ Your login should work now!\n');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

restoreUsers().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
