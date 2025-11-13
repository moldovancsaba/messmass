import clientPromise from '../lib/mongodb';
import config from '../lib/config';

async function fixAsRomaTemplate() {
  const client = await clientPromise;
  const db = client.db(config.dbName);
  
  const editSlug = 'fbd67900-6ac0-46b4-944e-5ce4ad1e0482';
  
  // Remove the broken template assignment
  const result = await db.collection('projects').updateOne(
    { editSlug },
    { $unset: { reportTemplateId: '' } }
  );
  
  console.log('✅ Removed broken template assignment from AS Roma x Udinese project');
  console.log('📋 Project will now use default template');
  console.log('Modified:', result.modifiedCount, 'document(s)');
  
  process.exit(0);
}

fixAsRomaTemplate();
