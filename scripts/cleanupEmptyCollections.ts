#!/usr/bin/env ts-node

/**
 * Clean Up Empty and Unused Collections Script
 * 
 * WHAT: Identifies and removes empty collections after verifying they're not referenced in code
 * WHY: Clean database with only active collections improves maintainability
 * 
 * Actions:
 * 1. List all collections with 0 documents
 * 2. Search codebase for references to each empty collection
 * 3. Safely drop unreferenced empty collections
 * 4. Document collections marked as "reserved for future use"
 * 5. Generate cleanup report
 */

import { MongoClient } from 'mongodb';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const MONGODB_URI = process.env.MONGODB_URI || '';
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

interface EmptyCollection {
  name: string;
  codeReferences: number;
  action: 'drop' | 'keep' | 'reserved';
  reason: string;
}

async function cleanupEmptyCollections(dryRun = false) {
  console.log('🧹 Clean Up Empty and Unused Collections Script');
  console.log('═'.repeat(60));
  console.log(`Mode: ${dryRun ? 'DRY RUN (no collections will be dropped)' : 'LIVE MODE (collections will be dropped)'}\n`);

  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is required');
  }

  const client = new MongoClient(MONGODB_URI);
  const results: EmptyCollection[] = [];

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db(MONGODB_DB);

    // Step 1: Find all collections
    console.log('📊 Step 1: Analyzing all collections...');
    const collections = await db.listCollections().toArray();
    
    const emptyCollections: string[] = [];
    for (const col of collections) {
      const count = await db.collection(col.name).countDocuments();
      if (count === 0) {
        emptyCollections.push(col.name);
      }
    }

    console.log(`   Total collections: ${collections.length}`);
    console.log(`   Empty collections: ${emptyCollections.length}\n`);

    if (emptyCollections.length === 0) {
      console.log('✅ No empty collections found - database is clean!\n');
      return;
    }

    console.log('📋 Empty collections found:');
    emptyCollections.forEach(name => console.log(`   - ${name}`));
    console.log();

    // Step 2: Search codebase for references
    console.log('🔍 Step 2: Searching codebase for references...\n');
    
    for (const collectionName of emptyCollections) {
      console.log(`   Checking: ${collectionName}`);
      
      // Search for references in code
      let refCount = 0;
      try {
        const searchResult = execSync(
          `grep -r "collection('${collectionName}')" app/ lib/ components/ scripts/ 2>/dev/null || true`,
          { encoding: 'utf-8', cwd: process.cwd() }
        );
        const searchResult2 = execSync(
          `grep -r 'collection("${collectionName}")' app/ lib/ components/ scripts/ 2>/dev/null || true`,
          { encoding: 'utf-8', cwd: process.cwd() }
        );
        const searchResult3 = execSync(
          `grep -r "collection(\\\`${collectionName}\\\`)" app/ lib/ components/ scripts/ 2>/dev/null || true`,
          { encoding: 'utf-8', cwd: process.cwd() }
        );
        
        const lines1 = searchResult.trim().split('\n').filter(l => l.length > 0);
        const lines2 = searchResult2.trim().split('\n').filter(l => l.length > 0);
        const lines3 = searchResult3.trim().split('\n').filter(l => l.length > 0);
        refCount = lines1.length + lines2.length + lines3.length;
      } catch (error) {
        // grep returns non-zero if no matches, which is fine
        refCount = 0;
      }

      let action: 'drop' | 'keep' | 'reserved' = 'drop';
      let reason = '';

      // Decision logic
      if (refCount > 0) {
        action = 'reserved';
        reason = `Referenced in ${refCount} file(s) - reserved for future use`;
      } else {
        // Known legacy/unused collections
        if (['event_comparisons', 'partner_analytics', 'charts'].includes(collectionName)) {
          action = 'drop';
          reason = 'Legacy collection with no code references';
        } else {
          action = 'drop';
          reason = 'Empty with no code references';
        }
      }

      results.push({
        name: collectionName,
        codeReferences: refCount,
        action,
        reason
      });

      console.log(`      References: ${refCount} | Action: ${action.toUpperCase()}`);
    }

    console.log();

    // Step 3: Drop unreferenced empty collections
    const toDrop = results.filter(r => r.action === 'drop');
    const toKeep = results.filter(r => r.action === 'reserved');

    console.log('═'.repeat(60));
    console.log('📊 Cleanup Plan:\n');
    console.log(`   Collections to drop: ${toDrop.length}`);
    console.log(`   Collections to keep (reserved): ${toKeep.length}\n`);

    if (toDrop.length > 0) {
      console.log('🗑️  Collections to be dropped:');
      toDrop.forEach(col => console.log(`   - ${col.name}: ${col.reason}`));
      console.log();
    }

    if (toKeep.length > 0) {
      console.log('📌 Collections to keep (reserved):');
      toKeep.forEach(col => console.log(`   - ${col.name}: ${col.reason}`));
      console.log();
    }

    // Execute drops
    if (!dryRun && toDrop.length > 0) {
      console.log('🔧 Step 3: Dropping empty collections...\n');
      let dropped = 0;
      let failed = 0;

      for (const col of toDrop) {
        try {
          await db.collection(col.name).drop();
          console.log(`   ✅ Dropped: ${col.name}`);
          dropped++;
        } catch (error) {
          console.error(`   ❌ Failed to drop ${col.name}:`, error);
          failed++;
        }
      }

      console.log();
      console.log('═'.repeat(60));
      console.log(`✅ Dropped ${dropped} collections`);
      if (failed > 0) {
        console.log(`⚠️  Failed to drop ${failed} collections`);
      }
    } else if (dryRun) {
      console.log('📝 DRY RUN - No collections dropped\n');
    }

    // Generate report
    await generateReport(results, emptyCollections.length, dryRun);

    console.log('═'.repeat(60));
    console.log('✅ Script completed successfully\n');

    if (!dryRun && toDrop.length > 0) {
      console.log('⚡ Next Steps:');
      console.log('1. Verify application still works correctly');
      console.log('2. Review EMPTY_COLLECTIONS_REPORT.md');
      console.log('3. Update ARCHITECTURE.md with collection inventory\n');
    } else if (dryRun) {
      console.log('💡 To apply changes, run again without --dry-run flag\n');
    }

  } catch (error) {
    console.error('❌ Error during script execution:', error);
    throw error;
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

async function generateReport(
  results: EmptyCollection[],
  totalEmpty: number,
  dryRun: boolean
) {
  console.log('📄 Generating cleanup report...');

  const timestamp = new Date().toISOString();
  const dropped = results.filter(r => r.action === 'drop');
  const reserved = results.filter(r => r.action === 'reserved');

  const report = `# Empty Collections Cleanup Report

**Generated:** ${timestamp}  
**Mode:** ${dryRun ? 'Dry Run' : 'Live Execution'}

## Summary

- **Total Empty Collections Found:** ${totalEmpty}
- **Collections Dropped:** ${dropped.length}
- **Collections Reserved:** ${reserved.length}
- **Status:** ${dryRun ? '📝 Dry Run - No Changes' : '✅ Cleanup Complete'}

## Overview

This report documents the cleanup of empty collections from the MessMass database.

### Cleanup Strategy

1. **Identify** all collections with 0 documents
2. **Search** codebase for any references to empty collections
3. **Drop** unreferenced empty collections (safe to remove)
4. **Keep** referenced empty collections (reserved for future use)

## Collections Dropped

${dropped.length === 0 ? 'None - all empty collections are referenced or already cleaned up.\n' : ''}${dropped.map((col, index) => `
### ${index + 1}. \`${col.name}\`

- **Code References:** ${col.codeReferences}
- **Reason:** ${col.reason}
- **Action:** ${dryRun ? 'Would drop' : 'Dropped'}
`).join('\n')}

## Collections Reserved (Not Dropped)

${reserved.length === 0 ? 'None - all empty collections were safe to drop.\n' : ''}${reserved.map((col, index) => `
### ${index + 1}. \`${col.name}\`

- **Code References:** ${col.codeReferences}
- **Reason:** ${col.reason}
- **Action:** Kept (reserved for future use)
- **Recommendation:** Document purpose in ARCHITECTURE.md or remove code references and re-run cleanup
`).join('\n')}

## Database Impact

### Before Cleanup
- Total empty collections: ${totalEmpty}
- Database overhead from unused collections

### After Cleanup
- Empty collections removed: ${dropped.length}
- Reserved empty collections: ${reserved.length}
- Cleaner database structure
- Easier maintenance and understanding

## Recommendations

${reserved.length > 0 ? `
### Reserved Collections Action Items

For each reserved collection:

1. **Document Purpose**: Add to ARCHITECTURE.md explaining why it exists
2. **Implement Feature**: If planned, prioritize implementation
3. **Remove if Unused**: If no longer needed, remove code references and re-run cleanup
` : `
✅ No reserved collections - all empty collections have been cleaned up!
`}

## Prevention Strategy

To avoid empty collection accumulation in the future:

1. **Before Creating Collections:**
   - Document purpose in ARCHITECTURE.md
   - Ensure feature implementation is complete
   - Don't create collections "just in case"

2. **Regular Audits:**
   - Run this cleanup script quarterly
   - Review collection purposes annually
   - Remove unused features completely (code + database)

3. **Development Workflow:**
   - Use migrations for schema changes
   - Test on development databases first
   - Clean up after failed experiments

---

*Generated by: \`scripts/cleanupEmptyCollections.ts\`*  
*Database: ${MONGODB_DB}*  
*Timestamp: ${timestamp}*
`;

  const reportPath = path.join(process.cwd(), 'EMPTY_COLLECTIONS_REPORT.md');
  fs.writeFileSync(reportPath, report, 'utf-8');
  console.log(`   ✅ Report saved to: ${reportPath}\n`);
}

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

// Execute script
cleanupEmptyCollections(dryRun).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
