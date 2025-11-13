// WHAT: Register all MongoDB fields that exist but are not in KYC system
// WHY: Make all data visible to algorithms, reports, and data tables
// HOW: Scan projects.stats, generate professional metadata, insert into variables_metadata

import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('❌ MONGODB_URI not found in environment');
  process.exit(1);
}

interface VariableMetadata {
  name: string;
  alias: string;
  type: 'number' | 'text' | 'textarea' | 'textmedia' | 'texthyper';
  category: string;
  visibleInClicker: boolean;
  editableInManual: boolean;
  isSystemVariable: boolean;
  derived?: boolean;
  clickerOrder?: number;
  createdAt: string;
  updatedAt: string;
}

// WHAT: Auto-generate professional alias from variable name
// WHY: Convert camelCase to human-readable display text
function generateAlias(name: string): string {
  // Special cases
  const specialCases: Record<string, string> = {
    'remoteImages': 'Remote Images',
    'hostessImages': 'Hostess Images',
    'selfies': 'Selfies',
    'totalImages': 'Total Images',
    'allImages': 'All Images', // Deprecated but still generate alias
    'remoteFans': 'Remote Fans',
    'stadium': 'Stadium Fans',
    'totalFans': 'Total Fans',
    'female': 'Female',
    'male': 'Male',
    'genAlpha': 'Generation Alpha',
    'genYZ': 'Generation Y/Z',
    'genX': 'Generation X',
    'boomer': 'Baby Boomers',
    'merched': 'Merchandised Fans',
    'jersey': 'Jerseys',
    'scarf': 'Scarves',
    'flags': 'Flags',
    'baseballCap': 'Baseball Caps',
    'other': 'Other Merchandise',
    'indoor': 'Indoor Fans',
    'outdoor': 'Outdoor Fans',
    'eventAttendees': 'Event Attendees',
    'eventResultHome': 'Home Team Score',
    'eventResultVisitor': 'Visitor Team Score',
    'eventTicketPurchases': 'Ticket Purchases',
  };
  
  if (specialCases[name]) {
    return specialCases[name];
  }
  
  // Handle Bitly country codes
  if (name.startsWith('bitlyClicksFrom') && name.length > 15) {
    const suffix = name.substring(15);
    // Check if it's a 2-letter country code (uppercase)
    if (suffix.length === 2 && suffix === suffix.toUpperCase()) {
      return `Bitly Clicks from ${suffix}`;
    }
    // Otherwise it's a source name
    return `Bitly Clicks from ${suffix}`;
  }
  
  // Handle report content
  if (name.match(/^reportImage\d+$/)) {
    const num = name.replace('reportImage', '');
    return `Report Image ${num}`;
  }
  if (name.match(/^reportText\d+$/)) {
    const num = name.replace('reportText', '');
    return `Report Text ${num}`;
  }
  
  // Handle visit tracking
  if (name.startsWith('visit')) {
    const platform = name.replace('visit', '');
    return `Visit from ${platform}`;
  }
  
  // Generic camelCase to Title Case
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

// WHAT: Determine variable type based on name pattern
function inferType(name: string): 'number' | 'text' | 'textarea' | 'textmedia' | 'texthyper' {
  // Images are textmedia (URLs)
  if (name.match(/^reportImage\d+$/)) {
    return 'textmedia';
  }
  
  // Text content is textarea
  if (name.match(/^reportText\d+$/)) {
    return 'textarea';
  }
  
  // URLs are texthyper
  if (name.toLowerCase().includes('url') || name.toLowerCase().includes('link')) {
    return 'texthyper';
  }
  
  // Everything else is number (counts, clicks, etc.)
  return 'number';
}

// WHAT: Determine category based on name pattern
function inferCategory(name: string): string {
  if (name.startsWith('bitly')) return 'bitly';
  if (name.startsWith('event')) return 'event';
  if (name.startsWith('report')) return 'reportContent';
  if (name.startsWith('visit')) return 'visits';
  
  if (['remoteImages', 'hostessImages', 'selfies', 'totalImages', 'allImages', 'approvedImages', 'rejectedImages'].includes(name)) {
    return 'images';
  }
  
  if (['remoteFans', 'stadium', 'totalFans'].includes(name)) {
    return 'fans';
  }
  
  if (['female', 'male', 'genAlpha', 'genYZ', 'genX', 'boomer'].includes(name)) {
    return 'demographics';
  }
  
  if (['merched', 'jersey', 'scarf', 'flags', 'baseballCap', 'other'].includes(name)) {
    return 'merchandise';
  }
  
  if (['indoor', 'outdoor'].includes(name)) {
    return 'location';
  }
  
  return 'other';
}

// WHAT: Determine visibility flags based on category
function inferVisibility(name: string, category: string): { visibleInClicker: boolean; editableInManual: boolean } {
  // Report content: not in clicker, editable in manual
  if (category === 'reportContent') {
    return { visibleInClicker: false, editableInManual: true };
  }
  
  // Bitly data: not in clicker (API-sourced), not manually editable
  if (category === 'bitly') {
    return { visibleInClicker: false, editableInManual: false };
  }
  
  // Event data: not in clicker (API-sourced or admin-set), editable in manual
  if (category === 'event') {
    return { visibleInClicker: false, editableInManual: true };
  }
  
  // Visit tracking: not in clicker, not manually editable
  if (category === 'visits') {
    return { visibleInClicker: false, editableInManual: false };
  }
  
  // Clicker data (images, fans, demographics, merchandise): visible in clicker, editable in manual
  if (['images', 'fans', 'demographics', 'merchandise', 'location'].includes(category)) {
    return { visibleInClicker: true, editableInManual: true };
  }
  
  // Default: not in clicker, editable in manual
  return { visibleInClicker: false, editableInManual: true };
}

async function registerMissingVariables(options: { dryRun?: boolean } = {}) {
  const client = new MongoClient(uri!);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db('messmass');
    const projects = db.collection('projects');
    const variablesMetadata = db.collection('variables_metadata');
    
    console.log('🔍 Scanning for missing variables...\n');
    console.log('📋 Mode:', options.dryRun ? 'DRY RUN (no changes)' : 'LIVE REGISTRATION');
    console.log('');
    
    // Step 1: Get all MongoDB fields
    const allProjects = await projects.find({}).toArray();
    const mongoFields = new Set<string>();
    
    allProjects.forEach(project => {
      if (project.stats) {
        Object.keys(project.stats).forEach(key => mongoFields.add(key));
      }
    });
    
    console.log(`📊 Found ${mongoFields.size} unique fields in MongoDB\n`);
    
    // Step 2: Get existing KYC variables
    const existingVars = await variablesMetadata.find({}).toArray();
    const existingNames = new Set(existingVars.map(v => v.name));
    
    console.log(`📊 Found ${existingNames.size} variables already in KYC\n`);
    
    // Step 3: Find missing variables
    const missingFields = Array.from(mongoFields).filter(field => !existingNames.has(field));
    
    console.log(`❌ Missing from KYC: ${missingFields.length} variables\n`);
    console.log('='.repeat(80));
    
    if (missingFields.length === 0) {
      console.log('✅ All MongoDB fields are registered in KYC!');
      return;
    }
    
    // Step 4: Generate metadata for missing variables
    const now = new Date().toISOString();
    const variablesToRegister: VariableMetadata[] = [];
    
    missingFields.sort().forEach(name => {
      const alias = generateAlias(name);
      const type = inferType(name);
      const category = inferCategory(name);
      const { visibleInClicker, editableInManual } = inferVisibility(name, category);
      
      variablesToRegister.push({
        name,
        alias,
        type,
        category,
        visibleInClicker,
        editableInManual,
        isSystemVariable: false, // These are discovered fields, not pre-seeded system vars
        createdAt: now,
        updatedAt: now,
      });
    });
    
    // Step 5: Display variables to be registered
    console.log('\n📋 Variables to Register:\n');
    
    // Group by category for display
    const byCategory = new Map<string, VariableMetadata[]>();
    variablesToRegister.forEach(v => {
      if (!byCategory.has(v.category)) {
        byCategory.set(v.category, []);
      }
      byCategory.get(v.category)!.push(v);
    });
    
    byCategory.forEach((vars, category) => {
      console.log(`\n📂 ${category.toUpperCase()} (${vars.length} variables):\n`);
      vars.slice(0, 10).forEach(v => {
        console.log(`   ${v.name} → "${v.alias}"`);
        console.log(`      Type: ${v.type} | Clicker: ${v.visibleInClicker} | Manual: ${v.editableInManual}`);
      });
      if (vars.length > 10) {
        console.log(`   ... and ${vars.length - 10} more`);
      }
    });
    
    console.log('\n' + '='.repeat(80));
    
    // Step 6: Register variables (or show dry run)
    if (options.dryRun) {
      console.log('\n⚠️  DRY RUN: No changes made to database');
      console.log(`   Would register ${variablesToRegister.length} variables`);
      console.log('   Run with --apply flag to execute');
    } else {
      console.log(`\n🔄 Registering ${variablesToRegister.length} variables...`);
      
      const result = await variablesMetadata.insertMany(variablesToRegister);
      
      console.log(`✅ Successfully registered ${result.insertedCount} variables!`);
      
      // Verify
      const newCount = await variablesMetadata.countDocuments();
      console.log(`📊 Total KYC variables: ${existingNames.size} → ${newCount}`);
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('\n📋 NEXT STEPS\n');
    console.log('='.repeat(80));
    console.log('\n1. Review registered variables in Admin KYC page');
    console.log('2. Adjust aliases/categories if needed');
    console.log('3. Run naming standardization script for deprecated patterns');
    console.log('4. Build data tables to view all KYC data');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n✅ Database connection closed\n');
  }
}

// Parse CLI arguments
const args = process.argv.slice(2);
const options = {
  dryRun: !args.includes('--apply'),
};

registerMissingVariables(options);
