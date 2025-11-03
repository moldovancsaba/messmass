import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function fixMissingLabels() {
  const client = new MongoClient(process.env.MONGODB_URI!);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || 'messmass');
  const collection = db.collection('variables_metadata');

  // Find variables without label field
  const varsWithoutLabel = await collection.find({ label: { $exists: false } }).toArray();
  
  console.log(`Found ${varsWithoutLabel.length} variables without label field\n`);
  
  for (const v of varsWithoutLabel) {
    // Use alias as label, or name if no alias
    const label = v.alias || v.name;
    await collection.updateOne(
      { _id: v._id },
      { $set: { label } }
    );
    console.log(`✅ Fixed: ${v.name} → label: "${label}"`);
  }
  
  console.log('\n✅ All variables now have label field');
  await client.close();
}

fixMissingLabels();
