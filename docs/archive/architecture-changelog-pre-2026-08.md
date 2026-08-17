# Architecture Doc — Changelog Extraction (pre-2026-08)
Status: Archived
Last Updated: 2026-08-17T00:00:00.000Z
Canonical: No
Owner: Documentation

This file consolidates two dated, changelog-style blocks that used to sit at the top of
`docs/architecture.md`, extracted to stop that file from being "half changelog" (a
long-flagged liability — see root `HANDOVER.md`). Neither block carried unique current-state
architecture content; both are fully superseded by
[`docs/operations/operations-release-notes.md`](../operations/operations-release-notes.md),
which is the canonical shipped-version history per `docs/index.md`.

Do not treat this as a source of truth for current behavior. Start at `docs/index.md` and
follow canonical docs, or `docs/architecture.md` for current architecture.

## Contents
- [Dated update log (was the file's top preamble)](#dated-update-log)
- [Version History (flat list)](#version-history)

## Dated update log

**Mantine Entity, Variant, and Public Report Shell Delivery (2026-06-25):**
- **Report variant selector recovery:** Mantine `Select` dropdowns inside report variant `FormModal` now render through a portal with modal-safe z-index, preventing the dropdown from being hidden behind or interpreted as outside the dialog.
- **Schema-driven organization forms:** `/admin/organizations` create/edit flows now use the shared `EntityFormModal` schema layer backed by `AdminEntityConfig.forms`.
- **Public report shell migration:** Partner and organization report loading/error/page shells now use `PublicReportShell` and `PublicReportState` from Mantine primitives while preserving existing report runtime/content behavior.
- **Enforcement hardening:** `npm run style:check` now blocks regression to legacy public report shell wrappers in the migrated partner/organization report views.

**Report Variant Period Reliability (2026-06-24):**
- **Period contract authority:** `lib/reportPeriodValidation.ts` is the shared server/client-adjacent contract for report variant period presets and custom date ranges.
- **Modal select layering:** Mantine `Select` controls inside `FormModal` must render through `UnifiedSelectField` with a portal and modal-safe z-index.
- **Persistence safety:** `createReportVariant` and `updateReportVariant` normalize period data before writing to `report_variants`; invalid writes return 400 responses with stable error codes.
- **Operational recovery:** `scripts/audit-report-variant-periods.ts` supports dry-run detection and explicit repair for invalid custom-period records without deleting variants.
- **LLD reference:** See `docs/low-level-design.md` for request flow, contracts, edge cases, and test expectations.

**Organization Admin Action Parity (2026-04-27):**
- **Shared action model:** `/admin/organizations` now uses the same action emphasis and report-sharing interaction pattern as `/admin/partners` for the organization routes that actually exist.
- **Protected report sharing:** Organization reports are now first-class shareable surfaces in the page-password system via `organization-report`.
- **Auth wording cleanup:** UI/docs wording was corrected to reflect the actual model: page password validation plus admin-session bypass, not a static admin password fallback.

**Organization Report Parity (2026-04-24):**
- **Config Parity in Org Editor**: Added style/template/clicker/logo/emoji settings to `/organization-edit/[id]` with the same dropdown-source model used by partner configuration.
- **Resolver Compatibility**: Organization reports now prefer `metadata.reportTemplateId`, then fall back to legacy `metadata.reportId`, then default template.
- **Style Wiring Fix**: Organization editor style injection now correctly reads `metadata.styleId` (not `reportId`).

**Organization Admin Data Flow Recovery (2026-04-24):**
- **Live Admin Collections Restored**: Organization CRUD now targets the `organizations` collection and partner membership uses `partners.organizationId`.
- **Compatibility Layer Kept**: Legacy V3 organization routes remain available for older records, but the admin UI now prefers the live admin organization/report path.
- **Report Surface Recovery**: Added a non-V3 organization reporting adapter path (`/api/organizations/report/[id]`) so report/editor actions work for existing admin-managed organizations without forced migration.

**Deep Quality & Measured Scaling (2026-03-16):**
- **Measured Height Font Scaling**: Implemented dynamic font resizing in `PieChart`, `VerticalBarChart`, and `KPICard` using `ResizeObserver` to prevent text overflow without clipping.
- **Layout Grammar Enforcement**: Standardized container behaviors to follow Rule 2.1 (forbidden overflow hiding).
- **Technical Debt Harvest**: Purged deprecated library stubs and hardcoded chart configurations in favor of MongoDB-driven SSOT.

**V3 Context & Middleware (2026-03-16):**
- **Organization Context Injection**: Implemented the structural foundation for V3 multi-tenant scoping and RBAC via `withOrgContext` middleware.
- **Header Injection**: Automated injection of `x-v3-org-id` into API requests based on user role and assigned organizations.
- **Infrastructure Verification**: Created `/api/v3/health` for mid-implementation validation of context derivation logic.

**Organization Hierarchy & Multi-Tenancy (2026-03-14):**
- **First wave of V3 multi-tenancy**: Partners (Entities) logically grouped under Organizations for aggregated activity reporting.
- **Member Management**: Created the `ManageMembersModal` and associated API for bulk assignment of entities to organizations.
- **Aggregated Activity API**: Developed a high-performance activity aggregation engine for organizations that rolls up metrics and activity lists from all member entities.

**React 19 & Next.js 15 (2026-03-13):**
- Systemic upgrade to React 19 for full compatibility with Next.js 15 features and performance improvements.
- **Hydration Deadlock Resolution**: Fixed a systemic client-side hydration failure by adjusting dependencies and refining the Content Security Policy (CSP).
- **Formula Engine Security**: Modified CSP to allow `'unsafe-eval'`, enabling the dynamic KPI formula engine to function securely in production.

**Recent Update (2026-01-16):**
- **Partner Links**: Partner edit/report buttons now use `partner._id` (ObjectId) instead of `viewSlug` for reliable access. This fixes "Invalid partner ID format" errors when `viewSlug` is human-readable.
- **Clicker Manager UX**: Chart algorithm selection replaced text input with searchable dropdown showing all available charts. Users can now discover and select algorithms like "gender-distribution", "szerencse-gender", etc. without manual typing.

**Previous Update (2026-01-21):** Clicker Manager now treats `clickerSetId` as a required, stringified identifier end-to-end. All variable group CRUD calls must pass `clickerSetId` at the request root; APIs accept both string and legacy ObjectId values for backward compatibility but persist strings to prevent cross-set leakage.

## Version History

- **Version 12.1.53** — AI Analytics workspace, per-event AI report, and the fanmass analysis-summary channel
- **Version 7.0.1** — 🚀 **DATABASE-FIRST VARIABLE SYSTEM**: Complete migration to MongoDB-driven variables with Single Reference System (`stats.` prefix)
- **Version 6.42.0** — Page Styles System: Complete custom theming engine with admin UI and live preview
- **Version 6.10.0** — Chart System Enhancement Phase B (Parameterization, Bitly Charts, Manual Tokens)
- **Version 6.9.2** — Real-Time Formula Validator in Admin Charts
- **Version 6.9.0** — Chart System P0 Hardening (production)
- **Version 6.8.0** — KYC creation flow and boolean/date types
- **Version 6.7.0** — KYC export and advanced filters (source/tags/flags)
- **Version 6.6.0** — KYC Variables page and Clicker Manager split
- **Version 6.5.0** — Analytics Insights: In-page Help and Usage Guide
- **Version 6.4.0** — Bitly Search UX Enhancement (Loading State Separation)
- **Version 6.0.0** — Partners Management System + Sports Match Builder + Comprehensive Documentation
- **Version 5.57.0** — PartnerSelector Component with Predictive Search
- **Version 5.56.0-5.56.3** — Partners CRUD System with Pagination and Search
- **Version 5.54.0-5.54.12** — Bitly Integration Enhancements (Many-to-Many, Notification Grouping)
- **Version 5.52.0** — Admin Variables & Metrics Management System
- **Version 5.49.3** — Admin Layout & Navigation System
- **Version 5.48.0** — Multi-User Notification System
- **Version 4.2.0** — Admin HERO Standardization and Content Surface
- **Version 2.2.0** — Hashtag Categories System ✅ **COMPLETED**
