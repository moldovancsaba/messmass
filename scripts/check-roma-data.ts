import { MongoClient, ObjectId } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('❌ MONGODB_URI not found');
  process.exit(1);
}

async function main() {
  const client = new MongoClient(uri!);
  
  try {
    await client.connect();
    const db = client.db('messmass');
    
    const partnerId = new ObjectId('68f6268feaea906244f28923');
    const partner = await db.collection('partners').findOne({ _id: partnerId });
    
    console.log('\n📊 Partner:', partner?.name);
    
    // Get all events for this partner
    const events = await db.collection('projects').find({
      $or: [
        { partnerId },
        { partner1Id: partnerId },
        { partner2Id: partnerId }
      ]
    }).toArray();
    
    console.log(`📅 Events: ${events.length}\n`);
    
    // Show first event's data
    if (events.length > 0) {
      const event = events[0];
      console.log('Sample Event:', event.eventName);
      console.log('\n🔢 Bitly Metrics:');
      console.log('   Total Clicks:', event.stats?.bitlyTotalClicks || 0);
      console.log('   Unique Clicks:', event.stats?.bitlyUniqueClicks || 0);
      console.log('\n🌍 Countries:');
      console.log('   US:', event.stats?.bitlyClicksByCountryUS || 0);
      console.log('   GB:', event.stats?.bitlyClicksByCountryGB || 0);
      console.log('   IT:', event.stats?.bitlyClicksByCountryIT || 0);
      console.log('\n📱 Referrers:');
      console.log('   Facebook:', event.stats?.bitlyClicksFromFacebook || 0);
      console.log('   Instagram:', event.stats?.bitlyClicksFromInstagram || 0);
      console.log('   Direct:', event.stats?.bitlyClicksFromDirect || 0);
      console.log('   QR Code:', event.stats?.bitlyClicksFromQRCode || 0);
      console.log('\n🔗 Domain-level:');
      console.log('   Instagram App:', event.stats?.bitlyClicksFromInstagramApp || 0);
      console.log('   Facebook Mobile:', event.stats?.bitlyClicksFromFacebookMobile || 0);
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();
