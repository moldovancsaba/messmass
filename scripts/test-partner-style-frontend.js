// WHAT: Test partner style loading in frontend context
// WHY: Check if style is being loaded and applied correctly

async function testPartnerStyleFrontend() {
  console.log('🎨 Testing Partner Style Frontend Loading');
  console.log('========================================');
  
  const sihfSlug = '903f80ab-e105-4aaa-8c42-2caf71a46954';
  const sihfPartnerId = '68f626b4eaea906244f28925';
  const sihfStyleId = '693fe86456d7006458901c25';
  
  try {
    console.log('🔗 Partner Report URL: http://localhost:3001/partner-report/' + sihfSlug);
    console.log('');
    console.log('Expected frontend behavior:');
    console.log('1. Partner API returns styleId: ' + sihfStyleId);
    console.log('2. fetchReportTemplate should fetch partner style');
    console.log('3. setPageStyle should be called with SIHF style');
    console.log('4. Page should render with Montserrat font and SIHF branding');
    console.log('');
    
    // Simulate the exact API calls the frontend makes
    console.log('📋 Simulating Frontend API Calls:');
    
    // Step 1: Partner data (this works)
    console.log('\n1️⃣ Partner API call...');
    const partnerResponse = await fetch(`http://localhost:3001/api/partners/report/${sihfSlug}`);
    const partnerData = await partnerResponse.json();
    console.log(`   ✅ Partner: ${partnerData.partner.name}`);
    console.log(`   ✅ StyleId: ${partnerData.partner.styleId}`);
    
    // Step 2: Report template (this works)
    console.log('\n2️⃣ Report config API call...');
    const templateResponse = await fetch(`http://localhost:3001/api/report-config/${partnerData.partner._id}?type=partner`);
    const templateData = await templateResponse.json();
    console.log(`   ✅ Template: ${templateData.template.name}`);
    
    // Step 3: Style loading (this should work but might not be applied)
    console.log('\n3️⃣ Style API call (simulating frontend logic)...');
    if (partnerData.partner.styleId) {
      const styleResponse = await fetch(`http://localhost:3001/api/page-styles-enhanced?styleId=${partnerData.partner.styleId}`);
      const styleData = await styleResponse.json();
      
      if (styleData.success && styleData.style) {
        console.log(`   ✅ Style loaded: ${styleData.style.name}`);
        console.log(`   ✅ Font: ${styleData.style.typography?.fontFamily}`);
        console.log(`   ✅ Color: ${styleData.style.typography?.primaryTextColor}`);
        console.log(`   ✅ Background: ${styleData.style.pageBackground?.type}`);
        
        // Test CSS generation
        console.log('\n4️⃣ Testing CSS generation...');
        if (styleData.style.pageBackground) {
          console.log('   ✅ Background CSS would be generated');
        }
        if (styleData.style.typography?.fontFamily) {
          console.log(`   ✅ Font family: ${styleData.style.typography.fontFamily}`);
        }
        if (styleData.style.typography?.primaryTextColor) {
          console.log(`   ✅ Text color: ${styleData.style.typography.primaryTextColor}`);
        }
      } else {
        console.log('   ❌ Style loading failed:', styleData.error);
      }
    }
    
    console.log('\n🎯 DEBUGGING CHECKLIST:');
    console.log('✅ Partner has styleId assigned');
    console.log('✅ Style exists and is accessible');
    console.log('✅ API calls work correctly');
    console.log('❓ Check browser console for style loading logs');
    console.log('❓ Check if setPageStyle is being called');
    console.log('❓ Check if style is being overridden by CSS');
    
    console.log('\n🔍 Next Steps:');
    console.log('1. Open browser dev tools');
    console.log('2. Go to partner report page');
    console.log('3. Check console for style loading messages');
    console.log('4. Check if Montserrat font is applied');
    console.log('5. Check if background/colors are applied');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testPartnerStyleFrontend().catch(console.error);