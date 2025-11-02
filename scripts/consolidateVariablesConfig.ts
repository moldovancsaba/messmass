/**
 * Consolidate Variables Configuration Systems
 * 
 * WHAT: Verify variablesConfig (26 docs) data exists in variables_metadata (125 docs), then remove legacy
 * WHY: Two systems cause confusion - need single source of truth
 * HOW: Cross-reference all legacy variables, ensure no data loss, drop old collection
 * 
 * Usage:
 *   Dry-run:  npm run db:consolidate-variables -- --dry-run
 *   Execute:  npm run db:consolidate-variables
 */

import { MongoClient, ObjectId } from 'mongodb';
import config from '../lib/config';

interface LegacyVariable {
  _id: string;
  name: string;
  flags?: {
    visibleInClicker?: boolean;
    editableInManual?: boolean;
  };
  clickerOrder?: number;
  manualOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface ModernVariable {
  _id: ObjectId;
  name: string;
  label: string;
  type: string;
  category: string;
  derived: boolean;
  flags: {
    visibleInClicker: boolean;
    editableInManual: boolean;
  };
  isSystem: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface ConsolidationReport {
  timestamp: string;
  dryRun: boolean;
  beforeState: {
    legacyCount: number;
    modernCount: number;
  };
  afterState: {
    modernCount: number;
    legacyCount: number;
  };
  analysis: {
    legacyVariables: string[];
    foundInModern: string[];
    missingInModern: string[];
    flagMismatches: Array<{
      variable: string;
      legacyFlags: any;
      modernFlags: any;
    }>;
  };
  actions: {
    collectionsDropped: number;
    errors: string[];
  };
}

async function consolidateVariables(dryRun: boolean = false): Promise<ConsolidationReport> {
  const client = new MongoClient(config.mongodbUri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db(config.dbName);
    const legacyCollection = db.collection('variablesConfig');
    const modernCollection = db.collection('variables_metadata');
    
    // Initialize report
    const report: ConsolidationReport = {
      timestamp: new Date().toISOString(),
      dryRun,
      beforeState: {
        legacyCount: 0,
        modernCount: 0
      },
      afterState: {
        modernCount: 0,
        legacyCount: 0
      },
      analysis: {
        legacyVariables: [],
        foundInModern: [],
        missingInModern: [],
        flagMismatches: []
      },
      actions: {
        collectionsDropped: 0,
        errors: []
      }
    };
    
    console.log('🔍 PHASE 4: CONSOLIDATE VARIABLES CONFIGURATION');
    console.log('='.repeat(80));
    console.log(dryRun ? '⚠️  DRY-RUN MODE - NO CHANGES WILL BE MADE\n' : '🚀 LIVE MODE - CHANGES WILL BE APPLIED\n');
    
    // Step 1: Count documents
    console.log('📊 Step 1: Analyzing current state...\n');
    
    const legacyCount = await legacyCollection.countDocuments();
    const modernCount = await modernCollection.countDocuments();
    
    report.beforeState.legacyCount = legacyCount;
    report.beforeState.modernCount = modernCount;
    
    console.log(`  Legacy system (variablesConfig): ${legacyCount} docs`);
    console.log(`  Modern system (variables_metadata): ${modernCount} docs\n`);
    
    if (legacyCount === 0) {
      console.log('✅ No legacy variables found. System already consolidated!');
      return report;
    }
    
    // Step 2: Load all variables
    console.log('🔬 Step 2: Cross-referencing variable systems...\n');
    
    const legacyVars = await legacyCollection.find({}).toArray() as unknown as LegacyVariable[];
    const modernVars = await modernCollection.find({}).toArray() as unknown as ModernVariable[];
    
    // Create lookup map for modern variables
    const modernMap = new Map<string, ModernVariable>();
    modernVars.forEach(v => modernMap.set(v.name, v));
    
    report.analysis.legacyVariables = legacyVars.map(v => v.name);
    
    // Check each legacy variable
    for (const legacyVar of legacyVars) {
      const modernVar = modernMap.get(legacyVar.name);
      
      if (modernVar) {
        report.analysis.foundInModern.push(legacyVar.name);
        
        // Check for flag mismatches
        if (legacyVar.flags) {
          const legacyVisible = legacyVar.flags.visibleInClicker ?? false;
          const legacyEditable = legacyVar.flags.editableInManual ?? false;
          const modernVisible = modernVar.flags.visibleInClicker;
          const modernEditable = modernVar.flags.editableInManual;
          
          if (legacyVisible !== modernVisible || legacyEditable !== modernEditable) {
            report.analysis.flagMismatches.push({
              variable: legacyVar.name,
              legacyFlags: legacyVar.flags,
              modernFlags: modernVar.flags
            });
          }
        }
      } else {
        report.analysis.missingInModern.push(legacyVar.name);
      }
    }
    
    console.log(`  Legacy variables: ${legacyVars.length}`);
    console.log(`  Found in modern system: ${report.analysis.foundInModern.length}`);
    console.log(`  Missing in modern system: ${report.analysis.missingInModern.length}`);
    console.log(`  Flag mismatches: ${report.analysis.flagMismatches.length}\n`);
    
    if (report.analysis.missingInModern.length > 0) {
      console.log('  ⚠️  Missing variables:');
      report.analysis.missingInModern.forEach(name => console.log(`    - ${name}`));
      console.log('');
    }
    
    if (report.analysis.flagMismatches.length > 0) {
      console.log('  ℹ️  Flag mismatches detected:');
      report.analysis.flagMismatches.slice(0, 5).forEach(m => {
        console.log(`    - ${m.variable}:`);
        console.log(`      Legacy: visible=${m.legacyFlags.visibleInClicker}, editable=${m.legacyFlags.editableInManual}`);
        console.log(`      Modern: visible=${m.modernFlags.visibleInClicker}, editable=${m.modernFlags.editableInManual}`);
      });
      if (report.analysis.flagMismatches.length > 5) {
        console.log(`    ... and ${report.analysis.flagMismatches.length - 5} more`);
      }
      console.log('  ℹ️  Modern system flags will be preserved (v7.0.0+ is authoritative)\n');
    }
    
    // Step 3: Verification
    console.log('🔬 Step 3: Verifying data completeness...\n');
    
    if (report.analysis.missingInModern.length > 0) {
      const errorMsg = `Cannot consolidate: ${report.analysis.missingInModern.length} variables missing in modern system`;
      report.actions.errors.push(errorMsg);
      console.error(`  ❌ ${errorMsg}`);
      console.log('  ℹ️  These variables must be migrated manually before consolidation can proceed\n');
      throw new Error(errorMsg);
    }
    
    console.log('  ✅ All legacy variables exist in modern system');
    console.log('  ✅ Safe to drop legacy collection\n');
    
    // Step 4: Drop legacy collection
    if (!dryRun) {
      console.log('🗑️  Step 4: Dropping legacy collection...\n');
      
      try {
        await legacyCollection.drop();
        report.actions.collectionsDropped = 1;
        report.afterState.legacyCount = 0;
        report.afterState.modernCount = modernCount;
        
        console.log('  ✅ Dropped variablesConfig collection\n');
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        report.actions.errors.push(`Drop collection failed: ${errorMsg}`);
        console.error(`  ❌ Failed to drop collection: ${errorMsg}\n`);
        throw error;
      }
      
    } else {
      console.log('⏭️  Step 4: Skipping collection drop (dry-run mode)\n');
      report.afterState.legacyCount = legacyCount;
      report.afterState.modernCount = modernCount;
    }
    
    // Generate summary
    console.log('='.repeat(80));
    console.log(dryRun ? '✅ DRY-RUN COMPLETE' : '✅ CONSOLIDATION COMPLETE');
    console.log('='.repeat(80));
    console.log('\n📊 Summary:\n');
    console.log('  BEFORE:');
    console.log(`    Legacy system (variablesConfig): ${report.beforeState.legacyCount} docs`);
    console.log(`    Modern system (variables_metadata): ${report.beforeState.modernCount} docs`);
    console.log('');
    console.log('  VERIFICATION:');
    console.log(`    All ${legacyCount} legacy variables found in modern system: ✅`);
    console.log(`    Missing variables: ${report.analysis.missingInModern.length}`);
    console.log(`    Flag mismatches (non-blocking): ${report.analysis.flagMismatches.length}`);
    console.log('');
    console.log('  AFTER:');
    console.log(`    Modern system: ${report.afterState.modernCount} docs (unchanged)`);
    console.log(`    Legacy system: ${dryRun ? `${legacyCount} (unchanged)` : report.afterState.legacyCount} docs`);
    console.log('');
    
    if (report.actions.errors.length > 0) {
      console.log('❌ ERRORS:');
      report.actions.errors.forEach(err => console.log(`  - ${err}`));
      console.log('');
    }
    
    if (!dryRun && report.actions.collectionsDropped > 0) {
      console.log('💡 Next steps:');
      console.log('  1. Verify data: npm run audit:database');
      console.log('  2. Test variables functionality in admin UI');
      console.log('  3. Proceed to Phase 5: npm run db:rename-collections\n');
    } else if (dryRun) {
      console.log('💡 To execute: npm run db:consolidate-variables\n');
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
consolidateVariables(dryRun)
  .then(() => {
    console.log('✅ Process completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Process failed:', error);
    process.exit(1);
  });
