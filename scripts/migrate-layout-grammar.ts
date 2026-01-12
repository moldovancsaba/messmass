#!/usr/bin/env tsx
/**
 * Layout Grammar Migration Tool
 * 
 * WHAT: Automated migration tooling for legacy reports to Layout Grammar compliance
 * WHY: Batch analysis and remediation of legacy reports
 * HOW: Validates all report templates and data blocks, generates reports, applies fixes
 * 
 * Usage:
 *   npm run migrate:layout-grammar -- --dry-run                    # Analysis only
 *   npm run migrate:layout-grammar -- --apply                      # Apply fixes
 *   npm run migrate:layout-grammar -- --analyze --output report.json  # Generate report
 */

import { MongoClient, ObjectId } from 'mongodb';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { validateBlockForEditor, type EditorBlockInput } from '../lib/editorValidationAPI';
import type { BlockValidationResult } from '../lib/editorValidationAPI';
import config from '../lib/config';

// WHAT: Standard desktop width for validation (matches editor validation)
// WHY: Consistent validation across editor and migration tooling
const STANDARD_BLOCK_WIDTH_PX = 1200;

interface ReportTemplate {
  _id: ObjectId;
  name: string;
  type: 'event' | 'partner' | 'global';
  isDefault: boolean;
  dataBlocks: Array<{ blockId: string | ObjectId; order: number }>;
  gridSettings?: {
    desktopUnits: number;
    tabletUnits: number;
    mobileUnits: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

interface DataBlock {
  _id: ObjectId;
  name: string;
  charts: Array<{ chartId: string; width: number; order: number }>;
  order: number;
  isActive: boolean;
  showTitle?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface ChartConfiguration {
  _id: ObjectId;
  chartId: string;
  type: 'pie' | 'bar' | 'kpi' | 'text' | 'image' | 'table';
  elements?: Array<{ label: string; formula: string }>;
  aspectRatio?: '16:9' | '9:16' | '1:1';
}

interface ValidationReport {
  timestamp: string;
  mode: 'dry-run' | 'apply';
  summary: {
    totalTemplates: number;
    totalBlocks: number;
    templatesWithViolations: number;
    blocksWithViolations: number;
    totalViolations: number;
  };
  templates: Array<{
    templateId: string;
    templateName: string;
    templateType: string;
    isDefault: boolean;
    violations: number;
    blocks: Array<{
      blockId: string;
      blockName: string;
      violations: number;
      validationResult: BlockValidationResult;
    }>;
  }>;
  errors: Array<{
    templateId?: string;
    blockId?: string;
    error: string;
  }>;
}

interface MigrationStats {
  templatesAnalyzed: number;
  blocksAnalyzed: number;
  violationsFound: number;
  fixesApplied: number;
  errors: number;
}

/**
 * WHAT: Convert DataBlock to EditorBlockInput format
 * WHY: Validation API requires EditorBlockInput format
 */
function convertBlockToEditorInput(
  block: DataBlock,
  chartConfigs: Map<string, ChartConfiguration>
): EditorBlockInput | null {
  if (!block._id) return null;

  const cells = block.charts.map(chartRef => {
    const chartConfig = chartConfigs.get(chartRef.chartId);
    const chartType = chartConfig?.type || 'kpi';

    // WHAT: Extract content metadata for validation
    // WHY: Validation needs barCount, legendItemCount for accurate height calculation
    const contentMetadata: Record<string, unknown> = {};

    if (chartType === 'bar' && chartConfig?.elements) {
      contentMetadata.barCount = chartConfig.elements.length;
    } else if (chartType === 'pie' && chartConfig?.elements) {
      contentMetadata.legendItemCount = chartConfig.elements.length;
    }

    return {
      chartId: chartRef.chartId,
      elementType: chartType as 'text' | 'table' | 'pie' | 'bar' | 'kpi' | 'image',
      width: chartRef.width,
      contentMetadata: Object.keys(contentMetadata).length > 0 ? contentMetadata : undefined,
      imageMode: chartType === 'image' ? ('setIntrinsic' as 'cover' | 'setIntrinsic') : undefined
    };
  });

  return {
    blockId: block._id.toString(),
    cells,
    blockAspectRatio: undefined,
    maxAllowedHeight: undefined
  };
}

/**
 * WHAT: Validate a single block
 * WHY: Check for Layout Grammar violations
 */
function validateBlock(
  block: DataBlock,
  chartConfigs: Map<string, ChartConfiguration>
): BlockValidationResult | null {
  const editorInput = convertBlockToEditorInput(block, chartConfigs);
  if (!editorInput) return null;

  try {
    return validateBlockForEditor(editorInput, STANDARD_BLOCK_WIDTH_PX);
  } catch (error) {
    console.error(`❌ Validation error for block ${block._id}:`, error);
    return null;
  }
}

/**
 * WHAT: Generate validation report
 * WHY: Document all violations for review
 */
async function generateValidationReport(
  db: any,
  chartConfigs: Map<string, ChartConfiguration>
): Promise<ValidationReport> {
  const templatesCollection = db.collection('report_templates');
  const blocksCollection = db.collection('data_blocks');

  const templates = await templatesCollection.find({}).toArray() as ReportTemplate[];
  const allBlocks = await blocksCollection.find({}).toArray() as DataBlock[];

  const report: ValidationReport = {
    timestamp: new Date().toISOString(),
    mode: 'dry-run', // Will be set by caller
    summary: {
      totalTemplates: templates.length,
      totalBlocks: allBlocks.length,
      templatesWithViolations: 0,
      blocksWithViolations: 0,
      totalViolations: 0
    },
    templates: [],
    errors: []
  };

  // WHAT: Create block map for quick lookup
  // WHY: Templates reference blocks by ID
  const blockMap = new Map<string, DataBlock>();
  allBlocks.forEach(block => {
    blockMap.set(block._id.toString(), block);
  });

  // WHAT: Validate each template's blocks
  // WHY: Check all blocks for violations
  for (const template of templates) {
    const templateBlocks: ValidationReport['templates'][0]['blocks'] = [];
    let templateViolations = 0;

    for (const blockRef of template.dataBlocks || []) {
      const blockId = blockRef.blockId.toString();
      const block = blockMap.get(blockId);

      if (!block) {
        report.errors.push({
          templateId: template._id.toString(),
          blockId,
          error: 'Block not found'
        });
        continue;
      }

      const validationResult = validateBlock(block, chartConfigs);
      if (!validationResult) {
        report.errors.push({
          templateId: template._id.toString(),
          blockId,
          error: 'Validation failed'
        });
        continue;
      }

      const violations = validationResult.publishBlocked ? 1 : validationResult.requiredActions.length;
      templateViolations += violations;

      if (violations > 0) {
        templateBlocks.push({
          blockId: block._id.toString(),
          blockName: block.name,
          violations,
          validationResult
        });
      }
    }

    if (templateViolations > 0) {
      report.summary.templatesWithViolations++;
      report.summary.blocksWithViolations += templateBlocks.length;
      report.summary.totalViolations += templateViolations;
    }

    report.templates.push({
      templateId: template._id.toString(),
      templateName: template.name,
      templateType: template.type,
      isDefault: template.isDefault || false,
      violations: templateViolations,
      blocks: templateBlocks
    });
  }

  return report;
}

/**
 * WHAT: Apply automated fixes (if any)
 * WHY: Fix violations where possible
 * NOTE: Currently limited - most fixes require manual intervention
 */
async function applyFixes(
  db: any,
  report: ValidationReport,
  dryRun: boolean
): Promise<MigrationStats> {
  const stats: MigrationStats = {
    templatesAnalyzed: report.summary.totalTemplates,
    blocksAnalyzed: report.summary.totalBlocks,
    violationsFound: report.summary.totalViolations,
    fixesApplied: 0,
    errors: report.errors.length
  };

  if (dryRun) {
    console.log('🔍 DRY-RUN MODE: No changes will be applied');
    return stats;
  }

  const blocksCollection = db.collection('data_blocks');

  // WHAT: Apply fixes where automated fixes are possible
  // WHY: Some violations can be fixed automatically
  // NOTE: Most violations require manual intervention (e.g., content changes, layout redesign)
  // For now, we log what would be fixed but don't apply changes automatically
  // This is a placeholder for future automated fix logic

  console.log('⚠️  Automated fixes are limited. Most violations require manual intervention.');
  console.log('📋 Review the validation report to identify required fixes.');

  return stats;
}

/**
 * WHAT: Backup current state
 * WHY: Enable reversibility
 */
async function createBackup(db: any, backupPath: string): Promise<void> {
  console.log('💾 Creating backup...');

  const templatesCollection = db.collection('report_templates');
  const blocksCollection = db.collection('data_blocks');

  const templates = await templatesCollection.find({}).toArray();
  const blocks = await blocksCollection.find({}).toArray();

  const backup = {
    timestamp: new Date().toISOString(),
    templates,
    blocks
  };

  writeFileSync(backupPath, JSON.stringify(backup, null, 2));
  console.log(`✅ Backup created: ${backupPath}`);
}

/**
 * WHAT: Restore from backup
 * WHY: Reversibility
 */
async function restoreBackup(db: any, backupPath: string): Promise<void> {
  if (!existsSync(backupPath)) {
    throw new Error(`Backup file not found: ${backupPath}`);
  }

  console.log('🔄 Restoring from backup...');

  const backup = JSON.parse(readFileSync(backupPath, 'utf-8'));

  const templatesCollection = db.collection('report_templates');
  const blocksCollection = db.collection('data_blocks');

  // WHAT: Clear existing collections
  // WHY: Restore to exact backup state
  await templatesCollection.deleteMany({});
  await blocksCollection.deleteMany({});

  // WHAT: Restore data
  // WHY: Revert to backup state
  if (backup.templates && backup.templates.length > 0) {
    await templatesCollection.insertMany(backup.templates);
  }
  if (backup.blocks && backup.blocks.length > 0) {
    await blocksCollection.insertMany(backup.blocks);
  }

  console.log('✅ Backup restored successfully');
}

/**
 * WHAT: Main migration function
 * WHY: Orchestrate analysis and migration
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || !args.includes('--apply');
  const analyzeOnly = args.includes('--analyze');
  const outputArg = args.find(arg => arg.startsWith('--output='));
  const outputPath = outputArg ? outputArg.split('=')[1] : 'layout-grammar-migration-report.json';
  const backupPath = 'layout-grammar-migration-backup.json';
  const restoreArg = args.find(arg => arg.startsWith('--restore='));
  const restorePath = restoreArg ? restoreArg.split('=')[1] : null;

  // WHAT: Load environment variables
  // WHY: MongoDB connection requires MONGODB_URI
  require('dotenv').config({ path: '.env.local' });

  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI environment variable is not set');
    process.exit(1);
  }

  const client = new MongoClient(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000
  });

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(process.env.MONGODB_DB || config.dbName);

    // WHAT: Restore from backup if requested
    // WHY: Reversibility
    if (restorePath) {
      await restoreBackup(db, restorePath);
      await client.close();
      return;
    }

    // WHAT: Load chart configurations
    // WHY: Need chart types and metadata for validation
    const chartConfigsCollection = db.collection('chart_configs');
    const chartConfigs = await chartConfigsCollection.find({}).toArray() as ChartConfiguration[];
    const chartConfigMap = new Map<string, ChartConfiguration>();
    chartConfigs.forEach(config => {
      chartConfigMap.set(config.chartId, config);
    });
    console.log(`📊 Loaded ${chartConfigs.length} chart configurations`);

    // WHAT: Generate validation report
    // WHY: Document all violations
    console.log('🔍 Analyzing report templates and data blocks...');
    const report = await generateValidationReport(db, chartConfigMap);
    report.mode = dryRun ? 'dry-run' : 'apply';

    // WHAT: Save report
    // WHY: Documentation and review
    writeFileSync(outputPath, JSON.stringify(report, null, 2));
    console.log(`📄 Validation report saved: ${outputPath}`);

    // WHAT: Print summary
    // WHY: Quick overview
    console.log('\n📊 Validation Summary:');
    console.log(`  Templates: ${report.summary.totalTemplates}`);
    console.log(`  Blocks: ${report.summary.totalBlocks}`);
    console.log(`  Templates with violations: ${report.summary.templatesWithViolations}`);
    console.log(`  Blocks with violations: ${report.summary.blocksWithViolations}`);
    console.log(`  Total violations: ${report.summary.totalViolations}`);
    console.log(`  Errors: ${report.errors.length}`);

    if (analyzeOnly) {
      console.log('\n✅ Analysis complete. Review the report for details.');
      await client.close();
      return;
    }

    // WHAT: Create backup before applying fixes
    // WHY: Reversibility
    if (!dryRun) {
      await createBackup(db, backupPath);
    }

    // WHAT: Apply fixes
    // WHY: Remediate violations where possible
    const stats = await applyFixes(db, report, dryRun);

    console.log('\n📈 Migration Statistics:');
    console.log(`  Templates analyzed: ${stats.templatesAnalyzed}`);
    console.log(`  Blocks analyzed: ${stats.blocksAnalyzed}`);
    console.log(`  Violations found: ${stats.violationsFound}`);
    console.log(`  Fixes applied: ${stats.fixesApplied}`);
    console.log(`  Errors: ${stats.errors}`);

    if (dryRun) {
      console.log('\n💡 Run with --apply to apply fixes (after reviewing the report)');
    } else {
      console.log('\n✅ Migration complete');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();
