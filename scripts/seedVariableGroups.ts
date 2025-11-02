#!/usr/bin/env tsx
// scripts/seedVariableGroups.ts
// WHAT: Seed default variable groups into MongoDB
// WHY: Edit page requires groups to render clicker/manual sections
// USAGE: npm run seed:groups

import 'dotenv/config';
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

interface VariableGroupDoc {
  groupOrder: number;
  chartId?: string;
  titleOverride?: string;
  variables: string[];
  visibleInClicker: boolean;
  visibleInManual: boolean;
  createdAt: string;
  updatedAt: string;
}

async function seedVariableGroups() {
  const client = new MongoClient(MONGODB_URI!);
  
  try {
    console.log('🔗 Connecting to MongoDB...');
    await client.connect();
    
    const db = client.db(MONGODB_DB);
    const collection = db.collection<VariableGroupDoc>('variablesGroups');
    
    // Check if groups already exist
    const existingCount = await collection.countDocuments({});
    console.log(`📊 Found ${existingCount} existing variable groups`);
    
    if (existingCount > 0) {
      console.log('⚠️  Groups already exist. Delete them first with: npm run seed:groups:reset');
      console.log('   Or seed anyway? (will add duplicates)');
      // Exit without error
      await client.close();
      return;
    }
    
    const now = new Date().toISOString();
    
    // WHAT: Default variable groups for Editor (Clicker & Manual modes)
    // WHY: Matches specification from WARP.md and ADMIN_VARIABLES_SYSTEM.md
    const defaultGroups: VariableGroupDoc[] = [
      {
        groupOrder: 1,
        chartId: 'all-images-taken',
        titleOverride: undefined,
        variables: ['remoteImages', 'hostessImages', 'selfies'],
        visibleInClicker: true,
        visibleInManual: true,
        createdAt: now,
        updatedAt: now
      },
      {
        groupOrder: 2,
        chartId: 'total-fans',
        titleOverride: undefined,
        variables: ['remoteFans', 'stadium'],
        visibleInClicker: true,
        visibleInManual: true,
        createdAt: now,
        updatedAt: now
      },
      {
        groupOrder: 3,
        chartId: undefined,
        titleOverride: 'Gender',
        variables: ['female', 'male'],
        visibleInClicker: true,
        visibleInManual: true,
        createdAt: now,
        updatedAt: now
      },
      {
        groupOrder: 4,
        chartId: undefined,
        titleOverride: 'Age Groups',
        variables: ['genAlpha', 'genYZ', 'genX', 'boomer'],
        visibleInClicker: true,
        visibleInManual: true,
        createdAt: now,
        updatedAt: now
      },
      {
        groupOrder: 5,
        chartId: undefined,
        titleOverride: 'Merchandise',
        variables: ['merched', 'jersey', 'scarf', 'flags', 'baseballCap', 'other'],
        visibleInClicker: true,
        visibleInManual: true,
        createdAt: now,
        updatedAt: now
      },
      {
        groupOrder: 6,
        chartId: undefined,
        titleOverride: 'Image Approval',
        variables: ['approvedImages', 'rejectedImages'],
        visibleInClicker: true,
        visibleInManual: true,
        createdAt: now,
        updatedAt: now
      },
      {
        groupOrder: 7,
        chartId: undefined,
        titleOverride: 'Visits & Engagement',
        variables: ['visitQrCode', 'visitShortUrl', 'socialVisit', 'visitWeb', 'eventValuePropositionVisited', 'eventValuePropositionPurchases'],
        visibleInClicker: true,
        visibleInManual: true,
        createdAt: now,
        updatedAt: now
      },
      {
        groupOrder: 8,
        chartId: undefined,
        titleOverride: 'Event Details',
        variables: ['eventAttendees', 'eventResultHome', 'eventResultVisitor'],
        visibleInClicker: true,
        visibleInManual: true,
        createdAt: now,
        updatedAt: now
      }
    ];
    
    console.log(`📦 Seeding ${defaultGroups.length} default variable groups...`);
    const result = await collection.insertMany(defaultGroups);
    console.log(`✅ Successfully seeded ${result.insertedCount} variable groups`);
    
    // Verify seeding
    const finalCount = await collection.countDocuments({});
    console.log(`📊 Total variable groups in database: ${finalCount}`);
    
    console.log('\n✨ Variable groups seeding complete!');
    console.log('🎯 Edit pages should now display clicker sections correctly.');
    
  } catch (error) {
    console.error('❌ Failed to seed variable groups:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 MongoDB connection closed');
  }
}

// Run the seeding
seedVariableGroups();
