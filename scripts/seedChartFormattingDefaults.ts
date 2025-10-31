/**
 * Seed Chart Formatting Defaults
 * 
 * WHAT: Initialize database with default formatting configurations
 * WHY: No hardcoded values in code - all defaults come from database
 * 
 * DEFAULTS:
 * - currency: € prefix, rounded, no suffix (European standard)
 * - percentage: no prefix, not rounded (2 decimals), % suffix
 * - count: no prefix, rounded (whole numbers), no suffix
 * - custom: no prefix, rounded, no suffix (generic default)
 * 
 * USAGE: npm run seed:formatting-defaults
 */

import { MongoClient, Db } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

const FORMATTING_CONFIG = {
  defaults: {
    rounded: true,
    prefix: '€',
    suffix: '',
    visible: true
  },
  availablePrefixes: [
    '€',   // Euro
    '$',   // US Dollar
    '£',   // British Pound
    '¥',   // Japanese Yen / Chinese Yuan
    'CHF', // Swiss Franc
    'R$',  // Brazilian Real
    '₹',   // Indian Rupee
    '₽',   // Russian Ruble
    'kr',  // Norwegian/Swedish Krona
    '¢'    // Cents
  ],
  availableSuffixes: [
    '%',        // Percentage
    ' pts',     // Points
    ' fans',    // Fans count
    ' units',   // Generic units
    ' goals',   // Goals scored
    ' km',      // Kilometers
    ' m',       // Meters
    ' items',   // Items count
    ' count',   // Generic count
    'x'         // Multiplier
  ]
};

async function seedFormattingDefaults(): Promise<void> {
  const client = new MongoClient(MONGODB_URI!);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db: Db = client.db(MONGODB_DB);
    const collection = db.collection('chart_formatting_defaults');

    const existing = await collection.findOne({});

    if (existing) {
      console.log('⏭️  SKIPPED: Formatting defaults already exist');
      console.log('   Current defaults:', JSON.stringify(existing.defaults, null, 2));
      console.log('\n   To update, use the Admin UI or API');
    } else {
      await collection.insertOne({
        ...FORMATTING_CONFIG,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      console.log('✅ CREATED: Chart formatting defaults');
      console.log(`   Default: € prefix, rounded, visible`);
      console.log(`   Available prefixes: ${FORMATTING_CONFIG.availablePrefixes.length} options`);
      console.log(`   Available suffixes: ${FORMATTING_CONFIG.availableSuffixes.length} options`);
    }
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await client.close();
    console.log('🔌 MongoDB connection closed');
  }
}

console.log('\n' + '='.repeat(60));
console.log('🌱 Chart Formatting Defaults Seeder');
console.log('='.repeat(60));

seedFormattingDefaults()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
