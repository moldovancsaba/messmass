import mongoose from 'mongoose';
import connectV3 from '@/lib/mongoose-v3';
import { V3_COLLECTIONS } from '@/lib/constants';

/**
 * Phase 5 Rollback Script: V3 Migration
 * 
 * Provides a 'one-click' cleanup if a migration run fails.
 * Deletes all documents from all V3 collections, but preserves schemas and indexes.
 */
async function rollbackV3() {
  console.log('🚨 Initiating Phase 5 Rollback: V3 Cleanup 🚨');
  
  await connectV3();
  const db = mongoose.connection.db;
  
  if (!db) {
    throw new Error('Database connection failed.');
  }

  const collectionsToClear = Object.values(V3_COLLECTIONS);

  for (const collectionName of collectionsToClear) {
    try {
      const result = await db.collection(collectionName).deleteMany({});
      console.log(`🧹 Cleared ${result.deletedCount} documents from ${collectionName}`);
    } catch (error: any) {
      console.error(`❌ Failed to clear ${collectionName}:`, error.message);
    }
  }

  console.log('✅ Phase 5 Rollback Complete. All V3 data wiped. Indexes preserved.');
  process.exit(0);
}

rollbackV3().catch(err => {
  console.error('🔥 Rollback Failed catastrophically:', err);
  process.exit(1);
});
