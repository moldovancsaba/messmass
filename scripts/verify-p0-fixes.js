// scripts/verify-p0-fixes.js
// Verification script for Chart System P0 Hardening
// Connects to MongoDB Atlas and validates all 5 P0 fixes

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_NAME = 'messmass';
const COLLECTION_NAME = 'chartConfigurations';

// Expected P0 fix states
const EXPECTED_FIXES = {
  engagement: {
    chartId: 'engagement',
    elements: [
      { id: 'engaged', formula: '([SEYUTOTALFANS]) / [SEYUATTENDEES] * 100' },
      { id: 'interactive', formula: '([SEYUSOCIALVISIT] + [SEYUPROPOSITIONVISIT] + [SEYUPROPOSITIONPURCHASE]) / ([SEYUTOTALIMAGES]) * 100' },
      { id: 'front-runners', formula: '[SEYUMERCHEDFANS] / ([SEYUTOTALFANS]) * 100' },
      { id: 'fanaticals', formula: '([SEYUFLAGS] + [SEYUMERCHSCARF]) / [SEYUMERCHEDFANS] * 100' },
      { id: 'casuals', formula: '(([SEYUTOTALFANS]) - [SEYUMERCHEDFANS]) / ([SEYUTOTALFANS]) * 100' }
    ]
  },
  remoteVsEvent: {
    chartId: 'Remote vs Event',
    elements: [
      { id: 'event', formula: '[SEYUSTADIUMFANS]' },
      { id: 'remote', formula: '[SEYUREMOTEFANS]' }
    ]
  },
  merchandise: {
    chartId: 'merchandise',
    totalLabel: 'Total items'
  },
  vpConversion: {
    chartId: 'value-prop-conversion-rate',
    formula: '[SEYUPROPOSITIONPURCHASE] / [SEYUPROPOSITIONVISIT] * 100'
  },
  faces: {
    chartId: 'faces',
    isActive: false
  }
};

async function verifyP0Fixes() {
  let client;
  const results = {
    timestamp: new Date().toISOString(),
    fixes: [],
    passed: 0,
    failed: 0
  };

  try {
    console.log('🔗 Connecting to MongoDB Atlas...');
    console.log(`📍 Database: ${DATABASE_NAME}`);
    console.log(`📂 Collection: ${COLLECTION_NAME}\n`);
    
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DATABASE_NAME);
    const col = db.collection(COLLECTION_NAME);

    // ============================================
    // Fix 1: Engagement Chart Formulas
    // ============================================
    console.log('🔍 P0-001: Verifying Engagement Chart Formulas...');
    const engagementChart = await col.findOne({ chartId: 'engagement' });
    
    const fix1Result = {
      id: 'P0-001',
      name: 'Engagement Chart Formulas',
      status: 'PASS',
      details: []
    };

    if (!engagementChart) {
      fix1Result.status = 'FAIL';
      fix1Result.details.push('❌ Chart not found');
    } else {
      EXPECTED_FIXES.engagement.elements.forEach((expected, idx) => {
        const actual = engagementChart.elements[idx];
        if (actual.id === expected.id && actual.formula === expected.formula) {
          fix1Result.details.push(`✅ ${expected.id}: ${expected.formula}`);
        } else {
          fix1Result.status = 'FAIL';
          fix1Result.details.push(`❌ ${expected.id}: Expected "${expected.formula}", got "${actual?.formula || 'N/A'}"`);
        }
      });
    }
    
    results.fixes.push(fix1Result);
    console.log(`   ${fix1Result.status === 'PASS' ? '✅' : '❌'} ${fix1Result.status}\n`);

    // ============================================
    // Fix 2: Remote vs Event (Fans)
    // ============================================
    console.log('🔍 P0-002: Verifying Remote vs Event Chart...');
    const remoteChart = await col.findOne({ chartId: 'Remote vs Event' });
    
    const fix2Result = {
      id: 'P0-002',
      name: 'Remote vs Event (Fans)',
      status: 'PASS',
      details: []
    };

    if (!remoteChart) {
      fix2Result.status = 'FAIL';
      fix2Result.details.push('❌ Chart not found');
    } else {
      EXPECTED_FIXES.remoteVsEvent.elements.forEach((expected, idx) => {
        const actual = remoteChart.elements[idx];
        if (actual.id === expected.id && actual.formula === expected.formula) {
          fix2Result.details.push(`✅ ${expected.id}: ${expected.formula}`);
        } else {
          fix2Result.status = 'FAIL';
          fix2Result.details.push(`❌ ${expected.id}: Expected "${expected.formula}", got "${actual?.formula || 'N/A'}"`);
        }
      });
    }
    
    results.fixes.push(fix2Result);
    console.log(`   ${fix2Result.status === 'PASS' ? '✅' : '❌'} ${fix2Result.status}\n`);

    // ============================================
    // Fix 3: Merchandise Total Label
    // ============================================
    console.log('🔍 P0-003: Verifying Merchandise Total Label...');
    const merchChart = await col.findOne({ chartId: 'merchandise' });
    
    const fix3Result = {
      id: 'P0-003',
      name: 'Merchandise Total Label',
      status: 'PASS',
      details: []
    };

    if (!merchChart) {
      fix3Result.status = 'FAIL';
      fix3Result.details.push('❌ Chart not found');
    } else if (merchChart.totalLabel === EXPECTED_FIXES.merchandise.totalLabel) {
      fix3Result.details.push(`✅ Total Label: "${merchChart.totalLabel}"`);
    } else {
      fix3Result.status = 'FAIL';
      fix3Result.details.push(`❌ Expected "Total items", got "${merchChart.totalLabel || 'N/A'}"`);
    }
    
    results.fixes.push(fix3Result);
    console.log(`   ${fix3Result.status === 'PASS' ? '✅' : '❌'} ${fix3Result.status}\n`);

    // ============================================
    // Fix 4: VP Conversion Formula
    // ============================================
    console.log('🔍 P0-004: Verifying VP Conversion Formula...');
    const vpChart = await col.findOne({ chartId: 'value-prop-conversion-rate' });
    
    const fix4Result = {
      id: 'P0-004',
      name: 'VP Conversion Formula',
      status: 'PASS',
      details: []
    };

    if (!vpChart) {
      fix4Result.status = 'FAIL';
      fix4Result.details.push('❌ Chart not found');
    } else if (vpChart.elements[0]?.formula === EXPECTED_FIXES.vpConversion.formula) {
      fix4Result.details.push(`✅ Formula: ${vpChart.elements[0].formula}`);
    } else {
      fix4Result.status = 'FAIL';
      fix4Result.details.push(`❌ Expected "${EXPECTED_FIXES.vpConversion.formula}", got "${vpChart.elements[0]?.formula || 'N/A'}"`);
    }
    
    results.fixes.push(fix4Result);
    console.log(`   ${fix4Result.status === 'PASS' ? '✅' : '❌'} ${fix4Result.status}\n`);

    // ============================================
    // Fix 5: Faces KPI Deactivated
    // ============================================
    console.log('🔍 P0-005: Verifying Faces KPI Deactivation...');
    const facesChart = await col.findOne({ chartId: 'faces' });
    
    const fix5Result = {
      id: 'P0-005',
      name: 'Faces KPI Deactivated',
      status: 'PASS',
      details: []
    };

    if (!facesChart) {
      fix5Result.status = 'FAIL';
      fix5Result.details.push('❌ Chart not found');
    } else if (facesChart.isActive === false) {
      fix5Result.details.push(`✅ isActive: false`);
    } else {
      fix5Result.status = 'FAIL';
      fix5Result.details.push(`❌ Expected isActive=false, got ${facesChart.isActive}`);
    }
    
    results.fixes.push(fix5Result);
    console.log(`   ${fix5Result.status === 'PASS' ? '✅' : '❌'} ${fix5Result.status}\n`);

    // ============================================
    // Summary
    // ============================================
    results.passed = results.fixes.filter(f => f.status === 'PASS').length;
    results.failed = results.fixes.filter(f => f.status === 'FAIL').length;

    console.log('═══════════════════════════════════════════════');
    console.log('📊 P0 VERIFICATION REPORT');
    console.log('═══════════════════════════════════════════════');
    console.log(`Timestamp: ${results.timestamp}`);
    console.log(`Total Fixes: ${results.fixes.length}`);
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log('═══════════════════════════════════════════════\n');

    results.fixes.forEach(fix => {
      console.log(`${fix.status === 'PASS' ? '✅' : '❌'} ${fix.id}: ${fix.name}`);
      fix.details.forEach(detail => console.log(`   ${detail}`));
      console.log('');
    });

    console.log('═══════════════════════════════════════════════');
    
    if (results.failed === 0) {
      console.log('✅ ALL P0 FIXES VERIFIED IN PRODUCTION');
    } else {
      console.log('❌ VERIFICATION FAILED - ACTION REQUIRED');
    }
    console.log('═══════════════════════════════════════════════\n');

    // Save report to file
    const fs = require('fs');
    fs.writeFileSync(
      'scripts/p0-verification-report.json',
      JSON.stringify(results, null, 2)
    );
    console.log('💾 Report saved to: scripts/p0-verification-report.json\n');

    process.exit(results.failed > 0 ? 1 : 0);

  } catch (err) {
    console.error('❌ Verification Error:', err);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('✅ Database connection closed');
    }
  }
}

verifyP0Fixes();
