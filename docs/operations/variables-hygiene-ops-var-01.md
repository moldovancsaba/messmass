# Variables system hygiene (OPS-VAR-01)

Status: Done
Last Updated: 2026-02-06
Canonical: Yes
Owner: Admin / Reporting

## 1. Nightly inventory and diff report

- **Source:** Same data as `GET /api/variables-config` (MongoDB collection `variables_metadata`). The inventory script reads directly from the DB for reliability in cron environments.
- **Script:** `scripts/generate-variables-inventory.ts`
- **Run:** `npm run variables:inventory` (uses `.env.local` for DB connection). Optional: `OUT_DIR=docs/operations/variables-inventory`.
- **Output (under `docs/operations/variables-inventory/` or `OUT_DIR`):**
  - `inventory-YYYY-MM-DD.json` – dated snapshot (count + variables array)
  - `inventory-YYYY-MM-DD.csv` – same data in CSV
  - `latest.json` – latest snapshot (used as previous for diff)
  - `diff-report.txt` – added / removed / changed (label, type, category) vs previous run
- **Cron example:** Run nightly, e.g. `0 2 * * *` (2 AM):  
  `cd /path/to/repo && npm run variables:inventory`

## 2. Admin UI filters for legacy (stats.) variables

- **Where:** Admin → KYC Variables (`/admin/kyc`).
- **Filter:** “Legacy (stats. schema)” checkbox – when enabled, shows only system variables (legacy stats schema). **Warn-only; no behavior change** – filtering for visibility only.
- **Badge:** Variables that are system/legacy show a “Legacy stats.” badge with tooltip: “Legacy stats. schema field – do not rename or remove without migration”.
- **Purpose:** Identify and review legacy `stats.*`-related variables before any migration or cleanup.
