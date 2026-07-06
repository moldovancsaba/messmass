# Agent Handover — messmass issue delivery (2026-07-05)

Status: Active
Last Updated: 2026-07-05
Canonical: No (handover prompt)
Owner: Product

> **How to use this file:** paste the section **"HANDOVER PROMPT (paste to the new agent)"**
> into a fresh agent running on a local machine with full network + credential access.
> Everything above that section is reference context for the human operator.

---

## Operator reference — what already happened

A cloud sandbox session performed an issue audit and a board consolidation, and shipped
three code fixes. All of it lives on branch **`claude/repo-sandbox-issue-audit-1b6wvq`**
(HEAD `723bc2e`), pushed to `origin`, **not yet merged to `main`** and **no PR opened**.

Commits on the branch (oldest→newest):
- `403adcc` docs: GitHub issue audit (`docs/audits/issue-audit-2026-06-30.md`)
- `056093c` docs+ci: issue-audit remediation (restored 8 `.github/workflows/*.yml`; fixed SSOT docs)
- `41487a6` / `e434b78` docs: board-migration record + correction (`docs/operations/board-migration-2026-07-03.md`)
- `e79cdab` fix: content-asset `uploadedBy` + native `confirm()`→GDS `ConfirmDialog` (**#287, closed**)
- `3b1e7c0` refactor: remove dead logger file/external sink stubs (**#285, closed**)
- `723bc2e` refactor: type analytics aggregation input, drop `project:any` (**#284, partial**)

Board state now: `moldovancsaba/messmass` holds only messmass issues; all non-messmass
work was reverted to `moldovancsaba/mvp-factory-control`. GitHub Project 8 attachment and
Projects-v2 field values still need a manual pass on the board UI (the API can't write them).

**Why a local agent is needed:** the remaining issues require a live MongoDB connection and
a Bitly token to implement and *verify*. The sandbox had neither, so they were deliberately
left rather than shipped blind.

Verification gates that MUST pass before any close (from `AGENTS.md`):
`npm run type-check` · `npm run lint` · `npm test` · `npm run style:check` · `npm run build`.

---

## HANDOVER PROMPT (paste to the new agent)

You are continuing delivery on the **messmass** repository from a local machine that has full
network access and all project credentials. Work only on the messmass repo
(`moldovancsaba/messmass`). Be rigorous: do not close an issue without running the project's
validation gates and, for data-dependent work, verifying against the real database.

### 0. Prerequisites (install/confirm first)
- **Node.js 24.x** (`>=24.0.0 <25.0.0` — see `.nvmrc`; `nvm install 24 && nvm use 24`). npm `>=8`.
- **Vercel CLI** for env vars: `npm i -g vercel` (or `npx vercel`).
- **MongoDB access**: either the production/staging `MONGODB_URI` (read carefully — see safety note) or a local `mongod` with seeded data.
- **Bitly**: a valid `BITLY_ACCESS_TOKEN` (+ `BITLY_ORGANIZATION_GUID`, `BITLY_GROUP_GUID`) for issue #283.
- GitHub auth (`gh auth login`) to comment on / close issues in `moldovancsaba/messmass`.

### 1. Get the code and the branch
```bash
git clone https://github.com/moldovancsaba/messmass.git
cd messmass
git fetch origin claude/repo-sandbox-issue-audit-1b6wvq
git checkout claude/repo-sandbox-issue-audit-1b6wvq
nvm use 24 || nvm install 24
npm install
```

### 2. Pull environment variables with the Vercel CLI
```bash
vercel login                      # interactive browser login on a local machine
vercel link                       # select the messmass project/team
vercel env pull .env.local        # writes .env.local (already gitignored — never commit it)
# or a specific target: vercel env pull .env.local --environment=production
```
Confirm `.env.local` contains at minimum: `MONGODB_URI`, `MONGODB_DB`, `BITLY_ACCESS_TOKEN`,
`BITLY_ORGANIZATION_GUID`, `BITLY_GROUP_GUID`, `JWT_SECRET`. Full key list: see `.env.example`.
Then sanity-check the baseline: `npm run type-check && npm run lint && npm test && npm run build`.

> **DB safety:** if `MONGODB_URI` points at production, treat it read-only unless a task
> explicitly authorizes a write. For #286's audit, use the dry-run/`--audit` script paths first.
> Prefer a backup before any migration: `npm run db:backup`.

### 3. Tasks to deliver (in this order)

**TASK A — Issue #286: remove legacy migration fallbacks (needs DB audit).**
Files: `lib/googleSheets/rowMapper.ts:14` (default column map), `components/ChartAlgorithmManager.tsx:1069` (legacy path).
- First run the production data audit to prove nothing still depends on the fallbacks:
  `npm run check:google-sheets-schema` and inspect Google Sheets configs for any missing index maps;
  query the DB for charts still on the legacy path.
- Migrate any stragglers with the existing scripts, then delete the fallback code + TODO markers.
- **DoD:** attach audit output showing zero legacy dependents (or stragglers migrated); gates green.

**TASK B — Issue #283: Bitly device/browser breakdown storage + orphaned-association cleanup.**
Files: `lib/bitly-aggregator.ts:257/272/288/304`, `lib/bitly-recalculator.ts:82`, `app/api/bitly/recalculate/route.ts:173`.
- Persist device/browser click breakdowns during Bitly sync; estimate proportionally in aggregation.
- Add an orphaned-association cleanup pass to the recalculator.
- Verify against real Bitly data (`npm run` any bitly sync alias; check `lib/bitly.ts` client).
- **DoD:** device/browser breakdowns return real data; orphans cleaned; TODOs removed; gates green + regression test.

**TASK C — Issue #284 remainder (analytics output; needs runtime data).**
The `project: any` typing is already done (`AnalyticsProjectInput` in `lib/analyticsCalculator.ts`).
Remaining, each verified against seeded/prod data because they change dashboard output:
- `lib/insightsEngine.ts:418` — compute `overallScore` from the benchmark engine instead of hardcoded 70.
- `lib/editorBlockValidator.ts:61/91` — build `contentMetadata` from real chart data.
- `lib/analyticsCalculator.ts:252` `costPerEngagement`, `:369` `hourlyPattern` — if the data genuinely isn't collected, mark the fields unavailable in the output type (don't return fake values); update dashboard consumers accordingly.
- `lib/analytics-anomaly.ts:394` — implement seasonal decomposition (STL / moving-average), or split into its own issue.
- **DoD:** every TODO in those four files resolved; analytics dashboards visually verified unchanged/improved; gates green.

### 4. Working rules
- Branch: keep working on `claude/repo-sandbox-issue-audit-1b6wvq` (or rebase onto latest `origin/main` first if it has moved: `git fetch origin main && git rebase origin/main`).
- One issue per commit; message format `type: summary (#NNN)`; run the 5 gates before every commit.
- Per `docs/PROJECT_MANAGEMENT.md` §4, each issue needs Objective/Context/Scope/Dependencies/DoD; post a closure comment with the commit SHA + the exact validation commands that passed, then close with `state_reason: completed`.
- Honor the strict design-system rules in `docs/HANDOVER.md` / `docs/coding-standards.md`: no Tailwind utility classes, no inline `style={{}}`, use `FormModal`/`BaseModal`/`ColoredCard`/`Unified*` inputs and `var(--mm-*)` tokens. `npm run style:check` enforces this.
- Never commit `.env.local` or `.vercel/` (already gitignored).

### 5. Open decisions to raise with the PO (don't guess)
- **Issue #88** — restore the re-added CI workflows as-is, or replace them? They are on the branch but the deletion in `38c87cd` looked intentional.
- **Open a PR** to land the branch on `main` (the sandbox was not authorized to). Check for a PR template at `.github/pull_request_template.md` and mirror its structure.
- **Project 8 board** — attach the messmass issues and set Status/Product/DoD/Agent fields (API can't; do it in the board UI). Labels `priority:*`/`type:*`/`dod:*`/`agent:*` carry the values.

### 6. Definition of "done" for this handover
Tasks A–C delivered and closed with evidence, branch green on all 5 gates, PR opened (once the PO approves), and the #88 CI decision recorded. Update `docs/HANDOVER.md` "Current Repo Truth" when state changes materially.
