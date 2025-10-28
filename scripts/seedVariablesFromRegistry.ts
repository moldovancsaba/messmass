#!/usr/bin/env ts-node
// scripts/seedVariablesFromRegistry.ts
// WHAT: Migrate all variables from code registry to MongoDB variables_metadata collection
// WHY: Enable fully dynamic variable system without code changes
// HOW: Read variablesRegistry.ts, upsert to MongoDB, mark all as isSystem: true

import { MongoClient, ObjectId } from 'mongodb';
import { BASE_STATS_VARIABLES, DERIVED_VARIABLES, TEXT_VARIABLES_STATIC } from '../lib/variablesRegistry';

// MongoDB connection (use environment variables in production)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

interface VariableMetadata {
  _id: ObjectId;
  name: string;
  label: string;
  type: 'count' | 'percentage' | 'currency' | 'numeric' | 'text' | 'boolean' | 'date';
  category: string;
  description?: string;
  unit?: string;
  derived: boolean;
  formula?: string;
  flags: {
    visibleInClicker: boolean;
    editableInManual: boolean;
  };
  isSystem: boolean;
  order: number;
  alias?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
}

/**
 * WHAT: Determine default visibleInClicker flag based on variable category
 * WHY: Images, Fans, Demographics, Merchandise should be visible in clicker by default
 * HOW: Check category against whitelist
 */
function getDefaultClickerFlag(variable: any): boolean {
  const clickerCategories = [
    'Images',
    'Fans',
    'Demographics',
    'Merchandise',
    'Moderation',
    'Event'
  ];
  return clickerCategories.includes(variable.category);
}

/**
 * WHAT: Main seeding function
 * WHY: Populate variables_metadata collection with all registry variables
 * HOW: Upsert each variable with isSystem: true
 */
async function seedVariables() {
  console.log('🚀 Starting variables seeding process...\n');
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db(MONGODB_DB);
    const collection = db.collection<VariableMetadata>('variables_metadata');
    
    // WHAT: Combine all registry variables
    // WHY: Single source for seeding
    const allRegistryVars = [
      ...BASE_STATS_VARIABLES,
      ...DERIVED_VARIABLES,
      ...TEXT_VARIABLES_STATIC
    ];
    
    console.log(`📊 Found ${allRegistryVars.length} variables to seed\n`);
    
    // WHAT: Create indexes
    // WHY: Ensure uniqueness and query performance
    console.log('🔍 Creating indexes...');
    await collection.createIndex({ name: 1 }, { unique: true });
    await collection.createIndex({ category: 1 });
    await collection.createIndex({ 'flags.visibleInClicker': 1 });
    await collection.createIndex({ isSystem: 1 });
    await collection.createIndex({ category: 1, order: 1 });
    await collection.createIndex({ createdAt: -1 });
    await collection.createIndex({ updatedAt: -1 });
    console.log('✅ Indexes created\n');
    
    let insertedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    
    // WHAT: Upsert each variable
    // WHY: Idempotent - can run multiple times safely
    for (const [index, variable] of allRegistryVars.entries()) {
      const now = new Date().toISOString();
      
      const doc: Partial<VariableMetadata> = {
        name: variable.name,
        label: variable.label,
        type: variable.type,
        category: variable.category,
        description: variable.description || '',
        derived: variable.derived || false,
        formula: variable.formula || undefined,
        flags: {
          visibleInClicker: getDefaultClickerFlag(variable),
          editableInManual: !variable.derived && variable.type !== 'text'
        },
        isSystem: true,  // 🔒 All registry variables are system variables
        order: index,
        createdAt: now,
        updatedAt: now,
        createdBy: 'system'
      };
      
      const result = await collection.updateOne(
        { name: variable.name },
        {
          $setOnInsert: doc
        },
        { upsert: true }
      );
      
      if (result.upsertedCount > 0) {
        insertedCount++;
        console.log(`  ✅ Inserted: ${variable.name} (${variable.label})`);
      } else if (result.modifiedCount > 0) {
        updatedCount++;
        console.log(`  🔄 Updated: ${variable.name} (${variable.label})`);
      } else {
        skippedCount++;
        console.log(`  ⏭️  Skipped (exists): ${variable.name}`);
      }
    }
    
    console.log('\n📈 Seeding Summary:');
    console.log(`   • Inserted: ${insertedCount}`);
    console.log(`   • Updated: ${updatedCount}`);
    console.log(`   • Skipped: ${skippedCount}`);
    console.log(`   • Total: ${allRegistryVars.length}\n`);
    
    // WHAT: Verify seeding
    // WHY: Ensure all variables exist in database
    const verifyCount = await collection.countDocuments({ isSystem: true });
    console.log(`🔍 Verification: ${verifyCount} system variables in database\n`);
    
    if (verifyCount < allRegistryVars.length) {
      console.warn(`⚠️  Warning: Expected ${allRegistryVars.length} but found ${verifyCount}`);
      console.warn('   Some variables may not have been seeded correctly.\n');
    } else {
      console.log('✅ All variables seeded successfully!\n');
    }
    
    // WHAT: Display sample variables by category
    // WHY: Quick visual verification
    console.log('📋 Sample variables by category:');
    const categories = [...new Set(allRegistryVars.map(v => v.category))];
    for (const cat of categories.slice(0, 5)) {
      const count = allRegistryVars.filter(v => v.category === cat).length;
      console.log(`   • ${cat}: ${count} variables`);
    }
    if (categories.length > 5) {
      console.log(`   ... and ${categories.length - 5} more categories`);
    }
    
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n✅ MongoDB connection closed');
  }
}

// WHAT: Run seeding if executed directly
// WHY: Allow script to be imported or run standalone
if (require.main === module) {
  seedVariables()
    .then(() => {
      console.log('\n🎉 Variables seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Fatal error:', error);
      process.exit(1);
    });
}

export { seedVariables };
