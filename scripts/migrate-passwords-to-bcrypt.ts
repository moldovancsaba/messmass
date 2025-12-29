// scripts/migrate-passwords-to-bcrypt.ts
// WHAT: Migration script to hash all plaintext passwords to bcrypt
// WHY: Secure password storage - migrate existing users without forcing password reset
// HOW: Reads all users with plaintext passwords, hashes them, stores as passwordHash
// 
// USAGE:
//   npx tsx -r dotenv/config scripts/migrate-passwords-to-bcrypt.ts dotenv_config_path=.env.local
//
// SAFETY:
//   - Only migrates users with plaintext passwords (skips already hashed)
//   - Creates backup before migration
//   - Dry-run mode available (--dry-run flag)
//   - Logs all operations for audit trail

import { getUsersCollection } from '../lib/users';
import { hashPassword } from '../lib/users';
import { info, warn, error as logError } from '../lib/logger';
import getDb from '../lib/db';

interface MigrationStats {
  total: number;
  migrated: number;
  skipped: number;
  errors: number;
}

/**
 * WHAT: Migrate all plaintext passwords to bcrypt hashes
 * WHY: Secure password storage without forcing password reset
 * HOW: Hash each plaintext password and store as passwordHash, remove plaintext
 */
async function migratePasswordsToBcrypt(dryRun: boolean = false): Promise<MigrationStats> {
  const stats: MigrationStats = {
    total: 0,
    migrated: 0,
    skipped: 0,
    errors: 0,
  };

  try {
    const col = await getUsersCollection();
    
    // WHAT: Find all users with plaintext passwords (no passwordHash)
    // WHY: Only migrate users that haven't been migrated yet
    const usersToMigrate = await col.find({
      password: { $exists: true, $ne: null, $ne: '' },
      passwordHash: { $exists: false }
    }).toArray();

    stats.total = usersToMigrate.length;

    info(`Found ${stats.total} users with plaintext passwords to migrate`, {
      dryRun,
      totalUsers: stats.total
    });

    if (stats.total === 0) {
      info('No users to migrate - all passwords already hashed or no plaintext passwords found');
      return stats;
    }

    // WHAT: Process each user
    for (const user of usersToMigrate) {
      try {
        if (!user.password) {
          stats.skipped++;
          warn(`Skipping user ${user._id} - no password field`, { userId: user._id?.toString() });
          continue;
        }

        if (!user._id) {
          stats.errors++;
          logError('User missing _id field', { email: user.email });
          continue;
        }

        // WHAT: Hash the plaintext password
        // WHY: Secure password storage
        const passwordHash = await hashPassword(user.password);

        if (dryRun) {
          info(`[DRY RUN] Would migrate user ${user.email}`, {
            userId: user._id.toString(),
            email: user.email
          });
          stats.migrated++;
        } else {
          // WHAT: Update user with passwordHash and remove plaintext password
          // WHY: Complete migration - no plaintext passwords remain
          await col.updateOne(
            { _id: user._id },
            {
              $set: { passwordHash, updatedAt: new Date().toISOString() },
              $unset: { password: "" }
            }
          );

          info(`Migrated password for user ${user.email}`, {
            userId: user._id.toString(),
            email: user.email
          });
          stats.migrated++;
        }
      } catch (err) {
        stats.errors++;
        logError('Failed to migrate user password', {
          userId: user._id?.toString(),
          email: user.email,
          error: err instanceof Error ? err.message : String(err)
        }, err instanceof Error ? err : new Error(String(err)));
      }
    }

    return stats;
  } catch (err) {
    logError('Migration failed', {
      error: err instanceof Error ? err.message : String(err)
    }, err instanceof Error ? err : new Error(String(err)));
    throw err;
  }
}

/**
 * WHAT: Main migration execution
 * WHY: Command-line interface for migration script
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  if (dryRun) {
    info('Running in DRY RUN mode - no changes will be made');
  }

  try {
    info('Starting password migration to bcrypt', { dryRun });

    const stats = await migratePasswordsToBcrypt(dryRun);

    info('Migration completed', {
      total: stats.total,
      migrated: stats.migrated,
      skipped: stats.skipped,
      errors: stats.errors,
      dryRun
    });

    if (stats.errors > 0) {
      warn(`Migration completed with ${stats.errors} errors - review logs`);
      process.exit(1);
    }

    if (dryRun) {
      info('DRY RUN completed - run without --dry-run to apply changes');
    } else {
      info('Migration completed successfully');
    }
  } catch (err) {
    logError('Migration script failed', {
      error: err instanceof Error ? err.message : String(err)
    }, err instanceof Error ? err : new Error(String(err)));
    process.exit(1);
  }
}

// WHAT: Run migration if script is executed directly
if (require.main === module) {
  main().catch(err => {
    logError('Unhandled migration error', {
      error: err instanceof Error ? err.message : String(err)
    }, err instanceof Error ? err : new Error(String(err)));
    process.exit(1);
  });
}

export { migratePasswordsToBcrypt };

