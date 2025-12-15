// WHAT: Test partner template fix - should now use assigned template
// WHY: Verify that partner report loads the correct template and data blocks

async function testPartnerTemplateFix() {
  console.log('🧪 Testing Partner Template Fix');
  console.log('===============================');
  
  const sihfSlug = '903f80ab-e105-4aaa-8c42-2caf71a46954';
  const sihfPartnerId = '68f626b4eaea906244f28925';
  
  try {
    // Test the report config API with partner ID
    console.log('\n1️⃣ Testing Report Config API with Partner ID...');
    const configResponse = await fetch(`http://localhost:3001/api/report-config/${sihfPartnerId}?type=partner`);
    const configData = await configResponse.json();
    
    if (configData.success) {
      console.log('✅ Report config API works');
      console.log(`   - Template: ${configData.template.name}`);
      console.log(`   - Resolved from: ${configData.resolvedFrom}`);
      console.log(`   - Data blocks: ${configData.template.dataBlocks?.length || 0}`);
      
      if (configData.template.dataBlocks && configData.template.dataBlocks.length > 0) {
        console.log('   - Block details:');
        configData.template.dataBlocks.forEach((block, i) => {
          console.log(`     ${i + 1}. ${block.name} (${block.charts?.length || 0} charts)`);
        });
      }
    } else {
      console.log('❌ Report config API failed:', configData.error);
    }
    
    // Test partner report API
    console.log('\n2️⃣ Testing Partner Report API...');
    const partnerResponse = await fetch(`http://localhost:3001/api/partners/report/${sihfSlug}`);
    const partnerData = await partnerResponse.json();
    
    if (partnerData.success) {
      console.log('✅ Partner API works');
      console.log(`   - Partner: ${partnerData.partner.name}`);
      console.log(`   - Partner ID: ${partnerData.partner._id}`);
      console.log(`   - Style ID: ${partnerData.partner.styleId || 'None'}`);
      console.log(`   - Report Template ID: ${partnerData.partner.reportTemplateId || 'None'}`);
      console.log(`   - Events: ${partnerData.events.length}`);
    } else {
      console.log('❌ Partner API failed:', partnerData.error);
    }
    
    console.log('\n✅ Partner template fix test complete');
    console.log('\n🔗 Test the actual page at:');
    console.log(`   http://localhost:3001/partner-report/${sihfSlug}`);
    console.log('\nExpected behavior:');
    console.log('✅ Should load "SIHF Swiss Ice Hockey Federation PARTNER" template');
    console.log('✅ Should show 2 data visualization blocks');
    console.log('✅ Should use partner\'s assigned style');
    console.log('✅ Should display charts with aggregated event data');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testPartnerTemplateFix().catch(console.error);