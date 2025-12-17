// scripts/validate-chart-configs.ts
// WHAT: Validate all chart configurations and report/fix any issues
// WHY: Ensure consistent data structure for reliable save operations
// HOW: Check all charts for missing or invalid fields, log issues

import clientPromise from '../lib/mongodb';
import config from '../lib/config';

const MONGODB_DB = config.dbName;

async function validateChartConfigurations() {
  console.log('🔍 Starting chart configuration validation...\n');

  try {
    const client = await clientPromise;
    const db = client.db(MONGODB_DB);
    const collection = db.collection('chart_configurations');

    const allCharts = await collection.find({}).toArray();
    console.log(`📊 Found ${allCharts.length} chart configurations\n`);

    let issuesFound = 0;
    const issues: string[] = [];

    for (const chart of allCharts) {
      const chartIssues: string[] = [];

      // Check required fields
      if (!chart.chartId) chartIssues.push('Missing chartId');
      if (!chart.title) chartIssues.push('Missing title');
      if (!chart.type) chartIssues.push('Missing type');
      if (!chart.elements || !Array.isArray(chart.elements)) {
        chartIssues.push('Missing or invalid elements array');
      }

      // Check elements structure
      if (chart.elements) {
        chart.elements.forEach((element: any, idx: number) => {
          if (!element.id) chartIssues.push(`Element ${idx + 1}: Missing id`);
          if (!element.label) chartIssues.push(`Element ${idx + 1}: Missing label`);
          if (!element.formula) chartIssues.push(`Element ${idx + 1}: Missing formula`);

          // Check formatting if present
          if (element.formatting) {
            if (typeof element.formatting.rounded !== 'boolean') {
              chartIssues.push(`Element ${idx + 1}: formatting.rounded is not boolean`);
            }
            if (element.formatting.prefix !== undefined && typeof element.formatting.prefix !== 'string') {
              chartIssues.push(`Element ${idx + 1}: formatting.prefix is not string`);
            }
            if (element.formatting.suffix !== undefined && typeof element.formatting.suffix !== 'string') {
              chartIssues.push(`Element ${idx + 1}: formatting.suffix is not string`);
            }
          }
        });
      }

      // Check element count matches type
      if (chart.elements && chart.type) {
        const expectedCounts: Record<string, number> = {
          kpi: 1,
          text: 1,
          image: 1,
          pie: 2,
          bar: 5
        };

        const expected = expectedCounts[chart.type];
        if (expected && chart.elements.length !== expected) {
          chartIssues.push(`Type ${chart.type} expects ${expected} elements, has ${chart.elements.length}`);
        }
      }

      if (chartIssues.length > 0) {
        issuesFound++;
        issues.push(`\n❌ Chart: ${chart.title} (${chart.chartId})`);
        chartIssues.forEach(issue => issues.push(`   - ${issue}`));
      } else {
        console.log(`✅ ${chart.title} (${chart.chartId})`);
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`\n📋 Validation Summary:`);
    console.log(`   Total charts: ${allCharts.length}`);
    console.log(`   Valid charts: ${allCharts.length - issuesFound}`);
    console.log(`   Charts with issues: ${issuesFound}`);

    if (issues.length > 0) {
      console.log(`\n⚠️  Issues Found:\n${issues.join('\n')}`);
    } else {
      console.log(`\n✅ All chart configurations are valid!`);
    }

    process.exit(issuesFound > 0 ? 1 : 0);

  } catch (error) {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  }
}

validateChartConfigurations();
