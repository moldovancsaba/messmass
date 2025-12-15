// WHAT: Debug why partner style is still not being applied
// WHY: Need to identify the exact issue with style application

async function debugStyleApplication() {
  console.log('🎨 Debugging Style Application Issue');
  console.log('===================================');
  
  const sihfSlug = '903f80ab-e105-4aaa-8c42-2caf71a46954';
  
  try {
    // Test the partner API to see what data is returned
    console.log('1️⃣ Testing Partner API Response...');
    const partnerResponse = await fetch(`http://localhost:3001/api/partners/report/${sihfSlug}`);
    const partnerData = await partnerResponse.json();
    
    if (partnerData.success) {
      console.log('✅ Partner API Response:');
      console.log(`   - Partner Name: ${partnerData.partner.name}`);
      console.log(`   - Partner ID: ${partnerData.partner._id}`);
      console.log(`   - StyleId: ${partnerData.partner.styleId || 'MISSING'}`);
      console.log(`   - ReportTemplateId: ${partnerData.partner.reportTemplateId || 'MISSING'}`);
      
      // Test if the style API works with this styleId
      if (partnerData.partner.styleId) {
        console.log('\n2️⃣ Testing Style API...');
        const styleResponse = await fetch(`http://localhost:3001/api/page-styles-enhanced?styleId=${partnerData.partner.styleId}`);
        const styleData = await styleResponse.json();
        
        if (styleData.success && styleData.style) {
          console.log('✅ Style API Response:');
          console.log(`   - Style Name: ${styleData.style.name}`);
          console.log(`   - Font Family: ${styleData.style.typography?.fontFamily || 'MISSING'}`);
          console.log(`   - Primary Color: ${styleData.style.typography?.primaryTextColor || 'MISSING'}`);
          console.log(`   - Background Type: ${styleData.style.pageBackground?.type || 'MISSING'}`);
          console.log(`   - Background Color: ${styleData.style.pageBackground?.solidColor || 'MISSING'}`);
          
          // Test CSS generation
          console.log('\n3️⃣ Testing CSS Generation...');
          let backgroundCSS = '';
          if (styleData.style.pageBackground?.type === 'solid') {
            backgroundCSS = styleData.style.pageBackground.solidColor || '#ffffff';
          }
          
          console.log(`   - Generated Background CSS: ${backgroundCSS}`);
          console.log(`   - With !important: ${backgroundCSS} !important`);
          
          const completeStyle = {
            background: `${backgroundCSS} !important`,
            color: styleData.style.typography?.primaryTextColor || '#000000',
            fontFamily: styleData.style.typography?.fontFamily || 'inherit',
            minHeight: '100vh'
          };
          
          console.log('   - Complete Style Object:');
          console.log('    ', JSON.stringify(completeStyle, null, 4));
          
        } else {
          console.log('❌ Style API failed:', styleData.error);
        }
      } else {
        console.log('⚠️  Partner has no styleId - this is the problem!');
      }
      
    } else {
      console.log('❌ Partner API failed:', partnerData.error);
    }
    
    console.log('\n🎯 DIAGNOSIS:');
    console.log('If partner has styleId but style not applying:');
    console.log('1. Check browser console for style loading logs');
    console.log('2. Check if ResourceLoader is waiting for style');
    console.log('3. Check if CSS !important is working');
    console.log('4. Check for JavaScript errors preventing style application');
    
    console.log('\n🔍 BROWSER DEBUGGING:');
    console.log('1. Open browser dev tools');
    console.log('2. Go to partner report page');
    console.log('3. Check console for these logs:');
    console.log('   - "🎨 Partner has direct styleId - fetching: [ID]"');
    console.log('   - "✅ Using partner direct style: [NAME]"');
    console.log('   - "🎨 Style applied: [NAME]"');
    console.log('4. Inspect the main div element for inline styles');
    console.log('5. Check if Montserrat font is loaded in Network tab');
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugStyleApplication().catch(console.error);