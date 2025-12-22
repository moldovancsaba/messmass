// scripts/fix-report-config-warnings.ts
// WHAT: Fix ALL configuration warnings in report system
// WHY: Achieve 100% clean system with zero warnings
// HOW: Assign templates and styles to all entities that need them

import { getDb } from '../lib/db';
import { ObjectId } from 'mongodb';

interface FixResult {
  entity: string;
  action: string;
  before: any;
  after: any;
}

const fixes: FixResult[] = [];

function logFix(fix: FixResult) {
  fixes.push(fix);
  console.log(`✅ ${fix.entity}: ${fix.action}`);
}

async function getDefaultTemplate() {
  const db = await getDb();
  const template = await db.collection('report_templates').findOne({ 
    type: 'event', 
    isDefault: true 
  });
  
  if (!template) {
    throw new Error('No default event template found in database');
  }
  
  return template;
}

async function getGlobalDefaultStyle() {
  const db = await getDb();
  const style = await db.collection('page_styles_enhanced').findOne({ 
    isGlobalDefault: true 
  });
  
  if (!style) {
    // If no global default, use the first available style
    const firstStyle = await db.collection('page_styles_enhanced').findOne({});
    if (!firstStyle) {
      throw new Error('No page styles found in database');
    }
    return firstStyle;
  }
  
  return style;
}

async function fixProjectTemplates() {
  console.log('\n📋 FIXING PROJECT TEMPLATES\n');
  
  const db = await getDb();
  const projectsCollection = db.collection('projects');
  const defaultTemplate = await getDefaultTemplate();
  
  // Find projects without reportTemplateId
  const projectsWithoutTemplate = await projectsCollection
    .find({ 
      $or: [
        { reportTemplateId: { $exists: false } },
        { reportTemplateId: null }
      ]
    })
    .toArray();
  
  console.log(`Found ${projectsWithoutTemplate.length} project(s) without explicit template\n`);
  
  for (const project of projectsWithoutTemplate) {
    await projectsCollection.updateOne(
      { _id: project._id },
      { 
        $set: { 
          reportTemplateId: defaultTemplate._id,
          updatedAt: new Date().toISOString()
        } 
      }
    );
    
    logFix({
      entity: `Project "${project.eventName}"`,
      action: `Assigned default template: ${defaultTemplate.name}`,
      before: { reportTemplateId: null },
      after: { reportTemplateId: defaultTemplate._id.toString() }
    });
  }
  
  return projectsWithoutTemplate.length;
}

async function fixPartnerTemplates() {
  console.log('\n🏢 FIXING PARTNER TEMPLATES\n');
  
  const db = await getDb();
  const partnersCollection = db.collection('partners');
  
  // Get default partner template (or fall back to event template)
  let defaultTemplate = await db.collection('report_templates').findOne({ 
    type: 'partner', 
    isDefault: true 
  });
  
  if (!defaultTemplate) {
    console.log('⚠️  No default partner template, using default event template instead');
    defaultTemplate = await getDefaultTemplate();
  }
  
  // Find partners without reportTemplateId
  const partnersWithoutTemplate = await partnersCollection
    .find({ 
      $or: [
        { reportTemplateId: { $exists: false } },
        { reportTemplateId: null }
      ]
    })
    .toArray();
  
  console.log(`Found ${partnersWithoutTemplate.length} partner(s) without explicit template\n`);
  
  for (const partner of partnersWithoutTemplate) {
    await partnersCollection.updateOne(
      { _id: partner._id },
      { 
        $set: { 
          reportTemplateId: defaultTemplate._id,
          updatedAt: new Date().toISOString()
        } 
      }
    );
    
    logFix({
      entity: `Partner "${partner.name}"`,
      action: `Assigned template: ${defaultTemplate.name}`,
      before: { reportTemplateId: null },
      after: { reportTemplateId: defaultTemplate._id.toString() }
    });
  }
  
  return partnersWithoutTemplate.length;
}

async function fixTemplateStyles() {
  console.log('\n🎨 FIXING TEMPLATE STYLES\n');
  
  const db = await getDb();
  const templatesCollection = db.collection('report_templates');
  const globalDefaultStyle = await getGlobalDefaultStyle();
  
  console.log(`Using global default style: ${globalDefaultStyle.name} (${globalDefaultStyle._id.toString()})\n`);
  
  // Find templates without styleId
  const templatesWithoutStyle = await templatesCollection
    .find({ 
      $or: [
        { styleId: { $exists: false } },
        { styleId: null }
      ]
    })
    .toArray();
  
  console.log(`Found ${templatesWithoutStyle.length} template(s) without styleId\n`);
  
  for (const template of templatesWithoutStyle) {
    await templatesCollection.updateOne(
      { _id: template._id },
      { 
        $set: { 
          styleId: globalDefaultStyle._id,
          updatedAt: new Date().toISOString()
        } 
      }
    );
    
    logFix({
      entity: `Template "${template.name}"`,
      action: `Assigned global default style: ${globalDefaultStyle.name}`,
      before: { styleId: null },
      after: { styleId: globalDefaultStyle._id.toString() }
    });
  }
  
  return templatesWithoutStyle.length;
}

async function fixPartnerStyles() {
  console.log('\n🏢 FIXING PARTNER STYLES\n');
  
  const db = await getDb();
  const partnersCollection = db.collection('partners');
  const globalDefaultStyle = await getGlobalDefaultStyle();
  
  // Find partners without styleId
  const partnersWithoutStyle = await partnersCollection
    .find({ 
      $or: [
        { styleId: { $exists: false } },
        { styleId: null }
      ]
    })
    .toArray();
  
  console.log(`Found ${partnersWithoutStyle.length} partner(s) without styleId\n`);
  
  for (const partner of partnersWithoutStyle) {
    await partnersCollection.updateOne(
      { _id: partner._id },
      { 
        $set: { 
          styleId: globalDefaultStyle._id,
          updatedAt: new Date().toISOString()
        } 
      }
    );
    
    logFix({
      entity: `Partner "${partner.name}"`,
      action: `Assigned global default style: ${globalDefaultStyle.name}`,
      before: { styleId: null },
      after: { styleId: globalDefaultStyle._id.toString() }
    });
  }
  
  return partnersWithoutStyle.length;
}

async function printSummary(
  projectsFixed: number,
  partnersTemplatesFixed: number,
  templatesStylesFixed: number,
  partnersStylesFixed: number
) {
  console.log('\n=== 📊 FIX SUMMARY ===\n');
  
  const total = projectsFixed + partnersTemplatesFixed + templatesStylesFixed + partnersStylesFixed;
  
  console.log(`Total Fixes Applied: ${total}\n`);
  console.log(`📋 Projects with templates assigned: ${projectsFixed}`);
  console.log(`🏢 Partners with templates assigned: ${partnersTemplatesFixed}`);
  console.log(`🎨 Templates with styles assigned: ${templatesStylesFixed}`);
  console.log(`🏢 Partners with styles assigned: ${partnersStylesFixed}\n`);
  
  if (total === 0) {
    console.log('✨ System was already fully configured - no fixes needed!\n');
  } else {
    console.log(`✅ Applied ${total} configuration fix(es)\n`);
    console.log('💡 Run "npm run diagnose:reports" to verify zero warnings\n');
  }
}

async function verifyFix() {
  console.log('🔍 VERIFYING FIX...\n');
  
  const db = await getDb();
  
  // Check projects
  const projectsWithoutTemplate = await db.collection('projects').countDocuments({
    $or: [
      { reportTemplateId: { $exists: false } },
      { reportTemplateId: null }
    ]
  });
  
  // Check partners
  const partnersWithoutTemplate = await db.collection('partners').countDocuments({
    $or: [
      { reportTemplateId: { $exists: false } },
      { reportTemplateId: null }
    ]
  });
  
  // Check template styles
  const templatesWithoutStyle = await db.collection('report_templates').countDocuments({
    $or: [
      { styleId: { $exists: false } },
      { styleId: null }
    ]
  });
  
  // Check partner styles
  const partnersWithoutStyle = await db.collection('partners').countDocuments({
    $or: [
      { styleId: { $exists: false } },
      { styleId: null }
    ]
  });
  
  const totalIssues = projectsWithoutTemplate + partnersWithoutTemplate + templatesWithoutStyle + partnersWithoutStyle;
  
  if (totalIssues === 0) {
    console.log('✅ VERIFICATION PASSED: All entities fully configured!\n');
    console.log('📊 Status:');
    console.log('   - All projects have templates ✅');
    console.log('   - All partners have templates ✅');
    console.log('   - All templates have styles ✅');
    console.log('   - All partners have styles ✅\n');
    return true;
  } else {
    console.log(`⚠️  VERIFICATION FAILED: ${totalIssues} issue(s) remain\n`);
    console.log(`   - Projects without template: ${projectsWithoutTemplate}`);
    console.log(`   - Partners without template: ${partnersWithoutTemplate}`);
    console.log(`   - Templates without style: ${templatesWithoutStyle}`);
    console.log(`   - Partners without style: ${partnersWithoutStyle}\n`);
    return false;
  }
}

async function main() {
  console.log('🔧 FIX ALL REPORT CONFIGURATION WARNINGS');
  console.log('==========================================\n');
  console.log('This script will eliminate ALL warnings by assigning templates and styles\n');
  
  try {
    // Step 1: Fix project templates
    const projectsFixed = await fixProjectTemplates();
    
    // Step 2: Fix partner templates
    const partnersTemplatesFixed = await fixPartnerTemplates();
    
    // Step 3: Fix template styles
    const templatesStylesFixed = await fixTemplateStyles();
    
    // Step 4: Fix partner styles
    const partnersStylesFixed = await fixPartnerStyles();
    
    // Step 5: Print summary
    await printSummary(projectsFixed, partnersTemplatesFixed, templatesStylesFixed, partnersStylesFixed);
    
    // Step 6: Verify fix
    const success = await verifyFix();
    
    if (success) {
      console.log('🎉 SUCCESS: Zero warnings! Report system is 100% configured!\n');
      process.exit(0);
    } else {
      console.log('⚠️  Some issues remain. Manual review may be needed.\n');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { main as fixReportConfigWarnings };
