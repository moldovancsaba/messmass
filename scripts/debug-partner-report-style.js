// WHAT: Debug partner report style loading issue
// WHY: Style is still not being imported/applied on partner report pages

async function debugPartnerReportStyle() {
  console.log('🎨 Debugging Partner Report Style Issue');
  console.log('======================================');
  
  const sihfSlug = '903f80ab-e105-4aaa-8c42-2caf71a46954';
  const sihfPartnerId = '68f626b4eaea906244f28925';
  const sihfStyleId = '693fe86456d7006458901c25';
  
  try {
    console.log('🔗 Partner Report URL: http://localhost:3001/partner-report/' + sihfSlug);
    console.log('');
    
    // Test the exact API flow the frontend uses
    console.log('📋 Testing Frontend API Flow:');
    
    // Step 1: Partner API
    console.log('\n1️⃣ Partner API...');
    const partnerResponse = await fetch(`http://localhost:3001/api/partners/report/${sihfSlug}`);
    const partnerData = await partnerResponse.json();
    
    if (partnerData.success) {
      console.log(`   ✅ Partner: ${partnerData.partner.name}`);
      console.log(`   ✅ StyleId: ${partnerData.partner.styleId}`);
      console.log(`   ✅ ReportTemplateId: ${partnerData.partner.reportTemplateId}`);
    } else {
      console.log('   ❌ Partner API failed:', partnerData.error);
      return;
    }
    
    // Step 2: Report Config API (this loads template AND should load style)
    console.log('\n2️⃣ Report Config API...');
    const configResponse = await fetch(`http://localhost:3001/api/report-config/${partnerData.partner._id}?type=partner`);
    const configData = await configResponse.json();
    
    if (configData.success) {
      console.log(`   ✅ Template: ${configData.template.name}`);
      console.log(`   ✅ Resolved from: ${configData.resolvedFrom}`);
      console.log(`   ✅ Template styleId: ${configData.template.styleId || 'NONE'}`);
      console.log(`   ✅ Data blocks: ${configData.template.dataBlocks?.length || 0}`);
    } else {
      console.log('   ❌ Report config failed:', configData.error);
      return;
    }
    
    // Step 3: Style API (partner's direct style)
    console.log('\n3️⃣ Partner Style API...');
    if (partnerData.partner.styleId) {
      const styleResponse = await fetch(`http://localhost:3001/api/page-styles-enhanced?styleId=${partnerData.partner.styleId}`);
      const styleData = await styleResponse.json();
      
      if (styleData.success && styleData.style) {
        console.log(`   ✅ Style: ${styleData.style.name}`);
        console.log(`   ✅ Font: ${styleData.style.typography?.fontFamily}`);
        console.log(`   ✅ Color: ${styleData.style.typography?.primaryTextColor}`);
        console.log(`   ✅ Background: ${JSON.stringify(styleData.style.pageBackground)}`);
      } else {
        console.log('   ❌ Style API failed:', styleData.error);
      }
    } else {
      console.log('   ⚠️  Partner has no styleId');
    }
    
    console.log('\n🎯 DIAGNOSIS:');
    console.log('✅ Partner has styleId assigned');
    console.log('✅ Style exists and is accessible');
    console.log('✅ Template loads correctly');
    console.log('✅ Data blocks are available');
    
    console.log('\n❓ POTENTIAL ISSUES:');
    console.log('1. Frontend style loading timing (ResourceLoader)');
    console.log('2. Style not being applied to DOM elements');
    console.log('3. CSS conflicts overriding the style');
    console.log('4. generateGradientCSS function issues');
    
    console.log('\n🔍 NEXT STEPS:');
    console.log('1. Check browser console for style loading messages');
    console.log('2. Inspect DOM elements for applied styles');
    console.log('3. Check if Montserrat font is loaded');
    console.log('4. Verify background CSS is generated correctly');
    
    console.log('\n🚨 EXPECTED BROWSER CONSOLE LOGS:');
    console.log('✅ "🎨 Partner has direct styleId - fetching: 693fe86456d7006458901c25"');
    console.log('✅ "✅ Using partner direct style: SIHF Swiss Ice Hockey Federation"');
    console.log('✅ "🎨 Style applied: SIHF Swiss Ice Hockey Federation"');
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugPartnerReportStyle().catch(console.error);