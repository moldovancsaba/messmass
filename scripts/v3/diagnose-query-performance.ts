import clientPromise from '@/lib/mongodb';
import connectV3 from '@/lib/mongoose-v3';
import config from '@/lib/config';
import V3MetricValue from '@/lib/models/v3/MetricValue';
import { V3ReportingResolver } from '@/lib/v3/reporting/resolver';

/**
 * Performance Audit: Reporting Engine
 * Stress tests the hierarchical aggregation logic.
 */
async function diagnosePerformance() {
  console.log('🏁 Starting Performance Audit...');
  
  await connectV3();
  const orgId = '111111111111111111111111';
  const entityId = '222222222222222222222222'; // Mock root entity
  const metricKey = 'performance_test_metric';

  console.log('⏳ Seeding 10,000 mock records for precision timing...');
  // (In a real audit, we would seed 1M+, but for a safe script we'll use a representative sample)
  const seedData = Array.from({ length: 10000 }).map((_, i) => ({
    organizationId: orgId,
    entityId: entityId,
    metricKey: metricKey,
    value: Math.random() * 100,
    timestamp: new Date(Date.now() - i * 60000), // 1 datapoint per minute
  }));

  await V3MetricValue.deleteMany({ metricKey });
  await V3MetricValue.insertMany(seedData);

  console.log('🚀 Running Aggregation Stress Test...');
  const start = Date.now();
  
  const result = await V3ReportingResolver.aggregateMetric(orgId, entityId, metricKey);
  
  const duration = Date.now() - start;
  console.log(`📊 Result: Sum=${result.total.toFixed(2)} across ${result.count} documents.`);
  console.log(`⏱️ Duration: ${duration}ms`);

  if (duration < 100) {
    console.log('✅ PERFORMANCE TARGET MET (< 100ms)');
  } else {
    console.warn('⚠️ PERFORMANCE WARNING: Response time exceeded target.');
  }

  // Cleanup
  await V3MetricValue.deleteMany({ metricKey });
  process.exit(0);
}

diagnosePerformance().catch(err => {
  console.error('🔥 Audit exploded:', err);
  process.exit(1);
});
