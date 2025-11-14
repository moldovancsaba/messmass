// WHAT: Sync Bitly data from totalBitlyClicks to bitlyTotalClicks format
// WHY: KYC variables expect bitlyTotalClicks but we populated totalBitlyClicks
// HOW: Copy data to correct field names expected by KYC system

import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('❌ MONGODB_URI not found');
  process.exit(1);
}

async function syncFieldNames() {
  const client = new MongoClient(uri!);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db('messmass');
    const projects = await db.collection('projects').find({
      'stats.totalBitlyClicks': { $exists: true }
    }).toArray();
    
    console.log(`Found ${projects.length} projects with totalBitlyClicks data\n`);
    
    let updated = 0;
    for (const project of projects) {
      const updates: any = {};
      
      // Copy totalBitlyClicks → bitlyTotalClicks
      if (project.stats.totalBitlyClicks !== undefined) {
        updates['stats.bitlyTotalClicks'] = project.stats.totalBitlyClicks;
      }
      
      // Copy uniqueBitlyClicks → bitlyUniqueClicks
      if (project.stats.uniqueBitlyClicks !== undefined) {
        updates['stats.bitlyUniqueClicks'] = project.stats.uniqueBitlyClicks;
      }
      
      if (Object.keys(updates).length > 0) {
        await db.collection('projects').updateOne(
          { _id: project._id },
          { $set: updates }
        );
        updated++;
        
        if (updated % 10 === 0) {
          process.stdout.write(`\r   Updated ${updated}/${projects.length}...`);
        }
      }
    }
    
    console.log(`\n\n✅ Updated ${updated} projects with correct field names\n`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

syncFieldNames();
