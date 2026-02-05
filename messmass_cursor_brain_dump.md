# MessMass Cursor Brain Dump

**Purpose:** Single continuity document for Cursor (or any agent) so work can resume after a context reset. Read this first when starting a new session or when you don’t have prior conversation context.

**Rule:** Update this file whenever you:
- Complete a task, fix a bug, or merge a PR
- Switch branch or deployment target
- Change current priority or hit a blocker
- Add something that “next session” must know

---

## 1. Where We Are (Repo & Branch)

| Item | Value |
|------|--------|
| **Active branch** | `preview` (deploy preview; merge to `main` via PR) |
| **Last commit (preview)** | Layout Grammar remediation: no clipping on content layers (overflow → visible) |
| **Main** | Protected; all changes via PR. Preview is the integration branch. |

*Update "Last commit" when you push new work.*

---

## 2. Current Priorities (Re-sync Here)

**Single source of truth for open work:**  
`docs/operations/ACTION_PLAN.md`

**Top items (as of last update):**
1. **OPS-INT-01** – Google Sheets Partner Sync Phase 2 hardening (IN PROGRESS)  
   - End-to-end testing & validation; optional Phase 2.5 auto-provisioning  
   - Refs: `docs/2026-02-04_GOOGLE_SHEETS_PARTNER_SYNC.md`, `docs/operations/DEPLOYMENT_CHECKLIST.md`
2. Reporting / Admin / Cross-System action sections: currently no other open items.

**Roadmap (future work, not task list):**  
`docs/operations/ROADMAP.md` — completed/DONE items are not listed there; see `docs/releases/` for those.

---

## 3. Key Pointers (Re-sync Reading Order)

1. **This file** – you are here.
2. **`agent_working_loop_canonical_operating_document.md`** – agent rules (Sultan), rollback plan requirement, documentation = code, memory refresh.
3. **`docs/operations/ACTION_PLAN.md`** – execution queue, open tasks, STATE MEMORY.
4. **`docs/operations/ROADMAP.md`** – roadmap; no DONE lists (those go in release notes).
5. **`docs/brain_dump.md`** – docs tree layout, canonical entrypoints, where things live under `docs/`.
6. **`docs/releases/`** – completed work and release notes.

---

## 4. Recent Context (Last Session / Delivery)

- **Filter-based reports** were showing “No Data Found – No projects found with this filter combination.”  
  **Fix:** API `GET /api/hashtags/filter-by-slug/[slug]` now matches projects when the filter hashtag is stored as plain (e.g. `football`) and the project has it only under a category (e.g. `sport:football`). Helper `projectHasFilterHashtag` does exact match or `category:value` suffix match.  
  **Commit:** `fix: filter reports match projects with categorized hashtags (category:value)` (on `preview`).
- **Policy:** Completed/DONE items are not listed in ACTION_PLAN or ROADMAP; they live only in release notes (`docs/releases/`).
- **GoogleSheetsConnectModal:** Partner detail page uses `partnerId` + `partnerName` (not `connectEndpoint`/`targetName`/etc.) so Vercel build and modal contract stay aligned.

- **Layout Grammar remediation (2026-02-05):** Report-rendering fixes delivered: `.chart`, text chart wrappers, `.bodyZone`, TextChart `.content`, `.kpiValueRow`, `.textMarkdown pre`, mobile chart/pie title → `overflow: visible`. Audit doc updated; build passes. See `docs/audits/investigations/LAYOUT_GRAMMAR_AUDIT_2026-02-05.md`.

*Replace this section with the next 2–3 important things that happened when you next update.*

---

## 5. How to Use This File

**When you (agent or human) start work:**
1. Open this file first.
2. Skim sections 1–3 to know branch, priorities, and where to read next.
3. If something is unclear, ask; don’t assume.

**When you finish something or change focus:**
1. Update **§1** if branch or last commit changed.
2. Update **§2** if priorities or ACTION_PLAN changed.
3. Add a short line to **§4** for what you did; drop the oldest line if the list gets long (keep last 2–3 deliveries).

---

*Last updated: 2026-02-05 (Layout Grammar audit added; filter report fix on preview).*
