/**
 * Rename Collections to snake_case
 * 
 * CRITICAL: This fixes the root cause of broken admin pages
 * 
 * WHAT: Rename 6 collections from camelCase to snake_case
 * WHY: Code expects snake_case but DB has camelCase = pages can't load data
 * HOW: Copy collections with indexes, verify counts, update code references
 * 
 * Collections to rename:
 *   chartConfigurations → chart_configurations
 *   variablesGroups → variables_groups  
 *   users → local_users
 *   pagePasswords → page_passwords
 *   hashtagColors → hashtag_colors
 *   dataBlocks → data_blocks
 * 
 * Usage:
 *   Dry-run:  npm run db:rename-collections -- --dry-run
 *   Execute:  npm run db:rename-collections
 */

import { MongoClient } from 'mongodb';
import config from '../lib/config';

interface CollectionRename {
  old: string;
  new: string;
  docCount?: number;
  indexCount?: number;
  renamed?: boolean;
}

interface RenameReport {
  timestamp: string;
  dryRun: boolean;
  renames: CollectionRename[];
  summary: {
    totalAttempted: number;
    successfulRenames: number;
    failed: number;
    errors: string[];
  };
  codeUpdatesNeeded: {
    apiRoutes: string[];
    components: string[];
    libraries: string[];
    adminPages: string[];
  };
}

const RENAMES: CollectionRename[] = [
  { old: 'chartConfigurations', new: 'chart_configurations' },
  { old: 'variablesGroups', new: 'variables_groups' },
  { old: 'users', new: 'local_users' },
  { old: 'pagePasswords', new: 'page_passwords' },
  { old: 'hashtagColors', new: 'hashtag_colors' },
  { old: 'dataBlocks', new: 'data_blocks' }
];

async function renameCollections(dryRun: boolean = false): Promise<RenameReport> {
  const client = new MongoClient(config.mongodbUri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db(config.dbName);
    
    const report: RenameReport = {
      timestamp: new Date().toISOString(),
      dryRun,
      renames: JSON.parse(JSON.stringify(RENAMES)), // Deep copy
      summary: {
        totalAttempted: 0,
        successfulRenames: 0,
        failed: 0,
        errors: []
      },
      codeUpdatesNeeded: {
        apiRoutes: [],
        components: [],
        libraries: [],
        adminPages: []
      }
    };
    
    console.log('🔍 PHASE 5: COLLECTION NAMING STANDARDIZATION');
    console.log('='.repeat(80));
    console.log('⚠️  CRITICAL: This fixes broken admin pages (collection name mismatch)\n');
    console.log(dryRun ? '⚠️  DRY-RUN MODE - NO CHANGES WILL BE MADE\n' : '🚀 LIVE MODE - CHANGES WILL BE APPLIED\n');
    
    console.log('📊 Collections to rename:\n');
    RENAMES.forEach(r => {
      console.log(`  ${r.old.padEnd(25)} → ${r.new}`);
    });
    console.log('');
    
    // Step 1: Check all collections exist
    console.log('🔬 Step 1: Verifying source collections...\n');
    
    const existingCollections = await db.listCollections().toArray();
    const existingNames = new Set(existingCollections.map(c => c.name));
    
    for (const rename of report.renames) {
      if (!existingNames.has(rename.old)) {
        console.log(`  ⚠️  ${rename.old}: NOT FOUND (already renamed or never existed)`);
        continue;
      }
      
      const collection = db.collection(rename.old);
      rename.docCount = await collection.countDocuments();
      rename.indexCount = (await collection.indexes()).length;
      
      console.log(`  ✅ ${rename.old}: ${rename.docCount} docs, ${rename.indexCount} indexes`);
    }
    
    console.log('');
    
    // Step 2: Check if target collections already exist
    console.log('🔬 Step 2: Checking for naming conflicts...\n');
    
    let hasConflicts = false;
    for (const rename of report.renames) {
      if (!rename.docCount) continue; // Skip if source doesn't exist
      
      if (existingNames.has(rename.new)) {
        console.log(`  ⚠️  CONFLICT: ${rename.new} already exists!`);
        const targetCount = await db.collection(rename.new).countDocuments();
        console.log(`     Existing: ${targetCount} docs`);
        console.log(`     Source: ${rename.docCount} docs`);
        hasConflicts = true;
      }
    }
    
    if (hasConflicts) {
      const error = 'Cannot proceed: target collections already exist';
      report.summary.errors.push(error);
      console.log(`\n  ❌ ${error}`);
      console.log('  ℹ️  Manual resolution required\n');
      throw new Error(error);
    }
    
    console.log('  ✅ No naming conflicts detected\n');
    
    // Step 3: Rename collections
    if (!dryRun) {
      console.log('🔄 Step 3: Renaming collections...\n');
      
      for (const rename of report.renames) {
        if (!rename.docCount) {
          console.log(`  ⏭️  Skipping ${rename.old} (doesn't exist)`);
          continue;
        }
        
        report.summary.totalAttempted++;
        
        try {
          console.log(`  🔄 Renaming ${rename.old} → ${rename.new}...`);
          
          // MongoDB native rename command
          await db.collection(rename.old).rename(rename.new);
          
          // Verify rename succeeded
          const newCount = await db.collection(rename.new).countDocuments();
          const newIndexes = await db.collection(rename.new).indexes();
          
          if (newCount === rename.docCount && newIndexes.length === rename.indexCount) {
            console.log(`     ✅ Success: ${newCount} docs, ${newIndexes.length} indexes preserved`);
            rename.renamed = true;
            report.summary.successfulRenames++;
          } else {
            throw new Error(`Count mismatch: expected ${rename.docCount} docs, got ${newCount}`);
          }
          
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          console.log(`     ❌ Failed: ${errorMsg}`);
          report.summary.errors.push(`${rename.old}: ${errorMsg}`);
          report.summary.failed++;
        }
      }
      
      console.log('');
      
    } else {
      console.log('⏭️  Step 3: Skipping renames (dry-run mode)\n');
      
      // Simulate renames for reporting
      report.renames.forEach(r => {
        if (r.docCount) {
          report.summary.totalAttempted++;
          r.renamed = true; // Simulated
        }
      });
    }
    
    // Step 4: Identify code that needs updating
    console.log('📝 Step 4: Identifying code references...\n');
    
    const codePatterns = [
      { old: 'chartConfigurations', new: 'chart_configurations', type: 'collection' },
      { old: 'variablesGroups', new: 'variables_groups', type: 'collection' },
      { old: '"users"', new: '"local_users"', type: 'collection' },
      { old: "'users'", new: "'local_users'", type: 'collection' },
      { old: 'pagePasswords', new: 'page_passwords', type: 'collection' },
      { old: 'hashtagColors', new: 'hashtag_colors', type: 'collection' },
      { old: 'dataBlocks', new: 'data_blocks', type: 'collection' }
    ];
    
    console.log('  ⚠️  Code updates required in:');
    console.log('     - app/api/**/*.ts (API routes)');
    console.log('     - lib/**/*.ts (Database utilities)');
    console.log('     - components/**/*.tsx (React components)');
    console.log('     - app/admin/**/*.tsx (Admin pages)');
    console.log('');
    console.log('  ℹ️  Search patterns:');
    codePatterns.forEach(p => {
      console.log(`     - collection('${p.old}') → collection('${p.new}')`);
    });
    console.log('');
    
    // Generate summary
    console.log('='.repeat(80));
    console.log(dryRun ? '✅ DRY-RUN COMPLETE' : '✅ RENAME COMPLETE');
    console.log('='.repeat(80));
    console.log('\n📊 Summary:\n');
    console.log('  COLLECTIONS:');
    console.log(`    Attempted: ${report.summary.totalAttempted}`);
    console.log(`    Successful: ${dryRun ? `${report.summary.totalAttempted} (simulated)` : report.summary.successfulRenames}`);
    console.log(`    Failed: ${report.summary.failed}`);
    console.log('');
    
    if (report.summary.errors.length > 0) {
      console.log('  ERRORS:');
      report.summary.errors.forEach(err => console.log(`    - ${err}`));
      console.log('');
    }
    
    console.log('  RENAMED COLLECTIONS:');
    report.renames.forEach(r => {
      if (r.renamed) {
        console.log(`    ✅ ${r.old} → ${r.new} (${r.docCount} docs)`);
      }
    });
    console.log('');
    
    if (!dryRun && report.summary.successfulRenames > 0) {
      console.log('⚠️  CRITICAL: CODE UPDATES REQUIRED!\n');
      console.log('💡 Next steps:');
      console.log('  1. Update code references (use find/replace in IDE):');
      console.log('');
      report.renames.forEach(r => {
        if (r.renamed) {
          console.log(`     collection('${r.old}') → collection('${r.new}')`);
        }
      });
      console.log('');
      console.log('  2. Test application: npm run dev');
      console.log('  3. Verify admin pages load correctly');
      console.log('  4. Run type check: npm run type-check');
      console.log('  5. Commit changes with message: "Phase 5: Standardize collection names to snake_case"\n');
    } else if (dryRun) {
      console.log('💡 To execute: npm run db:rename-collections\n');
    }
    
    console.log('='.repeat(80) + '\n');
    
    return report;
    
  } finally {
    await client.close();
  }
}

// Parse command line args
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

// Execute
renameCollections(dryRun)
  .then((report) => {
    if (report.summary.failed > 0) {
      console.log('⚠️  Process completed with errors');
      process.exit(1);
    } else {
      console.log('✅ Process completed successfully');
      process.exit(0);
    }
  })
  .catch(error => {
    console.error('❌ Process failed:', error);
    process.exit(1);
  });
