# Next Agent Prompt (Handover)

**Generated:** 2026-02-24  
**Context:** Builder mode (clicker) delivered end-to-end: variable inputs, overflow fix, unified card layout. Build passed; pushed to preview; board evidence posted.

---

## What to read first

1. **docs/messmass-codex-brain-dump.md** — doc structure, style-editor (v11.59.0), and **Builder mode / clicker** section (including unified layout).
2. **MEMORY.md** — recent focus and delivery.
3. **docs/operations/operations-action-plan.md** — execution queue and STATE MEMORY.
4. **docs/plan-builder-mode-variable-inputs.md** — Builder mode plan (Phase 1–2 done; optional Phase 3–4).
5. **docs/features/features-reporting-builder.md** — Builder feature summary.

---

## What was done (ready for next agent)

- **Builder mode (clicker):** All chart types (KPI, Bar, Pie, Text, Table, Image, Value chain) show **one input per variable** from element formulas (`extractVariablesFromFormula()`, dedupe, stats-only). Value chain supported; text chart empty fix; card style + Material Icons.
- **Image/Table when formula empty:** Image: infer variable from title ("Report Image 3") or chartId (`report-image-3`); show image + Replace + Remove. Table: infer from title/chartId or fallback to `reportTable1` so table always has an input.
- **Overflow fix:** Cards and grid use `min-width: 0`, `overflow: hidden`, `.chart-builder-card-body`; `.builder-chart-wrapper` allows shrink so inputs never overflow the card.
- **Unified card layout:** Every builder card now: (1) title (2) chartId (3) per variable: label + [registry name] (4) input. No mixed phrasing (Variable:, Formula:, "Pie chart • …", etc.). CSS: `.chart-builder-card-id`, `.chart-builder-variable-meta`, `.chart-builder-registry-name`, `.chart-builder-variable-row`.
- **Build:** `npm run build` passed.
- **Push:** `landing-overhaul` pushed to **preview** (`d2fc6e22f..747eb0a40`).
- **Board evidence:** Comment posted on mvp-factory-control [#49](https://github.com/moldovancsaba/mvp-factory-control/issues/49#issuecomment-3957698585) (Variables System Enhancements) describing Builder delivery; no dedicated Builder card on MVP Factory Board to move.
- **Docs:** Release notes 11.59.0 §4, features-reporting-builder, delivery-focus, action-plan, brain-dump, MEMORY, handover (this file).

---

## What to run first (if continuing)

1. `git status --short` — check for uncommitted changes.
2. `npm run build` — confirm still green after any edits.
3. Push to **preview** if on another branch: `git push origin <branch>:preview`.

---

## What to avoid

- Do not revert "one input per variable" or the unified card layout (title → chartId → label + [name] → input).
- Keep chart builder styles in `app/styles/components.css`; `.chart-builder-*` and `.builder-chart-wrapper` are shared.

---

## Definition of done for this handover

- [x] Builder: all chart types show one input per variable; image/table inference when formula empty.
- [x] Overflow fixed; unified card layout applied to all builders.
- [x] Build passed; changes pushed to **preview**.
- [x] Board evidence posted (mvp-factory-control #49).
- [x] Handover doc (this file), brain-dump, and STATE MEMORY updated.
