#!/usr/bin/env node

/**
 * SINGLE REFERENCE SYSTEM - Database Migration Script
 * 
 * WHAT: Migrates projects from indoor/outdoor schema to remoteFans schema
 * WHY: Consolidate fan location tracking into single remoteFans field
 * HOW: Calculate remoteFans = indoor + outdoor, then remove legacy fields
 * 
 * SAFE: Runs in dry-run mode by default, use --live to apply changes
 * 
 * Usage:
 *   npm run migrate:remoteFans          # Dry run (shows what would change)
 *   npm run migrate:remoteFans -- --live  # Apply changes to database
 */

const { MongoClient } = require('mongodb');
const path = require('path');

// Load environment variables from .env.local (Next.js convention)
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

// Check command line arguments
const args = process.argv.slice(2);
const isLiveRun = args.includes('--live');
const isVerbose = args.includes('--verbose');

if (!MONGODB_URI) {
  console.error('❌ Error: MONGODB_URI environment variable not set');
  process.exit(1);
}

async function migrateToRemoteFans() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected successfully\n');
    
    const db = client.db(MONGODB_DB);
    const projectsCollection = db.collection('projects');
    
    // Find all projects with indoor/outdoor fields
    console.log('🔍 Searching for projects with legacy schema (indoor/outdoor)...\n');
    
    const legacyProjects = await projectsCollection.find({
      $or: [
        { 'stats.indoor': { $exists: true } },
        { 'stats.outdoor': { $exists: true } }
      ]
    }).toArray();
    
    console.log(`📊 Found ${legacyProjects.length} projects with legacy schema\n`);
    
    if (legacyProjects.length === 0) {
      console.log('✨ All projects already migrated! No work needed.\n');
      return;
    }
    
    // Show migration preview
    console.log('📋 MIGRATION PREVIEW:');
    console.log('='.repeat(80));
    
    let totalIndoor = 0;
    let totalOutdoor = 0;
    let totalRemoteFans = 0;
    
    legacyProjects.forEach((project, index) => {
      const indoor = project.stats?.indoor || 0;
      const outdoor = project.stats?.outdoor || 0;
      const remoteFans = indoor + outdoor;
      
      totalIndoor += indoor;
      totalOutdoor += outdoor;
      totalRemoteFans += remoteFans;
      
      if (isVerbose || index < 5) {
        console.log(`\n📄 Project: ${project.eventName || project._id}`);
        console.log(`   Date: ${project.eventDate || 'N/A'}`);
        console.log(`   BEFORE: indoor=${indoor}, outdoor=${outdoor}`);
        console.log(`   AFTER:  remoteFans=${remoteFans}`);
      }
    });
    
    if (legacyProjects.length > 5 && !isVerbose) {
      console.log(`\n   ... and ${legacyProjects.length - 5} more projects`);
      console.log('   (use --verbose to see all)');
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('\n📈 MIGRATION SUMMARY:');
    console.log(`   Total projects to migrate: ${legacyProjects.length}`);
    console.log(`   Total indoor fans: ${totalIndoor.toLocaleString()}`);
    console.log(`   Total outdoor fans: ${totalOutdoor.toLocaleString()}`);
    console.log(`   Total remoteFans (sum): ${totalRemoteFans.toLocaleString()}`);
    console.log(`   Average remoteFans per project: ${Math.round(totalRemoteFans / legacyProjects.length)}`);
    
    if (!isLiveRun) {
      console.log('\n⚠️  DRY RUN MODE - No changes applied');
      console.log('   Run with --live flag to apply changes to database');
      console.log('\n   Example: npm run migrate:remoteFans -- --live\n');
      return;
    }
    
    // LIVE RUN: Apply migration
    console.log('\n🚀 LIVE RUN: Applying migration...\n');
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    for (const project of legacyProjects) {
      try {
        const indoor = project.stats?.indoor || 0;
        const outdoor = project.stats?.outdoor || 0;
        const remoteFans = indoor + outdoor;
        
        // Update project: set remoteFans, remove indoor/outdoor
        const result = await projectsCollection.updateOne(
          { _id: project._id },
          {
            $set: {
              'stats.remoteFans': remoteFans,
              updatedAt: new Date().toISOString()
            },
            $unset: {
              'stats.indoor': '',
              'stats.outdoor': ''
            }
          }
        );
        
        if (result.modifiedCount > 0) {
          successCount++;
          if (isVerbose) {
            console.log(`✅ Migrated: ${project.eventName || project._id} (remoteFans=${remoteFans})`);
          }
        } else {
          console.warn(`⚠️  No changes for: ${project.eventName || project._id}`);
        }
        
      } catch (error) {
        errorCount++;
        errors.push({
          projectId: project._id,
          eventName: project.eventName,
          error: error.message
        });
        console.error(`❌ Error migrating ${project.eventName || project._id}: ${error.message}`);
      }
    }
    
    // Final summary
    console.log('\n' + '='.repeat(80));
    console.log('✨ MIGRATION COMPLETE!\n');
    console.log(`✅ Successfully migrated: ${successCount} projects`);
    
    if (errorCount > 0) {
      console.log(`❌ Errors encountered: ${errorCount} projects`);
      console.log('\n❌ ERRORS:');
      errors.forEach(err => {
        console.log(`   - ${err.eventName || err.projectId}: ${err.error}`);
      });
    }
    
    console.log('\n📊 DATABASE STATE:');
    const totalProjects = await projectsCollection.countDocuments();
    const remainingLegacy = await projectsCollection.countDocuments({
      $or: [
        { 'stats.indoor': { $exists: true } },
        { 'stats.outdoor': { $exists: true } }
      ]
    });
    const migratedProjects = await projectsCollection.countDocuments({
      'stats.remoteFans': { $exists: true }
    });
    
    console.log(`   Total projects: ${totalProjects}`);
    console.log(`   Migrated (have remoteFans): ${migratedProjects}`);
    console.log(`   Remaining legacy (have indoor/outdoor): ${remainingLegacy}`);
    
    if (remainingLegacy === 0) {
      console.log('\n🎉 ALL PROJECTS SUCCESSFULLY MIGRATED!\n');
    } else {
      console.log('\n⚠️  Some projects still have legacy schema. Re-run migration to fix.\n');
    }
    
  } catch (error) {
    console.error('\n❌ MIGRATION FAILED:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Database connection closed\n');
  }
}

// Run migration
console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║     SINGLE REFERENCE SYSTEM - Database Migration Script      ║');
console.log('║                indoor + outdoor → remoteFans                  ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

console.log(`Mode: ${isLiveRun ? '🔴 LIVE RUN (changes will be applied)' : '🟡 DRY RUN (no changes)'}`);
console.log(`Verbose: ${isVerbose ? 'ON' : 'OFF'}\n`);

migrateToRemoteFans()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
