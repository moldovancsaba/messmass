const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

async function checkTemplates() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(MONGODB_DB);
    const collection = db.collection('report_templates');
    
    const templates = await collection.find({}).toArray();
    
    console.log(`\n📊 Total templates: ${templates.length}\n`);
    
    for (const template of templates) {
      console.log(`Template: ${template.name}`);
      console.log(`  Type: ${template.type}`);
      console.log(`  Default: ${template.isDefault}`);
      console.log(`  Hero Settings:`, template.heroSettings || 'NOT SET');
      console.log('');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkTemplates().then(() => process.exit(0)).catch((err) => { console.error(err); process.exit(1); });
