// scripts/seed-additional-report-variables.ts
// WHAT: Seed reportImage11-20 and reportText11-20 as Content Assets
// WHY: Expand available report content slots from 10 to 20 each
// HOW: Create content asset definitions that map to stats fields

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

// WHAT: Additional report variable definitions (20 total)
// WHY: Expand from reportImage1-10 to reportImage1-20 (and same for texts)
// HOW: Map each to a content asset with linkedVariable reference
const ADDITIONAL_REPORT_VARIABLES = [
  // Report Images 11-20 (10 total)
  { slug: 'report-image-11', name: 'Report Image 11', type: 'image', linkedVariable: 'reportImage11', category: 'Report Media', description: 'Event-specific report image 11' },
  { slug: 'report-image-12', name: 'Report Image 12', type: 'image', linkedVariable: 'reportImage12', category: 'Report Media', description: 'Event-specific report image 12' },
  { slug: 'report-image-13', name: 'Report Image 13', type: 'image', linkedVariable: 'reportImage13', category: 'Report Media', description: 'Event-specific report image 13' },
  { slug: 'report-image-14', name: 'Report Image 14', type: 'image', linkedVariable: 'reportImage14', category: 'Report Media', description: 'Event-specific report image 14' },
  { slug: 'report-image-15', name: 'Report Image 15', type: 'image', linkedVariable: 'reportImage15', category: 'Report Media', description: 'Event-specific report image 15' },
  { slug: 'report-image-16', name: 'Report Image 16', type: 'image', linkedVariable: 'reportImage16', category: 'Report Media', description: 'Event-specific report image 16' },
  { slug: 'report-image-17', name: 'Report Image 17', type: 'image', linkedVariable: 'reportImage17', category: 'Report Media', description: 'Event-specific report image 17' },
  { slug: 'report-image-18', name: 'Report Image 18', type: 'image', linkedVariable: 'reportImage18', category: 'Report Media', description: 'Event-specific report image 18' },
  { slug: 'report-image-19', name: 'Report Image 19', type: 'image', linkedVariable: 'reportImage19', category: 'Report Media', description: 'Event-specific report image 19' },
  { slug: 'report-image-20', name: 'Report Image 20', type: 'image', linkedVariable: 'reportImage20', category: 'Report Media', description: 'Event-specific report image 20' },
  
  // Report Texts 11-20 (10 total)
  { slug: 'report-text-11', name: 'Report Text 11', type: 'text', linkedVariable: 'reportText11', category: 'Report Content', description: 'Event-specific report text 11' },
  { slug: 'report-text-12', name: 'Report Text 12', type: 'text', linkedVariable: 'reportText12', category: 'Report Content', description: 'Event-specific report text 12' },
  { slug: 'report-text-13', name: 'Report Text 13', type: 'text', linkedVariable: 'reportText13', category: 'Report Content', description: 'Event-specific report text 13' },
  { slug: 'report-text-14', name: 'Report Text 14', type: 'text', linkedVariable: 'reportText14', category: 'Report Content', description: 'Event-specific report text 14' },
  { slug: 'report-text-15', name: 'Report Text 15', type: 'text', linkedVariable: 'reportText15', category: 'Report Content', description: 'Event-specific report text 15' },
  { slug: 'report-text-16', name: 'Report Text 16', type: 'text', linkedVariable: 'reportText16', category: 'Report Content', description: 'Event-specific report text 16' },
  { slug: 'report-text-17', name: 'Report Text 17', type: 'text', linkedVariable: 'reportText17', category: 'Report Content', description: 'Event-specific report text 17' },
  { slug: 'report-text-18', name: 'Report Text 18', type: 'text', linkedVariable: 'reportText18', category: 'Report Content', description: 'Event-specific report text 18' },
  { slug: 'report-text-19', name: 'Report Text 19', type: 'text', linkedVariable: 'reportText19', category: 'Report Content', description: 'Event-specific report text 19' },
  { slug: 'report-text-20', name: 'Report Text 20', type: 'text', linkedVariable: 'reportText20', category: 'Report Content', description: 'Event-specific report text 20' },
];

async function seedAdditionalReportVariables() {
  const client = new MongoClient(MONGODB_URI as string);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(MONGODB_DB);
    const collection = db.collection('content_assets');
    
    console.log('\n📊 Seeding additional report variables (11-20) to Content Library...\n');
    
    let created = 0;
    let skipped = 0;
    
    for (const variable of ADDITIONAL_REPORT_VARIABLES) {
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
        linkedVariable: variable.linkedVariable, // KEY: Maps to stats.reportImage11, etc.
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
    console.log(`   📌 Total: ${ADDITIONAL_REPORT_VARIABLES.length} additional variables`);
    
    // WHAT: Verify seeding
    const totalAssets = await collection.countDocuments({ isLegacy: true });
    console.log(`\n✅ Verification: ${totalAssets} total legacy assets in database`);
    
    console.log('\n🎉 Additional report variables seeded successfully!');
    console.log('\n📋 Usage:');
    console.log('   • Charts: Use formulas like stats.reportImage11, stats.reportImage20');
    console.log('   • Auto-generation: Upload images in Clicker → chart blocks created automatically');
    console.log('   • Visualization: New Report Image 11-20 blocks appear in template editor');
    console.log('   • System supports up to reportImage500 and reportText500');
    
  } catch (error) {
    console.error('❌ Error seeding additional variables:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n👋 MongoDB connection closed');
  }
}

// Run seeding
seedAdditionalReportVariables();
