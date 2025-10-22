/* WHAT: Seed script to create default page styles in database
 * WHY: Provide ready-to-use themes for administrators
 * HOW: Insert professional theme configurations into page_styles_enhanced collection
 * USAGE: npm run seed:page-styles (add to package.json scripts) */

import clientPromise from '../lib/mongodb';
import { PageStyleEnhanced } from '../lib/pageStyleTypesEnhanced';

const defaultStyles: Omit<PageStyleEnhanced, '_id' | 'createdAt' | 'updatedAt' | 'projectIds'>[] = [
  {
    name: 'Clean Light',
    description: 'Professional light theme with subtle gradients',
    isGlobalDefault: true,
    pageBackground: {
      type: 'gradient',
      gradientAngle: 180,
      gradientStops: [
        { color: '#ffffff', position: 0 },
        { color: '#f9fafb', position: 100 }
      ]
    },
    heroBackground: {
      type: 'gradient',
      gradientAngle: 135,
      gradientStops: [
        { color: '#3b82f6', position: 0 },
        { color: '#2563eb', position: 100 }
      ]
    },
    contentBoxBackground: {
      type: 'solid',
      solidColor: '#ffffff',
      opacity: 0.95
    },
    typography: {
      fontFamily: 'inter',
      primaryTextColor: '#1f2937',
      secondaryTextColor: '#6b7280',
      headingColor: '#111827'
    },
    colorScheme: {
      primary: '#3b82f6',
      secondary: '#10b981',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444'
    },
    createdBy: 'system'
  },
  {
    name: 'Dark Mode',
    description: 'Modern dark theme with vibrant accents',
    isGlobalDefault: false,
    pageBackground: {
      type: 'solid',
      solidColor: '#111827'
    },
    heroBackground: {
      type: 'gradient',
      gradientAngle: 135,
      gradientStops: [
        { color: '#1f2937', position: 0 },
        { color: '#374151', position: 100 }
      ]
    },
    contentBoxBackground: {
      type: 'solid',
      solidColor: '#1f2937',
      opacity: 0.9
    },
    typography: {
      fontFamily: 'inter',
      primaryTextColor: '#f9fafb',
      secondaryTextColor: '#d1d5db',
      headingColor: '#ffffff'
    },
    colorScheme: {
      primary: '#60a5fa',
      secondary: '#34d399',
      success: '#34d399',
      warning: '#fbbf24',
      error: '#f87171'
    },
    createdBy: 'system'
  },
  {
    name: 'Sports Blue',
    description: 'Bold blue theme perfect for sports events',
    isGlobalDefault: false,
    pageBackground: {
      type: 'gradient',
      gradientAngle: 180,
      gradientStops: [
        { color: '#eff6ff', position: 0 },
        { color: '#dbeafe', position: 100 }
      ]
    },
    heroBackground: {
      type: 'gradient',
      gradientAngle: 135,
      gradientStops: [
        { color: '#1e40af', position: 0 },
        { color: '#3b82f6', position: 100 }
      ]
    },
    contentBoxBackground: {
      type: 'solid',
      solidColor: '#ffffff',
      opacity: 0.95
    },
    typography: {
      fontFamily: 'roboto',
      primaryTextColor: '#1e3a8a',
      secondaryTextColor: '#3b82f6',
      headingColor: '#1e40af'
    },
    colorScheme: {
      primary: '#3b82f6',
      secondary: '#f59e0b',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444'
    },
    createdBy: 'system'
  },
  {
    name: 'Vibrant Gradient',
    description: 'Eye-catching gradient theme with bold colors',
    isGlobalDefault: false,
    pageBackground: {
      type: 'gradient',
      gradientAngle: 135,
      gradientStops: [
        { color: '#fdf2f8', position: 0 },
        { color: '#fce7f3', position: 50 },
        { color: '#fbcfe8', position: 100 }
      ]
    },
    heroBackground: {
      type: 'gradient',
      gradientAngle: 135,
      gradientStops: [
        { color: '#ec4899', position: 0 },
        { color: '#8b5cf6', position: 100 }
      ]
    },
    contentBoxBackground: {
      type: 'solid',
      solidColor: '#ffffff',
      opacity: 0.9
    },
    typography: {
      fontFamily: 'poppins',
      primaryTextColor: '#831843',
      secondaryTextColor: '#9f1239',
      headingColor: '#701a75'
    },
    colorScheme: {
      primary: '#ec4899',
      secondary: '#8b5cf6',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444'
    },
    createdBy: 'system'
  },
  {
    name: 'Minimal Gray',
    description: 'Clean, minimal design with grayscale palette',
    isGlobalDefault: false,
    pageBackground: {
      type: 'solid',
      solidColor: '#fafafa'
    },
    heroBackground: {
      type: 'solid',
      solidColor: '#e5e5e5'
    },
    contentBoxBackground: {
      type: 'solid',
      solidColor: '#ffffff',
      opacity: 1
    },
    typography: {
      fontFamily: 'inter',
      primaryTextColor: '#404040',
      secondaryTextColor: '#737373',
      headingColor: '#262626'
    },
    colorScheme: {
      primary: '#525252',
      secondary: '#737373',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444'
    },
    createdBy: 'system'
  }
];

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
