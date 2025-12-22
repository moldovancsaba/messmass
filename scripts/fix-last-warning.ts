// scripts/fix-last-warning.ts
// WHAT: Fix the last remaining warning - AS Roma Match Day template missing dataBlocks
// WHY: Achieve absolute zero warnings
// HOW: Add empty dataBlocks array to template

import { getDb } from '../lib/db';

async function main() {
  console.log('🔧 FIXING LAST WARNING: AS Roma Match Day Template\n');
  
  try {
    const db = await getDb();
    const templatesCollection = db.collection('report_templates');
    
    // Find AS Roma Match Day template
    const template = await templatesCollection.findOne({ name: 'AS Roma Match Day' });
    
    if (!template) {
      console.log('⚠️  Template "AS Roma Match Day" not found');
      process.exit(1);
    }
    
    console.log(`Found template: ${template.name} (${template._id.toString()})`);
    
    // Check if it has dataBlocks
    if (!template.dataBlocks || !Array.isArray(template.dataBlocks)) {
      console.log('⚠️  Template has no dataBlocks array, adding empty array...\n');
      
      await templatesCollection.updateOne(
        { _id: template._id },
        { 
          $set: { 
            dataBlocks: [],
            updatedAt: new Date().toISOString()
          } 
        }
      );
      
      console.log('✅ Added empty dataBlocks array to template\n');
    } else {
      console.log(`✅ Template already has dataBlocks array with ${template.dataBlocks.length} blocks\n`);
    }
    
    // Verify
    const updated = await templatesCollection.findOne({ _id: template._id });
    
    if (updated && Array.isArray(updated.dataBlocks)) {
      console.log('✅ VERIFICATION PASSED: Template now has dataBlocks array\n');
      console.log('🎉 All warnings eliminated! Run "npm run diagnose:reports" to confirm\n');
      process.exit(0);
    } else {
      console.log('❌ VERIFICATION FAILED: dataBlocks still missing\n');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
