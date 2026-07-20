# Tutorial: Camera app integration
Status: Active
Last Updated: 2026-07-20T00:00:00.000Z
Canonical: Yes
Owner: Documentation

> Audience: Operators + technical implementers · Prerequisites: You can create partners and events in messmass · Related: [Events](guides-tutorial-events.md) · [Partners](guides-tutorial-partners.md) · [Organisations](guides-tutorial-organisations.md) · [Fanmass](guides-tutorial-fanmass.md)

## What it is & why it matters

The Camera app is seyu's selfie / photo-capture product — the tool crews use on the
ground to take fan selfies and event photos. messmass and the Camera app both need to
agree on *who* an event belongs to: the same organisation, the same partner, the same
event, identified the same way in both systems.

The integration solves that by making **messmass the master (the source of truth)**.
When you create an organisation, a partner, and an event in messmass, messmass
**provisions** those records outbound *into* the Camera app and remembers the Camera-side
IDs it gets back. You never have to re-key the same event into the Camera app — the two
systems stay in sync because messmass pushes the identity to the Camera app for you.

Three things make this safe to rely on:

- **One direction.** messmass writes to the Camera app; the Camera app does not create
  organisations, partners, or events back in messmass. There is no "who wins?" question.
- **Shared IDs.** After provisioning, each messmass record stores the Camera app's ID
  for the same thing, so future updates target the exact same Camera record instead of
  creating duplicates.
- **Fire-and-forget.** Provisioning happens in the background when you save an event. If
  the Camera app is down, slow, or not configured, **your event still saves normally** —
  provisioning simply retries later via a backfill (see [Managing it](#managing-it)).

> Note: The messmass Clicker, KYC variables, and the content library are **internal
> messmass systems**. They are not part of the Camera link and are not sent to the Camera
> app. Don't conflate "the camera the crew uses" with messmass's own data-collection
> tools. See [Collecting data](guides-tutorial-collecting-data.md).

## Before you start

The integration only runs when an administrator has configured two environment
variables for the messmass deployment. These are **ops / admin setup**, not something you
change in the app UI:

| Environment variable | What it points at |
| --- | --- |
| `CAMERA_BASE_URL` | The base URL of the Camera app's provisioning API. |
| `CAMERA_MESSMASS_INTERNAL_SECRET` | The shared secret that authenticates messmass to the Camera app. |

Behaviour depending on configuration:

- **Both set** → provisioning is active. Creating an event provisions it into the Camera
  app.
- **Either missing** → provisioning is **silently skipped**. Nothing errors; events still
  save. Internally the provisioning call returns a reason of `camera_not_configured` and
  moves on.

> Note: Do not paste the secret value into documents, tickets, or screenshots. Only the
> variable *names* belong in written material; the value lives in the deployment's secret
> store.

You do not need any special role to *trigger* provisioning — it fires automatically for
anyone who can create an event. The **backfill / ops endpoints** described below are a
separate, token-protected surface intended for operators.

## Step by step

### 1. Confirm the partner exists in messmass

Provisioning an event needs a partner. During provisioning messmass looks at the event's
`partner1Id` (its Partner 1 / home partner) — or a legacy single `partnerId` — to decide
which Camera partner the event belongs to. If the event has **no partner**, provisioning
stops early with reason `no_partner` and nothing is sent. So: create your partner first.
See [Partners](guides-tutorial-partners.md).

### 2. Create the event in messmass

Create the event the normal way (see [Events](guides-tutorial-events.md)). When you save,
messmass kicks off provisioning in the background. You do not click anything extra.

Behind the scenes, provisioning cascades so the whole chain exists in the Camera app
before the event does:

1. **Organisation** — if the event's partner belongs to an organisation, messmass ensures
   that organisation exists in the Camera app first (by name), and stores the returned
   Camera ID on the messmass organisation as `organizations.cameraOrganizationId`.
2. **Partner** — messmass ensures the partner exists in the Camera app (sending its name,
   its messmass partner ID, the Camera organisation ID from step 1, and its logo URL if
   set), and stores the returned Camera ID as `partners.cameraPartnerId`.
3. **Event** — messmass creates the mirror event in the Camera app (sending the messmass
   event ID, the Camera partner ID, the event name, and the event date if set), and stores
   the returned Camera IDs on the messmass event as
   `projects.externalRefs.camera` — an object holding `eventId`, `mongoId`, and a
   `provisionedAt` timestamp.

Each step is **idempotent**: if a record already carries its Camera ID, messmass reuses it
instead of creating a second copy. So re-saving an event does not spawn duplicates in the
Camera app.

> Note: The Camera-side event inherits the partner's default design in the Camera app.
> That styling is owned by the Camera app, not by messmass.

### 3. Verify the link (optional)

A successfully provisioned event has a populated `projects.externalRefs.camera` block with
a `provisionedAt` timestamp. An operator with database access can confirm the three stored
IDs are present:

- `organizations.cameraOrganizationId`
- `partners.cameraPartnerId`
- `projects.externalRefs.camera.eventId`

If any are missing, use the backfill endpoints below.

## Managing it

### Fire-and-forget means: check, then backfill

Because provisioning never blocks event creation, an event can be created during a Camera
app outage (or before the env vars were configured) and end up **without** a Camera link.
messmass records the failure in the logs and moves on. Two operator endpoints exist to
repair the gap. Both are `POST` and both require the integration token in the request
(see [Authentication](#authentication-for-the-ops-endpoints)).

**Link existing partners to Camera partners (no creation).**

```
POST /api/integrations/camera/link-partners
```

Scans messmass partners that do not yet have a `cameraPartnerId`, searches the Camera app
for a partner **with the same name**, and — if a match is found — links the two by storing
the Camera partner's ID back on the messmass partner. It does **not** create new Camera
partners; it only connects records that already exist on both sides. Response reports how
many partners were `linked` and how many were `scanned`.

**Provision missing events.**

```
POST /api/integrations/camera/provision-missing?limit=100
```

Finds messmass events that have a partner but no `externalRefs.camera` link yet, and runs
the full provisioning chain for each. `limit` defaults to `100` and is capped at `500` per
call, so large backlogs are cleared in batches. Response reports how many events were
`provisioned` and how many were `scanned`. One event failing does not stop the rest.

### Authentication for the ops endpoints

> Note: The two `/api/integrations/camera/...` backfill endpoints are protected by the
> **Fanmass integration token** (`FANMASS_INTEGRATION_TOKEN`), *not* by
> `CAMERA_MESSMASS_INTERNAL_SECRET`. The Camera secret authenticates messmass *outbound to
> the Camera app*; the integration token authenticates operators *inbound to messmass*.
> Send it as `Authorization: Bearer <token>` or `x-api-key: <token>`. If the token is not
> configured the endpoints return `503`; a wrong token returns `401`. See
> [Fanmass](guides-tutorial-fanmass.md) for how that token is set.

### Day-to-day

For normal operation there is nothing to manage: create partners and events, and the links
appear on their own. Reach for the backfill endpoints only after an outage, after first
enabling the integration, or when auditing reveals events created before the env vars were
in place.

## Gotchas & good practice

- **No partner, no provisioning.** An event with no Partner 1 (and no legacy `partnerId`)
  is skipped with reason `no_partner`. Attach a partner, then re-provision via
  `provision-missing`.
- **Names must match for linking.** `link-partners` matches on **partner name**. If the
  same partner is spelled differently in messmass and the Camera app, it won't auto-link;
  fix the name or link it manually.
- **Silent skip is by design.** If provisioning "did nothing", the first thing to check is
  whether `CAMERA_BASE_URL` and `CAMERA_MESSMASS_INTERNAL_SECRET` are both set. With either
  missing, every provisioning call short-circuits with `camera_not_configured` and no error
  surfaces in the UI.
- **The Camera app is downstream.** Editing an organisation, partner, or event name in
  messmass after provisioning does not automatically rename it in the Camera app — the
  automatic path only ensures records *exist* and stamps IDs. Treat post-provision renames
  as a manual reconciliation if the Camera app needs them.
- **Two tokens, two directions.** Keep them straight: the Camera secret is outbound
  (messmass → Camera app); the integration token guards the inbound ops endpoints.
- **Don't confuse products.** "Camera" here is seyu's selfie-capture app. It is not the
  messmass Clicker, not KYC variables, and not the content library — those never leave
  messmass.

## How it connects

- **[Organisations](guides-tutorial-organisations.md)** — the top of the chain. An
  organisation's Camera ID is stored as `cameraOrganizationId` when one of its partners or
  events is first provisioned.
- **[Partners](guides-tutorial-partners.md)** — a partner is the required link between an
  event and its Camera event; its Camera ID lives in `cameraPartnerId`.
- **[Events](guides-tutorial-events.md)** — creating an event is what triggers
  provisioning; the resulting Camera IDs are stored in `externalRefs.camera`.
- **[Fanmass](guides-tutorial-fanmass.md)** — the companion integration. The Camera app
  captures the photos; Fanmass analyses them. Both surfaces share the same
  `FANMASS_INTEGRATION_TOKEN` for their operator/ingest endpoints.

## Screenshots
_Screenshots to be added._

## Related tutorials

- [Getting started](guides-tutorial-getting-started.md)
- [Organisations](guides-tutorial-organisations.md)
- [Partners](guides-tutorial-partners.md)
- [Events](guides-tutorial-events.md)
- [Fanmass integration](guides-tutorial-fanmass.md)
- [Collecting data](guides-tutorial-collecting-data.md)
