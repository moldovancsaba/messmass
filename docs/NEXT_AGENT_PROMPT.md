# Next Agent Prompt (Handover)

**Generated:** 2026-02-24  
**Context:** Builder mode (clicker) completed: all chart types show one input per variable from formulas. All documentation and project board instructions updated.

---

## What to read first

1. **docs/messmass-codex-brain-dump.md** — doc structure, style-editor (v11.59.0), and **Builder mode / clicker** section.
2. **MEMORY.md** — recent focus and delivery.
3. **docs/operations/operations-action-plan.md** — execution queue and STATE MEMORY.
4. **docs/plan-builder-mode-variable-inputs.md** — Builder mode plan (Phase 1–2 done; optional Phase 3–4).

---

## What was done (current session)

- **Builder mode (clicker):** All chart types now inspect the chart algorithm (element formulas), extract variables via `extractVariablesFromFormula()`, deduplicate, and show **one input per variable** so users can fill all data in the Builder.
  - **KPI:** Multi-variable formulas (e.g. `[a]+[b]+[c]`) → one number input per variable.
  - **Bar:** All variables from every bar element → e.g. 5 bars × 2–3 vars = 10–15 inputs per card.
  - **Pie:** Same pattern; one input per variable + sum of inputs.
  - **Text:** All variables from all elements → one textarea per variable (with markdown preview).
  - **Table:** Same → one textarea per variable (with table preview).
  - **Image:** All variables; `reportImage*` → ImageUploader, others → text input (save on blur).
  - **Value chain:** Already done earlier; one input per variable (number or text).
- **Fixes included:** Text chart empty fix (stats key from `[reportText21]`), card style + MaterialIcon for all builders, formula→statsKey for `[varName]` and `stats.varName` everywhere.
- **Committed & pushed** to `landing-overhaul` and **preview** (commit: Builder: all chart types show one input per variable from formulas).
- **Documentation:** Release notes (11.59.0 §4 Builder mode), `docs/features/features-reporting-builder.md`, features-overview, MEMORY.md, operations-delivery-focus, operations-action-plan (STATE MEMORY + project board), brain-dump.
- **Project board:** [MVP Factory Board](https://github.com/users/moldovancsaba/projects/1) — if an issue exists for Builder/clicker variable inputs (mvp-factory-control repo), move it to **Done** and post evidence. See `docs/operations/operations-delivery-focus.md` (Recently completed) and `docs/operations/operations-action-plan.md` (STATE MEMORY).
- **Handover:** This file and brain-dump/STATE MEMORY updated.

---

## What to run first (if continuing)

1. `npm run build` — confirm green.
2. `git status --short` — check for any uncommitted changes.
3. Push to **preview** if needed: `git push origin landing-overhaul:preview`.

---

## What to avoid

- Do not revert the “one input per variable” behavior; it is the intended Builder UX for filling all chart data.
- Value chain and table builders use shared CSS (e.g. `.chart-builder-text-block`); keep styles in `app/styles/components.css`.

---

## Definition of done for this handover

- [x] Builder: all chart types (KPI, Bar, Pie, Text, Table, Image, Value chain) show one input per variable.
- [x] Handover doc (this file) updated.
- [x] Brain-dump and STATE MEMORY updated.
- [x] Changes committed and pushed to **preview**.
- [ ] **Project board:** If a Builder/clicker issue exists on MVP Factory Board, move to Done and post evidence (optional; human or agent with board access).
