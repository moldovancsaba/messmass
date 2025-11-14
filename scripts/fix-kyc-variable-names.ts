// WHAT: Fix KYC variable naming inconsistency
// WHY: Variables registered as "stats.bitlyTotalClicks" but database has "totalBitlyClicks"
// HOW: Remove duplicate "stats.*" prefixed variables, keeping clean names

import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('❌ MONGODB_URI not found');
  process.exit(1);
}

async function fixVariableNames() {
  const client = new MongoClient(uri!);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db('messmass');
    
    console.log('🔍 Finding variables with "stats." prefix in name field...\n');
    
    const badVars = await db.collection('variables_metadata')
      .find({ name: /^stats\./ })
      .toArray();
    
    console.log(`Found ${badVars.length} variables with incorrect "stats." prefix:\n`);
    badVars.forEach(v => {
      console.log(`  ❌ ${v.name} (${v.category})`);
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('\n⚠️  DANGER: About to delete these ${badVars.length} incorrect variables');
    console.log('This will remove them from KYC display until they are re-registered correctly.\n');
    
    const result = await db.collection('variables_metadata').deleteMany({
      name: /^stats\./
    });
    
    console.log(`✅ Deleted ${result.deletedCount} incorrect variable entries\n`);
    
    console.log('='.repeat(80));
    console.log('\n📋 NEXT STEPS:\n');
    console.log('1. The Bitly variables that exist in database will now be visible in KYC');
    console.log('2. Database has: totalBitlyClicks, uniqueBitlyClicks, bitlyCountry1-5');
    console.log('3. These match the data we just populated');
    console.log('4. Missing device/referrer metrics need proper registration + data sync\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

fixVariableNames();
