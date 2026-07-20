# Getting Started with messmass
Status: Active
Last Updated: 2026-07-20T00:00:00.000Z
Canonical: Yes
Owner: Documentation

> Audience: New operators & implementation partners · Prerequisites: A messmass account (or an admin who can create one) · Related: [Tutorials index](guides-tutorials-index.md) · [Organisations](guides-tutorial-organisations.md) · [Partners](guides-tutorial-partners.md)

## What it is & why it matters

messmass is an event-intelligence and partner-reporting platform for sports organizations, venues, and brands. It captures what happens around a live event — fan photos, engagement, reach, sponsor exposure — and turns that raw capture into styled, shareable reports for partners and sponsors.

The whole product hangs off one mental model. Learn it once and every screen makes sense:

**Organisation → Partner → Event → Report**

- **Organisation** — the top-level tenant that groups partners (for example a league or a holding brand). Superadmin-only. See [Organisations](guides-tutorial-organisations.md).
- **Partner** — a club, federation, venue, or sponsor that owns events and carries reusable defaults (emoji, hashtags, logo, report template, clicker set). See [Partners](guides-tutorial-partners.md).
- **Event** — a single match, activation, or session where data is actually captured. See [Events](guides-tutorial-events.md).
- **Report** — the styled, shareable output rolled up from event data, published per event, per partner, or per organisation.

Data flows left to right: you set up an organisation and its partners, run events under those partners, capture data during each event, and the report surfaces update from that data.

### How data gets captured

messmass supports three capture paths that all land in the same event record:

- **Clicker / Manual editor** — the live event editor at `/edit/[event-slug]`. **Clicker Mode** gives fast button-based tallying during a live event; **Manual Mode** gives exact field-by-field entry for correction and completion. Connected collaborators see updates in realtime. See [Collecting data](guides-tutorial-collecting-data.md).
- **Google Sheets** — a partner can connect a Google Sheet so event rows sync in both directions (Sheet to messmass and messmass to Sheet). See [Google Sheets](guides-tutorial-google-sheets.md).
- **Fanmass** — the external capture app writes data into messmass through the write API (a user needs API write access enabled). See [Fanmass](guides-tutorial-fanmass.md).

Once data is in the event, the report routes render it: `/report/[event-slug]`, `/partner-report/[partner-slug]`, and `/organization-report/[id]`.

## Before you start

- **You need an account.** If you do not have one, an admin creates it, or you self-register (see below) and ask a superadmin to raise your role.
- **Know your role.** Access is role-gated, so what you can see depends on the role you were granted (details below).
- **Have your login URL.** The admin workspace lives under `/admin`; sign in at `/admin/login`.

### User roles

messmass uses five roles in a strict hierarchy (`guest < user | api < admin < superadmin`):

| Role | What it is for | Representative access |
|------|----------------|-----------------------|
| **guest** | New sign-ups awaiting elevation | Help page only |
| **user** | Day-to-day entity work | Events, Partners, Filters |
| **api** | Programmatic access via API key | API-key requests (same level as user) |
| **admin** | Content and reporting management | Everything a user has, plus Reporting Workspace, Analytics Workspace, KYC Variables, Clicker Sets, Bitly Links, Quick Add, Messages |
| **superadmin** | Full system control | Everything, plus Organizations, Users, Hashtags, Categories, Cache, Insights |

> Note: In single-sign-on (SSO) deployments the `admin` role is treated as the highest privilege (equivalent to `superadmin`) for menu visibility. On a password-only deployment, `admin` and `superadmin` are distinct as shown above.

Guests are intentionally boxed into the Help surface so they can learn the product map before higher-permission work is enabled. To move up, a guest contacts a superadmin with their email and requests `user`, `admin`, or `superadmin`.

## Step by step

### 1. Log in at `/admin/login`

1. Open `/admin/login`.
2. Enter your **Email** (the placeholder shows the accepted forms, e.g. `admin` or `admin@messmass.com`) and **Password**.
3. Click **Sign in to Admin**.
4. If your deployment has SSO enabled, you will also see **Sign in with DoneIsBetter** — use that instead when your organisation requires it. See [Authentication & SSO](guides-tutorial-authentication-sso.md).

Don't have an account yet? Click **Create Account** on the login card (this takes you to `/admin/register`). New self-registrations start as **guest** until a superadmin raises the role.

### 2. Land in the admin workspace (`/admin`)

`/admin` is the single command center. Everything is grouped by job, not by legacy route name:

- **Operations** — Events, Partner Activation, Quick Add, Messages
- **Entities** — Partners, Organizations, Project Partners
- **Reports** — Reporting Workspace, Report Builder, Report Themes, Content Library, Chart Algorithms
- **Data** — KYC Variables, Clicker Sets, Bitly Links, Filters, Hashtags, Categories
- **Analytics** — Analytics Home, Sponsorship Hub, Executive / Marketing / Operations dashboards, Insights
- **System** — Users, Main Page, Cache, Help

You only see the groups and tiles your role allows.

### 3. Open in-product help (`/admin/help`)

`/admin/help` is available to every role, including guests. It carries the live workspace map, core workflows, sharing/export notes, and troubleshooting. Use it as the always-current companion to these tutorials.

### 4. Follow the entity flow

Set up entities in the order the mental model implies:

1. (Superadmin) Create the **Organisation** — [Organisations](guides-tutorial-organisations.md).
2. Create the **Partner(s)** under it — [Partners](guides-tutorial-partners.md).
3. Create **Events** for a partner — [Events](guides-tutorial-events.md).
4. Capture data in the editor, then **Open Report** — [Collecting data](guides-tutorial-collecting-data.md) and [Reports](guides-tutorial-reports.md).

## Managing it

- **Editing your own profile / password:** ask a superadmin; user and role administration lives under **Users** (`/admin/users`), which is superadmin-only.
- **Requesting more access:** guests and users ask a superadmin to elevate their role. There is no self-service role change.
- **Finding a feature you can't see:** start from `/admin` and use the workspace grouping rather than an old bookmark. If a page is missing, your role may not include it, or a legacy route now redirects into the canonical workspace.
- **Where output lives:** every shareable output is a report route — event (`/report/[event-slug]`), partner (`/partner-report/[partner-slug]`), organisation (`/organization-report/[id]`). Open first, then share a recipient-safe link. See [Sharing & access](guides-tutorial-sharing-access.md).

### Getting data back out

Reports are not just for viewing — they export three ways:

- **CSV** — data extraction for spreadsheet analysis.
- **PNG** — an individual chart image exported from a report surface.
- **Report output** — the full styled, shareable stakeholder view delivered through the report routes above.

The workflow is "open first, share second": open the report or editor to confirm the data, then generate a recipient-safe share link when you are ready to distribute.

## Gotchas & good practice

- **Role gates are real.** If a colleague "can't find" Organizations or Users, it is almost always because they are not a superadmin — not a bug.
- **Guests see only Help.** That is by design; it is the safe landing spot before elevation.
- **Clicker first, Manual second.** During a live event, tally fast in Clicker Mode, then switch to Manual Mode to correct and complete.
- **One capture path, one record.** Clicker/Manual, Google Sheets, and Fanmass all write to the same event — pick the path that fits the moment; they are not separate datasets.
- **Set up defaults on the Partner, not the event.** Report template, clicker set, style, hashtags, and logo defined on a partner flow down to its events, saving repeated setup.

## How it connects

- **Auth** underpins everything you do here — see [Authentication & SSO](guides-tutorial-authentication-sso.md) and the reference [features: Authentication](../features/features-authentication.md).
- **Organisations** own **Partners**, which own **Events**, which produce **Reports** — the four tutorials that anchor this path.
- The in-product **Help** (`/admin/help`) mirrors the current admin information architecture and is the fastest way to confirm a route.
- For a system-level survey of capabilities, see the reference [features: Overview](../features/features-overview.md).

## Screenshots
_Screenshots to be added._

## Related tutorials

- [Tutorials index](guides-tutorials-index.md)
- [Organisations](guides-tutorial-organisations.md)
- [Partners](guides-tutorial-partners.md)
- [Events](guides-tutorial-events.md)
- [Collecting data](guides-tutorial-collecting-data.md)
- [Reports](guides-tutorial-reports.md)
- [Sharing & access](guides-tutorial-sharing-access.md)
- [Authentication & SSO](guides-tutorial-authentication-sso.md)
