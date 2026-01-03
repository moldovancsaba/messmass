#!/usr/bin/env tsx
/**
 * WHAT: Comprehensive system verification
 * WHY: Verify all components are aligned and working correctly
 * HOW: Check KYC variables, MongoDB fields, chart formulas, and report templates
 */

import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

interface VerificationResult {
  kycVariables: {
    total: number;
    withStatsPrefix: number;
    missingInMongoDB: string[];
    extraInKYC: string[];
  };
  mongoDBFields: {
    total: number;
    missingInKYC: string[];
  };
  chartFormulas: {
    total: number;
    withStatsPrefix: number;
    invalidFields: Array<{ chartId: string; formula: string; invalidFields: string[] }>;
  };
  reportTemplates: {
    total: number;
    withStatsPrefix: number;
    missingCharts: Array<{ reportId: string; chartId: string }>;
  };
  mandatoryFields: {
    reportText11_15: { exists: number; missing: number };
    reportImage11_25: { exists: number; missing: number };
    szerencsejatek: { exists: number; missing: number };
  };
}

async function verifyCompleteSystem(): Promise<VerificationResult> {
  const client = new MongoClient(MONGODB_URI!);
  
  try {
    await client.connect();
    const db = client.db(MONGODB_DB);
    
    console.log('🔍 COMPREHENSIVE SYSTEM VERIFICATION\n');
    console.log('='.repeat(80));
    
    // ==========================================
    // PART 1: KYC Variables Verification
    // ==========================================
    console.log('\n📊 PART 1: KYC Variables Verification\n');
    
    const kycVariables = await db.collection('variables_metadata').find({}).toArray();
    const kycWithStatsPrefix = kycVariables.filter(v => v.name && v.name.startsWith('stats.'));
    const kycFieldNames = new Set(kycVariables.map(v => {
      if (v.name && v.name.startsWith('stats.')) {
        return v.name.substring(6);
      }
      return v.name;
    }));
    
    console.log(`  Total KYC variables: ${kycVariables.length}`);
    console.log(`  Variables with "stats." prefix: ${kycWithStatsPrefix.length}`);
    
    // ==========================================
    // PART 2: MongoDB Fields Verification
    // ==========================================
    console.log('\n📊 PART 2: MongoDB Fields Verification\n');
    
    const projects = await db.collection('projects').find({}).toArray();
    const mongoFields = new Set<string>();
    
    projects.forEach((project: any) => {
      if (project.stats) {
        Object.keys(project.stats).forEach((key: string) => {
          mongoFields.add(key);
        });
      }
    });
    
    const missingInKYC = Array.from(mongoFields).filter(f => !kycFieldNames.has(f));
    const extraInKYC = Array.from(kycFieldNames).filter(f => !mongoFields.has(f));
    
    console.log(`  Total MongoDB fields: ${mongoFields.size}`);
    console.log(`  Fields missing in KYC: ${missingInKYC.length}`);
    if (missingInKYC.length > 0 && missingInKYC.length <= 20) {
      console.log(`    ${missingInKYC.slice(0, 10).join(', ')}${missingInKYC.length > 10 ? '...' : ''}`);
    }
    console.log(`  Variables in KYC but not in MongoDB: ${extraInKYC.length}`);
    if (extraInKYC.length > 0 && extraInKYC.length <= 20) {
      console.log(`    ${extraInKYC.slice(0, 10).join(', ')}${extraInKYC.length > 10 ? '...' : ''}`);
    }
    
    // ==========================================
    // PART 3: Chart Formulas Verification
    // ==========================================
    console.log('\n📊 PART 3: Chart Formulas Verification\n');
    
    const charts = await db.collection('chart_configurations').find({}).toArray();
    const chartsWithStatsPrefix: string[] = [];
    const invalidFormulas: Array<{ chartId: string; formula: string; invalidFields: string[] }> = [];
    
    const variableRegex = /\[([a-zA-Z0-9_]+)\]/g;
    
    for (const chart of charts) {
      const formulas: string[] = [];
      if (chart.formula) formulas.push(chart.formula);
      if (chart.elements && Array.isArray(chart.elements)) {
        chart.elements.forEach((el: any) => {
          if (el.formula) formulas.push(el.formula);
        });
      }
      
      for (const formula of formulas) {
        // Check for stats. prefix
        if (formula.includes('[stats.') || formula.includes('stats.')) {
          chartsWithStatsPrefix.push(chart.chartId);
        }
        
        // Check for invalid fields
        let match;
        const regex = new RegExp(variableRegex);
        const invalidFields: string[] = [];
        
        while ((match = regex.exec(formula)) !== null) {
          const fieldName = match[1];
          if (!mongoFields.has(fieldName) && !kycFieldNames.has(fieldName)) {
            invalidFields.push(fieldName);
          }
        }
        
        if (invalidFields.length > 0) {
          invalidFormulas.push({
            chartId: chart.chartId,
            formula,
            invalidFields
          });
        }
      }
    }
    
    const uniqueChartsWithPrefix = new Set(chartsWithStatsPrefix);
    
    console.log(`  Total charts: ${charts.length}`);
    console.log(`  Charts with "stats." prefix: ${uniqueChartsWithPrefix.size}`);
    console.log(`  Charts with invalid field references: ${invalidFormulas.length}`);
    if (invalidFormulas.length > 0 && invalidFormulas.length <= 5) {
      invalidFormulas.forEach(f => {
        console.log(`    - ${f.chartId}: ${f.invalidFields.join(', ')}`);
      });
    }
    
    // ==========================================
    // PART 4: Report Templates Verification
    // ==========================================
    console.log('\n📊 PART 4: Report Templates Verification\n');
    
    const dataBlocks = await db.collection('data_blocks').find({}).toArray();
    const allChartIds = new Set(charts.map(c => c.chartId));
    const blocksWithStatsPrefix: string[] = [];
    const missingCharts: Array<{ reportId: string; chartId: string }> = [];
    
    for (const block of dataBlocks) {
      if (block.charts && Array.isArray(block.charts)) {
        for (const chart of block.charts) {
          if (chart.chartId) {
            if (chart.chartId.startsWith('stats.')) {
              blocksWithStatsPrefix.push(chart.chartId);
            }
            if (!allChartIds.has(chart.chartId)) {
              missingCharts.push({
                reportId: block._id.toString(),
                chartId: chart.chartId
              });
            }
          }
        }
      }
    }
    
    const uniqueBlocksWithPrefix = new Set(blocksWithStatsPrefix);
    
    console.log(`  Total data blocks: ${dataBlocks.length}`);
    console.log(`  Blocks with "stats." prefix in chart IDs: ${uniqueBlocksWithPrefix.size}`);
    console.log(`  Missing chart references: ${missingCharts.length}`);
    if (missingCharts.length > 0 && missingCharts.length <= 5) {
      missingCharts.forEach(m => {
        console.log(`    - Block ${m.reportId}: ${m.chartId}`);
      });
    }
    
    // ==========================================
    // PART 5: Mandatory Fields Verification
    // ==========================================
    console.log('\n📊 PART 5: Mandatory Fields Verification\n');
    
    const mandatoryReportText = ['reportText11', 'reportText12', 'reportText13', 'reportText14', 'reportText15'];
    const mandatoryReportImage = Array.from({ length: 15 }, (_, i) => `reportImage${11 + i}`);
    const mandatorySzerencse = [
      'szerencsejatekAllPerson', 'szerencsejatekAllRegistered', 'szerencsejatekAllusersAllphotos',
      'szerencsejatekFunnelQR', 'szerencsejatekFunnelSocial', 'szerencsejatekFunnelURL',
      'szerencsejatekHostessAllRegistered', 'szerencsejatekHostessAllphotos',
      'szerencsejatekMarketingCTA01', 'szerencsejatekMarketingCTA01Conversion',
      'szerencsejatekMarketingCTA02', 'szerencsejatekMarketingCTA02Conversion',
      'szerencsejatekMarketingOptInNumber', 'szerencsejatekMarketingOptInPercentage',
      'szerencsejatekTop10'
    ];
    
    let reportTextExists = 0;
    let reportTextMissing = 0;
    let reportImageExists = 0;
    let reportImageMissing = 0;
    let szerencseExists = 0;
    let szerencseMissing = 0;
    
    projects.forEach((project: any) => {
      if (!project.stats) {
        reportTextMissing += mandatoryReportText.length;
        reportImageMissing += mandatoryReportImage.length;
        szerencseMissing += mandatorySzerencse.length;
        return;
      }
      
      mandatoryReportText.forEach(field => {
        if (field in project.stats) reportTextExists++;
        else reportTextMissing++;
      });
      
      mandatoryReportImage.forEach(field => {
        if (field in project.stats) reportImageExists++;
        else reportImageMissing++;
      });
      
      mandatorySzerencse.forEach(field => {
        if (field in project.stats) szerencseExists++;
        else szerencseMissing++;
      });
    });
    
    console.log(`  reportText11-15:`);
    console.log(`    Exists: ${reportTextExists}/${projects.length * 5} (${Math.round(reportTextExists / (projects.length * 5) * 100)}%)`);
    console.log(`    Missing: ${reportTextMissing}/${projects.length * 5}`);
    console.log(`  reportImage11-25:`);
    console.log(`    Exists: ${reportImageExists}/${projects.length * 15} (${Math.round(reportImageExists / (projects.length * 15) * 100)}%)`);
    console.log(`    Missing: ${reportImageMissing}/${projects.length * 15}`);
    console.log(`  szerencsejatek* fields:`);
    console.log(`    Exists: ${szerencseExists}/${projects.length * 15} (${Math.round(szerencseExists / (projects.length * 15) * 100)}%)`);
    console.log(`    Missing: ${szerencseMissing}/${projects.length * 15}`);
    
    // ==========================================
    // SUMMARY
    // ==========================================
    console.log('\n' + '='.repeat(80));
    console.log('📋 VERIFICATION SUMMARY\n');
    
    const issues: string[] = [];
    
    if (kycWithStatsPrefix.length > 0) {
      issues.push(`❌ ${kycWithStatsPrefix.length} KYC variables still have "stats." prefix`);
    } else {
      console.log('✅ All KYC variables use clean format (no "stats." prefix)');
    }
    
    if (uniqueChartsWithPrefix.size > 0) {
      issues.push(`❌ ${uniqueChartsWithPrefix.size} charts still use "stats." prefix in formulas`);
    } else {
      console.log('✅ All chart formulas use clean format (no "stats." prefix)');
    }
    
    if (invalidFormulas.length > 0) {
      issues.push(`❌ ${invalidFormulas.length} charts reference fields that don't exist`);
    } else {
      console.log('✅ All chart formulas reference valid fields');
    }
    
    if (uniqueBlocksWithPrefix.size > 0) {
      issues.push(`❌ ${uniqueBlocksWithPrefix.size} data blocks still use "stats." prefix in chart IDs`);
    } else {
      console.log('✅ All data blocks use correct chart IDs (no "stats." prefix)');
    }
    
    if (missingCharts.length > 0) {
      issues.push(`❌ ${missingCharts.length} data blocks reference missing charts`);
    } else {
      console.log('✅ All data blocks reference existing charts');
    }
    
    if (reportTextMissing > 0) {
      issues.push(`❌ reportText11-15 missing in ${Math.round(reportTextMissing / (projects.length * 5) * 100)}% of projects`);
    } else {
      console.log('✅ All projects have reportText11-15 fields');
    }
    
    if (reportImageMissing > 0) {
      issues.push(`❌ reportImage11-25 missing in ${Math.round(reportImageMissing / (projects.length * 15) * 100)}% of projects`);
    } else {
      console.log('✅ All projects have reportImage11-25 fields');
    }
    
    if (szerencseMissing > 0) {
      issues.push(`❌ szerencsejatek* fields missing in ${Math.round(szerencseMissing / (projects.length * 15) * 100)}% of projects`);
    } else {
      console.log('✅ All projects have szerencsejatek* fields');
    }
    
    if (issues.length > 0) {
      console.log('\n⚠️  ISSUES FOUND:\n');
      issues.forEach(issue => console.log(`  ${issue}`));
    } else {
      console.log('\n✅ ALL SYSTEMS ALIGNED AND VERIFIED!\n');
    }
    
    return {
      kycVariables: {
        total: kycVariables.length,
        withStatsPrefix: kycWithStatsPrefix.length,
        missingInMongoDB: Array.from(extraInKYC),
        extraInKYC: Array.from(extraInKYC)
      },
      mongoDBFields: {
        total: mongoFields.size,
        missingInKYC: Array.from(missingInKYC)
      },
      chartFormulas: {
        total: charts.length,
        withStatsPrefix: uniqueChartsWithPrefix.size,
        invalidFields: invalidFormulas
      },
      reportTemplates: {
        total: dataBlocks.length,
        withStatsPrefix: uniqueBlocksWithPrefix.size,
        missingCharts
      },
      mandatoryFields: {
        reportText11_15: { exists: reportTextExists, missing: reportTextMissing },
        reportImage11_25: { exists: reportImageExists, missing: reportImageMissing },
        szerencsejatek: { exists: szerencseExists, missing: szerencseMissing }
      }
    };
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

verifyCompleteSystem();

