# Documentation Audit (Merge Rule & Single Task List)
Status: Archived
Last Updated: 2026-02-06T14:49:00Z
Canonical: No
Owner: Operations

## Archive Note (2026-02-06)
This audit is archived because all actions in it were already executed. Keep it for traceability only; current work belongs in `docs/operations/operations-action-plan.md` and `docs/operations/operations-roadmap.md`.

**Scope:** Audit based on recent policy: (1) one source of truth per topic, (2) merge → delete (no archived stubs of merged content), (3) one executable task list only.

**Reference:** [DOCUMENTATION_GOVERNANCE.md](../../../documentation-governance.md) — Merge Rule, Deprecation Strategy, Canonical Policy.

---

## 1. Findings

### 1.1 Merge-rule violation: redirect stub kept after merge
| Item | Location | Issue |
|------|----------|--------|
| **TASKLIST.md** | `docs/operations/TASKLIST.md` | Execution state was superseded by ACTION_PLAN.md (single executable TODO). This file is a redirect stub ("Where To Look Instead" → ACTION_PLAN). Per Merge Rule: when content is merged into another doc, **delete** the old file. Stub = duplication and inconsistency. |

### 1.2 References still pointing at deleted/stub doc
After TASKLIST.md is removed, the following should point to ACTION_PLAN.md for "current tasks" or "execution state":

| File | Current reference | Action |
|------|-------------------|--------|
| `docs/operations/operations-learnings.md` | TASKLIST.md (next priorities) | Point to ACTION_PLAN.md. |
| `docs/operations/WARP.md` | TASKLIST.md (active tasks, project status) | Point to ACTION_PLAN.md. |
| `docs/messmass-codex-brain-dump.md` | "TASKLIST.md is archived and exists only as a redirect" | State that execution state lives in ACTION_PLAN.md only; TASKLIST removed per merge rule. |
| `docs/_meta/meta-canonical-map.md` | Row for docs/operations/TASKLIST.md | Remove row when file is deleted. |
| `docs/_meta/meta-docs-inventory.md` | Row for docs/operations/TASKLIST.md | Remove row when file is deleted. |

(RELEASE_NOTES.md and archive packs mention TASKLIST in **historical** context; no change needed.)

### 1.3 Optional: merged-content stubs in archive
| Location | Issue |
|----------|--------|
| `docs/archive/_archive/deprecated-guides-2025/` | Six small files (ADMIN_LAYOUT_SYSTEM.md, CARD_SYSTEM.md, DATABASE_FIELD_NAMING.md, QUICK_ADD_GUIDE.md, SINGLE_REFERENCE_SYSTEM.md, USER_GUIDE.md) state "consolidated into the pack" and link into LEGACY_GUIDES_PACK.md. Per Merge Rule, content was merged → old files could be **deleted** instead of kept as stubs. Optional cleanup: delete these six; ensure any external links point to LEGACY_GUIDES_PACK.md anchors. |

### 1.4 Single task list / canonical execution
- **ACTION_PLAN.md** correctly states it is the single executable TODO (rule 1.1).
- **docs/index.md** does not link to TASKLIST.md; it links to operations/ACTION_PLAN.md. No duplicate task list in index.
- **archive/_archive/audits/AUDIT_ACTION_PLAN_2026-01-12.md** is a different scope (audit-driven actions A-01, A-02…); it references ACTION_PLAN for Admin/ops state. No conflict.

### 1.5 Governance clarity
- **DOCUMENTATION_GOVERNANCE.md** includes the **Merge Rule** (merge → delete; no archived copy or redirect stub; why: no duplication or obsolete files) and **Deprecation Strategy** (when superseded *without* merge: move to archive, no stubs).
- **ACTION_PLAN.md** states one executable task list. No change needed.

---

## 2. Action List

| # | Action | Owner | Done |
|---|--------|--------|------|
| 1 | **Delete** `docs/operations/TASKLIST.md`. Do not replace with an archived stub. | Operations | Yes (2026-02-05) |
| 2 | Update `docs/operations/operations-learnings.md`: replace TASKLIST.md with ACTION_PLAN.md where it refers to current/next priorities. | Operations | Yes (2026-02-05) |
| 3 | Update `docs/operations/WARP.md`: replace TASKLIST.md with ACTION_PLAN.md for "current active tasks" / "project status". | Operations | Yes (2026-02-05) |
| 4 | Update `docs/messmass-codex-brain-dump.md`: execution state = ACTION_PLAN.md only; TASKLIST removed per merge rule. | Operations | Yes (2026-02-05) |
| 5 | Remove TASKLIST.md from `docs/_meta/meta-canonical-map.md` and `docs/_meta/meta-docs-inventory.md` (or regenerate after delete). | Operations / tooling | Yes (2026-02-05) |
| 6 | (Optional) Delete the six stub files in `docs/archive/_archive/deprecated-guides-2025/` whose content is in LEGACY_GUIDES_PACK.md; fix links if any. | Operations | Yes (2026-02-05) |

---

## 3. Checklist for Future Doc Changes

- **Before creating a new "task list" or "checklist" doc:** Is this already in ACTION_PLAN or ROADMAP? If yes, add there; do not create a second doc.
- **After merging a file into another:** Delete the old file. Do not leave an "archived" or "redirect" stub at the old path.
- **After deleting a doc:** Update CANONICAL_MAP / DOCS_INVENTORY and any in-repo links (index, brain dump, LEARNINGS, WARP, etc.).

---

*Audit run 2026-02-05. Principles: one source of truth; merge → delete; one executable task list (ACTION_PLAN).*
