// Test script to verify partner content merging works
// Run with: node scripts/test-partner-content-merge.js

const { MongoClient, ObjectId } = require('mongodb');

async function testPartnerContentMerge() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB);
    
    console.log('🔍 Testing partner content merge...\n');
    
    // 1. Get SIHF partner
    const partner = await db.collection('partners').findOne({ 
      viewSlug: '903f80ab-e105-4aaa-8c42-2caf71a46954' 
    });
    
    if (!partner) {
      console.error('❌ SIHF partner not found');
      return;
    }
    
    console.log('✅ Partner found:', partner.name);
    console.log('Partner stats keys:', Object.keys(partner.stats || {}));
    
    // 2. Add some test content to partner
    const testContent = {
      reportText1: 'Welcome to Swiss Ice Hockey Federation!',
      reportImage1: 'https://example.com/sihf-logo.png',
      reportText2: 'Official partner of Swiss ice hockey since 1908.'
    };
    
    console.log('\n📝 Adding test content to partner...');
    await db.collection('partners').updateOne(
      { _id: partner._id },
      { 
        $set: { 
          stats: { ...partner.stats, ...testContent },
          updatedAt: new Date().toISOString()
        } 
      }
    );
    
    // 3. Test API response
    console.log('\n🔍 Testing API response...');
    const response = await fetch('http://localhost:3001/api/partners/report/903f80ab-e105-4aaa-8c42-2caf71a46954');
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ API response successful');
      console.log('Partner stats in response:', Object.keys(data.partner.stats || {}));
      
      // Check if test content is included
      const hasText1 = data.partner.stats?.reportText1;
      const hasImage1 = data.partner.stats?.reportImage1;
      const hasText2 = data.partner.stats?.reportText2;
      
      console.log('\n📦 Partner content check:');
      console.log('  reportText1:', hasText1 ? '✅' : '❌');
      console.log('  reportImage1:', hasImage1 ? '✅' : '❌');
      console.log('  reportText2:', hasText2 ? '✅' : '❌');
      
      if (hasText1 && hasImage1 && hasText2) {
        console.log('\n🎉 SUCCESS: Partner content is included in API response!');
      } else {
        console.log('\n❌ ISSUE: Some partner content is missing from API response');
      }
    } else {
      console.error('❌ API response failed:', data.error);
    }
    
    // 4. Simulate frontend merge
    console.log('\n🔄 Simulating frontend data merge...');
    
    const events = data.events || [];
    const partnerData = data.partner || {};
    
    // Aggregate event stats (numeric only)
    const aggregateStats = {
      female: 0,
      male: 0,
      remoteImages: 0,
      hostessImages: 0,
      selfies: 0
    };
    
    events.forEach(event => {
      Object.keys(event.stats || {}).forEach(key => {
        const value = (event.stats || {})[key];
        if (typeof value === 'number' && aggregateStats.hasOwnProperty(key)) {
          aggregateStats[key] = (aggregateStats[key] || 0) + value;
        }
      });
    });
    
    // Merge partner content (text/image)
    if (partnerData.stats) {
      Object.keys(partnerData.stats).forEach(key => {
        const value = partnerData.stats[key];
        if (typeof value === 'string' && value.length > 0) {
          aggregateStats[key] = value; // Partner content
        }
      });
    }
    
    console.log('Final merged stats:');
    console.log('  Numeric (from events):', {
      female: aggregateStats.female,
      male: aggregateStats.male,
      totalImages: aggregateStats.remoteImages + aggregateStats.hostessImages + aggregateStats.selfies
    });
    console.log('  Content (from partner):', {
      reportText1: aggregateStats.reportText1 || 'missing',
      reportImage1: aggregateStats.reportImage1 || 'missing',
      reportText2: aggregateStats.reportText2 || 'missing'
    });
    
    const hasAllContent = aggregateStats.reportText1 && aggregateStats.reportImage1 && aggregateStats.reportText2;
    
    if (hasAllContent) {
      console.log('\n🎉 SUCCESS: Partner content successfully merged with event data!');
      console.log('Charts will now have access to both numeric data and partner content.');
    } else {
      console.log('\n❌ ISSUE: Partner content merge failed');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });

testPartnerContentMerge().catch(console.error);