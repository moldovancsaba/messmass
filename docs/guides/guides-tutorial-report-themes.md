# Tutorial: Report themes & styles
Status: Active
Last Updated: 2026-07-20T00:00:00.000Z
Canonical: Yes
Owner: Documentation

> Audience: Internal operators & implementation partners · Prerequisites: Admin access to the Reporting workspace · Related: [guides-tutorial-reports.md](guides-tutorial-reports.md), [guides-tutorial-report-variants.md](guides-tutorial-report-variants.md), [guides-tutorial-partners.md](guides-tutorial-partners.md)

## What it is & why it matters

A **report style** (the admin area calls them **Report Themes**) is the colour-and-typography skin applied to a rendered report. Where a Report Template decides *what* appears and *how it is arranged* (see [guides-tutorial-reports.md](guides-tutorial-reports.md)), a style decides *how it looks*: the hero background, chart colours, KPI icon colour, pie and bar palettes, tooltip colours, the report font, and a set of optional spacing/size values.

Styles are **reusable**. You build a theme once — say a partner's brand colours — and attach it wherever that brand should appear. One theme can skin many events, so rebranding is a single edit rather than a per-event chore.

- **Admin UI:** `/admin/styles` (the list) and `/admin/styles/[id]` (the editor).
- **Stored in:** the `report_styles` collection.

> Note: `page_styles_enhanced` is a **legacy** style system that has been **superseded by `report_styles`**. New and edited themes live in `report_styles`. If you encounter `page_styles_enhanced`, treat it as historical — do not build new themes there.

### Two colour scopes in one theme

A single theme actually carries two sets of colours:

- **Report colours (26 fields)** — everything the report page itself uses: hero, chart containers, chart typography, KPI icon, bar and pie palettes, and chart states. These are the fields you will touch most.
- **Landing colours (9 fields)** — the public landing surface (hero gradient, hero text, CTA borders, page background). Setting these lets a theme brand the landing page as well as the report.

Together that is 35 colour fields, plus the font family and the optional dimension/surface values. You can safely ignore the landing colours if a theme is only ever used for reports.

## Before you start

- Be signed in to the admin area with access to the Reporting workspace. See [guides-tutorial-authentication-sso.md](guides-tutorial-authentication-sso.md).
- Have the brand's colour values ready (hex codes). The editor stores colours as 8-character hex with an alpha channel — `#RRGGBBAA` — so you can set transparency, not just the base colour.
- Know where the theme should apply: a single event, a whole partner, or as a template default. That decision drives assignment, covered under [How it connects](#how-it-connects).
- If the font you want is not in the dropdown, it must first exist in the platform's font list — the editor only offers fonts already registered.

## Step by step

### 1. Open the themes list

Go to `/admin/styles`. The page header reads **"Report Themes"** with the subtitle *"Manage reusable visual themes for report pages"*. Each existing theme is a card showing its name, an optional description, a small swatch preview (Hero, Chart, Icon, Bar 1, Bar 2, Pie), and the last-updated date.

### 2. Create a new theme

Click **"Create New Style"** (top-right of the list). This opens the editor at `/admin/styles/new`. The editor is a split screen:

- **Left — Live Preview:** a miniature report that repaints on every change.
- **Right — Colors:** the form.

Start with the basics at the top of the form:

- **Style Name \*** — required; this is how you will recognise the theme later.
- **Description** — optional free text.
- **Font Family** — a dropdown populated from the platform's registered fonts. This font is applied to all text in the report.

### 3. Set the colours

Below the basics, the colour fields are grouped into categories. There are **26 report colour fields** in these groups:

- **Hero Section (5)** — Hero Background, Heading Color, Export Button BG, Export Button Text, Export Button Hover.
- **Chart Container (2)** — Chart Background, Chart Border.
- **Chart Typography (4)** — Chart Title, Chart Label, Chart Value, Text Content.
- **KPI Charts (1)** — KPI Icon Color.
- **Bar Charts (5)** — Bar Color 1 through Bar Color 5.
- **Pie Charts (3)** — Pie Color 1, Pie Color 2, Pie Border.
- **Chart States (6)** — No Data Background/Border/Text, Error Background/Text, Tooltip Background/Text (the empty-state, error, and tooltip colours).

Each field is a colour picker; the preview on the left updates immediately so you can judge combinations without saving.

There is a further group of **9 Landing colours** (hero gradient start/mid/end, hero text, muted text, CTA borders and hover states, page background). These skin the public landing surface as well as the report; set them only if your theme should reach the landing page too.

### 4. (Optional) Set dimensions & surfaces

Under **"Dimensions & surfaces"** the editor exposes optional length/size fields. Leave them blank to inherit the platform defaults; fill one in to override it. They fall into three groups:

- **Landing dimensions** — section padding, hero padding, card widths, FAQ/paragraph max widths, icon size.
- **Surfaces** — card border radius and card shadow (these affect report cards too).
- **Landing typography** — block title, block value, and block icon sizes.

Each field carries a placeholder showing the expected format, for example `3.5rem`, `0.75rem`, or `65ch`.

### 5. Save

Click **"Save Style"**. Before saving, the editor validates that the name is present and every colour is a valid hex value; if something is off, the status line shows the first problem. On a successful create you are redirected to the theme's own edit page (`/admin/styles/<id>`), from which further edits save in place.

### 6. Assign the theme

Saving a theme does not display it anywhere yet. Attach it to an event, partner, template or filter/hashtag — see [How it connects](#how-it-connects) — and it takes effect on the next report render.

### 7. Worked example: a partner brand theme

Suppose a partner uses a dark navy hero with a lime accent.

1. Create a theme named *Acme — Brand*.
2. Set **Hero Background** to the navy (include an alpha byte if you want slight translucency, e.g. `#0f172aff`).
3. Set **Heading Color** to a light value so the event title reads against navy.
4. Set **Bar Color 1** and **Pie Color 1** to the lime accent, and pick a complementary **Bar Color 2**–**Bar Color 5** ramp.
5. Set **KPI Icon Color** to the same lime so tiles feel consistent.
6. Choose the brand **Font Family** from the dropdown, watch the left preview, then **Save Style**.
7. Assign *Acme — Brand* to the partner. Every event under that partner now renders in brand colours unless an individual event overrides the style.

## Managing it

**Edit.** From the list, click **Edit** on a card (or open `/admin/styles/[id]`). The header shows **"Edit: <name>"**. Adjust anything and click **Save Style**; changes propagate to every report that resolves to this theme.

**Duplicate a look manually.** There is no one-click "copy theme" button. To base a new theme on an existing one, open the original, note its values (or open it in a second tab as reference), then build the new theme in `/admin/styles/new`. Give it a clearly different name.

**Delete.** Each card has a delete action. It asks to confirm — *"Delete style ... This cannot be undone."* Deletion is permanent, so before removing a theme, make sure nothing still points at it; otherwise those reports fall back down the style hierarchy (described below) and may look different than expected.

**Live preview is your safety net.** Because the preview repaints continuously, treat it as the source of truth while editing — especially for transparency (the alpha byte) and for dark hero backgrounds where low-contrast text can hide.

**Chart-state colours are easy to forget.** The six Chart States fields (no-data background/border/text, error background/text, tooltip background/text) only show up in edge cases — an empty chart, an error, or a hover tooltip. They still ship with every theme, so set them to something on-brand rather than leaving jarring defaults that only appear at the worst moment.

**Dimensions inherit unless overridden.** A blank dimension field means "use the platform default". This is usually what you want — only override a spacing, radius, shadow or font-size value when the brand genuinely requires it, and use the placeholder format shown in each field.

## Gotchas & good practice

- **Colours are 8-character hex.** `#RRGGBBAA`. A 6-character value is accepted and normalised to fully opaque (`ff` alpha). If a colour looks washed out, check its alpha byte.
- **A theme is skin only.** It never changes which charts or blocks appear — that is the template's job ([guides-tutorial-reports.md](guides-tutorial-reports.md)). If a chart is missing, fix the template, not the theme.
- **Font must exist first.** The dropdown lists only registered fonts. Typing a font name elsewhere will not add it.
- **Assign, don't just save.** A saved but unassigned theme is invisible. Confirm the event/partner/template actually references it.
- **Deleting is destructive and silent downstream.** Reports do not error when their theme is deleted; they quietly drop to the next level of the hierarchy. Reassign before deleting.
- **Landing colours reach beyond the report.** The 9 landing fields also affect the public landing surface — only fill them if that is intended.

## How it connects

**Style resolution (precedence).** When a report renders, messmass resolves a single style by taking the **first one that is set**, in this order:

1. **Project / event style** — the style set directly on the event. Highest priority; overrides everything for that one event's report.
2. **Partner style** — the partner's style. Applies to all of that partner's events that do not set their own, and to the partner report itself.
3. **Template style** — the default style attached to the report template. Used when neither the event nor the partner specifies one.

In short: **project style › partner style › template style.** The first non-empty value wins.

**Filter and hashtag reports** do not add a new style tier. They resolve a template (see [guides-tutorial-hashtags-filters.md](guides-tutorial-hashtags-filters.md)) and inherit **that template's style** (or the partner/project style where that resolution path applies).

**Variants** can carry their own style, letting one owner publish the same report in two different looks. See [guides-tutorial-report-variants.md](guides-tutorial-report-variants.md).

**Where you assign a style:**
- **Event:** on the event record — see [guides-tutorial-events.md](guides-tutorial-events.md).
- **Partner:** on the partner record — see [guides-tutorial-partners.md](guides-tutorial-partners.md).
- **Organisation:** on the organisation — see [guides-tutorial-organisations.md](guides-tutorial-organisations.md).

## Screenshots
_Screenshots to be added._

## Related tutorials

- [guides-tutorial-reports.md](guides-tutorial-reports.md) — the templates and blocks a theme skins
- [guides-tutorial-report-variants.md](guides-tutorial-report-variants.md) — per-variant styles
- [guides-tutorial-partners.md](guides-tutorial-partners.md) — assigning a partner style
- [guides-tutorial-events.md](guides-tutorial-events.md) — assigning an event style
- [guides-tutorial-hashtags-filters.md](guides-tutorial-hashtags-filters.md) — how filter/hashtag reports pick up a style
- [guides-tutorial-sharing-access.md](guides-tutorial-sharing-access.md) — publishing a themed report
- [guides-tutorials-index.md](guides-tutorials-index.md) — full tutorial index
