// scripts/migrateImageAspectRatio.ts
// WHAT: Add aspectRatio field to all existing image charts
// WHY: v9.3.0 introduces aspect ratio system for consistent image layout
// HOW: Default all existing image charts to '16:9' (Landscape)

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

interface ChartConfiguration {
  _id?: string;
  chartId: string;
  type: 'pie' | 'bar' | 'kpi' | 'text' | 'image';
  aspectRatio?: '16:9' | '9:16' | '1:1';
  updatedAt?: string;
}

async function migrateImageAspectRatio() {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is required');
  }
  const client = new MongoClient(MONGODB_URI);

  try {
    console.log('📊 Starting image chart aspect ratio migration...\n');

    await client.connect();
    const db = client.db(MONGODB_DB);
    const chartsCollection = db.collection<ChartConfiguration>('chartConfigurations');

    // WHAT: Find all image charts without aspectRatio field or with invalid value
    // WHY: Only migrate charts that need the new field
    const imageChartsWithoutRatio = await chartsCollection.find({
      type: 'image',
      aspectRatio: { $nin: ['16:9', '9:16', '1:1'] }
    }).toArray();

    console.log(`🔍 Found ${imageChartsWithoutRatio.length} image charts without aspectRatio field\n`);

    if (imageChartsWithoutRatio.length === 0) {
      console.log('✅ No migration needed - all image charts already have aspectRatio');
      return;
    }

    // WHAT: Add aspectRatio: '16:9' to all image charts without valid aspectRatio
    // WHY: Landscape is the most common use case, provides backward compatibility
    const result = await chartsCollection.updateMany(
      {
        type: 'image',
        aspectRatio: { $nin: ['16:9', '9:16', '1:1'] }
      },
      {
        $set: {
          aspectRatio: '16:9',
          updatedAt: new Date().toISOString()
        }
      }
    );

    console.log(`✅ Migration complete!`);
    console.log(`   - ${result.modifiedCount} image charts updated`);
    console.log(`   - Default aspect ratio: 16:9 (Landscape)`);
    console.log(`   - Grid width: 3 units (auto-calculated)\n`);

    // WHAT: Display migrated charts for verification
    // WHY: Allow admin to review which charts were updated
    if (result.modifiedCount > 0) {
      console.log('📋 Migrated charts:');
      for (const chart of imageChartsWithoutRatio) {
        console.log(`   - ${chart.chartId} → aspectRatio: '16:9'`);
      }
    }

    console.log('\n✨ Image aspect ratio migration completed successfully!');
    console.log('ℹ️  Next steps:');
    console.log('   1. Verify charts in Chart Algorithm Manager');
    console.log('   2. Adjust aspect ratios if needed (9:16 Portrait, 1:1 Square)');
    console.log('   3. Test PDF export with new rendering method\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run migration
migrateImageAspectRatio();
