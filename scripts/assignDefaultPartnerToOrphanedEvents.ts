// WHAT: Migration script to assign default partner to orphaned events
// WHY: All events MUST have a partner1Id (organizer/home team) per new requirements
// HOW: Find or create default "📱 SEYU" partner, then update all events missing partner1Id

import { MongoClient, ObjectId } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';
const DEFAULT_PARTNER_NAME = '📱 SEYU';

async function main() {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI not found in environment variables');
  }

  console.log('🔌 Connecting to MongoDB...');
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(MONGODB_DB);
    const partnersCollection = db.collection('partners');
    const projectsCollection = db.collection('projects');

    // WHAT: Find or create default SEYU partner
    // WHY: Orphaned events need a valid partner reference
    console.log(`\n🔍 Looking for default partner "${DEFAULT_PARTNER_NAME}"...`);
    
    let defaultPartner = await partnersCollection.findOne({ name: DEFAULT_PARTNER_NAME });
    
    if (!defaultPartner) {
      console.log(`📱 Creating default partner "${DEFAULT_PARTNER_NAME}"...`);
      
      const now = new Date().toISOString();
      const result = await partnersCollection.insertOne({
        name: DEFAULT_PARTNER_NAME,
        emoji: '📱',
        hashtags: [],
        categorizedHashtags: {},
        createdAt: now,
        updatedAt: now
      });
      
      defaultPartner = await partnersCollection.findOne({ _id: result.insertedId });
      console.log(`✅ Created default partner with ID: ${result.insertedId}`);
    } else {
      console.log(`✅ Found existing default partner with ID: ${defaultPartner._id}`);
    }

    // WHAT: Find all events without partner1Id
    // WHY: These are orphaned events that need assignment
    console.log('\n🔍 Finding orphaned events (missing partner1Id)...');
    
    const orphanedEvents = await projectsCollection.find({
      partner1Id: { $exists: false }
    }).toArray();

    console.log(`📊 Found ${orphanedEvents.length} orphaned events`);

    if (orphanedEvents.length === 0) {
      console.log('✅ No orphaned events found. Migration complete!');
      return;
    }

    // WHAT: Update orphaned events with default partner
    // WHY: Ensure all events have partner1Id as required
    console.log(`\n🔄 Assigning default partner to ${orphanedEvents.length} events...`);
    
    const updateResult = await projectsCollection.updateMany(
      { partner1Id: { $exists: false } },
      {
        $set: {
          partner1Id: new ObjectId(defaultPartner!._id),
          updatedAt: new Date().toISOString()
        }
      }
    );

    console.log(`✅ Updated ${updateResult.modifiedCount} events`);
    console.log('\n📋 Sample updated events:');
    
    // Show first 5 updated events
    const sampleEvents = orphanedEvents.slice(0, 5);
    sampleEvents.forEach((event, index) => {
      console.log(`  ${index + 1}. ${event.eventName} (${event.eventDate})`);
    });

    if (orphanedEvents.length > 5) {
      console.log(`  ... and ${orphanedEvents.length - 5} more`);
    }

    console.log('\n✅ Migration completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   - Default Partner: ${DEFAULT_PARTNER_NAME} (${defaultPartner!._id})`);
    console.log(`   - Events Updated: ${updateResult.modifiedCount}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

main()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
