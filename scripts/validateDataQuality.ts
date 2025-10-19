#!/usr/bin/env ts-node
/**
 * Data Quality Migration Script
 * 
 * WHAT: Audits all projects, validates data completeness, and backfills missing metrics
 * WHY: Fix legacy data gaps to ensure fail-proof analytics
 * HOW: Scan MongoDB, compute derived metrics, report quality, optionally fix
 * 
 * Usage:
 *   npm run data:audit           # Dry run - report only
 *   npm run data:fix             # Fix missing derived metrics
 *   npm run data:fix-all         # Fix all computable metrics
 * 
 * Version: 6.32.0
 * Created: 2025-10-19T18:08:00.000Z
 */

// WHAT: Load environment variables before importing config
// WHY: Ensure MONGODB_URI is available at runtime
import * as dotenv from 'dotenv';
import { MongoClient, ObjectId } from 'mongodb';

// Load .env.local explicitly
dotenv.config({ path: '.env.local' });
import {
  validateProjectStats,
  ensureDerivedMetrics,
  prepareStatsForAnalytics,
  type ProjectStats,
  type ValidationResult,
  REQUIRED_BASE_METRICS,
  DERIVED_METRICS,
  OPTIONAL_METRICS
} from '../lib/dataValidator';

// WHAT: MongoDB connection configuration
// WHY: Direct database access for bulk operations
const MONGODB_URI = process.env.MONGODB_URI || '';
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

// WHAT: Script configuration
interface ScriptConfig {
  mode: 'audit' | 'fix-derived' | 'fix-all';
  batchSize: number;
  dryRun: boolean;
  verbose: boolean;
}

// WHAT: Project document from MongoDB
interface ProjectDocument {
  _id: ObjectId;
  eventName: string;
  eventDate: string;
  stats: Partial<ProjectStats>;
  updatedAt?: string;
}

// WHAT: Migration statistics
interface MigrationStats {
  totalProjects: number;
  projectsScanned: number;
  projectsWithIssues: number;
  projectsFixed: number;
  projectsFailed: number;
  qualityDistribution: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
    insufficient: number;
  };
  derivedMetricsAdded: {
    allImages: number;
    remoteFans: number;
    totalFans: number;
  };
  missingRequiredByField: Record<string, number>;
  missingOptionalByField: Record<string, number>;
  errors: Array<{ projectId: string; eventName: string; error: string }>;
}

/**
 * WHAT: Initialize migration statistics
 * WHY: Track progress and results
 */
function initStats(): MigrationStats {
  return {
    totalProjects: 0,
    projectsScanned: 0,
    projectsWithIssues: 0,
    projectsFixed: 0,
    projectsFailed: 0,
    qualityDistribution: {
      excellent: 0,
      good: 0,
      fair: 0,
      poor: 0,
      insufficient: 0
    },
    derivedMetricsAdded: {
      allImages: 0,
      remoteFans: 0,
      totalFans: 0
    },
    missingRequiredByField: {},
    missingOptionalByField: {},
    errors: []
  };
}

/**
 * WHAT: Format timestamp in ISO 8601 with milliseconds
 * WHY: Consistent with project timestamp standards
 */
function nowISO(): string {
  return new Date().toISOString();
}

/**
 * WHAT: Log message with timestamp
 * WHY: Traceable execution log
 */
function log(message: string, level: 'info' | 'warn' | 'error' = 'info') {
  const timestamp = nowISO();
  const prefix = {
    info: '✓',
    warn: '⚠',
    error: '✗'
  }[level];
  
  console.log(`[${timestamp}] ${prefix} ${message}`);
}

/**
 * WHAT: Audit a single project's data quality
 * WHY: Identify issues and compute fixes
 * 
 * @returns Validation result and computed fixes
 */
function auditProject(
  project: ProjectDocument
): {
  validation: ValidationResult;
  fixes: Partial<ProjectStats>;
  needsFix: boolean;
} {
  const stats = project.stats || {};
  
  // WHAT: Validate current stats
  const validation = validateProjectStats(stats);
  
  // WHAT: Compute derived metrics if missing
  const fixes: Partial<ProjectStats> = {};
  let needsFix = false;
  
  // Check allImages
  if ((stats.allImages === undefined || stats.allImages === null) &&
      stats.remoteImages !== undefined &&
      stats.hostessImages !== undefined &&
      stats.selfies !== undefined) {
    fixes.allImages = (stats.remoteImages || 0) + (stats.hostessImages || 0) + (stats.selfies || 0);
    needsFix = true;
  }
  
  // Check remoteFans
  if ((stats.remoteFans === undefined || stats.remoteFans === null) &&
      stats.indoor !== undefined &&
      stats.outdoor !== undefined) {
    fixes.remoteFans = (stats.indoor || 0) + (stats.outdoor || 0);
    needsFix = true;
  }
  
  // Check totalFans
  if ((stats.totalFans === undefined || stats.totalFans === null)) {
    const remoteFans = fixes.remoteFans ?? stats.remoteFans ?? 
      ((stats.indoor || 0) + (stats.outdoor || 0));
    const stadium = stats.stadium || 0;
    fixes.totalFans = remoteFans + stadium;
    needsFix = true;
  }
  
  return { validation, fixes, needsFix };
}

/**
 * WHAT: Apply fixes to a project
 * WHY: Update MongoDB with computed metrics
 */
async function fixProject(
  client: MongoClient,
  project: ProjectDocument,
  fixes: Partial<ProjectStats>,
  config: ScriptConfig
): Promise<boolean> {
  if (config.dryRun) {
    log(`[DRY RUN] Would fix project: ${project.eventName}`, 'info');
    return true;
  }
  
  try {
    const db = client.db(MONGODB_DB);
    const collection = db.collection('projects');
    
    // WHAT: Merge fixes into stats object
    const updatedStats = {
      ...project.stats,
      ...fixes
    };
    
    // WHAT: Update project with new stats and timestamp
    const result = await collection.updateOne(
      { _id: project._id },
      {
        $set: {
          stats: updatedStats,
          updatedAt: nowISO()
        }
      }
    );
    
    if (result.modifiedCount === 1) {
      if (config.verbose) {
        log(`Fixed project: ${project.eventName} (${project._id})`, 'info');
      }
      return true;
    } else {
      log(`Failed to update project: ${project.eventName}`, 'error');
      return false;
    }
  } catch (error) {
    log(`Error fixing project ${project.eventName}: ${error}`, 'error');
    return false;
  }
}

/**
 * WHAT: Generate detailed report of migration results
 * WHY: Provide actionable insights for data quality
 */
function generateReport(stats: MigrationStats, config: ScriptConfig): void {
  console.log('\n' + '='.repeat(80));
  console.log('DATA QUALITY MIGRATION REPORT');
  console.log('='.repeat(80));
  console.log(`Mode: ${config.mode.toUpperCase()}`);
  console.log(`Dry Run: ${config.dryRun ? 'YES' : 'NO'}`);
  console.log(`Timestamp: ${nowISO()}`);
  console.log('='.repeat(80));
  
  console.log('\n📊 OVERVIEW');
  console.log(`Total Projects: ${stats.totalProjects}`);
  console.log(`Projects Scanned: ${stats.projectsScanned}`);
  console.log(`Projects with Issues: ${stats.projectsWithIssues}`);
  console.log(`Projects Fixed: ${stats.projectsFixed}`);
  console.log(`Projects Failed: ${stats.projectsFailed}`);
  
  console.log('\n📈 DATA QUALITY DISTRIBUTION');
  const total = stats.totalProjects || 1;
  console.log(`Excellent (≥90%): ${stats.qualityDistribution.excellent} (${((stats.qualityDistribution.excellent / total) * 100).toFixed(1)}%)`);
  console.log(`Good (75-89%): ${stats.qualityDistribution.good} (${((stats.qualityDistribution.good / total) * 100).toFixed(1)}%)`);
  console.log(`Fair (50-74%): ${stats.qualityDistribution.fair} (${((stats.qualityDistribution.fair / total) * 100).toFixed(1)}%)`);
  console.log(`Poor (25-49%): ${stats.qualityDistribution.poor} (${((stats.qualityDistribution.poor / total) * 100).toFixed(1)}%)`);
  console.log(`Insufficient (<25%): ${stats.qualityDistribution.insufficient} (${((stats.qualityDistribution.insufficient / total) * 100).toFixed(1)}%)`);
  
  console.log('\n🔧 DERIVED METRICS BACKFILLED');
  console.log(`allImages: ${stats.derivedMetricsAdded.allImages} projects`);
  console.log(`remoteFans: ${stats.derivedMetricsAdded.remoteFans} projects`);
  console.log(`totalFans: ${stats.derivedMetricsAdded.totalFans} projects`);
  
  if (Object.keys(stats.missingRequiredByField).length > 0) {
    console.log('\n❌ MISSING REQUIRED METRICS (Top 10)');
    const sortedRequired = Object.entries(stats.missingRequiredByField)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    sortedRequired.forEach(([field, count]) => {
      console.log(`  ${field}: ${count} projects (${((count / total) * 100).toFixed(1)}%)`);
    });
  }
  
  if (Object.keys(stats.missingOptionalByField).length > 0) {
    console.log('\n⚠️  MISSING OPTIONAL METRICS (Top 10)');
    const sortedOptional = Object.entries(stats.missingOptionalByField)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    sortedOptional.forEach(([field, count]) => {
      console.log(`  ${field}: ${count} projects (${((count / total) * 100).toFixed(1)}%)`);
    });
  }
  
  if (stats.errors.length > 0) {
    console.log('\n🚨 ERRORS (First 10)');
    stats.errors.slice(0, 10).forEach(err => {
      console.log(`  ${err.eventName} (${err.projectId}): ${err.error}`);
    });
    
    if (stats.errors.length > 10) {
      console.log(`  ... and ${stats.errors.length - 10} more errors`);
    }
  }
  
  console.log('\n' + '='.repeat(80));
  
  if (config.dryRun && stats.projectsWithIssues > 0) {
    console.log('\n💡 NEXT STEPS:');
    console.log('  Run with --fix to apply derived metric backfills');
    console.log('  Example: npm run data:fix');
  }
  
  if (!config.dryRun && stats.projectsFixed > 0) {
    console.log('\n✅ MIGRATION COMPLETE');
    console.log(`  ${stats.projectsFixed} projects updated successfully`);
  }
  
  console.log('='.repeat(80) + '\n');
}

/**
 * WHAT: Main migration function
 * WHY: Orchestrate the entire data quality migration process
 */
async function runMigration(config: ScriptConfig): Promise<void> {
  log('Starting data quality migration...', 'info');
  log(`Mode: ${config.mode}`, 'info');
  log(`Dry Run: ${config.dryRun}`, 'info');
  
  const stats = initStats();
  let client: MongoClient | null = null;
  
  try {
    // WHAT: Connect to MongoDB
    log('Connecting to MongoDB...', 'info');
    client = await MongoClient.connect(MONGODB_URI);
    const db = client.db(MONGODB_DB);
    const collection = db.collection<ProjectDocument>('projects');
    
    // WHAT: Count total projects
    stats.totalProjects = await collection.countDocuments();
    log(`Found ${stats.totalProjects} projects to process`, 'info');
    
    // WHAT: Process projects in batches
    const cursor = collection.find({});
    let batch: ProjectDocument[] = [];
    
    for await (const project of cursor) {
      batch.push(project);
      
      if (batch.length >= config.batchSize) {
        await processBatch(client, batch, stats, config);
        batch = [];
      }
    }
    
    // WHAT: Process remaining projects
    if (batch.length > 0) {
      await processBatch(client, batch, stats, config);
    }
    
    log('Migration scan complete', 'info');
    
  } catch (error) {
    log(`Fatal error: ${error}`, 'error');
    throw error;
  } finally {
    if (client) {
      await client.close();
      log('MongoDB connection closed', 'info');
    }
  }
  
  // WHAT: Generate final report
  generateReport(stats, config);
}

/**
 * WHAT: Process a batch of projects
 * WHY: Efficient bulk processing with progress tracking
 */
async function processBatch(
  client: MongoClient,
  batch: ProjectDocument[],
  stats: MigrationStats,
  config: ScriptConfig
): Promise<void> {
  for (const project of batch) {
    stats.projectsScanned++;
    
    try {
      // WHAT: Audit project
      const { validation, fixes, needsFix } = auditProject(project);
      
      // WHAT: Update quality distribution
      stats.qualityDistribution[validation.dataQuality]++;
      
      // WHAT: Track missing fields
      validation.missingRequired.forEach(field => {
        stats.missingRequiredByField[field] = (stats.missingRequiredByField[field] || 0) + 1;
      });
      
      validation.missingOptional.forEach(field => {
        stats.missingOptionalByField[field] = (stats.missingOptionalByField[field] || 0) + 1;
      });
      
      // WHAT: Apply fixes if needed
      if (needsFix || !validation.isValid) {
        stats.projectsWithIssues++;
        
        if (config.mode !== 'audit') {
          // WHAT: Track which derived metrics are being added
          if (fixes.allImages !== undefined) stats.derivedMetricsAdded.allImages++;
          if (fixes.remoteFans !== undefined) stats.derivedMetricsAdded.remoteFans++;
          if (fixes.totalFans !== undefined) stats.derivedMetricsAdded.totalFans++;
          
          const success = await fixProject(client, project, fixes, config);
          
          if (success) {
            stats.projectsFixed++;
          } else {
            stats.projectsFailed++;
          }
        }
      }
      
      // WHAT: Log progress every 100 projects
      if (stats.projectsScanned % 100 === 0) {
        log(`Progress: ${stats.projectsScanned}/${stats.totalProjects} projects scanned`, 'info');
      }
      
    } catch (error) {
      stats.projectsFailed++;
      stats.errors.push({
        projectId: project._id.toString(),
        eventName: project.eventName,
        error: error instanceof Error ? error.message : String(error)
      });
      
      if (config.verbose) {
        log(`Error processing project ${project.eventName}: ${error}`, 'error');
      }
    }
  }
}

/**
 * WHAT: Parse command line arguments
 * WHY: Flexible script invocation with different modes
 */
function parseArgs(): ScriptConfig {
  const args = process.argv.slice(2);
  
  let mode: ScriptConfig['mode'] = 'audit';
  let dryRun = true;
  let verbose = false;
  let batchSize = 100;
  
  for (const arg of args) {
    if (arg === '--fix' || arg === '--fix-derived') {
      mode = 'fix-derived';
      dryRun = false;
    } else if (arg === '--fix-all') {
      mode = 'fix-all';
      dryRun = false;
    } else if (arg === '--audit' || arg === '--dry-run') {
      mode = 'audit';
      dryRun = true;
    } else if (arg === '--verbose' || arg === '-v') {
      verbose = true;
    } else if (arg.startsWith('--batch-size=')) {
      batchSize = parseInt(arg.split('=')[1], 10);
    }
  }
  
  return { mode, dryRun, verbose, batchSize };
}

/**
 * WHAT: Entry point
 * WHY: Execute migration with error handling
 */
async function main() {
  console.log('\n🔍 MessMass Data Quality Migration Tool\n');
  
  // WHAT: Validate environment
  if (!MONGODB_URI) {
    log('Error: MONGODB_URI environment variable not set', 'error');
    process.exit(1);
  }
  
  // WHAT: Parse configuration
  const config = parseArgs();
  
  try {
    await runMigration(config);
    process.exit(0);
  } catch (error) {
    log(`Migration failed: ${error}`, 'error');
    process.exit(1);
  }
}

// WHAT: Run if executed directly
if (require.main === module) {
  main();
}

export { runMigration, parseArgs };
