/* WHAT: Seed script to create default page styles in database
 * WHY: Provide ready-to-use themes for administrators
 * HOW: Insert professional theme configurations into page_styles_enhanced collection
 * USAGE: npm run seed:page-styles (add to package.json scripts) */

import clientPromise from '../lib/mongodb';
import { SEED_PAGE_STYLE_PRESETS } from '../lib/theme/pageStylePresets';

const defaultStyles = SEED_PAGE_STYLE_PRESETS;

async function seedPageStyles() {
  console.log('🌱 Starting page styles seeding...');

  try {
    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection('page_styles_enhanced');

    // Check if styles already exist
    const existingCount = await collection.countDocuments();
    
    if (existingCount > 0) {
      console.log(`⚠️  Found ${existingCount} existing styles. Skipping seed.`);
      console.log('   To re-seed, delete existing styles first or run with --force flag.');
      return;
    }

    // Insert default styles
    const now = new Date();
    const stylesToInsert = defaultStyles.map(style => ({
      ...style,
      createdAt: now,
      updatedAt: now,
      projectIds: []
    }));

    const result = await collection.insertMany(stylesToInsert);
    
    console.log(`✅ Successfully seeded ${result.insertedCount} page styles:`);
    defaultStyles.forEach((style, index) => {
      const badge = style.isGlobalDefault ? '🌐 [GLOBAL]' : '  ';
      console.log(`   ${badge} ${index + 1}. ${style.name} - ${style.description}`);
    });

    console.log('\n📝 Next steps:');
    console.log('   1. Visit /admin/design → Page Styles tab');
    console.log('   2. Edit styles or create custom ones');
    console.log('   3. Assign styles to projects');
    console.log('   4. View styled pages at /stats/[slug]');

  } catch (error) {
    console.error('❌ Failed to seed page styles:', error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  seedPageStyles()
    .then(() => {
      console.log('\n✅ Seeding complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Seeding failed:', error);
      process.exit(1);
    });
}

export default seedPageStyles;
