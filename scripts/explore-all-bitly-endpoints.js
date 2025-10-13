// Script to test ALL available Bitly API v4 analytics endpoints
// WHAT: Comprehensive exploration of every metric Bitly provides
// WHY: Need to know exact response formats for all data types
require('dotenv').config({ path: '.env.local' });

const bitlink = 'fanselfie.me/ea';
const token = process.env.BITLY_ACCESS_TOKEN;

// ALL KNOWN BITLY API v4 ANALYTICS ENDPOINTS
const endpoints = [
  { name: 'Clicks Summary', path: '/clicks/summary', params: '' },
  { name: 'Clicks Timeseries', path: '/clicks', params: '?unit=day&units=-1' },
  { name: 'Countries', path: '/countries', params: '' },
  { name: 'Cities', path: '/cities', params: '' },
  { name: 'Referrers', path: '/referrers', params: '' },
  { name: 'Referring Domains', path: '/referring_domains', params: '' },
  { name: 'Referring Networks', path: '/referring_networks', params: '' },
  { name: 'Devices', path: '/devices', params: '' },
  { name: 'Shorten Counts', path: '/shorten_counts', params: '' },
];

async function testEndpoint(endpoint) {
  const url = `https://api-ssl.bitly.com/v4/bitlinks/${bitlink}${endpoint.path}${endpoint.params}`;
  
  console.log(`\n${'='.repeat(80)}`);
  console.log(`TESTING: ${endpoint.name}`);
  console.log(`URL: ${url}`);
  console.log(`${'='.repeat(80)}\n`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`\n❌ ERROR Response:`);
      console.log(errorText);
      
      // Check if it's a plan limitation
      if (response.status === 403 || response.status === 402) {
        console.log(`\n⚠️  This endpoint may require a higher Bitly plan tier`);
      }
      
      return { success: false, error: errorText };
    }
    
    const data = await response.json();
    
    console.log(`\n✅ SUCCESS - Response:`);
    console.log(JSON.stringify(data, null, 2));
    
    // Analyze response structure
    console.log(`\n📊 ANALYSIS:`);
    if (data.metrics && Array.isArray(data.metrics)) {
      console.log(`  Total metrics: ${data.metrics.length}`);
      if (data.metrics.length > 0) {
        console.log(`  Sample metric structure:`);
        console.log(`  ${JSON.stringify(data.metrics[0], null, 4)}`);
        
        // Check for 'value' vs other field names
        const firstMetric = data.metrics[0];
        const keys = Object.keys(firstMetric);
        console.log(`  Field names: ${keys.join(', ')}`);
      }
    }
    
    if (data.unit) console.log(`  Time unit: ${data.unit}`);
    if (data.units) console.log(`  Time units: ${data.units}`);
    if (data.unit_reference) console.log(`  Reference: ${data.unit_reference}`);
    if (data.facet) console.log(`  Facet: ${data.facet}`);
    
    return { success: true, data };
    
  } catch (error) {
    console.log(`\n❌ FETCH ERROR:`);
    console.log(error.message);
    return { success: false, error: error.message };
  }
}

async function exploreAllEndpoints() {
  if (!token) {
    console.error('❌ BITLY_ACCESS_TOKEN not found in environment');
    console.error('\nTo run this test:');
    console.error('1. Add BITLY_ACCESS_TOKEN=your_token to .env.local');
    console.error('2. Or temporarily set: export BITLY_ACCESS_TOKEN="your_token"');
    return;
  }
  
  console.log('🔍 EXPLORING ALL BITLY API v4 ANALYTICS ENDPOINTS');
  console.log(`Bitlink: ${bitlink}`);
  console.log(`Total endpoints to test: ${endpoints.length}\n`);
  
  const results = {
    successful: [],
    failed: [],
    planLimited: [],
  };
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    
    if (result.success) {
      results.successful.push(endpoint.name);
    } else {
      if (result.error && (result.error.includes('403') || result.error.includes('402'))) {
        results.planLimited.push(endpoint.name);
      } else {
        results.failed.push(endpoint.name);
      }
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Summary
  console.log(`\n\n${'='.repeat(80)}`);
  console.log('📋 SUMMARY');
  console.log(`${'='.repeat(80)}\n`);
  
  console.log(`✅ Successful Endpoints (${results.successful.length}):`);
  results.successful.forEach(name => console.log(`   - ${name}`));
  
  console.log(`\n⚠️  Plan-Limited Endpoints (${results.planLimited.length}):`);
  if (results.planLimited.length > 0) {
    results.planLimited.forEach(name => console.log(`   - ${name}`));
    console.log(`\n   These endpoints may require Enterprise plan or higher.`);
  } else {
    console.log(`   None - all tested endpoints are available!`);
  }
  
  console.log(`\n❌ Failed Endpoints (${results.failed.length}):`);
  if (results.failed.length > 0) {
    results.failed.forEach(name => console.log(`   - ${name}`));
  } else {
    console.log(`   None - all endpoints either succeeded or are plan-limited.`);
  }
  
  console.log(`\n${'='.repeat(80)}`);
  console.log('NEXT STEPS:');
  console.log('1. Review successful endpoint responses above');
  console.log('2. Note field names (especially "value" vs other field names)');
  console.log('3. Update TypeScript interfaces based on actual responses');
  console.log('4. Add API client functions for available endpoints');
  console.log('5. Update sync service to fetch all available data');
  console.log(`${'='.repeat(80)}\n`);
}

exploreAllEndpoints();
