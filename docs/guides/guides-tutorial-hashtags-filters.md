# Tutorial: Hashtags, categories & filters
Status: Active
Last Updated: 2026-07-20T00:00:00.000Z
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

Two report destinations flow out of this:
- **Single-hashtag report** at `/hashtag/{hashtag}` — everything carrying one tag.
- **Multi-hashtag filter report** at `/filter/{slug}` — everything carrying *all* of several tags, with a shareable, password-protectable slug.

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
1. **Select tags.** Search the hashtag list and tick the hashtags you want. Use **Load 20 more** to page through. Your selection is reflected in the page URL.
2. **Apply.** Click **🔍 Apply Filter (N tags)**. The page aggregates every project matching **all** selected tags and shows combined stats — Images, Fans, Gender, Age Groups, Merchandise, and performance metrics — plus the matched project count and date range.
3. **Choose a style.** Pick a report style from the selector (or leave "— Use Default/Global —"); the choice is saved for this tag set (a small "✓ saved" indicator confirms it).
4. **Share.** Click **🔗 Share Filter** to generate a shareable slug. The report is served at `/filter/{slug}` and can be **password-protected**.
5. **Export.** **📄 Export CSV** downloads the aggregated numbers as a spreadsheet.

Below the stats, a **📊 Matching Projects** list links each contributing event to its own report.

### 4. Open a single-hashtag report (`/hashtag/{hashtag}`)
For a report on just one tag, use the public route `/hashtag/{hashtag}` (e.g. `/hashtag/budapest`). Like filter reports, this page is password-gated.

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

**Filter logic is AND.** Selecting three tags returns projects that carry **all three**, then sums their stats. Add tags to narrow; remove tags to broaden.

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
