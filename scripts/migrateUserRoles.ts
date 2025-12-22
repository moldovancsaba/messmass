// scripts/migrateUserRoles.ts
// WHAT: Migrate existing user roles to new 4-tier hierarchy
// WHY: Convert 'super-admin' → 'superadmin', handle 'api' role, prepare for RBAC
// HOW: Batch update all users in MongoDB with role mapping

import getDb from '../lib/db';
import type { UserRole } from '../lib/users';

/**
 * WHAT: Role migration mapping
 * WHY: Define how to convert old roles to new roles
 */
const ROLE_MIGRATION_MAP: Record<string, UserRole> = {
  'super-admin': 'superadmin',  // Convert hyphenated to single word
  'admin': 'admin',              // Keep as-is
  'api': 'user',                 // Convert API users to regular users (can be promoted later)
  'user': 'user',                // Keep as-is (if any exist)
  'guest': 'guest',              // Keep as-is (if any exist)
};

async function migrateUserRoles() {
  console.log('🔄 Starting user role migration...\n');
  
  try {
    const db = await getDb();
    const usersCollection = db.collection('users');
    
    // WHAT: Fetch all users to migrate
    const users = await usersCollection.find({}).toArray();
    console.log(`📊 Found ${users.length} users to process\n`);
    
    if (users.length === 0) {
      console.log('✅ No users to migrate. Database is empty.');
      process.exit(0);
    }
    
    // WHAT: Track migration statistics
    let migrated = 0;
    let unchanged = 0;
    let errors = 0;
    
    const migrationDetails: Array<{
      email: string;
      oldRole: string;
      newRole: UserRole;
      status: 'success' | 'skipped' | 'error';
    }> = [];
    
    // WHAT: Process each user
    for (const user of users) {
      const oldRole = user.role as string;
      const newRole = ROLE_MIGRATION_MAP[oldRole];
      
      try {
        if (!newRole) {
          // WHAT: Unknown role - log error but don't migrate
          console.error(`❌ Unknown role "${oldRole}" for user ${user.email}`);
          errors++;
          migrationDetails.push({
            email: user.email,
            oldRole,
            newRole: oldRole as UserRole,
            status: 'error',
          });
          continue;
        }
        
        if (oldRole === newRole) {
          // WHAT: Role unchanged - skip update
          unchanged++;
          migrationDetails.push({
            email: user.email,
            oldRole,
            newRole,
            status: 'skipped',
          });
          continue;
        }
        
        // WHAT: Update user role
        const now = new Date().toISOString();
        await usersCollection.updateOne(
          { _id: user._id },
          { 
            $set: { 
              role: newRole,
              updatedAt: now,
            } 
          }
        );
        
        migrated++;
        migrationDetails.push({
          email: user.email,
          oldRole,
          newRole,
          status: 'success',
        });
        
        console.log(`✅ Migrated: ${user.email} (${oldRole} → ${newRole})`);
      } catch (error) {
        errors++;
        console.error(`❌ Error migrating ${user.email}:`, error);
        migrationDetails.push({
          email: user.email,
          oldRole,
          newRole: oldRole as UserRole,
          status: 'error',
        });
      }
    }
    
    // WHAT: Print migration summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total users:     ${users.length}`);
    console.log(`✅ Migrated:     ${migrated}`);
    console.log(`⏭️  Unchanged:    ${unchanged}`);
    console.log(`❌ Errors:       ${errors}`);
    console.log('='.repeat(60) + '\n');
    
    // WHAT: Print detailed breakdown
    if (migrationDetails.length > 0) {
      console.log('📊 DETAILED RESULTS:\n');
      
      const successfulMigrations = migrationDetails.filter(d => d.status === 'success');
      const skippedMigrations = migrationDetails.filter(d => d.status === 'skipped');
      const erroredMigrations = migrationDetails.filter(d => d.status === 'error');
      
      if (successfulMigrations.length > 0) {
        console.log('✅ Successfully migrated:');
        successfulMigrations.forEach(detail => {
          console.log(`   ${detail.email}: ${detail.oldRole} → ${detail.newRole}`);
        });
        console.log('');
      }
      
      if (skippedMigrations.length > 0) {
        console.log('⏭️  Skipped (already correct):');
        skippedMigrations.forEach(detail => {
          console.log(`   ${detail.email}: ${detail.oldRole}`);
        });
        console.log('');
      }
      
      if (erroredMigrations.length > 0) {
        console.log('❌ Errors:');
        erroredMigrations.forEach(detail => {
          console.log(`   ${detail.email}: ${detail.oldRole} (failed to migrate)`);
        });
        console.log('');
      }
    }
    
    // WHAT: Exit with appropriate code
    if (errors > 0) {
      console.error('⚠️  Migration completed with errors. Please review the logs.');
      process.exit(1);
    } else {
      console.log('✅ Migration completed successfully!');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('❌ Fatal migration error:', error);
    process.exit(1);
  }
}

// WHAT: Run migration if executed directly
if (require.main === module) {
  migrateUserRoles();
}

export default migrateUserRoles;
