# {messmass}
Status: Active
Last Updated: 2026-05-13
Canonical: No
Owner: Product

<p align="center">
  <img src="public/messmass-logo-black.png" alt="{messmass} logo" width="160" />
</p>

<h1 align="center">{messmass}</h1>
<p align="center"><strong>Enterprise event analytics, partner reporting, reporting operations, and admin workflow tooling for sports organizations, venues, and brands.</strong></p>

<p align="center">
  <img src="https://img.shields.io/badge/version-v12.1.11-2563EB?style=for-the-badge" alt="Version">
  <img src="https://img.shields.io/badge/platform-Web%20App-0F172A?style=for-the-badge" alt="Platform">
  <img src="https://img.shields.io/badge/stack-Next.js%20%7C%20MongoDB-0EA5E9?style=for-the-badge" alt="Stack">
</p>

<p align="center">
  <a href="#product-overview">Product Overview</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#admin-workspace-model">Admin Workspace Model</a> •
  <a href="#operations-and-validation">Operations & Validation</a> •
  <a href="#documentation-map">Documentation Map</a>
</p>

## Product Overview

`{messmass}` is a production event intelligence platform for live-event delivery, partner proof-of-performance, and report operations. It combines real-time event data capture, partner and organization administration, Bitly attribution, report authoring, and analytics review in one product.

Core capabilities:
- Real-time event tracking through event editor and clicker/manual workflows
- Partner, organization, and event administration in a unified admin system
- Reporting Workspace for themes, builder composition, content, chart logic, and data dependencies
- Analytics Workspace for sponsorship performance, activation proof, executive views, and insights
- Public, partner, and organization report delivery surfaces
- Bitly link attribution and click analytics across events and partners
- Sports fixture enrichment and quick event creation workflows
- Variable-driven data capture with reusable clicker-set configuration

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

Recommended first-run companion task:

```bash
npm run seed:variables
```

If you use the websocket-backed real-time flow, start the companion server separately:

```bash
cd server
npm start
```

## Runtime Requirements

- Node.js: `24` (`>=24.0.0 <25.0.0`)
- npm: `>=8.0.0`

## Environment

Typical required variables:

```bash
MONGODB_URI=mongodb+srv://...
MONGODB_DB=messmass
NEXT_PUBLIC_WS_URL=wss://your-websocket-server.com
ADMIN_PASSWORD=your_secure_password
BITLY_ACCESS_TOKEN=your_bitly_token
BITLY_ORGANIZATION_GUID=your_org_guid
BITLY_GROUP_GUID=your_group_guid
SPORTSDB_API_KEY=your_api_key
SPORTSDB_BASE_URL=https://www.thesportsdb.com/api/v1/json
```

Many scripts expect `.env.local`. Prefer the existing `npm run ...` aliases instead of ad hoc command variants.

## Admin Workspace Model

The current internal product map is organized by job, not by legacy route names:

- `Admin Workspace` at `/admin` is the command center
- `Reporting Workspace` at `/admin/reports` owns report authoring and report dependencies
- `Analytics Workspace` at `/admin/analytics` owns sponsorship, activation, executive, and insight workflows

Main admin areas:
- `Operations`: Events, Quick Add, Messages
- `Entities`: Partners, Organizations, Project-Partner relationships
- `Reports`: Report Builder, Report Themes, Content Library, Chart Algorithms, KYC Variables, Clicker Sets
- `Data`: Bitly Links, filters, and supporting integrations
- `Analytics`: Sponsorship Hub, Partner Activation, Executive, Marketing, Operations, Insights
- `System`: Users, Main Page, Cache, Help

Legacy routes such as `/admin/dashboard` and `/admin/insights` are retained only as redirects into the canonical workspace structure.

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
```

Important repo note:
- If `npm run type-check` fails on missing `.next/types`, run `npm run build` first and rerun the type check.

Current release version:
- `v12.1.11`

Live product:
- Website: [messmass.doneisbetter.com](https://messmass.doneisbetter.com)
- Repository: [github.com/moldovancsaba/messmass](https://github.com/moldovancsaba/messmass)

## Architecture Snapshot

Main system areas:
- `app/admin/*` for internal operations, reporting, analytics, and admin workflow surfaces
- `app/report/[slug]`, `app/partner-report/[slug]`, and `app/organization-report/[id]` for external report delivery
- `app/edit/[slug]`, `app/partner-edit/[slug]`, and `app/organization-edit/[id]` for operational editing flows
- `app/api/*` for admin, public, analytics, Bitly, report, organization, partner, and project APIs
- `lib/*` for adapters, analytics engines, reporting logic, integrations, CSRF-safe client utilities, and shared business logic
- `docs/*` for canonical product, engineering, operations, and audit documentation

## Documentation Map

Canonical entrypoints:
- [docs/index.md](docs/index.md) — curated documentation entrypoint
- [docs/PROJECT_MANAGEMENT.md](docs/PROJECT_MANAGEMENT.md) — SSOT and GitHub Project workflow
- [docs/HANDOVER.md](docs/HANDOVER.md) — current repo truth and latest delivery state
- [docs/architecture.md](docs/architecture.md) — technical architecture
- [docs/coding-standards.md](docs/coding-standards.md) — code and styling rules
- [docs/operations/operations-action-plan.md](docs/operations/operations-action-plan.md) — active execution queue
- [docs/operations/operations-release-notes.md](docs/operations/operations-release-notes.md) — shipped version history

Key system docs:
- [docs/components/components-reusable-components-inventory.md](docs/components/components-reusable-components-inventory.md)
- [docs/admin/admin-entity-system.md](docs/admin/admin-entity-system.md)
- [docs/features/features-partners-system-guide.md](docs/features/features-partners-system-guide.md)
- [docs/features/features-bitly-integration-guide.md](docs/features/features-bitly-integration-guide.md)
- [docs/features/features-authentication.md](docs/features/features-authentication.md)
- [docs/api/api-reference.md](docs/api/api-reference.md)

## Delivery Rules

This repo runs with strict documentation and SSOT discipline:
- not tracked on the GitHub Project board = not done
- not documented = not done
- release notes and handover must match the shipped state
- validation evidence must exist for delivered changes

## Notes

- The README is a product-level entrypoint, not the canonical full rulebook.
- For active work, always follow [docs/PROJECT_MANAGEMENT.md](docs/PROJECT_MANAGEMENT.md) and [docs/HANDOVER.md](docs/HANDOVER.md).
