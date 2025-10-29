// scripts/add-currency-type-to-charts.js
// WHAT: Add type: 'currency' to chart elements that display monetary values
// WHY: Enable automatic € prefix formatting without hardcoded detection logic
// HOW: Identify currency-related charts by chartId or element labels and update elements

const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

// WHAT: Chart patterns that indicate currency values
// WHY: These charts display monetary amounts and need € symbol formatting
const CURRENCY_CHART_PATTERNS = {
  // Charts identified by chartId
  chartIds: [
    'advertisement-value',
    'value',
    'merch-sales',
    'merchandise-sales'
  ],
  
  // Charts identified by title keywords
  titleKeywords: [
    'advertisement value',
    'value',
    'sales',
    'euro',
    'eur',
    '€'
  ],
  
  // Charts identified by totalLabel keywords
  totalLabelKeywords: [
    'advertisement value',
    'sales',
    'euro',
    'eur',
    '€'
  ],
  
  // Element labels that indicate currency
  elementLabels: [
    'cpm',
    'social',
    'email',
    'stadium',
    'total value',
    'ad value'
  ]
};

/**
 * WHAT: Determine if a chart should have currency formatting
 * WHY: Not all charts display money - only update relevant ones
 */
function isCurrencyChart(chart) {
  // Check chartId
  if (CURRENCY_CHART_PATTERNS.chartIds.includes(chart.chartId.toLowerCase())) {
    return true;
  }
  
  // Check title
  if (chart.title && CURRENCY_CHART_PATTERNS.titleKeywords.some(keyword => 
    chart.title.toLowerCase().includes(keyword))) {
    return true;
  }
  
  // Check totalLabel
  if (chart.totalLabel && CURRENCY_CHART_PATTERNS.totalLabelKeywords.some(keyword => 
    chart.totalLabel.toLowerCase().includes(keyword))) {
    return true;
  }
  
  return false;
}

/**
 * WHAT: Determine if an element should have currency formatting
 * WHY: Some elements within mixed charts may be currency while others aren't
 */
function isCurrencyElement(element) {
  if (!element.label) return false;
  
  return CURRENCY_CHART_PATTERNS.elementLabels.some(keyword => 
    element.label.toLowerCase().includes(keyword));
}

async function addCurrencyTypes() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(MONGODB_DB);
    const chartsCollection = db.collection('chartConfigurations');
    
    // Fetch all active charts
    const charts = await chartsCollection.find({ isActive: true }).toArray();
    console.log(`📊 Found ${charts.length} active charts`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const chart of charts) {
      const shouldUpdateChart = isCurrencyChart(chart);
      
      // Determine which elements need updating
      const updatedElements = chart.elements.map(element => {
        // Skip if already has type
        if (element.type) {
          return element;
        }
        
        // Check if this element should be currency
        const shouldBeCurrency = shouldUpdateChart || isCurrencyElement(element);
        
        if (shouldBeCurrency) {
          return {
            ...element,
            type: 'currency'
          };
        }
        
        return element;
      });
      
      // Check if any elements were modified
      const hasChanges = updatedElements.some((el, idx) => 
        el.type === 'currency' && !chart.elements[idx].type);
      
      if (hasChanges) {
        await chartsCollection.updateOne(
          { _id: chart._id },
          { 
            $set: { 
              elements: updatedElements,
              updatedAt: new Date().toISOString()
            }
          }
        );
        
        console.log(`✅ Updated chart: ${chart.title} (${chart.chartId})`);
        console.log(`   Elements marked as currency: ${
          updatedElements.filter(el => el.type === 'currency').map(el => el.label).join(', ')
        }`);
        updatedCount++;
      } else {
        skippedCount++;
      }
    }
    
    console.log('\n📊 Migration Summary:');
    console.log(`   Updated charts: ${updatedCount}`);
    console.log(`   Skipped charts: ${skippedCount}`);
    console.log(`   Total charts: ${charts.length}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('✅ Database connection closed');
  }
}

// Run migration
addCurrencyTypes();
