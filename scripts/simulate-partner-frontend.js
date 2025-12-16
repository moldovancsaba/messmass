// Simulate the exact frontend calculation for partner reports
// Run with: node scripts/simulate-partner-frontend.js

const { MongoClient, ObjectId } = require('mongodb');

// Simple formula evaluator (mimics frontend logic)
function evaluateFormula(formula, stats) {
  if (!formula || typeof formula !== 'string') {
    return 'NA';
  }
  
  try {
    // Handle stats.fieldName pattern
    if (formula.includes('stats.')) {
      const fieldMatch = formula.match(/stats\.([a-zA-Z0-9]+)/);
      if (fieldMatch) {
        const fieldName = fieldMatch[1];
        const value = stats[fieldName];
        return typeof value === 'number' ? value : 'NA';
      }
    }
    
    // Handle [fieldName] pattern
    const bracketMatch = formula.match(/^\[([a-zA-Z0-9]+)\]$/);
    if (bracketMatch) {
      const fieldName = bracketMatch[1];
      const camelFieldName = fieldName.charAt(0).toLowerCase() + fieldName.slice(1);
      const value = stats[camelFieldName];
      return typeof value === 'number' ? value : 'NA';
    }
    
    // Handle simple numbers
    if (/^\d+$/.test(formula)) {
      return parseInt(formula);
    }
    
    return 'NA';
  } catch (error) {
    console.error('Formula evaluation error:', error);
    return 'NA';
  }
}

// Simple chart calculator (mimics frontend logic)
function calculateChart(configuration, stats) {
  console.log(`🧮 Calculating chart: ${configuration.title} (${configuration.type})`);
  
  let hasErrors = false;
  
  const elements = configuration.elements.map(element => {
    try {
      const value = evaluateFormula(element.formula, stats);
      console.log(`  ${element.label}: ${element.formula} = ${value}`);
      
      if (value === 'NA') {
        hasErrors = true;
      }
      
      return {
        id: element.id || 'unknown',
        label: element.label || 'Unnamed Element',
        value: value,
        color: element.color || '#cccccc'
      };
    } catch (error) {
      hasErrors = true;
      console.error(`❌ Error evaluating formula for element "${element.label}":`, error);
      
      return {
        id: element.id || 'unknown',
        label: element.label || 'Unnamed Element',
        value: 'NA',
        color: element.color || '#cccccc'
      };
    }
  });
  
  // Calculate total for bar charts or kpiValue for KPI charts
  let total = undefined;
  let kpiValue = undefined;
  
  if (configuration.type === 'kpi') {
    if (elements.length > 0) {
      kpiValue = elements[0].value;
    } else {
      kpiValue = 'NA';
      hasErrors = true;
    }
  } else if (configuration.type === 'bar' && configuration.showTotal) {
    try {
      const validValues = elements
        .map(el => el.value)
        .filter(value => typeof value === 'number');
      
      if (validValues.length === 0) {
        total = 'NA';
        hasErrors = true;
      } else {
        total = validValues.reduce((sum, value) => sum + value, 0);
      }
    } catch (error) {
      total = 'NA';
      hasErrors = true;
    }
  }
  
  return {
    chartId: configuration.chartId,
    title: configuration.title,
    type: configuration.type,
    elements,
    total,
    kpiValue,
    hasErrors
  };
}

async function simulatePartnerFrontend() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB);
    
    console.log('🔍 Simulating partner frontend calculation...\n');
    
    // ==========================================
    // 1. FETCH PARTNER DATA (like API)
    // ==========================================
    const partner = await db.collection('partners').findOne({ 
      viewSlug: '903f80ab-e105-4aaa-8c42-2caf71a46954' 
    });
    
    if (!partner) {
      console.error('❌ Partner not found');
      return;
    }
    
    const partnerObjectId = new ObjectId(partner._id);
    const events = await db.collection('projects').find({
      $or: [
        { partner1: partnerObjectId },
        { partner2: partnerObjectId },
        { partner1Id: partnerObjectId },
        { partner2Id: partnerObjectId }
      ]
    }).toArray();
    
    console.log(`✅ Partner: ${partner.name}`);
    console.log(`✅ Events: ${events.length}`);
    
    // ==========================================
    // 2. AGGREGATE STATS (like frontend)
    // ==========================================
    const aggregateStats = {
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
      eventTicketPurchases: 0,
      visitQrCode: 0,
      visitShortUrl: 0,
      visitWeb: 0,
      visitFacebook: 0,
      visitInstagram: 0,
      visitYoutube: 0,
      visitTiktok: 0,
      visitX: 0,
      visitTrustpilot: 0,
      eventResultHome: 0,
      eventResultVisitor: 0,
      eventValuePropositionVisited: 0,
      eventValuePropositionPurchases: 0,
      approvedImages: 0,
      rejectedImages: 0
    };
    
    // Sum all stats across events
    events.forEach(event => {
      Object.keys(event.stats || {}).forEach(key => {
        const value = (event.stats || {})[key];
        if (typeof value === 'number') {
          aggregateStats[key] = (aggregateStats[key] || 0) + value;
        }
      });
    });
    
    console.log('\n📊 Aggregate stats:');
    console.log('  Female:', aggregateStats.female);
    console.log('  Male:', aggregateStats.male);
    console.log('  Total Images:', aggregateStats.remoteImages + aggregateStats.hostessImages + aggregateStats.selfies);
    console.log('  Merched:', aggregateStats.merched);
    console.log('  Event Attendees:', aggregateStats.eventAttendees);
    
    // ==========================================
    // 3. FETCH CHART CONFIGURATIONS
    // ==========================================
    const chartConfigurations = await db.collection('chart_configurations').find({ 
      isActive: true 
    }).limit(5).toArray();
    
    console.log(`\n📊 Chart configurations: ${chartConfigurations.length}`);
    
    // ==========================================
    // 4. CALCULATE CHARTS (like frontend)
    // ==========================================
    console.log('\n🧮 Calculating charts...\n');
    
    const chartResults = [];
    
    chartConfigurations.forEach(config => {
      const result = calculateChart(config, aggregateStats);
      chartResults.push(result);
      
      // Check if chart has valid data
      const hasValidData = (() => {
        if (result.type === 'kpi') {
          return result.kpiValue !== 'NA' && result.kpiValue !== undefined;
        }
        
        // Pie/Bar charts: valid only if they have numeric elements with sum > 0
        const validElements = result.elements.filter(element => 
          typeof element.value === 'number'
        );
        const totalValue = validElements.reduce((sum, element) => sum + element.value, 0);
        return validElements.length > 0 && totalValue > 0;
      })();
      
      console.log(`  ${result.title}: ${hasValidData ? '✅ Valid' : '❌ Invalid'} (${result.hasErrors ? 'with errors' : 'no errors'})`);
    });
    
    console.log(`\n✅ Total chart results: ${chartResults.length}`);
    console.log(`✅ Valid charts: ${chartResults.filter(r => {
      if (r.type === 'kpi') {
        return r.kpiValue !== 'NA' && r.kpiValue !== undefined;
      }
      const validElements = r.elements.filter(e => typeof e.value === 'number');
      const totalValue = validElements.reduce((sum, e) => sum + e.value, 0);
      return validElements.length > 0 && totalValue > 0;
    }).length}`);
    
    // ==========================================
    // 5. CHECK TEMPLATE AND DATA BLOCKS
    // ==========================================
    console.log('\n📋 Checking template and data blocks...');
    
    let templateId = partner.reportTemplateId;
    if (!templateId) {
      const defaultTemplate = await db.collection('report_templates').findOne({ isDefault: true });
      if (defaultTemplate) {
        templateId = defaultTemplate._id;
      }
    }
    
    if (templateId) {
      const template = await db.collection('report_templates').findOne({ _id: new ObjectId(templateId) });
      if (template) {
        console.log(`✅ Template: ${template.name}`);
        console.log(`✅ Data blocks: ${template.dataBlocks?.length || 0}`);
        
        if (template.dataBlocks && template.dataBlocks.length > 0) {
          for (const blockRef of template.dataBlocks) {
            const block = await db.collection('data_blocks').findOne({ _id: new ObjectId(blockRef.blockId) });
            if (block) {
              console.log(`  Block: ${block.name} (${block.charts?.length || 0} charts, active: ${block.isActive})`);
              
              if (block.charts && block.charts.length > 0) {
                block.charts.forEach(chart => {
                  const chartResult = chartResults.find(r => r.chartId === chart.chartId);
                  const hasValidData = chartResult && (() => {
                    if (chartResult.type === 'kpi') {
                      return chartResult.kpiValue !== 'NA' && chartResult.kpiValue !== undefined;
                    }
                    const validElements = chartResult.elements.filter(e => typeof e.value === 'number');
                    const totalValue = validElements.reduce((sum, e) => sum + e.value, 0);
                    return validElements.length > 0 && totalValue > 0;
                  })();
                  
                  console.log(`    Chart: ${chart.chartId} (width: ${chart.width}) ${hasValidData ? '✅' : '❌'}`);
                });
              }
            }
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });

simulatePartnerFrontend().catch(console.error);