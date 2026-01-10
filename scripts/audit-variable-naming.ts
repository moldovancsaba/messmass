#!/usr/bin/env tsx
/**
 * P1 2.2: Variable Naming Consistency Audit Script
 * 
 * WHAT: Scan MongoDB and codebase for variable naming violations
 * WHY: Identify inconsistencies against Variable Dictionary standards
 * HOW: Check formulas, KYC variables, code usage patterns
 */

import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

interface Violation {
  location: string;
  type: 'formula' | 'variable_name' | 'code_usage';
  current: string;
  expected: string;
  migrationRisk: 'low' | 'medium' | 'high';
  context?: string;
}

async function auditVariableNaming() {
  const client = new MongoClient(MONGODB_URI!);
  const violations: Violation[] = [];

  try {
    await client.connect();
    const db = client.db(MONGODB_DB);

    console.log('🔍 P1 2.2: Variable Naming Consistency Audit\n');
    console.log('='.repeat(80));

    // ==========================================
    // PART 1: Audit KYC Variables (variables_metadata)
    // ==========================================
    console.log('\n📊 PART 1: Auditing KYC Variables (variables_metadata)...\n');

    const variablesCollection = db.collection('variables_metadata');
    const allVariables = await variablesCollection.find({}).toArray();

    let kycViolations = 0;
    for (const variable of allVariables) {
      // Check for stats. prefix in name
      if (variable.name && variable.name.startsWith('stats.')) {
        violations.push({
          location: `MongoDB: variables_metadata._id=${variable._id}`,
          type: 'variable_name',
          current: variable.name,
          expected: variable.name.substring(6), // Remove "stats." prefix
          migrationRisk: 'medium',
          context: `Label: ${variable.label}, Category: ${variable.category}`
        });
        kycViolations++;
        if (kycViolations <= 10) {
          console.log(`  🔴 VIOLATION: ${variable.name} → should be ${variable.name.substring(6)}`);
        }
      }

      // Check for non-camelCase names
      if (variable.name && /[A-Z]/.test(variable.name) && !variable.name.match(/^[a-z][a-zA-Z0-9]*$/)) {
        violations.push({
          location: `MongoDB: variables_metadata._id=${variable._id}`,
          type: 'variable_name',
          current: variable.name,
          expected: variable.name.toLowerCase().replace(/_([a-z])/g, (_, c) => c.toUpperCase()),
          migrationRisk: 'high',
          context: `Label: ${variable.label}, Category: ${variable.category}`
        });
        kycViolations++;
        if (kycViolations <= 10) {
          console.log(`  🔴 VIOLATION: ${variable.name} → should be camelCase`);
        }
      }
    }

    console.log(`\n  Total KYC violations: ${kycViolations}`);

    // ==========================================
    // PART 2: Audit Chart Formulas (chart_configurations)
    // ==========================================
    console.log('\n📊 PART 2: Auditing Chart Formulas (chart_configurations)...\n');

    const chartsCollection = db.collection('chart_configurations');
    const allCharts = await chartsCollection.find({}).toArray();

    let formulaViolations = 0;
    for (const chart of allCharts) {
      // Check main formula
      if (chart.formula && typeof chart.formula === 'string') {
        // Check for [stats.fieldName] pattern
        const statsBracketMatch = chart.formula.match(/\[stats\.([a-zA-Z0-9_]+)\]/g);
        if (statsBracketMatch) {
          statsBracketMatch.forEach(match => {
            const fieldName = match.match(/\[stats\.([a-zA-Z0-9_]+)\]/)?.[1];
            violations.push({
              location: `MongoDB: chart_configurations.chartId=${chart.chartId}, formula`,
              type: 'formula',
              current: match,
              expected: `[${fieldName}]`,
              migrationRisk: 'low',
              context: `Chart: ${chart.title || chart.chartId}`
            });
            formulaViolations++;
            if (formulaViolations <= 10) {
              console.log(`  🔴 VIOLATION: ${match} → should be [${fieldName}]`);
            }
          });
        }

        // Check for stats.fieldName (without brackets)
        const statsNoBracketMatch = chart.formula.match(/(?<!\[)\bstats\.([a-zA-Z0-9_]+)\b(?!\])/g);
        if (statsNoBracketMatch) {
          statsNoBracketMatch.forEach(match => {
            const fieldName = match.match(/stats\.([a-zA-Z0-9_]+)/)?.[1];
            violations.push({
              location: `MongoDB: chart_configurations.chartId=${chart.chartId}, formula`,
              type: 'formula',
              current: match,
              expected: `[${fieldName}]`,
              migrationRisk: 'low',
              context: `Chart: ${chart.title || chart.chartId}`
            });
            formulaViolations++;
            if (formulaViolations <= 10) {
              console.log(`  🔴 VIOLATION: ${match} → should be [${fieldName}]`);
            }
          });
        }
      }

      // Check element formulas
      if (chart.elements && Array.isArray(chart.elements)) {
        chart.elements.forEach((element: any, idx: number) => {
          if (element.formula && typeof element.formula === 'string') {
            // Check for [stats.fieldName] pattern
            const statsBracketMatch = element.formula.match(/\[stats\.([a-zA-Z0-9_]+)\]/g);
            if (statsBracketMatch) {
              statsBracketMatch.forEach(match => {
                const fieldName = match.match(/\[stats\.([a-zA-Z0-9_]+)\]/)?.[1];
                violations.push({
                  location: `MongoDB: chart_configurations.chartId=${chart.chartId}, elements[${idx}].formula`,
                  type: 'formula',
                  current: match,
                  expected: `[${fieldName}]`,
                  migrationRisk: 'low',
                  context: `Chart: ${chart.title || chart.chartId}, Element: ${element.label || idx}`
                });
                formulaViolations++;
                if (formulaViolations <= 10) {
                  console.log(`  🔴 VIOLATION: ${match} → should be [${fieldName}]`);
                }
              });
            }

            // Check for stats.fieldName (without brackets)
            const statsNoBracketMatch = element.formula.match(/(?<!\[)\bstats\.([a-zA-Z0-9_]+)\b(?!\])/g);
            if (statsNoBracketMatch) {
              statsNoBracketMatch.forEach(match => {
                const fieldName = match.match(/stats\.([a-zA-Z0-9_]+)/)?.[1];
                violations.push({
                  location: `MongoDB: chart_configurations.chartId=${chart.chartId}, elements[${idx}].formula`,
                  type: 'formula',
                  current: match,
                  expected: `[${fieldName}]`,
                  migrationRisk: 'low',
                  context: `Chart: ${chart.title || chart.chartId}, Element: ${element.label || idx}`
                });
                formulaViolations++;
                if (formulaViolations <= 10) {
                  console.log(`  🔴 VIOLATION: ${match} → should be [${fieldName}]`);
                }
              });
            }
          }
        });
      }
    }

    console.log(`\n  Total formula violations: ${formulaViolations}`);

    // ==========================================
    // PART 3: Summary
    // ==========================================
    console.log('\n' + '='.repeat(80));
    console.log('\n📋 SUMMARY\n');
    console.log(`Total violations found: ${violations.length}`);
    console.log(`  - KYC variable name violations: ${kycViolations}`);
    console.log(`  - Chart formula violations: ${formulaViolations}`);

    // Group by migration risk
    const lowRisk = violations.filter(v => v.migrationRisk === 'low').length;
    const mediumRisk = violations.filter(v => v.migrationRisk === 'medium').length;
    const highRisk = violations.filter(v => v.migrationRisk === 'high').length;

    console.log(`\nMigration Risk Breakdown:`);
    console.log(`  - Low risk: ${lowRisk}`);
    console.log(`  - Medium risk: ${mediumRisk}`);
    console.log(`  - High risk: ${highRisk}`);

    // Write violations to JSON for investigation report
    const fs = require('fs');
    const violationsJson = JSON.stringify(violations, null, 2);
    fs.writeFileSync('docs/audits/investigations/P1-2.2-variable-naming-violations.json', violationsJson);
    console.log(`\n✅ Violations exported to: docs/audits/investigations/P1-2.2-variable-naming-violations.json`);

  } catch (error) {
    console.error('❌ Audit failed:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Run audit
auditVariableNaming().catch(console.error);
