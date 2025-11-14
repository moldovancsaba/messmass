// WHAT: Fix Bitly variables to match Growth tier ($29/month) capabilities
// WHY: Remove Premium-only (devices) and ensure Growth-available (referrers) are present
// HOW: Delete device variables, add/update referrer variables

import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('❌ MONGODB_URI not found');
  process.exit(1);
}

// WHAT: Variables that require Premium ($199/month) - REMOVE THESE
const PREMIUM_ONLY_VARIABLES = [
  'bitlyMobileClicks',
  'bitlyDesktopClicks',
  'bitlyTabletClicks',
  'bitlyCityData', // City-level tracking
];

// WHAT: Variables available on Growth tier ($29/month) - ENSURE THESE EXIST
const GROWTH_TIER_VARIABLES = [
  {
    name: 'bitlyTotalClicks',
    alias: 'Bitly Total Clicks',
    type: 'number' as const,
    category: 'bitly',
    visibleInClicker: false,
    editableInManual: false,
    isSystemVariable: true,
  },
  {
    name: 'bitlyUniqueClicks',
    alias: 'Bitly Unique Clicks',
    type: 'number' as const,
    category: 'bitly',
    visibleInClicker: false,
    editableInManual: false,
    isSystemVariable: true,
  },
  // Top 5 countries
  {
    name: 'bitlyClicksByCountryUS',
    alias: 'Bitly Clicks (US)',
    type: 'number' as const,
    category: 'bitly',
    visibleInClicker: false,
    editableInManual: false,
    isSystemVariable: true,
  },
  {
    name: 'bitlyClicksByCountryGB',
    alias: 'Bitly Clicks (GB)',
    type: 'number' as const,
    category: 'bitly',
    visibleInClicker: false,
    editableInManual: false,
    isSystemVariable: true,
  },
  {
    name: 'bitlyClicksByCountryCA',
    alias: 'Bitly Clicks (CA)',
    type: 'number' as const,
    category: 'bitly',
    visibleInClicker: false,
    editableInManual: false,
    isSystemVariable: true,
  },
  {
    name: 'bitlyClicksByCountryIT',
    alias: 'Bitly Clicks (IT)',
    type: 'number' as const,
    category: 'bitly',
    visibleInClicker: false,
    editableInManual: false,
    isSystemVariable: true,
  },
  {
    name: 'bitlyClicksByCountryDE',
    alias: 'Bitly Clicks (DE)',
    type: 'number' as const,
    category: 'bitly',
    visibleInClicker: false,
    editableInManual: false,
    isSystemVariable: true,
  },
  // Platform-level referrers (Growth tier available)
  {
    name: 'bitlyClicksFromFacebook',
    alias: 'Bitly Clicks from Facebook',
    type: 'number' as const,
    category: 'bitly',
    visibleInClicker: false,
    editableInManual: false,
    isSystemVariable: true,
  },
  {
    name: 'bitlyClicksFromInstagram',
    alias: 'Bitly Clicks from Instagram',
    type: 'number' as const,
    category: 'bitly',
    visibleInClicker: false,
    editableInManual: false,
    isSystemVariable: true,
  },
  {
    name: 'bitlyClicksFromTwitter',
    alias: 'Bitly Clicks from Twitter',
    type: 'number' as const,
    category: 'bitly',
    visibleInClicker: false,
    editableInManual: false,
    isSystemVariable: true,
  },
  {
    name: 'bitlyClicksFromLinkedIn',
    alias: 'Bitly Clicks from LinkedIn',
    type: 'number' as const,
    category: 'bitly',
    visibleInClicker: false,
    editableInManual: false,
    isSystemVariable: true,
  },
  {
    name: 'bitlyClicksFromDirect',
    alias: 'Bitly Clicks (Direct)',
    type: 'number' as const,
    category: 'bitly',
    visibleInClicker: false,
    editableInManual: false,
    isSystemVariable: true,
  },
  {
    name: 'bitlyClicksFromQRCode',
    alias: 'Bitly Clicks from QR Code',
    type: 'number' as const,
    category: 'bitly',
    visibleInClicker: false,
    editableInManual: false,
    isSystemVariable: true,
  },
  {
    name: 'bitlyClicksFromGoogle',
    alias: 'Bitly Clicks from Google',
    type: 'number' as const,
    category: 'bitly',
    visibleInClicker: false,
    editableInManual: false,
    isSystemVariable: true,
  },
  // Domain-level referrers (more granular)
  {
    name: 'bitlyClicksFromInstagramApp',
    alias: 'Bitly Clicks from Instagram App (l.instagram.com)',
    type: 'number' as const,
    category: 'bitly',
    visibleInClicker: false,
    editableInManual: false,
    isSystemVariable: true,
  },
  {
    name: 'bitlyClicksFromFacebookMobile',
    alias: 'Bitly Clicks from Facebook Mobile (m.facebook.com)',
    type: 'number' as const,
    category: 'bitly',
    visibleInClicker: false,
    editableInManual: false,
    isSystemVariable: true,
  },
];

async function main() {
  const client = new MongoClient(uri!);
  
  try {
    await client.connect();
    const db = client.db('messmass');
    
    console.log('\n🔧 Fixing Bitly Variables for Growth Tier\n');
    console.log('━'.repeat(60) + '\n');
    
    // Step 1: Remove Premium-only variables
    console.log('📛 STEP 1: Removing Premium-only variables\n');
    
    for (const varName of PREMIUM_ONLY_VARIABLES) {
      const result = await db.collection('variables_metadata').deleteMany({
        name: varName
      });
      
      if (result.deletedCount > 0) {
        console.log(`   ✅ Deleted ${result.deletedCount}x "${varName}"`);
      } else {
        console.log(`   ⏭️  "${varName}" not found (already clean)`);
      }
    }
    
    console.log('\n━'.repeat(60) + '\n');
    
    // Step 2: Ensure Growth-tier variables exist
    console.log('✅ STEP 2: Ensuring Growth-tier variables exist\n');
    
    const now = new Date();
    let added = 0;
    let existing = 0;
    
    for (const variable of GROWTH_TIER_VARIABLES) {
      const exists = await db.collection('variables_metadata').findOne({
        name: variable.name
      });
      
      if (exists) {
        console.log(`   ⏭️  "${variable.name}" already exists`);
        existing++;
      } else {
        await db.collection('variables_metadata').insertOne({
          ...variable,
          createdAt: now,
          updatedAt: now,
        });
        console.log(`   ✅ Added "${variable.name}"`);
        added++;
      }
    }
    
    console.log('\n━'.repeat(60) + '\n');
    console.log('📊 SUMMARY\n');
    console.log(`   Premium variables removed: ${PREMIUM_ONLY_VARIABLES.length}`);
    console.log(`   Growth variables added: ${added}`);
    console.log(`   Growth variables existing: ${existing}`);
    console.log(`   Total Growth variables: ${GROWTH_TIER_VARIABLES.length}\n`);
    
    console.log('✅ Bitly variables now match Growth tier ($29/month) capabilities\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();
