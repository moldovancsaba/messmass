// scripts/migrations/addApiFieldsToUsers.ts
// WHAT: Idempotent migration to add API access fields to existing user documents
// WHY: Enable API key authentication feature (v10.5.1+) without breaking existing users

import { getUsersCollection } from '../../lib/users'

/**
 * Migration: Add API Access Fields to Users Collection
 * 
 * WHAT: Adds three new fields to existing user documents:
 *   - apiKeyEnabled: boolean (default false)
 *   - apiUsageCount: number (default 0)
 *   - lastAPICallAt: string | undefined (not set initially)
 * 
 * WHY: Enable Bearer token authentication for public API endpoints
 * 
 * SAFETY: Idempotent - safe to run multiple times
 *   - Uses $setOnInsert to only add fields if missing
 *   - Preserves existing values if fields already exist
 *   - Updates updatedAt timestamp with ISO 8601 milliseconds
 */
async function addApiFieldsToUsers() {
  console.log('🚀 Starting migration: Add API fields to users collection')
  console.log('📋 Target fields: apiKeyEnabled, apiUsageCount, lastAPICallAt')
  
  try {
    const col = await getUsersCollection()
    const now = new Date().toISOString()
    
    // WHAT: Count users before migration
    // WHY: Report affected documents
    const totalUsers = await col.countDocuments({})
    console.log(`📊 Found ${totalUsers} user(s) in collection`)
    
    // WHAT: Count users missing API fields
    // WHY: Know how many will be updated
    const usersWithoutFields = await col.countDocuments({
      $or: [
        { apiKeyEnabled: { $exists: false } },
        { apiUsageCount: { $exists: false } }
      ]
    })
    console.log(`🔍 Users needing migration: ${usersWithoutFields}`)
    
    if (usersWithoutFields === 0) {
      console.log('✅ All users already have API fields - migration skipped')
      return
    }
    
    // WHAT: Update all users to have API fields
    // WHY: Ensure consistent schema across all documents
    // HOW: 
    //   - $set with conditional logic using aggregation pipeline
    //   - Only sets fields if they don't exist ($ifNull with current value)
    //   - Always updates updatedAt timestamp
    const result = await col.updateMany(
      {},
      [
        {
          $set: {
            apiKeyEnabled: {
              $ifNull: ['$apiKeyEnabled', false]
            },
            apiUsageCount: {
              $ifNull: ['$apiUsageCount', 0]
            },
            // WHAT: Don't set lastAPICallAt if it doesn't exist
            // WHY: Undefined means never used (cleaner than null)
            updatedAt: now
          }
        }
      ]
    )
    
    console.log(`✅ Migration complete:`)
    console.log(`   - Matched: ${result.matchedCount} documents`)
    console.log(`   - Modified: ${result.modifiedCount} documents`)
    console.log(`   - Timestamp: ${now}`)
    
    // WHAT: Verify migration results
    // WHY: Ensure all users now have required fields
    const usersAfter = await col.countDocuments({
      apiKeyEnabled: { $exists: true },
      apiUsageCount: { $exists: true }
    })
    console.log(`✅ Verification: ${usersAfter}/${totalUsers} users have API fields`)
    
    if (usersAfter === totalUsers) {
      console.log('🎉 Migration successful - all users updated')
    } else {
      console.warn(`⚠️  Warning: ${totalUsers - usersAfter} users still missing fields`)
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  }
}

// WHAT: Execute migration if run directly
// WHY: Allow both direct execution and import as module
if (require.main === module) {
  addApiFieldsToUsers()
    .then(() => {
      console.log('✅ Migration script complete')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error)
      process.exit(1)
    })
}

export { addApiFieldsToUsers }
