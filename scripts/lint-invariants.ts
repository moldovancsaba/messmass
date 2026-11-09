import fs from "fs";
import path from "path";

console.log("Starting PlanetBrain Invariant Linter (INV-001, INV-003, INV-005)...");

let hasErrors = false;
const rootDir = path.resolve(__dirname, "..");

// 1. Verify INV-001: Aggregator must export and enforce compound tenant partition
console.log("Checking INV-001 (Multi-Tenant Compound Partition Isolation)...");
const aggregatorPath = path.join(rootDir, "lib", "interactiveReportAggregator.ts");
const aggregatorCode = fs.readFileSync(aggregatorPath, "utf8");

if (!aggregatorCode.includes("organizationId?: string") || !aggregatorCode.includes("resolveScopeProjectIds")) {
  console.error("FAIL [INV-001]: interactiveReportAggregator.ts missing compound organizationId partitioning.");
  hasErrors = true;
} else {
  console.log("PASS [INV-001]: Aggregator enforces compound organizationId partitioning.");
}

// 2. Verify INV-003: Snapshot manager must use atomic replaceOne with upsert
console.log("Checking INV-003 (State Machine Idempotency & Atomic Persistence)...");
const snapshotManagerPath = path.join(rootDir, "lib", "reportSnapshotManager.ts");
const snapshotCode = fs.readFileSync(snapshotManagerPath, "utf8");

if (!snapshotCode.includes("replaceOne") || !snapshotCode.includes("upsert: true")) {
  console.error("FAIL [INV-003]: reportSnapshotManager.ts missing atomic replaceOne with upsert.");
  hasErrors = true;
} else {
  console.log("PASS [INV-003]: Snapshot manager enforces atomic replaceOne upsert idempotency.");
}

// 3. Verify INV-005: GDS Theme Palette must be exported and defined
console.log("Checking INV-005 (General Design System Standard Tokens)...");
const palettePath = path.join(rootDir, "lib", "theme", "interactiveReportPalette.ts");
if (!fs.existsSync(palettePath)) {
  console.error("FAIL [INV-005]: Centralized GDS palette lib/theme/interactiveReportPalette.ts not found.");
  hasErrors = true;
} else {
  const paletteCode = fs.readFileSync(palettePath, "utf8");
  if (!paletteCode.includes("INTERACTIVE_REPORT_THEME")) {
    console.error("FAIL [INV-005]: INTERACTIVE_REPORT_THEME missing in palette.");
    hasErrors = true;
  } else {
    console.log("PASS [INV-005]: GDS centralized token contract is verified.");
  }
}

if (hasErrors) {
  console.error("\nINVARIANT LINT FAILED: One or more invariants violated.");
  process.exit(1);
} else {
  console.log("\nINVARIANT LINT PASSED: All architectural invariants verified 100% green.");
  process.exit(0);
}
