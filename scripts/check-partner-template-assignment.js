// WHAT: Check what report template is assigned to SIHF partner
// WHY: Need to understand why partner report isn't using the selected template

const { MongoClient, ObjectId } = require('mongodb');

async function checkPartnerTemplateAssignment() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB);
    
    console.log('🔍 Checking Partner Template Assignment');
    console.log('=====================================');
    
    // Find SIHF partner
    const sihfPartner = await db.collection('partners').findOne({ 
      name: /Swiss Ice Hockey Federation/i 
    });
    
    if (!sihfPartner) {
      console.log('❌ SIHF partner not found');
      return;
    }
    
    console.log('✅ Found SIHF partner:');
    console.log(`   - Name: ${sihfPartner.name}`);
    console.log(`   - ID: ${sihfPartner._id}`);
    console.log(`   - ViewSlug: ${sihfPartner.viewSlug}`);
    console.log(`   - Report Template ID: ${sihfPartner.reportTemplateId || 'NOT SET'}`);
    console.log(`   - Style ID: ${sihfPartner.styleId || 'NOT SET'}`);
    
    // If partner has a report template, fetch it
    if (sihfPartner.reportTemplateId) {
      const templateId = typeof sihfPartner.reportTemplateId === 'string' && ObjectId.isValid(sihfPartner.reportTemplateId)
        ? new ObjectId(sihfPartner.reportTemplateId)
        : sihfPartner.reportTemplateId;
      
      const template = await db.collection('report_templates').findOne({ _id: templateId });
      
      if (template) {
        console.log('\n📋 Partner has assigned report template:');
        console.log(`   - Template Name: ${template.name}`);
        console.log(`   - Template Type: ${template.type}`);
        console.log(`   - Data Blocks: ${template.dataBlocks?.length || 0}`);
        console.log(`   - Style ID: ${template.styleId || 'NOT SET'}`);
        console.log(`   - Is Default: ${template.isDefault || false}`);
        
        if (template.dataBlocks && template.dataBlocks.length > 0) {
          console.log('\n📊 Template Data Blocks:');
          template.dataBlocks.forEach((block, i) => {
            console.log(`   ${i + 1}. Block ID: ${block.blockId}, Order: ${block.order}`);
          });
        }
      } else {
        console.log('\n❌ Report template not found in database');
      }
    } else {
      console.log('\n⚠️  Partner has NO report template assigned');
      
      // Check what templates are available
      const templates = await db.collection('report_templates').find({}).toArray();
      console.log(`\n📋 Available report templates (${templates.length}):`);
      templates.forEach((template, i) => {
        console.log(`   ${i + 1}. ${template.name} (${template.type}) - ${template.dataBlocks?.length || 0} blocks - Default: ${template.isDefault || false}`);
      });
    }
    
    console.log('\n🎯 ISSUE IDENTIFIED:');
    if (sihfPartner.reportTemplateId) {
      console.log('   - Partner HAS a report template assigned');
      console.log('   - But partner report page is hardcoded to use "__default_event__"');
      console.log('   - Should use partner.reportTemplateId instead');
    } else {
      console.log('   - Partner has NO report template assigned');
      console.log('   - Should fall back to default template');
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error);
  } finally {
    await client.close();
  }
}

// Run if called directly
if (require.main === module) {
  require('dotenv').config({ path: '.env.local' });
  checkPartnerTemplateAssignment().catch(console.error);
}

module.exports = { checkPartnerTemplateAssignment };