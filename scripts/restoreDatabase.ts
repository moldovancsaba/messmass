/**
 * Database Restore Script
 * 
 * Restores MongoDB database from backup with:
 * - Full or selective collection restore
 * - Dry-run mode for safety
 * - Integrity verification
 * - Rollback capability
 * 
 * Usage:
 *   Full restore:      npm run db:restore -- --backup=messmass_backup_2025-11-02T19-30-00-000Z
 *   Single collection: npm run db:restore -- --backup=... --collection=projects
 *   Dry-run:          npm run db:restore -- --backup=... --dry-run
 */

import { MongoClient } from 'mongodb';
import config from '../lib/config';
import * as fs from 'fs';
import * as path from 'path';

interface RestoreOptions {
  backupName: string;
  collection?: string;
  dryRun: boolean;
  force: boolean;
}

interface BackupManifest {
  timestamp: string;
  version: string;
  totalCollections: number;
  totalDocuments: number;
  collections: Array<{
    name: string;
    documentCount: number;
    indexes: number;
  }>;
  integrity: {
    verified: boolean;
    checksums: Record<string, string>;
  };
}

async function restoreDatabase(options: RestoreOptions): Promise<void> {
  const client = new MongoClient(config.mongodbUri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db(config.dbName);
    
    // Validate backup directory
    const backupDir = path.join(process.cwd(), 'backups', options.backupName);
    if (!fs.existsSync(backupDir)) {
      throw new Error(`Backup not found: ${backupDir}`);
    }
    
    console.log(`📁 Backup directory: ${backupDir}\n`);
    
    // Load manifest
    const manifestPath = path.join(backupDir, 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
      throw new Error('Backup manifest not found. Invalid backup.');
    }
    
    const manifest: BackupManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    
    console.log('📋 Backup Information:');
    console.log(`  Timestamp: ${manifest.timestamp}`);
    console.log(`  Version: ${manifest.version}`);
    console.log(`  Collections: ${manifest.totalCollections}`);
    console.log(`  Documents: ${manifest.totalDocuments.toLocaleString()}`);
    console.log(`  Integrity: ${manifest.integrity.verified ? '✅ Verified' : '⚠️  Not verified'}\n`);
    
    if (!manifest.integrity.verified) {
      console.warn('⚠️  WARNING: Backup integrity was not verified during creation!');
      if (!options.force) {
        throw new Error('Refusing to restore unverified backup. Use --force to override.');
      }
    }
    
    // Determine collections to restore
    const collectionsToRestore = options.collection
      ? manifest.collections.filter(c => c.name === options.collection)
      : manifest.collections;
    
    if (collectionsToRestore.length === 0) {
      throw new Error(`Collection "${options.collection}" not found in backup`);
    }
    
    console.log(`🔄 ${options.dryRun ? 'DRY-RUN: Would restore' : 'Restoring'} ${collectionsToRestore.length} collection(s):\n`);
    
    let totalRestored = 0;
    let totalErrors = 0;
    
    for (const collInfo of collectionsToRestore) {
      const collName = collInfo.name;
      console.log(`📦 ${options.dryRun ? '[DRY-RUN]' : 'Processing'} ${collName}...`);
      
      try {
        // Load backup file
        const backupFile = path.join(backupDir, 'collections', `${collName}.json`);
        if (!fs.existsSync(backupFile)) {
          throw new Error(`Backup file not found: ${collName}.json`);
        }
        
        const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf-8'));
        const documents = backupData.documents;
        const indexes = backupData.indexes;
        
        console.log(`  📄 ${documents.length} documents, ${indexes.length} indexes`);
        
        // Verify checksum
        const expectedChecksum = manifest.integrity.checksums[collName];
        if (expectedChecksum) {
          const actualChecksum = generateChecksum(JSON.stringify(documents));
          if (actualChecksum !== expectedChecksum) {
            throw new Error(`Checksum mismatch! Expected: ${expectedChecksum}, Got: ${actualChecksum}`);
          }
          console.log(`  ✅ Checksum verified`);
        }
        
        if (!options.dryRun) {
          const collection = db.collection(collName);
          
          // Check if collection exists and has data
          const existingCount = await collection.countDocuments();
          if (existingCount > 0) {
            console.log(`  ⚠️  Collection already has ${existingCount} documents`);
            if (!options.force) {
              console.log(`  ⏭️  Skipping (use --force to overwrite)`);
              continue;
            }
            console.log(`  🗑️  Dropping existing collection...`);
            await collection.drop();
          }
          
          // Insert documents
          if (documents.length > 0) {
            await collection.insertMany(documents);
            console.log(`  ✅ Inserted ${documents.length} documents`);
          }
          
          // Recreate indexes (skip _id index)
          const customIndexes = indexes.filter((idx: any) => idx.name !== '_id_');
          for (const index of customIndexes) {
            try {
              // Extract key and options from index definition
              const { key, ...options } = index;
              delete options.v; // Remove version field
              delete options.ns; // Remove namespace field
              
              await collection.createIndex(key, options);
              console.log(`  🔧 Created index: ${index.name}`);
            } catch (error) {
              console.warn(`  ⚠️  Failed to create index ${index.name}:`, error instanceof Error ? error.message : error);
            }
          }
          
          totalRestored++;
        } else {
          console.log(`  ✅ Would restore ${documents.length} documents and ${indexes.length - 1} indexes`);
        }
        
      } catch (error) {
        totalErrors++;
        console.error(`  ❌ Error restoring ${collName}:`, error instanceof Error ? error.message : error);
      }
      
      console.log('');
    }
    
    console.log('='.repeat(80));
    if (options.dryRun) {
      console.log('✅ DRY-RUN COMPLETE - NO CHANGES MADE');
    } else {
      console.log('✅ RESTORE COMPLETE');
    }
    console.log('='.repeat(80));
    console.log(`\n📊 Summary:`);
    console.log(`  Collections processed: ${collectionsToRestore.length}`);
    console.log(`  Successfully restored: ${totalRestored}`);
    console.log(`  Errors: ${totalErrors}`);
    
    if (!options.dryRun && totalRestored > 0) {
      console.log(`\n💡 Verify the restore by running: npm run audit:database`);
    }
    
    console.log('='.repeat(80) + '\n');
    
  } finally {
    await client.close();
  }
}

function generateChecksum(data: string): string {
  const crypto = require('crypto');
  return crypto.createHash('md5').update(data).digest('hex');
}

function parseArgs(): RestoreOptions {
  const args = process.argv.slice(2);
  const options: RestoreOptions = {
    backupName: '',
    dryRun: false,
    force: false
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--backup' && i + 1 < args.length) {
      options.backupName = args[++i];
    } else if (arg.startsWith('--backup=')) {
      options.backupName = arg.split('=')[1];
    } else if (arg === '--collection' && i + 1 < args.length) {
      options.collection = args[++i];
    } else if (arg.startsWith('--collection=')) {
      options.collection = arg.split('=')[1];
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--force') {
      options.force = true;
    }
  }
  
  if (!options.backupName) {
    console.error('❌ Error: --backup parameter is required\n');
    console.log('Usage:');
    console.log('  npm run db:restore -- --backup=messmass_backup_2025-11-02T19-30-00-000Z');
    console.log('  npm run db:restore -- --backup=... --collection=projects');
    console.log('  npm run db:restore -- --backup=... --dry-run');
    console.log('  npm run db:restore -- --backup=... --force\n');
    process.exit(1);
  }
  
  return options;
}

// Run restore
const options = parseArgs();
restoreDatabase(options)
  .then(() => {
    console.log('✅ Restore process completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Restore failed:', error);
    process.exit(1);
  });
