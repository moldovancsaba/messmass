// WHAT: Fix SIHF style typography.headingColor to red (#fe0100)
// WHY: Report hero title and all h1-h6 headings should be red, not purple
// HOW: Update MongoDB document with correct heading color

require('dotenv').config({ path: '.env.local' });
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

// SIHF Style ID
const SIHF_STYLE_ID = '693fe86456d7006458901c25';

async function fixSIHFHeadingColor() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(MONGODB_DB);
    const collection = db.collection('page_styles_enhanced');
    
    // Fetch current style
    const currentStyle = await collection.findOne(
      { _id: ObjectId.createFromHexString(SIHF_STYLE_ID) },
      { projection: { name: 1, 'typography.headingColor': 1 } }
    );
    
    console.log('📄 Current SIHF Style:', currentStyle);
    
    // Update typography.headingColor to red
    const result = await collection.updateOne(
      { _id: ObjectId.createFromHexString(SIHF_STYLE_ID) },
      { 
        $set: { 
          'typography.headingColor': '#fe0100',
          updatedAt: new Date().toISOString()
        } 
      }
    );
    
    console.log('✅ Update result:', result);
    
    // Verify update
    const updatedStyle = await collection.findOne(
      { _id: ObjectId.createFromHexString(SIHF_STYLE_ID) },
      { projection: { name: 1, 'typography.headingColor': 1 } }
    );
    
    console.log('🎨 Updated SIHF Style:', updatedStyle);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('👋 Disconnected from MongoDB');
  }
}

fixSIHFHeadingColor();
