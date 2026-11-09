import { getOrGenerateSnapshot, getCachedReportSnapshot, saveReportSnapshot } from "../lib/reportSnapshotManager";
import { performance } from "perf_hooks";

async function runBenchmark() {
  console.log("Starting Materialized Snapshot Cache Performance Benchmark (Issue #12)...");

  const query = {
    scopeType: "hashtag" as const,
    scopeIdentifier: "tippmixreport2026",
    sportFilter: "all",
    organizationId: "org_szrt",
  };

  const syntheticData: any = {
    success: true,
    scope: { type: "hashtag", id: "tippmixreport2026" },
    summary: { totalPhotos: 50000, totalMatches: 20 },
    matches: [],
  };

  // 1. Prime the snapshot cache
  await saveReportSnapshot(query, syntheticData, 3600);

  // 2. Measure cache hit latency across 10 iterations
  const latencies: number[] = [];
  for (let i = 0; i < 10; i++) {
    const start = performance.now();
    const cached = await getCachedReportSnapshot(query);
    const duration = performance.now() - start;
    if (!cached) throw new Error("Expected cache hit but got null");
    latencies.push(duration);
  }

  const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  const p95Latency = latencies.sort((a, b) => a - b)[Math.floor(latencies.length * 0.95)];

  console.log(`Cache Hit Latencies: [${latencies.map((l) => l.toFixed(2) + "ms").join(", ")}]`);
  console.log(`Average Latency: ${avgLatency.toFixed(2)}ms`);
  console.log(`P95 Latency: ${p95Latency.toFixed(2)}ms`);

  if (p95Latency > 100) {
    console.error(`FAILED: P95 latency ${p95Latency.toFixed(2)}ms exceeds 100ms threshold.`);
    process.exit(1);
  }

  console.log("SUCCESS: Materialized snapshot cache achieves sub-100ms response time.");
  process.exit(0);
}

runBenchmark().catch((err) => {
  console.error("Benchmark error:", err);
  process.exit(1);
});
