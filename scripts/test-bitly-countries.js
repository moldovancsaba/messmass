// Script to test Bitly countries API for fanselfie.me/ea
require('dotenv').config({ path: '.env.local' });

async function testBitlyCountries() {
  const bitlink = 'fanselfie.me/ea';
  const token = process.env.BITLY_ACCESS_TOKEN;
  
  if (!token) {
    console.error('❌ BITLY_ACCESS_TOKEN not found in environment');
    console.error('\nTo run this test:');
    console.error('1. Add BITLY_ACCESS_TOKEN=your_token to .env.local');
    console.error('2. Or temporarily set: export BITLY_ACCESS_TOKEN="your_token"');
    console.error('\nAlternatively, sync will show debug output when run from admin UI.');
    return;
  }
  
  console.log('Testing Bitly Countries API');
  console.log('=============================\n');
  console.log(`Bitlink: ${bitlink}`);
  console.log(`API Endpoint: https://api-ssl.bitly.com/v4/bitlinks/${bitlink}/countries\n`);
  
  try {
    const response = await fetch(
      `https://api-ssl.bitly.com/v4/bitlinks/${bitlink}/countries`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    console.log(`Response Status: ${response.status} ${response.statusText}\n`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:');
      console.error(errorText);
      return;
    }
    
    const data = await response.json();
    
    console.log('✅ API Response Received\n');
    console.log('=== FULL RAW RESPONSE ===');
    console.log(JSON.stringify(data, null, 2));
    console.log('\n=== ANALYSIS ===');
    
    if (data.metrics && Array.isArray(data.metrics)) {
      console.log(`Total metrics: ${data.metrics.length}`);
      
      const nullCountries = data.metrics.filter(m => m.country === null || m.country === undefined);
      const validCountries = data.metrics.filter(m => m.country !== null && m.country !== undefined);
      
      console.log(`Metrics with NULL country: ${nullCountries.length}`);
      console.log(`Metrics with VALID country: ${validCountries.length}`);
      
      if (nullCountries.length > 0) {
        console.log('\n⚠️  NULL COUNTRY SAMPLES:');
        nullCountries.slice(0, 5).forEach((m, i) => {
          console.log(`  ${i + 1}. country: ${m.country}, clicks: ${m.clicks}`);
        });
      }
      
      if (validCountries.length > 0) {
        console.log('\n✅ VALID COUNTRY SAMPLES:');
        validCountries.slice(0, 5).forEach((m, i) => {
          console.log(`  ${i + 1}. country: ${m.country}, clicks: ${m.clicks}`);
        });
      }
      
      console.log('\n=== METADATA ===');
      console.log(`unit: ${data.unit || 'N/A'}`);
      console.log(`units: ${data.units || 'N/A'}`);
      console.log(`unit_reference: ${data.unit_reference || 'N/A'}`);
      
    } else {
      console.log('⚠️  No metrics array found in response');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

testBitlyCountries();
