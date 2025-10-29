import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function checkPartnersWithBitly() {
  const client = new MongoClient(process.env.MONGODB_URI || '');
  
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'messmass');
    
    console.log('🔍 Checking partners with Bitly links...\n');
    
    const partners = await db.collection('partners').find({
      bitlyLinkIds: { $exists: true, $ne: [] }
    }).toArray();
    
    console.log(`Found ${partners.length} partners with Bitly links:\n`);
    
    for (const partner of partners) {
      const linkCount = partner.bitlyLinkIds?.length || 0;
      console.log(`📋 ${partner.name}`);
      console.log(`   Links: ${linkCount}`);
      console.log(`   _id: ${partner._id}\n`);
    }
    
    if (partners.length === 0) {
      console.log('⚠️ No partners have Bitly links associated');
      console.log('   Import Bitly links and assign them to partners first');
    }
    
  } finally {
    await client.close();
  }
}

checkPartnersWithBitly();
