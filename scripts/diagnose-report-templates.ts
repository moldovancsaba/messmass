// scripts/diagnose-report-templates.ts
// WHAT: Comprehensive diagnostic for report template and style resolution
// WHY: Ensure rock-solid template/style application across ALL report types
// HOW: Test all permutations: (report types) × (template sources) × (style sources)

import { getDb } from '../lib/db';
import { ObjectId } from 'mongodb';

interface DiagnosticResult {
  testName: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
  details?: any;
}

const results: DiagnosticResult[] = [];

function logResult(result: DiagnosticResult) {
  results.push(result);
  const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} [${result.status}] ${result.testName}`);
  console.log(`   ${result.message}`);
  if (result.details) {
    console.log('   Details:', JSON.stringify(result.details, null, 2));
  }
  console.log('');
}

async function testProjectTemplateResolution() {
  console.log('\n=== 🎯 PROJECT TEMPLATE RESOLUTION ===\n');
  
  const db = await getDb();
  const projects = await db.collection('projects').find({}).limit(5).toArray();
  const partners = await db.collection('partners').find({}).toArray();
  const templates = await db.collection('report_templates').find({}).toArray();
  
  // Test 1: Projects with reportTemplateId
  const projectsWithTemplate = projects.filter(p => p.reportTemplateId);
  if (projectsWithTemplate.length === 0) {
    logResult({
      testName: 'Projects with explicit templates',
      status: 'WARN',
      message: 'No projects have reportTemplateId set',
      details: { totalProjects: projects.length }
    });
  } else {
    for (const project of projectsWithTemplate) {
      const templateId = typeof project.reportTemplateId === 'string' && ObjectId.isValid(project.reportTemplateId)
        ? new ObjectId(project.reportTemplateId)
        : project.reportTemplateId;
      
      const template = await db.collection('report_templates').findOne({ _id: templateId });
      
      logResult({
        testName: `Project "${project.eventName}" explicit template`,
        status: template ? 'PASS' : 'FAIL',
        message: template 
          ? `Template found: ${template.name}`
          : `Template NOT FOUND for ID: ${templateId}`,
        details: {
          projectId: project._id.toString(),
          templateId: project.reportTemplateId,
          templateExists: !!template,
          hasStyleId: !!template?.styleId
        }
      });
    }
  }
  
  // Test 2: Projects inheriting from partner templates
  for (const project of projects.slice(0, 3)) {
    if (project.reportTemplateId) continue; // Skip explicit templates
    
    if (!project.partner1) {
      logResult({
        testName: `Project "${project.eventName}" partner fallback`,
        status: 'WARN',
        message: 'No partner1 set, cannot inherit partner template',
        details: { projectId: project._id.toString() }
      });
      continue;
    }
    
    const partnerId = typeof project.partner1 === 'object' && '_id' in project.partner1
      ? project.partner1._id
      : project.partner1;
    
    const partner = await db.collection('partners').findOne({ _id: partnerId });
    
    if (!partner) {
      logResult({
        testName: `Project "${project.eventName}" partner lookup`,
        status: 'FAIL',
        message: `Partner NOT FOUND: ${partnerId}`,
        details: { projectId: project._id.toString(), partnerId: partnerId.toString() }
      });
      continue;
    }
    
    if (partner.reportTemplateId) {
      const templateId = typeof partner.reportTemplateId === 'string' && ObjectId.isValid(partner.reportTemplateId)
        ? new ObjectId(partner.reportTemplateId)
        : partner.reportTemplateId;
      
      const template = await db.collection('report_templates').findOne({ _id: templateId });
      
      logResult({
        testName: `Project "${project.eventName}" inherits from partner "${partner.name}"`,
        status: template ? 'PASS' : 'FAIL',
        message: template
          ? `Inherited template: ${template.name}`
          : `Partner template NOT FOUND: ${templateId}`,
        details: {
          projectId: project._id.toString(),
          partnerId: partner._id.toString(),
          partnerName: partner.name,
          templateId: partner.reportTemplateId,
          templateExists: !!template,
          hasStyleId: !!template?.styleId,
          partnerStyleId: partner.styleId || null
        }
      });
    } else {
      logResult({
        testName: `Project "${project.eventName}" partner template`,
        status: 'WARN',
        message: `Partner "${partner.name}" has no reportTemplateId, will use default`,
        details: { projectId: project._id.toString(), partnerId: partner._id.toString() }
      });
    }
  }
  
  // Test 3: Default template exists
  const defaultTemplate = await db.collection('report_templates').findOne({ isDefault: true });
  logResult({
    testName: 'Default template exists',
    status: defaultTemplate ? 'PASS' : 'FAIL',
    message: defaultTemplate
      ? `Default template found: ${defaultTemplate.name}`
      : 'No default template in database',
    details: defaultTemplate ? {
      templateId: defaultTemplate._id.toString(),
      name: defaultTemplate.name,
      type: defaultTemplate.type,
      hasStyleId: !!defaultTemplate.styleId,
      blocksCount: defaultTemplate.dataBlocks?.length || 0
    } : null
  });
}

async function testPartnerTemplateResolution() {
  console.log('\n=== 🏢 PARTNER TEMPLATE RESOLUTION ===\n');
  
  const db = await getDb();
  const partners = await db.collection('partners').find({}).limit(5).toArray();
  
  for (const partner of partners) {
    if (!partner.reportTemplateId) {
      logResult({
        testName: `Partner "${partner.name}" template`,
        status: 'WARN',
        message: 'No reportTemplateId set, will use default',
        details: { partnerId: partner._id.toString() }
      });
      continue;
    }
    
    const templateId = typeof partner.reportTemplateId === 'string' && ObjectId.isValid(partner.reportTemplateId)
      ? new ObjectId(partner.reportTemplateId)
      : partner.reportTemplateId;
    
    const template = await db.collection('report_templates').findOne({ _id: templateId });
    
    logResult({
      testName: `Partner "${partner.name}" explicit template`,
      status: template ? 'PASS' : 'FAIL',
      message: template
        ? `Template found: ${template.name}`
        : `Template NOT FOUND for ID: ${templateId}`,
      details: {
        partnerId: partner._id.toString(),
        templateId: partner.reportTemplateId,
        templateExists: !!template,
        templateStyleId: template?.styleId || null,
        partnerStyleId: partner.styleId || null,
        styleIdMerged: template?.styleId || partner.styleId || null
      }
    });
  }
}

async function testStyleResolution() {
  console.log('\n=== 🎨 STYLE RESOLUTION & APPLICATION ===\n');
  
  const db = await getDb();
  const styles = await db.collection('page_styles_enhanced').find({}).toArray();
  
  // Test 1: Styles exist
  logResult({
    testName: 'Page styles exist',
    status: styles.length > 0 ? 'PASS' : 'FAIL',
    message: `Found ${styles.length} page style(s)`,
    details: styles.map(s => ({
      _id: s._id.toString(),
      name: s.name,
      isGlobalDefault: s.isGlobalDefault || false
    }))
  });
  
  // Test 2: Global default style
  const globalDefault = styles.find(s => s.isGlobalDefault);
  logResult({
    testName: 'Global default style exists',
    status: globalDefault ? 'PASS' : 'WARN',
    message: globalDefault
      ? `Global default: ${globalDefault.name}`
      : 'No global default style set',
    details: globalDefault ? { styleId: globalDefault._id.toString() } : null
  });
  
  // Test 3: Template → Style linking
  const templates = await db.collection('report_templates').find({}).toArray();
  for (const template of templates) {
    if (!template.styleId) {
      logResult({
        testName: `Template "${template.name}" styleId`,
        status: 'WARN',
        message: 'No styleId set on template',
        details: { templateId: template._id.toString() }
      });
      continue;
    }
    
    const styleId = typeof template.styleId === 'string' && ObjectId.isValid(template.styleId)
      ? new ObjectId(template.styleId)
      : template.styleId;
    
    const style = await db.collection('page_styles_enhanced').findOne({ _id: styleId });
    
    logResult({
      testName: `Template "${template.name}" → Style`,
      status: style ? 'PASS' : 'FAIL',
      message: style
        ? `Style found: ${style.name}`
        : `Style NOT FOUND for ID: ${styleId}`,
      details: {
        templateId: template._id.toString(),
        styleId: template.styleId,
        styleExists: !!style
      }
    });
  }
  
  // Test 4: Partner → Style linking
  const partners = await db.collection('partners').find({}).limit(5).toArray();
  for (const partner of partners) {
    if (!partner.styleId) {
      logResult({
        testName: `Partner "${partner.name}" styleId`,
        status: 'WARN',
        message: 'No styleId set on partner',
        details: { partnerId: partner._id.toString() }
      });
      continue;
    }
    
    const styleId = typeof partner.styleId === 'string' && ObjectId.isValid(partner.styleId)
      ? new ObjectId(partner.styleId)
      : partner.styleId;
    
    const style = await db.collection('page_styles_enhanced').findOne({ _id: styleId });
    
    logResult({
      testName: `Partner "${partner.name}" → Style`,
      status: style ? 'PASS' : 'FAIL',
      message: style
        ? `Style found: ${style.name}`
        : `Style NOT FOUND for ID: ${styleId}`,
      details: {
        partnerId: partner._id.toString(),
        styleId: partner.styleId,
        styleExists: !!style
      }
    });
  }
}

async function testDataBlockPopulation() {
  console.log('\n=== 📦 DATA BLOCK POPULATION ===\n');
  
  const db = await getDb();
  const templates = await db.collection('report_templates').find({}).toArray();
  const dataBlocks = await db.collection('data_blocks').find({}).toArray();
  
  logResult({
    testName: 'Data blocks exist',
    status: dataBlocks.length > 0 ? 'PASS' : 'FAIL',
    message: `Found ${dataBlocks.length} data block(s)`,
    details: dataBlocks.map(b => ({
      _id: b._id.toString(),
      name: b.name,
      chartsCount: b.charts?.length || 0
    }))
  });
  
  for (const template of templates) {
    if (!template.dataBlocks || template.dataBlocks.length === 0) {
      logResult({
        testName: `Template "${template.name}" has data blocks`,
        status: 'WARN',
        message: 'No dataBlocks array in template',
        details: { templateId: template._id.toString() }
      });
      continue;
    }
    
    const blockIds = template.dataBlocks.map((ref: any) => 
      typeof ref.blockId === 'string' && ObjectId.isValid(ref.blockId)
        ? new ObjectId(ref.blockId)
        : ref.blockId
    );
    
    const foundBlocks = await db.collection('data_blocks').find({
      _id: { $in: blockIds }
    }).toArray();
    
    const missingCount = blockIds.length - foundBlocks.length;
    
    logResult({
      testName: `Template "${template.name}" data blocks populated`,
      status: missingCount === 0 ? 'PASS' : 'FAIL',
      message: missingCount === 0
        ? `All ${blockIds.length} block(s) found`
        : `${missingCount} of ${blockIds.length} block(s) MISSING`,
      details: {
        templateId: template._id.toString(),
        requestedBlocks: blockIds.length,
        foundBlocks: foundBlocks.length,
        missingBlocks: missingCount,
        blockIds: blockIds.map(id => id.toString())
      }
    });
  }
}

async function printSummary() {
  console.log('\n=== 📊 DIAGNOSTIC SUMMARY ===\n');
  
  const passCount = results.filter(r => r.status === 'PASS').length;
  const failCount = results.filter(r => r.status === 'FAIL').length;
  const warnCount = results.filter(r => r.status === 'WARN').length;
  
  console.log(`Total Tests: ${results.length}`);
  console.log(`✅ PASS: ${passCount}`);
  console.log(`❌ FAIL: ${failCount}`);
  console.log(`⚠️  WARN: ${warnCount}`);
  console.log('');
  
  if (failCount > 0) {
    console.log('🚨 CRITICAL ISSUES FOUND:\n');
    results
      .filter(r => r.status === 'FAIL')
      .forEach(r => {
        console.log(`❌ ${r.testName}`);
        console.log(`   ${r.message}\n`);
      });
  }
  
  if (warnCount > 0) {
    console.log('⚠️  WARNINGS:\n');
    results
      .filter(r => r.status === 'WARN')
      .forEach(r => {
        console.log(`⚠️  ${r.testName}`);
        console.log(`   ${r.message}\n`);
      });
  }
  
  if (failCount === 0 && warnCount === 0) {
    console.log('🎉 ALL TESTS PASSED - Reports are rock solid!\n');
  } else {
    console.log('💡 Review issues above and fix before deployment\n');
  }
}

async function main() {
  console.log('🔍 MESSMASS REPORT TEMPLATE & STYLE DIAGNOSTIC');
  console.log('===============================================\n');
  console.log('Testing all permutations of template and style resolution...\n');
  
  try {
    await testProjectTemplateResolution();
    await testPartnerTemplateResolution();
    await testStyleResolution();
    await testDataBlockPopulation();
    await printSummary();
    
    const failCount = results.filter(r => r.status === 'FAIL').length;
    process.exit(failCount > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { main as diagnoseReportTemplates };
