#!/usr/bin/env tsx
/**
 * WHAT: Initialize mandatory fields in ALL projects
 * WHY: reportText11-15, reportImage11-25, and szerencsejatek* fields must exist in all projects
 * HOW: Add missing fields to all projects.stats objects
 */

import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

// Mandatory fields that must exist in ALL projects
const MANDATORY_FIELDS = {
  // Report text fields 11-15 (initialize as empty strings)
  reportText11: '',
  reportText12: '',
  reportText13: '',
  reportText14: '',
  reportText15: '',
  
  // Report image fields 11-25 (initialize as empty strings)
  reportImage11: '',
  reportImage12: '',
  reportImage13: '',
  reportImage14: '',
  reportImage15: '',
  reportImage16: '',
  reportImage17: '',
  reportImage18: '',
  reportImage19: '',
  reportImage20: '',
  reportImage21: '',
  reportImage22: '',
  reportImage23: '',
  reportImage24: '',
  reportImage25: '',
  
  // Szerencsejatek fields (initialize as 0)
  szerencsejatekAllPerson: 0,
  szerencsejatekAllRegistered: 0,
  szerencsejatekAllusersAllphotos: 0,
  szerencsejatekFunnelQR: 0,
  szerencsejatekFunnelSocial: 0,
  szerencsejatekFunnelURL: 0,
  szerencsejatekHostessAllRegistered: 0,
  szerencsejatekHostessAllphotos: 0,
  szerencsejatekMarketingCTA01: 0,
  szerencsejatekMarketingCTA01Conversion: 0,
  szerencsejatekMarketingCTA02: 0,
  szerencsejatekMarketingCTA02Conversion: 0,
  szerencsejatekMarketingOptInNumber: 0,
  szerencsejatekMarketingOptInPercentage: 0,
  szerencsejatekTop10: 0,
};

async function initializeMandatoryFields() {
  const client = new MongoClient(MONGODB_URI!);
  
  try {
    await client.connect();
    const db = client.db(MONGODB_DB);
    
    const projectsCollection = db.collection('projects');
    const projects = await projectsCollection.find({}).toArray();
    
    console.log(`📊 Found ${projects.length} projects\n`);
    console.log('🔍 Checking for missing mandatory fields...\n');
    console.log('='.repeat(80));
    
    let updatedCount = 0;
    const fieldCounts: Record<string, number> = {};
    
    for (const project of projects) {
      if (!project.stats) {
        // Initialize stats object if it doesn't exist
        project.stats = {};
      }
      
      let needsUpdate = false;
      const updates: Record<string, any> = {};
      
      // Check each mandatory field
      for (const [fieldName, defaultValue] of Object.entries(MANDATORY_FIELDS)) {
        if (!(fieldName in project.stats)) {
          updates[fieldName] = defaultValue;
          needsUpdate = true;
          fieldCounts[fieldName] = (fieldCounts[fieldName] || 0) + 1;
        }
      }
      
      if (needsUpdate) {
        await projectsCollection.updateOne(
          { _id: project._id },
          { $set: { [`stats.${Object.keys(updates)[0]}`]: Object.values(updates)[0], ...Object.fromEntries(Object.entries(updates).map(([k, v]) => [`stats.${k}`, v])) } }
        );
        
        // Better approach: set all fields at once
        const statsUpdate: Record<string, any> = {};
        for (const [fieldName, defaultValue] of Object.entries(updates)) {
          statsUpdate[`stats.${fieldName}`] = defaultValue;
        }
        
        await projectsCollection.updateOne(
          { _id: project._id },
          { $set: statsUpdate }
        );
        
        updatedCount++;
      }
    }
    
    console.log('='.repeat(80));
    console.log(`\n✅ Initialization complete:`);
    console.log(`  - Projects updated: ${updatedCount}`);
    console.log(`\n📋 Fields initialized:`);
    for (const [fieldName, count] of Object.entries(fieldCounts)) {
      console.log(`  - ${fieldName}: ${count} projects`);
    }
    console.log(`\n✅ All mandatory fields now exist in ALL projects!\n`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

initializeMandatoryFields();

