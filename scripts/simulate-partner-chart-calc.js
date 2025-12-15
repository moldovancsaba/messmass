// WHAT: Simulate partner chart calculation exactly like frontend
// WHY: Test if chart calculation works with aggregate stats

const { MongoClient, ObjectId } = require('mongodb');

// Simple chart calculator simulation
function calculateChart(chartConfig, stats) {
  if (!chartConfig.elements || chartConfig.elements.length === 0) {
    return null;
  }
  
  const results = [];
  
  for (const element of chartConfig.elements) {
    if (!element.formula) continue;
    
    try {
      // Replace stats.field references
      let formula = element.formula;
      const statsRefs = formula.match(/stats\.(\w+)/g);
      
      if (statsRefs) {
        for (const ref of statsRefs) {
          const field = ref.replace('stats.', '');
          const value = stats[field] || 0;
          formula = formula.replace(ref, value);
        }
      }
      
      // Replace [field] references (alternative syntax)
      const bracketRefs = formula.match(/\[(\w+)\]/g);
      if (bracketRefs) {
        for (const ref of bracketRefs) {
          const field = ref.replace(/[\[\]]/g, '');
          const value = stats[field] || 0;
          formula = formula.replace(ref, value);
        }
      }
      
      // Evaluate the formula
      const result = eval(formula);
      
      results.push({
        id: element.id,
        label: element.label,
        value: result,
        color: element.color,
        formula: element.formula,
        calculatedFormula: formula
      });
      
    } catch (error) {
      console.error(`❌ Error calculating element ${element.label}:`, error.message);
      results.push({
        id: element.id,
        label: element.label,
        value: 0,
        color: element.color,
        error: error.message
      });
    }
  }
  
  return {
    chartId: chartConfig.chartId,
    title: chartConfig.title,
    type: chartConfig.type,
    elements: results,
    hasData: results.some(r => r.value > 0)
  };
}

async function simulatePartnerChartCalc() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB);
    
    console.log('🧮 Simulating Partner Chart Calculation');
    console.log('=======================================');
    
    // Get SIHF partner and events
    const sihfPartner = await db.collection('partners').findOne({ 
      name: /Swiss Ice Hockey Federation/i 
    });
    
    const partnerObjectId = new ObjectId(sihfPartner._id);
    const events = await db.collection('projects').find({
      $or: [
        { partner1: partnerObjectId },
        { partner2: partnerObjectId },
        { partner1Id: partnerObjectId },
        { partner2Id: partnerObjectId }
      ]
    }).toArray();
    
    // Calculate aggregate stats
    const aggregate = {
      remoteImages: 0,
      hostessImages: 0,
      selfies: 0,
      remoteFans: 0,
      stadium: 0,
      indoor: 0,
      outdoor: 0,
      female: 0,
      male: 0,
      genAlpha: 0,
      genYZ: 0,
      genX: 0,
      boomer: 0,
      merched: 0,
      jersey: 0,
      scarf: 0,
      flags: 0,
      baseballCap: 0,
      other: 0,
      eventAttendees: 0,
      _eventCount: events.length
    };
    
    events.forEach(event => {
      Object.keys(event.stats || {}).forEach(key => {
        const value = (event.stats || {})[key];
        if (typeof value === 'number') {
          aggregate[key] = (aggregate[key] || 0) + value;
        }
      });
    });
    
    // Add derived fields
    const stats = {
      ...aggregate,
      totalImages: aggregate.remoteImages + aggregate.hostessImages + aggregate.selfies,
      totalFans: aggregate.female + aggregate.male,
      allImages: aggregate.remoteImages + aggregate.hostessImages + aggregate.selfies
    };
    
    console.log('📊 Aggregate stats calculated:');
    console.log(`   - Female: ${stats.female}, Male: ${stats.male}`);
    console.log(`   - Remote Images: ${stats.remoteImages}, Selfies: ${stats.selfies}`);
    console.log(`   - Remote Fans: ${stats.remoteFans}, Stadium: ${stats.stadium}`);
    console.log(`   - Gen Alpha: ${stats.genAlpha}, Gen YZ: ${stats.genYZ}, Gen X: ${stats.genX}, Boomer: ${stats.boomer}`);
    
    // Get some test charts
    const testCharts = await db.collection('chart_configurations').find({
      isActive: true,
      elements: { $exists: true, $ne: null, $not: { $size: 0 } }
    }).limit(5).toArray();
    
    console.log(`\n🎯 Testing ${testCharts.length} charts:`);
    
    testCharts.forEach((chart, i) => {
      console.log(`\n--- Chart ${i + 1}: ${chart.title} (${chart.type}) ---`);
      
      const result = calculateChart(chart, stats);
      
      if (result) {
        console.log(`✅ Calculation successful`);
        console.log(`   - Has data: ${result.hasData}`);
        result.elements.forEach(element => {
          if (element.error) {
            console.log(`   ❌ ${element.label}: ERROR - ${element.error}`);
          } else {
            console.log(`   📊 ${element.label}: ${element.value} (formula: ${element.formula})`);
          }
        });
      } else {
        console.log(`❌ No elements to calculate`);
      }
    });
    
    console.log('\n✅ Chart calculation simulation complete');
    
  } catch (error) {
    console.error('❌ Simulation failed:', error);
  } finally {
    await client.close();
  }
}

// Run if called directly
if (require.main === module) {
  require('dotenv').config({ path: '.env.local' });
  simulatePartnerChartCalc().catch(console.error);
}

module.exports = { simulatePartnerChartCalc };