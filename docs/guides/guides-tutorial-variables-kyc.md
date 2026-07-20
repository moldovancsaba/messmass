# Tutorial: Variables (KYC)
Status: Active
Last Updated: 2026-07-20T00:00:00.000Z
Canonical: Yes
Owner: Documentation

> Audience: Internal operators & admins (system builders) · Prerequisites: Admin sign-in · Related: [Clicker sets](guides-tutorial-clicker-sets.md) · [Charts & formulas](guides-tutorial-charts-formulas.md) · [Collecting data](guides-tutorial-collecting-data.md)

## What it is & why it matters
The **KYC Variables** page at `/admin/kyc` is the single catalog of every data field messmass knows about. If a number, a percentage, a currency amount, a date, or a block of text can appear on a counter or in a chart, it exists here first.

Why this matters: a variable's **name** is used unchanged everywhere. The same `female` that you define here is the key stored on each event's `stats{}`, the counter that shows up in the clicker, and the token `[female]` you type into a chart formula. There is **no translation layer** — the database field name, the clicker counter, and the formula token are all the same string. Get the catalog right and everything downstream lines up; misname something here and every formula that brackets it breaks.

Think of KYC as the dictionary. [Clicker sets](guides-tutorial-clicker-sets.md) decides which words appear on the data-entry screen and in what order; [Charts & formulas](guides-tutorial-charts-formulas.md) decides how those words are combined into visualisations.

## Before you start
- Sign in as an admin. The page lives at `/admin/kyc` and is titled **🔐 KYC Variables** ("Catalog of all variables (manual, system, derived) powering analytics and clicker").
- Understand the naming rule before you create anything: variable names must be **camelCase** — start with a letter, letters and digits only, no spaces, no `stats.` prefix (e.g. `fanCount`, `vipGuests`, `female`). The page enforces the pattern `^[a-zA-Z][a-zA-Z0-9]*$`.
- Decide up front whether a new variable should be countable in the clicker, editable by hand, or both — you set those flags at creation.

## Step by step

### 1. Read the catalog
Each variable is listed as a card showing:
- the **Label** (human-readable heading) and the **name** shown as a `[name]` code chip,
- a **TYPE** badge (COUNT, NUMERIC, CURRENCY, PERCENTAGE, BOOLEAN, DATE, TEXT, …),
- a **source** badge — one of `manual`, `system`, `derived`, or `text` (computed from the variable, not stored),
- a green **clicker** badge if it is visible in the clicker, a yellow **manual** badge if it is editable in manual mode,
- a **Legacy stats.** badge on built-in schema fields (variables flagged `isSystem`).

Use the search box in the hero to match on name, label, category, or description.

### 2. Filter to find things
The green filter card gives you four narrowing tools:
- **Source** — check/uncheck `manual`, `system`, `derived`, `text`.
- **Flags** — show only variables that are visible in clicker and/or editable in manual.
- **Legacy (stats. schema)** — "Show only legacy stats. fields" narrows to system variables. This is warn-only; it changes nothing about behaviour.
- **Tags (Categories)** — click category chips to show only those categories; **Clear** resets.

### 3. Create a variable
Click **New Variable** (the ➕ button in the hero). In the **➕ New Variable** modal:
1. **Name (camelCase)** — e.g. `vipGuests`. No `stats.` prefix.
2. **Label** — e.g. `VIP Guests`.
3. **Type** — choose from:
   - `count` — whole numbers (0, 1, 2…)
   - `numeric` — decimal numbers
   - `currency` — money values (€/$/£)
   - `percentage` — 0–100%
   - `boolean` — true/false checkbox
   - `date` — date picker
   - `text` — single-line text (title, name)
   - `textarea` — multi-line text content (e.g. a markdown table)
   - `texthyper` — URL, email, phone, social handle
   - `textmedia` — image upload
4. **Category** — a grouping tag such as `Event` or `Demographics`.
5. **Description (optional)** — what this tracks.
6. **Visible in Clicker** / **Editable in Manual** — the two flags that decide where the field appears during data entry.

Name, Label, and Category are required. Click **Create**.

> Note: The create modal also renders type-specific helper fields (max length, subtype, currency symbol, min/max, max file size). Treat these as guidance for the value you enter; the always-persisted fields are name, label, type, category, description, and the two flags.

### 4. Edit a variable
Click **Edit** on a card. You can always change the **Label**, **Category**, and the **Visible in Clicker** / **Editable in Manual** flags. The **Type** is shown read-only. The **Name** is editable only for custom variables — built-in (registry) variables show "Built-in variables cannot be renamed here to avoid breaking stored data."

### 5. Delete a variable
Custom variables show a **Delete** button (with a confirm prompt). **System variables have no Delete button** — they map to stored schema fields and are protected. Deleting also force-refreshes the shared cache so the removal shows up immediately.

### 6. Export the catalog
The hero has **Export CSV** and **Export JSON** buttons. Both export the **currently filtered** list, timestamped. CSV columns are: `name, label, type, source, category, visibleInClicker, editableInManual, derived, description`. Use these for audits or to hand the catalog to a colleague.

### 7. A worked example — one variable, two destinations
Suppose you want to count VIP guests at an activation and show them on the report:
1. **Create** a variable here: name `vipGuests`, label `VIP Guests`, type `count`, category `Event`, with **Visible in Clicker** and **Editable in Manual** both ticked.
2. In [Clicker sets](guides-tutorial-clicker-sets.md), add `vipGuests` to a variable group so it appears as a counter in the editor.
3. Operators tap the counter during the event; the value lands on the event's `stats.vipGuests`.
4. In [Charts & formulas](guides-tutorial-charts-formulas.md), reference it as `[vipGuests]` — for example a KPI chart with formula `[vipGuests]`, or a ratio like `[vipGuests] / [eventAttendees] * 100` with a `%` suffix.

The exact same string `vipGuests` did all four jobs. That single-name principle is the whole point of the catalog.

## Managing it
**Source is computed, not stored.** The `manual / system / derived / text` badge is derived on the fly: a variable with a formula reads `derived`; a `text` type reads `text`; a variable whose category starts with `bitly` reads `system`; everything else reads `manual`. So changing a variable's category (e.g. into a Bitly grouping) can change how it is classified in the filters.

**System vs custom.** Variables flagged `isSystem` (shown with the **Legacy stats.** badge and a `system` source) are engine-managed schema fields — they cannot be deleted here and their name cannot be changed. Custom variables you create can be freely renamed and deleted.

**Derived variables.** A variable can carry a **formula** and be marked `derived`; its description then shows the formula and its source badge reads `derived`. Derived variables are computed rather than entered, so they typically are not clicker counters.

**The cache.** The catalog is cached for performance (about five minutes). Every create, edit, and delete triggers a cache invalidation so the change is visible right away — but if you edited the database directly (don't), other surfaces might lag. From [Clicker sets](guides-tutorial-clicker-sets.md) and [Charts & formulas](guides-tutorial-charts-formulas.md), the **Refresh Variables** button forces the same invalidation so a newly created variable appears without waiting.

**Where a variable shows up next.** Creating a variable here does not automatically put it anywhere. To make it a clicker counter, add it to a variable group in a [clicker set](guides-tutorial-clicker-sets.md) (only variables flagged **Visible in Clicker** can be added). To put it on a report, reference `[name]` in a [chart formula](guides-tutorial-charts-formulas.md).

## Gotchas & good practice
- **Name = key = token.** The name you type is the exact stats key and the exact formula token. `[female]` in a formula only works because the variable is named `female`. There is no aliasing of the underlying key.
- **camelCase only.** No spaces, no `stats.` prefix, no dashes. The page rejects anything else with "Name must be camelCase (e.g., fanCount, vipGuests, female)".
- **Don't rename built-ins.** System variables are locked precisely because a rename would orphan stored data and break every formula that references them.
- **Flags are not the same as visibility everywhere.** "Visible in Clicker" only makes a variable *eligible* to be placed in a clicker group — it still has to be added to a group in a clicker set to actually appear.
- **A new variable that "won't show up"** is almost always the cache or a missing group assignment, not a bug. Click **Refresh Variables** on the Clicker or Charts page, then confirm the variable is in a group.
- **Export before bulk changes.** Grab a CSV/JSON snapshot before a cleanup pass so you can diff what changed.

## How it connects
- **Data entry:** which variables become counters, and their order, is set in [Clicker sets & variable groups](guides-tutorial-clicker-sets.md); the entry experience itself is [Collecting data](guides-tutorial-collecting-data.md).
- **Reporting:** variable names become `[token]` references in [Charts & formulas](guides-tutorial-charts-formulas.md).
- **Text & image variables:** longer-form content variables are managed alongside the [Content Library](guides-tutorial-content-library.md).
- **Deeper reference:** the operational [Variable Management Guide](guides-variable-management.md) covers the formula engine and validation lifecycle in detail.

## Screenshots
_Screenshots to be added._

## Related tutorials
- [Clicker sets & variable groups](guides-tutorial-clicker-sets.md)
- [Charts & formulas](guides-tutorial-charts-formulas.md)
- [Content Library (images & text)](guides-tutorial-content-library.md)
- [Collecting event data](guides-tutorial-collecting-data.md)
- [Variable Management Guide](guides-variable-management.md)
