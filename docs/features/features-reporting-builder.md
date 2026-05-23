# Reporting & Builder Mode (Clicker)
Status: Active
Last Updated: 2026-02-24
Canonical: Yes
Owner: Product

## Purpose
Document how report templates are edited and how Builder mode on the event edit page shows **variable inputs** that feed each chart, so operators can fill all report data in one place.

## Builder mode (event edit page)
- **Path:** `/edit/[slug]` — Event edit page with a **Builder** view that renders the report template layout and, for each chart block, a **builder card** with inputs for the variables that feed that chart.
- **Source of truth:** [{messmass} - From IDEA to LIVE](https://github.com/users/moldovancsaba/projects/8). Builder/clicker work may be tracked there; when delivered, move the relevant issue to **Done** and post evidence.

## Variable inputs per chart type
All chart builders now:
1. Read the chart’s **element formulas** (from the report template / chart config).
2. Extract variable names via `extractVariablesFromFormula()` from `lib/formulaEngine.ts` (e.g. `[newUsersAdded]`, `[uniqueUsers]`).
3. Deduplicate and optionally filter to **stats-only** variables (tokens containing `:` such as `PARAM:`, `MEDIA:` are skipped where appropriate).
4. Render **one input per variable** (number, textarea, or image upload as appropriate).

| Chart type   | Behavior |
|-------------|----------|
| KPI         | One number input per variable in the formula (single or multi-variable formulas). |
| Bar         | All variables from every bar element → one number input per variable (e.g. 5 bars × 2–3 vars = 10–15 inputs per card). |
| Pie         | Same pattern; one input per variable + sum of inputs. |
| Text        | One textarea per variable; markdown preview; current content shown. |
| Table       | One textarea per variable; table markdown preview. |
| Image       | `reportImage*` → ImageUploader; others → text input (URL or value). |
| Value chain | One input per variable (number or textarea). |

## Components and references
- **Container:** `components/BuilderMode.tsx` — switch on `chart.type`; includes `valuechain`.
- **Builders:** `ChartBuilderKPI`, `ChartBuilderBar`, `ChartBuilderPie`, `ChartBuilderText`, `ChartBuilderTable`, `ChartBuilderImage`, `ChartBuilderValueChain`.
- **Formula engine:** `lib/formulaEngine.ts` — `extractVariablesFromFormula(formula)`.
- **Plan:** `docs/plan-builder-mode-variable-inputs.md` — Phase 1–2 done; optional Phase 3–4.
- **Release notes:** `docs/release-notes-11.59.0.md` (§4 Builder mode).
