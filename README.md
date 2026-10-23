# {messmass}
Status: Active
Last Updated: 2026-10-20T16:53:00.000Z
Canonical: No
Owner: Product

<p align="center">
  <img src="public/messmass-logo-black.png" alt="{messmass} logo" width="160" />
</p>

<h1 align="center">{messmass}</h1>
<p align="center"><strong>Enterprise event analytics, partner reporting, reporting operations, and admin workflow tooling for sports organizations, venues, and brands.</strong></p>

<p align="center">
  <img src="https://img.shields.io/badge/version-v12.3.43-2563EB?style=for-the-badge" alt="Version">
  <img src="https://img.shields.io/badge/platform-Web%20App-0F172A?style=for-the-badge" alt="Platform">
  <img src="https://img.shields.io/badge/stack-Next.js%20%7C%20MongoDB%20%7C%20Mantine-0EA5E9?style=for-the-badge" alt="Stack">
</p>

<p align="center">
  <a href="#product-overview">Product Overview</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#admin-workspace-model">Admin Workspace Model</a> •
  <a href="#operations-and-validation">Operations & Validation</a> •
  <a href="#documentation-map">Documentation Map</a>
</p>

## Product Overview

`{messmass}` is a production event intelligence platform for live-event delivery, partner proof-of-performance, and report operations. It combines event data capture, partner and organization administration, Bitly attribution, report authoring, and analytics review in one product.

Core capabilities:
- Event tracking through event editor and clicker/manual workflows
- Partner, organization, and event administration in a unified admin system
- Reporting Workspace for themes, builder composition, content, chart logic, and data dependencies
- Report variant management with validated preset/custom time-period contracts
- Mantine-governed shared admin shell, entity forms, report variant selectors, public report shell, analytics cards, and workspace state components
- Analytics Workspace for sponsorship performance, activation proof, executive views, and insights
- Public, partner, and organization report delivery surfaces
- Bitly link attribution and click analytics across events and partners
- Sports fixture enrichment and quick event creation workflows
- Variable-driven data capture with reusable clicker-set configuration
- Sponsorship platform, Phase A (mostly API-first; issues open): partnership lifecycle workspace (`/admin/partners/[id]/lifecycle`), audience report packs, paid-vs-organic measurement, v3 metric warehouse export, consented fan identity graph, loyalty missions, activation templates, stakeholder access via SSO invite

## Why It Exists

{messmass} is designed to reduce operational friction around live event reporting:
- one admin command center for operations, entities, reporting, analytics, and system controls
- one reporting pipeline across event, partner, and organization outputs
- one analytics layer for sponsorship review, activation proof, and portfolio-level decisions
- one SSOT discipline for delivery, documentation, and release state

## Quick Start

```bash
npm install
npm run dev
```

Default local app:
- App: `http://localhost:3001`

Variables are managed in `/admin/kyc` (the `seed:variables` script was removed in v12.3.23, messmass#352).

## Runtime Requirements

- Node.js: `24` (`>=24.0.0 <25.0.0`)
- npm: `>=8.0.0`

## Environment

Typical required variables:

```bash
MONGODB_URI=mongodb+srv://...
MONGODB_DB=messmass
BITLY_ACCESS_TOKEN=your_bitly_token
BITLY_ORGANIZATION_GUID=your_org_guid
BITLY_GROUP_GUID=your_group_guid
SPORTSDB_API_KEY=your_api_key
SPORTSDB_BASE_URL=https://www.thesportsdb.com/api/v1/json
FANMASS_BASE_URL=http://127.0.0.1:8787
FANMASS_API_KEY=shared-fanmass-api-key
FANMASS_INTEGRATION_TOKEN=shared-messmass-fanmass-token
SSO_BASE_URL=https://sso.doneisbetter.com
SSO_CLIENT_ID=your_sso_client_id
SSO_CLIENT_SECRET=your_sso_client_secret
JWT_SECRET=long_random_session_signing_secret
CRON_SECRET=long_random_cron_bearer_secret
```

Notes:
- Admin sign-in is DoneIsBetter SSO only (OAuth2 authorization code; messmass is a confidential client, so `SSO_BASE_URL`, `SSO_CLIENT_ID` and `SSO_CLIENT_SECRET` are required). `POST /api/admin/login` returns 410. The `users` collection holds the auto-provisioned profile and role. Sessions are HS256 JWTs signed with `JWT_SECRET`.
- `CRON_SECRET` is the Bearer secret Vercel Cron sends to the cron routes.

Many scripts expect `.env.local`. Prefer the existing `npm run ...` aliases instead of ad hoc command variants.

## Admin Workspace Model

The current internal product map is organized by job, not by legacy route names:

- `Admin Workspace` at `/admin` is the command center
- `Reporting Workspace` at `/admin/reports` owns report authoring and report dependencies
- `Analytics Workspace` at `/admin/analytics` owns sponsorship, activation, executive, and insight workflows

Main admin areas:
- `Operations`: Events, Partner Activation, Quick Add, Messages
- `Entities`: Partners, Organizations, Project-Partner relationships
- `Reports`: Report Builder, Report Themes, Content Library, Chart Algorithms, KYC Variables, Clicker Sets
- `Data`: Bitly Links, filters, and supporting integrations
- `Analytics`: Analytics Home, AI Analytics, Sponsorship Hub, Executive, Marketing, Operations, Combined Insights, Fanmass (Partner Activation lives under `Operations`)
- `System`: Users, Main Page, Cache, Help

Legacy routes such as `/admin/dashboard` and `/admin/insights` are retained only as redirects into the canonical workspace structure; `/admin/analytics/insights` redirects to `/admin/analytics/combined-insights` (#414).

## Operations and Validation

Core validation commands:

```bash
npm run test
npm run lint
npm run build
npm run type-check
npm run version:verify
npm run style:check
npm run style:audit
npm run gds:sync
npm run audit:report-variant-periods
npm run docs:audit
npm run inventory:check
npm run preflight
```

`npm run preflight` regenerates the derived docs and runs the whole CI gate list with one exit code. `npm run docs:audit` rewrites the report timestamps under `docs/_meta/`.

Important repo note:
- If `npm run type-check` fails on missing `.next/types`, run `npm run build` first and rerun the type check.

Current release version:
- `v12.3.43`

## Fleet

messmass is the master app of a five-app fleet (camera, fanmass, try-on, savetheworld) that shares one SSO. The canonical map of every cross-app edge is [docs/_audit/fleet-architecture.md](docs/_audit/fleet-architecture.md). (The camera app no longer has a try-on integration since 2026-10-10; the try-on service stays a separate fleet member. The camera app runs GDS 6.8.0, messmass stays on 6.3.0.)

## Fanmass Integration

For Camera photos, Messmass accepts one identity-free photo result or tombstone
at a time. The payload carries the exact Messmass event ID plus Camera partner,
event, and photo IDs, the source revision and generation, per-photo findings,
and image-relative detection boxes. Messmass validates the event/partner link,
stores the photo row, and rebuilds report values mechanically from active rows.
Deletion permanently fences the exact event/photo key so delayed analysis
delivery cannot recreate the erased result.
Fanmass does not fetch Messmass event context or send event totals, progress,
projected reach, or attendee identities. See
[the current Fanmass guide](docs/guides/guides-tutorial-fanmass.md) and
[analytics API reference](docs/api/api-analytics.md).

### AI Analytics surfaces

`/admin/analytics/ai` shows events with received photo results and the measures
present in those photos. Event pages let an operator inspect individual saved
results and their boxes. The figures describe received photos only; they are not
unique people, event coverage, completion, or projected audience. Analytics
reads require an administrator session. Legacy event-level summaries, mapped
stats pushes, context/lookup routes, and dashboard snapshots return HTTP 410.

Live product:
- Website: [www.messmass.com](https://www.messmass.com) (aliases messmass.com, messmass.doneisbetter.com)
- Repository: [github.com/moldovancsaba/messmass](https://github.com/moldovancsaba/messmass)

## Architecture Snapshot

Main system areas:
- `app/admin/*` for internal operations, reporting, analytics, and admin workflow surfaces
- `app/report/[slug]`, `app/partner-report/[slug]`, and `app/organization-report/[id]` for external report delivery
- `app/edit/[slug]`, `app/partner-edit/[slug]`, and `app/organization-edit/[id]` for operational editing flows
- `app/api/*` for admin, public, analytics, Bitly, report, organization, partner, and project APIs
- `lib/*` for adapters, analytics engines, reporting logic, integrations, CSRF-safe client utilities, and shared business logic
- `docs/*` for canonical product, engineering, operations, and audit documentation

Current UI foundation note:
- Root Mantine runtime is now installed and active through `app/providers.tsx` and `lib/ui/mantineTheme.ts`
- GDS 6.3.0 (`@sovereignsquad/gds-{core,theme,admin,compliance}`) installs from vendored release tarballs under `vendor/gds/` via `file:` specs plus `overrides` in `package.json`; CI needs no registry token (v12.3.29, 61c27e79).
- Legacy local wrappers and CSS systems still exist as compatibility layers until the board-tracked Mantine migration chain is completed
- Old local `@gds/*` package folders (pre-vendoring) are no longer active package authority

Current report variant reliability note:
- report variant period writes are normalized by `lib/reportPeriodValidation.ts`
- organization and partner report variant create modals validate custom date ranges before submit
- Mantine selects inside `FormModal` must render through a portal with a modal-safe z-index through `UnifiedSelectField`
- operational data checks use `npm run audit:report-variant-periods`

Current Mantine migration note:
- root Mantine runtime, theme, modals, and notifications are active globally
- shared admin shell/header/sidebar controls use Mantine primitives for interaction surfaces
- shared analytics section, toolbar, state, and metric components are Mantine/GDS-governed
- report variant create flows use Mantine field contracts with dropdowns above the modal overlay
- public partner and organization report shells use the shared Mantine `PublicReportShell`
- organization create/edit flows use the schema-driven `EntityFormModal`
- new UI work must extend these shared contracts instead of creating page-local foundations

## Documentation Map

Canonical entrypoints:
- [docs/index.md](docs/index.md) — curated documentation entrypoint
- [docs/PROJECT_MANAGEMENT.md](docs/PROJECT_MANAGEMENT.md) — SSOT and GitHub Project workflow
- [HANDOVER.md](HANDOVER.md) — current repo truth and latest delivery state
- [docs/architecture.md](docs/architecture.md) — technical architecture
- [docs/low-level-design.md](docs/low-level-design.md) — implementation-level contracts for current high-risk flows
- [docs/coding-standards.md](docs/coding-standards.md) — code and styling rules
- [docs/operations/operations-action-plan.md](docs/operations/operations-action-plan.md) — former execution queue (historical, last updated 2026-05-20)
- [docs/operations/operations-release-notes.md](docs/operations/operations-release-notes.md) — shipped version history

Key system docs:
- [docs/components/components-reusable-components-inventory.md](docs/components/components-reusable-components-inventory.md)
- [docs/admin/admin-entity-system.md](docs/admin/admin-entity-system.md)
- [docs/features/features-partners-system-guide.md](docs/features/features-partners-system-guide.md)
- [docs/features/features-bitly-integration-guide.md](docs/features/features-bitly-integration-guide.md)
- [docs/features/features-authentication.md](docs/features/features-authentication.md)
- [docs/api/api-reference.md](docs/api/api-reference.md)
- [docs/api/api-analytics.md](docs/api/api-analytics.md) — analytics and AI Analytics read APIs
- [docs/guides/guides-tutorial-fanmass.md](docs/guides/guides-tutorial-fanmass.md) — Fanmass integration and AI Analytics walkthrough

## Delivery Rules

This repo runs with strict documentation and SSOT discipline:
- not tracked on the GitHub Project board = not done
- not documented = not done
- release notes and handover must match the shipped state
- validation evidence must exist for delivered changes

## Notes

- The README is a product-level entrypoint, not the canonical full rulebook.
- For active work, always follow [docs/PROJECT_MANAGEMENT.md](docs/PROJECT_MANAGEMENT.md) and [HANDOVER.md](HANDOVER.md).

## License

MIT. See [LICENSE](LICENSE).
