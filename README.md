# {messmass}
Status: Active
Last Updated: 2026-04-24
Canonical: No
Owner: Product

<p align="center">
  <img src="public/messmass-logo-black.png" alt="{messmass} logo" width="160" />
</p>

<h1 align="center">{messmass}</h1>
<p align="center"><strong>Enterprise event analytics, partner reporting, and admin operations for sports organizations, venues, and brands.</strong></p>

<p align="center">
  <img src="https://img.shields.io/badge/version-v12.1.10-2563EB?style=for-the-badge" alt="Version">
  <img src="https://img.shields.io/badge/platform-Web%20App-0F172A?style=for-the-badge" alt="Platform">
  <img src="https://img.shields.io/badge/stack-Next.js%20%7C%20MongoDB-0EA5E9?style=for-the-badge" alt="Stack">
</p>

<p align="center">
  <a href="#product-overview">Product Overview</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#operations-and-validation">Operations & Validation</a> •
  <a href="#documentation-map">Documentation Map</a>
</p>

## Product Overview

`{messmass}` is a production event intelligence platform built for live events and partner ecosystems. It combines real-time event stats, partner and project administration, Bitly analytics, report generation, and a configurable report-style system in one operational product.

Core capabilities:
- **Multi-Tenant Organization Hierarchy**: Group partners under organizations for aggregated reporting.
- Real-time event statistics and dashboard workflows
- Partner, project, and report management in a unified admin
- Public and partner report surfaces with export flows
- Bitly link analytics and attribution across events
- Sports fixture enrichment and quick event creation workflows
- Theme and report-style configuration for branded outputs
- KYC and variable-driven data capture for custom reporting

## Why It Exists

{messmass} is designed to reduce operational friction around event reporting:
- one admin surface for setup, delivery, and analysis
- one data model for projects, partners, stats, and reports
- one report pipeline for public pages, partner pages, and exports
- one documentation and SSOT workflow for ongoing delivery

## Quick Start

```bash
npm install
npm run dev
```

Default local app:
- App: `http://localhost:3001`

Common first-run companion tasks:

```bash
npm run seed:variables
```

If you use the websocket-backed real-time flow, start the companion server separately:

```bash
cd server
npm start
```

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

## Operations and Validation

Core validation commands:

```bash
npm run build
npm run type-check
npm run lint
npm run version:verify
```

Current release version:
- `v12.1.10` (Organization admin action parity, share-flow alignment, and auth-copy cleanup)

Live product:
- Website: [messmass.doneisbetter.com](https://messmass.doneisbetter.com)
- Repository: [github.com/moldovancsaba/messmass](https://github.com/moldovancsaba/messmass)

## Architecture Snapshot

Main system areas:
- `app/admin/*` for internal operations, project management, partner workflows, style management, and analytics
- `app/report/[slug]` and `app/partner-report/[slug]` for external report delivery
- `app/api/*` for admin, public, analytics, report, partner, and project APIs
- `lib/*` for adapters, analytics engines, data utilities, integrations, and shared business logic
- `docs/*` for canonical product, engineering, operations, and audit documentation

## Documentation Map

Canonical entrypoints:
- [docs/index.md](docs/index.md) — curated documentation entrypoint
- [docs/PROJECT_MANAGEMENT.md](docs/PROJECT_MANAGEMENT.md) — SSOT and GitHub Project workflow
- [docs/HANDOVER.md](docs/HANDOVER.md) — current repo truth and latest delivery state
- [docs/root-structure.md](docs/root-structure.md) — canonical top-level repository structure and root-file policy
- [docs/architecture.md](docs/architecture.md) — technical architecture
- [docs/coding-standards.md](docs/coding-standards.md) — code and styling rules
- [docs/operations/operations-action-plan.md](docs/operations/operations-action-plan.md) — active execution queue
- [docs/operations/operations-release-notes.md](docs/operations/operations-release-notes.md) — shipped version history

Key system docs:
- [docs/design/design-system.md](docs/design/design-system.md)
- [docs/features/features-partners-system-guide.md](docs/features/features-partners-system-guide.md)
- [docs/features/features-bitly-integration-guide.md](docs/features/features-bitly-integration-guide.md)
- [docs/features/features-authentication.md](docs/features/features-authentication.md)
- [docs/api/api-reference.md](docs/api/api-reference.md)
- [docs/components/components-reusable-components-inventory.md](docs/components/components-reusable-components-inventory.md)

## Delivery Rules

This repo is run with strict documentation and SSOT discipline:
- not tracked on the GitHub Project board = not done
- not documented = not done
- release notes and handover must match the shipped state
- validation evidence must exist for delivered changes

## Notes

- The README is a product-level entrypoint, not the canonical full rulebook.
- For active work, always follow [docs/PROJECT_MANAGEMENT.md](docs/PROJECT_MANAGEMENT.md) and [docs/HANDOVER.md](docs/HANDOVER.md).
