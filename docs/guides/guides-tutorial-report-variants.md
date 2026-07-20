# Tutorial: Report variants
Status: Active
Last Updated: 2026-07-20T00:00:00.000Z
Canonical: Yes
Owner: Documentation

> Audience: Internal operators & implementation partners · Prerequisites: A partner or organisation that already has a working report · Related: [guides-tutorial-reports.md](guides-tutorial-reports.md), [guides-tutorial-report-themes.md](guides-tutorial-report-themes.md), [guides-tutorial-sharing-access.md](guides-tutorial-sharing-access.md)

## What it is & why it matters

A **report variant** is a saved, time-scoped version of one owner's report. The same partner or organisation can publish several: an all-time overview, a "this year" cut, a "last 30 days" snapshot, or a custom date range for one campaign — each with its own shareable link.

Without variants you would have one report per owner and would have to re-filter it by hand every time someone asked for a different window. Variants let you prepare each cut once, publish it, and hand out a stable URL.

Every variant belongs to an **owner**. In the model an owner is an organisation, a partner, a hashtag, or a filter. The two places you actively manage variants are:

- **Partner reports:** `/admin/partners/[id]/reports`
- **Organisation reports:** `/admin/organizations/[id]/reports`

Both screens work the same way; the examples below apply to either.

## Before you start

- The owner needs a working report already — a resolved template and (usually) a style. If the partner or organisation report does not render on its own yet, sort that first via [guides-tutorial-reports.md](guides-tutorial-reports.md).
- Be signed in with admin access to the Reporting workspace. See [guides-tutorial-authentication-sso.md](guides-tutorial-authentication-sso.md).
- Decide the **time window** each variant should cover before you create it (all-time, this month, last 30 days, this year, last year, or a custom start/end). You can change it later, but naming a variant after its window keeps the list readable.

## Step by step

### 1. Open the reports workspace

Go to `/admin/partners/[id]/reports` (or `/admin/organizations/[id]/reports`). The header shows the owner's name plus a summary strip: **Default Report**, **Variants** (count), and **Published** (count). A note reminds you that *DEFAULT always stays the canonical all-time report, and every custom variant starts as a duplicate of DEFAULT.*

### 2. Understand the virtual DEFAULT

Before you create anything, the list already shows one entry: **DEFAULT**. This is a *virtual* variant — it is not stored as a document yet, it simply represents the owner's canonical, all-time report. It is always marked **DEFAULT**, always **published**, and always uses the **All Time** period.

The header's **"Open Default Report"** button opens exactly this report. You cannot rename, archive, or re-scope the virtual DEFAULT — it is the baseline every custom variant is copied from.

### 3. Create a custom variant

Click **"+ Create Report Variant"** to open the create dialog and fill in:

- **Variant Name** (required) — e.g. *Renewal 2026* or *CHL This Year*.
- **Time Period** — one of six presets:
  - **All Time** (`all_time`)
  - **This Month** (`this_month`)
  - **Last 30 Days** (`last_30_days`)
  - **This Year** (`this_year`)
  - **Last Year** (`last_year`)
  - **Custom Time Period** (`custom`)
- **Start Date / End Date** — shown only when the period is **Custom Time Period**. Both are required, and the end date must be on or after the start date.

Submit with **"Create Variant"**. The new variant is created as a **duplicate of DEFAULT** — it inherits DEFAULT's template, style, logo, emoji and display toggles — then applies the time window you chose. It starts in **draft** status. Its URL slug is generated from the name (and de-duplicated automatically if a slug already exists, so two "Renewal 2026" variants become distinct).

### 4. Review the variant card

Each stored variant appears as a card showing:

- A **DEFAULT** or **CUSTOM** badge, plus a status badge (**draft**, **published**, or **archived**).
- The variant name and its resolved period label (a custom range shows as *start to end*).

### 5. Publish it

New custom variants are **draft** until you publish. Click **Publish** on the card to move it to **published**. Only published variants are meant to be shared onward; draft is your staging state.

### 6. Open, edit and share

Three actions on every card:

- **Open Report** — opens the rendered report for that variant in a new tab. The default opens at the plain report URL; a custom variant appends `?variant=<slug>`.
- **Edit Report** — deep-links into the report editor for that exact variant (`…-edit/[id]?variant=<slug>`), so text, images, style and template edits land on the right version.
- **Share Report** — opens the share dialog for that variant (covered under [How it connects](#how-it-connects)).

### 7. Worked example: a "This Year" cut for a partner

1. On `/admin/partners/[id]/reports`, click **"+ Create Report Variant"**.
2. Name it *2026 Season*, choose **This Year**, and create it. It appears as a **CUSTOM**, **draft** card scoped to the current year.
3. Click **Edit Report** and adjust any variant-specific text or images; the editor opens at `…-edit/[id]?variant=2026-season`.
4. Click **Publish** to move it from draft to published.
5. Click **Share Report** and distribute the link with its page password.
6. Next year, rather than deleting it, **Archive** *2026 Season* and create *2027 Season* — the old cut stays available if anyone needs last year's numbers.

## Status lifecycle at a glance

A stored variant is always in one of three states:

- **draft** — the starting state for every newly created custom variant. Not intended for distribution.
- **published** — live; this is the state you share. **Publish** moves a draft or archived variant here.
- **archived** — retired but preserved. **Archive** moves a published variant here; it keeps its slug and settings and can be re-published later.

The virtual **DEFAULT** is always **published** and cannot be archived. Promoting a custom variant with **Set Default** also publishes it in the same step.

## Managing it

**Rename.** On a custom card, **Rename** prompts for a new name. (DEFAULT cannot be renamed.)

**Set Default.** **Set Default** on a custom variant promotes it: it becomes the owner's default *and* is published in the same action, and the previous default is unset. Note this changes what **"Open Default Report"** returns for everyone.

**Publish / Archive.** A variant moves between **published** and **archived** from the card:
- **Publish** takes a draft or archived variant live.
- **Archive** retires a published variant without destroying it.

The archived state is how you take a report out of circulation while keeping its configuration and history.

### There is no delete

**Variants cannot be deleted.** There is no delete button anywhere on these screens — the retirement path is **Archive**, not removal. An archived variant stays in the list, keeps its slug and settings, and can be re-published later if you need it back. Plan naming and archiving accordingly, because the list only ever grows.

## Gotchas & good practice

- **Archive is the only "remove".** If a variant is stale, archive it. Do not expect a delete button — there isn't one, and archiving is deliberately reversible.
- **DEFAULT is virtual until you promote something.** Until a stored variant is Set as Default, the DEFAULT row is a stand-in for the canonical all-time report. Promoting a custom variant to default replaces what the default link shows.
- **Custom variants inherit DEFAULT at creation time.** They copy DEFAULT's template, style and display settings *when created*. Later changes to the baseline do not retroactively flow into existing variants — edit each variant if you need it updated.
- **Draft ≠ shared.** A freshly created variant is draft. Share links resolve the variant, but keep drafts unpublished until the content is final.
- **Custom range validation is strict.** For a custom period, both dates are required and the end must not precede the start; the form blocks submission otherwise.
- **Slugs are auto-generated and unique.** You name the variant; messmass derives and de-duplicates the slug. The slug is what appears in the `?variant=` URL and in the share identifier.

## How it connects

**Sharing uses a page password.** The **Share Report** action opens the standard share dialog. Under the hood a variant is shared with a compound page identifier: the owner's base page id plus its variant slug, written as **`id::variant=<slug>`**. The DEFAULT variant shares under the plain base id (no `::variant=` suffix). Access is gated by a **page password**, exactly like other shared report pages — see [guides-tutorial-sharing-access.md](guides-tutorial-sharing-access.md) for how page passwords are set and distributed.

**Variants sit on top of templates and styles.** A variant does not replace the report structure; it reuses the owner's resolved **template** (see [guides-tutorial-reports.md](guides-tutorial-reports.md)) and may carry its own **style** (see [guides-tutorial-report-themes.md](guides-tutorial-report-themes.md)) and time window. Think of the layers as: template = structure, style = look, variant = which time window and which published cut.

**Owners.** The two managed surfaces are **partners** ([guides-tutorial-partners.md](guides-tutorial-partners.md)) and **organisations** ([guides-tutorial-organisations.md](guides-tutorial-organisations.md)). The underlying model also recognises hashtag and filter owners; see [guides-tutorial-hashtags-filters.md](guides-tutorial-hashtags-filters.md).

**URLs at a glance.** The DEFAULT variant uses the plain report and editor URLs; a custom variant appends `?variant=<slug>`:

| Owner | Report (DEFAULT) | Report (custom) | Editor (custom) |
|-------|------------------|-----------------|-----------------|
| Partner | `/partner-report/<slug>` | `/partner-report/<slug>?variant=<slug>` | `/partner-edit/<slug>?variant=<slug>` |
| Organisation | `/organization-report/<id>` | `/organization-report/<id>?variant=<slug>` | `/organization-edit/<id>?variant=<slug>` |

You rarely type these by hand — the **Open Report** and **Edit Report** buttons build them for you — but recognising the pattern helps when someone pastes you a link and asks which variant it points at.

## Screenshots
_Screenshots to be added._

## Related tutorials

- [guides-tutorial-reports.md](guides-tutorial-reports.md) — the template a variant renders
- [guides-tutorial-report-themes.md](guides-tutorial-report-themes.md) — the style a variant can carry
- [guides-tutorial-sharing-access.md](guides-tutorial-sharing-access.md) — page passwords and share links
- [guides-tutorial-partners.md](guides-tutorial-partners.md) — partner-owned reports
- [guides-tutorial-organisations.md](guides-tutorial-organisations.md) — organisation-owned reports
- [guides-tutorial-hashtags-filters.md](guides-tutorial-hashtags-filters.md) — hashtag and filter owners
- [guides-tutorials-index.md](guides-tutorials-index.md) — full tutorial index
