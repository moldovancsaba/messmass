#!/usr/bin/env node

/**
 * Verify Partner Template Connection
 * 
 * This script verifies that partner reports are using the correct template
 * and that the visualization admin is editing the right template.
 */

const API_BASE = 'http://localhost:3001';

async function verifyPartnerTemplateConnection() {
  console.log('🔍 Verifying Partner Template Connection\n');
  
  try {
    // 1. Check what template partner reports use
    console.log('1. Checking partner report template resolution...');
    const partnerConfigResponse = await fetch(`${API_BASE}/api/report-config/__default_event__?type=partner`);
    const partnerConfigData = await partnerConfigResponse.json();
    
    if (partnerConfigData.success) {
      console.log(`✅ Partner reports use: "${partnerConfigData.template.name}" (${partnerConfigData.template.type})`);
      console.log(`   Template ID: ${partnerConfigData.template._id}`);
      console.log(`   Resolved from: ${partnerConfigData.resolvedFrom}`);
      console.log(`   Source: ${partnerConfigData.source}`);
    } else {
      console.log('❌ Failed to get partner report template');
      return;
    }
    
    // 2. Check available templates
    console.log('\n2. Checking available templates...');
    const templatesResponse = await fetch(`${API_BASE}/api/report-templates?includeAssociations=false`);
    const templatesData = await templatesResponse.json();
    
    if (templatesData.success) {
      console.log(`✅ Found ${templatesData.templates.length} templates:`);
      templatesData.templates.forEach(template => {
        const isPartnerTemplate = template._id === partnerConfigData.template._id;
        const marker = isPartnerTemplate ? '🎯 PARTNER REPORTS USE THIS' : '  ';
        console.log(`   ${marker} ${template.name} (${template.type}) ${template.isDefault ? '⭐' : ''}`);
      });
    }
    
    // 3. Verify Swiss partner specifically
    console.log('\n3. Testing Swiss partner report...');
    const swissResponse = await fetch(`${API_BASE}/api/partners/report/903f80ab-e105-4aaa-8c42-2caf71a46954`);
    const swissData = await swissResponse.json();
    
    if (swissData.success) {
      console.log('✅ Swiss partner report loads successfully');
      console.log(`   Partner: ${swissData.partner?.name || 'Unknown'}`);
      console.log(`   Events: ${swissData.events?.length || 0}`);
      console.log(`   Data blocks: ${swissData.dataBlocks?.length || 0}`);
    } else {
      console.log('❌ Swiss partner report failed:', swissData.error);
    }
    
    console.log('\n🎯 SUMMARY:');
    console.log(`Partner reports use: "${partnerConfigData.template.name}" template`);
    console.log('To edit partner report visualizations:');
    console.log('1. Go to /admin/visualization');
    console.log('2. Select "Default Event Report" template');
    console.log('3. Or click "🎯 Edit Partner Reports" button');
    console.log('\nThis will ensure you\'re editing the template that partner reports actually use!');
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

// Run the verification
verifyPartnerTemplateConnection();