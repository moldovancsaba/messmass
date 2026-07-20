# Tutorial: Events
Status: Active
Last Updated: 2026-07-20T00:00:00.000Z
Canonical: Yes
Owner: Documentation

> Audience: Internal operators & implementation partners · Prerequisites: An admin sign-in for `/admin`; a partner already exists if you want to attribute the event · Related: [Partners](guides-tutorial-partners.md) · [Collecting event data](guides-tutorial-collecting-data.md) · [Sharing & access](guides-tutorial-sharing-access.md)

## What it is & why it matters
In messmass, an **event is a "project"** — it is the single record that everything else hangs off. One event holds:

- `eventName` — the human title (e.g. "Team A x Team B" or "Summer Launch Night").
- `eventDate` — the date the activation happened.
- `partner1` / `partner2` — the organiser (home team) and, for sports matches, the away team.
- `hashtags` — free and categorised tags used later for filtering and roll-ups.
- `stats{}` — the bag of numbers and text that feeds every chart on the report.

Because the event is the master object, creating it correctly is what makes reporting, sharing, and downstream apps line up. When you create an event, messmass also generates its report and edit URLs and quietly provisions a matching event in the Camera app — so the same activation is represented everywhere without extra typing.

## Before you start
- You need to be **signed in as an admin**. Event management lives under `/admin`, which is protected — unauthenticated visitors are redirected to the login page.
- Decide the event type first:
  - **Single event** — one organiser. You must type an Event Name.
  - **Sports match** — two partners. The name is auto-generated as `Partner 1 x Partner 2`, so you leave the name blank.
- If you want partner branding and roll-ups, make sure the **partner(s) exist** before you create the event (see [Partners](guides-tutorial-partners.md)). You can also attach partners after creation.
- Optionally know which **report style** (colour theme) and **report template** (layout) you want. Both are optional and changeable later.

## Step by step

### 1. Open the events workspace
Go to **`/admin/events`**. The page is titled **"📅 Manage Events"** with the subtitle "Manage all events, statistics, and sharing options". You will see the list of existing events with search and sort.

### 2. Start a new event
Open the **Create Event** modal. Creation is a **two-step flow** shown as badges: **Basics → Reporting**.

**Step 1 — Event Basics:**
- **Event Name \*** — required for a single event.
- **Event Date \*** — required.
- **Hashtags** — optional; type to search existing tags or add new ones. You can add plain hashtags and categorised hashtags here.

Click **Continue to Reporting**.

**Step 2 — Reporting Defaults:**
- **Report Visual Style** — the colour theme (a 26-colour system covering charts, hero, and text). Leave as "— Use Default Style —" if unsure. See [Report themes](guides-tutorial-report-themes.md).
- **Report Template** — the report layout. Leave as "— Use Partner or Default Template —" to inherit the partner's template or the system default. See [Reports](guides-tutorial-reports.md).

Click **Create Event**.

> Note: The Create Event modal collects name, date, hashtags, and reporting defaults. Partner attribution (Partner 1 / Partner 2) is set from the **Edit** modal or from the partner assignment screen — see step 5.

The new event starts with a **default `stats{}` bag** — every core counter (images, fans, gender split, generations, merchandise, image approval, visit sources, and event outcome fields) is initialised to `0`, ready for data entry. You do not fill any of these in the create modal; that happens in the editor afterwards.

### 3. Use the "Event created" shortcuts
After a successful create, a green **"Event created: <name>"** card appears with direct actions so you do not have to hunt through the admin:

- **Open Editor** — jumps to `/edit/{editSlug}` to enter data (see [Collecting event data](guides-tutorial-collecting-data.md)).
- **Open Report** — opens `/report/{viewSlug}`, the shareable report.
- **Assign Partners** — opens `/admin/project-partners` to attach partners.
- **Dismiss** — closes the card.

### 4. Understand the two auto-generated slugs
You never type these — messmass generates them at creation:

- **View slug** → the report lives at **`/report/{viewSlug}`** (read-only).
- **Edit slug** → the editor lives at **`/edit/{editSlug}`** (data entry).

Both are **random UUIDs** (version-4). They are cryptographically random, not guessable, and each event gets its own unique pair. That unguessability is what protects the report — anyone with the link can view it, but the link cannot be guessed. (More on this in [Sharing & access](guides-tutorial-sharing-access.md).)

### 5. Attribute partners (and make it a sports match)
Open an existing event with **Edit**. This is also a two-step flow: **Basics → Reporting & Distribution**.

In **Basics** you will find:
- **Event UUID** — read-only, the permanent identifier assigned at creation.
- **Partner 1 (Organizer / Home Team) \*** — required; pick the primary organiser or home team.
- **Event Name** — shown when there is no Partner 2.
- **Partner 2 (Away Team)** — optional. When you set both partners, the Event Name becomes **auto-generated** as `Partner 1 x Partner 2` and the name field turns read-only.
- **Event Date \*.**

In **Reporting & Distribution** you can adjust Hashtags, Report Visual Style, Report Template, and manage the event's Bitly links (see [Bitly](guides-tutorial-bitly.md)).

> Note: When you set Partner 1, the event inherits that partner's clicker set for data entry and can inherit the partner's report template — this is why partner attribution matters for consistent reports.

### 6. Camera app auto-provisioning (automatic)
When an event is created, messmass **automatically provisions a matching event in the Camera app**. messmass is the master; the camera event mirrors the same partner/event and inherits the partner's default design.

This is **fire-and-forget and non-blocking**: if camera provisioning fails or is slow, your event still creates successfully in messmass. You do not need to do anything for this to happen. See [Camera app](guides-tutorial-camera-app.md) for what the operator sees on the camera side.

## Managing it
- **Search** — use the "Search events..." box. Search runs on the server, so it covers all events, not just the ones on screen.
- **Sort** — sort by event name, event date, images, fans, or attendees. Click a column to cycle ascending → descending → off.
- **Load more** — the list pages in batches; use **"Load 20 More Events"** until you see "— All N events loaded —".
- **Export CSV** — export a single event's variables (name, dates, and every stat) to a `.csv` for offline analysis.
- **Quick Add** — the **"Quick Add 🤝 Sports Match"** button opens `/admin/quick-add`, a faster builder for match events and bulk import.
- **Fanmass Sync** — a per-event action opens the Fanmass modal, where you link a Fanmass batch and sync its analytics into the event's variables (see [Fanmass](guides-tutorial-fanmass.md)).
- **Delete** — removing an event deletes the project record. Treat this as permanent; export first if you might need the numbers.

## Gotchas & good practice
- **Name vs. auto-name:** if you attach two partners, stop typing a name — it will be overwritten by `Partner 1 x Partner 2`. For single events, the name is mandatory.
- **Partner first, event second (ideally):** creating the partner before the event lets the event inherit the partner's clicker set and template, and gives cleaner roll-ups. You can still attach partners afterwards.
- **Don't share the edit slug when you mean the report:** `/edit/...` is for data entry, `/report/...` is for viewing. Sending the wrong one either exposes editing or blocks viewing.
- **Reporting defaults are optional:** leaving style and template blank is fine — the event falls back to the partner's or the system default. Set them explicitly only when you need a specific look.
- **Camera provisioning is best-effort:** a missing camera event is not a create failure. If a camera event is expected but absent, re-check on the camera side rather than re-creating the messmass event.
- **The Event UUID is permanent:** it never changes and is safe to quote in support tickets; the view/edit slugs are what you share externally.

### How events roll up into partner and organisation reports
An event is never an island — two fields decide where it aggregates:

- **Partner attribution.** Once an event has a Partner 1 (and optionally Partner 2), it becomes part of that partner's activity. A **partner report** (`/partner-report/{slug}`) presents the partner's events together, so attributing the event correctly is what makes it show up in the partner's story.
- **Organisation membership.** Partners belong to organisations, so an event attributed to a partner also feeds the **organisation report** (`/organization-report/{id}`), which aggregates across the organisation's partners and events.
- **Hashtags.** The event's hashtags let it surface on **hashtag** and **filter** pages, which cut across events regardless of partner.

The practical takeaway: the numbers you enter on one event automatically contribute to higher-level reports — but only along the partner/organisation/hashtag links you set on the event. An unattributed, untagged event will report on its own page and nowhere else.

## How it connects
- **Data entry:** the event's editor at `/edit/{editSlug}` is where operators (or partners with a link) fill `stats{}` — see [Collecting event data](guides-tutorial-collecting-data.md).
- **Reports:** `stats{}` plus the assigned template and style render the report at `/report/{viewSlug}` — see [Reports](guides-tutorial-reports.md).
- **Roll-ups:** an event's partner attribution and hashtags are what let it appear in **partner reports** and **organisation reports**, and in **hashtag/filter** pages — see [Organisations](guides-tutorial-organisations.md), [Partners](guides-tutorial-partners.md), and [Hashtags & filters](guides-tutorial-hashtags-filters.md).
- **Distribution:** Bitly links attached to the event feed visit metrics back into the report — see [Bitly](guides-tutorial-bitly.md).
- **Downstream apps:** creation mirrors the event into the Camera app — see [Camera app](guides-tutorial-camera-app.md).

## Screenshots
_Screenshots to be added._

## Related tutorials
- [Getting started](guides-tutorial-getting-started.md)
- [Partners](guides-tutorial-partners.md)
- [Organisations](guides-tutorial-organisations.md)
- [Collecting event data (Clicker & Manual)](guides-tutorial-collecting-data.md)
- [Reports](guides-tutorial-reports.md)
- [Sharing reports & access control](guides-tutorial-sharing-access.md)
- [Camera app](guides-tutorial-camera-app.md)
- [Fanmass](guides-tutorial-fanmass.md)
