/**
 * Consolidate Bitly Junction Tables
 * 
 * WHAT: Merge bitly_link_project_junction (22 docs) into bitly_project_links (252 docs)
 * WHY: Eliminate data fragmentation - all Bitly-Project associations in one place
 * HOW: Copy 22 legacy docs with proper field mapping, then drop old collection
 * 
 * Usage:
 *   Dry-run:  npm run db:consolidate-bitly -- --dry-run
 *   Execute:  npm run db:consolidate-bitly
 */

import { MongoClient, ObjectId } from 'mongodb';
import config from '../lib/config';

interface LegacyJunction {
  _id: ObjectId;
  bitlyLinkId: ObjectId;
  projectId: ObjectId;
  autoCalculated?: boolean;
  createdAt: string;
}

interface ModernJunction {
  _id?: ObjectId;
  bitlyLinkId: ObjectId;
  projectId: ObjectId;
  startDate?: string;
  endDate?: string | null;
  autoCalculated: boolean;
  cachedMetrics: {
    clicks: number;
    uniqueClicks: number;
    topCountries: any[];
    topReferrers: any[];
    deviceClicks: Record<string, number>;
    browserClicks: Record<string, number>;
    dailyClicks: any[];
  };
  createdAt: string;
  updatedAt: string;
  lastSyncedAt: string | null;
}

interface ConsolidationReport {
  timestamp: string;
  dryRun: boolean;
  beforeState: {
    legacyCount: number;
    modernCount: number;
    totalBefore: number;
  };
  afterState: {
    modernCount: number;
    legacyCount: number;
  };
  migration: {
    documentsToMigrate: number;
    documentsMigrated: number;
    duplicatesSkipped: number;
    errors: string[];
  };
  overlapCheck: {
    overlappingPairs: number;
    overlappingIds: string[];
  };
}

async function consolidateBitlyJunctions(dryRun: boolean = false): Promise<ConsolidationReport> {
  const client = new MongoClient(config.mongodbUri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db(config.dbName);
    const legacyCollection = db.collection('bitly_link_project_junction');
    const modernCollection = db.collection('bitly_project_links');
    
    // Initialize report
    const report: ConsolidationReport = {
      timestamp: new Date().toISOString(),
      dryRun,
      beforeState: {
        legacyCount: 0,
        modernCount: 0,
        totalBefore: 0
      },
      afterState: {
        modernCount: 0,
        legacyCount: 0
      },
      migration: {
        documentsToMigrate: 0,
        documentsMigrated: 0,
        duplicatesSkipped: 0,
        errors: []
      },
      overlapCheck: {
        overlappingPairs: 0,
        overlappingIds: []
      }
    };
    
    console.log('🔍 PHASE 3: CONSOLIDATE BITLY JUNCTION TABLES');
    console.log('='.repeat(80));
    console.log(dryRun ? '⚠️  DRY-RUN MODE - NO CHANGES WILL BE MADE\n' : '🚀 LIVE MODE - CHANGES WILL BE APPLIED\n');
    
    // Step 1: Count documents
    console.log('📊 Step 1: Analyzing current state...\n');
    
    const legacyCount = await legacyCollection.countDocuments();
    const modernCount = await modernCollection.countDocuments();
    
    report.beforeState.legacyCount = legacyCount;
    report.beforeState.modernCount = modernCount;
    report.beforeState.totalBefore = legacyCount + modernCount;
    
    console.log(`  Legacy table (bitly_link_project_junction): ${legacyCount} docs`);
    console.log(`  Modern table (bitly_project_links): ${modernCount} docs`);
    console.log(`  Total associations: ${legacyCount + modernCount} docs\n`);
    
    if (legacyCount === 0) {
      console.log('✅ No legacy documents to migrate. Collection already clean!');
      return report;
    }
    
    // Step 2: Check for overlaps
    console.log('🔬 Step 2: Checking for overlapping data...\n');
    
    const legacyDocs = await legacyCollection.find({}).toArray() as unknown as LegacyJunction[];
    const modernDocs = await modernCollection.find({}).toArray() as unknown as ModernJunction[];
    
    // Create sets of project-link pairs
    const legacyPairs = new Set(
      legacyDocs.map(doc => `${doc.projectId.toString()}-${doc.bitlyLinkId.toString()}`)
    );
    
    const modernPairs = new Set(
      modernDocs.map(doc => `${doc.projectId.toString()}-${doc.bitlyLinkId.toString()}`)
    );
    
    // Find overlaps
    const overlaps = Array.from(legacyPairs).filter(pair => modernPairs.has(pair));
    
    report.overlapCheck.overlappingPairs = overlaps.length;
    report.overlapCheck.overlappingIds = overlaps;
    
    if (overlaps.length > 0) {
      console.log(`  ⚠️  Found ${overlaps.length} overlapping pairs:`);
      overlaps.slice(0, 5).forEach(pair => console.log(`    - ${pair}`));
      if (overlaps.length > 5) {
        console.log(`    ... and ${overlaps.length - 5} more`);
      }
      console.log('  ℹ️  These duplicates will be skipped during migration\n');
    } else {
      console.log(`  ✅ No overlaps found - all ${legacyCount} docs are unique\n`);
    }
    
    // Step 3: Prepare migration
    console.log('📦 Step 3: Preparing documents for migration...\n');
    
    const now = new Date().toISOString();
    const docsToMigrate: ModernJunction[] = [];
    
    for (const legacyDoc of legacyDocs) {
      const pairKey = `${legacyDoc.projectId.toString()}-${legacyDoc.bitlyLinkId.toString()}`;
      
      // Skip if already exists in modern table
      if (modernPairs.has(pairKey)) {
        report.migration.duplicatesSkipped++;
        continue;
      }
      
      // Transform legacy doc to modern format
      const modernDoc: ModernJunction = {
        bitlyLinkId: legacyDoc.bitlyLinkId,
        projectId: legacyDoc.projectId,
        startDate: undefined, // Will be calculated later if needed
        endDate: null,
        autoCalculated: legacyDoc.autoCalculated ?? true,
        cachedMetrics: {
          clicks: 0,
          uniqueClicks: 0,
          topCountries: [],
          topReferrers: [],
          deviceClicks: { mobile: 0, desktop: 0, tablet: 0, other: 0 },
          browserClicks: { chrome: 0, firefox: 0, safari: 0, edge: 0, other: 0 },
          dailyClicks: []
        },
        createdAt: legacyDoc.createdAt || now,
        updatedAt: now,
        lastSyncedAt: null // Metrics need to be synced
      };
      
      docsToMigrate.push(modernDoc);
    }
    
    report.migration.documentsToMigrate = docsToMigrate.length;
    
    console.log(`  Documents to migrate: ${docsToMigrate.length}`);
    console.log(`  Duplicates to skip: ${report.migration.duplicatesSkipped}`);
    
    if (docsToMigrate.length > 0) {
      console.log('\n  Sample migrated document:');
      console.log(JSON.stringify(docsToMigrate[0], null, 2));
    }
    
    console.log('');
    
    // Step 4: Execute migration
    if (!dryRun && docsToMigrate.length > 0) {
      console.log('🚀 Step 4: Migrating documents...\n');
      
      try {
        const insertResult = await modernCollection.insertMany(docsToMigrate);
        report.migration.documentsMigrated = insertResult.insertedCount;
        
        console.log(`  ✅ Migrated ${insertResult.insertedCount} documents to bitly_project_links`);
        
        // Verify count
        const newModernCount = await modernCollection.countDocuments();
        console.log(`  ✅ New total in bitly_project_links: ${newModernCount} docs\n`);
        
        report.afterState.modernCount = newModernCount;
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        report.migration.errors.push(`Migration failed: ${errorMsg}`);
        console.error(`  ❌ Migration failed: ${errorMsg}\n`);
        throw error;
      }
      
      // Step 5: Drop legacy collection
      console.log('🗑️  Step 5: Dropping legacy collection...\n');
      
      try {
        await legacyCollection.drop();
        console.log('  ✅ Dropped bitly_link_project_junction collection\n');
        
        report.afterState.legacyCount = 0;
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        report.migration.errors.push(`Drop collection failed: ${errorMsg}`);
        console.error(`  ❌ Failed to drop collection: ${errorMsg}\n`);
      }
      
    } else if (dryRun) {
      console.log('⏭️  Step 4: Skipping migration (dry-run mode)\n');
      console.log('⏭️  Step 5: Skipping collection drop (dry-run mode)\n');
      
      // Simulate final state
      report.afterState.modernCount = modernCount + docsToMigrate.length;
      report.afterState.legacyCount = 0;
    }
    
    // Generate summary
    console.log('='.repeat(80));
    console.log(dryRun ? '✅ DRY-RUN COMPLETE' : '✅ CONSOLIDATION COMPLETE');
    console.log('='.repeat(80));
    console.log('\n📊 Summary:\n');
    console.log('  BEFORE:');
    console.log(`    Legacy table: ${report.beforeState.legacyCount} docs`);
    console.log(`    Modern table: ${report.beforeState.modernCount} docs`);
    console.log(`    Total: ${report.beforeState.totalBefore} docs`);
    console.log('');
    console.log('  MIGRATION:');
    console.log(`    Documents migrated: ${dryRun ? `${docsToMigrate.length} (simulated)` : report.migration.documentsMigrated}`);
    console.log(`    Duplicates skipped: ${report.migration.duplicatesSkipped}`);
    console.log(`    Errors: ${report.migration.errors.length}`);
    console.log('');
    console.log('  AFTER:');
    console.log(`    Modern table: ${report.afterState.modernCount} docs`);
    console.log(`    Legacy table: ${dryRun ? '22 (unchanged)' : report.afterState.legacyCount} docs`);
    console.log('');
    
    if (report.migration.errors.length > 0) {
      console.log('❌ ERRORS:');
      report.migration.errors.forEach(err => console.log(`  - ${err}`));
      console.log('');
    }
    
    if (!dryRun && report.migration.documentsMigrated > 0) {
      console.log('💡 Next steps:');
      console.log('  1. Verify data: npm run audit:database');
      console.log('  2. Test Bitly functionality in admin UI');
      console.log('  3. Proceed to Phase 4: npm run db:consolidate-variables\n');
    } else if (dryRun) {
      console.log('💡 To execute: npm run db:consolidate-bitly\n');
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
consolidateBitlyJunctions(dryRun)
  .then(() => {
    console.log('✅ Process completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Process failed:', error);
    process.exit(1);
  });
