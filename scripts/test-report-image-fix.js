// Test report image fix
const { ReportCalculator } = require('../lib/report-calculator.ts');

// Mock charts with image formulas
const mockCharts = [
  {
    chartId: 'report-image-1',
    title: 'Report Image 1',
    type: 'image',
    formula: 'stats.reportImage1',
    icon: 'image',
    isActive: true,
    order: 1,
    aspectRatio: '16:9'
  },
  {
    chartId: 'report-image-2',
    title: 'Report Image 2',
    type: 'image',
    formula: 'stats.reportImage2',
    icon: 'image',
    isActive: true,
    order: 2,
    aspectRatio: '16:9'
  },
  {
    chartId: 'report-image-3',
    title: 'Report Image 3',
    type: 'image',
    formula: 'stats.reportImage3',
    icon: 'image',
    isActive: true,
    order: 3,
    aspectRatio: '16:9'
  }
];

// Mock stats with image URLs
const mockStats = {
  reportImage1: 'https://i.ibb.co/ffZJxrV/56b69a9275d0.jpg',
  reportImage2: 'https://i.ibb.co/s8zdXRD/7be0c2400144.jpg',
  reportImage3: 'https://i.ibb.co/x8YBCx8w/695752257e03.jpg',
  remoteImages: 100,
  hostessImages: 50
};

console.log('=== Testing Report Image Fix ===\n');

// Create calculator
const calculator = new ReportCalculator(mockCharts, mockStats);

// Calculate each image chart
mockCharts.forEach(chart => {
  console.log(`Testing ${chart.chartId}:`);
  const result = calculator.calculateChart(chart.chartId);
  
  if (result) {
    console.log(`  ✅ Type: ${result.type}`);
    console.log(`  ✅ Title: ${result.title}`);
    console.log(`  ✅ kpiValue: ${result.kpiValue}`);
    console.log(`  ✅ Has valid URL: ${typeof result.kpiValue === 'string' && result.kpiValue.startsWith('https://')}`);
  } else {
    console.log(`  ❌ Result is null`);
  }
  console.log('');
});

console.log('=== Testing hasValidData ===\n');

mockCharts.forEach(chart => {
  const result = calculator.calculateChart(chart.chartId);
  if (result) {
    const isValid = ReportCalculator.hasValidData(result);
    console.log(`${chart.chartId}: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
  }
});
