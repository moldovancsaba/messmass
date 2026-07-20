# Tutorial: Partners
Status: Active
Last Updated: 2026-07-20T00:00:00.000Z
Canonical: Yes
Owner: Documentation

> Audience: Operators (user/admin) & implementation partners · Prerequisites: A messmass account with the `user` role or higher · Related: [Getting started](guides-tutorial-getting-started.md) · [Organisations](guides-tutorial-organisations.md) · [Events](guides-tutorial-events.md)

## What it is & why it matters

A **partner** is the team, club, federation, venue, or sponsor that owns events. In the mental model **Organisation → Partner → Event → Report**, the partner is where reusable identity and reporting defaults live.

Partners matter because they are metadata templates. Set an emoji, hashtags, a logo, a report template, and a clicker set on the partner once, and every event created for that partner inherits them. That keeps a season of events consistent without re-entering setup each time.

Partners also get their own shareable **partner report** (`/partner-report/[slug]`) that rolls up all of the partner's events, and can carry multiple **report variants** for different audiences or time windows.

> Note: The Partners surface is available to `user`, `admin`, and `superadmin`. Reporting defaults such as report template, style, and clicker set are meaningful once you have those objects configured (see the related tutorials at the end).

## Before you start

- **Have a role of `user` or higher.** Guests cannot manage partners.
- **Decide the organisation.** If this partner belongs to an organisation, you assign it from the Organizations page after creating it (see "Assigning to an organisation" below). A partner belongs to at most **one** organisation.
- **Gather identity assets.** A name and an emoji are required. Optionally have a TheSportsDB team, a logo, hashtags, and a report template/style/clicker set in mind.

## Step by step

Open **Partners** at `/admin/partners` (Entities group). The page is titled **Partner Management**. Click **Add Partner** to start. Create and edit both use a two-step flow: **Basics** first, then **Reporting & Integrations**.

### Step 1 — Partner Basics

- **Partner Name*** — required (e.g. `FC Barcelona`, `UEFA`, `Camp Nou`).
- **Partner Emoji*** — required; chosen via the emoji selector.
- **Show emoji in reports and displays** — checkbox; uncheck to hide the emoji while keeping it stored (`showEmoji`, defaults to true).
- **TheSportsDB** — search and link a sports team to auto-populate logo, colours, stadium, and hashtags. See [Sport databases](guides-tutorial-sport-databases.md).
- **Hashtags** — general and categorized hashtags via the unified hashtag input. See [Hashtags & filters](guides-tutorial-hashtags-filters.md).

Click **Continue to Reporting** to advance.

### Step 2 — Reporting & Integrations

- **Bitly Links** — attach tracking links (many-to-many). See [Bitly](guides-tutorial-bitly.md).
- **Report Visual Style** — the report colour theme (`styleId`); leave as "Use Default Style" to inherit. See [Report themes](guides-tutorial-report-themes.md).
- **Report Template** — the default report layout for this partner and its events (`reportTemplateId`). See [Reports](guides-tutorial-reports.md).
- **Clicker Set** — the default live-capture layout (`clickerSetId`). A starred entry marks the system default. See [Clicker sets](guides-tutorial-clicker-sets.md).
- **Auto-create + connect Google Sheet** (create flow only) — optionally provision a new Google Sheet, write headers, and connect it in one step. You still share the sheet with the partner's editors afterwards. See [Google Sheets](guides-tutorial-google-sheets.md).

Click **Create Partner** to finish. On success a confirmation card offers **Open Editor**, **Open Partner Report**, **Open Analytics**, and (if provisioned) **Open Google Sheet**.

### Key partner fields

| Field | Purpose |
|-------|---------|
| `name`, `emoji`, `showEmoji` | Identity and display |
| `hashtags`, `categorizedHashtags` | Tagging and filtering, inherited by events |
| `logoUrl` | CDN-hosted logo (from TheSportsDB badge or an upload) |
| `sportsDb` | Full TheSportsDB team profile (venue, league, country, badge, etc.) |
| `clickerSetId` | Default clicker layout for capture |
| `styleId` | Default report visual theme |
| `reportTemplateId` | Default report layout/template |
| `googleSheetsUrl` | Canonical linked Google Sheet |
| `viewSlug` | Shareable slug for the public partner report/editor |
| `showOnlyTeam1Events` | Restrict the partner report to home/Team 1 appearances (edit flow) |

> Note: The current partner record and admin form do **not** expose separate `cityId` / `countryId` fields. Geography comes from the linked TheSportsDB profile (`sportsDb.strCountry`, `sportsDb.strStadiumLocation`) rather than dedicated city/country IDs. Treat those as sports-DB-derived, not first-class partner fields.

## Managing it

### Recommended setup order

The two-step flow is deliberately identity-first, integrations-second. A dependable order:

1. **Basics** — name, emoji, and (if it is a sports club) the TheSportsDB link so logo, venue, and league hashtags auto-populate.
2. **Hashtags** — confirm the general and categorized tags the partner's events should inherit.
3. **Reporting defaults** — choose the report template, visual style, and clicker set so new events start correctly.
4. **Distribution** — attach Bitly links and connect a Google Sheet if the partner maintains events externally.
5. **Organisation** — have a superadmin assign the partner to its organisation from `/admin/organizations`.

### Editing a partner

Use the row's edit action to reopen the two-step modal. The edit flow adds a few things the create flow does not:

- **Partner UUID** — read-only identifier shown in Basics, useful for referencing the partner in Sheets or analytics.
- **Only Include Local/Home Events (Team 1)** — when enabled, the partner report only aggregates and lists events where the partner is Team 1 / the home side (`showOnlyTeam1Events`).
- **Google Sheet URL or ID** with inline connect and sync controls (see below).

### Assigning to an organisation

Partners are assigned to an organisation from the **Organizations** page, not from the partner form. A superadmin opens `/admin/organizations`, clicks **Manage Members** on the target organisation, adds the partner, and saves. A partner belongs to exactly one organisation. See [Organisations](guides-tutorial-organisations.md).

### Partner report and report variants

- The public partner report lives at `/partner-report/[slug]`, where `[slug]` is the partner's `viewSlug` (falling back to its ID).
- The report-variants workspace is at `/admin/partners/[id]/reports`. `DEFAULT` is always the canonical all-time partner report; every custom variant starts as a duplicate of `DEFAULT`.
- Create a variant with **+ Create Report Variant**: give it a name and a **Time Period** — All Time, This Month, Last 30 Days, This Year, Last Year, or a **Custom Time Period** with start/end dates.
- Each variant carries a status (`draft` / `published` / `archived`) and inline actions: **Open Report**, **Edit Report**, **Share Report**, **Rename**, **Set Default**, **Publish**, **Archive**. A non-default variant opens at `/partner-report/[slug]?variant=[variant-slug]`.

See [Report variants](guides-tutorial-report-variants.md).

### Enriching a partner from a sports database

In the partner modal, use the **TheSportsDB** search to find and link the club. Linking pulls in the badge (logo), venue, league, country, and founding year. If the team is not found (the free API has gaps), click **Can't find it? Enter manually** and fill **Venue Name**, **Venue Capacity**, **League Name**, **Country**, **Founded Year**, and a **Logo URL** (or upload a file — uploaded logos are hosted on ImgBB and the hosted URL is stored back). See [Sport databases](guides-tutorial-sport-databases.md).

### Connecting a Google Sheet

In the edit modal's Reporting & Integrations step:

- Paste a **Google Sheet URL or ID**, or click **Create & Connect New Google Sheet** to provision a fresh one.
- **Connect & Setup Google Sheet** renames the tab, adds columns, populates existing events, and connects the sheet.
- **Sheet → Mess** pulls rows from the sheet into messmass; **Mess → Sheet** pushes events out to the sheet.
- **Prefix UUID in Sheet Title** stamps the partner UUID onto the spreadsheet title for traceability.

After connecting, share the sheet with the partner's editors so they can maintain event rows themselves. See [Google Sheets](guides-tutorial-google-sheets.md).

## Gotchas & good practice

- **Name and emoji are mandatory.** The form blocks submission until both are set, on create and edit.
- **Deleting a partner does not delete its events.** There is no cascade — events created from the partner keep their inherited metadata, and Bitly links (many-to-many) are untouched. Delete is a confirm-and-remove action, so treat it as intentional.
- **Set defaults on the partner, not per event.** Report template, style, clicker set, hashtags, and logo defined here flow down to new events, which is the whole point of the partner as a template.
- **Organisation assignment is elsewhere.** Do not look for an org picker in the partner form — it lives on the Organizations page and is superadmin-only.
- **`showOnlyTeam1Events` reshapes the report.** Enabling it removes away/Team 2 appearances from both the aggregate stats and the event list — expect the numbers to drop.

> Note: Partners are mirrored into the **Camera app** as shared identities. When a messmass event is created for a partner, messmass ensures a matching Camera partner (creating it under the partner's Camera organisation if needed) and stamps the Camera partner ID back onto the record. Ops helpers can also link existing partners or backfill events. See [Camera app](guides-tutorial-camera-app.md).

## How it connects

- **Organisations** group partners and drive org-level reporting — see [Organisations](guides-tutorial-organisations.md).
- **Events** are created under a partner and inherit its defaults — see [Events](guides-tutorial-events.md).
- Reporting defaults reference **templates**, **themes**, **clicker sets**, and **variants** — see [Reports](guides-tutorial-reports.md), [Report themes](guides-tutorial-report-themes.md), [Clicker sets](guides-tutorial-clicker-sets.md), and [Report variants](guides-tutorial-report-variants.md).
- Integrations connect through **TheSportsDB**, **Bitly**, and **Google Sheets** — see [Sport databases](guides-tutorial-sport-databases.md), [Bitly](guides-tutorial-bitly.md), and the reference [features: Google Sheets integration](../features/features-google-sheets-integration.md).
- A deeper technical reference lives at [features: Partners system guide](../features/features-partners-system-guide.md).

## Screenshots
_Screenshots to be added._

## Related tutorials

- [Tutorials index](guides-tutorials-index.md)
- [Getting started](guides-tutorial-getting-started.md)
- [Organisations](guides-tutorial-organisations.md)
- [Events](guides-tutorial-events.md)
- [Sport databases](guides-tutorial-sport-databases.md)
- [Google Sheets](guides-tutorial-google-sheets.md)
- [Report variants](guides-tutorial-report-variants.md)
- [Report themes](guides-tutorial-report-themes.md)
- [Reports](guides-tutorial-reports.md)
- [Clicker sets](guides-tutorial-clicker-sets.md)
- [Camera app](guides-tutorial-camera-app.md)
