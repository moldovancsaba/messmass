# Flaws and Errors — Actionable Task List
Status: Active
Last Updated: 2026-02-05T19:41:25.000Z
Canonical: No
Owner: Operations

**Purpose:** Single checklist to eliminate known flaws and errors. When a task is done, check it off; when the fix is released, remove it from this list (or move to "Completed" at bottom) so the list stays short and actionable.

**Related:** Open execution work lives in [ACTION_PLAN.md](ACTION_PLAN.md). Completed work goes in [release notes](RELEASE_NOTES.md) / `docs/releases/`.

---

## 1. High priority (fix or verify soon)

- [ ] **OPS-INT-01: Google Sheets Phase 2 hardening**  
  **Done when:** End-to-end testing and validation (staging + production) completed; checklist in DEPLOYMENT_CHECKLIST.md signed off.  
  **Ref:** [ACTION_PLAN.md §3](ACTION_PLAN.md), `docs/2026-02-04_GOOGLE_SHEETS_PARTNER_SYNC.md`

---

## 2. Medium priority (UX / consistency)

- [ ] **ProjectSelector / PartnerSelector: show full name on hover**  
  **Done when:** Long names truncated with ellipsis have `title` attribute or tooltip so full name is visible on hover.  
  **Files:** `components/ProjectSelector.module.css` (132–133), `components/PartnerSelector.module.css` (139–140); ensure the rendered element (e.g. option or span) has `title={fullName}` or a tooltip component.

- [ ] **NotificationPanel: improve long message handling**  
  **Done when:** Long notification text either wraps (max 2 lines) or shows "See more" / tooltip instead of single-line ellipsis only.  
  **File:** `components/NotificationPanel.module.css` (157–158); consider `-webkit-line-clamp: 2` and/or `title` for full text.

---

## 3. Pre-release / deployment checks (run every release)

- [ ] **Build passes:** `npm run build`
- [ ] **Layout Grammar guardrail passes:** `npx tsx scripts/check-layout-grammar-guardrail.ts`
- [ ] **Type-check passes:** `npm run type-check` (or `tsc --noEmit`)
- [ ] **Lint passes:** `npm run lint` (if not skipped in CI)

*(These are checklists, not one-off tasks; keep this section as a reminder.)*

---

## 4. Completed (move here when done; prune when in release notes)

- [x] **Confirm report routes never use `.table-overflow-hidden`** (2026-02-05). Verified no use in `app/report/`; comment added in `app/styles/layout.css`.

---

## 5. Reference — where flaws are documented

| Source | What it covers |
|--------|-----------------|
| [Layout Grammar Audit (2026-02-05)](../audits/investigations/LAYOUT_GRAMMAR_AUDIT_2026-02-05.md) | Layout Grammar (report) + admin/global design; report defects remediated; follow-ups completed. |
| [ACTION_PLAN.md](ACTION_PLAN.md) | Open execution queue (OPS-INT-01); Reporting/Admin/Cross-System action items. |
| [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) | Rollout and validation steps. |

---

*Keep this list under ~15 open items; archive or delete completed entries once they are in release notes.*
