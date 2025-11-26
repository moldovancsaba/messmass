#!/usr/bin/env tsx
// scripts/test-fanmass-integration.ts
// WHAT: Test script to verify Fanmass integration is working
// WHY: Validate that all endpoints are accessible and functioning correctly
// HOW: Test read, write, and validation flows

import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const BASE_URL = process.env.APP_BASE_URL || 'http://localhost:3000';
const API_TOKEN = process.env.FANMASS_API_TOKEN || '';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  details?: any;
}

const results: TestResult[] = [];

function logTest(result: TestResult) {
  results.push(result);
  const icon = result.passed ? '✅' : '❌';
  console.log(`${icon} ${result.name}`);
  if (!result.passed) {
    console.log(`   ${result.message}`);
    if (result.details) {
      console.log(`   Details:`, JSON.stringify(result.details, null, 2));
    }
  }
}

async function testReadEndpoint(eventId: string) {
  console.log('\n📖 Testing READ endpoint...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/public/events/${eventId}`, {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (response.status === 200 && data.success) {
      logTest({
        name: 'Read event data',
        passed: true,
        message: 'Successfully retrieved event data'
      });
      
      // Verify event structure
      if (data.event && data.event.id && data.event.eventName) {
        logTest({
          name: 'Event data structure',
          passed: true,
          message: 'Event has required fields'
        });
      } else {
        logTest({
          name: 'Event data structure',
          passed: false,
          message: 'Event missing required fields',
          details: data.event
        });
      }
      
      return data.event;
    } else {
      logTest({
        name: 'Read event data',
        passed: false,
        message: `Failed with status ${response.status}`,
        details: data
      });
      return null;
    }
  } catch (error) {
    logTest({
      name: 'Read event data',
      passed: false,
      message: `Request failed: ${error}`,
      details: error
    });
    return null;
  }
}

async function testWriteEndpoint(eventId: string) {
  console.log('\n✍️  Testing WRITE endpoint...');
  
  // Test 1: Valid data
  try {
    const validStats = {
      stats: {
        male: 100,
        female: 150,
        genAlpha: 50,
        merched: 75,
        remoteFans: 200
      },
      source: 'fanmass-test',
      metadata: {
        confidence: 0.95,
        processingTime: 1234
      }
    };
    
    const response = await fetch(`${BASE_URL}/api/public/events/${eventId}/stats`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(validStats)
    });
    
    const data = await response.json();
    
    if (response.status === 200 && data.success) {
      logTest({
        name: 'Write valid stats',
        passed: true,
        message: `Updated ${data.updatedFields?.length || 0} fields`
      });
    } else {
      logTest({
        name: 'Write valid stats',
        passed: false,
        message: `Failed with status ${response.status}`,
        details: data
      });
    }
  } catch (error) {
    logTest({
      name: 'Write valid stats',
      passed: false,
      message: `Request failed: ${error}`
    });
  }
  
  // Test 2: Invalid data (should be rejected)
  try {
    const invalidStats = {
      stats: {
        male: -10,  // Negative value should be rejected
        invalidField: 100  // Invalid field should be rejected
      }
    };
    
    const response = await fetch(`${BASE_URL}/api/public/events/${eventId}/stats`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(invalidStats)
    });
    
    const data = await response.json();
    
    if (response.status === 400 && !data.success) {
      logTest({
        name: 'Reject invalid stats',
        passed: true,
        message: 'Correctly rejected invalid data'
      });
    } else {
      logTest({
        name: 'Reject invalid stats',
        passed: false,
        message: 'Should have rejected invalid data',
        details: data
      });
    }
  } catch (error) {
    logTest({
      name: 'Reject invalid stats',
      passed: false,
      message: `Request failed: ${error}`
    });
  }
  
  // Test 3: Non-existent event (should return 404)
  try {
    const response = await fetch(`${BASE_URL}/api/public/events/000000000000000000000000/stats`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ stats: { male: 100 } })
    });
    
    const data = await response.json();
    
    if (response.status === 404) {
      logTest({
        name: 'Handle non-existent event',
        passed: true,
        message: 'Correctly returned 404 for non-existent event'
      });
    } else {
      logTest({
        name: 'Handle non-existent event',
        passed: false,
        message: `Expected 404, got ${response.status}`,
        details: data
      });
    }
  } catch (error) {
    logTest({
      name: 'Handle non-existent event',
      passed: false,
      message: `Request failed: ${error}`
    });
  }
}

async function testAuthentication() {
  console.log('\n🔐 Testing AUTHENTICATION...');
  
  // Test 1: Missing token
  try {
    const response = await fetch(`${BASE_URL}/api/public/events/000000000000000000000000`);
    const data = await response.json();
    
    if (response.status === 401) {
      logTest({
        name: 'Reject missing token',
        passed: true,
        message: 'Correctly rejected request without token'
      });
    } else {
      logTest({
        name: 'Reject missing token',
        passed: false,
        message: `Expected 401, got ${response.status}`,
        details: data
      });
    }
  } catch (error) {
    logTest({
      name: 'Reject missing token',
      passed: false,
      message: `Request failed: ${error}`
    });
  }
  
  // Test 2: Invalid token
  try {
    const response = await fetch(`${BASE_URL}/api/public/events/000000000000000000000000`, {
      headers: {
        'Authorization': 'Bearer invalid-token-12345'
      }
    });
    const data = await response.json();
    
    if (response.status === 401) {
      logTest({
        name: 'Reject invalid token',
        passed: true,
        message: 'Correctly rejected invalid token'
      });
    } else {
      logTest({
        name: 'Reject invalid token',
        passed: false,
        message: `Expected 401, got ${response.status}`,
        details: data
      });
    }
  } catch (error) {
    logTest({
      name: 'Reject invalid token',
      passed: false,
      message: `Request failed: ${error}`
    });
  }
}

async function main() {
  console.log('🚀 Fanmass Integration Test Suite\n');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`API Token: ${API_TOKEN ? '***' + API_TOKEN.slice(-4) : 'NOT SET'}\n`);
  
  if (!API_TOKEN) {
    console.log('❌ FANMASS_API_TOKEN not set in environment');
    console.log('   Set it in .env.local or pass as environment variable');
    console.log('   Example: FANMASS_API_TOKEN=your-token npm run test:fanmass\n');
    process.exit(1);
  }
  
  // Get event ID from command line or use default
  const eventId = process.argv[2];
  
  if (!eventId) {
    console.log('⚠️  No event ID provided');
    console.log('   Usage: npm run test:fanmass EVENT_ID');
    console.log('   Running authentication tests only...\n');
    
    await testAuthentication();
  } else {
    console.log(`Testing with event ID: ${eventId}\n`);
    
    await testAuthentication();
    const event = await testReadEndpoint(eventId);
    
    if (event) {
      await testWriteEndpoint(eventId);
    } else {
      console.log('\n⚠️  Skipping write tests (read failed)');
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Summary');
  console.log('='.repeat(50));
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;
  
  console.log(`Total: ${total} tests`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
  
  if (failed > 0) {
    console.log('\n❌ Some tests failed. Check the details above.');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed! Integration is working correctly.');
    process.exit(0);
  }
}

main().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
