# End User Guide (Admin Operations)
Status: Active
Last Updated: 2026-05-20
Canonical: Yes
Owner: Product Operations

**Version:** 12.1.16
**Audience:** admins, operators, support, implementation partners
**Primary in-product reference:** `/admin/help`

## Purpose

This document is the canonical operator guide for the current `{messmass}` admin product model. It describes the live workspace structure, the main user journeys, and the routes users should actually use today.

## Product Map

### Admin Workspace

Use `/admin` as the single authenticated entry point.

- `Operations`: `/admin/events`, `/admin/messages`, `/admin/quick-add`, `/admin/project-partners`
- `Entities`: `/admin/partners`, `/admin/organizations`
- `Reports`: `/admin/reports` plus report-authoring destinations
- `Data`: `/admin/bitly`, `/admin/hashtags`, `/admin/categories`
- `Analytics`: `/admin/analytics` and its drilldowns
- `System`: `/admin/users`, `/admin/cache`, `/admin/mainpage`, `/admin/help`

### Reporting Workspace

Use `/admin/reports` when the job is changing how reports are built, themed, fed, or exported.

Core surfaces:

- `/admin/visualization` — report builder
- `/admin/styles` — report themes
- `/admin/content-library` — reusable report content
- `/admin/charts` — chart algorithms and rendering logic
- `/admin/kyc` — variable schema used by reports and editors
- `/admin/clicker-manager` — live capture layouts that feed reports

### Analytics Workspace

Use `/admin/analytics` as the only analytics home.

Core surfaces:

- `/admin/analytics/sponsorship` — sponsorship performance and proof rollups
- `/admin/analytics/sponsorship/activation` — partner activation and proof readiness
- `/admin/analytics/executive` — executive portfolio lens
- `/admin/analytics/marketing` — marketing lens
- `/admin/analytics/operations` — operations lens
- `/admin/analytics/insights` — anomaly, trend, and synthesized insight review

Legacy routes such as `/admin/dashboard` and `/admin/insights` now redirect into the canonical workspace model.

## Roles and Access

- `guest` — help-only orientation access
- `user` — day-to-day entity work: Events, Partners, Organizations, Project Partners
- `admin` — user access plus Reporting Workspace, Analytics Workspace, Bitly, Variables, Clicker Sets, and broader setup tools
- `superadmin` — full system access including user administration and sensitive system controls

Reference implementation: `/Users/moldovancsaba/Projects/messmass/lib/users.ts`

## Core Workflows

### 1. Event Setup and Delivery

1. Open `/admin/events`
2. Create a new event or open an existing one
3. Complete `Event Basics`
4. Continue into `Reporting` or `Reporting & Distribution`
5. Use `Open Editor` for live data capture
6. Use `Open Report` for review and recipient-facing output

Event execution routes:

- `/edit/[slug]` — live event editor
- `/report/[slug]` — event report output

### 2. Partner Setup

1. Open `/admin/partners`
2. Create or edit the partner
3. Complete `Partner Basics`
4. Continue into reporting and integrations
5. Configure Bitly, template/style defaults, Google Sheets, clicker sets, and logo/report setup as needed

Partner-related routes:

- `/admin/partners`
- `/admin/partners/[id]/analytics`
- `/partner-report/[id]`
- `/partner-edit/[slug]`

### 3. Organization Management

Use organizations when reporting and access need to aggregate multiple partners.

Primary routes:

- `/admin/organizations`
- `/organization-report/[id]`
- `/organization-edit/[id]`

Current behavior:

- organization lists load from `/api/admin/organizations`
- member assignment uses `/api/admin/organizations/[id]/members`
- both admin organization APIs are superadmin-only

### 4. Project-Partner Mapping

Use `/admin/project-partners` to assign partner relationships that drive template inheritance and reporting context.

Use cases:

- assign home/away partners
- repair missing partner relationships
- run auto-suggest for bulk mapping

### 5. Reporting Setup

Go to `/admin/reports` when you need to change output behavior rather than event content.

Typical path:

1. adjust variables or clicker sets if the data model must change
2. update themes, builder structure, content blocks, or chart algorithms
3. reopen a live report with real project data
4. verify the output before sharing

### 6. Analytics and Proof Review

Go to `/admin/analytics` first, then choose the lens that matches the decision:

- `Sponsorship Hub` for unified sponsorship performance
- `Partner Activation` for proof delivery readiness and missing evidence
- `Executive`, `Marketing`, or `Operations` for role-specific portfolio review
- `Insights` for anomalies, patterns, and review cues

## Sharing Model

The default interaction grammar is:

- `Open Report`
- `Open Editor`
- `Share Report`
- `Share Editor`

Operational rule:

- open first when you are doing the work yourself
- share second when you need a recipient-safe link

## Bitly, Variables, and Data Dependencies

These tools are part of active delivery, not side utilities:

- `/admin/bitly` — manage Bitly links, associations, and sync state
- `/admin/kyc` — maintain the variable schema used by reports and editors
- `/admin/clicker-manager` — control operator-facing live capture layouts
- `/admin/hashtags` and `/admin/categories` — tagging and filter structure

## Troubleshooting

### I cannot find the right page

Start from `/admin`, not from memorized old URLs. The sidebar and workspace cards reflect the canonical structure.

### I need to change the report output

Go to `/admin/reports`, not directly to analytics or entity pages.

### I need to fix missing proof or sponsorship evidence

Go to `/admin/analytics/sponsorship/activation`.

### I need to manage organization rollups

Go to `/admin/organizations`, then use the organization report or organization edit routes.

### I land on an old dashboard route

That route is legacy. Follow the redirect into `/admin` or `/admin/analytics`.

## Update Process

Update this document when:

- a canonical admin route changes
- a major workflow changes
- reporting or analytics ownership changes
- role capabilities change

When this file changes, keep these aligned:

- `/Users/moldovancsaba/Projects/messmass/app/admin/help/page.tsx`
- `/Users/moldovancsaba/Projects/messmass/docs/HANDOVER.md`
- `/Users/moldovancsaba/Projects/messmass/README.md` when product-map language changes materially
