# Features Overview
Status: Active
Last Updated: 2026-05-20
Canonical: Yes
Owner: Product

## Purpose
This folder contains feature-level “how it works” documentation for major `{messmass}` subsystems: access control, partners, Bitly, reporting, landing-page behavior, and other operationally important product surfaces.

## Canonical Feature Guides
- `docs/features/features-authentication.md` - Authentication, roles, sessions, and page-password access.
- `docs/features/features-partners-system-guide.md` - Partner model, UI flows, and partner-related APIs.
- `docs/features/features-bitly-integration-guide.md` - Bitly integration architecture, endpoints, and operational runbook.
- `docs/features/features-google-sheets-integration.md` - Google Sheets integration, auth, sync behavior, and troubleshooting.
- `docs/features/features-hashtag-system.md` - Hashtag and categorized-hashtag system behavior and APIs.
- `docs/features/features-multi-user-notifications.md` - Notification behavior for multi-user workflows.
- `docs/features/features-landing-main-page.md` - Main page (messmass.com) report selection, static snapshot, APIs, and integration.
- `docs/features/features-reporting-builder.md` - Reporting & Builder mode (clicker): variable inputs per chart type on `/edit/[slug]`.

## How To Use This Folder
- Start here when you are debugging or extending a subsystem.
- Prefer these docs over one-off historical notes in `docs/archive/`.
- For current admin user journeys, also use `/Users/moldovancsaba/Projects/messmass/docs/admin/admin-end-user-guide.md`.
- For current release and handoff state, use `/Users/moldovancsaba/Projects/messmass/docs/HANDOVER.md` and `/Users/moldovancsaba/Projects/messmass/README.md`.
