// WHAT: Audit variable naming consistency across MongoDB, KYC, Code, and Algorithms
// WHY: Ensure single source of truth - same names everywhere, no mapping, no deprecated names
// HOW: Check projects.stats fields, variables_metadata, chart formulas, and code references

import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('❌ MONGODB_URI not found in environment');
  process.exit(1);
}

interface VariableAuditReport {
  // Variables actually used in MongoDB
  mongoDbFields: Set<string>;
  
  // Variables registered in KYC (variables_metadata)
  kycVariables: Map<string, { alias: string; type: string; category?: string }>;
  
  // Variables used in chart formulas
  chartFormulaVariables: Set<string>;
  
  // Inconsistencies
  inMongoButNotKyc: string[];
  inKycButNotMongo: string[];
  inconsistentNames: Array<{ mongo: string; kyc: string; issue: string }>;
  deprecatedPatterns: Array<{ field: string; issue: string }>;
}

async function auditVariableNaming() {
  const client = new MongoClient(uri!);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db('messmass');
    
    const report: VariableAuditReport = {
      mongoDbFields: new Set(),
      kycVariables: new Map(),
      chartFormulaVariables: new Set(),
      inMongoButNotKyc: [],
      inKycButNotMongo: [],
      inconsistentNames: [],
      deprecatedPatterns: [],
    };
    
    console.log('🔍 STEP 1: Scan MongoDB Atlas Database Fields\n');
    console.log('='.repeat(80));
    
    // Get all unique fields from projects.stats
    const projects = await db.collection('projects').find({}).toArray();
    
    projects.forEach(project => {
      if (project.stats) {
        Object.keys(project.stats).forEach(key => {
          report.mongoDbFields.add(key);
        });
      }
    });
    
    console.log(`\n📊 Found ${report.mongoDbFields.size} unique fields in projects.stats\n`);
    
    // Categorize by pattern
    const bitlyFields: string[] = [];
    const clickerFields: string[] = [];
    const eventFields: string[] = [];
    const reportFields: string[] = [];
    const otherFields: string[] = [];
    
    Array.from(report.mongoDbFields).sort().forEach(field => {
      if (field.toLowerCase().includes('bitly')) {
        bitlyFields.push(field);
      } else if (field.startsWith('report')) {
        reportFields.push(field);
      } else if (field.startsWith('event')) {
        eventFields.push(field);
      } else if (['remoteImages', 'hostessImages', 'selfies', 'remoteFans', 'stadium', 'female', 'male', 'genAlpha', 'genYZ', 'genX', 'boomer', 'merched', 'jersey', 'scarf', 'flags', 'baseballCap', 'other'].includes(field)) {
        clickerFields.push(field);
      } else {
        otherFields.push(field);
      }
    });
    
    console.log('📋 Fields by Category:\n');
    console.log(`   🔗 Bitly: ${bitlyFields.length} fields`);
    bitlyFields.slice(0, 5).forEach(f => console.log(`      - ${f}`));
    if (bitlyFields.length > 5) console.log(`      ... and ${bitlyFields.length - 5} more`);
    
    console.log(`\n   🖱️  Clicker: ${clickerFields.length} fields`);
    clickerFields.forEach(f => console.log(`      - ${f}`));
    
    console.log(`\n   📅 Event: ${eventFields.length} fields`);
    eventFields.forEach(f => console.log(`      - ${f}`));
    
    console.log(`\n   📄 Report Content: ${reportFields.length} fields`);
    reportFields.slice(0, 5).forEach(f => console.log(`      - ${f}`));
    if (reportFields.length > 5) console.log(`      ... and ${reportFields.length - 5} more`);
    
    console.log(`\n   ❓ Other: ${otherFields.length} fields`);
    otherFields.slice(0, 10).forEach(f => console.log(`      - ${f}`));
    if (otherFields.length > 10) console.log(`      ... and ${otherFields.length - 10} more`);
    
    console.log('\n' + '='.repeat(80));
    console.log('\n🔍 STEP 2: Check KYC System (variables_metadata)\n');
    console.log('='.repeat(80));
    
    const variablesMetadata = await db.collection('variables_metadata').find({}).toArray();
    
    variablesMetadata.forEach(v => {
      report.kycVariables.set(v.name, {
        alias: v.alias || v.name,
        type: v.type,
        category: v.category,
      });
    });
    
    console.log(`\n📊 Found ${report.kycVariables.size} variables registered in KYC\n`);
    
    console.log('\n' + '='.repeat(80));
    console.log('\n🔍 STEP 3: Check Chart Formulas\n');
    console.log('='.repeat(80));
    
    const charts = await db.collection('chart_configurations').find({}).toArray();
    
    charts.forEach(chart => {
      if (chart.elements) {
        chart.elements.forEach((element: any) => {
          if (element.formula) {
            // Extract variable names from formula (stats.variableName)
            const matches = element.formula.match(/stats\.(\w+)/g);
            if (matches) {
              matches.forEach((match: string) => {
                const varName = match.replace('stats.', '');
                report.chartFormulaVariables.add(varName);
              });
            }
          }
        });
      }
    });
    
    console.log(`\n📊 Found ${report.chartFormulaVariables.size} unique variables in chart formulas\n`);
    
    console.log('\n' + '='.repeat(80));
    console.log('\n🔍 STEP 4: Identify Inconsistencies\n');
    console.log('='.repeat(80));
    
    // Check: MongoDB fields not in KYC
    report.mongoDbFields.forEach(field => {
      if (!report.kycVariables.has(field)) {
        report.inMongoButNotKyc.push(field);
      }
    });
    
    // Check: KYC variables not in MongoDB
    report.kycVariables.forEach((data, name) => {
      if (!report.mongoDbFields.has(name) && !name.startsWith('stats.')) {
        report.inKycButNotMongo.push(name);
      }
    });
    
    // Check for deprecated/problematic patterns
    const problematicPatterns = [
      { pattern: /^all[A-Z]/, suggestion: 'Use "total" prefix instead of "all"' },
      { pattern: /^visit/, suggestion: 'Consider "visits" or specific visit type' },
      { pattern: /ByCountry[A-Z]{2}$/, suggestion: 'Country codes should be lowercase or use full names' },
      { pattern: /^[a-z]+[A-Z]/, suggestion: 'Ensure consistent camelCase' },
    ];
    
    report.mongoDbFields.forEach(field => {
      problematicPatterns.forEach(({ pattern, suggestion }) => {
        if (pattern.test(field)) {
          report.deprecatedPatterns.push({ field, issue: suggestion });
        }
      });
    });
    
    console.log('\n⚠️  INCONSISTENCIES FOUND:\n');
    
    if (report.inMongoButNotKyc.length > 0) {
      console.log(`❌ ${report.inMongoButNotKyc.length} fields in MongoDB but NOT in KYC:\n`);
      report.inMongoButNotKyc.slice(0, 20).forEach(field => {
        console.log(`   - ${field}`);
      });
      if (report.inMongoButNotKyc.length > 20) {
        console.log(`   ... and ${report.inMongoButNotKyc.length - 20} more`);
      }
    }
    
    if (report.inKycButNotMongo.length > 0) {
      console.log(`\n⚠️  ${report.inKycButNotMongo.length} variables in KYC but NOT found in MongoDB:\n`);
      report.inKycButNotMongo.slice(0, 20).forEach(field => {
        const data = report.kycVariables.get(field)!;
        console.log(`   - ${field} (${data.alias}) - Type: ${data.type}`);
      });
      if (report.inKycButNotMongo.length > 20) {
        console.log(`   ... and ${report.inKycButNotMongo.length - 20} more`);
      }
    }
    
    if (report.deprecatedPatterns.length > 0) {
      console.log(`\n⚠️  ${report.deprecatedPatterns.length} fields with problematic naming patterns:\n`);
      
      // Group by issue
      const groupedByIssue = new Map<string, string[]>();
      report.deprecatedPatterns.forEach(({ field, issue }) => {
        if (!groupedByIssue.has(issue)) {
          groupedByIssue.set(issue, []);
        }
        groupedByIssue.get(issue)!.push(field);
      });
      
      groupedByIssue.forEach((fields, issue) => {
        console.log(`\n   Issue: ${issue}`);
        fields.slice(0, 10).forEach(field => {
          console.log(`      - ${field}`);
        });
        if (fields.length > 10) {
          console.log(`      ... and ${fields.length - 10} more`);
        }
      });
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('\n📊 SUMMARY\n');
    console.log('='.repeat(80));
    
    console.log(`\n✅ MongoDB Fields: ${report.mongoDbFields.size}`);
    console.log(`✅ KYC Variables: ${report.kycVariables.size}`);
    console.log(`✅ Chart Formula Variables: ${report.chartFormulaVariables.size}`);
    console.log(`\n❌ In MongoDB but not KYC: ${report.inMongoButNotKyc.length}`);
    console.log(`⚠️  In KYC but not MongoDB: ${report.inKycButNotMongo.length}`);
    console.log(`⚠️  Problematic naming patterns: ${report.deprecatedPatterns.length}`);
    
    console.log('\n' + '='.repeat(80));
    console.log('\n📋 RECOMMENDED ACTIONS\n');
    console.log('='.repeat(80));
    
    console.log(`\n1. ✅ Register missing MongoDB fields in KYC:`);
    console.log(`   → Add ${report.inMongoButNotKyc.length} variables to variables_metadata`);
    console.log(`   → Ensure professional naming (camelCase, descriptive)`);
    
    console.log(`\n2. 🧹 Clean up deprecated patterns:`);
    console.log(`   → Standardize "all" → "total" prefix`);
    console.log(`   → Standardize country code formats`);
    console.log(`   → Ensure consistent camelCase`);
    
    console.log(`\n3. 🔄 Create migration script:`);
    console.log(`   → Rename fields in MongoDB`);
    console.log(`   → Update KYC variables_metadata`);
    console.log(`   → Update all chart formulas`);
    console.log(`   → Update code references`);
    
    console.log(`\n4. 📋 Document naming conventions:`);
    console.log(`   → Create VARIABLE_NAMING_GUIDE.md`);
    console.log(`   → Define prefixes: total, event, bitly, report`);
    console.log(`   → Define suffixes: Count, Rate, Value, etc.`);
    
    console.log(`\n5. 🔒 Enforce naming standards:`);
    console.log(`   → Add validation to variable creation API`);
    console.log(`   → Reject non-conforming names`);
    console.log(`   → Auto-suggest corrections`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n✅ Database connection closed\n');
  }
}

auditVariableNaming();
