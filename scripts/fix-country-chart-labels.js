const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

(async () => {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('messmass');
  
  console.log('🔍 Finding projects with country charts...\n');
  
  const projects = await db.collection('projects').find({
    pageBlocks: { $exists: true }
  }).toArray();
  
  let fixed = 0;
  
  for (const project of projects) {
    const blocks = project.pageBlocks || [];
    let updated = false;
    
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      
      if (block.chartConfig?.title?.includes('Countries')) {
        console.log(`Found country chart in: ${project.eventName}`);
        console.log(`  Title: ${block.chartConfig.title}`);
        
        // Check if elements have hardcoded "N/A" labels
        for (let j = 0; j < block.chartConfig.elements.length; j++) {
          const el = block.chartConfig.elements[j];
          if (el.label === 'N/A' || el.label.includes('N/A')) {
            // Fix: Change label to use template syntax
            const countryNum = j + 1;
            const newLabel = `{{bitlyCountry${countryNum}}}`;
            console.log(`  ❌ Element ${j + 1}: "${el.label}" → "${newLabel}"`);
            blocks[i].chartConfig.elements[j].label = newLabel;
            updated = true;
          }
        }
      }
    }
    
    if (updated) {
      await db.collection('projects').updateOne(
        { _id: project._id },
        { $set: { pageBlocks: blocks, updatedAt: new Date().toISOString() } }
      );
      console.log(`  ✅ Fixed!\n`);
      fixed++;
    }
  }
  
  console.log(`\n📊 Summary: Fixed ${fixed} projects`);
  
  await client.close();
})();
