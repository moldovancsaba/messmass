// WHAT: Test universal partner style system for ALL partners
// WHY: System must work for every partner, not just SIHF

const { MongoClient } = require('mongodb');

async function testUniversalPartnerStyles() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB);
    
    console.log('🌍 Testing Universal Partner Style System');
    console.log('========================================');
    
    // Get ALL partners to test universal system
    const allPartners = await db.collection('partners').find({}).toArray();
    
    console.log(`📊 Found ${allPartners.length} total partners`);
    console.log('');
    
    // Analyze partner style configurations
    let partnersWithStyles = 0;
    let partnersWithTemplates = 0;
    let partnersWithViewSlugs = 0;
    
    console.log('🔍 Partner Style Analysis:');
    console.log('');
    
    allPartners.forEach((partner, i) => {
      const hasStyle = !!partner.styleId;
      const hasTemplate = !!partner.reportTemplateId;
      const hasViewSlug = !!partner.viewSlug;
      
      if (hasStyle) partnersWithStyles++;
      if (hasTemplate) partnersWithTemplates++;
      if (hasViewSlug) partnersWithViewSlugs++;
      
      if (i < 10) { // Show first 10 partners
        console.log(`${i + 1}. ${partner.name}`);
        console.log(`   - StyleId: ${partner.styleId || 'NONE'}`);
        console.log(`   - TemplateId: ${partner.reportTemplateId || 'NONE'}`);
        console.log(`   - ViewSlug: ${partner.viewSlug || 'NONE'}`);
        console.log('');
      }
    });
    
    console.log('📈 Summary:');
    console.log(`   - Partners with styles: ${partnersWithStyles}/${allPartners.length}`);
    console.log(`   - Partners with templates: ${partnersWithTemplates}/${allPartners.length}`);
    console.log(`   - Partners with viewSlugs: ${partnersWithViewSlugs}/${allPartners.length}`);
    console.log('');
    
    // Test universal system requirements
    console.log('🎯 Universal System Requirements:');
    console.log('');
    console.log('✅ 1. Partners WITH styleId → Use their custom style');
    console.log('✅ 2. Partners WITHOUT styleId → Use default/template style');
    console.log('✅ 3. Partners WITH templateId → Use their custom template');
    console.log('✅ 4. Partners WITHOUT templateId → Use default template');
    console.log('✅ 5. ALL partners → Must have working report pages');
    console.log('');
    
    // Find partners with different configurations for testing
    const partnerWithStyle = allPartners.find(p => p.styleId);
    const partnerWithoutStyle = allPartners.find(p => !p.styleId);
    const partnerWithTemplate = allPartners.find(p => p.reportTemplateId);
    const partnerWithoutTemplate = allPartners.find(p => !p.reportTemplateId);
    
    console.log('🧪 Test Cases:');
    console.log('');
    
    if (partnerWithStyle) {
      console.log(`1. Partner WITH style: ${partnerWithStyle.name}`);
      console.log(`   - StyleId: ${partnerWithStyle.styleId}`);
      console.log(`   - ViewSlug: ${partnerWithStyle.viewSlug || 'MISSING'}`);
      if (partnerWithStyle.viewSlug) {
        console.log(`   - Test URL: http://localhost:3001/partner-report/${partnerWithStyle.viewSlug}`);
      }
      console.log('');
    }
    
    if (partnerWithoutStyle) {
      console.log(`2. Partner WITHOUT style: ${partnerWithoutStyle.name}`);
      console.log(`   - Should use default styling`);
      console.log(`   - ViewSlug: ${partnerWithoutStyle.viewSlug || 'MISSING'}`);
      if (partnerWithoutStyle.viewSlug) {
        console.log(`   - Test URL: http://localhost:3001/partner-report/${partnerWithoutStyle.viewSlug}`);
      }
      console.log('');
    }
    
    console.log('🚀 UNIVERSAL SYSTEM GOALS:');
    console.log('');
    console.log('✅ Every partner report page must load');
    console.log('✅ Partners with styles get custom styling');
    console.log('✅ Partners without styles get default styling');
    console.log('✅ No hardcoded partner-specific logic');
    console.log('✅ Graceful fallbacks for missing data');
    console.log('✅ Consistent behavior across all partners');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await client.close();
  }
}

// Run if called directly
if (require.main === module) {
  require('dotenv').config({ path: '.env.local' });
  testUniversalPartnerStyles().catch(console.error);
}

module.exports = { testUniversalPartnerStyles };