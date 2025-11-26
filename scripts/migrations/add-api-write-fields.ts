// scripts/migrations/add-api-write-fields.ts
// WHAT: Database migration to add API write permission fields to existing users
// WHY: Fanmass integration requires separate write permissions for security
// WHEN: Run once before deploying write endpoint feature

import { MongoClient } from 'mongodb';
import config from '../../lib/config';

async function migrateUsers() {
  console.log('🔄 Starting migration: Add API write fields to users collection');
  
  const client = new MongoClient(config.mongodbUri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(config.dbName);
    const usersCollection = db.collection('users');
    
    // WHAT: Add new fields to all existing users
    // WHY: Ensure backward compatibility - all existing users default to write disabled
    const result = await usersCollection.updateMany(
      {
        // Only update users that don't have these fields yet
        $or: [
          { apiWriteEnabled: { $exists: false } },
          { apiWriteCount: { $exists: false } },
          { lastAPIWriteAt: { $exists: false } }
        ]
      },
      {
        $set: {
          apiWriteEnabled: false,  // Default: write access disabled
          apiWriteCount: 0,        // Default: zero write operations
          // lastAPIWriteAt intentionally omitted (null until first write)
        }
      }
    );
    
    console.log(`✅ Migration complete: Updated ${result.modifiedCount} users`);
    console.log(`   - apiWriteEnabled: false (default)`);
    console.log(`   - apiWriteCount: 0 (default)`);
    console.log(`   - lastAPIWriteAt: null (will be set on first write)`);
    
    // WHAT: Display summary of users with API access
    const apiUsers = await usersCollection.find({ apiKeyEnabled: true }).toArray();
    console.log(`\n📊 Summary: ${apiUsers.length} users have API read access enabled`);
    
    if (apiUsers.length > 0) {
      console.log('\n⚠️  To enable write access for a user, use:');
      console.log('   await toggleAPIWriteAccess(userId, true)');
      console.log('\n   Example API users:');
      apiUsers.forEach(user => {
        console.log(`   - ${user.email} (${user.name})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.close();
    console.log('\n✅ Database connection closed');
  }
}

// Run migration if executed directly
if (require.main === module) {
  migrateUsers()
    .then(() => {
      console.log('\n✅ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration failed:', error);
      process.exit(1);
    });
}

export default migrateUsers;
