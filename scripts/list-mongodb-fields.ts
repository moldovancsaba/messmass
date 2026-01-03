#!/usr/bin/env tsx
/**
 * WHAT: List all actual MongoDB field names
 * WHY: Verify what fields actually exist before using them in formulas
 */

import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

async function listMongoDBFields() {
  const client = new MongoClient(MONGODB_URI!);
  
  try {
    await client.connect();
    const db = client.db(MONGODB_DB);
    
    const projects = await db.collection('projects').find({}).toArray();
    const mongoFields = new Set<string>();
    
    projects.forEach((project: any) => {
      if (project.stats) {
        Object.keys(project.stats).forEach((key: string) => {
          mongoFields.add(key);
        });
      }
    });
    
    const sortedFields = Array.from(mongoFields).sort();
    
    console.log(`📊 MongoDB Stats Fields (${sortedFields.length} total):\n`);
    
    // Group by category
    const reportTextFields = sortedFields.filter(f => f.startsWith('reportText'));
    const reportImageFields = sortedFields.filter(f => f.startsWith('reportImage'));
    const bitlyFields = sortedFields.filter(f => f.toLowerCase().includes('bitly'));
    const szerencseFields = sortedFields.filter(f => f.toLowerCase().includes('szerencse'));
    const gamesFields = sortedFields.filter(f => f.toLowerCase().includes('game'));
    const otherFields = sortedFields.filter(f => 
      !f.startsWith('reportText') && 
      !f.startsWith('reportImage') && 
      !f.toLowerCase().includes('bitly') &&
      !f.toLowerCase().includes('szerencse') &&
      !f.toLowerCase().includes('game')
    );
    
    if (reportTextFields.length > 0) {
      console.log('📝 Report Text Fields:');
      reportTextFields.forEach(f => console.log(`  - ${f}`));
      console.log();
    }
    
    if (reportImageFields.length > 0) {
      console.log('🖼️  Report Image Fields:');
      reportImageFields.forEach(f => console.log(`  - ${f}`));
      console.log();
    }
    
    if (bitlyFields.length > 0) {
      console.log('🔗 Bitly Fields:');
      bitlyFields.forEach(f => console.log(`  - ${f}`));
      console.log();
    }
    
    if (szerencseFields.length > 0) {
      console.log('🎰 Szerencse Fields:');
      szerencseFields.forEach(f => console.log(`  - ${f}`));
      console.log();
    }
    
    if (gamesFields.length > 0) {
      console.log('🎮 Games Fields:');
      gamesFields.forEach(f => console.log(`  - ${f}`));
      console.log();
    }
    
    console.log('📋 Other Fields:');
    otherFields.forEach(f => console.log(`  - ${f}`));
    console.log();
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

listMongoDBFields();

