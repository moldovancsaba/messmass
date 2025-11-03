// scripts/seed-legacy-report-variables.ts
// WHAT: Seed legacy reportImage1-10 and reportText1-10 as Content Assets
// WHY: Enable Content Library management while maintaining backward compatibility
// HOW: Create content asset definitions that map to existing stats fields

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

// WHAT: Legacy variable definitions (20 total)
// WHY: These exist in variables_metadata and variablesGroups
// HOW: Map each to a content asset with linkedVariable reference
const LEGACY_REPORT_VARIABLES = [
  // Report Images (10 total)
  { slug: 'report-image-1', name: 'Report Image 1', type: 'image', linkedVariable: 'reportImage1', category: 'Report Media', description: 'Event-specific report image 1' },
  { slug: 'report-image-2', name: 'Report Image 2', type: 'image', linkedVariable: 'reportImage2', category: 'Report Media', description: 'Event-specific report image 2' },
  { slug: 'report-image-3', name: 'Report Image 3', type: 'image', linkedVariable: 'reportImage3', category: 'Report Media', description: 'Event-specific report image 3' },
  { slug: 'report-image-4', name: 'Report Image 4', type: 'image', linkedVariable: 'reportImage4', category: 'Report Media', description: 'Event-specific report image 4' },
  { slug: 'report-image-5', name: 'Report Image 5', type: 'image', linkedVariable: 'reportImage5', category: 'Report Media', description: 'Event-specific report image 5' },
  { slug: 'report-image-6', name: 'Report Image 6', type: 'image', linkedVariable: 'reportImage6', category: 'Report Media', description: 'Event-specific report image 6' },
  { slug: 'report-image-7', name: 'Report Image 7', type: 'image', linkedVariable: 'reportImage7', category: 'Report Media', description: 'Event-specific report image 7' },
  { slug: 'report-image-8', name: 'Report Image 8', type: 'image', linkedVariable: 'reportImage8', category: 'Report Media', description: 'Event-specific report image 8' },
  { slug: 'report-image-9', name: 'Report Image 9', type: 'image', linkedVariable: 'reportImage9', category: 'Report Media', description: 'Event-specific report image 9' },
  { slug: 'report-image-10', name: 'Report Image 10', type: 'image', linkedVariable: 'reportImage10', category: 'Report Media', description: 'Event-specific report image 10' },
  
  // Report Texts (10 total)
  { slug: 'report-text-1', name: 'Report Text 1', type: 'text', linkedVariable: 'reportText1', category: 'Report Content', description: 'Event-specific report text 1' },
  { slug: 'report-text-2', name: 'Report Text 2', type: 'text', linkedVariable: 'reportText2', category: 'Report Content', description: 'Event-specific report text 2' },
  { slug: 'report-text-3', name: 'Report Text 3', type: 'text', linkedVariable: 'reportText3', category: 'Report Content', description: 'Event-specific report text 3' },
  { slug: 'report-text-4', name: 'Report Text 4', type: 'text', linkedVariable: 'reportText4', category: 'Report Content', description: 'Event-specific report text 4' },
  { slug: 'report-text-5', name: 'Report Text 5', type: 'text', linkedVariable: 'reportText5', category: 'Report Content', description: 'Event-specific report text 5' },
  { slug: 'report-text-6', name: 'Report Text 6', type: 'text', linkedVariable: 'reportText6', category: 'Report Content', description: 'Event-specific report text 6' },
  { slug: 'report-text-7', name: 'Report Text 7', type: 'text', linkedVariable: 'reportText7', category: 'Report Content', description: 'Event-specific report text 7' },
  { slug: 'report-text-8', name: 'Report Text 8', type: 'text', linkedVariable: 'reportText8', category: 'Report Content', description: 'Event-specific report text 8' },
  { slug: 'report-text-9', name: 'Report Text 9', type: 'text', linkedVariable: 'reportText9', category: 'Report Content', description: 'Event-specific report text 9' },
  { slug: 'report-text-10', name: 'Report Text 10', type: 'text', linkedVariable: 'reportText10', category: 'Report Content', description: 'Event-specific report text 10' },
];

async function seedLegacyReportVariables() {
  const client = new MongoClient(MONGODB_URI as string);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(MONGODB_DB);
    const collection = db.collection('content_assets');
    
    console.log('\n📊 Seeding legacy report variables to Content Library...\n');
    
    let created = 0;
    let skipped = 0;
    
    for (const variable of LEGACY_REPORT_VARIABLES) {
      // WHAT: Check if asset already exists
      // WHY: Prevent duplicates on re-runs
      const existing = await collection.findOne({ slug: variable.slug });
      
      if (existing) {
        console.log(`⏭️  Skipped: ${variable.name} (slug: ${variable.slug}) - already exists`);
        skipped++;
        continue;
      }
      
      // WHAT: Create content asset document
      // WHY: Maps to existing stats field via linkedVariable
      // NOTE: No actual content - this is a field DEFINITION, not storage
      const asset = {
        slug: variable.slug,
        title: variable.name,
        type: variable.type,
        category: variable.category,
        description: variable.description,
        tags: ['legacy', 'report', 'event-specific'],
        linkedVariable: variable.linkedVariable, // KEY: Maps to stats.reportImage1, etc.
        content: variable.type === 'image' 
          ? { url: '', width: null, height: null, aspectRatio: '16:9' }
          : { text: '' },
        usageCount: 0,
        isLegacy: true, // WHAT: Flag to identify legacy variables
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await collection.insertOne(asset);
      console.log(`✅ Created: ${variable.name} (slug: ${variable.slug}) → stats.${variable.linkedVariable}`);
      created++;
    }
    
    console.log(`\n📊 Seeding Summary:`);
    console.log(`   ✅ Created: ${created} content assets`);
    console.log(`   ⏭️  Skipped: ${skipped} existing assets`);
    console.log(`   📌 Total: ${LEGACY_REPORT_VARIABLES.length} legacy variables`);
    
    // WHAT: Verify seeding
    const totalAssets = await collection.countDocuments({ isLegacy: true });
    console.log(`\n✅ Verification: ${totalAssets} legacy assets in database`);
    
    console.log('\n🎉 Legacy report variables seeded successfully!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Visit http://localhost:3001/admin/content-library');
    console.log('   2. You should see 20 legacy report variables');
    console.log('   3. These map to existing stats.reportImage1-10 and stats.reportText1-10');
    console.log('   4. Charts using [stats.reportImage1] will continue to work');
    console.log('   5. New charts can use [MEDIA:report-image-1] (reads from stats.reportImage1)');
    
  } catch (error) {
    console.error('❌ Error seeding legacy variables:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n👋 MongoDB connection closed');
  }
}

// Run seeding
seedLegacyReportVariables();
