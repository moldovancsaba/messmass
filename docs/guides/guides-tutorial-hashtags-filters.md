# Tutorial: Hashtags, categories & filters
Status: Active
Last Updated: 2026-11-15T19:00:00.000Z
Canonical: Yes
Owner: Documentation

> Audience: Internal operators & admins · Prerequisites: Admin sign-in; events/partners already tagged with hashtags · Related: [Partners](guides-tutorial-partners.md) · [Events](guides-tutorial-events.md) · [Sharing & access](guides-tutorial-sharing-access.md)

## What it is & why it matters
Hashtags are how you tag and later re-slice your data. You attach hashtags to partners and events; then you can pull up **every** event carrying a tag and see its aggregated stats, or combine several tags into a single filtered report.

Three admin surfaces work together:

| Surface | Route | Purpose |
|---|---|---|
| **🏷️ Hashtag Manager** | `/admin/hashtags` | Manage hashtag colours and browse all project hashtags |
| **🌍 Category Manager** | `/admin/categories` | Define hashtag categories (name, colour, display order) |
| **🔍 Hashtag Filter** | `/admin/filter` | Combine multiple hashtags into an aggregated, shareable report |

Why categories matter: a **categorized** hashtag belongs to a named group (e.g. category `city` → `budapest`, `vienna`, `prague`) and inherits that category's colour; a **general** (uncategorized) hashtag stands alone with only its own colour. Categories keep large tag sets organised and colour-coded consistently, so `budapest` and `vienna` always read as "cities" at a glance.

**Two kinds of hashtags, two kinds of reports.**
- Hashtags are either **typed by people** (on events and partners) or **written by Fanmass**, the local AI, from what it finds in the photos: brands and clubs read from the picture, people (`male`, `female`, `children`, `adults`…), emotions (`happy`, `neutral`…), sport, event. Every event keeps the Fanmass hashtags of its photos next to its typed ones (they are never mixed into the typed list; Fanmass refreshes them every 20 minutes).
- The two kinds **work together**: a filter finds an event by any mix of typed and Fanmass hashtags. A hashtag is one name in any spelling: case, `#` and underscores do not count (`otp_bank_pick_szeged` = `otpbankpickszeged`).
- The reports **never mix**: the **Clicker report** shows only what people entered by hand (clicker, forms); the **Fanmass report** shows only what the local AI measured and what Messmass calculates from it.

Report destinations:
- **Clicker report:** `/hashtag/{hashtag}` (one tag) and `/filter/{slug}` (several tags) — the hand-entered stats, shareable and password-protectable.
- **Fanmass report:** `/report/hashtag/{hashtag}` (one tag) and `/report/filter/{slug}` (several tags); `/report/global` holds every event together (admin or page password).

## Before you start
- Sign in as an admin. The Hashtag Manager and these surfaces are **admin-only** — non-admins see "Access Denied".
- Have events or partners already tagged. You attach hashtags on the event and partner forms (see [Events](guides-tutorial-events.md) and [Partners](guides-tutorial-partners.md)); this tutorial covers organising and reporting on those tags, not the initial tagging UI.
- Know that the resulting **filter and single-hashtag report pages are password-gated** — see [Sharing & access](guides-tutorial-sharing-access.md).

## Step by step

### 1. Manage hashtag colours (`/admin/hashtags`)
Open **🏷️ Hashtag Manager** ("Manage hashtag colors and browse all project hashtags"). Use the hero **search** to find project hashtags. From here you review every hashtag in use and adjust its colour so it renders consistently across reports and bubbles.

### 2. Create and order categories (`/admin/categories`)
Open **🌍 Category Manager** ("Manage hashtag categories with colors and display order"). Click **New Category** and set:
- **Category Name** — lowercase letters, numbers, underscores, or hyphens only (e.g. `sport`, `team`, `location`); up to 50 characters. Some reserved names (`default`, `all`, `none`, …) are not allowed.
- **Display Order** — a number controlling where the category sits (lower = earlier).
- **Category Color** — pick with the colour swatch or type a hex value (e.g. `#3b82f6`).

Edit or delete a category from its row/card (delete asks for confirmation). A categorized hashtag inherits its category's colour unless an individual colour overrides it.

### 3. Build a multi-hashtag filter report (`/admin/filter`)
Open **🔍 Hashtag Filter** ("Filter projects by multiple hashtags and generate shareable URLs"):
1. **Select tags.** Search the hashtag list and tick the hashtags you want. The list holds typed and Fanmass hashtags; each shows how many events carry it and, with 📷, how many photos Fanmass tagged with it. The preview says how many events and photos match. Use **Load 20 more** to page through. Your selection is reflected in the page URL.
2. **Apply.** Click **🔍 Apply Filter (N tags)**. Two separate sections appear: **🖱️ Clicker report: entered by hand** (Images, Fans, Gender, Age Groups, Merchandise and performance metrics summed over every event matching **all** selected tags, with the matched count and date range) and **🤖 Fanmass report: measured by the local AI** (photos, analysed share, opt-in, gender, age groups, emotions, brands and clubs read from the pictures, photos per event). A typed hashtag brings all the photos of its events into the Fanmass report; a Fanmass hashtag (a brand, an emotion) only the photos it was found in.
   - **🤖 Fanmass report** and **🖱️ Clicker report** open each one on its own page.
3. **Choose a style.** Pick a report style from the selector (or leave "— Use Default/Global —"); the choice is saved for this tag set (a small "✓ saved" indicator confirms it).
4. **Share.** Click **🔗 Share Filter** to generate a shareable slug. The report is served at `/filter/{slug}` and can be **password-protected**.
5. **Export.** **📄 Export CSV** downloads the aggregated numbers as a spreadsheet.

Below the stats, a **📊 Matching Projects** list links each contributing event to its own report.

### 4. Open a single-hashtag report
For one tag: the clicker report at `/hashtag/{hashtag}` (e.g. `/hashtag/budapest`), the Fanmass report at `/report/hashtag/{hashtag}`. Both are gated by the hashtag's page password when it has one. The SZRT campaign (`#tippmixreport2026`) opens its Fanmass report; its earlier mixed report stays at `?report=classic`.

**What every Fanmass report shows** (hashtag, filter and `/report/global`):
- **Photos with opt-in** in the header: the share of the report's photos (drive photos and Camera photo results) that carry a stored opt-in record, with the two counts under it ("5 of 6 photos"). It reads **Not measured** when no photo of the report has an opt-in record. A marketing opt-in typed for a campaign is never part of it.
- **Brands and clubs from Camera photos next to the SZRT ones:** a Camera photo adds a name only when Fanmass read it from the picture. Open a brand or club card: under the SZRT proof (crops with the box) the **Proof from the Camera photos** block lists the text read in the strongest Camera photos, how sure the reading was and the event. Messmass keeps no crop of a Camera photo, so no picture is shown for them.
- **By month** (Figures and events tab): every month with measured photos, drive photos and Camera photos side by side, by event date.

**The global report** (`/report/global`) opens for an admin session, and for anyone else only with the page password issued from **Global Reports** (`/admin/global/reports`); before a password is issued it answers "not found". It shows no figure of the SZRT campaign alone (registrations, opt-ins, CTA clicks, touchpoints, campaign cycles). Its earlier report (`?report=classic`, and its saved variants) counts only the registrations and marketing opt-ins that events outside the campaign stored, and draws its timeline month by month from every event, Camera events included.

### 5. A worked example
Say you tag events with a `city` category (`budapest`, `vienna`) and a general tag `vip`. To see how VIP activations performed across just Budapest:
1. In **Category Manager**, confirm `city` exists with `budapest` and `vienna` assigned, coloured, and ordered.
2. In **Hashtag Filter**, tick `budapest` and `vip`, then **Apply Filter (2 tags)**. Only events carrying **both** tags are aggregated.
3. Read the combined Images / Fans / Gender / Age / Merchandise stats and the matched-project list.
4. Pick a style, click **🔗 Share Filter** to mint a `/filter/{slug}`, protect it with a password, and hand the link to the stakeholder.
5. If nothing matches, remove `vip` and re-apply — the AND logic may simply have no overlap.

## Managing it
**Categorized vs general hashtags.** A hashtag assigned to a category is *categorized* and takes the category's colour and grouping. A hashtag with no category is *general* (uncategorized) and carries only its own individual colour. Both are searchable and both can be combined in the filter.

**Colour resolution.** The effective colour of a hashtag is its individual colour if set, otherwise its category colour, otherwise a default. Set category colours first for consistency, and only override individual hashtags when you need an exception.

**Filter logic is AND.** Selecting three tags returns projects that carry **all three** (typed or Fanmass), then sums their stats. Add tags to narrow; remove tags to broaden.

**Styles are per-tag-set.** The style you pick on the filter page is remembered against that exact combination of tags, so re-opening the same filter restores your chosen look. Report styles themselves are covered in [Report themes](guides-tutorial-report-themes.md).

**Browsing and paging.** Both the Hashtag Manager and the Filter page load hashtags in pages of 20 with a **Load 20 more** control and a "Showing X of Y" counter, and each has a debounced search box. On the Filter page the selection is mirrored into the URL as `?tags=a,b,c`, so you can bookmark or share a *draft* filter link even before generating a protected slug (the draft link still requires an admin session; only the `/filter/{slug}` share is for outside viewers).

**What the CSV contains.** The filter **Export CSV** writes a header block (the filter tags joined with AND, the projects-matched count, the date range, and a generated timestamp) followed by category/metric/count rows across Images, Fans, Gender, Age, Merchandise, and Success-Manager metrics — the same numbers shown on screen, ready for a spreadsheet.

## Gotchas & good practice
- **Admin-only pages.** All three surfaces require an admin/superadmin session; there is no partner self-serve here.
- **Category names are strict.** Lowercase alphanumerics with `_`/`-`, ≤ 50 chars, and no reserved words — the form rejects anything else.
- **More tags = fewer results.** Because the filter is an AND, over-selecting can return zero projects. Start broad and add tags one at a time.
- **Share links are gated.** A `/filter/{slug}` or `/hashtag/{hashtag}` page enforces a page password — always send the URL and password out-of-band (see [Sharing & access](guides-tutorial-sharing-access.md)).
- **Colour once, at the category.** Setting colours per individual hashtag when a category would do creates drift; prefer category colours and reserve overrides for genuine exceptions.
- **Deleting a category** removes the grouping; the hashtags themselves remain but revert to general/uncategorized behaviour.

## How it connects
- **Where tags come from:** hashtags are attached to [Events](guides-tutorial-events.md) and [Partners](guides-tutorial-partners.md).
- **What filter reports show:** the same stats and charts as single-event [Reports](guides-tutorial-reports.md), aggregated across matches.
- **Styling shared reports:** [Report themes](guides-tutorial-report-themes.md).
- **Password-gating shared pages:** [Sharing reports & access control](guides-tutorial-sharing-access.md).
- **Feature reference:** [Hashtag system](../features/features-hashtag-system.md).

## Screenshots
_Screenshots to be added._

## Related tutorials
- [Partners](guides-tutorial-partners.md)
- [Events](guides-tutorial-events.md)
- [Reports](guides-tutorial-reports.md)
- [Report themes](guides-tutorial-report-themes.md)
- [Sharing reports & access control](guides-tutorial-sharing-access.md)
