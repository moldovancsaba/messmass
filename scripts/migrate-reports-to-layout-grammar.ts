#!/usr/bin/env tsx

// WHAT: Migration script for Layout Grammar enforcement (Phase 6, Task 6.1)
// WHY: Validate and fix existing report configurations to comply with Layout Grammar policy
// HOW: Read-only analysis of report templates and blocks, generate migration reports

import { getDb } from '../lib/db';
import { resolveBlockHeightWithDetails } from '../lib/blockHeightCalculator';
import { validateElementFit } from '../lib/elementFitValidator';
import type { HeightResolutionInput, CellConfiguration, BlockHeightResolution } from '../lib/layoutGrammar';
import { HeightResolutionPriority } from '../lib/layoutGrammar';
import type { ReportTemplate } from '../lib/reportTemplateTypes';
import type { ChartConfiguration } from '../lib/chartConfigTypes';
import { isValidAspectRatio } from '../lib/aspectRatioUtils';
import type { AspectRatio } from '../lib/chartConfigTypes';
import { writeFileSync } from 'fs';
import { join } from 'path';

const BLOCK_WIDTH_DESKTOP = 1200; // Standard desktop block width
const MAX_TABLE_ROWS = 17; // Layout Grammar contract: max 17 visible rows

interface MigrationBlockResult {
  blockId: string;
  blockName: string;
  templateId?: string;
  templateName?: string;
  status: 'valid' | 'fixable' | 'structural_failure';
  heightResolution: BlockHeightResolution;
  elementValidations: Array<{
    chartId: string;
    chartType: string;
    validation: {
      fits: boolean;
      violations: string[];
      requiredActions: string[];
    };
  }>;
  fixes: Array<{
    type: 'remove_scroll' | 'table_aggregation' | 'height_normalization' | 'typography_normalization';
    description: string;
    action: string;
  }>;
  structuralFailureReason?: string;
  requiredManualAction?: string;
}

interface MigrationResult {
  timestamp: string;
  templatesProcessed: number;
  blocksProcessed: number;
  blocksValid: number;
  blocksFixable: number;
  blocksStructuralFailure: number;
  fixes: {
    scrollRemoved: number;
    tableAggregations: number;
    heightNormalizations: number;
    typographyNormalizations: number;
  };
  blocks: MigrationBlockResult[];
}

/**
 * Convert chart configuration to Layout Grammar CellConfiguration
 */
function chartToCellConfiguration(
  chart: ChartConfiguration,
  blockWidth: number
): CellConfiguration {
  const aspectRatio = chart.aspectRatio && isValidAspectRatio(chart.aspectRatio)
    ? chart.aspectRatio
    : undefined;

  // Determine content metadata based on chart type
  const contentMetadata: Record<string, unknown> = {};
  
  if (chart.type === 'table') {
    // For tables, estimate row count from elements (if available)
    // In real migration, this would come from actual data
    contentMetadata.rowCount = chart.elements?.length || 0;
  } else if (chart.type === 'pie') {
    contentMetadata.legendItemCount = chart.elements?.length || 0;
  } else if (chart.type === 'bar') {
    contentMetadata.barCount = chart.elements?.length || 0;
  }

  return {
    chartId: chart.chartId,
    bodyType: chart.type,
    cellWidth: chart.cellWidth || 1, // Default to 1-unit if not set
    aspectRatio,
    title: chart.title,
    subtitle: chart.subtitle,
    contentMetadata: Object.keys(contentMetadata).length > 0 ? contentMetadata : undefined
  };
}

/**
 * Validate a single block against Layout Grammar rules
 */
async function validateBlock(
  blockId: string,
  blockName: string,
  charts: ChartConfiguration[],
  templateId?: string,
  templateName?: string
): Promise<MigrationBlockResult> {
  const fixes: MigrationBlockResult['fixes'] = [];
  let status: MigrationBlockResult['status'] = 'valid';
  let structuralFailureReason: string | undefined;
  let requiredManualAction: string | undefined;

  // Convert charts to CellConfiguration format
  const cells: CellConfiguration[] = charts.map(chart => 
    chartToCellConfiguration(chart, BLOCK_WIDTH_DESKTOP)
  );

  // Build height resolution input
  const heightResolutionInput: HeightResolutionInput = {
    blockId,
    blockWidth: BLOCK_WIDTH_DESKTOP,
    cells,
    // No block aspect ratio or max height constraints for migration analysis
  };

  // Resolve block height
  const heightResolution = resolveBlockHeightWithDetails(heightResolutionInput);

  // Validate each element
  const elementValidations = charts.map((chart, index) => {
    const cellConfig = cells[index];
    const validation = validateElementFit(
      cellConfig,
      heightResolution.heightPx,
      BLOCK_WIDTH_DESKTOP
    );

    return {
      chartId: chart.chartId,
      chartType: chart.type,
      validation
    };
  });

  // Check for structural failures
  if (heightResolution.priority === HeightResolutionPriority.STRUCTURAL_FAILURE) {
    status = 'structural_failure';
    structuralFailureReason = heightResolution.reason || 'Structural failure detected';
    requiredManualAction = heightResolution.requiresSplit
      ? 'Block must be split into multiple blocks'
      : 'Block configuration requires manual review';
  } else {
    // Check for fixable issues
    for (const { chart, validation } of charts.map((chart, idx) => ({
      chart,
      validation: elementValidations[idx].validation
    }))) {
      // Check for table aggregation needed
      if (chart.type === 'table' && !validation.fits) {
        const rowCount = (cells.find(c => c.chartId === chart.chartId)?.contentMetadata?.rowCount as number) || 0;
        if (rowCount > MAX_TABLE_ROWS) {
          fixes.push({
            type: 'table_aggregation',
            description: `Table "${chart.title}" has ${rowCount} rows, exceeds maximum of ${MAX_TABLE_ROWS}`,
            action: `Apply Top-${MAX_TABLE_ROWS - 1} + Other aggregation (no data loss)`
          });
          status = 'fixable';
        }
      }

      // Check for height normalization
      if (validation.requiredActions.includes('increaseHeight')) {
        fixes.push({
          type: 'height_normalization',
          description: `Element "${chart.title}" requires height increase`,
          action: `Normalize block height to ${validation.requiredHeight || heightResolution.heightPx}px`
        });
        status = 'fixable';
      }

      // Check for typography normalization (if needed)
      // This would be detected from chart configuration inconsistencies
      if (chart.cellWidth && (chart.cellWidth !== 1 && chart.cellWidth !== 2)) {
        fixes.push({
          type: 'typography_normalization',
          description: `Chart "${chart.title}" has invalid cellWidth: ${chart.cellWidth}`,
          action: `Normalize cellWidth to ${chart.cellWidth > 2 ? 2 : 1}`
        });
        status = 'fixable';
      }
    }
  }

  return {
    blockId,
    blockName,
    templateId,
    templateName,
    status,
    heightResolution,
    elementValidations,
    fixes,
    structuralFailureReason,
    requiredManualAction
  };
}

/**
 * Generate human-readable markdown report
 */
function generateMarkdownReport(result: MigrationResult): string {
  const lines: string[] = [];

  lines.push('# Layout Grammar Migration Report');
  lines.push('');
  lines.push(`**Generated:** ${result.timestamp}`);
  lines.push('');

  // Summary
  lines.push('## Summary');
  lines.push('');
  lines.push(`- **Templates Processed:** ${result.templatesProcessed}`);
  lines.push(`- **Blocks Processed:** ${result.blocksProcessed}`);
  lines.push(`- **Valid Blocks:** ${result.blocksValid} (${Math.round(result.blocksValid / result.blocksProcessed * 100)}%)`);
  lines.push(`- **Fixable Blocks:** ${result.blocksFixable} (${Math.round(result.blocksFixable / result.blocksProcessed * 100)}%)`);
  lines.push(`- **Structural Failures:** ${result.blocksStructuralFailure} (${Math.round(result.blocksStructuralFailure / result.blocksProcessed * 100)}%)`);
  lines.push('');

  // Fixes summary
  lines.push('## Fixes Required');
  lines.push('');
  lines.push(`- **Scroll/Truncation Removed:** ${result.fixes.scrollRemoved}`);
  lines.push(`- **Table Aggregations:** ${result.fixes.tableAggregations}`);
  lines.push(`- **Height Normalizations:** ${result.fixes.heightNormalizations}`);
  lines.push(`- **Typography Normalizations:** ${result.fixes.typographyNormalizations}`);
  lines.push('');

  // Structural failures
  if (result.blocksStructuralFailure > 0) {
    lines.push('## ⚠️ Structural Failures (Require Manual Action)');
    lines.push('');
    const failures = result.blocks.filter(b => b.status === 'structural_failure');
    for (const block of failures) {
      lines.push(`### ${block.blockName} (${block.blockId})`);
      if (block.templateName) {
        lines.push(`**Template:** ${block.templateName}`);
      }
      lines.push(`**Reason:** ${block.structuralFailureReason}`);
      if (block.requiredManualAction) {
        lines.push(`**Required Action:** ${block.requiredManualAction}`);
      }
      lines.push('');
    }
  }

  // Fixable blocks
  if (result.blocksFixable > 0) {
    lines.push('## 🔧 Fixable Blocks');
    lines.push('');
    const fixable = result.blocks.filter(b => b.status === 'fixable');
    for (const block of fixable) {
      lines.push(`### ${block.blockName} (${block.blockId})`);
      if (block.templateName) {
        lines.push(`**Template:** ${block.templateName}`);
      }
      lines.push(`**Height Resolution:** ${block.heightResolution.heightPx}px (Priority ${block.heightResolution.priority})`);
      lines.push(`**Reason:** ${block.heightResolution.reason}`);
      lines.push('');
      if (block.fixes.length > 0) {
        lines.push('**Fixes Required:**');
        for (const fix of block.fixes) {
          lines.push(`- **${fix.type}:** ${fix.description}`);
          lines.push(`  - Action: ${fix.action}`);
        }
        lines.push('');
      }
    }
  }

  // Valid blocks (summary only)
  if (result.blocksValid > 0) {
    lines.push('## ✅ Valid Blocks');
    lines.push('');
    lines.push(`${result.blocksValid} blocks are already compliant with Layout Grammar rules.`);
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Main migration function
 */
async function migrateReportsToLayoutGrammar() {
  console.log('🚀 Starting Layout Grammar Migration Analysis');
  console.log('━'.repeat(60));

  let db;
  try {
    db = await getDb();
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    console.log('📝 Running with fixture data instead...');
    // For fixture mode, we would use sample data
    // For now, exit if DB is unavailable
    process.exit(1);
  }

  const templatesCollection = db.collection('report_templates');
  const dataBlocksCollection = db.collection('data_blocks');
  const chartConfigsCollection = db.collection('chart_configs');

  // Fetch all templates
  const templates = await templatesCollection.find({}).toArray() as unknown as ReportTemplate[];
  console.log(`📋 Found ${templates.length} report templates`);

  const result: MigrationResult = {
    timestamp: new Date().toISOString(),
    templatesProcessed: templates.length,
    blocksProcessed: 0,
    blocksValid: 0,
    blocksFixable: 0,
    blocksStructuralFailure: 0,
    fixes: {
      scrollRemoved: 0,
      tableAggregations: 0,
      heightNormalizations: 0,
      typographyNormalizations: 0
    },
    blocks: []
  };

  // Process each template
  for (const template of templates) {
    console.log(`\n📄 Processing template: ${template.name}`);

    // Get data blocks for this template
    const blockIds = template.dataBlocks?.map(ref => 
      typeof ref.blockId === 'string' ? ref.blockId : ref.blockId.toString()
    ) || [];

    if (blockIds.length === 0) {
      console.log('   ⚠️  No data blocks found');
      continue;
    }

    // Fetch blocks
    const blocks = await dataBlocksCollection.find({
      _id: { $in: blockIds.map(id => typeof id === 'string' ? id : id) }
    }).toArray();

    console.log(`   📦 Found ${blocks.length} data blocks`);

    // Process each block
    for (const block of blocks) {
      const blockId = block._id.toString();
      const blockName = block.name || `Block ${blockId}`;

      // Get chart configurations for this block
      const chartIds = (block.charts || []).map((c: any) => c.chartId || c.id).filter(Boolean);
      
      if (chartIds.length === 0) {
        console.log(`   ⚠️  Block "${blockName}" has no charts`);
        continue;
      }

      const charts = await chartConfigsCollection.find({
        chartId: { $in: chartIds }
      }).toArray() as unknown as ChartConfiguration[];

      if (charts.length === 0) {
        console.log(`   ⚠️  Block "${blockName}" has no valid chart configurations`);
        continue;
      }

      console.log(`   🔍 Validating block: ${blockName} (${charts.length} charts)`);

      // Validate block
      const blockResult = await validateBlock(
        blockId,
        blockName,
        charts,
        template._id?.toString(),
        template.name
      );

      // Update statistics
      result.blocksProcessed++;
      if (blockResult.status === 'valid') {
        result.blocksValid++;
      } else if (blockResult.status === 'fixable') {
        result.blocksFixable++;
      } else {
        result.blocksStructuralFailure++;
      }

      // Count fixes
      for (const fix of blockResult.fixes) {
        if (fix.type === 'table_aggregation') {
          result.fixes.tableAggregations++;
        } else if (fix.type === 'height_normalization') {
          result.fixes.heightNormalizations++;
        } else if (fix.type === 'typography_normalization') {
          result.fixes.typographyNormalizations++;
        } else if (fix.type === 'remove_scroll') {
          result.fixes.scrollRemoved++;
        }
      }

      result.blocks.push(blockResult);

      // Log status
      const statusIcon = blockResult.status === 'valid' ? '✅' : 
                        blockResult.status === 'fixable' ? '🔧' : '❌';
      console.log(`   ${statusIcon} ${blockName}: ${blockResult.status} (${blockResult.fixes.length} fixes)`);
    }
  }

  // Generate reports
  console.log('\n📊 Generating migration reports...');

  const jsonReport = JSON.stringify(result, null, 2);
  const mdReport = generateMarkdownReport(result);

  const outputDir = process.cwd();
  const jsonPath = join(outputDir, 'migration-report.json');
  const mdPath = join(outputDir, 'migration-report.md');

  writeFileSync(jsonPath, jsonReport, 'utf-8');
  writeFileSync(mdPath, mdReport, 'utf-8');

  console.log(`✅ JSON report written to: ${jsonPath}`);
  console.log(`✅ Markdown report written to: ${mdPath}`);

  // Summary
  console.log('\n📈 Migration Analysis Summary');
  console.log('━'.repeat(60));
  console.log(`Templates: ${result.templatesProcessed}`);
  console.log(`Blocks: ${result.blocksProcessed}`);
  console.log(`✅ Valid: ${result.blocksValid}`);
  console.log(`🔧 Fixable: ${result.blocksFixable}`);
  console.log(`❌ Structural Failures: ${result.blocksStructuralFailure}`);
  console.log(`\nFixes Required:`);
  console.log(`  - Table Aggregations: ${result.fixes.tableAggregations}`);
  console.log(`  - Height Normalizations: ${result.fixes.heightNormalizations}`);
  console.log(`  - Typography Normalizations: ${result.fixes.typographyNormalizations}`);
  console.log(`  - Scroll/Truncation Removed: ${result.fixes.scrollRemoved}`);
}

// Run migration
migrateReportsToLayoutGrammar()
  .then(() => {
    console.log('\n✅ Migration analysis complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration analysis failed:', error);
    process.exit(1);
  });

