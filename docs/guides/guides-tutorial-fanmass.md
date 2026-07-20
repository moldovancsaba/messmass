# Tutorial: Fanmass integration
Status: Active
Last Updated: 2026-07-20T00:00:00.000Z
Canonical: Yes
Owner: Documentation

> Audience: Operators + technical implementers · Prerequisites: You can create events and open the Events admin · Related: [Events](guides-tutorial-events.md) · [Reports](guides-tutorial-reports.md) · [Collecting data](guides-tutorial-collecting-data.md) · [Camera app](guides-tutorial-camera-app.md)

## What it is & why it matters

Fanmass is seyu's image-intelligence service. It analyses the photos from an event and
returns normalized analytics — how many **people** it counted, projected **reach**, which
**brands** and **clubs** appeared, **merchandise**, and demographic projections. messmass
does not analyse images itself; it hands Fanmass the context for an event and then ingests
the numbers Fanmass sends back so they appear in your reports alongside your own metrics.

The integration has **two layers**, both sitting behind **one shared machine-auth token**:

- **(A) Analytics** — messmass exposes an event's context to Fanmass, Fanmass runs its
  analysis, and the results flow back into the event's stats under a dedicated `fanmass`
  namespace. **Your Clicker and manual numbers are never overwritten.**
- **(B) Mapping API** — Fanmass can also act *as if it were an operator*: create partners
  and events, define variables, and push stat values into messmass through the same kinds
  of writes the admin UI uses. This lets Fanmass seed data it discovered, not just report
  on data you entered.

The key principle: **messmass stays the source of truth** for organisations, partners,
events, report templates, and report consumption. Fanmass stays the source of truth for
image intake and analysis. They talk over versioned APIs, never by reaching into each
other's database.

## Before you start

Fanmass integration needs environment variables configured by an administrator (ops
setup). There are **two directions**, and they use **different credentials**:

| Direction | Environment variable | Purpose |
| --- | --- | --- |
| Fanmass → messmass (inbound) | `FANMASS_INTEGRATION_TOKEN` | The shared token that authenticates Fanmass's calls into messmass. (`MESSMASS_FANMASS_TOKEN` is accepted as a fallback name.) |
| messmass → Fanmass (outbound) | `FANMASS_BASE_URL` | Base URL of the Fanmass service messmass calls to pull analytics. |
| messmass → Fanmass (outbound) | `FANMASS_API_KEY` | Sent as `x-api-key` on messmass's outbound calls to Fanmass. |

Behaviour depending on configuration:

- If `FANMASS_INTEGRATION_TOKEN` is **not set**, every inbound integration endpoint returns
  `503 FANMASS_INTEGRATION_NOT_CONFIGURED`.
- If a caller presents the **wrong** token, endpoints return `401 INVALID_INTEGRATION_TOKEN`.
- If `FANMASS_BASE_URL` is **not set**, a sync (messmass pulling from Fanmass) fails with
  `503 FANMASS_NOT_CONFIGURED`.

> Note: Never paste token or key values into documents or tickets — only the variable
> names belong in written material.

**How Fanmass authenticates every inbound call:** it sends the shared token either as
`Authorization: Bearer <token>` **or** as `x-api-key: <token>`. Both are accepted and are
equivalent.

All inbound responses share a common envelope: success is
`{ "success": true, "data": ... }` and failure is
`{ "success": false, "error": { "code", "message", ... } }`.

## Step by step

### Layer A — Analytics

The analytics loop links one messmass event to one Fanmass **batch** (a batch is Fanmass's
unit of "the images for this event") and then syncs the results.

**1. Fanmass reads the event context.**

```
GET /api/integrations/fanmass/events/{eventId}/context
```

Returns everything Fanmass needs to analyse correctly: the event name and date, the
organisation, the partner IDs and names, the event's hashtags and categorized hashtags, and
the report template / style IDs. The payload is versioned with the contract
`messmass.fanmass.event-context.v1`.

**2. Link the event to a Fanmass batch.**

```
POST /api/integrations/fanmass/events/{eventId}/link
```

Records the `fanmassBatchId` for the event in the `fanmass_event_links` registry, with a
status. Link status moves through a defined set as work progresses: `linked`, `importing`,
`analyzing`, `ready`, `partial`, `failed`, `stale`, `unauthorized`, `unavailable`. You can
read the current link back with `GET` on the same path.

**3. Analytics come back — via callback or sync.**

- **Callback (Fanmass pushes):**

  ```
  POST /api/integrations/fanmass/callbacks
  ```

  Fanmass posts `{ messmassEventId, batchId, status }`. When the status is `ready` or
  `partial`, messmass immediately pulls the full analytics summary and writes it in.

- **Sync (messmass pulls):**

  ```
  POST /api/integrations/fanmass/events/{eventId}/sync
  ```

  messmass calls Fanmass for the batch's analytics summary, validates it against the
  contract `fanmass.messmass.analytics-summary.v1`, and writes the results. Add
  `?dryRun=true` to compute and preview the mapping **without** writing, or `?force=true`
  to sync regardless of cached state. `GET` on the same path returns the link plus the last
  sync snapshot.

**Where the numbers land.** A successful sync writes:

- `projects.stats.fanmass` — the canonical Fanmass block: `peopleCount`, `projectedReach`,
  `imageCount`, `analyzedImageCount`, `confidence`, `brands`, `clubs`, `merchandise`,
  `gender`, `age`, `warnings`, and sync metadata.
- **Flat mirrors** under `projects.stats.*` for report-friendly, single-value access:
  `fanmassPeopleCount`, `fanmassProjectedReach`, `fanmassImageCount`,
  `fanmassAnalyzedImageCount`, `fanmassConfidence`, `fanmassBrandCount`,
  `fanmassTopBrandName`, `fanmassTopBrandCount`, `fanmassClubCount`, `fanmassTopClubName`,
  `fanmassTopClubCount`, `fanmassWarningCount`, `fanmassSourceRunCount`,
  `fanmassStatus`, `fanmassBatchId`, and `fanmassLastSyncedAt`.

Crucially, the write only touches the `fanmass` namespace and these `fanmass*` keys — it
does **not** overwrite your Clicker or manual stats.

**4. Operators: use the "Fanmass Sync" button.**

You don't need a terminal for day-to-day work. The **Events admin** action rail has a
**Fanmass Sync** control on each event. It opens a panel where you can enter the Fanmass
batch ID and run three actions — **link**, **dry-run**, and **sync** — backed by an
admin-only route (`GET|POST /api/admin/fanmass/events/{eventId}`) that requires an
authenticated admin (or superadmin) session. The panel reports the resulting status back to
you (for example, "Fanmass analytics synced. Status: ready.").

### Layer B — Mapping API

These endpoints let Fanmass create and populate messmass records the same way the admin UI
does. Records created this way are tagged with `source: "fanmass"` but are otherwise
identical to hand-created ones (same slug generation, same derived-metric handling).

**Partners.**

```
GET  /api/integrations/fanmass/partners?search=&limit=&offset=
POST /api/integrations/fanmass/partners        { name, emoji?, logoUrl?, hashtags? }
GET  /api/integrations/fanmass/partners/{partnerId}/events
```

List or create partners, and list a partner's events. A created partner gets an emoji
(defaulting to a camera emoji if none is supplied, since messmass requires one) and a
generated view slug.

**Events.**

```
POST /api/integrations/fanmass/events   { eventName, eventDate?, partner1Id?, stats? }
```

Creates a messmass event (a "project") optionally attached to a partner. Any `stats`
provided are prepared the same way the app prepares them, and the event gets view/edit
slugs automatically.

**Variables.**

```
GET  /api/integrations/fanmass/variables
POST /api/integrations/fanmass/variables   { name, label?, type?, category?, unit?, description? }
```

List or upsert variable definitions. In messmass a **variable's `name` is the stats key**,
so names must be camelCase (start with a letter, letters and digits only); a leading
`stats.` prefix is stripped. Creating a new variable returns `201`; updating an existing one
returns `200` and only touches the fields you supplied.

**Push stat values.**

```
POST /api/integrations/fanmass/events/{eventId}/stats   { stats: { <variableName>: value, ... } }
```

Partial-merges values into the event's stats. It accepts either `{ stats: { ... } }` or a
bare `{ ... }` map. **Derived (formula) variables are skipped** — you cannot push a value
onto a variable whose value is computed from a formula; those are recalculated for you after
the merge. The response lists which keys were `applied`.

## Managing it

- **Operators** live in the Events admin **Fanmass Sync** panel: link a batch, dry-run to
  preview, then sync. Statuses like `ready` and `partial` tell you whether Fanmass finished
  or is still working.
- **Implementers** integrating Fanmass hit the token-authed endpoints above. Use the
  `context` endpoint to read, `link` to associate a batch, `callbacks`/`sync` for analytics
  (Layer A), and the `partners`/`events`/`variables`/`stats` endpoints to write (Layer B).
- **Retries and errors** are tracked per event. The `fanmass_event_links` registry keeps
  retry counts, the last error code/message, sync snapshots, and an audit trail — so a
  failed sync doesn't just disappear. A `GET` on the `sync` or `link` endpoint surfaces the
  current state.
- **Dry-run first.** Before a real sync into a live event, run `?dryRun=true` (or the
  dry-run button) to see the mapped values without writing them.

## Gotchas & good practice

- **Your metrics are safe.** Analytics sync writes only the `fanmass` namespace and
  `fanmass*` flat mirrors. Clicker and manual numbers are never overwritten. See
  [Collecting data](guides-tutorial-collecting-data.md).
- **Contract versions are enforced.** A sync rejects an analytics summary whose
  `contractVersion` is not `fanmass.messmass.analytics-summary.v1` (`409`). Keep both sides
  on matching contract versions.
- **Two credentials, two directions.** `FANMASS_INTEGRATION_TOKEN` guards Fanmass's calls
  *into* messmass; `FANMASS_API_KEY` + `FANMASS_BASE_URL` are what messmass uses to call
  *out to* Fanmass. A "not configured" error tells you which side is missing.
- **Camel-case variable names only.** The mapping API rejects names that aren't camelCase
  (`400 INVALID_VARIABLE_NAME`). Remember the name *is* the stats key.
- **You can't push derived variables.** Formula-computed variables are ignored on a stats
  push and recomputed automatically — don't expect a pushed value to "stick" on one.
- **A partner is optional on a mapped event, but useful.** A Fanmass-created event without a
  partner still exists, but partner-scoped views and Camera-app provisioning both key off
  the partner. See [Partners](guides-tutorial-partners.md) and
  [Camera app](guides-tutorial-camera-app.md).
- **Timeouts.** Outbound calls to Fanmass are time-bounded, so a slow Fanmass surfaces as a
  failed sync you can retry, not a hung request.

## How it connects

- **[Events](guides-tutorial-events.md)** — every Fanmass link, sync, and stat push targets
  one event; the "Fanmass Sync" control lives on the Events admin.
- **[Reports](guides-tutorial-reports.md)** and
  **[Report variants](guides-tutorial-report-variants.md)** — Fanmass metrics become report
  variables. Report formulas can reference the nested tokens like `[fanmass.peopleCount]`
  and `[fanmass.brands]`, or the flat mirrors such as `[fanmassPeopleCount]`.
- **[Collecting data](guides-tutorial-collecting-data.md)** — Fanmass analytics sit
  *beside* your Clicker/manual data in the same event stats, not on top of it.
- **[Camera app](guides-tutorial-camera-app.md)** — the sibling integration. The Camera app
  captures the photos; Fanmass analyses them. Both share `FANMASS_INTEGRATION_TOKEN` for
  their operator/ingest endpoints.

## Screenshots
_Screenshots to be added._

## Related tutorials

- [Getting started](guides-tutorial-getting-started.md)
- [Events](guides-tutorial-events.md)
- [Partners](guides-tutorial-partners.md)
- [Reports](guides-tutorial-reports.md)
- [Report variants](guides-tutorial-report-variants.md)
- [Collecting data](guides-tutorial-collecting-data.md)
- [Camera app integration](guides-tutorial-camera-app.md)
