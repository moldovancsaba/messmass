#!/usr/bin/env ts-node
/**
 * WHAT: Migration script to add aspectRatio field to existing image charts
 * WHY: Image charts need aspectRatio for proper grid width calculation
 * HOW: Pattern-match chart names and update MongoDB documents
 * 
 * Usage: npx ts-node scripts/fix-image-chart-aspect-ratios.ts
 */

import { MongoClient } from 'mongodb';
import config from '../lib/config';

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = config.dbName;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is required');
  process.exit(1);
}

interface AspectRatioPattern {
  pattern: RegExp;
  aspectRatio: '16:9' | '9:16' | '1:1';
  description: string;
}

// WHAT: Aspect ratio inference rules based on chart name patterns
// WHY: Existing charts don't have aspectRatio field, infer from naming convention
const aspectRatioPatterns: AspectRatioPattern[] = [
  {
    pattern: /landscape/i,
    aspectRatio: '16:9',
    description: 'Landscape charts (16:9)'
  },
  {
    pattern: /portrait/i,
    aspectRatio: '9:16',
    description: 'Portrait charts (9:16)'
  },
  {
    pattern: /square/i,
    aspectRatio: '1:1',
    description: 'Square charts (1:1)'
  }
];

async function fixImageChartAspectRatios() {
  const client = new MongoClient(MONGODB_URI as string);

  try {
    console.log('🔗 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(MONGODB_DB);
    const chartsCollection = db.collection('chart_configurations');

    // WHAT: Find all image-type charts
    // WHY: Only image charts need aspectRatio field
    const imageCharts = await chartsCollection.find({
      type: 'image'
    }).toArray();

    console.log(`\n📊 Found ${imageCharts.length} image charts\n`);

    if (imageCharts.length === 0) {
      console.log('✅ No image charts to process');
      return;
    }

    let updatedCount = 0;
    let skippedCount = 0;
    let inferredCount = 0;

    for (const chart of imageCharts) {
      const chartTitle = chart.title || chart.chartId || 'Unknown';
      
      // Skip if already has aspectRatio
      if (chart.aspectRatio) {
        console.log(`⏭️  Chart "${chartTitle}" already has aspectRatio: ${chart.aspectRatio}`);
        skippedCount++;
        continue;
      }

      // WHAT: Try to infer aspectRatio from chart name patterns
      // WHY: Charts follow naming conventions (landscape, portrait, square)
      let inferredRatio: '16:9' | '9:16' | '1:1' | null = null;
      let matchedPattern: AspectRatioPattern | null = null;

      for (const { pattern, aspectRatio, description } of aspectRatioPatterns) {
        if (pattern.test(chartTitle) || pattern.test(chart.chartId || '')) {
          inferredRatio = aspectRatio;
          matchedPattern = { pattern, aspectRatio, description };
          break;
        }
      }

      if (!inferredRatio) {
        // WHAT: Default to square (1:1) if pattern not recognized
        // WHY: Safe fallback, most image content works well as square
        inferredRatio = '1:1';
        console.log(`⚠️  Chart "${chartTitle}" - no pattern matched, defaulting to 1:1 (square)`);
      } else {
        console.log(`✅ Chart "${chartTitle}" - inferred ${inferredRatio} (${matchedPattern!.description})`);
        inferredCount++;
      }

      // Update the chart with aspectRatio
      await chartsCollection.updateOne(
        { _id: chart._id },
        {
          $set: {
            aspectRatio: inferredRatio,
            updatedAt: new Date().toISOString()
          }
        }
      );

      updatedCount++;
      console.log(`   ✓ Updated chart "${chartTitle}" with aspectRatio: ${inferredRatio}\n`);
    }

    console.log('\n📊 Summary:');
    console.log(`   Updated: ${updatedCount} charts`);
    console.log(`   Inferred: ${inferredCount} from naming patterns`);
    console.log(`   Skipped: ${skippedCount} (already had aspectRatio)`);
    console.log(`   Defaulted: ${updatedCount - inferredCount} to 1:1 (no pattern match)\n`);
    
    console.log('✅ Migration complete!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 MongoDB connection closed');
  }
}

// Run the migration
fixImageChartAspectRatios();
