#!/usr/bin/env node

/**
 * Seed Available Fonts - Initialize font collection in MongoDB
 * 
 * WHAT: Populate available_fonts collection with default fonts
 * WHY: Ensure system has fonts available on first run
 * HOW: Insert default fonts if collection is empty
 * 
 * Usage: npx tsx scripts/seed-available-fonts.ts [--force]
 */

import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import config from '../lib/config';
import { DEFAULT_FONTS } from '../lib/fontTypes';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || config.mongodbUri;
const MONGODB_DB = process.env.MONGODB_DB || config.dbName;
const COLLECTION = 'available_fonts';

async function seedFonts() {
  const force = process.argv.includes('--force');
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(MONGODB_DB);
    const collection = db.collection(COLLECTION);
    
    // Check if fonts already exist
    const existingCount = await collection.countDocuments();
    
    if (existingCount > 0 && !force) {
      console.log(`ℹ️  Fonts already exist (${existingCount} fonts). Use --force to overwrite.`);
      return;
    }
    
    if (force && existingCount > 0) {
      console.log('🗑️  Removing existing fonts...');
      await collection.deleteMany({});
    }
    
    // Insert default fonts
    const fontsToInsert = DEFAULT_FONTS.map(font => ({
      ...font,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    
    const result = await collection.insertMany(fontsToInsert);
    
    console.log(`✅ Seeded ${result.insertedCount} fonts:`);
    fontsToInsert.forEach((font, idx) => {
      console.log(`   ${idx + 1}. ${font.name} (${font.category})`);
    });
    
    // Create indexes
    await collection.createIndex({ name: 1 }, { unique: true });
    await collection.createIndex({ isActive: 1 });
    await collection.createIndex({ displayOrder: 1 });
    console.log('✅ Created indexes');
    
  } catch (error) {
    console.error('❌ Error seeding fonts:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

seedFonts();

