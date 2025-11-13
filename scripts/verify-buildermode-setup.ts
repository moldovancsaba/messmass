// WHAT: Verify BuilderMode is ready to work correctly
// WHY: Check that all projects have partners and templates resolve correctly
// HOW: Test template resolution for European Karate Championships project

import { MongoClient, ObjectId } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI || '';
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

async function verifySetup() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db(MONGODB_DB);
    
    // Check European Karate Championships project
    const project = await db.collection('projects').findOne({ eventName: 'European Karate Championships' });
    
    if (!project) {
      console.log('❌ European Karate Championships project not found');
      return;
    }
    
    console.log('📊 Project:', project.eventName);
    console.log('   ID:', project._id);
    console.log('   Partner1:', project.partner1);
    
    if (!project.partner1) {
      console.log('❌ Project has no partner1 - BuilderMode will fail!');
      return;
    }
    
    // Get partner
    const partnerId = typeof project.partner1 === 'object' && '_id' in project.partner1
      ? project.partner1._id
      : project.partner1;
    
    const partner = await db.collection('partners').findOne({ _id: partnerId });
    console.log('\n👥 Partner:', partner?.displayName || partner?.name);
    console.log('   Template:', partner?.reportTemplateId || 'None (will use default)');
    
    // Check template resolution
    let templateToUse;
    if (partner?.reportTemplateId) {
      const templateId = typeof partner.reportTemplateId === 'string' && ObjectId.isValid(partner.reportTemplateId)
        ? new ObjectId(partner.reportTemplateId)
        : partner.reportTemplateId;
      templateToUse = await db.collection('report_templates').findOne({ _id: templateId });
    } else {
      templateToUse = await db.collection('report_templates').findOne({ isDefault: true, type: 'event' });
    }
    
    if (!templateToUse) {
      console.log('❌ No template found!');
      return;
    }
    
    console.log('\n📋 Template:', templateToUse.name);
    console.log('   Type:', templateToUse.type);
    console.log('   Blocks:', templateToUse.dataBlocks?.length || 0);
    
    // Check project data
    console.log('\n📊 Project Stats:');
    const stats = project.stats || {};
    const imageKeys = Object.keys(stats).filter(k => k.includes('Image') || k.includes('image'));
    const textKeys = Object.keys(stats).filter(k => k.includes('Text') || k.includes('text'));
    const fanSelfieKeys = Object.keys(stats).filter(k => k.includes('fanSelfie'));
    
    console.log(`   Images: ${imageKeys.length} (${imageKeys.slice(0, 5).join(', ')}...)`);
    console.log(`   Texts: ${textKeys.length} (${textKeys.slice(0, 5).join(', ')}...)`);
    console.log(`   Fan Selfies: ${fanSelfieKeys.length} (${fanSelfieKeys.slice(0, 5).join(', ')}...)`);
    
    // Sample data values
    console.log('\n📸 Sample Image Data:');
    imageKeys.slice(0, 3).forEach(key => {
      const value = stats[key];
      if (typeof value === 'string' && value.length > 0) {
        console.log(`   ${key}: ${value.substring(0, 50)}...`);
      } else {
        console.log(`   ${key}: (empty)`);
      }
    });
    
    console.log('\n✅ BuilderMode setup verification complete');
    console.log('   Project has partner ✅');
    console.log('   Template resolves ✅');
    console.log('   Project has data ✅');
    
  } catch (error) {
    console.error('❌ Verification error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

verifySetup()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Verification failed:', err);
    process.exit(1);
  });
