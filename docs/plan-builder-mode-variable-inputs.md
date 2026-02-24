# Plan: Builder Mode — Variable Inputs from Report Layout

**Status:** Phase 1–2 implemented (2026-02-21)  
**Last Updated:** 2026-02-21  
**Context:** Event edit page (e.g. https://www.messmass.com/edit/91cab2ec-98a5-4c54-8c31-48057408b2b0) — Builder mode should show **variable inputs** that feed each chart, not only chart placeholders. Value Chain charts currently show "⚠️ Unknown chart type: valuechain" and charts with formulas like `[newUsersAdded] / [uniqueUsers] * 100` need **one input per variable** (e.g. `newUsersAdded`, `uniqueUsers`).

---

## 1. Goal

- **Fix Builder mode** so it correctly supports all chart types used in the report (including **valuechain**).
- **Show variable inputs** that build each chart: for every chart block, derive the list of variables from the chart’s **element formulas** and render **one input field per variable** (not one per element). Example: one element with formula `[newUsersAdded] / [uniqueUsers] * 100` → two inputs: `newUsersAdded` and `uniqueUsers`.

---

## 2. Current State

| Area | Current behavior | Gap |
|------|------------------|-----|
| **Builder mode** | Renders report template layout and chart builders (KPI, bar, pie, image, text, table). | `valuechain` falls through to `default` → "Unknown chart type: valuechain". |
| **ChartConfig type in BuilderMode** | `type: 'kpi' \| 'bar' \| 'pie' \| 'image' \| 'text' \| 'table' \| 'value'`. | API returns `valuechain`; type union does not include it. |
| **KPI / Bar builders** | KPI: one input from `elements[0].formula` (single key). Bar: one input per element, key from `el.formula` (assumes one variable per formula). | Formulas like `[a] / [b] * 100` reference multiple variables but only one key is used; no input for second variable. |
| **Value Chain** | No builder; shows error. | Need a builder that shows inputs for all variables used in the two elements’ formulas. |

**Relevant code**

- **Builder mode container:** `components/BuilderMode.tsx` — switch on `chart.type`; no `valuechain` case.
- **Chart types from API:** `lib/chartConfigTypes.ts` — `type: 'pie' \| 'bar' \| 'kpi' \| 'text' \| 'image' \| 'table' \| 'valuechain'`.
- **Variable extraction:** `lib/formulaEngine.ts` — `extractVariablesFromFormula(formula)` returns variable names from `[varName]`, `[PARAM:key]`, etc.
- **Report/valuechain:** Value Chain has 2 elements (title + description); each element has a `formula` that can reference multiple variables.

---

## 3. Requirements (Summary)

1. **Recognise valuechain in Builder**  
   - Add `valuechain` to the BuilderMode chart type union and add a dedicated case that renders a Value Chain builder (variable inputs for that block).

2. **Variable-centric inputs per chart**  
   - For each chart (including valuechain, KPI, bar, pie where applicable):
     - Collect **all** variables from **all** element formulas (e.g. via `extractVariablesFromFormula`).
     - **Deduplicate** variable names.
     - Render **one input per variable** (number or text as appropriate), with label = variable name (or friendly label if we have metadata).
   - Example: element formula `[newUsersAdded] / [uniqueUsers] * 100` → inputs for `newUsersAdded` and `uniqueUsers`.

3. **No breaking change to existing builders**  
   - Existing KPI/bar/pie builders can be extended to support multi-variable formulas, or we introduce a shared “variable inputs from formulas” component and use it for valuechain and optionally for others. Prefer a shared approach so behaviour is consistent and we don’t duplicate formula parsing.

---

## 4. Delivery Plan

### Phase 1: Fix “Unknown chart type: valuechain”

**Owner:** Engineering  
**Scope:** BuilderMode only.

1. **Update BuilderMode chart type**  
   - In `components/BuilderMode.tsx`, extend the local `ChartConfig.type` to include `'valuechain'` (and align with API; remove or map `'value'` if it’s legacy).
2. **Add a valuechain case in the switch**  
   - Add `case 'valuechain':` and render a Value Chain builder component (see Phase 2).  
   - No “Unknown chart type” for valuechain.

**Acceptance**

- Event edit page in Builder mode: report blocks that use a valuechain chart show a Value Chain builder (variable inputs) instead of "⚠️ Unknown chart type: valuechain".

---

### Phase 2: Value Chain builder — variable inputs from elements

**Owner:** Engineering  
**Scope:** New component + integration in BuilderMode.

1. **Create `ChartBuilderValueChain` (or reuse a generic variable-input component)**  
   - **Inputs:** chart (with `elements[]`, each with `formula`), `stats`, `onSave(key, value)`.
   - **Logic:**
     - For each element, run `extractVariablesFromFormula(element.formula)` (from `lib/formulaEngine.ts`).
     - Merge and deduplicate variable names (order: first occurrence or stable sort).
     - Optionally filter out non-stats tokens (e.g. `PARAM:`, `MANUAL:`, `MEDIA:`, `TEXT:`) if we don’t want to show inputs for those in this builder; document the rule.
   - **UI:**
     - Chart title (and icon if present).
     - One input per variable: label = variable name (e.g. `newUsersAdded`, `uniqueUsers`).  
     - Store value in `stats[variableName]`; on change call `onSave(variableName, value)`.  
     - Use number inputs for now if the variable is used in numeric context; text if we later detect string usage (or start with text and refine).
   - **Files:** e.g. `components/ChartBuilderValueChain.tsx` (and optional shared `components/ChartBuilderVariableInputs.tsx` if we want to reuse for other types).

2. **Use it in BuilderMode**  
   - In the `valuechain` case, render `<ChartBuilderValueChain chart={chart} stats={stats} onSave={handleSave} />`.

**Acceptance**

- Value Chain block in Builder shows all variables from both elements’ formulas, with one input per variable; editing and saving updates `project.stats` and persists.

---

### Phase 3: Generic “variable inputs from formulas” (optional but recommended)

**Owner:** Engineering  
**Scope:** Shared helper or component used by valuechain and, if desired, KPI/bar/pie.

1. **Introduce shared formula → variable inputs**  
   - **Option A — Component:** `ChartBuilderVariableInputs` (or `VariableInputsFromFormulas`) that accepts:
     - `elements: Array<{ formula: string; label?: string }>`
     - `stats`, `onSave`
     - Optional `chartTitle`, `icon`
   - Uses `extractVariablesFromFormula` on each formula, deduplicates, renders one input per variable.  
   - **Option B — Hook/helper:** `getVariablesFromChartElements(chart) => string[]` and keep rendering in each builder.  
   - Prefer Option A for consistency and one place to handle PARAM/MANUAL/MEDIA/TEXT and input type (number vs text).

2. **Use for valuechain**  
   - Implement `ChartBuilderValueChain` using this shared component (or the same logic).

3. **Optionally extend KPI / Bar / Pie**  
   - For KPI: if `elements[0].formula` contains multiple variables, show one input per variable instead of one single key.  
   - For Bar/Pie: same idea — gather variables from all elements’ formulas, show one input per variable.  
   - This can be a follow-up task if we want to ship valuechain first.

**Acceptance**

- One place parses formulas and decides which variables get inputs; valuechain (and optionally other types) use it. No duplicated formula-parsing logic.

---

### Phase 4: Bar/Pie/KPI multi-variable formulas (follow-up)

**Owner:** Engineering  
**Scope:** ChartBuilderKPI, ChartBuilderBar, ChartBuilderPie.

- **Current:** KPI uses only one key from first element; Bar uses one key per element (assumes formula = single variable).  
- **Change:** For each of these builders, collect variables from all elements via `extractVariablesFromFormula`, deduplicate, and render one input per variable (same UX as valuechain).  
- **Compatibility:** If an element formula is a single `[var]`, we still show one input; if it’s `[a] / [b] * 100`, we show two.  
- **Files:** `ChartBuilderKPI.tsx`, `ChartBuilderBar.tsx`, `ChartBuilderPie.tsx` (+ shared component if built in Phase 3).

**Acceptance**

- Any chart in Builder that has formulas with multiple variables shows one input per variable; saving updates stats correctly.

---

## 5. Technical Notes

- **Variable name format:** `extractVariablesFromFormula` returns names as they appear in brackets (e.g. `newUsersAdded`, `uniqueUsers`). Stats keys are the same (no mandatory `stats.` prefix in storage). Use the same key for read/write in Builder.
- **PARAM / MANUAL / MEDIA / TEXT:** Decide whether to show inputs for these in Builder. For MVP, showing only “stats” variables (no colon or special prefix) is enough; document and optionally add a filter in the shared logic.
- **Input type:** Start with number for numeric-looking variables; if a variable is used in a text context (e.g. valuechain description as string), use text input. Can refine later from variables config (e.g. type from variables_metadata).
- **Existing Report Content (images/texts):** Unchanged. Report Content block (ReportContentManager) stays as-is; this plan only affects the Builder-mode chart blocks that render from the report template + chart configs.

---

## 6. Definition of Done

- [x] Builder mode shows no "Unknown chart type: valuechain"; valuechain blocks render a Value Chain builder.
- [ ] Value Chain builder shows one input per variable that appears in the block’s element formulas (e.g. `[newUsersAdded] / [uniqueUsers] * 100` → two inputs).
- [x] Editing and saving in Builder updates `project.stats` and persists (existing save flow).
- [ ] (Optional) Shared “variable inputs from formulas” component; valuechain uses it.
- [ ] (Optional) KPI/Bar/Pie builders extended to multi-variable formulas where applicable.
- [ ] Brief docs or release note updated (e.g. “Builder mode: valuechain supported; variable inputs derived from chart formulas”).

---

## 7. References

- `components/BuilderMode.tsx` — Builder container, chart type switch.
- `components/ChartBuilderKPI.tsx`, `ChartBuilderBar.tsx`, `ChartBuilderPie.tsx` — Current single- or per-element input behaviour.
- `lib/formulaEngine.ts` — `extractVariablesFromFormula(formula)`.
- `lib/chartConfigTypes.ts` — ChartConfiguration type, valuechain elements (2 elements: title + description formula).
- `app/report/[slug]/ReportChart.tsx` — ValueChainChart rendering (report view).
- Event edit URL pattern: `/edit/[slug]` (e.g. `https://www.messmass.com/edit/91cab2ec-98a5-4c54-8c31-48057408b2b0`).
