#!/usr/bin/env node
/**
 * FIX BROKEN CHARTS
 * 
 * WHAT: Updates chart formulas to use correct stats. prefix from KYC
 * WHY: Some charts use old uppercase tokens or incorrect variable names
 * HOW: Query database, fix formulas, update documents
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function fixCharts() {
  console.log('🔧 Fixing Broken Chart Formulas\n');
  
  await client.connect();
  const db = client.db('messmass');
  const col = db.collection('chartConfigurations');
  
  const fixes = [];
  
  // Fix 1: Calculated Merchandise Penetration
  const merchChart = await col.findOne({ chartId: 'merchandise-distribution' });
  if (merchChart) {
    console.log('📊 Found: Calculated Merchandise Penetration');
    console.log('   Old formulas use [JERSEY], [EVENT_ATTENDEES], etc.');
    console.log('   → Updating to [stats.jersey], [stats.eventAttendees]\n');
    
    await col.updateOne(
      { chartId: 'merchandise-distribution' },
      {
        $set: {
          elements: [
            {
              id: 'jersey-penetration',
              label: 'Jersey',
              formula: '[stats.jersey] * ([stats.eventAttendees] + 1) / ([stats.totalFans] + 1)',
              color: '#7b68ee',
              description: 'Jersey penetration adjusted for attendance'
            },
            {
              id: 'scarf-penetration',
              label: 'Scarf',
              formula: '[stats.scarf] * ([stats.eventAttendees] + 1) / ([stats.totalFans] + 1)',
              color: '#ff6b9d',
              description: 'Scarf penetration adjusted for attendance'
            },
            {
              id: 'flags-penetration',
              label: 'Flags',
              formula: '[stats.flags] * ([stats.eventAttendees] + 1) / ([stats.totalFans] + 1)',
              color: '#ffa726',
              description: 'Flags penetration adjusted for attendance'
            },
            {
              id: 'cap-penetration',
              label: 'Baseball Cap',
              formula: '[stats.baseballCap] * ([stats.eventAttendees] + 1) / ([stats.totalFans] + 1)',
              color: '#66bb6a',
              description: 'Baseball cap penetration adjusted for attendance'
            },
            {
              id: 'other-penetration',
              label: 'Other',
              formula: '[stats.other] * ([stats.eventAttendees] + 1) / ([stats.totalFans] + 1)',
              color: '#ef5350',
              description: 'Other merchandise penetration adjusted for attendance'
            }
          ],
          updatedAt: new Date().toISOString()
        }
      }
    );
    fixes.push('✅ Fixed: Calculated Merchandise Penetration');
  }
  
  // Fix 2: Top Country KPI
  const topCountryChart = await col.findOne({ chartId: 'bitly-top-country' });
  if (topCountryChart) {
    console.log('📊 Found: Top Country');
    console.log('   Old label: {{bitlyTopCountry}}');
    console.log('   → Updating to {{stats.bitlyTopCountry}}\n');
    
    await col.updateOne(
      { chartId: 'bitly-top-country' },
      {
        $set: {
          'elements.0.label': '{{stats.bitlyTopCountry}}',
          'elements.0.formula': '[stats.bitlyClicksByCountry]',
          'elements.0.description': 'Top country by Bitly clicks with click count',
          updatedAt: new Date().toISOString()
        }
      }
    );
    fixes.push('✅ Fixed: Top Country');
  }
  
  // Fix 3: Check Countries Reached
  const countriesChart = await col.findOne({ chartId: 'bitly-countries-reached' });
  if (countriesChart) {
    console.log('📊 Found: Countries Reached');
    console.log('   Current formula:', countriesChart.elements[0].formula);
    
    if (countriesChart.elements[0].formula === '[stats.bitlyCountryCount]') {
      console.log('   ✓ Already correct!\n');
    } else {
      console.log('   → Updating to [stats.bitlyCountryCount]\n');
      await col.updateOne(
        { chartId: 'bitly-countries-reached' },
        {
          $set: {
            'elements.0.formula': '[stats.bitlyCountryCount]',
            updatedAt: new Date().toISOString()
          }
        }
      );
      fixes.push('✅ Fixed: Countries Reached');
    }
  }
  
  await client.close();
  
  console.log('\n═══════════════════════════════════');
  console.log('🎉 Fixed Charts Summary:');
  fixes.forEach(fix => console.log(fix));
  console.log(`\nTotal: ${fixes.length} charts fixed`);
  console.log('═══════════════════════════════════\n');
}

fixCharts().catch(console.error);
