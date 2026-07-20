# Tutorial: Bitly integration
Status: Active
Last Updated: 2026-07-20T00:00:00.000Z
Canonical: Yes
Owner: Documentation

> Audience: Operators and technical implementers · Prerequisites: Admin sign-in, a Bitly account with API access · Related: [Partners](guides-tutorial-partners.md), [Reports](guides-tutorial-reports.md), [Google Sheets sync](guides-tutorial-google-sheets.md)

## What it is & why it matters

The Bitly integration pulls short-link click analytics **into** messmass (it is inbound only — messmass never creates or changes links in your Bitly account). Once a Bitly short link is imported, you attach it to the events and partners it belongs to, and its click totals, geography, referrers and daily trend become evidence you can show in reports.

Why it matters: a fan-zone QR code, a printed poster, or a social campaign usually resolves through a `bit.ly/...` link. By importing that link and associating it with an event, the clicks it earned are attributed to that event automatically. Because association is many-to-many, a single link can feed several events, and one event can draw on several links.

Everything lives on one admin screen: **`/admin/bitly`** ("🔗 Bitly Links"). Under the hood three collections cooperate:

- `bitly_links` — the link plus its cached analytics (`click_summary`, `clicks_timeseries`, `geo.countries`, `referrers`, `referring_domains`, `lastSyncAt`).
- `bitly_project_links` — the junction that ties a link to a project (event), with cached, date-bounded metrics per association (`startDate`, `endDate`, `autoCalculated`, `cachedMetrics`, `lastSyncedAt`).
- `partners.bitlyLinkIds` — the reverse list stored on each partner record.

Because the link-to-event relationship is a junction and not a single `projectId` on the link, one link can serve many events and one event can draw on many links — and each association carries its own cached metrics rather than a naive total-click count.

### The header actions at a glance

| Action | Icon | What it does |
|--------|------|--------------|
| Get Links from Bitly | ⬇️ | Import up to 100 new links from your Bitly group, skipping duplicates |
| Sync Now | 🔄 | Refresh cached analytics for all links from Bitly |
| Refresh Metrics | 📊 | Recalculate the cached, date-bounded metrics for every event-to-link association |
| Add Link | + | Open the modal to add one link by short link or long URL |

### The per-row actions at a glance

| Action | Icon | What it does |
|--------|------|--------------|
| Pull | ⬇️ | Refresh this one link's analytics immediately (emergency use) |
| Export | 📄 | Download this link's cached analytics as a sectioned CSV |
| Archive | 🗑️ | Soft-archive the link (hidden from the list, data preserved) |

## Before you start

1. **Sign in as an admin.** The whole Bitly surface and every `/api/bitly/*` route is admin-only.
2. **Provide Bitly credentials as environment variables** (never paste the values into the app or into docs):
   - `BITLY_ACCESS_TOKEN` — your Bitly API v4 access token.
   - `BITLY_GROUP_GUID` — the Bitly group whose links you want to import. (`BITLY_ORGANIZATION_GUID` is an optional fallback for accounts that require an organization GUID instead.)
3. **Know your Bitly tier.** Growth-tier accounts have request rate limits; the client already spaces and retries calls, but imports are deliberately batched (100 links at a time) to stay within limits.
4. **Have your events and partners created first** so there is something to associate links with. See [Events](guides-tutorial-events.md) and [Partners](guides-tutorial-partners.md).

> Note: If `BITLY_ACCESS_TOKEN` is missing, the API fails fast with a clear "not configured" error rather than silently returning empty data.

### How the client protects itself

You do not need to manage rate limiting yourself, but it helps to know what happens under load. The Bitly client talks to Bitly API v4 with a request timeout, exponential backoff on transient failures (HTTP 429 and 5xx), and it honours a `Retry-After` header when Bitly sends one. It also surfaces the remaining rate-limit budget from response headers for observability. In practice this means a large import or sync degrades gracefully — it slows down rather than failing outright — but it is still worth spreading big imports across several clicks of **Get Links from Bitly** rather than expecting one click to pull thousands of links.

## Step by step

The typical order of operations is: import links, associate them with events and partners, let analytics refresh (on schedule or on demand), then read the results in reports. The subsections below follow that order.

### 1. Import your links ("Get Links from Bitly")

On `/admin/bitly`, click **Get Links from Bitly** (⬇️) in the header. This calls the import routine, which fetches up to 100 links from your configured Bitly group and imports only the ones not already stored — duplicates are skipped automatically. If you have more than 100 links, click the button again to pull the next batch.

Freshly imported links may be **unassigned** at first. That is expected: import brings the link in; association is a separate, deliberate step.

### 2. Add a single link by hand ("Add Link")

Click **Add Link** (+) to open the modal. You can enter either a Bitly short link (`bit.ly/abc123`) or the original long URL. Optionally assign it to a project and give it a custom title (otherwise Bitly's own title is used). The form stays open after saving so you can attach the same link to more than one event in a row.

### 3. Associate a link with events and partners

Each row in the table has two association columns:

- **Associated Projects** — use the "+ Add to event…" selector to attach the link to any event. Existing associations show as chips; click the ✕ on a chip to remove one. Because links are many-to-many, adding to a second event does not detach the first.
- **Associated Partners** — use the "+ Add to partner…" selector. This writes to the partner's `bitlyLinkIds` list and is kept in sync in both directions, so the partner's own screens see the link too.

### 4. Refresh analytics

There are three refresh actions, from broad to narrow:

- **Sync Now** (🔄) — refreshes cached analytics for all links from Bitly.
- **Refresh Metrics** (📊) — recalculates the cached, date-bounded metrics for every event-to-link association (run this after a sync, or after event dates change).
- **Per-link Pull** (⬇️ Pull on a row) — refreshes one link immediately. Treat this as an emergency override; routine refresh is handled by the daily schedule.

### 5. Export one link's analytics ("CSV Export")

The **📄 Export** button on a row downloads that link's cached analytics as a CSV built from the data already stored in messmass (it does not call Bitly). The file is sectioned into **Summary**, **Daily Clicks**, **Countries** and **Referrers**, so it can be dropped straight into a stakeholder report. The filename is derived from the bitlink (for example `bitly-bit.ly-abc123.csv`).

> Note: Because Export reads cached data, it reflects whatever was captured at the last sync. If you need the very latest numbers in the CSV, run the row's **Pull** first, then Export.

### 6. Archive links you no longer track

The **🗑️ Archive** button on a row soft-archives the link: it disappears from the active list but its data is preserved. Archiving does not delete history, so metrics that already flowed into reports stay intact.

### Worked example: a campaign link shared across two events

Suppose one QR code (`bit.ly/club-fanzone`) is printed for a home match in March and reused for another in April:

1. Click **Get Links from Bitly** to import `bit.ly/club-fanzone`.
2. In its row, use "+ Add to event…" to attach it to the March event, then again to attach it to the April event.
3. messmass splits the link's click history by date: the March event receives the earlier clicks, and the April event receives the ongoing clicks. The first event in the chain inherits all history before it; the last inherits everything after.
4. Click **Refresh Metrics** so each association's cached total reflects the split.
5. Each event's report now shows only the clicks attributable to that event's window — not the whole link's lifetime total.

## Managing it

### Reading the table

Each row shows, left to right: a favorite star, the Bitly short link (a clickable external link), the title, the **Associated Projects** chips, the **Associated Partners** chips, the total **Clicks**, the **Last Synced** time, and the action buttons. The chips make it obvious at a glance which events and partners a link is feeding; an empty chip area means the link is imported but not yet attributed to anything.

- **Search, filter, sort.** The header search box filters by bitlink, long URL or title. The "⭐ Show favorites only" checkbox narrows the list to links you have starred. Column headers (Bitly Link, Title, Clicks, Last Synced) sort on click and the sort is reflected in the URL so a sorted view can be shared.
- **Favorites.** Click the star (☆/⭐) in the first column to mark links you refer to often.
### When to use each refresh action

| You want to… | Use | Why |
|--------------|-----|-----|
| Keep everything current with no effort | Nothing — the daily 3 AM UTC job | The recommended default; covers all links |
| See a link's newest clicks right now | The row's **Pull** | Refreshes just that link on demand |
| Refresh every link before a big report | **Sync Now** | Pulls fresh analytics for the whole set |
| Fix per-event attribution after date changes | **Refresh Metrics** | Recomputes the date-bounded association caches |

- **Scheduled refresh.** Analytics refresh automatically once a day (3:00 AM UTC). This runs against the sync route using a scheduled trigger authorized by the `CRON_SECRET` environment variable (sent as an `Authorization: Bearer` header). You do not run this by hand; the manual buttons exist for when you need data sooner.
- **How totals surface downstream.** Once a link is associated with an event, its cached, date-bounded click totals roll into that event's analytics. Those Bitly totals also appear in the Google Sheets sync as **Total Bitly Clicks** and **Unique Bitly Clicks** columns, so spreadsheet-oriented partners see the same numbers (see [Google Sheets sync](guides-tutorial-google-sheets.md)).

### What a synced link gives you

Each synced link caches several analytics dimensions, all of which can feed reports and the per-link CSV export:

- **Click summary** — total and unique clicks.
- **Daily time series** — clicks per day for trend charts.
- **Countries** — geographic distribution of clicks.
- **Referrers and referring domains** — where the traffic came from (for example a social platform versus a QR scan), at both platform and domain granularity.

Read APIs expose this data to reports: one endpoint returns a single link's analytics (with an optional live refresh), and another returns the aggregated, cached Bitly metrics for a whole event based on its current associations.

## Gotchas & good practice

- **Import first, associate second.** A link with no association contributes to no event. If a link's clicks are "missing" from a report, check that it is attached to the right event.
- **Attribution is per-association, not a raw link total.** When a link is shared across events, messmass splits its history by date boundaries: the first event gets the early history, the last event gets the ongoing data, and events in between get bounded ranges. If the split looks wrong, run **Refresh Metrics**.
- **After changing event dates, refresh metrics.** Date ranges for shared links are recalculated automatically when an event's date changes or an event is deleted, but running **Refresh Metrics** guarantees the caches are aligned before you publish a report.
- **Rate limits.** If import returns a 403, check that `BITLY_ACCESS_TOKEN` has the right permissions. A 429 means you hit the rate limit — wait a moment and retry; imports are already batched to reduce this.
- **Archiving is reversible in spirit, deletion is not.** Prefer Archive over permanent deletion so historical evidence survives.
- **Never store secrets in the app or in a sheet.** The access token, group GUID and cron secret live only as environment variables.

### Quick troubleshooting

| Symptom | Likely cause | What to do |
|---------|--------------|------------|
| Links do not appear after import | Wrong or missing `BITLY_GROUP_GUID`, or they already exist | Confirm the group GUID; re-run import — existing links are skipped, not re-shown |
| Import returns 403 / Forbidden | Access token lacks permission | Check `BITLY_ACCESS_TOKEN` scope in your Bitly account |
| Import returns 429 / rate limited | Too many requests in a short window | Wait, then click Get Links again; batches of 100 keep you under the limit |
| A report's click total looks wrong | Association caches are stale | Run **Refresh Metrics**, then re-check the event |
| A link's own numbers look stale | Not synced recently | Use the row's **Pull**, or run **Sync Now** |
| Partner association looked successful but the page still showed an error | A prior UI regression | Ensure you are on a current build; stale error state is cleared on success |

## How it connects

- **Partners** inherit Bitly links. A link attached to a partner can be carried into events created from that partner, so the [Partners](guides-tutorial-partners.md) workflow and the Bitly workflow reinforce each other.
- **Reports** consume the cached per-event Bitly metrics — click totals, unique clicks, top countries and referrers — as part of an event's story. See [Reports](guides-tutorial-reports.md).
- **Google Sheets** exposes Bitly totals to partners who manage events in a spreadsheet. See [Google Sheets sync](guides-tutorial-google-sheets.md).
- The scheduled refresh shares the same `CRON_SECRET` pattern used by other daily jobs; see [Authentication, roles & SSO](guides-tutorial-authentication-sso.md) for how scheduled and API access are secured.

### Where Bitly fits in a typical event

1. A partner is created and given its Bitly link(s) — see [Partners](guides-tutorial-partners.md).
2. An event is created (often from that partner), inheriting the link.
3. During and after the event, clicks accrue on the link and are pulled into messmass by the daily sync.
4. Association metrics are recalculated so each event gets its fair share of the clicks.
5. The event's report and, if connected, its Google Sheet show the resulting Bitly totals.

For the full data-model and API reference behind this screen, see the feature guide at [../features/features-bitly-integration-guide.md](../features/features-bitly-integration-guide.md).

## Screenshots
_Screenshots to be added._

## Related tutorials

- [Partners](guides-tutorial-partners.md)
- [Reports](guides-tutorial-reports.md)
- [Google Sheets sync](guides-tutorial-google-sheets.md)
- [Sport databases](guides-tutorial-sport-databases.md)
- [Authentication, roles & SSO](guides-tutorial-authentication-sso.md)
