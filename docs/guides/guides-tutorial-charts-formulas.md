# Tutorial: Charts & formulas
Status: Active
Last Updated: 2026-07-20T00:00:00.000Z
Canonical: Yes
Owner: Documentation

> Audience: Internal operators & admins (report builders) · Prerequisites: Admin sign-in; variables defined in KYC · Related: [Variables (KYC)](guides-tutorial-variables-kyc.md) · [Content Library](guides-tutorial-content-library.md) · [Reports](guides-tutorial-reports.md)

## What it is & why it matters
A **chart** (messmass calls these the "chart algorithms") turns an event's raw stats into something a reader can see — a pie split, a KPI number, a bar breakdown, a block of text, an image, or a table. The **Chart Algorithm Manager** at `/admin/charts` (titled **📊 Chart Algorithm Manager** — "Configure chart algorithms, data processing & visualization settings") is where you build and maintain them.

The engine of every chart is the **formula**. Each chart is made of one or more **elements**, and each element has a **label**, a **color**, and a formula that references variables by `[token]`. Because a variable's KYC name *is* its token, `[female] + [male]` sums exactly those two stats. Formulas let you compute derived values — totals, ratios, percentages, marketing multipliers — without touching the underlying data.

Charts are defined once here, then placed onto reports through report data blocks (a chart can also be attached to a clicker group as a KPI header). Define the maths once; reuse the chart everywhere.

## Before you start
- Sign in as an admin and open `/admin/charts`.
- The variables you plan to reference must exist in [KYC](guides-tutorial-variables-kyc.md). The manager loads the full variable catalog and validates your formulas against it — an unknown variable is flagged, not silently accepted.
- Know the element-count rule for each type (below) — it is enforced when you save.

## Step by step

### 1. Understand chart types and their element counts
When you create or edit a chart you choose a **Type**, and each type requires an exact number of elements:

| Type | Elements | What it shows |
|---|---|---|
| **KPI** | 1 | A single headline number |
| **Text** | 1 | A formatted text block (markdown) |
| **Image** | 1 | A full-width image |
| **Table** | 1 | A markdown table |
| **Value Chain** | 2 | An icon + a title element + a description element |
| **Pie** | 2 | Two segments |
| **Bar** | 5 | Five bars |

Switching type auto-adjusts the element list to the required count.

### 2. Create a chart
Click **New Chart** (➕). In the editor:
- **Chart ID** — a stable slug, e.g. `gender-distribution` (used to reference the chart elsewhere).
- **Title** — display heading, e.g. `Gender Distribution`.
- **Type** — pick from the table above.
- **Order** — position in the admin list (integer ≥ 1).

### 3. Write element formulas
For each element set a **label**, a **color**, and a **formula**. Formulas reference values with bracket tokens:
- `[VAR]` — a KYC variable, e.g. `[female]`, `[remoteImages] + [selfies]`.
- `[MEDIA:slug]` / `[TEXT:slug]` — an image or text asset from the [Content Library](guides-tutorial-content-library.md).
- `[PARAM:key]` — a per-element parameter (a tunable multiplier or constant defined on the element, so you don't hardcode magic numbers in the formula).
- `[MANUAL:key]` — a manually supplied aggregated value.
- `[fanmass.x]` — a Fanmass analytics variable (nested tokens are permitted), e.g. `[fanmass.peopleCount]`, provided that variable exists in KYC.

As you type, each formula is validated live against the KYC catalog and test-evaluated with sample data, so you get an immediate result or an "Unknown variables: …" error.

Use the variable picker to insert a `[token]` rather than typing it, to avoid typos.

### 4. Set formatting and display options
- **Element formatting** (KPI/pie/bar) — toggle **Rounded** (whole numbers vs two decimals), **Show Prefix** (e.g. `€`), and **Show Suffix** (e.g. `%`). These control how numbers render.
- **Display settings** — **Show Title**, an optional **Icon** (a Google Material Icon name such as `analytics` or `trending_up`, with an Outlined/Rounded variant), and a **Show Subtitle** toggle with its text.
- **Pie extras** — **Show Percentages in Legend** toggles "Label: 25%" vs just "Label".
- **Text extras** — a **Markdown Preset**: Standard, Compact, Hero, or Callout.
- **Image / Text aspect ratio** — Landscape (16:9), Portrait (9:16), or Square (1:1); this drives the chart's grid width in the report layout.
- **showTotal / total label** (bar) — show a total above the bars with a custom label.

### 5. Save, or Update-and-keep-editing
The editor offers two actions:
- **Update** — saves and keeps the modal open, refreshing the form with the stored values so you can iterate rapidly and watch the save-status indicator.
- **Save** — saves and closes.

Validation runs first: Chart ID and Title are required, the element count must match the type, every element needs a label and a formula, and no formula may be invalid.

### 6. Manage existing charts
From the charts table you can:
- **Search** by title, ID, or type; **sort** by title, type, or order (click a column header).
- **Activate / deactivate** — the Status button toggles **✅ Active** / **❌ Inactive**. Only active charts are offered when attaching a chart to a clicker group.
- **Reorder** — charts carry an `order`; adjust it to change position.
- **Edit** / **Delete** — Delete asks for confirmation.

### 7. Validate everything and refresh variables
- **Validate All** — checks every formula across every chart and reports total/valid/error/warning counts, listing any errors by chart and element.
- **Refresh Variables** (🔄) — forces the KYC variable cache to refresh so a newly created variable is recognised by the validator.

### 8. A worked example — a gender pie
1. **New Chart** → Chart ID `gender-distribution`, Title `Gender Distribution`, Type **Pie** (2 elements).
2. Element 1: label `Female`, colour `#ff6b9d`, formula `[female]`.
3. Element 2: label `Male`, colour `#3b82f6`, formula `[male]`.
4. Leave **Show Percentages in Legend** on so the legend reads "Female: 43%".
5. **Update** to save and watch the live test result, then **Save** to close.
6. Place the chart on a report block (see [Reports](guides-tutorial-reports.md)).

For a computed KPI instead, a single-element KPI chart with formula `[merched] / [totalFans] * 100`, a `%` suffix, and **Rounded** on gives a clean "merch penetration" headline.

## Managing it
**Placing a chart on a report.** A chart is a definition; it appears on a report when a report data block references it. Report layout and blocks are covered in [Reports](guides-tutorial-reports.md) and the [Reporting & Builder feature guide](../features/features-reporting-builder.md). A chart can also head a clicker group as a KPI — see [Clicker sets](guides-tutorial-clicker-sets.md).

**Presets and icons.** Icons come from Google Material Icons (browse at fonts.google.com/icons) and are referenced by name plus an Outlined/Rounded variant. Text-chart presets change the visual treatment (fonts, padding, borders) without changing the content.

**Content charts (text / image / table).** These use one element whose formula is typically a single reference — a report-content field like `reportText1` / `reportImage1`, or a Content Library token `[TEXT:slug]` / `[MEDIA:slug]`. Table charts render a markdown table stored in a `textarea` variable; the [Table Chart Usage Guide](../charts/charts-table-chart-usage-guide.md) walks through wiring one end to end.

## Gotchas & good practice
- **Token = KYC name.** `[female]` only resolves because a variable named `female` exists. A bracketed name with no matching variable is flagged as unknown and evaluates as missing (a common cause of "my chart shows 0").
- **Element count is strict.** Pie needs exactly 2 elements, bar exactly 5, KPI/text/image/table exactly 1, value chain exactly 2. Changing type re-shapes the element list for you.
- **Prefer the picker.** Insert variables from the picker to avoid typos and to see categories (including Bitly, SportsDB, Fanmass, and other integration variables).
- **Refresh after adding a KYC variable.** The validator uses a cached catalog; click **Refresh Variables** if a brand-new variable is reported as unknown.
- **Run Validate All before a release.** It surfaces every broken formula in one pass, which is far faster than opening charts one by one.
- **Deactivate rather than delete** a chart you might reuse — deletion is permanent, and a chart referenced by a report or group will break if it disappears.

## How it connects
- **Inputs:** every `[token]` maps to a variable in [Variables (KYC)](guides-tutorial-variables-kyc.md), fed by [Collecting data](guides-tutorial-collecting-data.md).
- **Content tokens:** `[MEDIA:slug]` / `[TEXT:slug]` come from the [Content Library](guides-tutorial-content-library.md).
- **Output:** charts are placed into report blocks — see [Reports](guides-tutorial-reports.md) and the [Reporting & Builder feature guide](../features/features-reporting-builder.md).
- **Reference docs:** [Charts overview](../charts/charts-overview.md) and the [Table Chart Usage Guide](../charts/charts-table-chart-usage-guide.md).

## Screenshots
_Screenshots to be added._

## Related tutorials
- [Variables (KYC)](guides-tutorial-variables-kyc.md)
- [Content Library (images & text)](guides-tutorial-content-library.md)
- [Clicker sets & variable groups](guides-tutorial-clicker-sets.md)
- [Reports](guides-tutorial-reports.md)
- [Collecting event data](guides-tutorial-collecting-data.md)
