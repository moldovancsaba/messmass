# Tutorial: Building reports
Status: Active
Last Updated: 2026-07-20T00:00:00.000Z
Canonical: Yes
Owner: Documentation

> Audience: Internal operators & implementation partners · Prerequisites: Admin access to the Reporting workspace; at least one event with data · Related: [guides-tutorial-report-themes.md](guides-tutorial-report-themes.md), [guides-tutorial-report-variants.md](guides-tutorial-report-variants.md), [guides-tutorial-charts-formulas.md](guides-tutorial-charts-formulas.md)

## What it is & why it matters

A messmass report is what a partner or organisation actually sees: a page of charts, KPIs, images and text arranged in a repeatable layout. You do not hand-build that page for every event. Instead you build a **Report Template** once, and every event, partner or organisation that resolves to that template renders the same structure with its own data.

The report stack has three nested pieces. Learn these words first — the rest of the tutorial uses them constantly:

- **Report Template** — the top-level layout. Built in the **Report Builder** at `/admin/visualization`. A template owns its responsive grid, its report header (HERO) settings, and an ordered list of blocks. Stored in the `report_templates` collection.
- **Data Block** — a horizontal band inside a template. A block groups a few charts together and can show its own title. Stored in the `data_blocks` collection.
- **Chart** — a single visual unit inside a block (a KPI tile, a pie, a bar chart, a text panel, a table, an image). Charts are defined elsewhere (see [guides-tutorial-charts-formulas.md](guides-tutorial-charts-formulas.md)); a block only references them and decides how wide each one sits.

So the composition is: **Template → contains ordered Data Blocks → each Block contains Charts.**

> Note: Two collection names cause confusion. `reports_v12` is **not** a live collection — ignore it entirely if you ever see it referenced. The older `reports` collection is **legacy and effectively read-only**; the current Report Builder does not write to it. Everything you do in this tutorial writes to `report_templates` and `data_blocks`.

## Before you start

- You need to be signed in to the admin area with rights to the Reporting workspace. See [guides-tutorial-authentication-sso.md](guides-tutorial-authentication-sso.md) if you cannot reach `/admin`.
- Have at least one event with real numbers, so previews render meaningfully. See [guides-tutorial-events.md](guides-tutorial-events.md) and [guides-tutorial-collecting-data.md](guides-tutorial-collecting-data.md).
- Know which charts already exist. The builder only lets you drop in charts that have been defined; it does not create charts. See [guides-tutorial-charts-formulas.md](guides-tutorial-charts-formulas.md).
- Decide the **scope** of the template you are about to build: is it a fallback for every event (`event`), specific to one partner (`partner`), or the global default (`global`)? You can change the type later, but picking it up front keeps the template list readable.

## Step by step

### 1. Open the Report Builder

Go to `/admin/visualization`. The page header reads **"👁️ Report Builder"** with the subtitle *"Manage report blocks, chart layouts, and template composition"*. The builder remembers the last template you edited, so on later visits it reopens where you left off.

### 2. Pick or create a template

Use the template selector near the top to switch between existing templates. Each entry shows its name and type, and the current default is marked with a star.

To create one, open **"➕ Create New Report Template"** and fill in:

- **Template Name \*** — e.g. *Partner Annual Report* or *Event Dashboard*.
- **Description** — optional, admin-facing only.
- **Template Type \*** — one of three radio options: **Event Report** (`event`), **Partner Report** (`partner`), or **Global Default** (`global`).
- **Set as default template** — a checkbox. Only one template can be the default at a time; ticking this clears the flag on whichever template held it before.

A new template starts empty, with a responsive grid of **4 desktop / 2 tablet / 1 mobile** units and no blocks. It is auto-selected so you can start adding blocks immediately.

### 3. Configure the report header (HERO)

Open the **"🏒 HERO Block Settings"** section. These toggles control what appears in the banner at the top of the rendered report:

- **Show Emoji** — display the event/partner emoji.
- **Show Date Info (Created/Updated)** — show the created/updated dates.
- **Show Export Options (PDF/Excel buttons)** — show the download buttons.

Below that, **alignment settings** keep blocks tidy across a row: **Align Titles**, **Align Descriptions**, **Align Charts**, and an optional **Minimum Element Height (px)**. These changes save automatically and apply to every report that uses this template.

### 4. Set the responsive grid

A template renders on three widths, each with its own column budget:

- **Mobile** — 2 units per row
- **Tablet** — 3 units per row
- **Desktop** — up to 6 units per row (block-configurable)

Think in **units**, not pixels. A unit is one column of horizontal space. A chart set to unit size 2 spans two columns.

### 5. Add data blocks

In the **"Data Visualization Blocks"** section, the current block count shows as *Current Blocks (N)*. Click **"➕ New Block"** to open **"➕ Create New Data Block"**:

- **Block Name** — e.g. *Main Dashboard* or *Performance Metrics*.
- **Order** — where the block sits vertically in the template (0 is first).

Save it, and the block is created **and** attached to the current template in one step.

### 6. Add charts to a block and size them

Expand a block with its **"⚙️ Show Settings"** toggle (it flips to **"⚙️ Hide Settings"**). Inside, you assign charts from the available list and give each one a layout:

- **Unit size** — `1` or `2` columns of horizontal space.
- **Aspect ratio** — the content shape: `1:1`, `2:1`, `16:9`, or `9:16`.

Allowed combinations depend on the chart type:

| Chart type | Unit size | Aspect ratio |
|------------|-----------|--------------|
| KPI        | 1         | 1:1 |
| Pie        | 1         | 1:1 |
| Bar        | 1 or 2    | 1:1 or 2:1 |
| Text       | 1 or 2    | 1:1 or 2:1 |
| Table      | 1 or 2    | 1:1 or 2:1 |
| Image      | 1 or 2    | 1:1, 16:9, or 9:16 |

The editor only offers valid options, and it keeps unit size and aspect ratio consistent — for example, an image at 16:9 becomes 2 units wide, and a bar at 2:1 becomes 2 units wide.

**Block capacity:** the unit sizes of all charts in a block must total **4 or less**. If the sum exceeds 4, the save is blocked and the editor tells you the current total. Split the charts across two blocks if you hit the limit.

### 7. Preview as you go

The builder renders a live WYSIWYG preview using the same grid and calculation pipeline as the real report pages, seeded with sample data. What you see in the preview is what a real event will render, minus its own numbers.

### 8. Assign the template to something

A template does nothing until an event, partner or organisation points at it:

- **Event (project):** set the template on the event itself when creating or editing it. See [guides-tutorial-events.md](guides-tutorial-events.md).
- **Partner:** set the template on the partner. Every event under that partner then falls back to it. See [guides-tutorial-partners.md](guides-tutorial-partners.md).
- **Organisation:** set on the organisation. See [guides-tutorial-organisations.md](guides-tutorial-organisations.md).

### 9. Worked example: a two-block event template

Suppose you want a simple event report with a headline row and a demographics row.

1. Create a template named *Event Dashboard*, type **Event Report**, and leave it as the default if this should be the fallback for all events.
2. In HERO settings, keep **Show Emoji** and **Show Export Options** on; the header then carries the event emoji and the PDF/Excel buttons.
3. Add a block named *Headline*. Give it two KPI charts (each fixed at 1 unit) and one bar chart at 2 units. Total = `1 + 1 + 2 = 4` units — exactly the block cap.
4. Add a second block named *Audience*, ordered after the first. Drop in two pie charts (1 unit each) and one 2-wide bar. Again 4 units.
5. Watch the live preview arrange both rows using the responsive grid, then assign *Event Dashboard* to an event and open its report.

If you later try to add a fifth unit to either block, the save is rejected until you free up space or move a chart to a new block.

## Managing it

**Manage an existing template.** From the builder, open **"📝 Manage Report Template: <name>"**. This modal shows **Template Usage** — how many projects and partners currently point at this template — and lets you **rename** or **copy** it.

**Copying.** A copy duplicates the template *and* its data blocks, so the copy is fully independent — editing the copy never touches the original. Copies are never marked as default. Use a copy as a safe starting point when you want a variation without risking a live template.

**Deleting.** Deletion is guarded on purpose. Confirm through the **"Delete Report Template?"** dialog. Two rules stop accidental breakage:

- You **cannot delete the default template**.
- You **cannot delete a template that is still assigned** to any project or partner. The error tells you how many of each are still attached. Reassign them first, then delete.

**Reordering and removing blocks.** Block order is stored per template, so dragging or reordering blocks in the builder changes only this template's layout — not the blocks themselves. Removing a block from a template detaches it from that template; because blocks can be shared, prefer copying a template when you want an isolated set of blocks to edit freely.

**Available chart types.** Blocks accept KPI, pie, bar, text, table, image, and value-chain charts. KPI and pie are fixed at 1 unit / 1:1; bar, text and table can go 1 or 2 units wide; images support 1:1, 16:9 and 9:16. The builder only ever offers the combinations a given chart type allows.

**The default flag is unique.** Setting any template as default clears the previous default automatically — there is always exactly one.

## Gotchas & good practice

- **Blocks are shared until you copy.** A data block belongs to whichever template(s) reference it. If you want an isolated variant, **copy the template** (which clones its blocks) rather than editing a block that another template also uses.
- **Respect the 4-unit block cap.** It is the single most common reason a save is rejected. Two KPIs (1+1) plus a 2-wide bar (2) already fills a block.
- **KPI and Pie are fixed.** They are always 1 unit at 1:1 — you cannot widen them. Reach for Bar/Text/Table/Image when you need a wide element.
- **`event` type is the fallback, not a restriction.** The runtime does not filter the default template by type, and the assignment UI lets you attach any template type to events or partners. Type is mainly there to keep the list understandable.
- **Only `partner1` is used for template inheritance.** If an event has two partners, the second partner is ignored when resolving which template to render.
- **Ignore `reports_v12`; treat `reports` as read-only.** Only `report_templates` + `data_blocks` matter for anything you build here.

## How it connects

**Template resolution (precedence).** When a report page loads, messmass resolves which template to render by walking a fixed order and taking the first match:

**For an event (project):**
1. The event's own template, if set.
2. Otherwise the template of the event's `partner1`.
3. Otherwise the **global default** template (`isDefault = true`).
4. Otherwise a hardcoded fallback (empty template) so the page never crashes.

**For a partner report:**
1. The partner's own template.
2. Otherwise the global default.
3. Otherwise the hardcoded fallback.

In short: **project overrides partner, partner overrides default.** This is the same "Project → Partner → Default" hierarchy shown in the assignment screens.

**Styles vs. templates.** A template controls *structure* (which blocks, which charts, how wide). It does **not** hard-own the colours and fonts — those come from a separate style/theme that is resolved with its own precedence. See [guides-tutorial-report-themes.md](guides-tutorial-report-themes.md).

**Variants.** Partners and organisations can publish several time-scoped versions of the same report (this year, last 30 days, a custom range) on top of one template. See [guides-tutorial-report-variants.md](guides-tutorial-report-variants.md).

**Sharing.** Reports are exposed to external viewers through shareable, password-protected links. See [guides-tutorial-sharing-access.md](guides-tutorial-sharing-access.md).

## Screenshots
_Screenshots to be added._

## Related tutorials

- [guides-tutorial-report-themes.md](guides-tutorial-report-themes.md) — colours, fonts and dimensions for reports
- [guides-tutorial-report-variants.md](guides-tutorial-report-variants.md) — time-scoped versions of a report
- [guides-tutorial-charts-formulas.md](guides-tutorial-charts-formulas.md) — how the charts you drop into blocks are defined
- [guides-tutorial-events.md](guides-tutorial-events.md) — assigning a template to an event
- [guides-tutorial-partners.md](guides-tutorial-partners.md) — assigning a template to a partner
- [guides-tutorial-organisations.md](guides-tutorial-organisations.md) — organisation-level reporting
- [guides-tutorial-sharing-access.md](guides-tutorial-sharing-access.md) — publishing a report to external viewers
- [guides-tutorials-index.md](guides-tutorials-index.md) — full tutorial index
