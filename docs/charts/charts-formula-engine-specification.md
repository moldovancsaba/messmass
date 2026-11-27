# Formula Engine & Calculation Specification
Status: Active
Last Updated: 2026-11-20T16:00:00.000Z
Canonical: Yes
Owner: Architecture / Calculations
Version: 12.6.0

## 1. Architectural Architecture: Two-Stage Pipeline

To prevent string literals, image URLs, and markdown tokens from corrupting arithmetic AST evaluation, calculations follow a decoupled two-stage pipeline:

```
Input Expression / Formula
           │
┌──────────▼──────────┐
│ Stage 1: Fast-Path  │ ──► [TEXT:slug], [MEDIA:slug], reportImage1..N, reportText1..N
│ Content Slot/String │     Resolved directly via dictionary lookup (lib/contentSlots.ts)
└──────────┬──────────┘
           │ (Pure Numeric Math)
┌──────────▼──────────┐
│ Stage 2: Arithmetic │ ──► Tokenizer -> Recursive Descent AST Parser -> Math Evaluator
│ Formula AST Engine  │     Evaluates numbers, variables, operations (+, -, *, /)
└─────────────────────┘
```

## 2. Syntax & Grammar

### Variable References
Variables correspond to statistical fields in `project.stats` or aggregated organization stats:
- Standard bracketed: `[ventCtaPopup]`, `[uniqueUsers]`, `[female]`, `[male]`
- Namespaced / Legacy fallback: `[stats.ventCtaPopup]`, `stats.reportImage1`
- Parameterized expressions: `[PARAM:impressionsPerAppearance]`, `[PARAM:cpmEur]`

### Arithmetic Operators
- Addition: `+`
- Subtraction: `-`
- Multiplication: `*`
- Division: `/`
- Grouping: `(` and `)`

Example formulas:
- Percentage CTR: `([ventCtaPopup]/[uniqueUsers])*100`
- Fan Engagement: `[male] + [female]`
- Merch Penetration: `[merched]/([male]+[female])*100`

## 3. Percentage Auto-Averaging Logic

When a KPI chart has `formatting.suffix === '%'` and the formula consists exclusively of addition of variables (e.g. `[varA] + [varB]`):
- The engine calculates the **arithmetic mean** (average) rather than a linear sum.
- Example: $(50\% + 50\%) / 2 = 50\%$ rather than $100\%$.
- Formulas containing division or multiplication bypass auto-averaging and evaluate strictly as mathematical expressions.

## 4. Value Formatting (`lib/formatChartValue.ts`)

Formatting rules govern how numeric results render in the UI:

| Property | Type | Description | Example |
|---|---|---|---|
| `rounded` | `boolean` | `true` = whole integer (0 decimals); `false` = 2 decimal places | `rounded: false` on `67.023` -> `67.02` |
| `prefix` | `string` | Symbol or currency preceding number | `prefix: '€'` on `62315` -> `€62,315` |
| `suffix` | `string` | Symbol appended to number | `suffix: '%'` on `23.78` -> `23.78%` |

## 5. Structured Error Handling

When calculation or data binding fails, `ReportCalculator` generates a structured `ChartError`:
- `MISSING_CHART_CONFIG`: Configuration absent from database collections.
- `CALCULATION_ERROR`: Formula syntax or AST evaluation failure.
- `DIVISION_BY_ZERO`: Handled safely by returning `NA` (suppressing false metrics).
- `INVALID_CHART_TYPE`: Unknown chart type in configuration.
