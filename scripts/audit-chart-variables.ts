// WHAT: Audit chart_algorithms collection for formulas referencing non-existent variables
// WHY: BuilderMode shows "No data" because charts reference wrong variable names (e.g., fanSelfieLandscape1 vs fanSelfiePortrait1)
// HOW: Compare all chart formulas against variables_metadata collection

import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI || '';
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

interface ChartAlgorithm {
  _id: any;
  chartId: string;
  title: string;
  type: string;
  elements: Array<{
    formula: string;
    label?: string;
  }>;
}

interface VariableMetadata {
  _id: any;
  name: string;
  alias: string;
  type: string;
}

async function auditChartVariables() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(MONGODB_DB);
    
    // WHAT: Fetch all variables from variables_metadata
    const variables = await db.collection<VariableMetadata>('variables_metadata').find({}).toArray();
    const validVariables = new Set(variables.map(v => v.name));
    
    console.log(`\n📊 Found ${validVariables.size} valid variables in variables_metadata`);
    console.log('Sample variables:', Array.from(validVariables).slice(0, 10).join(', '));
    
    // WHAT: Fetch all chart configurations
    const charts = await db.collection<ChartAlgorithm>('chart_configurations').find({}).toArray();
    
    console.log(`\n📈 Found ${charts.length} chart algorithms`);
    
    // WHAT: Extract all variable references from formulas
    const errors: Array<{
      chartId: string;
      title: string;
      type: string;
      formula: string;
      invalidVars: string[];
    }> = [];
    
    for (const chart of charts) {
      for (const element of chart.elements || []) {
        if (!element.formula) continue;
        
        // WHAT: Extract stats.variableName patterns from formula
        const statsPattern = /stats\.([a-zA-Z0-9_]+)/g;
        const matches = [...element.formula.matchAll(statsPattern)];
        
        const invalidVars: string[] = [];
        
        for (const match of matches) {
          const varName = match[1]; // e.g., "reportImage1" from "stats.reportImage1"
          
          // WHAT: Check if variable exists in variables_metadata
          // WHY: Charts MUST only reference existing database variables
          // NOTE: Variables in DB are stored as "stats.variableName", so we need to check the full format
          if (!validVariables.has(`stats.${varName}`) && !validVariables.has(varName)) {
            invalidVars.push(varName);
          }
        }
        
        if (invalidVars.length > 0) {
          errors.push({
            chartId: chart.chartId,
            title: chart.title,
            type: chart.type,
            formula: element.formula,
            invalidVars
          });
        }
      }
    }
    
    // WHAT: Report findings
    console.log(`\n\n${'='.repeat(80)}`);
    console.log('🔍 AUDIT RESULTS');
    console.log('='.repeat(80));
    
    if (errors.length === 0) {
      console.log('\n✅ All chart formulas reference valid variables!');
    } else {
      console.log(`\n❌ Found ${errors.length} chart formulas with invalid variable references:\n`);
      
      for (const error of errors) {
        console.log(`Chart: ${error.chartId}`);
        console.log(`  Title: ${error.title}`);
        console.log(`  Type: ${error.type}`);
        console.log(`  Formula: ${error.formula}`);
        console.log(`  Invalid Variables: ${error.invalidVars.join(', ')}`);
        console.log('');
      }
      
      console.log('='.repeat(80));
      console.log('🔧 ACTION REQUIRED:');
      console.log('1. Fix chart formulas to use correct variable names from variables_metadata');
      console.log('2. OR create missing variables in variables_metadata collection');
      console.log('3. Use KYC Management UI to verify variable names');
      console.log('='.repeat(80));
    }
    
  } catch (error) {
    console.error('❌ Error during audit:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Run audit
auditChartVariables()
  .then(() => {
    console.log('\n✅ Audit complete');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Audit failed:', err);
    process.exit(1);
  });
