---
name: preflight-data-safety
description: >-
  Mandatory pre-flight investigation, cluster verification, backup snapshot, and post-mutation
  regression guard. Activate this skill BEFORE any MongoDB write, migration script, bulk update,
  logo/asset sync, environment variable change, or cluster/deployment configuration edit across
  messmass, camera, fanmass, or sso to guarantee zero data loss, zero split-brain cluster drift,
  and zero destructive overwrites.
---

# Pre-Flight Data Safety & Single-Cluster Guard

Activate and follow every step in this runbook **before** mutating any live database collection, running any migration/backfill script, modifying `.env*` / Vercel `MONGODB_URI`, or changing stored logos, templates, styles, or event statistics.

## Non-Negotiable Safety Laws

1. **Single Authoritative Cluster Per App — Never Dual-Write or Switch Blindly**:
   - `messmass` (`www.messmass.com` on Vercel + `/Users/Shared/Projects/messmass/.env.local`) uses **one single cluster** (`MONGODB_URI` -> `messmass-cluster.r96vlxs.mongodb.net`, database `messmass`).
   - Never hardcode cluster hostnames, credentials, or dual-cluster loops inside scripts; always use `requireMessmassUri()` from `/Users/Shared/Projects/messmass/scripts/lib/singleClusterConfig.ts`.
   - Never switch `MONGODB_URI` locally or on Vercel without first running a full collection-by-collection diff and verifying 100% document and field parity.

2. **Investigate & Snapshot Before Writing**:
   - Inspect target documents and sibling fields before writing a single byte.
   - Save both a local JSON backup AND an Atlas `*_backup_<YYYYMMDDTHHMMZ>` snapshot collection before any bulk or scripted write.

3. **Surgical `$set` Only — Never `replaceOne` / `deleteMany` / Zero-Overwrite**:
   - Never call `replaceOne`, `deleteMany`, or `drop` on `projects`, `partners`, `organizations`, `brand_assets`, `report_templates`, `report_styles`, `data_blocks`, `charts`, or `chart_configurations`.
   - Always update only the specific target dot-paths via `$set` so operator-entered clicker stats (`totalFans`, `selfies`, `remoteImages`, `approvedImages`, `merched`, `ventQr`, `uniqueUsers`, `reportImage1..N`), `logoUrl`, `darkLogoUrl`, `reportTemplateId`, `styleId`, and `editSlug` are never wiped.

4. **Zero Fabricated Metrics or Synthetic Assets**:
   - Never invent, back-calculate, or backfill synthetic ratios or counts (e.g. `photos / 2.7`, `registered * 0.83`, default stadium capacities, placeholder venues, or generated/traced logos).

## Mandatory 4-Step Execution Procedure

### Step 1: Audit Cluster Alignment
Run the cluster & environment alignment check first:
```bash
node /Users/Shared/Projects/.agents/skills/preflight-data-safety/scripts/preflight-audit.js --audit-clusters
```
Confirm that `.env.local` and `.vercel/.env.production.local` resolve to the exact same host and inspect live collection counts and `updatedAt` timestamps.

### Step 2: Take Verified Pre-Mutation Snapshot
Snapshot every collection your task will touch before executing any write:
```bash
node /Users/Shared/Projects/.agents/skills/preflight-data-safety/scripts/preflight-audit.js \
  --snapshot projects,partners \
  --out /tmp/messmass_preflight_$(date -u +%Y%m%dT%H%MZ)
```
Wait for `[OK]` confirmation that both JSON files and `*_backup_*` Atlas collections match live document counts.

### Step 3: Dry-Run & Execute Surgical `$set`
- Run your update in dry-run mode first and inspect sample diffs (`before` vs `after`).
- Apply changes strictly with field-scoped `$set` operations.

### Step 4: Post-Mutation Regression Verification
Immediately verify zero deleted documents and zero regressed stats/logos/templates against the Step 2 snapshot:
```bash
node /Users/Shared/Projects/.agents/skills/preflight-data-safety/scripts/preflight-audit.js \
  --verify /tmp/messmass_preflight_<TIMESTAMP> \
  --collections projects,partners
```
Do not report completion unless every collection prints `[PASS]`.
