// scripts/fix-as-roma-template.ts
import { getDb } from '../lib/db';
import { ObjectId } from 'mongodb';

async function main() {
  console.log('🔍 Checking AS Roma Match Day template usage...\n');
  
  const db = await getDb();
  const template = await db.collection('report_templates').findOne({ name: 'AS Roma Match Day' });
  
  if (!template) {
    console.log('Template not found');
    process.exit(1);
  }
  
  console.log('Template ID:', template._id.toString());
  console.log('Current dataBlocks:', template.dataBlocks?.length || 0);
  
  // Check usage
  const projects = await db.collection('projects').countDocuments({ reportTemplateId: template._id });
  const partners = await db.collection('partners').countDocuments({ reportTemplateId: template._id });
  
  console.log('Projects using this template:', projects);
  console.log('Partners using this template:', partners);
  console.log('');
  
  if (projects === 0 && partners === 0) {
    console.log('⚠️  Template is not in use. Deleting to eliminate warning...\n');
    await db.collection('report_templates').deleteOne({ _id: template._id });
    console.log('✅ Deleted unused template\n');
  } else {
    console.log('⚠️  Template IS in use. Copying blocks from "AS Roma" template...\n');
    
    // Get AS Roma template as reference
    const asRomaTemplate = await db.collection('report_templates').findOne({ name: 'AS Roma' });
    
    if (asRomaTemplate && asRomaTemplate.dataBlocks) {
      await db.collection('report_templates').updateOne(
        { _id: template._id },
        { 
          $set: { 
            dataBlocks: asRomaTemplate.dataBlocks,
            updatedAt: new Date().toISOString()
          } 
        }
      );
      console.log(`✅ Copied ${asRomaTemplate.dataBlocks.length} blocks from AS Roma template\n`);
    }
  }
  
  console.log('🎉 Done! Run "npm run diagnose:reports" to verify\n');
  process.exit(0);
}

main();
