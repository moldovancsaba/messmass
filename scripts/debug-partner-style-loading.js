// WHAT: Debug partner style loading to identify why style is missing
// WHY: Partner report should use the assigned style but it's not loading

async function debugPartnerStyleLoading() {
  console.log('🎨 Debugging Partner Style Loading');
  console.log('==================================');
  
  const sihfPartnerId = '68f626b4eaea906244f28925';
  const sihfStyleId = '693fe86456d7006458901c25';
  
  try {
    // Test 1: Check partner data from API
    console.log('\n1️⃣ Testing Partner API Response...');
    const partnerResponse = await fetch(`http://localhost:3001/api/partners/report/903f80ab-e105-4aaa-8c42-2caf71a46954`);
    const partnerData = await partnerResponse.json();
    
    if (partnerData.success) {
      console.log('✅ Partner API works');
      console.log(`   - Partner: ${partnerData.partner.name}`);
      console.log(`   - Style ID: ${partnerData.partner.styleId || 'MISSING'}`);
      console.log(`   - Report Template ID: ${partnerData.partner.reportTemplateId || 'MISSING'}`);
    } else {
      console.log('❌ Partner API failed:', partnerData.error);
      return;
    }
    
    // Test 2: Check if style ID exists in enhanced styles
    console.log('\n2️⃣ Testing Style API with Partner Style ID...');
    if (partnerData.partner.styleId) {
      const styleResponse = await fetch(`http://localhost:3001/api/page-styles-enhanced?styleId=${partnerData.partner.styleId}`);
      const styleData = await styleResponse.json();
      
      if (styleData.success && styleData.style) {
        console.log('✅ Partner style found');
        console.log(`   - Style Name: ${styleData.style.name}`);
        console.log(`   - Style ID: ${styleData.style._id}`);
        console.log(`   - Font Family: ${styleData.style.typography?.fontFamily || 'Not set'}`);
        console.log(`   - Primary Color: ${styleData.style.typography?.primaryTextColor || 'Not set'}`);
        console.log(`   - Background: ${styleData.style.pageBackground?.type || 'Not set'}`);
      } else {
        console.log('❌ Partner style not found:', styleData.error);
        console.log('   - This could be why style is missing on partner report');
      }
    } else {
      console.log('⚠️  Partner has no styleId assigned');
    }
    
    // Test 3: Check report template and its style
    console.log('\n3️⃣ Testing Report Template Style...');
    const templateResponse = await fetch(`http://localhost:3001/api/report-config/${sihfPartnerId}?type=partner`);
    const templateData = await templateResponse.json();
    
    if (templateData.success && templateData.template) {
      console.log('✅ Template loaded');
      console.log(`   - Template: ${templateData.template.name}`);
      console.log(`   - Template Style ID: ${templateData.template.styleId || 'MISSING'}`);
      
      if (templateData.template.styleId) {
        const templateStyleResponse = await fetch(`http://localhost:3001/api/page-styles-enhanced?styleId=${templateData.template.styleId}`);
        const templateStyleData = await templateStyleResponse.json();
        
        if (templateStyleData.success && templateStyleData.style) {
          console.log('✅ Template style found');
          console.log(`   - Template Style Name: ${templateStyleData.style.name}`);
        } else {
          console.log('❌ Template style not found:', templateStyleData.error);
        }
      } else {
        console.log('⚠️  Template has no styleId');
      }
    }
    
    // Test 4: Check what styles are available
    console.log('\n4️⃣ Checking Available Styles...');
    const allStylesResponse = await fetch(`http://localhost:3001/api/page-styles-enhanced`);
    const allStylesData = await allStylesResponse.json();
    
    if (allStylesData.success) {
      console.log(`✅ Found ${allStylesData.styles.length} available styles`);
      
      // Look for SIHF-related styles
      const sihfStyles = allStylesData.styles.filter(style => 
        style.name.toLowerCase().includes('sihf') || 
        style.name.toLowerCase().includes('swiss') ||
        style._id === sihfStyleId
      );
      
      if (sihfStyles.length > 0) {
        console.log('   - SIHF-related styles found:');
        sihfStyles.forEach(style => {
          console.log(`     - ${style.name} (ID: ${style._id})`);
        });
      } else {
        console.log('   - No SIHF-related styles found');
        console.log('   - Available styles:');
        allStylesData.styles.slice(0, 5).forEach(style => {
          console.log(`     - ${style.name} (ID: ${style._id})`);
        });
      }
    }
    
    console.log('\n🎯 DIAGNOSIS:');
    if (partnerData.partner.styleId) {
      console.log('   - Partner HAS a styleId assigned');
      console.log('   - Need to check if style loading is working in frontend');
    } else {
      console.log('   - Partner has NO styleId assigned');
      console.log('   - Should fall back to template style or default');
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugPartnerStyleLoading().catch(console.error);