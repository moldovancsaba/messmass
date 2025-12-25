// WHAT: Enable export buttons in all report templates
// WHY: Export buttons were disabled (showExportOptions: false) preventing PDF/CSV exports
// HOW: Update all report_templates to set heroSettings.showExportOptions = true

const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

async function enableExportButtons() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🔗 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(MONGODB_DB);
    const collection = db.collection('report_templates');
    
    // WHAT: Find all templates with disabled export options
    const templatesWithDisabledExport = await collection.find({
      'heroSettings.showExportOptions': false
    }).toArray();
    
    console.log(`\n📊 Found ${templatesWithDisabledExport.length} templates with disabled export buttons`);
    
    if (templatesWithDisabledExport.length === 0) {
      console.log('✅ All templates already have export buttons enabled');
      return;
    }
    
    // WHAT: Display templates that will be updated
    console.log('\n📝 Templates to update:');
    for (const template of templatesWithDisabledExport) {
      console.log(`   - ${template.name} (${template.type}) - ID: ${template._id}`);
    }
    
    // WHAT: Update all templates to enable export options
    const result = await collection.updateMany(
      { 'heroSettings.showExportOptions': false },
      { 
        $set: { 
          'heroSettings.showExportOptions': true,
          updatedAt: new Date().toISOString()
        } 
      }
    );
    
    console.log(`\n✅ Migration complete!`);
    console.log(`   - Matched: ${result.matchedCount} templates`);
    console.log(`   - Modified: ${result.modifiedCount} templates`);
    
    // WHAT: Also enable export options for templates that don't have heroSettings at all
    const templatesWithoutHeroSettings = await collection.find({
      heroSettings: { $exists: false }
    }).toArray();
    
    if (templatesWithoutHeroSettings.length > 0) {
      console.log(`\n📊 Found ${templatesWithoutHeroSettings.length} templates without heroSettings`);
      console.log('📝 Templates without heroSettings:');
      for (const template of templatesWithoutHeroSettings) {
        console.log(`   - ${template.name} (${template.type}) - ID: ${template._id}`);
      }
      
      const result2 = await collection.updateMany(
        { heroSettings: { $exists: false } },
        { 
          $set: { 
            heroSettings: {
              showEmoji: true,
              showDateInfo: true,
              showExportOptions: true
            },
            updatedAt: new Date().toISOString()
          } 
        }
      );
      
      console.log(`\n✅ Added default heroSettings to ${result2.modifiedCount} templates`);
    }
    
    // WHAT: Verify the changes
    const allTemplates = await collection.find({}).toArray();
    const enabledCount = allTemplates.filter(t => 
      t.heroSettings?.showExportOptions !== false
    ).length;
    
    console.log(`\n🎉 Final status:`);
    console.log(`   - Total templates: ${allTemplates.length}`);
    console.log(`   - Export buttons enabled: ${enabledCount}`);
    console.log(`   - Export buttons disabled: ${allTemplates.length - enabledCount}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the migration
enableExportButtons()
  .then(() => {
    console.log('\n✅ Export buttons migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
