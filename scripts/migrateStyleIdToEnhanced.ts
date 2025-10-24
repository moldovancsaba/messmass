#!/usr/bin/env tsx
/* WHAT: Database migration script to convert styleId → styleIdEnhanced
 * WHY: Migrate from old pageStyles system to new page_styles_enhanced system
 * HOW: Copy styleId values to styleIdEnhanced, remove old styleId field
 * 
 * USAGE:
 *   Dry run (safe):  npm run migrate:style-fields
 *   Execute:         npm run migrate:style-fields -- --execute
 * 
 * ROLLBACK INSTRUCTIONS:
 *   If you need to roll back this migration:
 *   1. Run: npm run migrate:style-fields -- --rollback
 *   2. This will copy styleIdEnhanced back to styleId and remove styleIdEnhanced
 */

// WHAT: Database imports - environment loaded via tsx -r dotenv/config
// WHY: Pre-loading dotenv ensures MONGODB_URI is available at module evaluation time
import { getDb } from '../lib/db';
import { ObjectId } from 'mongodb';

interface Project {
  _id: ObjectId;
  eventName: string;
  styleId?: string | ObjectId;
  styleIdEnhanced?: string | ObjectId;
  updatedAt: string;
}

async function migrateStyleIds(dryRun: boolean = true) {
  console.log('\n🔄 Style ID Migration Script');
  console.log('============================\n');
  
  if (dryRun) {
    console.log('🧪 DRY RUN MODE - No changes will be made\n');
  } else {
    console.log('⚠️  EXECUTE MODE - Changes will be applied to database\n');
  }

  try {
    // Connect to database
    const db = await getDb();
    const projectsCollection = db.collection<Project>('projects');

    // WHAT: Find all projects with styleId field (not null/undefined)
    // WHY: Need to migrate these to styleIdEnhanced field
    const projectsWithStyleId = await projectsCollection
      .find({
        styleId: { $exists: true, $ne: null as any }
      })
      .toArray();

    console.log(`📊 Found ${projectsWithStyleId.length} projects with styleId field\n`);

    if (projectsWithStyleId.length === 0) {
      console.log('✅ No projects need migration. All done!');
      return;
    }

    // Display projects that will be migrated
    console.log('Projects to migrate:');
    projectsWithStyleId.forEach((project, index) => {
      console.log(`  ${index + 1}. ${project.eventName} (${project._id.toString()})`);
      console.log(`     Current styleId: ${project.styleId}`);
      console.log(`     Current styleIdEnhanced: ${project.styleIdEnhanced || 'null'}`);
    });
    console.log('');

    if (dryRun) {
      console.log('🧪 DRY RUN - Would perform the following operations:');
      console.log('   1. Copy styleId → styleIdEnhanced');
      console.log('   2. Remove old styleId field');
      console.log('   3. Update updatedAt timestamp\n');
      console.log('✅ To execute migration, run with --execute flag\n');
      return;
    }

    // Execute migration
    console.log('🚀 Starting migration...\n');
    
    let successCount = 0;
    let failCount = 0;
    const errors: Array<{ projectId: string; error: string }> = [];

    for (const project of projectsWithStyleId) {
      try {
        const now = new Date().toISOString();
        
        // Update project: copy styleId to styleIdEnhanced, remove styleId, update timestamp
        await projectsCollection.updateOne(
          { _id: project._id },
          {
            $set: {
              styleIdEnhanced: project.styleId,
              updatedAt: now
            },
            $unset: {
              styleId: ''
            }
          }
        );

        successCount++;
        console.log(`  ✅ Migrated: ${project.eventName} (${project._id.toString()})`);
      } catch (error) {
        failCount++;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push({
          projectId: project._id.toString(),
          error: errorMsg
        });
        console.error(`  ❌ Failed: ${project.eventName} (${project._id.toString()}) - ${errorMsg}`);
      }
    }

    // Summary
    console.log('\n============================');
    console.log('📊 Migration Summary');
    console.log('============================');
    console.log(`✅ Successfully migrated: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    
    if (errors.length > 0) {
      console.log('\n❌ Errors:');
      errors.forEach(err => {
        console.log(`   Project ${err.projectId}: ${err.error}`);
      });
    }

    console.log('\n✅ Migration complete!\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

async function rollbackMigration(dryRun: boolean = true) {
  console.log('\n⏪ Style ID Rollback Script');
  console.log('============================\n');
  
  if (dryRun) {
    console.log('🧪 DRY RUN MODE - No changes will be made\n');
  } else {
    console.log('⚠️  EXECUTE MODE - Changes will be applied to database\n');
  }

  try {
    const db = await getDb();
    const projectsCollection = db.collection<Project>('projects');

    // WHAT: Find all projects with styleIdEnhanced field
    // WHY: Need to roll back these to styleId field
    const projectsWithStyleIdEnhanced = await projectsCollection
      .find({
        styleIdEnhanced: { $exists: true, $ne: null as any }
      })
      .toArray();

    console.log(`📊 Found ${projectsWithStyleIdEnhanced.length} projects with styleIdEnhanced field\n`);

    if (projectsWithStyleIdEnhanced.length === 0) {
      console.log('✅ No projects need rollback. All done!');
      return;
    }

    // Display projects that will be rolled back
    console.log('Projects to rollback:');
    projectsWithStyleIdEnhanced.forEach((project, index) => {
      console.log(`  ${index + 1}. ${project.eventName} (${project._id.toString()})`);
      console.log(`     Current styleIdEnhanced: ${project.styleIdEnhanced}`);
      console.log(`     Current styleId: ${project.styleId || 'null'}`);
    });
    console.log('');

    if (dryRun) {
      console.log('🧪 DRY RUN - Would perform the following operations:');
      console.log('   1. Copy styleIdEnhanced → styleId');
      console.log('   2. Remove styleIdEnhanced field');
      console.log('   3. Update updatedAt timestamp\n');
      console.log('✅ To execute rollback, run with --rollback --execute flags\n');
      return;
    }

    // Execute rollback
    console.log('🚀 Starting rollback...\n');
    
    let successCount = 0;
    let failCount = 0;

    for (const project of projectsWithStyleIdEnhanced) {
      try {
        const now = new Date().toISOString();
        
        await projectsCollection.updateOne(
          { _id: project._id },
          {
            $set: {
              styleId: project.styleIdEnhanced,
              updatedAt: now
            },
            $unset: {
              styleIdEnhanced: ''
            }
          }
        );

        successCount++;
        console.log(`  ✅ Rolled back: ${project.eventName} (${project._id.toString()})`);
      } catch (error) {
        failCount++;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error(`  ❌ Failed: ${project.eventName} - ${errorMsg}`);
      }
    }

    console.log('\n============================');
    console.log('📊 Rollback Summary');
    console.log('============================');
    console.log(`✅ Successfully rolled back: ${successCount}`);
    console.log(`❌ Failed: ${failCount}\n`);

  } catch (error) {
    console.error('❌ Rollback failed:', error);
    process.exit(1);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const isExecute = args.includes('--execute');
  const isRollback = args.includes('--rollback');
  const isDryRun = !isExecute;

  if (isRollback) {
    await rollbackMigration(isDryRun);
  } else {
    await migrateStyleIds(isDryRun);
  }

  process.exit(0);
}

main();
