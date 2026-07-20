# messmass Tutorials — Learning Path
Status: Active
Last Updated: 2026-07-20T00:00:00.000Z
Canonical: Yes
Owner: Documentation

> Audience: operators, implementation partners, and technical admins · Prerequisites: an admin login (see [Authentication, roles & SSO](guides-tutorial-authentication-sso.md)) · Related: [Getting Started](guides-tutorial-getting-started.md)

## What this is

A task-oriented set of tutorials for **using** messmass — creating and managing the core objects, and connecting the platform to the other apps it works with. Each tutorial explains *what a thing is*, *why it exists*, and *how to create and manage it*, with the exact admin routes and button labels.

If you read nothing else, read **[Getting Started](guides-tutorial-getting-started.md)** first — it sets up the mental model everything below builds on.

## The mental model

```
Organisation  →  Partner  →  Event (project)  →  Report
     │              │              │                 │
  groups        team / club     one match /      what the audience
  partners      / sponsor       activity         actually sees
```

Data is captured against an **event** (via the Clicker/Manual editor, Google Sheets, or Fanmass), then presented through a **report** (a template of blocks and charts, themed by a style, optionally sliced into time-based variants), and shared with a link.

## Learning path

### Phase 1 — Core objects (start here)
1. [Getting Started with messmass](guides-tutorial-getting-started.md) — the big picture, roles, and logging in.
2. [Organisations](guides-tutorial-organisations.md) — the top-level grouping of partners.
3. [Partners](guides-tutorial-partners.md) — teams, clubs, and sponsors that own events.
4. [Events](guides-tutorial-events.md) — the individual matches/activities you report on.
5. [Collecting event data](guides-tutorial-collecting-data.md) — the Clicker & Manual editor.
6. [Building reports](guides-tutorial-reports.md) — templates, data blocks, and charts.
7. [Report themes & styles](guides-tutorial-report-themes.md) — colours, fonts, and how a theme is chosen.
8. [Report variants](guides-tutorial-report-variants.md) — time-scoped, publishable report versions.
9. [Sharing reports & access control](guides-tutorial-sharing-access.md) — links, page passwords, and who can see what.

### Phase 2 — Building blocks (power users)
10. [Variables (KYC)](guides-tutorial-variables-kyc.md) — the single source of truth for every stat.
11. [Clicker sets & variable groups](guides-tutorial-clicker-sets.md) — how the data-entry counters are laid out.
12. [Charts & formulas](guides-tutorial-charts-formulas.md) — chart types and the `[variable]` formula language.
13. [Content Library (images & text)](guides-tutorial-content-library.md) — reusable media/text assets for reports.
14. [Hashtags, categories & filters](guides-tutorial-hashtags-filters.md) — tagging and cross-event filter reports.

### Phase 3 — Integrations & connections
15. [Camera app integration](guides-tutorial-camera-app.md) — provisioning orgs/partners/events into the selfie-capture app.
16. [Fanmass integration](guides-tutorial-fanmass.md) — image-intelligence analytics and the mapping API.
17. [Bitly integration](guides-tutorial-bitly.md) — short-link click analytics attributed to events/partners.
18. [Sport databases](guides-tutorial-sport-databases.md) — Football-Data.org, API-Football, and TheSportsDB enrichment.
19. [Google Sheets sync](guides-tutorial-google-sheets.md) — managing a partner's events from a spreadsheet.
20. [Authentication, roles & SSO](guides-tutorial-authentication-sso.md) — sign-in, roles, SSO, and API keys.

## Quick start by role

- **New operator** → Getting Started → Organisations → Partners → Events → Collecting data → Building reports → Sharing.
- **Report designer** → Variables → Charts → Content Library → Building reports → Themes → Variants.
- **Integrations / setup** → Authentication & SSO → Camera → Fanmass → Bitly → Sport databases → Google Sheets.

## Notes on scope

- These tutorials describe the **current** admin experience. A few legacy internals are called out where they might confuse (for example the legacy `reports` collection versus the current report templates, and the legacy page-style system versus the current report styles).
- Screenshots are being added in a follow-up pass; each tutorial has a **Screenshots** section reserved for them.

## Related

- [Admin end-user guide](../admin/admin-end-user-guide.md) — the canonical operator reference these tutorials expand on.
- [Documentation index](../index.md) — the full documentation map.
