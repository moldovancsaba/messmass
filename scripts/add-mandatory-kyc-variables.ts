#!/usr/bin/env tsx
/**
 * WHAT: Add mandatory fields to KYC variables_metadata collection
 * WHY: reportText11-15, reportImage11-25, and szerencsejatek* fields must be available in chart configurator
 * HOW: Insert or update variables in variables_metadata collection
 */

import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

// Mandatory variables to add to KYC
const MANDATORY_VARIABLES = [
  // Report text fields 11-15
  { name: 'reportText11', label: 'Report Text 11', type: 'text', category: 'Report Content', derived: false, isSystem: true, order: 11 },
  { name: 'reportText12', label: 'Report Text 12', type: 'text', category: 'Report Content', derived: false, isSystem: true, order: 12 },
  { name: 'reportText13', label: 'Report Text 13', type: 'text', category: 'Report Content', derived: false, isSystem: true, order: 13 },
  { name: 'reportText14', label: 'Report Text 14', type: 'text', category: 'Report Content', derived: false, isSystem: true, order: 14 },
  { name: 'reportText15', label: 'Report Text 15', type: 'text', category: 'Report Content', derived: false, isSystem: true, order: 15 },
  
  // Report image fields 11-25
  { name: 'reportImage11', label: 'Report Image 11', type: 'text', category: 'Report Content', derived: false, isSystem: true, order: 11 },
  { name: 'reportImage12', label: 'Report Image 12', type: 'text', category: 'Report Content', derived: false, isSystem: true, order: 12 },
  { name: 'reportImage13', label: 'Report Image 13', type: 'text', category: 'Report Content', derived: false, isSystem: true, order: 13 },
  { name: 'reportImage14', label: 'Report Image 14', type: 'text', category: 'Report Content', derived: false, isSystem: true, order: 14 },
  { name: 'reportImage15', label: 'Report Image 15', type: 'text', category: 'Report Content', derived: false, isSystem: true, order: 15 },
  { name: 'reportImage16', label: 'Report Image 16', type: 'text', category: 'Report Content', derived: false, isSystem: true, order: 16 },
  { name: 'reportImage17', label: 'Report Image 17', type: 'text', category: 'Report Content', derived: false, isSystem: true, order: 17 },
  { name: 'reportImage18', label: 'Report Image 18', type: 'text', category: 'Report Content', derived: false, isSystem: true, order: 18 },
  { name: 'reportImage19', label: 'Report Image 19', type: 'text', category: 'Report Content', derived: false, isSystem: true, order: 19 },
  { name: 'reportImage20', label: 'Report Image 20', type: 'text', category: 'Report Content', derived: false, isSystem: true, order: 20 },
  { name: 'reportImage21', label: 'Report Image 21', type: 'text', category: 'Report Content', derived: false, isSystem: true, order: 21 },
  { name: 'reportImage22', label: 'Report Image 22', type: 'text', category: 'Report Content', derived: false, isSystem: true, order: 22 },
  { name: 'reportImage23', label: 'Report Image 23', type: 'text', category: 'Report Content', derived: false, isSystem: true, order: 23 },
  { name: 'reportImage24', label: 'Report Image 24', type: 'text', category: 'Report Content', derived: false, isSystem: true, order: 24 },
  { name: 'reportImage25', label: 'Report Image 25', type: 'text', category: 'Report Content', derived: false, isSystem: true, order: 25 },
  
  // Szerencsejatek fields
  { name: 'szerencsejatekAllPerson', label: 'Szerencsejatek All Person', type: 'count', category: 'Szerencsejatek', derived: false, isSystem: true, order: 1 },
  { name: 'szerencsejatekAllRegistered', label: 'Szerencsejatek All Registered', type: 'count', category: 'Szerencsejatek', derived: false, isSystem: true, order: 2 },
  { name: 'szerencsejatekAllusersAllphotos', label: 'Szerencsejatek All Users All Photos', type: 'count', category: 'Szerencsejatek', derived: false, isSystem: true, order: 3 },
  { name: 'szerencsejatekFunnelQR', label: 'Szerencsejatek Funnel QR', type: 'count', category: 'Szerencsejatek', derived: false, isSystem: true, order: 4 },
  { name: 'szerencsejatekFunnelSocial', label: 'Szerencsejatek Funnel Social', type: 'count', category: 'Szerencsejatek', derived: false, isSystem: true, order: 5 },
  { name: 'szerencsejatekFunnelURL', label: 'Szerencsejatek Funnel URL', type: 'count', category: 'Szerencsejatek', derived: false, isSystem: true, order: 6 },
  { name: 'szerencsejatekHostessAllRegistered', label: 'Szerencsejatek Hostess All Registered', type: 'count', category: 'Szerencsejatek', derived: false, isSystem: true, order: 7 },
  { name: 'szerencsejatekHostessAllphotos', label: 'Szerencsejatek Hostess All Photos', type: 'count', category: 'Szerencsejatek', derived: false, isSystem: true, order: 8 },
  { name: 'szerencsejatekMarketingCTA01', label: 'Szerencsejatek Marketing CTA 01', type: 'count', category: 'Szerencsejatek', derived: false, isSystem: true, order: 9 },
  { name: 'szerencsejatekMarketingCTA01Conversion', label: 'Szerencsejatek Marketing CTA 01 Conversion', type: 'percentage', category: 'Szerencsejatek', derived: false, isSystem: true, order: 10 },
  { name: 'szerencsejatekMarketingCTA02', label: 'Szerencsejatek Marketing CTA 02', type: 'count', category: 'Szerencsejatek', derived: false, isSystem: true, order: 11 },
  { name: 'szerencsejatekMarketingCTA02Conversion', label: 'Szerencsejatek Marketing CTA 02 Conversion', type: 'percentage', category: 'Szerencsejatek', derived: false, isSystem: true, order: 12 },
  { name: 'szerencsejatekMarketingOptInNumber', label: 'Szerencsejatek Marketing Opt-In Number', type: 'count', category: 'Szerencsejatek', derived: false, isSystem: true, order: 13 },
  { name: 'szerencsejatekMarketingOptInPercentage', label: 'Szerencsejatek Marketing Opt-In Percentage', type: 'percentage', category: 'Szerencsejatek', derived: false, isSystem: true, order: 14 },
  { name: 'szerencsejatekTop10', label: 'Szerencsejatek Top 10', type: 'count', category: 'Szerencsejatek', derived: false, isSystem: true, order: 15 },
];

async function addMandatoryKYCVariables() {
  const client = new MongoClient(MONGODB_URI!);
  
  try {
    await client.connect();
    const db = client.db(MONGODB_DB);
    
    const variablesCollection = db.collection('variables_metadata');
    
    console.log(`📊 Adding ${MANDATORY_VARIABLES.length} mandatory variables to KYC...\n`);
    console.log('='.repeat(80));
    
    let addedCount = 0;
    let updatedCount = 0;
    const now = new Date().toISOString();
    
    for (const variable of MANDATORY_VARIABLES) {
      const existing = await variablesCollection.findOne({ name: variable.name });
      
      if (existing) {
        // Update existing variable (preserve user edits but ensure it's marked as system)
        await variablesCollection.updateOne(
          { name: variable.name },
          { 
            $set: { 
              isSystem: true, // Ensure it's marked as system variable
              updatedAt: now
            }
          }
        );
        updatedCount++;
        console.log(`✅ Updated: ${variable.name}`);
      } else {
        // Insert new variable
        await variablesCollection.insertOne({
          ...variable,
          flags: {
            visibleInClicker: true,
            editableInManual: true
          },
          createdAt: now,
          updatedAt: now,
          createdBy: 'system',
          updatedBy: 'system'
        });
        addedCount++;
        console.log(`➕ Added: ${variable.name}`);
      }
    }
    
    console.log('='.repeat(80));
    console.log(`\n✅ KYC variables update complete:`);
    console.log(`  - Variables added: ${addedCount}`);
    console.log(`  - Variables updated: ${updatedCount}`);
    console.log(`\n✅ All mandatory variables now available in chart configurator!\n`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

addMandatoryKYCVariables();

