// WHAT: Debug the complete frontend style flow
// WHY: Partner style is still not applying - need to trace the entire flow

async function debugFrontendStyleFlow() {
  console.log('🔍 Debugging Complete Frontend Style Flow');
  console.log('=========================================');
  
  const sihfSlug = '903f80ab-e105-4aaa-8c42-2caf71a46954';
  const sihfPartnerId = '68f626b4eaea906244f28925';
  
  try {
    console.log('🔗 Partner Report URL: http://localhost:3001/partner-report/' + sihfSlug);
    console.log('');
    
    // Step 1: Test partner API (this should work)
    console.log('1️⃣ Partner API Call...');
    const partnerResponse = await fetch(`http://localhost:3001/api/partners/report/${sihfSlug}`);
    const partnerData = await partnerResponse.json();
    
    if (!partnerData.success) {
      console.log('❌ Partner API failed:', partnerData.error);
      return;
    }
    
    console.log('✅ Partner API Response:');
    console.log(`   - Name: ${partnerData.partner.name}`);
    console.log(`   - StyleId: ${partnerData.partner.styleId}`);
    console.log(`   - ReportTemplateId: ${partnerData.partner.reportTemplateId}`);
    
    // Step 2: Test report config API (this loads template)
    console.log('\n2️⃣ Report Config API Call...');
    const configResponse = await fetch(`http://localhost:3001/api/report-config/${partnerData.partner._id}?type=partner`);
    const configData = await configResponse.json();
    
    if (!configData.success) {
      console.log('❌ Report config API failed:', configData.error);
      return;
    }
    
    console.log('✅ Report Config Response:');
    console.log(`   - Template: ${configData.template.name}`);
    console.log(`   - Resolved from: ${configData.resolvedFrom}`);
    console.log(`   - Template styleId: ${configData.template.styleId || 'NONE'}`);
    
    // Step 3: Test style API (this should load partner style)
    console.log('\n3️⃣ Style API Call...');
    if (partnerData.partner.styleId) {
      const styleResponse = await fetch(`http://localhost:3001/api/page-styles-enhanced?styleId=${partnerData.partner.styleId}`);
      const styleData = await styleResponse.json();
      
      if (!styleData.success) {
        console.log('❌ Style API failed:', styleData.error);
        return;
      }
      
      console.log('✅ Style API Response:');
      console.log(`   - Style: ${styleData.style.name}`);
      console.log(`   - Font: ${styleData.style.typography?.fontFamily}`);
      console.log(`   - Color: ${styleData.style.typography?.primaryTextColor}`);
      console.log(`   - Background: ${JSON.stringify(styleData.style.pageBackground)}`);
      
      // Step 4: Simulate frontend style processing
      console.log('\n4️⃣ Frontend Style Processing Simulation...');
      
      // Simulate generateGradientCSS
      let backgroundCSS = '';
      if (styleData.style.pageBackground?.type === 'solid') {
        backgroundCSS = styleData.style.pageBackground.solidColor || '#ffffff';
      } else if (styleData.style.pageBackground?.type === 'gradient') {
        const angle = styleData.style.pageBackground.gradientAngle || 135;
        const stops = styleData.style.pageBackground.gradientStops
          ?.map(stop => `${stop.color} ${stop.position}%`)
          .join(', ') || '';
        backgroundCSS = `linear-gradient(${angle}deg, ${stops})`;
      }
      
      const safeColor = styleData.style.typography?.primaryTextColor?.trim() || undefined;
      const safeFont = styleData.style.typography?.fontFamily?.trim() || undefined;
      
      const finalStyle = {
        minHeight: '100vh',
        background: backgroundCSS,
        color: safeColor,
        fontFamily: safeFont
      };
      
      console.log('✅ Final Style Object:');
      console.log('   ', JSON.stringify(finalStyle, null, 4));
      
    } else {
      console.log('⚠️  Partner has no styleId');
    }
    
    console.log('\n🎯 DEBUGGING CHECKLIST:');
    console.log('');
    console.log('✅ 1. Partner API returns styleId');
    console.log('✅ 2. Style API returns style data');
    console.log('✅ 3. Style processing works correctly');
    console.log('');
    console.log('❓ POTENTIAL FRONTEND ISSUES:');
    console.log('1. fetchReportTemplate not calling style API');
    console.log('2. setPageStyle not being called');
    console.log('3. pageStyle state not updating');
    console.log('4. ResourceLoader blocking render');
    console.log('5. Style object not being applied to DOM');
    console.log('');
    console.log('🔍 BROWSER DEBUGGING STEPS:');
    console.log('1. Open browser dev tools');
    console.log('2. Go to partner report page');
    console.log('3. Check console for these logs:');
    console.log('   - "🎨 Partner has direct styleId - fetching: [ID]"');
    console.log('   - "✅ Using partner direct style: [NAME]"');
    console.log('   - "🎨 Style applied: [NAME]"');
    console.log('   - "🎨 Applying partner style: {...}"');
    console.log('4. Check Network tab for style API call');
    console.log('5. Inspect main div for inline styles');
    console.log('6. Check React DevTools for pageStyle state');
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugFrontendStyleFlow().catch(console.error);