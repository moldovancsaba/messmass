/**
 * KYC Variables Integration Verification Script
 * 
 * WHAT: Diagnose completeness and consistency of KYC variables across:
 *       - Google Sheets column mapping
 *       - MongoDB variables_metadata collection
 *       - ProjectStats TypeScript interface
 *       - Actual project data in database
 * 
 * WHY: User reports that some variables may not be fully integrated
 * 
 * HOW: Check each system component and report discrepancies
 * 
 * Usage: npx tsx scripts/verify-kyc-integration.ts
 */

import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

import clientPromise from '../lib/mongodb';
import config from '../lib/config';
import { SHEET_COLUMN_MAP, SHEET_HEADER_LABELS } from '../lib/googleSheets/columnMap';

interface VerificationResult {
  system: string;
  status: 'OK' | 'WARNING' | 'ERROR';
  message: string;
  details?: any;
}

async function verifyColumnMap(): Promise<VerificationResult> {
  const results: string[] = [];
  const warnings: string[] = [];
  
  // Count mapped columns
  const columnCount = Object.keys(SHEET_COLUMN_MAP).length;
  const headerCount = Object.keys(SHEET_HEADER_LABELS).length;
  
  results.push(`✅ Column Map: ${columnCount} columns defined`);
  results.push(`✅ Header Labels: ${headerCount} headers defined`);
  
  // Check for key variables
  const keyVariables = [
    'marketingOptin', 'uniqueUsers', 'newUsersAdded',
    'totalGames', 'gamesWithoutAds', 'gamesWithAds',
    'userRegistration', 'userRegistrationHostess',
    'visitCta1', 'visitCta2', 'visitCta3'
  ];
  
  const missingInColumnMap: string[] = [];
  const foundColumns: string[] = [];
  
  for (const varName of keyVariables) {
    const fieldPath = `stats.${varName}`;
    const found = Object.entries(SHEET_COLUMN_MAP).find(([_, def]) => def.field === fieldPath);
    if (found) {
      foundColumns.push(`${found[0]} → ${varName}`);
    } else {
      missingInColumnMap.push(varName);
    }
  }
  
  if (missingInColumnMap.length > 0) {
    warnings.push(`⚠️ Missing in column map: ${missingInColumnMap.join(', ')}`);
  } else {
    results.push(`✅ All key variables mapped to columns`);
  }
  
  // List all stats.* fields
  const statsFields = Object.entries(SHEET_COLUMN_MAP)
    .filter(([_, def]) => def.field.startsWith('stats.'))
    .map(([col, def]) => `${col} → ${def.field.replace('stats.', '')}`);
  
  results.push(`\n📋 All stats fields (${statsFields.length} total):`);
  statsFields.forEach(f => results.push(`   ${f}`));
  
  return {
    system: 'Google Sheets Column Map',
    status: missingInColumnMap.length > 0 ? 'WARNING' : 'OK',
    message: results.join('\n'),
    details: {
      columnCount,
      headerCount,
      foundColumns,
      missingInColumnMap,
      warnings
    }
  };
}

async function verifyMongoDBVariables(): Promise<VerificationResult> {
  const client = await clientPromise;
  const db = client.db(config.dbName);
  const variablesCollection = db.collection('variables_metadata');
  
  const results: string[] = [];
  const warnings: string[] = [];
  
  // Count total variables
  const totalCount = await variablesCollection.countDocuments();
  results.push(`✅ Total variables in DB: ${totalCount}`);
  
  // Check for key variables
  const keyVariables = [
    'marketingOptin', 'uniqueUsers', 'newUsersAdded',
    'totalGames', 'gamesWithoutAds', 'gamesWithAds',
    'userRegistration', 'userRegistrationHostess',
    'visitCta1', 'visitCta2', 'visitCta3'
  ];
  
  const foundInDB: any[] = [];
  const missingInDB: string[] = [];
  
  for (const varName of keyVariables) {
    const variable = await variablesCollection.findOne({ name: varName });
    if (variable) {
      foundInDB.push({
        name: variable.name,
        alias: variable.alias,
        type: variable.type,
        visibleInClicker: variable.visibleInClicker,
        editableInManual: variable.editableInManual
      });
    } else {
      missingInDB.push(varName);
    }
  }
  
  if (missingInDB.length > 0) {
    warnings.push(`⚠️ Missing in DB: ${missingInDB.join(', ')}`);
  } else {
    results.push(`✅ All key variables exist in DB`);
  }
  
  results.push(`\n📋 Key variables in DB:`);
  foundInDB.forEach(v => {
    results.push(`   ${v.name} (${v.alias}) - ${v.type} - Clicker: ${v.visibleInClicker}, Manual: ${v.editableInManual}`);
  });
  
  return {
    system: 'MongoDB variables_metadata',
    status: missingInDB.length > 0 ? 'ERROR' : 'OK',
    message: results.join('\n'),
    details: {
      totalCount,
      foundInDB,
      missingInDB,
      warnings
    }
  };
}

async function verifyProjectData(): Promise<VerificationResult> {
  const client = await clientPromise;
  const db = client.db(config.dbName);
  const projectsCollection = db.collection('projects');
  
  const results: string[] = [];
  const warnings: string[] = [];
  
  // Get sample project
  const sampleProject = await projectsCollection.findOne(
    { 'stats.marketingOptin': { $exists: true } },
    { projection: { _id: 1, eventName: 1, eventDate: 1, stats: 1 } }
  );
  
  if (!sampleProject) {
    warnings.push('⚠️ No projects found with marketingOptin data');
    return {
      system: 'Project Data (MongoDB)',
      status: 'WARNING',
      message: 'No sample data found with key variables',
      details: { warnings }
    };
  }
  
  results.push(`✅ Found sample project: ${sampleProject.eventName} (${sampleProject.eventDate})`);
  
  // Check which key variables exist in this project
  const keyVariables = [
    'marketingOptin', 'uniqueUsers', 'newUsersAdded',
    'totalGames', 'gamesWithoutAds', 'gamesWithAds',
    'userRegistration', 'userRegistrationHostess',
    'visitCta1', 'visitCta2', 'visitCta3'
  ];
  
  const existingFields: string[] = [];
  const missingFields: string[] = [];
  
  for (const varName of keyVariables) {
    if (sampleProject.stats && sampleProject.stats[varName] !== undefined) {
      existingFields.push(`${varName} = ${sampleProject.stats[varName]}`);
    } else {
      missingFields.push(varName);
    }
  }
  
  results.push(`\n✅ Existing fields (${existingFields.length}):`);
  existingFields.forEach(f => results.push(`   ${f}`));
  
  if (missingFields.length > 0) {
    results.push(`\n⚠️ Missing fields (${missingFields.length}):`);
    missingFields.forEach(f => results.push(`   ${f}`));
  }
  
  // Count projects with these variables
  const projectsWithMarketingOptin = await projectsCollection.countDocuments({
    'stats.marketingOptin': { $exists: true, $ne: null }
  });
  
  const projectsWithUniqueUsers = await projectsCollection.countDocuments({
    'stats.uniqueUsers': { $exists: true, $ne: null }
  });
  
  results.push(`\n📊 Usage statistics:`);
  results.push(`   Projects with marketingOptin: ${projectsWithMarketingOptin}`);
  results.push(`   Projects with uniqueUsers: ${projectsWithUniqueUsers}`);
  
  return {
    system: 'Project Data (MongoDB)',
    status: 'OK',
    message: results.join('\n'),
    details: {
      sampleProjectId: sampleProject._id,
      existingFields,
      missingFields,
      projectsWithMarketingOptin,
      projectsWithUniqueUsers
    }
  };
}

async function verifyTypeScriptInterface(): Promise<VerificationResult> {
  const results: string[] = [];
  const warnings: string[] = [];
  
  // This is a manual check - we can't programmatically inspect TypeScript interfaces at runtime
  // But we can read the file and parse it
  const fs = require('fs');
  const path = require('path');
  const filePath = path.join(__dirname, '../lib/analyticsCalculator.ts');
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  
  const keyVariables = [
    'marketingOptin', 'uniqueUsers', 'newUsersAdded',
    'totalGames', 'gamesWithoutAds', 'gamesWithAds',
    'userRegistration', 'userRegistrationHostess',
    'visitCta1', 'visitCta2', 'visitCta3'
  ];
  
  const foundInInterface: string[] = [];
  const missingInInterface: string[] = [];
  
  for (const varName of keyVariables) {
    // Check if variable is mentioned in ProjectStats interface
    const regex = new RegExp(`\\b${varName}[?:]`, 'g');
    if (regex.test(fileContent)) {
      foundInInterface.push(varName);
    } else {
      missingInInterface.push(varName);
    }
  }
  
  if (missingInInterface.length > 0) {
    warnings.push(`❌ Missing in ProjectStats interface: ${missingInInterface.join(', ')}`);
    results.push(`\n🔧 These variables need to be added to lib/analyticsCalculator.ts ProjectStats interface`);
  } else {
    results.push(`✅ All key variables found in ProjectStats interface`);
  }
  
  results.push(`\n✅ Found (${foundInInterface.length}): ${foundInInterface.join(', ')}`);
  if (missingInInterface.length > 0) {
    results.push(`❌ Missing (${missingInInterface.length}): ${missingInInterface.join(', ')}`);
  }
  
  return {
    system: 'TypeScript ProjectStats Interface',
    status: missingInInterface.length > 0 ? 'ERROR' : 'OK',
    message: results.join('\n'),
    details: {
      foundInInterface,
      missingInInterface,
      warnings
    }
  };
}

async function main() {
  console.log('🔍 KYC Variables Integration Verification\n');
  console.log('=' .repeat(80));
  
  const verifications = [
    await verifyColumnMap(),
    await verifyMongoDBVariables(),
    await verifyProjectData(),
    await verifyTypeScriptInterface()
  ];
  
  for (const result of verifications) {
    console.log(`\n\n📦 ${result.system}`);
    console.log('─'.repeat(80));
    console.log(result.message);
    
    if (result.details?.warnings && result.details.warnings.length > 0) {
      console.log('\n⚠️ Warnings:');
      result.details.warnings.forEach((w: string) => console.log(`   ${w}`));
    }
  }
  
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 SUMMARY\n');
  
  const errorCount = verifications.filter(v => v.status === 'ERROR').length;
  const warningCount = verifications.filter(v => v.status === 'WARNING').length;
  const okCount = verifications.filter(v => v.status === 'OK').length;
  
  console.log(`✅ OK:       ${okCount}`);
  console.log(`⚠️ WARNING:  ${warningCount}`);
  console.log(`❌ ERROR:    ${errorCount}`);
  
  if (errorCount > 0) {
    console.log('\n🔧 ACTION REQUIRED: Fix errors to ensure full integration');
    process.exit(1);
  } else if (warningCount > 0) {
    console.log('\n⚠️ ATTENTION: Review warnings for potential issues');
    process.exit(0);
  } else {
    console.log('\n✅ All systems verified - KYC variables fully integrated!');
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('❌ Verification failed:', error);
  process.exit(1);
});
