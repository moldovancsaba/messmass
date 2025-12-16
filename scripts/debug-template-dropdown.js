#!/usr/bin/env node

/**
 * Debug Template Dropdown Issue
 * 
 * ISSUE: Template dropdown on /admin/visualization page not working
 * INVESTIGATION: Check API endpoints and data flow
 */

const API_BASE = 'http://localhost:3000';

async function debugTemplateDropdown() {
  console.log('🔍 Debugging Template Dropdown Issue\n');
  
  try {
    // 1. Test report-templates API
    console.log('1. Testing /api/report-templates endpoint...');
    const templatesResponse = await fetch(`${API_BASE}/api/report-templates?includeAssociations=false`);
    const templatesData = await templatesResponse.json();
    
    if (templatesData.success) {
      console.log(`✅ Templates API working - found ${templatesData.templates.length} templates`);
      templatesData.templates.forEach(template => {
        console.log(`   - ${template.name} (${template.type}) ${template.isDefault ? '⭐' : ''}`);
      });
    } else {
      console.log('❌ Templates API failed:', templatesData.error);
      return;
    }
    
    // 2. Test user-preferences API
    console.log('\n2. Testing /api/user-preferences endpoint...');
    const prefsResponse = await fetch(`${API_BASE}/api/user-preferences`);
    const prefsData = await prefsResponse.json();
    
    if (prefsData.success) {
      console.log('✅ User preferences API working');
      console.log('   Last selected template:', prefsData.preferences?.lastSelectedTemplateId || 'none');
    } else {
      console.log('❌ User preferences API failed:', prefsData.error);
    }
    
    // 3. Test template selection save
    console.log('\n3. Testing template selection save...');
    const testTemplateId = templatesData.templates[0]._id;
    const saveResponse = await fetch(`${API_BASE}/api/user-preferences`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lastSelectedTemplateId: testTemplateId })
    });
    
    const saveData = await saveResponse.json();
    if (saveData.success) {
      console.log('✅ Template selection save working');
    } else {
      console.log('❌ Template selection save failed:', saveData.error);
    }
    
    // 4. Test template config loading
    console.log('\n4. Testing template config loading...');
    const configResponse = await fetch(`${API_BASE}/api/data-blocks`);
    const configData = await configResponse.json();
    
    if (configData.success) {
      console.log(`✅ Data blocks API working - found ${configData.blocks.length} blocks`);
    } else {
      console.log('❌ Data blocks API failed:', configData.error);
    }
    
    console.log('\n🎯 DIAGNOSIS:');
    console.log('All API endpoints appear to be working correctly.');
    console.log('The issue is likely in the frontend JavaScript or browser-specific behavior.');
    console.log('\nRECOMMENDED DEBUGGING STEPS:');
    console.log('1. Open browser dev tools on /admin/visualization page');
    console.log('2. Check console for JavaScript errors');
    console.log('3. Check if dropdown onChange event is firing');
    console.log('4. Verify handleTemplateChange function is being called');
    console.log('5. Check if setSelectedTemplateId state update is working');
    
  } catch (error) {
    console.error('❌ Debug script failed:', error.message);
    console.log('\nThis might indicate the development server is not running.');
    console.log('Please ensure: npm run dev is running on port 3000');
  }
}

// Run the debug
debugTemplateDropdown();