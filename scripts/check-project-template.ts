import clientPromise from '../lib/mongodb';
import config from '../lib/config';

async function checkProjectTemplate() {
  const client = await clientPromise;
  const db = client.db(config.dbName);
  
  const editSlug = 'fbd67900-6ac0-46b4-944e-5ce4ad1e0482';
  const project = await db.collection('projects').findOne({ editSlug });
  
  console.log('📊 Project:', project?.eventName);
  console.log('🔗 Partner ID:', project?.partner1);
  console.log('📋 Project Template ID:', project?.reportTemplateId);
  
  if (project?.partner1) {
    const partner = await db.collection('partners').findOne({ _id: project.partner1 });
    console.log('\n👥 Partner:', partner?.name);
    console.log('📋 Partner Template ID:', partner?.reportTemplateId);
    
    if (partner?.reportTemplateId) {
      const template = await db.collection('report_templates').findOne({ _id: partner.reportTemplateId });
      console.log('\n📄 Template Name:', template?.name);
      console.log('📦 Template Blocks:', template?.dataBlocks?.length);
    }
  }
  
  process.exit(0);
}

checkProjectTemplate();
