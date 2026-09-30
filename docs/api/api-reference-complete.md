# messmass API Reference (complete)
Status: Active
Last Updated: 2026-09-28T12:00:00.000Z
Canonical: Yes
Owner: Backend

**Version:** 12.3.40
_messmass#350 — each entry derived by reading its handler @ 7353223e (guards re-verified @ v12.3.20). Missing routes added and UNGUARDED-GAP rows re-verified @ dd34e229 (2026-09-28). Editor load/save rows (`/api/projects/edit/:slug`, `PUT /api/projects`, `/api/partners/edit/:slug`, `PUT /api/partners`, `POST /api/hashtags`, `POST /api/auto-generate-chart-block`) re-derived from their handlers for the editor save-access fix (2026-09-28)._

Coverage-measured, per-endpoint reference for every route under `app/api/`. Each entry gives the auth layer, request/response shape, and side effects (DB writes + external calls). For the curated quick reference see [api-reference.md](api-reference.md).

> The **auth** column is the load-bearing one and is independently enforced: `tests/api-mutation-auth.test.ts` sweeps every route per-handler and fails CI if any mutating handler (or non-exempt read) lacks an auth primitive, so a route documented here as guarded is guarded in code. The request/response/side-effect columns are handler-derived summaries, not exhaustive schemas.

## Coverage

- Endpoints documented: **333** across 57 route groups. That is every exported HTTP method handler (including the 4 CORS `OPTIONS` handlers under `/api/public`) in the 221 `route.ts` files under `app/api/` @ dd34e229 (`find app/api -name route.ts | wc -l` = 221).
- Auth adjudication: 242 admin-session, 11 page-password, 30 machine-token, 7 cron-secret, 3 org-scoped, 40 public-by-design, 0 stakeholder-session, 0 UNGUARDED-GAP.
- Deprecation candidates (stub/410/dead): **2** (see the end).

## Auth layers

- **admin-session** — `getAdminUser`/`requireSession` (DoneIsBetter SSO session cookie; authentication only). `requireAdmin` additionally requires role admin or superadmin (403 otherwise) and `requireSuperadmin` requires superadmin (`lib/apiGuards.ts`); several `getAdminUser` routes role-check inline. Summaries note "superadmin only" where that applies.
- **page-password** — `requirePageAccess`/`requireProjectWrite`/`requirePartnerWrite`/`require*EditPageAccess` (per-page grant or admin session); `requireEditorAccess` (admin session or any page-access edit grant, for editor-driven routes that carry no project id). A grant is an entry in the signed HttpOnly `page-access` cookie (`lib/pageAccess.ts`). It is issued by `PUT /api/page-passwords` for a correct password (or for any caller with an admin session), and by `GET /api/projects/edit/:slug` when it serves an event editor that has no password to a caller holding its UUID edit link. Each grant expires 12 h after it was last issued. The editor loaders re-issue a grant the caller already holds, and a grant issued before the page's current password (set or regenerated) no longer counts for the editor saves. A grant from a token signed before per-grant issue times existed is dated only by the token's `iat`, so on a protected page it never counts as current: it is not renewed and does not save, and its holder enters the password once more (it still expires 12 h after that `iat`, re-signing included). The editor write guards answer 401 `EDIT_ACCESS_REQUIRED` when the caller has neither a session nor a current grant.
- **machine-token** — `requireFanmassIntegrationAuth` (Fanmass token) / `assertCameraSecret` (camera shared secret) / `requireAPIAuth` (public REST Bearer, `lib/apiAuth.ts`: backs `/api/public/*` only; the key is matched against the user's bcrypt `apiKeyHash` and needs `apiKeyEnabled`; any request carrying a `Cookie` header is rejected; login passwords are not accepted as keys since 6f31990d).
- **cron-secret** — `CRON_SECRET` bearer (Vercel Cron).
- **org-scoped** — `validateOrganizationAccess` (V3 multi-tenant).
- **stakeholder-session** — `stakeholder-session` cookie: an HS256 JWT signed with `JWT_SECRET`, 30-day lifetime, carrying `{grantId, email, role, scopeType, scopeId}`. It is minted by `mintStakeholderSession` (`lib/auth/stakeholderSession.ts`) in `GET /api/auth/sso/stakeholder-callback`, only after SSO has verified the email and a non-revoked `stakeholder_grants` row exists for it (`lib/stakeholderGrants.ts`). The guard is `requireStakeholderRole(request, roles)` in `lib/apiGuards.ts`: 401 without a valid session, 403 when the role is not allowed. The calling route must also compare `session.scopeId` with the requested resource. At dd34e229 no route calls `requireStakeholderRole`, so no row below uses this label.
- **public-by-design** — intentionally anonymous.
- **UNGUARDED-GAP** — no guard where one is warranted (tracked; see gaps list).

## /activation-templates

| Method | Path | Auth | Summary | Request | Response | Side effects |
|--------|------|------|---------|---------|----------|--------------|
| GET | `/api/activation-templates/:id/participations` | admin-session | List the recorded fan participations for one activation template, newest first. | path: id | {success, participations[] (_id, templateId, fanIdentityId, responses, occurredAt, createdAt)} | read-only (reads activation_participations) |
| POST | `/api/activation-templates/:id/participations` | admin-session | Record one fan's participation after validating the responses against the template's dataFields, and link it into the fan identity graph. | path: id; body: fanIdentityId (required), responses (object), occurredAt? (ISO, defaults to now) | {success, participation}; 400 INVALID_RESPONSES; 404 TEMPLATE_NOT_FOUND / IDENTITY_NOT_FOUND | writes activation_participations (insertOne) + fan_identity_links (insertOne, linkType 'activation') |
| GET | `/api/activation-templates/:id` | admin-session | Read one activation template with its yield summary (participation count + per-field fill rate). | path: id | {success, template, yield{participationCount, fieldFillRates}}; 404 if missing | read-only (reads activation_templates, activation_participations) |
| GET | `/api/activation-templates` | admin-session | List activation templates, newest first. | none | {success, templates[]} | read-only (reads activation_templates) |
| POST | `/api/activation-templates` | admin-session | Create a sponsor-linked activation template (status 'draft'). | body: name (required), dataFields[] (required, non-empty; each {key, label, type: 'text'\|'select'\|'boolean'\|'number', required, options?}), description?, partnerId? | {success, template}; 400 on missing name / invalid dataFields | writes activation_templates (insertOne) |

## /admin

| Method | Path | Auth | Summary | Request | Response | Side effects |
|--------|------|------|---------|---------|----------|--------------|
| GET | `/api/admin/auth` | admin-session | Session status check — returns the current admin user or 401 if not authenticated. | none | {success, user} on 200; {success:false, error} on 401/500 | read-only |
| POST | `/api/admin/clear-cache` | admin-session | Revalidates Next.js route/layout caches so fresh content is served. | body: {type: 'routes'\|'all'\|'build'} | {success, message, details:{revalidatedRoutes, totalRoutes, timestamp}} | read-only (no DB); calls Next.js revalidatePath/revalidateTag cache APIs |
| GET | `/api/admin/clear-cookies` | public-by-design | GET alias that delegates to POST to clear the admin-session cookie. | none | {success, message} | read-only (no DB); deletes admin-session cookie |
| POST | `/api/admin/clear-cookies` | public-by-design | Force-clears the admin-session cookie to recover from stale-cookie states. | none (reads Host header for cookie domain) | {success, message} | read-only (no DB); sets/deletes admin-session cookie on the response |
| GET | `/api/admin/contact-inquiries` | admin-session | Lists all submitted contact inquiries for the admin panel. | none | {success, inquiries[]} | read-only |
| GET | `/api/admin/email-selftest` | admin-session | Sends a fixed diagnostic email to SUPERADMIN_EMAIL to verify email delivery works end-to-end. | none (recipient is always the configured SUPERADMIN_EMAIL, never caller-supplied); rate-limited per client IP | {sent, recipient}; 429 when rate-limited | no DB writes; external email send via camera email service (testEmailConfig → lib/emailNotifications) |
| POST | `/api/admin/fanmass/commands` | admin-session | Enqueues an admin-operator Fanmass command (run-control, entity-curation, settings) onto the command queue. | body: {type: FanmassCommandType, payload: object}; validates type against allowlist, per-type payload shape, and settings allowlist | 201 {success, data:{id,type,status,requestedAt}}; 400/401/409 on error | writes fanmass commands collection (createCommand); reads for pending duplicates |
| GET | `/api/admin/fanmass/events/:eventId` | admin-session | Loads the Fanmass link record for one event. | path: eventId | {success, data:{link}}; 401 when not admin | read-only |
| POST | `/api/admin/fanmass/events/:eventId` | admin-session | Upserts a Fanmass link for an event and optionally runs a dry-run or live analytics sync. | path: eventId; body: {fanmassBatchId\|batchId, status, contextVersion, contextHash, action:'dry-run'\|'sync', force} | {success, data:{link, sync?}} (200/201/202) | writes Fanmass link + audit records (upsertFanmassLink); syncFanmassAnalytics writes synced analytics into messmass DB |
| GET | `/api/admin/fanmass/events` | admin-session | Lists every messmass event that has at least one Fanmass dashboard snapshot, newest-first. | none | {success, data:{events[]}}; 401 when not admin | read-only |
| GET | `/api/admin/fanmass/snapshot` | admin-session | Returns the latest Fanmass dashboard snapshot for one event (read from messmass DB, never calls Fanmass live). | query: eventId (required) | {success, data:{snapshot}}; 400 if eventId missing; 401 when not admin | read-only |
| GET | `/api/admin/filter-style` | admin-session | Fetches the persisted styleId for a hashtag filter combination. | query: hashtags (comma-separated) | {success, styleId, hashtags} | read-only |
| POST | `/api/admin/filter-style` | admin-session | Persists a styleId for a normalized hashtag filter combination (creates the filter row if absent). | body: {hashtags: string[], styleId} | {success, created\|updated, styleId} | writes filter_slugs collection (insertOne/updateOne) |
| GET | `/api/admin/fix-mojibake-text` | admin-session | Scans partners/organizations/projects name fields for Windows-1252 mojibake; dry-run by default, repairs in place with ?apply=1. | query: apply=1 to write fixes (default dry run) | {success, mode:'applied'\|'dry_run', note, results{scanned,candidateCount,sample,applied?}} | when apply=1, writes partners.name, organizations.name, projects.eventName (updateOne per candidate) |
| GET | `/api/admin/hashtag-style` | admin-session | Fetches the styleId (and slug) persisted for a specific hashtag. | query: hashtag (required) | {success, styleId, slug} | read-only |
| POST | `/api/admin/hashtag-style` | admin-session | Upserts the styleId for a hashtag report. | body: {hashtag, styleId} | {success, modified, upserted} | writes hashtag_slugs collection (updateOne upsert) |
| GET | `/api/admin/landing-projects` | admin-session | Returns a minimal project list (eventName, viewSlug, eventDate) for the main-page report selector. | none | {success, projects:[{_id,eventName,viewSlug,eventDate}]} | read-only |
| GET | `/api/admin/landing-settings` | admin-session | Reads landing-page settings (which report slug, optional static-snapshot metadata). | none | {success, settings:{landingReportSlug,...}} | read-only |
| PUT | `/api/admin/landing-settings` | admin-session | Updates the landing report slug. | body: {landingReportSlug: string} | {success}; 400 if slug missing | writes landing settings store (setLandingReportSlug) |
| POST | `/api/admin/landing-static-generate` | admin-session | Generates a static snapshot (blocks + computed chart results) from the current landing report and persists it to settings. | none (uses configured landingReportSlug) | {success, generatedAt, blocksCount, verified, readBackBlocks}; 404/400 on missing project/template | writes landing settings static snapshot (setLandingStaticSnapshot); reads projects/report_templates/data_blocks/chart_configurations; external HTTP fetch to own /api/report-config |
| POST | `/api/admin/local-users/:id/api-access` | admin-session | Rotates (generates) a user's independent Bearer API key. Admin or superadmin only; only a superadmin can act on a superadmin's key (dd34e229). | path: id; no body | {success, message, apiKey (plaintext, returned this once only), user{id,email,name,role,apiKeyEnabled,updatedAt}}; 401 unauthenticated; 403 wrong role or non-superadmin targeting a superadmin; 404 if missing | writes users (rotateApiKey: $set apiKeyHash = bcrypt hash of a new 32-byte random hex key, updatedAt); the previous key stops working; the plaintext is never stored or logged |
| PUT | `/api/admin/local-users/:id/api-access` | admin-session | Enables or disables Bearer-token API access (apiKeyEnabled) for a user. Admin or superadmin only; only a superadmin can act on a superadmin (dd34e229). Refuses to disable if the user made API calls within the last 5 minutes. | path: id; body: {enabled: boolean} | {success, message, recommendation?, user}; 400 if enabled is not boolean; 401/403 as POST; 409 if recent API activity; 404 if missing | writes users collection (toggleAPIAccess: apiKeyEnabled, updatedAt) |
| POST | `/api/admin/local-users/:id/send-email` | admin-session | Emails a (regenerated) password to a user (superadmin only). | path: id; body: {password} | {success, message}; 400 missing password/invalid id; 404 if missing | no DB writes; external email send via camera email service (sendPasswordRegeneratedEmail) |
| DELETE | `/api/admin/local-users/:id` | admin-session | Deletes a user (superadmin only; cannot delete self). | path: id | {success, message}; 400 self-delete/invalid id; 404 if missing | deletes from users collection (deleteOne) |
| PUT | `/api/admin/local-users/:id` | admin-session | Regenerates a user's password (superadmin only). | path: id; body: {regeneratePassword: true} | {success, password, message}; 400 if no action; 404 if user missing | writes users collection (updateOne sets new password + updatedAt) |
| GET | `/api/admin/local-users` | admin-session | Lists local users with search and pagination for the admin user-management UI. | query: search, limit (1-100, default 20), offset | {success, users:[{id,email,name,role,apiKeyEnabled,apiUsageCount,lastAPICallAt,...}], pagination} | read-only |
| POST | `/api/admin/local-users` | admin-session | Creates a local admin/api user with a generated one-time password (returned once). | body: {email, name, role:'admin'\|'api'} | 201 {success, user, password}; 409 on duplicate email | writes users collection (createUser, hashed password) |
| DELETE | `/api/admin/login` | public-by-design | Logout — clears admin-session/auth-source/sso-tokens cookies and best-effort revokes the SSO access/refresh tokens. | none | {success, message}; 500 on failure | no DB writes; external SSO revokeToken calls (lib/auth/ssoOAuth); sets deletion + post-logout cookies |
| POST | `/api/admin/login` | public-by-design | Deprecated local login stub — always returns 410 pointing callers to SSO. | none | 410 {error, ssoLoginUrl:'/api/auth/sso/login'} | read-only |
| GET | `/api/admin/organizations/:id/members` | admin-session | List all partners with their current org and an isMember flag for this org (v2 or V3). | path :id | success, organization (_id,name,slug), partners[] (_id, name, currentOrganizationId, currentOrganizationName, isMember) | read-only (reads organizations + partners, or V3Organization + V3Entity) |
| PUT | `/api/admin/organizations/:id/members` | admin-session | Set org membership: assign listed partners to this org, unassign the rest. | path :id; body: memberPartnerIds (string[]) | success | writes partners collection (updateMany $set/$unset organizationId) OR V3Entity (updateMany organizationId; deselected fall back to master org) |
| DELETE | `/api/admin/organizations/:id` | admin-session | Delete an org only if it has no members; master org (69b322e0...) is protected. | path :id | success (or 400 if members remain / master org) | writes organizations (deleteOne) OR V3Organization (findByIdAndDelete); reads partners/V3Entity member counts |
| GET | `/api/admin/organizations/:id` | admin-session | Fetch one organization by id, falling back to the V3 mongoose Organization model. | path :id | success, organization | read-only (reads organizations; V3Organization via mongoose) |
| PATCH | `/api/admin/organizations/:id` | admin-session | Alias of PUT — updates org fields. | path :id; body: name?, slug?, status?, metadata? | success, organization | writes organizations collection OR V3Organization (via PUT) |
| PUT | `/api/admin/organizations/:id` | admin-session | Update org name/slug/status/metadata (v2 organizations collection or V3 fallback). | path :id; body: name?, slug?, status?, metadata? | success, organization | writes organizations collection (updateOne) OR V3Organization (findByIdAndUpdate) |
| GET | `/api/admin/organizations` | admin-session | List all organizations sorted by name (superadmin only). | none | success, organizations[] (_id, name, slug, status, metadata, createdAt, updatedAt) | read-only (reads organizations) |
| POST | `/api/admin/organizations` | admin-session | Create an organization with a unique auto-slugged slug (superadmin only). | body: name (required), slug?, status? ('active'\|'inactive'), metadata? | success, organization | writes organizations collection (insertOne) |
| GET | `/api/admin/partners` | admin-session | List all partners for admin dropdown selections. | none | success, partners[] (_id, name, reportTemplateId) | read-only (reads partners) |
| DELETE | `/api/admin/permissions` | admin-session | Revoke a project permission and write an audit log entry. | Authorization: Bearer header; query: projectId, userId | success, message, revokedPermission (or 404) | writes project_permissions (deleteOne) + audit_logs (insertOne); external HTTP to SSO validate |
| GET | `/api/admin/permissions` | admin-session | List all project permissions (admin/superadmin only). | Authorization: Bearer <SSO token> header | success, permissions[] (_id, projectId, userId, role, grantedAt, grantedBy), meta | read-only (reads project_permissions); external HTTP to SSO_BASE_URL/api/validate |
| POST | `/api/admin/permissions` | admin-session | Grant or update a project permission (owner/editor/viewer). | Authorization: Bearer header; body: projectId, userId, role | success, message, permission (+ permissionId on create) | writes project_permissions (insertOne or updateOne); external HTTP to SSO validate |
| POST | `/api/admin/project-partners/auto-suggest` | admin-session | Bulk auto-match partner1/partner2 from 'Home x Away' event names for projects missing partner1. | none (no body) | success, updated, total | writes projects collection (updateOne $set partner1/partner2 for high-confidence matches) |
| GET | `/api/admin/project-partners` | admin-session | List the 100 newest projects with their partner1/partner2 ids. | none | success, projects[] (_id, eventName, editSlug, partner1, partner2, createdAt) | read-only (reads projects) |
| PUT | `/api/admin/project-partners` | admin-session | Update a project's partner1/partner2 relationships (was an unguarded gap; now requireAdmin). | body: projectId, partner1Id (nullable), partner2Id (nullable) | success, updated (modifiedCount) | writes projects collection (updateOne $set/$unset partner1/partner2) + syncProjectToV3Activity (V3 activities) |
| DELETE | `/api/admin/projects/:id` | admin-session | Delete a project by id and write an audit log entry (admin/superadmin only). | Authorization: Bearer header; path :id | success, message, deletedProject (or 404) | writes projects (deleteOne) + audit_logs (insertOne, stores full deleted project copy); external HTTP to SSO validate |
| POST | `/api/admin/register` | public-by-design | Removed self-registration stub — always returns 410 pointing users to SSO login. | none | error message, ssoLoginUrl='/api/auth/sso/login' (status 410) | read-only (no DB access) |
| GET | `/api/admin/sync-events-to-camera` | admin-session | One-click batched backfill pushing unsynced projects (no externalRefs.camera) into camera. | none | success, processedThisCall, provisioned, failed, remaining, note, failures[] | writes projects (externalRefs.camera via provisionCameraEventForProject); external HTTP to camera; returns 503 if camera not configured |
| GET | `/api/admin/sync-partners-to-camera` | admin-session | One-click batched backfill linking partners without cameraPartnerId into camera. | none | success, processedThisCall, linked, failed, remaining, note, failures[] | writes partners (cameraPartnerId via ensureCameraPartner); external HTTP to camera; returns 503 if camera not configured |
| GET | `/api/admin/ui-settings` | admin-session | Read typography/font UI settings (defaults to Inter if unset). | none | settings doc (key, fontFamily, createdAt, updatedAt) | read-only (reads settings) |
| PUT | `/api/admin/ui-settings` | admin-session | Update the selected font family after validating against available_fonts; sets mm_font cookie. | body: fontFamily (validated against available_fonts / DEFAULT_FONTS) | success, fontFamily, updatedAt (+ mm_font cookie) | writes settings collection (updateOne upsert key='typography'); reads available_fonts |
| PUT | `/api/admin/users/:id/organizations` | admin-session | Assign a user to one or more organizations for V3 org scoping (superadmin only); every id must exist in organizations. | path :id; body: organizationIds (string[]) | success, user (id, email, organizationIds); 400 on a malformed or unknown org id / bad body; 401/403; 404 if user missing | writes users collection (updateOne $set organizationIds/updatedAt); reads organizations; audit line via logger |
| PUT | `/api/admin/users/:id/role` | admin-session | Change a user's role (superadmin only); blocks self-demotion. | path :id; body: newRole (any USER_ROLE except 'api') | success, message, user (id, email, name, role) | writes users collection (updateOne role/updatedAt) |
| GET | `/api/admin/variables/merge-candidates` | admin-session | Read-only list of variable-merge candidates plus all variables and protected clicker vars. | none | success, candidates, variables, protectedVariables | read-only (computeMergeCandidates + listVariables) |
| POST | `/api/admin/variables/merge` | admin-session | Apply approved variable merges over event stats; dry-run by default, protects core clicker vars. | body: merges[] ({canonical, legacy[], rule:'copy'\|'sum'\|'prefer-canonical'}), dryRun? (defaults true) | success, result (from applyMerges) | writes event stat fields + backups via applyMerges (lib/variableMerge over projects) only when dryRun:false; read-only in dry-run |

## /analytics

| Method | Path | Auth | Summary | Request | Response | Side effects |
|--------|------|------|---------|---------|----------|--------------|
| GET | `/api/analytics/aggregates/partners` | admin-session | Query partner-level aggregated analytics rollups with pagination. | query: partnerId, limit (max 1000), offset, sortBy, sortOrder | data[], metadata (totalPartners, returnedRecords, hasMore, nextOffset, aggregatedAt, queryTimeMs) | read-only (reads partner_analytics) |
| GET | `/api/analytics/aggregates` | admin-session | Query pre-aggregated time-bucketed analytics metrics with filters and pagination. | query: bucket, startDate, endDate, partnerId, partnerIds (csv), hashtag, year, month, limit (max 1000), offset, sortBy, sortOrder | data[], metadata (totalRecords, returnedRecords, hasMore, nextOffset, aggregatedAt, queryTimeMs) | read-only (reads analytics_aggregates) |
| GET | `/api/analytics/ai/coverage` | admin-session | AI analytics coverage summary — how much of the estate has AI analytics and how much is stale. | none | success, data (coverage summary incl. notConnected) | read-only (getAiCoverage) |
| POST | `/api/analytics/ai/events/:eventId/drive-sync` | admin-session | Check-now / pause / resume every Drive folder linked to one event. | path :eventId; body { action: 'sync'\|'pause'\|'resume' } | { success, updated } (count of folders affected) | Writes drive folder link docs via lib/driveFolders (requestDriveFolderSyncForEvent sets a sync-request flag; setDriveFolderPausedForEvent toggles paused). No direct external HTTP. |
| GET | `/api/analytics/ai/events/:eventId/rescan` | admin-session | Return the pending rescan request for this event, if any. | path :eventId; no query/body | { success, data: rescanRequest\|null } | read-only |
| POST | `/api/analytics/ai/events/:eventId/rescan` | admin-session | Queue a re-analysis of one event (per-module or all). | path :eventId; body { moduleId: 'demographics'\|'brands'\|'poster_faces'\|'all' } | { success, data: rescanResult } | Writes a rescan-request doc via lib/aiRescan (requestRescan), which queues real (re-)analysis work on fanmass. |
| GET | `/api/analytics/ai/events/:eventId/summary` | admin-session | Read the stored AI analysis summary (brands, clubs, merch, demographics) for one event. | path :eventId; no query/body | { success, data: summaryDoc } or 404 SUMMARY_NOT_FOUND | read-only |
| GET | `/api/analytics/ai/events` | admin-session | Per-event AI analysis status list (status, progress, sources, freshness). | query: status? (not_connected\|no_images\|analyzing\|complete\|error), limit? (clamped, max 500, default 200) | success, data (event status list) | read-only (getAiEvents) |
| GET | `/api/analytics/ai/variables` | admin-session | List every AI-owned variable with cross-event fill rate and its chart-formula token. | none | { success, data: { variables } } | read-only |
| GET | `/api/analytics/benchmarks` | admin-session | Percentile/average benchmark stats and top performers across analytics aggregates. | query category, metric, period ('all'\|'year'\|'quarter'\|'month') | { success, data: { category, period, sampleSize, benchmarks, topPerformers } } | read-only (reads analytics_aggregates) |
| GET | `/api/analytics/compare/partners` | admin-session | Compare aggregated metrics across 2-5 partners with rankings and deltas. | query partnerIds (csv, 2-5), metrics (csv, optional) | { success, data: { partners, metrics, rankings, deltas }, metadata } | read-only (reads partner_analytics) |
| GET | `/api/analytics/compare/periods` | admin-session | Compare aggregated metrics between two time periods with deltas. | query periodA, periodB (YYYY-MM or YYYY-MM-DD), bucket ('daily'\|'weekly'\|'monthly'\|'yearly'), partnerId (optional) | { success, data: { periodA, periodB, deltas, bucket, partnerId }, metadata } | read-only (reads analytics_aggregates) |
| GET | `/api/analytics/compare` | admin-session | Compare metrics across 2-5 projects with rankings and deltas. | query projectIds (csv, 2-5), metrics (csv, optional) | { success, data: { metrics, events, rankings, deltas } } | read-only (reads analytics_aggregates) |
| GET | `/api/analytics/event/:projectId` | admin-session | Pre-computed analytics aggregate for a single event/project. | path :projectId; query includeBitly (default true), includeRaw (default false) | { success, data: AnalyticsAggregate + dataQuality } | read-only (reads analytics_aggregates) |
| GET | `/api/analytics/executive/insights` | admin-session | Top critical/high insights aggregated across recent events for the exec dashboard. | query priority (csv, default 'critical,high'), limit (default 5, max 20), period ('7d'\|'30d'\|'90d') | { success, data: { insights, summary } } | read-only (reads analytics_aggregates) |
| GET | `/api/analytics/executive/metrics` | admin-session | Executive KPI totals with period-over-period growth. | query period ('30d'\|'90d') | { success, data: { totalFans, totalRevenue, totalROI, avgEngagement, eventCount, growth, previousPeriod } } | read-only (reads analytics_aggregates) |
| GET | `/api/analytics/executive/top-events` | admin-session | Top events ranked by composite performance score. | query period ('30d'\|'90d'\|'all'), limit (default 5, max 20), sortBy ('fans'\|'revenue'\|'engagement'\|'composite') | { success, data: TopEvent[] } | read-only (reads analytics_aggregates) |
| GET | `/api/analytics/insights/:projectId` | admin-session | Auto-generated prioritized insights for one event (anomaly/trend/benchmark). | path :projectId; query includeRecommendations (default true), severity ('critical'\|'warning'\|'info') | { success, data: { projectId, eventName, eventDate, summary, insights, context } } | read-only (reads analytics_aggregates) |
| GET | `/api/analytics/insights/combined` | admin-session | Merge insights from both pipelines (insightsEngine executive insights + analytics-insights per-event insights) into one ranked list. | query: limit (1-50, default 20); rate-limited (RATE_LIMITS.READ) | { success, data: { insights, summary: { total, fromExecutive, fromAnalytics } } } | read-only (reads analytics_aggregates, projects) |
| GET | `/api/analytics/insights/organizations/:orgId` | admin-session | Organization-level insights across the org's member-partner events. | path :orgId (24-hex ObjectId) | InsightsReport (from generateOrganizationInsights) | read-only |
| GET | `/api/analytics/insights/partners/:partnerId` | admin-session | Partner-level insights across all of a partner's events. | path :partnerId (24-hex ObjectId) | InsightsReport (from generatePartnerInsights) | read-only |
| GET | `/api/analytics/insights/summary` | admin-session | Lightweight insight counts by priority and category for dashboards. | query partnerId (optional), period ('7d'\|'30d'\|'90d'), maxEvents (1-100, default 50) | { success, data: { totalInsights, criticalCount, highCount, mediumCount, lowCount, byCategory, eventsAnalyzed } } | read-only (reads analytics_aggregates) |
| GET | `/api/analytics/insights` | admin-session | Global insights across recent events with type/severity filtering. | query type, severity, limit (1-50, default 10), since (ISO date) | { insights, metadata } (counts by type) | read-only (reads projects, generates insights) |
| GET | `/api/analytics/partner/:partnerId` | admin-session | Aggregated metrics across all events for one partner, optionally per-event. | path :partnerId; query timeframe ('all'\|'season'\|'year'\|'month'), includeEvents (default false) | { success, data: { partnerId, partnerName, partnerType, eventCount, summary, events } } | read-only (reads analytics_aggregates, partners) |
| GET | `/api/analytics/sponsorship-hub` | admin-session | Sponsorship hub data for a given scope and date range. | query scopeType ('portfolio'\|'partner'\|'organization'\|'project', default portfolio), scopeId (required unless portfolio), rangePreset ('all'\|'30d'\|'90d'\|'365d') | { success, data } | read-only (via lib/sponsorshipHub) |
| GET | `/api/analytics/trends` | admin-session | Time-series analytics data points plus summary for trend charts. | query startDate (required), endDate (required), partnerId, metrics (csv), groupBy ('day'\|'week'\|'month') | { success, data: { dateRange, groupBy, metrics, dataPoints, summary } } | read-only (reads analytics_aggregates) |

## /api-football

| Method | Path | Auth | Summary | Request | Response | Side effects |
|--------|------|------|---------|---------|----------|--------------|
| GET | `/api/api-football/enrich-partners` | admin-session | Report enrichment status: whether it can run, count remaining, last run. | none | { success, canRun, remaining, lastRun, nextAvailable, hoursRemaining } | read-only (reads partners, api_football_enrichment_log) |
| POST | `/api/api-football/enrich-partners` | admin-session | Trigger API-Football enrichment of the next 5 unenriched partners (24h cooldown). | none (body ignored) | { success, enriched, processed, remaining, nextAvailable } or cooldown error | Writes partners (sets enrichedData.apiFootball, updatedAt) and inserts into api_football_enrichment_log; external HTTP to API-Football (client.searchTeam per sport). |

## /audience-packs

| Method | Path | Auth | Summary | Request | Response | Side effects |
|--------|------|------|---------|---------|----------|--------------|
| GET | `/api/audience-packs/:key` | admin-session | Read one audience pack (sponsor\|executive\|board\|operator) and its report-block allowlist. | path: key | {success, pack{key, name, allowedBlockIds[], createdAt, updatedAt}}; 404 for an unknown key | read-only (reads audience_packs) |
| PUT | `/api/audience-packs/:key` | admin-session | Replace the set of report blocks an audience pack includes. | path: key; body: allowedBlockIds (string[]) | {success, pack}; 400 if allowedBlockIds is not a string array; 404 for an unknown key | writes audience_packs (updateOne upsert) |
| GET | `/api/audience-packs` | admin-session | List the four audience packs. Any pack that does not exist yet is first seeded with an empty allowlist. | none | {success, packs[]} | writes audience_packs on first use (insertOne per missing pack via seedAudiencePacks; never overwrites an existing allowlist); otherwise read-only |

## /auth

| Method | Path | Auth | Summary | Request | Response | Side effects |
|--------|------|------|---------|---------|----------|--------------|
| GET | `/api/auth/check` | public-by-design | Session-status probe: is the caller authenticated, plus name/role. | none | { authenticated: boolean, user: { name, role } \| null } | read-only |
| GET | `/api/auth/sso/callback` | public-by-design | OAuth2/OIDC callback: exchange code, check messmass app permission, auto-provision + mint session, redirect. | query code, state, error; pending-OAuth cookie (state/codeVerifier) | 302 redirect to safe /admin target on success, or /admin/login?error=... on failure; sets session cookie | Mints admin session and auto-provisions/updates the local user record (writes users via mintMessmassSessionForSsoUser); external HTTP to SSO (token exchange, userinfo, getAppPermission) and best-effort camera (pushSsoSessionToCamera). |
| GET | `/api/auth/sso/config` | public-by-design | Public login-page config: whether SSO is enabled and the login path. | none | { ssoEnabled, ssoLoginPath } | read-only |
| GET | `/api/auth/sso/login` | public-by-design | Initiate OAuth2/OIDC (Authorization Code + optional PKCE) login; redirect to SSO. | query redirect_uri (must start /admin), from_logout; cookie post-logout | 302 redirect to SSO authorization URL; sets pending-OAuth cookie (state/codeVerifier) | Sets pending-OAuth cookie and clears post-logout cookie; no DB write; redirects to SSO (no server-side HTTP call). |
| GET | `/api/auth/sso/stakeholder-callback` | public-by-design | Stakeholder OAuth2/OIDC callback (#231). Exchanges the code, matches the verified email to a non-revoked stakeholder_grants row, mints the stakeholder session and redirects to the granted report. It does not call getAppPermission, so no SSO staff permission is needed. | query code, state, error; messmass_stakeholder_pending cookie (state, codeVerifier) | 302 to /partner-report/:id, /organization-report/:id, /hashtag/:id or /filter/:id per the grant's scopeType. On failure, 302 to /stakeholder-access?error=sso_not_configured\|sso_oauth_error\|missing_code\|session_expired\|no_email\|not_invited\|auth_failed; no page exists at that path in app/ @ dd34e229 | writes stakeholder_grants (activateGrant: status 'active', activatedAt, ssoUserId); sets stakeholder-session cookie, clears pending cookie; external HTTP to SSO (token exchange; userinfo when the id_token lacks a usable email) |
| GET | `/api/auth/sso/stakeholder-login` | public-by-design | Start the stakeholder OAuth2/OIDC login (#231). Same SSO client and protocol as admin login, with the stakeholder callback as redirect URI; rate-limited. | none | 302 to the SSO authorization URL; 503 if SSO is not configured; 429 when rate-limited (RATE_LIMITS.AUTH: 5 per 15 min per client) | sets messmass_stakeholder_pending cookie (state, plus PKCE codeVerifier unless confidential OAuth; 15 min); no DB write; no server-side HTTP call |

## /auto-generate-chart-block

| Method | Path | Auth | Summary | Request | Response | Side effects |
|--------|------|------|---------|---------|----------|--------------|
| POST | `/api/auto-generate-chart-block` | page-password | Create or update a chart_configurations doc (+ data_blocks wrapper) for a report image/text slot. Guarded by requireEditorAccess (admin session or any page-access `edit:`/`partner-edit:` grant, including one issued by loading an unprotected event editor by its edit link) because the editors' ReportContentManager calls it (7d3ef3bb). The grant is not checked against the page's current password, so a grant cut off by a new password still passes here until its own 12 h end. | body { type: 'image'\|'text', index, value } | { success, action: 'created'\|'updated', chartId, blockId?, message }; 400 missing/invalid fields; 401 `{ success: false, error, code: 'EDIT_ACCESS_REQUIRED' }` without a session or edit grant | Writes chart_configurations (insert/update) and inserts data_blocks wrapper. |

## /available-fonts

| Method | Path | Auth | Summary | Request | Response | Side effects |
|--------|------|------|---------|---------|----------|--------------|
| DELETE | `/api/available-fonts` | admin-session | Soft-delete (isActive:false) or hard-delete a font by id. | query: id (ObjectId), hardDelete ("true") | { success, message } | writes available_fonts |
| GET | `/api/available-fonts` | admin-session | List available fonts (active only unless includeInactive), merging in any missing DEFAULT_FONTS. | query: includeInactive ("true") | { success, fonts[], isDefault } | read-only |
| POST | `/api/available-fonts` | admin-session | Create a new font after validating name/fontFamily/category and uniqueness. | body: name, fontFamily, category ('google'\|'custom'\|'system'), isActive?, displayOrder?, description?, fontFile? | { success, fontId, font } | writes available_fonts |
| PUT | `/api/available-fonts` | admin-session | Update an existing font by id with partial-field validation. | query: id (ObjectId); body: name?, fontFamily?, category?, isActive?, displayOrder?, description?, fontFile? | { success, font } | writes available_fonts |

## /bitly

| Method | Path | Auth | Summary | Request | Response | Side effects |
|--------|------|------|---------|---------|----------|--------------|
| GET | `/api/bitly/analytics/:linkId` | admin-session | Return a Bitly link's cached analytics, optionally refreshing from Bitly API first, or export as CSV. | path: linkId (ObjectId); query: refresh ("true"), format ("csv") | { success, link, refreshed } or text/csv attachment | writes bitly_links (only when refresh=true); external Bitly API getFullAnalytics |
| DELETE | `/api/bitly/associations` | admin-session | Remove one link-to-project association from the junction table. | query: bitlyLinkId (ObjectId), projectId (ObjectId) | { success, message } | writes bitly_project_links |
| DELETE | `/api/bitly/links/:linkId` | admin-session | Soft-delete (archive) a Bitly link, or hard-delete when ?hard=true. | path: linkId (ObjectId); query: hard ("true") | { success, link?, message } | writes bitly_links |
| PUT | `/api/bitly/links/:linkId` | admin-session | Update a Bitly link's metadata, favorite/archived flags, or legacy projectId. | path: linkId (ObjectId); body: projectId?, title?, tags?[], archived?, favorite? | { success, link, message } | writes bitly_links |
| GET | `/api/bitly/links` | admin-session | List/search Bitly links with pagination, sorting, and per-link project/partner associations. | query: search?, projectId?, includeAnalytics?, includeUnassigned?, favorite?, limit?, offset?, sortField?, sortOrder? | { success, links[], pagination } | read-only |
| POST | `/api/bitly/links` | admin-session | Import/associate a Bitly link with a project (creates junction entry; imports link doc if new). | body: projectId?, bitlinkOrLongUrl (required), title?, tags?[] | { success, link, association, message } | writes bitly_links, bitly_project_links (createLinkAssociation); external Bitly API getLink |
| DELETE | `/api/bitly/partners/associate` | admin-session | Remove a Bitly link from a partner ($pull from partners.bitlyLinkIds). | query: bitlyLinkId (ObjectId), partnerId (ObjectId) | { success, message } | writes partners |
| POST | `/api/bitly/partners/associate` | admin-session | Associate a Bitly link with a partner ($addToSet into partners.bitlyLinkIds). | body: bitlyLinkId (ObjectId), partnerId (ObjectId) | { success, message } | writes partners |
| GET | `/api/bitly/project-metrics/:projectId` | admin-session | Return aggregated cached Bitly metrics (per-link + totals) for one project from the junction table. | path: projectId (ObjectId) | { projectId, links[], totalClicks, totalUniqueClicks } | read-only |
| POST | `/api/bitly/pull` | admin-session | Bulk-fetch links from the Bitly group and import only the new ones (analytics zeroed, synced later). | body: limit? (default 100) | { success, message, summary{total,imported,skipped,errors}, errorDetails? } | writes bitly_links (insertMany); external Bitly API getGroupBitlinks |
| GET | `/api/bitly/recalculate` | admin-session | Health/status of the recalculation system (available modes and endpoint metadata). | none | { status, modes[], endpoint, method } | read-only |
| POST | `/api/bitly/recalculate` | admin-session | Manually recalculate date ranges/cached metrics for a bitlink, a project, or all associations. | body: mode ('bitlink'\|'project'\|'all'), bitlyLinkId? (mode=bitlink), projectId? (mode=project) | { success, mode, associationsUpdated?/bitlinksAffected?, message, timestamp } | writes bitly_project_links (via bitly-recalculator) |
| GET | `/api/bitly/sync` | cron-secret | Cron entry point for the daily sync; simply forwards to the POST handler. | header: authorization: Bearer <CRON_SECRET> (cron) | BitlySyncResponse (same as POST) | writes bitly_links, bitly_sync_logs; external Bitly API getFullAnalytics |
| POST | `/api/bitly/sync` | cron-secret | Sync Bitly analytics for all (or selected) links from Bitly API into MongoDB; writes a sync log. | header: authorization: Bearer <CRON_SECRET> (cron); body: linkIds?[] (selective sync) | BitlySyncResponse { success, runId, startedAt, endedAt, status, summary } | writes bitly_links, bitly_sync_logs; external Bitly API getFullAnalytics |

## /blob-upload-token

| Method | Path | Auth | Summary | Request | Response | Side effects |
|--------|------|------|---------|---------|----------|--------------|
| POST | `/api/blob-upload-token` | admin-session | Mint a short-lived Vercel Blob client-upload token scoped to one image upload (never exposes BLOB_READ_WRITE_TOKEN). | body: HandleUploadBody (Vercel Blob client-upload handshake) | handleUpload() JSON (upload token payload) | read-only (DB); external Vercel Blob handleUpload |

## /chart-config

| Method | Path | Auth | Summary | Request | Response | Side effects |
|--------|------|------|---------|---------|----------|--------------|
| GET | `/api/chart-config/public` | public-by-design | Return active chart configurations for public stats pages (sensitive fields removed). | none | { success, configurations[], meta{total,lastUpdated} } | read-only |
| DELETE | `/api/chart-config` | admin-session | Delete a chart configuration by id. | query: configurationId (ObjectId) | { success, deletedConfiguration } | writes chart_configurations |
| GET | `/api/chart-config` | admin-session | List chart configurations with search, pagination, and sorting. | query: search?, offset?, limit? (max 100), sortField? (title\|type\|order\|createdAt), sortOrder? | { success, configurations[], pagination{mode,limit,offset,nextOffset,totalMatched} } | read-only |
| POST | `/api/chart-config` | admin-session | Create a new chart configuration after validating type/element-count/formatting. | body: chartId, title, type, order, isActive?, elements[], icon?, iconVariant?, subtitle?, showTotal?, totalLabel?, aspectRatio?, heroSettings?, alignmentSettings?, showTitle?, showPercentages?, preset? | { success, configurationId, configuration } | writes chart_configurations |
| PUT | `/api/chart-config` | admin-session | Update an existing chart configuration by id (partial updates, conditional validation). | body: configurationId (ObjectId), plus any config fields (chartId, title, type, order, elements, preset, etc.) | { success, modified, configuration } | writes chart_configurations |

## /chart-configs

| Method | Path | Auth | Summary | Request | Response | Side effects |
|--------|------|------|---------|---------|----------|--------------|
| GET | `/api/chart-configs` | admin-session | List active chart configs (slim shape) for the Visualization Manager chart picker. | none | { success, configs[], count } | read-only |

## /chart-formatting-defaults

| Method | Path | Auth | Summary | Request | Response | Side effects |
|--------|------|------|---------|---------|----------|--------------|
| GET | `/api/chart-formatting-defaults` | admin-session | Fetch the single formatting-defaults document (returns built-in fallback if none exists). | none | { success, defaults, availablePrefixes[], availableSuffixes[] } | read-only |
| PUT | `/api/chart-formatting-defaults` | admin-session | Upsert the formatting-defaults document. | body: defaults (object) | { success } | writes chart_formatting_defaults |

## /charts

| Method | Path | Auth | Summary | Request | Response | Side effects |
|--------|------|------|---------|---------|----------|--------------|
| DELETE | `/api/charts` | admin-session | Delete a chart configuration by chartId. | query: chartId (required) | { success, chartId, deleted } | writes charts collection (delete) |
| GET | `/api/charts` | admin-session | Fetch chart configurations with optional filtering/sorting. | query: chartIds (comma-separated), isActive (true/false), type (kpi\|pie\|bar\|text\|image\|value) | { success, charts: Chart[], count } | read-only (charts collection) |
| POST | `/api/charts` | admin-session | Create or update (upsert) a chart configuration by chartId. | body: chartId, title, type, formula, icon?, isActive?, order?, elements?, formatting?, aspectRatio? | { success, chartId, created, updated } | writes charts collection (upsert) |

## /cities

| Method | Path | Auth | Summary | Request | Response | Side effects |
|--------|------|------|---------|---------|----------|--------------|
| GET | `/api/cities` | admin-session | List active cities (optionally filtered by country) with joined country name/flag. | query: countryId? (ObjectId) | { cities: [{ _id, name, countryId, country: { name, flag } }] } | read-only (cities, countries lookup) |

## /clicker-sets

| Method | Path | Auth | Summary | Request | Response | Side effects |
|--------|------|------|---------|---------|----------|--------------|
| DELETE | `/api/clicker-sets` | admin-session | Delete a clicker set (blocked if it is default or in use by partners), plus its variable groups. | query: clickerSetId (required ObjectId) | { success } or error (400/404) | writes clickerSets collection (delete) + variablesGroups (deleteMany) |
| GET | `/api/clicker-sets` | public-by-design | List all clicker sets with partner usage counts; lazily creates a default set if none exists. Open for the page-password OrganizationEditorDashboard; the lazy-init insert is accepted as bounded init (`KNOWN_UNGUARDED_READS` [editor] in tests/api-mutation-auth.test.ts). | none | { success, sets: [{ _id, name, isDefault, ...timestamps, usage: { partnerCount } }] } | writes clickerSets collection (ensureDefaultSet insertOne on first call); otherwise reads clickerSets + partners |
| POST | `/api/clicker-sets` | admin-session | Create a clicker set, optionally cloning variable groups from an existing set. | body: name (required), cloneFromId? (ObjectId) | { success, set: { ...doc, _id } } | writes clickerSets collection (insert); may insert into variablesGroups (clone) |
| PUT | `/api/clicker-sets` | admin-session | Update a clicker set's name / default flag (setting default unsets others). | body: clickerSetId (required ObjectId), name?, isDefault? | { success, set: { ...doc, _id } } | writes clickerSets collection (updateMany to clear isDefault + updateOne) |

## /client-error

| Method | Path | Auth | Summary | Request | Response | Side effects |
|--------|------|------|---------|---------|----------|--------------|
| POST | `/api/client-error` | public-by-design | Receive a client-side render/runtime error report from app/error.tsx and record it via the server logger. | body: message?, stack?, digest?, pathname? (all sanitized, size-capped to 20KB) | { success: true } or { success: false } | read-only (writes to structured logger only, no DB) |

## /contact

| Method | Path | Auth | Summary | Request | Response | Side effects |
|--------|------|------|---------|---------|----------|--------------|
| POST | `/api/contact` | public-by-design | Submit a contact inquiry (validated, sanitized, size-capped to 50KB). | body: name, email, message (all required) | { success: true } or { success: false, error } | writes contact inquiries via createContactInquiry (contactInquiries collection) |

## /content-assets

| Method | Path | Auth | Summary | Request | Response | Side effects |
|--------|------|------|---------|---------|----------|--------------|
| GET | `/api/content-assets/usage` | admin-session | Report which charts reference a given content asset slug (via [MEDIA:slug]/[TEXT:slug] tokens). | query: slug (required) | { success, slug, usageCount, charts: [{ chartId, title, type, elementIndex }] } | read-only (chart_configurations collection) |
| DELETE | `/api/content-assets` | admin-session | Delete a content asset by id or slug; blocked if referenced by charts unless force=true. | query: id or slug (required), force? (true) | { success, message } or 409 if referenced | writes content_assets collection (delete); reads chart_configurations for reference count |
| GET | `/api/content-assets` | public-by-design | List content assets (images/text blocks) with filter/search/sort. | query: type? (image\|text), category?, tags? (comma-separated), search?, sortBy? (title\|createdAt\|usageCount), sortOrder? (asc\|desc) | { success, assets: ContentAsset[], total } | read-only (content_assets collection) |
| POST | `/api/content-assets` | admin-session | Create a content asset (image or text / variable definition) with slug uniqueness validation. | body: ContentAssetFormData — title, type (required), content{url\|text}, category?, tags?, slug?, isVariable? | { success, asset, message } | writes content_assets collection (insert) |
| PUT | `/api/content-assets` | admin-session | Update a content asset by _id or slug (slug-change uniqueness validated). | body: ContentAssetFormData with _id or slug + updatable fields | { success, asset, message } | writes content_assets collection (update) |

## /countries

| Method | Path | Auth | Summary | Request | Response | Side effects |
|--------|------|------|---------|---------|----------|--------------|
| GET | `/api/countries/:code` | public-by-design | Get a single country by ISO 3166-1 alpha-2 code. | path: code (ISO alpha-2, e.g. US, HU) | { _id, code, name, flag, aliases, region, subregion } or 404 | read-only (countries via countryService) |
| GET | `/api/countries` | public-by-design | List all countries, optionally filtered by region. | query: region? (e.g. Europe, Asia) | { countries: [{ _id, code, name, flag, region, subregion }] } | read-only (countries via countryService) |

## /cron

| Method | Path | Auth | Summary | Request | Response | Side effects |
|--------|------|------|---------|---------|----------|--------------|
| GET | `/api/cron/analytics-aggregation` | cron-secret | With cron secret, runs aggregation (Vercel Cron GET path); otherwise returns recent aggregation job status (admin). | header: Authorization: Bearer <CRON_SECRET> (optional); query: limit? (default 10, max 100) | cron: { success, triggeredBy, ...result }; admin: { jobs, count } | cron path writes analytics aggregates + reads aggregation_jobs; admin path read-only |
| POST | `/api/cron/analytics-aggregation` | cron-secret | Trigger full per-event analytics aggregation; records a job metadata document. | header: Authorization: Bearer <CRON_SECRET>; query: force? (true) | { success, jobId, durationMs, status, projectsFound/Processed/Skipped, aggregatesWritten/Unchanged } | writes aggregation_jobs collection; runEventAggregation writes analytics aggregate collections |
| GET | `/api/cron/bitly-refresh` | cron-secret | Daily refresh of all cached Bitly metrics (preserves date ranges). | header: Authorization: Bearer <CRON_SECRET> | { success, associationsRefreshed, timestamp, duration, error? } | writes Bitly junction table cachedMetrics/lastSyncedAt via refreshAllCachedMetrics; external Bitly API calls |
| POST | `/api/cron/bitly-refresh` | cron-secret | POST alias for cron services that prefer POST; reuses the GET handler. | header: Authorization: Bearer <CRON_SECRET> | same as GET { success, associationsRefreshed, timestamp, duration } | writes Bitly junction table cachedMetrics; external Bitly API calls |
| GET | `/api/cron/google-sheets-sync` | cron-secret | Auto-sync all partners with Google Sheets syncMode='auto', pulling events into projects. | header: Authorization: Bearer <CRON_SECRET> | { success, message, summary: { partnersProcessed, partnersFailed, totalEventsCreated, totalEventsUpdated }, results[] } | writes projects collection (insertMany/updateOne) and partners collection (sync stats/errors); external Google Sheets API via pullEventsFromSheet |

## /csrf-token

| Method | Path | Auth | Summary | Request | Response | Side effects |
|--------|------|------|---------|---------|----------|--------------|
| GET | `/api/csrf-token` | public-by-design | Generate a CSRF token, set it as a cookie, and return it in the body. | none | { csrf token } + sets CSRF cookie | read-only (sets cookie only, no DB) |

## /data-blocks

| Method | Path | Auth | Summary | Request | Response | Side effects |
|--------|------|------|---------|---------|----------|--------------|
| POST | `/api/data-blocks/duplicate` | admin-session | Duplicate a data block, recording lineage in sourceBlockId (the source's own sourceBlockId if it has one, else its _id). | body: sourceBlockId (required ObjectId), name? (defaults to "<source name> (copy)") | { success, blockId, block }; 400 invalid sourceBlockId; 404 source missing | writes data_blocks collection (insertOne copy with sourceBlockId) |
| DELETE | `/api/data-blocks` | admin-session | Delete a data visualization block by id. | query: id (required) | { success, message } or 404 | writes data_blocks collection (delete) |
| GET | `/api/data-blocks` | admin-session | List all data visualization blocks ordered by order. | none | { success, blocks: DataVisualizationBlock[] } | read-only (data_blocks collection) |
| POST | `/api/data-blocks` | admin-session | Create a data visualization block. | body: name (required), charts?, order?, isActive?, showTitle? | { success, blockId, block } | writes data_blocks collection (insert) |
| PUT | `/api/data-blocks` | admin-session | Update a data visualization block by _id. | body: _id (required), name (required), charts?, order?, isActive?, showTitle?, blockAspectRatio?, mobileAspectRatio?, tableHeightMultiplier? | { success, block } or 404 | writes data_blocks collection (update) |

## /debug

| Method | Path | Auth | Summary | Request | Response | Side effects |
|--------|------|------|---------|---------|----------|--------------|
| GET | `/api/debug/categorized-hashtags` | admin-session | Debug endpoint: sample projects with categorized vs traditional hashtags plus totals. | none | { success, data: { projectsWithCategories[], projectsWithTraditional[], counts } } | read-only (projects collection) |
| GET | `/api/debug/notifications` | admin-session | Diagnostic endpoint reporting notification-system status and recent notifications for the authenticated admin. | none | success, timestamp, checks{authentication, database.totalNotifications, userNotifications{unread/read/archived counts}, recentNotifications[], sampleStructure}, troubleshooting.message | read-only (reads notifications collection) |
| GET | `/api/debug/overview-block` | admin-session | Debug endpoint returning the raw OVERVIEW data block document. | none | success, block (OVERVIEW doc with stringified _id), message | read-only (reads data_blocks collection) |

## /derived-variable-config

| Method | Path | Auth | Summary | Request | Response | Side effects |
|--------|------|------|---------|---------|----------|--------------|
| GET | `/api/derived-variable-config` | public-by-design | Return data-driven derived-variable/derived-total definitions used by the event editor. | none | success, config{totals[], fans, fallbackGroups[]} | read-only (reads derived_variable_config collection) |

## /drive-folders

| Method | Path | Auth | Summary | Request | Response | Side effects |
|--------|------|------|---------|---------|----------|--------------|
| DELETE | `/api/drive-folders/:linkId` | admin-session | Hard-delete a Drive folder link from an event. | path: linkId; query: projectId (required) | success | deletes Drive-folder link via removeDriveFolder |
| PATCH | `/api/drive-folders/:linkId` | admin-session | Pause, resume, or request an immediate sync for a Drive folder link. | path: linkId; query: projectId (required); body: action ('pause'\|'resume'\|'sync') | success, link | updates Drive-folder link via setDriveFolderPaused / requestDriveFolderSync |
| GET | `/api/drive-folders` | admin-session | List Google Drive folder links attached to an event/project. | query: projectId (required) | success, links[] | read-only (listDriveFolders reads Drive-folder link storage) |
| POST | `/api/drive-folders` | admin-session | Add a Google Drive folder link (pasted URL, re-validated server-side) to an event. | body: projectId (required), folderUrl (required), label (optional) | success, link (201) | writes Drive-folder link storage via addDriveFolder (messmass stores URL only; fanmass service account is the actual Drive reader) |

## /export

| Method | Path | Auth | Summary | Request | Response | Side effects |
|--------|------|------|---------|---------|----------|--------------|
| GET | `/api/export/pdf` | public-by-design | Server-side A4 PDF export of a report/filter page rendered by real headless Chromium. | query: path (required, allowlisted same-origin report path), filename (optional) | application/pdf binary attachment (Content-Disposition), or JSON error (400/429/502) | read-only DB; launches headless Chromium and navigates same-origin to the report page (?pdfExport=1); external HTTP: downloads @sparticuz/chromium-min Chromium pack from GitHub Releases at runtime, and the report page itself fetches off-origin report images (e.g. i.ibb.co) during render |

## /fan-identities

| Method | Path | Auth | Summary | Request | Response | Side effects |
|--------|------|------|---------|---------|----------|--------------|
| GET | `/api/fan-identities/:id/links` | admin-session | List the behavior links for one fan identity, newest occurredAt first. | path: id | {success, links[]} | read-only (reads fan_identity_links) |
| POST | `/api/fan-identities/:id/links` | admin-session | Attach a behavior link (ticketing\|activation\|engagement\|report-interaction) to a fan identity. | path: id; body: linkType (required), sourceRef{collection, id} (required), occurredAt? (defaults to now), evidence? {type, value} | {success, link}; 400 invalid linkType / sourceRef; 404 identity missing | writes fan_identity_links (insertOne) |
| GET | `/api/fan-identities/:id/loyalty-balance` | admin-session | A fan's accumulated loyalty points and completion count. | path: id | {success, balance{totalPoints, completionCount}}; 404 identity missing | read-only (reads fan_identities, loyalty_completions) |
| DELETE | `/api/fan-identities/:id` | admin-session | Permanently delete a fan identity and all of its links (right-to-deletion; not a status flag). | path: id | {success}; 404 if missing | deletes fan_identity_links (deleteMany by fanIdentityId) + fan_identities (deleteOne) |
| GET | `/api/fan-identities/:id` | admin-session | Read one fan identity with its links. | path: id | {success, identity, links[]}; 404 if missing | read-only (reads fan_identities, fan_identity_links) |
| POST | `/api/fan-identities/merge-candidates/:id/approve` | admin-session | Approve a pending merge candidate: the one action that merges two identities (superadmin only, requireSuperadmin). | path: id | {success}; 404 if not found or already reviewed | writes fan_identity_links (updateMany: second identity's links moved to the first), fan_identities (updateOne: second set status 'merged' + mergedIntoId), fan_identity_merge_candidates (status 'approved', reviewedBy/reviewedAt) |
| POST | `/api/fan-identities/merge-candidates/:id/reject` | admin-session | Reject a pending merge candidate; both identities stay separate. | path: id | {success}; 404 if not found or already reviewed | writes fan_identity_merge_candidates (updateOne status 'rejected', reviewedBy/reviewedAt) |
| GET | `/api/fan-identities/merge-candidates` | admin-session | List merge candidates by review status. | query: status ('pending'\|'approved'\|'rejected', default pending) | {success, candidates[]} | read-only (reads fan_identity_merge_candidates) |
| POST | `/api/fan-identities/merge-candidates` | admin-session | Flag two identities as possibly the same fan for human review; merges nothing. | body: identityIdA, identityIdB, evidence (all required) | {success, candidate}; 400 on missing fields or invalid/identical ids | writes fan_identity_merge_candidates (insertOne, status 'pending') |
| GET | `/api/fan-identities` | admin-session | List fan identities, newest first. | query: limit (default 50, clamped 1-200) | {success, identities[]} | read-only (reads fan_identities) |
| POST | `/api/fan-identities` | admin-session | Create a canonical fan identity; a consent record is mandatory. | body: consent{source, consentedAt, scope[] (non-empty)} | {success, identity}; 400 MISSING_CONSENT | writes fan_identities (insertOne, status 'active') |

## /filter-slug

| Method | Path | Auth | Summary | Request | Response | Side effects |
|--------|------|------|---------|---------|----------|--------------|
| POST | `/api/filter-slug` | admin-session | Generate (and persist) a shareable filter slug for a hashtag combination. | body: hashtags[] (required, non-empty), styleId (optional) | success, slug, hashtags (normalized+sorted), styleId | writes filter-slug storage via generateFilterSlug (persists/reuses a slug doc) |

## /football-data

| Method | Path | Auth | Summary | Request | Response | Side effects |
|--------|------|------|---------|---------|----------|--------------|
| GET | `/api/football-data/fixtures` | admin-session | Query cached Football-Data.org fixtures stored in MongoDB (for the Sports Match Builder / admin browsing). | query: competitionId, partnerId, status, dateFrom, dateTo, limit (max 100), offset | success, fixtures[], pagination{total,limit,offset,nextOffset}, timestamp | read-only (reads football_data_fixtures collection) |
| POST | `/api/football-data/sync` | admin-session | Manually sync Football-Data fixtures for selected competitions, then match fixtures to partners. | body: competitionIds[] (defaults to PL/PD/SA/BL1/FL1/BSA/CL), status, dateFrom, dateTo | success, results[], matching, timestamp | writes football_data_fixtures via importFixtures and partner-matching state via matchFixturesToPartners; external HTTP to the Football-Data.org API |

## /google-sheets

| Method | Path | Auth | Summary | Request | Response | Side effects |
|--------|------|------|---------|---------|----------|--------------|
| GET | `/api/google-sheets/template` | public-by-design | Download a Google Sheets CSV import template for the given context. | query: context (default 'events') | text/csv attachment (messmass-<context>-template.csv) | read-only (no DB; buildGoogleSheetsTemplate builds CSV in memory) |

## /grid-settings

| Method | Path | Auth | Summary | Request | Response | Side effects |
|--------|------|------|---------|---------|----------|--------------|
| GET | `/api/grid-settings` | admin-session | Get grid layout settings (desktop/tablet/mobile unit counts + computed percentages). | none | success, settings (falls back to DEFAULT_GRID_SETTINGS on error) | read-only (reads settings collection) |
| PUT | `/api/grid-settings` | admin-session | Update grid layout settings (unit counts; recomputes percentages). | body: desktopUnits, tabletUnits, mobileUnits | success, settings | writes settings collection (upsert _id 'gridSettings') |

## /hashtag-categories

| Method | Path | Auth | Summary | Request | Response | Side effects |
|--------|------|------|---------|---------|----------|--------------|
| DELETE | `/api/hashtag-categories` | admin-session | Delete a hashtag category (blocked if any project still uses it). | query: id (required) | success / 400 / 404 / 409 | deletes hashtag_categories (deleteOne); reads projects for usage guard |
| GET | `/api/hashtag-categories` | public-by-design | List hashtag categories with pagination and case-insensitive name search. | query: search, offset (default 0), limit (default 20, max 100) | success, categories[], pagination{mode,limit,offset,nextOffset,totalMatched}; ETag/If-None-Match cached | read-only (reads hashtag_categories collection) |
| POST | `/api/hashtag-categories` | admin-session | Create a hashtag category (rejects duplicate names). | body: name, color, order (optional) | success, category (201) / 400 / 409 | writes hashtag_categories (insertOne) |
| PUT | `/api/hashtag-categories` | admin-session | Update an existing hashtag category (rejects name conflicts). | body: id (required), name, color, order (optional) | success, category / 400 / 404 / 409 | writes hashtag_categories (updateOne) |

## /hashtag-colors

| Method | Path | Auth | Summary | Request | Response | Side effects |
|--------|------|------|---------|---------|----------|--------------|
| DELETE | `/api/hashtag-colors` | admin-session | Delete a hashtag color by id (requireAdmin since 7d3ef3bb). | query: id (required) | success, message / 400 / 404 | deletes hashtag_colors (deleteOne) |
| GET | `/api/hashtag-colors` | public-by-design | Fetch all hashtag color definitions. | none | success, hashtagColors[]{_id,uuid,name,color,createdAt,updatedAt} | read-only (reads hashtag_colors collection) |
| POST | `/api/hashtag-colors` | admin-session | Create a new hashtag color (rejects duplicate name; requireAdmin since 7d3ef3bb). | body: name (required), color (required) | success, hashtagColor / 400 / 409 | writes hashtag_colors (insertOne) |
| PUT | `/api/hashtag-colors` | admin-session | Update a hashtag color by _id or by name (requireAdmin since 7d3ef3bb). | body: _id (optional), name, color | success, hashtagColor / 400 / 404 / 409 | writes hashtag_colors (updateOne) |

## /hashtags

| Method | Path | Auth | Summary | Request | Response | Side effects |
|--------|------|------|---------|---------|----------|--------------|
| GET | `/api/hashtags/:hashtag` | public-by-design | Aggregate stats + report config for a single hashtag (or UUID slug), with report-variant/period resolution. | path: hashtag (tag name or UUID slug); query: variant (optional variant slug) | success, project (aggregated stats + dateRange), projects[] (list), report, styleId, reportVariant{...,period}, debug / 404 | read-only (reads projects and hashtag_slugs; resolveReportVariant reads report config) |
| GET | `/api/hashtags/filter-by-slug/:slug` | page-password | Returns aggregated public report data for a filter slug (matching projects, summed stats, resolved report variant). | path param slug (filter UUID slug or a direct hashtag name); query param variant (optional report variant slug) | success, project (aggregated eventName/dateRange/stats/projectCount), projects[] (public project cards: _id, eventName, eventDate, hashtags, viewSlug), hashtags[], styleId, report, reportVariant | read-only (reads projects, filter_slugs via findHashtagsByFilterSlug, report variant config) |
| GET | `/api/hashtags/filter` | admin-session | Aggregate stats across projects matching ALL supplied hashtags (AND logic), supporting category-prefixed tags. | query: tags (comma-separated, required) | success, project (aggregated), projects[], filter{hashtags,logic:'AND',matchCount}, debug / 404 | read-only (loads all projects and filters in-memory) |
| POST | `/api/hashtags/filter` | admin-session | Same aggregation as GET but takes hashtags in the body; normalizes them and delegates to the GET handler. | body: hashtags[] (required) | same shape as GET / 400 | read-only (delegates to GET) |
| GET | `/api/hashtags/slugs` | admin-session | Lists every unique hashtag (incl. category-prefixed) with its usage count and a stable UUID slug, creating slugs on demand. | none | success, hashtags[] ({ hashtag, slug, count } sorted by count desc); or empty hashtags[] with debug info | writes hashtag_slugs (insertOne for any hashtag lacking a slug); reads projects |
| DELETE | `/api/hashtags` | admin-session | Verify a hashtag is unused (default) or, with mode=cascade, remove it everywhere (requireAdmin since 7d3ef3bb). | query: hashtag (required), mode ('cascade' to remove everywhere) | success, message, result{projects, partners, deleted counts} | non-cascade: read-only (counts projects+partners usage). cascade: writes projects, partners (updateMany $pull + categorizedHashtags rewrite) and deletes from hashtag_colors, hashtags, hashtag_slugs (deleteMany) |
| GET | `/api/hashtags` | public-by-design | List distinct hashtags across all projects (traditional + categorized) with usage counts, paginated. | query: search, limit (default 20, max 100), offset | success, hashtags[{hashtag,count}], pagination{mode:'aggregation',limit,offset,nextOffset,totalMatched}; ETag cached | read-only (aggregation over projects collection) |
| POST | `/api/hashtags` | page-password | Validate and normalize a single hashtag string (strip #, lowercase, enforce [a-z0-9_]). Guarded by requireEditorAccess (admin session or any page-access `edit:`/`partner-edit:` grant, including one issued by loading an unprotected event editor by its edit link) because UnifiedHashtagInput calls it from inside an editor (7d3ef3bb). | body: hashtag (string) | success, hashtag (cleaned) / 400; 401 `{ success: false, error, code: 'EDIT_ACCESS_REQUIRED' }` without a session or edit grant | read-only (no DB access) |

## /integrations

| Method | Path | Auth | Summary | Request | Response | Side effects |
|--------|------|------|---------|---------|----------|--------------|
| POST | `/api/integrations/camera/link-partners` | machine-token | Ops: links messmass partners to already-existing camera partners by name (no creation). | none | success + data { linked, scanned } | writes partners (sets cameraPartnerId); external camera HTTP (cameraClient.findPartners, cameraClient.upsertPartner) |
| POST | `/api/integrations/camera/partners` | machine-token | Inbound: upserts a messmass partner from a partner created directly in camera (reverse-direction partner sync). | body { cameraPartnerId (required), name (required), logoUrl? } | success, partner; or 400 invalid_json / missing fields, 500 sync_failed | writes partners (upsertPartnerFromCamera: updateOne or insertOne, ensures cameraPartnerId index) |
| POST | `/api/integrations/camera/provision-missing` | machine-token | Ops backfill: provisions camera events for messmass projects that have a partner but no camera link yet. | query param limit (default 100, capped at 500) | success + data { provisioned, scanned } | writes projects (externalRefs.camera) and partners (ensureCameraPartner sets cameraPartnerId); external camera HTTP (cameraClient.provisionEvent / upsertPartner / findPartners) |
| POST | `/api/integrations/camera/sso-session` | machine-token | Mints a real messmass admin-session cookie for a user who authenticated in camera via SSO (cross-app session), independently validating the forwarded SSO token. | body { accessToken (required), refreshToken? }; also reads x-forwarded-for for rate limiting | success, role (+ Set-Cookie admin-session); errors: 400 invalid_json/missing token, 401 invalid_token, 403 no_access, 429 rate limit, 502 permission_check_failed | writes users (mintSession inserts or updates the local user cache: ssoUserId/role); sets admin-session / auth-source / sso-tokens cookies; external SSO HTTP (getUserInfo, getAppPermission) |
| POST | `/api/integrations/fanmass/callbacks` | machine-token | Fanmass callback: upserts the event<->batch link and, on ready/partial, forcibly pulls analytics from fanmass into the event. | body { messmassEventId, batchId, status? (ready\|partial\|failed), contractVersion?, correlationId? }; x-correlation-id header | success + data { accepted, link, sync } | writes fanmass_event_links (upsertFanmassLink) and, when syncing, projects (stats.fanmass); external fanmass HTTP (analytics-summary fetch via syncFanmassAnalytics) |
| DELETE | `/api/integrations/fanmass/commands/:commandId` | machine-token | Acknowledges a command once fanmass has applied it (marks applied, not physical delete). | path param commandId; optional JSON body { ackResult?: object } | success + data (ackCommand result); 400 for invalid JSON / non-object ackResult | writes fanmass_commands (updateOne status->applied, stores ackResult) |
| GET | `/api/integrations/fanmass/commands` | machine-token | Returns every pending operator command for fanmass to poll. | none | success + data { commands[] } | read-only (reads fanmass_commands) |
| POST | `/api/integrations/fanmass/dashboard-snapshot` | machine-token | Receives a fanmass-pushed dashboard snapshot (Executive/Analytics/Run Control/Entity Curation) for the /admin/fanmass tabs. | arbitrary JSON snapshot body (object required) | success + data (storeDashboardSnapshot result), 201; 400 INVALID_SNAPSHOT | writes fanmass_dashboard_snapshot (upsert by eventId+batchId) |
| GET | `/api/integrations/fanmass/drive-folders/pending-sync` | machine-token | Cheap poll target: just the folder ids that currently have a live 'check now' sync request. | none | success + data { folderIds[] } | read-only (reads drive_folder_links) |
| GET | `/api/integrations/fanmass/drive-folders` | machine-token | Bulk discovery: every event with >=1 active linked Drive folder plus event/partner metadata for fanmass auto-provisioning. | none | success + data { events[] } (each with folders, eventName, partnerIds, partnerNames) | read-only (reads drive_folder_links, projects, partners) |
| POST | `/api/integrations/fanmass/events/:eventId/analysis-summary` | machine-token | Receives the full structured per-event AI analysis summary (brand/club mentions, demographics) from fanmass. | path param eventId; JSON summary body (object required) | success + data (storeAnalysisSummary result); 400 INVALID_SUMMARY | writes ai_analysis_summaries (updateOne upsert); reads projects |
| GET | `/api/integrations/fanmass/events/:eventId/context` | machine-token | Returns the fanmass event context (event, partners, organization, drive folders) for a given event id. | path param eventId; x-correlation-id header | success + data (loadEventContext payload: event/partner/org/folder context); 422 INVALID_EVENT_ID | read-only (reads projects, partners, organizations, drive_folder_links) |
| POST | `/api/integrations/fanmass/events/:eventId/drive-folders/status` | machine-token | Status write-back for a single linked Drive folder (analysis progress from fanmass). | path param eventId; body { folderId (required), status (pending\|analyzing\|complete\|empty\|error\|verified), lastError?, imagesDiscovered?, imagesAnalyzed? } | success + data { link }; 400 FOLDER_ID_REQUIRED / INVALID_STATUS / INVALID_PROGRESS | writes drive_folder_links (setDriveFolderStatus findOneAndUpdate) |
| GET | `/api/integrations/fanmass/events/:eventId/link` | machine-token | Returns the fanmass event<->batch link record for an event. | path param eventId | success + data { link } | read-only (reads fanmass_event_links) |
| POST | `/api/integrations/fanmass/events/:eventId/link` | machine-token | Upserts the fanmass event<->batch link (batch id, status, context version/hash). | path param eventId; body { fanmassBatchId (or batchId), status?, contextVersion?, contextHash? }; x-correlation-id header | success + data { link }, 201 | writes fanmass_event_links (updateOne upsert); verifies event exists in projects |
| POST | `/api/integrations/fanmass/events/:eventId/stats` | machine-token | Partial-merge push of fanmass analytics values into the event's mapped stats variables (derived vars skipped). | path param eventId; body { stats: {<variableName>: value} } or a bare {<variableName>: value} map | success + data (pushEventStats result) | writes projects (updateOne stats.* merge); reads variables_metadata (to skip derived vars) |
| GET | `/api/integrations/fanmass/events/:eventId/sync` | machine-token | Returns the event's fanmass link and its last sync snapshot. | path param eventId | success + data { link, lastSyncSnapshot } | read-only (reads fanmass_event_links) |
| POST | `/api/integrations/fanmass/events/:eventId/sync` | machine-token | Pulls the analytics summary from fanmass and writes it into the event (supports dryRun/force). | path param eventId; query params dryRun=true\|false, force=true\|false; x-correlation-id header | success + data (sync result); 200 when status ready, 202 otherwise | writes projects (stats.fanmass) and fanmass_event_links (sync snapshot/failure) unless dryRun; external fanmass HTTP (analytics-summary fetch) |
| POST | `/api/integrations/fanmass/events` | machine-token | Creates a messmass event (project), optionally linked to a partner, from fanmass. | body { eventName (required), eventDate?, partner1Id? (or partnerId), stats? } | success + data { event }, 201 | writes projects (insertOne, source:'fanmass', generates view/edit slugs) |
| GET | `/api/integrations/fanmass/partners/:partnerId/events` | machine-token | Lists a messmass partner's events (projects). | path param partnerId | success + data { partnerId, events[] } | read-only (reads projects) |
| GET | `/api/integrations/fanmass/partners` | machine-token | Lists messmass partners (search/paginated) for fanmass mapping. | query params search?, limit?, offset? | success + data (listPartners result: partners[], total) | read-only (reads partners) |
| POST | `/api/integrations/fanmass/partners` | machine-token | Creates a messmass partner from fanmass. | body { name (required), emoji?, logoUrl?, hashtags? } | success + data { partner }, 201 | writes partners (insertOne) |
| DELETE | `/api/integrations/fanmass/rescan-requests/:eventId` | machine-token | Acknowledges/clears a rescan request once fanmass has queued the analysis run. | path param eventId | success + data { cleared: true } | writes ai_rescan_requests (deleteOne) |
| GET | `/api/integrations/fanmass/rescan-requests` | machine-token | Returns every pending operator-requested AI rescan for fanmass to poll. | none | success + data { requests[] } | read-only (reads ai_rescan_requests) |
| GET | `/api/integrations/fanmass/variables` | machine-token | Lists messmass variable definitions (mapping targets) for fanmass. | none | success + data { variables[], count } | read-only (reads variables_metadata) |
| POST | `/api/integrations/fanmass/variables` | machine-token | Upserts a variable definition (variables_metadata); name is the stats key. | body { name (required), label?, type?, category?, unit?, description? } | success + data { variable, created }; 201 when created, 200 when updated | writes variables_metadata (updateOne or insertOne) |

## /landing-static

| Method | Path | Auth | Summary | Request | Response | Side effects |
|--------|------|------|---------|---------|----------|--------------|
| GET | `/api/landing-static` | public-by-design | Return the pre-generated static snapshot + landing report slug for the public main page. | none | success, staticSnapshot, generatedAt, landingReportSlug | read-only (getLandingSettings) |

## /loyalty-missions

| Method | Path | Auth | Summary | Request | Response | Side effects |
|--------|------|------|---------|---------|----------|--------------|
| GET | `/api/loyalty-missions/:id/completions` | admin-session | List a mission's completions, newest first. | path: id | {success, completions[]} | read-only (reads loyalty_completions) |
| POST | `/api/loyalty-missions/:id/completions` | admin-session | Record a fan completing a mission and award its points. A fan can complete a non-repeatable mission only once. | path: id; body: fanIdentityId (required), occurredAt? (defaults to now) | {success, completion}; 404 MISSION_NOT_FOUND / IDENTITY_NOT_FOUND; 409 ALREADY_COMPLETED | writes loyalty_completions (insertOne, pointsAwarded) + fan_identity_links (insertOne, linkType 'engagement') |
| GET | `/api/loyalty-missions/:id` | admin-session | Read one mission with its participation summary. | path: id | {success, mission, participation{completionCount, uniqueFanCount, totalPointsAwarded}}; 404 if missing | read-only (reads loyalty_missions, loyalty_completions) |
| GET | `/api/loyalty-missions` | admin-session | List loyalty missions, newest first. | none | {success, missions[]} | read-only (reads loyalty_missions) |
| POST | `/api/loyalty-missions` | admin-session | Create a loyalty mission (status 'draft'). | body: name (required), type ('scan-in'\|'attendance'\|'sponsor-mission'\|'digital-participation'), pointsPerCompletion (number >= 0), repeatable?, description?, partnerId? | {success, mission}; 400 on validation | writes loyalty_missions (insertOne) |

## /notifications

| Method | Path | Auth | Summary | Request | Response | Side effects |
|--------|------|------|---------|---------|----------|--------------|
| PUT | `/api/notifications/mark-read` | admin-session | Mark one/many/all notifications as read or archived for the current user. | body: notificationIds[] , markAll, action('read'\|'archive') | success, action, modifiedCount, userId | writes notifications collection ($addToSet readBy/archivedBy) |
| GET | `/api/notifications` | admin-session | Fetch shared activity notifications with per-user read/archive status and an unread count. | query: limit, offset, unreadOnly, archivedOnly, excludeArchived | success, notifications[], pagination{offset,limit,totalCount,nextOffset}, unreadCount, currentUserId | read-only (notifications collection) |

## /organizations

| Method | Path | Auth | Summary | Request | Response | Side effects |
|--------|------|------|---------|---------|----------|--------------|
| GET | `/api/organizations/edit/:id` | page-password | Fetch an organization (base or report-variant overrides) for the organization-edit surface. | path: id; query: variant | success, organization{_id,name,slug,status,metadata,reportVariant?} | read-only (organizations collection / V3 Organization) |
| PUT | `/api/organizations/edit/:id` | page-password | Save organization metadata, or persist stats/overrides onto a named report variant. | path: id; query: variant; body: metadata | success, organization (with reportVariant when variant) | writes organizations collection (or V3 Organization via mongoose) + report variants (updateReportVariant) |
| GET | `/api/organizations/report/:id/activities` | public-by-design | List the period-filtered events/activities backing an organization report. | path: id; query: variant | success, activities[]{_id,name,type,startDate,metadata.viewSlug,createdAt,updatedAt} | read-only (organizations, partners, projects / V3 Activity models) |
| GET | `/api/organizations/report/:id` | public-by-design | Resolve and return the organization report: merged metadata, assigned partners, period-filtered events, and aggregated stats. | path: id; query: variant | success, organization, entities[], report, resolvedFrom, source, reportVariant, aggregatedStats, totalEntities, totalEvents | read-only (organizations, partners, projects / V3 models) |

## /page-passwords

| Method | Path | Auth | Summary | Request | Response | Side effects |
|--------|------|------|---------|---------|----------|--------------|
| DELETE | `/api/page-passwords` | admin-session | Remove password protection from a page, making it public. | query: pageId, pageType | success, removed | writes page_passwords collection (removePagePassword delete) |
| GET | `/api/page-passwords` | admin-session | Read-only share-link status for a page: public URL and whether it is password-protected (never creates). | query: pageId, pageType | success + status (public URL, isProtected, etc.) | read-only (page_passwords) |
| POST | `/api/page-passwords` | admin-session | Generate or retrieve a page password and build a shareable link (fix for prior unauthenticated key leak). | body: pageId, pageType, regenerate | success, shareableLink{...,password}, pagePassword{pageId,pageType,password,createdAt,usageCount} | writes page_passwords collection (getOrCreatePagePassword/generateShareableLink) |
| PUT | `/api/page-passwords` | public-by-design | Validate a page password (or admin session) and mint the signed HttpOnly page-access grant cookie for the pageId as sent. For pageType `edit` the password is checked against the event's newest `edit` password across its addresses (the pageId sent, the editSlug and the _id), because edit shares were keyed `editSlug \|\| _id` and the editor opens at either; an older password left on the other address no longer opens it. | body: pageId, pageType, password | success, isValid, isAdmin, message; sets PAGE_ACCESS_COOKIE | read-only re DB; sets page-access cookie |

## /paid-campaigns

| Method | Path | Auth | Summary | Request | Response | Side effects |
|--------|------|------|---------|---------|----------|--------------|
| GET | `/api/paid-campaigns/:id/measurement` | admin-session | One campaign's manually entered spend shown side by side with the project's organic evidence. No clicks or fans are attributed to the campaign. | path: id | {success, campaign, organicEvidence{totalFans, totalMerched, bitlyClicks, estimatedOrganicValue}, costPerBitlyClick (null when there are no clicks)}; 404 if missing | read-only (reads paid_campaigns, projects, bitly_project_links) |
| DELETE | `/api/paid-campaigns/:id` | admin-session | Delete one paid campaign. | path: id | {success}; 404 if missing | deletes from paid_campaigns (deleteOne) |
| GET | `/api/paid-campaigns` | admin-session | List the paid campaigns recorded for one project, newest first. | query: projectId (required ObjectId) | {success, campaigns[]}; 400 if projectId is invalid | read-only (reads paid_campaigns) |
| POST | `/api/paid-campaigns` | admin-session | Record a manually entered paid campaign against a project (no ad-platform integration exists). | body: name, platform ('facebook'\|'google'\|'other'), projectId (ObjectId), spend (number >= 0), currency (all required), notes? | {success, campaign}; 400 on validation | writes paid_campaigns (insertOne) |

## /partners

| Method | Path | Auth | Summary | Request | Response | Side effects |
|--------|------|------|---------|---------|----------|--------------|
| GET | `/api/partners/:id/bitly-kyc` | admin-session | Aggregate Bitly click metrics (totals, by-country, by-referrer) across all of a partner's events. | path: id | success, partnerId, eventCount, aggregated{bitly* metrics} | read-only (projects collection) |
| GET | `/api/partners/:id/events` | admin-session | List all events (projects) for a partner with full stats for KYC aggregation. | path: id | success, events[] (full stats), partner{_id,name,emoji,logoUrl}, timestamp | read-only (partners, projects) |
| POST | `/api/partners/:id/google-sheet/connect` | admin-session | Connect an existing Google Sheet to a partner after verifying accessibility. | path: id; body: sheetId, sheetName?, syncMode? | success, message, config, stats | writes partners collection (connectPartnerToSheet) + external Google Sheets API (testConnection) |
| DELETE | `/api/partners/:id/google-sheet/disconnect` | admin-session | Disconnect the Google Sheet from a partner and remove its sync config/stats. | path: id | success, message, disconnectedAt | writes partners collection ($unset googleSheetConfig/googleSheetStats) |
| POST | `/api/partners/:id/google-sheet/provision` | admin-session | Create + setup + connect a brand-new Google Sheet for a partner in one step. | path: id; body: syncMode? | success, sheetId, sheetUrl, eventsWritten, message | writes partners collection + external Google Sheets/Drive API (provisionPartnerSheet) |
| POST | `/api/partners/:id/google-sheet/pull` | admin-session | Pull events from a partner's Google Sheet, creating/updating projects (supports dryRun and single-event). | path: id; body: dryRun?, eventId? | success, message, summary, preview | writes projects + partners collections (skipped on dryRun) + external Google Sheets API (pullEventsFromSheet) |
| POST | `/api/partners/:id/google-sheet/push` | admin-session | Push messmass events to a partner's Google Sheet (supports dryRun and single-event). | path: id; body: dryRun?, eventId? | success, message, summary, preview | writes projects + partners collections (skipped on dryRun) + external Google Sheets API (pushEventsToSheet) |
| POST | `/api/partners/:id/google-sheet/rename` | admin-session | Prefix a partner's connected spreadsheet title with the partner UUID for traceability. | path: id; body: prefixUuid? | success, name (or message when already prefixed) | writes partners collection (googleSheetConfig.lastRenamedAt) + external Google Drive API (drive.files.get/update) |
| POST | `/api/partners/:id/google-sheet/setup` | admin-session | Auto-configure a blank Google Sheet for event sync (rename tab, add columns, write headers/events). | path: id; body: sheetId | success, eventsWritten, sheetUrl, message | writes partners collection + external Google Sheets API (setupPartnerSheet) |
| GET | `/api/partners/:id/google-sheet/status` | admin-session | Report a partner's Google Sheets connection/sync status, with optional live health check. | path: id; query: checkHealth | success, connected, config, stats, healthCheck?, info | read-only (partners) + external Google Sheets API when checkHealth=true (testConnection/countSheetDataRows) |
| GET | `/api/partners/:id/lifecycle` | admin-session | Computed partnership lifecycle stage (proposal\|activation\|renewal\|postmortem) from the partner's events, or the admin override. | path: id | success, lifecycle{stage, isOverridden, projectCount, mostRecentEventDate, monthsSinceLastEvent, reportingAvailable}; 404 if partner missing | read-only (reads partners, projects) |
| PUT | `/api/partners/:id/lifecycle` | admin-session | Set or clear the admin lifecycle override (only proposal and postmortem can be overridden). | path: id; body: override ('proposal'\|'postmortem'\|null) | success, lifecycle; 400 invalid override; 404 if partner missing | writes partners collection ($set / $unset lifecycleStageOverride) |
| GET | `/api/partners/edit/:slug` | page-password | Fetch partner content (base or report-variant overrides) for the partner-edit surface, resolved by any identifier (viewSlug, _id, legacy slug). Read gate across every alias and, with `?variant`, every variant key: open when none has a `partner-edit` password; otherwise a current grant for one of them or an admin session (messmass#386). Reports whether this caller's saves will be accepted (`canSave`), by the same rule as the save routes: an admin session, or a current `partner-edit` grant for the partner's _id or viewSlug (for a custom variant, also that variant's own key). An unprotected partner editor issues no grant, because its slug is the public report slug, so without a session it loads with `canSave: false` and the editor is read-only. With a custom `?variant=`, each content field is the variant's own value where it has one and the partner's otherwise (`showOnlyTeam1Events` included, the value the variant report reads), and `stats` is the variant's `statsOverrides`. | path: slug; query: variant | 200 { success, partner{...content fields, stats, reportVariant?}, canSave }; 400 invalid identifier; 401 `{ code: 'PAGE_PASSWORD_REQUIRED' }` on a protected page without a current grant or session; 404 partner not found | read-only (partners, page_passwords, report variants). Sets the `page-access` cookie only to renew the current grants the caller already holds for this page (fresh 12 h); never issues a new one, never on the admin path. |
| PUT | `/api/partners/edit/:slug` | page-password | Update a partner's custom report variant overrides (rejects base/default variant; the default report saves through `PUT /api/partners`). Same read gate as GET, then a write check: an admin session, or a current `partner-edit` grant for the partner's _id or viewSlug or for this variant's key. Passing the read gate on an unprotected partner is not write access (F-009). Report content field-level (`statsChanges` / `statsRemoved`: only the named `statsOverrides.<key>` paths are written, so a slot saved meanwhile is kept) or whole (`stats`), never both. Late-write guard as on `PUT /api/partners` (`tabId` + `clientSeq` next to `metadata`). `maxDuration` 20 s. Editor-save rate budget (120/min per IP + path). | path: slug; query: variant (required, non-default); body: metadata { stats or statsChanges/statsRemoved, emoji, logoUrl (`''` or null removes the variant's own logo, so the partner's shows again; absent leaves it), styleId, reportTemplateId, showEmoji, showEventsList*, showOnlyTeam1Events }; tabId + clientSeq | 200 { success, partner (with reportVariant) }, or { success, stale: true } when a newer save from the same tab is stored; 400 invalid identifier / missing metadata (both checked before the gate) / not a custom variant (checked after it); 401 `{ code: 'PAGE_PASSWORD_REQUIRED' }` (protected page, no current grant or session) or 401 `{ code: 'EDIT_ACCESS_REQUIRED' }` (gate passed, no write access; same body for every cause); 404 partner or variant not found | writes report variants (updateReportVariant) |
| POST | `/api/partners/link-football-data` | admin-session | Link a partner to a Football-Data.org team, enriching hashtags, crest logo, and footballData metadata. | body: partnerId, footballDataTeamId | success, partner (updated) | writes partners collection + external Football-Data.org API (fetchTeam/fetchCompetitions) + ImgBB upload (uploadImageFromUrl) |
| GET | `/api/partners/report/:slug` | public-by-design | Fetch a partner profile with server-aggregated event stats for the public partner report page. | path :slug (partner ObjectId or legacy viewSlug); query ?variant (report variant slug) | success, partner{name,emoji,logoUrl,styleId,reportTemplateId,showEventsList...,stats}, aggregatedStats, reportVariant, report, events[], totalEvents | read-only (reads partners, projects; resolves variant/template) |
| POST | `/api/partners/upload-logo` | admin-session | Upload a partner badge/logo from a source URL to image storage (Vercel Blob / ImgBB) and return the hosted URL. | body { badgeUrl: string, partnerName: string } | success, logoUrl (or error) | no DB write; external HTTP: fetches source badgeUrl and uploads to image CDN (uploadPartnerBadge / Vercel Blob-ImgBB) |
| DELETE | `/api/partners` | admin-session | Delete a partner by id. | query: partnerId | success, message | writes partners collection (deleteOne) |
| GET | `/api/partners` | admin-session | List partners with pagination/search, resolving bitlyLinkIds to displayable link objects. | query: limit, offset, sortField, sortOrder, search | success, partners[], pagination{total,offset,limit,hasMore} | read-only (partners, bitly_links) |
| POST | `/api/partners` | admin-session | Create a new partner (generates a unique viewSlug) and sync to V3. | body: name, emoji, hashtags, categorizedHashtags, bitlyLinkIds, styleId, reportTemplateId, sportsDb, logoUrl, googleSheetsUrl, clickerSetId | success, partner{_id,...partnerData} | writes partners collection + V3 sync (syncPartnerToV3Entity) |
| PUT | `/api/partners` | page-password | Partial update of a partner's fields. requirePartnerWriteAccess: an admin or superadmin session may change every field; a current `partner-edit` grant for this partner's _id or viewSlug (from its password, never from an unprotected editor link), or a signed-in account with another role, may change only `PARTNER_EDITOR_WRITABLE_FIELDS` (stats, statsChanges, statsRemoved, emoji, showEmoji, logoUrl, styleId, reportTemplateId, showEventsList*, showOnlyTeam1Events); other fields in its body are ignored, not rejected. Report content either whole (`stats`) or field-level (`statsChanges` / `statsRemoved`, the partner editor: only the named `stats.<key>` paths are written), never both. Late-write guard as on `PUT /api/projects`: with `tabId` + `clientSeq` the write is conditional on no save from that tab with the same or a higher number having been stored, and a late or repeated save answers 200 `{ success: true, stale: true }`. `maxDuration` 20 s. Editor-save rate budget (120/min per IP + path). | body: partnerId (24-hex string) + name,emoji,showEmoji,logoUrl,hashtags,categorizedHashtags,stats or statsChanges/statsRemoved,styleId,reportTemplateId,googleSheetsUrl,clickerSetId,sportsDb,bitlyLinkIds,showEventsList*,showOnlyTeam1Events; tabId + clientSeq | 200 { success, message } or { success, stale: true }; 400 missing or malformed partnerId / stat key / tabId or clientSeq / both stats and statsChanges; 401 `{ success: false, error, code: 'EDIT_ACCESS_REQUIRED' }` without a session or current grant (also for an unknown id, so ids are not disclosed); 404 partner not found (admin session only) | writes partners collection + V3 sync (syncPartnerToV3Entity) |

## /projects

| Method | Path | Auth | Summary | Request | Response | Side effects |
|--------|------|------|---------|---------|----------|--------------|
| DELETE | `/api/projects/:id` | admin-session | Delete a project by id. | path :id | success, message | deletes from projects |
| GET | `/api/projects/:id` | admin-session | Fetch a single raw project document by ObjectId. | path :id | success, project (full document) | read-only |
| PUT | `/api/projects/:id` | admin-session | Merge-update a project (stats merged with existing, derived metrics recomputed) by id. | path :id; body arbitrary project fields incl. stats | success, project (updated) | writes projects; writes notifications (edit-stats) |
| GET | `/api/projects/edit/:slug` | page-password | Fetch an editable project for the event editor, by its edit slug (UUID v4) or, for signed-in users and current grant holders, its _id. The `edit` password is checked across the URL slug, the editSlug and the _id: open when none has one; otherwise a current grant for one of them or an admin session. The _id is public, so opened by _id without a session or current grant it answers 403 `EDIT_LINK_REQUIRED` (or 401 `PAGE_PASSWORD_REQUIRED` when the _id itself has a password). Reports `canSave` by the `PUT /api/projects` rule: an admin session, or a current grant for `edit:<editSlug>` (including one issued in this response). | path :slug (editSlug, or _id) | 200 { success, project (editable: stats, hashtags, slugs, partner refs, googleSheetUuid), canSave }; 400 missing slug; 401 `{ code: 'PAGE_PASSWORD_REQUIRED' }`; 403 `{ code: 'EDIT_LINK_REQUIRED' }`; 404 not found | read-only (projects, partners, page_passwords). Sets the signed HttpOnly `page-access` cookie: issues an `edit:<editSlug>` grant when no address of the editor has a password and it was opened by its UUID edit link (so an unprotected editor can save), and renews (fresh 12 h) the current grants the caller already holds for it. A current grant for the event's _id (the editor is protected and the grant is newer than its password) also earns `edit:<editSlug>`, the grant saves need. Never issues on the admin path, and never for an _id without such a grant. |
| GET | `/api/projects/stats/:slug` | page-password | Fetch a read-only project by its view slug for the event report page. | path :slug (viewSlug) | success, project (read-only: stats, hashtags, allHashtagRepresentations, partners, styleIdEnhanced, reportTemplateId) | read-only |
| DELETE | `/api/projects` | admin-session | Delete a project by id, decrement its hashtag counts and redistribute Bitly link date ranges. | query projectId | success | deletes from projects; updates hashtags; Bitly redistribution (handleProjectDeletion) |
| GET | `/api/projects` | admin-session | List projects (cursor default, or offset when searching/sorting) with partner enrichment, or return a single project when projectId is supplied. | query projectId, limit, cursor, q (search), offset, sortField (eventName\|eventDate\|images\|fans\|attendees), sortOrder (asc\|desc) | success, projects[] (with partner1/partner2, dataQuality), pagination{mode,limit,cursor/offset,...} | read-only |
| POST | `/api/projects` | admin-session | Create a new project/event with hashtags, style, partner refs and report template; auto-associates Partner 1 Bitly links and provisions a mirror camera event. | body eventName, eventDate, hashtags[], categorizedHashtags{}, stats, styleId, partner1Id, partner2Id, reportTemplateId | success, projectId, project, dataQuality | writes projects, hashtags; writes Bitly link-association junction (createLinkAssociation); writes notifications; external HTTP: provisions camera app event via after() (provisionCameraEventForProject) |
| PUT | `/api/projects` | page-password | Update an existing project; this is the event editor's save. `projectId` must be the 24-hex id as a string (anything else is 400; it is used in lower case from then on). requireProjectWriteAccess: an admin or superadmin session may change every field; every other caller -- a current grant for `edit:<editSlug>` (from the edit password, or from loading an unprotected editor by its edit link), or a signed-in account with another role (guest, user, api) -- may change stats and hashtags only: eventName, eventDate, styleId, reportTemplateId, partner1Id and partner2Id in its body are ignored, not rejected, in either body form (the route drops them itself, whatever `EVENT_EDITOR_WRITABLE_FIELDS` lists). A grant issued before the editor's current password does not count. Two body forms, never both: legacy `stats` (an object, replaced whole; editor tabs opened before field-level saves) and field-level `statsChanges` (a value per stat key, null removes the key; `statsRemoved` also removes; `statsIncrements` adds a whole number to a counter, as the editor's clicker taps are sent). Field-level writes only `stats.<key>` for the keys it names -- `$inc` for a count, so taps another device stored meanwhile are kept, and a count taken below zero is set back to 0 -- plus derived totals (allImages, remoteFans, totalFans) whose value changes, so values other writers stored meanwhile (fanmass sync, sheet pull, another device) survive. Stat keys: non-empty, at most 100 characters, no `.` or `$`; values: finite number, string of at most 100 000 characters, or null; counts: safe integers of at most 1 000 000 either way, only with `tabId` + `clientSeq`; a key in only one of the three; at most 1000 keys per save. `hashtags` / `categorizedHashtags` change only when present, and are checked before anything is written, for every caller: `hashtags` a list of at most 200 non-empty texts of at most 100 characters (null clears it); `categorizedHashtags` an object of at most 50 such lists, each category name 1-100 characters with no `.` or leading `$` (null clears it). Late-write guard: with `tabId` (`[A-Za-z0-9_-]{8,64}`) and `clientSeq` (non-negative integer) the write is conditional on no save from that tab with the same or a higher number having been stored (`editorSeq.<tabId>`), and records this one; a late save -- or the same request arriving twice -- stores nothing and answers 200 `{ success: true, stale: true }`. Recalculates Bitly links if eventDate changed. `maxDuration` 20 s (the editor gives a save 25 s). Editor-save rate budget (120/min per IP + path; 429 with Retry-After). | body projectId; statsChanges{} / statsRemoved[] / statsIncrements{} or stats{}; hashtags[], categorizedHashtags{}; tabId + clientSeq; admin or superadmin session only: eventName, eventDate, styleId, reportTemplateId, partner1Id, partner2Id | 200 { success, modified } or { success, stale: true }; 400 invalid projectId / styleId format / stat key, value or count / a count without tabId+clientSeq / tabId or clientSeq (or one without the other) / both stats and field-level stats / malformed hashtags or categorizedHashtags; 401 `{ success: false, error, code: 'EDIT_ACCESS_REQUIRED' }` without a session or current grant (also for an unknown id); 404 project not found | writes projects (named `stats.<key>` paths, or `stats` whole; hashtags; `editorSeq.<tabId>`); hashtag counts only for hashtags this save added or removed, and only once the write landed, then deletes the count docs of removed ones no project still uses (at most 20 checks per request; a stats-only save does no hashtag work); Bitly recalculation (recalculateProjectLinks); writes notifications |

## /public

| Method | Path | Auth | Summary | Request | Response | Side effects |
|--------|------|------|---------|---------|----------|--------------|
| GET | `/api/public/events/:id` | machine-token | Public third-party API: full details for one event/project including optional full stats. | path :id (project ObjectId); query includeStats (default true); header Authorization: Bearer | success, event{id,eventName,eventDate,viewSlug,hashtags,partner,matchContext,stats?} (never editSlug: it is a write credential for an editor with no password, and API keys are read-only), timestamp | read-only |
| OPTIONS | `/api/public/events/:id` | public-by-design | CORS preflight; sets CORS headers only when the Origin is allowlisted (ALLOWED_ORIGINS, else localhost; lib/cors.ts). | none (Origin header) | 204, no body | none |
| GET | `/api/public/partners/:id/events` | machine-token | Public third-party API: list a partner's events (projects) with summary stats and pagination. | path :id (partner ObjectId); query limit (max 100), offset, sortOrder (asc\|desc); header Authorization: Bearer | success, events[]{id,eventName,eventDate,viewSlug,hashtags,matchContext,summary} (never editSlug), partner{id,name,emoji}, pagination, timestamp | read-only |
| OPTIONS | `/api/public/partners/:id/events` | public-by-design | CORS preflight; sets CORS headers only when the Origin is allowlisted (ALLOWED_ORIGINS, else localhost; lib/cors.ts). | none (Origin header) | 204, no body | none |
| GET | `/api/public/partners/:id` | machine-token | Public third-party API: details for a single partner (sanitized public fields). | path :id (partner ObjectId); header Authorization: Bearer | success, partner{id,name,emoji,logoUrl,hashtags,categorizedHashtags,sportsDb}, timestamp | read-only |
| OPTIONS | `/api/public/partners/:id` | public-by-design | CORS preflight; sets CORS headers only when the Origin is allowlisted (ALLOWED_ORIGINS, else localhost; lib/cors.ts). | none (Origin header) | 204, no body | none |
| GET | `/api/public/partners` | machine-token | Public third-party API: list partners with search, sort and pagination (sensitive fields stripped). | query search, limit (max 100), offset, sortField (name\|createdAt), sortOrder (asc\|desc); header Authorization: Bearer | success, partners[]{id,name,emoji,logoUrl,hashtags,sportsDb}, pagination{total,limit,offset,hasMore}, timestamp | read-only |
| OPTIONS | `/api/public/partners` | public-by-design | CORS preflight; sets CORS headers only when the Origin is allowlisted (ALLOWED_ORIGINS, else localhost; lib/cors.ts). | none (Origin header) | 204, no body | none |

## /report-config

| Method | Path | Auth | Summary | Request | Response | Side effects |
|--------|------|------|---------|---------|----------|--------------|
| GET | `/api/report-config/:identifier` | public-by-design | Resolve and return the report template/layout for an entity via the project->partner->default->hardcoded hierarchy. | path :identifier (project ObjectId/viewSlug, partner id, or hashtag/filter/__default_event__); query type=project\|partner\|hashtag\|filter (required) | success, template (with populated dataBlocks + resolved styleId), resolvedFrom, source | read-only (reads report_templates, data_blocks, projects, partners) |

## /report-styles

| Method | Path | Auth | Summary | Request | Response | Side effects |
|--------|------|------|---------|---------|----------|--------------|
| GET | `/api/report-styles/:id` | public-by-design | Fetch a single report style by id (theming config for report rendering). | path :id | success, style | read-only |
| DELETE | `/api/report-styles` | admin-session | Delete a report style by id within the caller's org. | query id | success, message (or 404) | deletes from report_styles |
| GET | `/api/report-styles` | admin-session | List report styles scoped to the caller's organization. | none (org resolved from session via x-v3-org-id header) | success, styles[] | read-only |
| POST | `/api/report-styles` | admin-session | Create a report style (26-color/dimension/font config) scoped to the org. | body { name, description, fontFamily, COLOR_FIELDS (hex colors), DIMENSION_FIELDS } | success, styleId, style | writes report_styles |
| PUT | `/api/report-styles` | admin-session | Update a report style by id within the caller's org. | query id; body { name, description, fontFamily, COLOR_FIELDS, DIMENSION_FIELDS } | success, style (or 404 if not found in org) | writes report_styles |

## /report-templates

| Method | Path | Auth | Summary | Request | Response | Side effects |
|--------|------|------|---------|---------|----------|--------------|
| DELETE | `/api/report-templates/assign` | admin-session | Bulk-remove report template assignments from projects and/or partners. | query projectIds (comma-separated), partnerIds (comma-separated) | success, projectsUpdated, partnersUpdated, message | writes projects and partners (unsets reportTemplateId) |
| POST | `/api/report-templates/assign` | admin-session | Bulk-assign a report template to multiple projects and/or partners. | body { templateId (required), projectIds[]?, partnerIds[]? } | success, projectsUpdated, partnersUpdated, message | writes projects and partners (sets reportTemplateId) |
| DELETE | `/api/report-templates` | admin-session | Delete a non-default report template by id within the org, only if no projects/partners are still assigned. | query templateId | success, deletedId (or 400/404) | deletes from report_templates (reads V3 Activity/Entity to check assignments) |
| GET | `/api/report-templates` | admin-session | List report templates for the org, optionally with associated V3 projects/partners. | query type (event\|partner\|global), includeDefault (default true), includeAssociations (default true) | success, templates[] (optionally with associatedProjects/associatedPartners), count | read-only (reads report_templates + V3 Activity/Entity via mongoose) |
| POST | `/api/report-templates` | admin-session | Create a report template for the org; if isDefault, clears the previous org default. | body name (required), dataBlocks[] (required array), isDefault, plus template config fields | success, template (201) | writes report_templates (insert + updateMany to unset prior default) |
| PUT | `/api/report-templates` | admin-session | Update a report template by id within the org; handles default reassignment. | query templateId; body template fields (isDefault, etc.) | success, template (or 404) | writes report_templates (updateOne + updateMany to unset prior default) |

## /report-variants

| Method | Path | Auth | Summary | Request | Response | Side effects |
|--------|------|------|---------|---------|----------|--------------|
| GET | `/api/report-variants/:id` | admin-session | Fetch a single report variant by ObjectId. | path :id; validates ObjectId | {success, variant} (variant._id stringified) | read-only (reads report_variants) |
| PUT | `/api/report-variants/:id` | admin-session | Update a report variant; validates report period and returns coded errors. | path :id; JSON body of report-variant fields | {success, variant}; on ReportPeriodValidationError {success:false,error,code} | writes report_variants (via updateReportVariant) |
| GET | `/api/report-variants` | admin-session | List report variants for an owner (organization/partner/hashtag/filter) plus the base source. | query ownerType (organization\|partner\|hashtag\|filter), ownerId (both required) | success, owner (baseSource), variants[] | read-only |
| POST | `/api/report-variants` | admin-session | Create a report variant (named reporting period) for an owner. | body ownerType, ownerId, name (all required), periodPreset, customDateRange, timezone | success, variant (or 4xx on ReportPeriodValidationError) | writes report variants collection (via createReportVariant) |

## /reports

| Method | Path | Auth | Summary | Request | Response | Side effects |
|--------|------|------|---------|---------|----------|--------------|
| GET | `/api/reports/resolve` | public-by-design | Resolve report layout/config for a project or partner (project→partner→default hierarchy). | query projectId OR partnerId (exactly one required; id or slug) | {success, report, resolvedFrom, source} | read-only (reads projects/partners + report config via ReportResolver) |

## /sports-db

| Method | Path | Auth | Summary | Request | Response | Side effects |
|--------|------|------|---------|---------|----------|--------------|
| POST | `/api/sports-db/fixtures/draft` | admin-session | Create a draft project linked to a cached SportsDB fixture (one-click create). | JSON body {eventId} (required) | {success, projectId} or {success:false,error:reason} | writes projects (draft project via createDraftProjectFromSportsDbFixture); reads sportsdb_fixtures |
| GET | `/api/sports-db/fixtures` | admin-session | Query cached TheSportsDB fixtures from Mongo with filters + pagination. | query partnerId, homeOnly, teamId, dateFrom, dateTo, status, limit(<=100), offset | {success, fixtures[], pagination{total,limit,offset,nextOffset}, timestamp} | read-only (reads sportsdb_fixtures) |
| DELETE | `/api/sports-db/lookup` | admin-session | Method guard: session-checks then returns 405 (GET-only endpoint). | none | 405 {success:false, error:'Method not allowed'} | read-only |
| GET | `/api/sports-db/lookup` | admin-session | Lookup detailed team/venue/league metadata by id from TheSportsDB. | query type (team\|venue\|league), id | {success, type, id, result}; Cache-Control private,no-store | external HTTP to TheSportsDB (lookupTeam/Venue/League); no DB write |
| POST | `/api/sports-db/lookup` | admin-session | Method guard: session-checks then returns 405 (GET-only endpoint). | none | 405 {success:false, error:'Method not allowed'} | read-only |
| PUT | `/api/sports-db/lookup` | admin-session | Method guard: session-checks then returns 405 (GET-only endpoint). | none | 405 {success:false, error:'Method not allowed'} | read-only |
| DELETE | `/api/sports-db/search` | admin-session | Method guard: session-checks then returns 405 (GET-only endpoint). | none | 405 {success:false, error:'Method not allowed'} | read-only |
| GET | `/api/sports-db/search` | admin-session | Search TheSportsDB for teams (venue = team-search filtered by stadium name). | query type (team\|venue), query (name) | {success, type, query, count, results[]}; Cache-Control private,no-store | external HTTP to TheSportsDB (searchTeams); no DB write |
| POST | `/api/sports-db/search` | admin-session | Method guard: session-checks then returns 405 (GET-only endpoint). | none | 405 {success:false, error:'Method not allowed'} | read-only |
| PUT | `/api/sports-db/search` | admin-session | Method guard: session-checks then returns 405 (GET-only endpoint). | none | 405 {success:false, error:'Method not allowed'} | read-only |
| POST | `/api/sports-db/sync` | admin-session | Sync upcoming SportsDB events for all partners with a teamId, then partner-match fixtures. | none | {success, sync, matched, timestamp} | writes sportsdb_fixtures (reads partners); external HTTP to TheSportsDB |

## /stakeholder

| Method | Path | Auth | Summary | Request | Response | Side effects |
|--------|------|------|---------|---------|----------|--------------|
| POST | `/api/stakeholder/invite` | admin-session | Invite an external stakeholder (#231) by recording which email may sign in, with which role and report scope. No token is minted and no email is sent; the admin shares the returned login link. | body: email (required), role ('sponsor'\|'agency'\|'media'\|'operator'), scopeType ('organization'\|'partner'\|'hashtag'\|'filter'), scopeId (all required) | {success, grant, loginUrl: '/api/auth/sso/stakeholder-login'}; 400 on validation | writes stakeholder_grants (findOneAndUpdate upsert keyed on lowercased email + scopeType + scopeId; status 'invited', invitedBy, invitedAt) |

## /stats

| Method | Path | Auth | Summary | Request | Response | Side effects |
|--------|------|------|---------|---------|----------|--------------|
| GET | `/api/stats` | admin-session | General stats fallback: redirects to project stats/project endpoint by slug or id, else returns info message. | query slug (optional), id (optional) | 302 redirect to /api/projects/stats/:slug or /api/projects/:id; else {success,message,available} | read-only |

## /user-preferences

| Method | Path | Auth | Summary | Request | Response | Side effects |
|--------|------|------|---------|---------|----------|--------------|
| GET | `/api/user-preferences` | admin-session | Fetch current user's preferences (keyed by user email). | none | {success, preferences} | read-only (reads user_preferences) |
| PUT | `/api/user-preferences` | admin-session | Update current user's preferences (upsert by email). | JSON body {lastSelectedTemplateId} | {success, message} | writes user_preferences (updateOne upsert) |

## /v3

| Method | Path | Auth | Summary | Request | Response | Side effects |
|--------|------|------|---------|---------|----------|--------------|
| DELETE | `/api/v3/activities/:id/participants/:entityId` | admin-session | Remove a participant from an activity. | path :id, :entityId | {message} or 404 if not found | deletes from v3 activity participants (findOneAndDelete) |
| GET | `/api/v3/activities/:id/participants` | admin-session | List all participants for an activity (populates entity name/type). | path :id | {count, participants[]} | read-only (reads v3 activity participants) |
| POST | `/api/v3/activities/:id/participants` | admin-session | Add or update (upsert) a participant on an activity. | path :id; JSON body {entityId, role (both required), metadata} | 201 {message, participant} | writes v3 activity participants (findOneAndUpdate upsert) |
| GET | `/api/v3/activities` | admin-session | List v3 activities filtered by owner entity/status/type, scoped by injected org id. | query ownerEntityId, status, type | {count, activities[]} | read-only (reads v3 activities) |
| GET | `/api/v3/entities/:id` | admin-session | Get full entity metadata plus its direct (1-level) children. | path :id | {...entity, children[]} or 404 if not found | read-only (reads v3 entities) |
| GET | `/api/v3/entities` | admin-session | List v3 entities filtered by type/parent, scoped by injected org id. | query type, parentEntityId ('null' matches top-level) | {count, entities[]} | read-only (reads v3 entities) |
| GET | `/api/v3/health` | admin-session | V3 health/context check; echoes injected x-v3-org-id. | none | {status:'ok', v3:true, context:{organizationId}, timestamp} | read-only |
| POST | `/api/v3/health` | admin-session | Same handler as GET: V3 health/context check echoing injected org id. | none | {status:'ok', v3:true, context:{organizationId}, timestamp} | read-only |
| GET | `/api/v3/metrics/export` | admin-session | Pull-based BI feed of curated sponsorship metrics (METRIC_CATALOG keys only) for the caller's resolved org (#232); requireAdmin + withOrgContext. | query: orgId? (honoured only for a superadmin and only when that organization exists; otherwise the user's first organizationId, else the master org) | {success, contractVersion:'messmass.v3-sponsorship-export.v1', organizationId, generatedAt, rowCount, metrics[] (metricKey, metricName, metricType, classification, value, timestamp, entity, activity)}; at most 1000 rows, newest first | read-only (reads v3_metric_values, v3_metric_definitions, v3_entities, v3_activities via mongoose) |
| POST | `/api/v3/metrics/record` | admin-session | Bulk-record metric values for the org (unordered insertMany). | JSON body {dataPoints[]} (non-empty array; each may carry timestamp) | 201 {message, insertedCount} | writes v3 metric values (insertMany, ordered:false) |
| POST | `/api/v3/metrics/sync` | admin-session | Seed the metric catalog and materialize catalog MetricValues for every eligible activity (has stats and an owner entity) (#232). Org-agnostic data-pipeline run. | none | {success, definitionsWritten, activitiesEligible, activitiesMaterialized, skipped[] (activityId, reason)}; 500 on failure | writes v3_metric_definitions (findOneAndUpdate upsert per catalog key) and v3_metric_values (findOneAndUpdate upsert per activity + metricKey); reads v3_activities, bitly_project_links |
| GET | `/api/v3/organizations/report/:id/activities` | org-scoped | Aggregated activities for an org: owned activities plus ones its entities participate in, date-sorted. | path :id (organization id) | {success, activities[]} | read-only (reads v3 activities + activity participants) |
| GET | `/api/v3/organizations/report/:id` | org-scoped | Aggregate stats + resolve report layout for a V3 organization, with its top-level entities. | path :id (organization id) | {success, organization, entities[], report, resolvedFrom, source, aggregatedStats, totalEntities} | read-only (reads v3 organizations/entities + report config) |
| GET | `/api/v3/reporting/dashboard` | admin-session | Aggregate one or more metrics for an entity hierarchy over an optional date range. | query entityId (required), metrics (required, comma-separated keys), startDate, endDate (ISO) | {entityId, timestamp, metrics[]} | read-only (aggregates v3 metric values via V3ReportingResolver) |
| GET | `/api/v3/reporting/export/:entityId` | admin-session | Export an entity's aggregated metrics as a downloadable CSV. | path :entityId | 200 text/csv attachment (columns: Metric Key, Total, Count, First Seen, Last Seen) or 404 if no data | read-only (aggregates v3_metric_values) |
| GET | `/api/v3/reports/resolve` | org-scoped | Resolves the appropriate V3 report template for a given activity or entity, scoped to the caller's org. | query: activityId OR entityId (exactly one required); org id via x-v3-org-id header | { success:true, ...resolveForActivity/resolveForEntity result }; 400 if neither id given; 500 on error | read-only (V3ReportResolver.resolveForActivity / resolveForEntity) |

## /variables-config

| Method | Path | Auth | Summary | Request | Response | Side effects |
|--------|------|------|---------|---------|----------|--------------|
| DELETE | `/api/variables-config` | admin-session | Deletes a custom variable by name; refuses deletion of system variables (isSystem=true). requireAdmin since 7d3ef3bb. | query: name (required) | { success, message }; 404 not found; 403 system var; 500 on error | writes (deletes from) variables_metadata; invalidates in-memory cache |
| GET | `/api/variables-config` | public-by-design | Returns all variable definitions from variables_metadata with a 5-minute in-memory cache and legacy-schema normalization. | none | { success, variables[], count?, cached } | read-only from DB; mutates in-memory module cache only (no collection writes, no external calls) |
| POST | `/api/variables-config` | admin-session | Upserts (create or update) a variable in variables_metadata; blocks renaming system variables. requireAdmin since 7d3ef3bb. | body: name (required, camelCase, stats. prefix stripped); for new vars also label+type+category required; optional description, unit, derived, formula, flags{visibleInClicker,editableInManual}, order, alias | { success, variable, created }; 400 invalid name / missing fields; 403 renaming system var; 500 on error | writes variables_metadata (updateOne upsert, plus a second updateOne to strip legacy stats. prefix); invalidates in-memory cache |
| PUT | `/api/variables-config` | admin-session | Force-invalidates the in-memory variables cache (only ?action=invalidateCache is honored). requireAdmin since 7d3ef3bb. | query: action=invalidateCache (required) | { success, message }; 400 for unknown action; 500 on error | in-memory cache only (no DB write, no external calls) |

## /variables-groups

| Method | Path | Auth | Summary | Request | Response | Side effects |
|--------|------|------|---------|---------|----------|--------------|
| DELETE | `/api/variables-groups` | admin-session | Deletes one group (groupOrder within a clicker set), all groups for a set, or ALL groups when no clickerSetId is supplied. | query: clickerSetId? , groupOrder? | { success, deletedCount? }; 400 invalid groupOrder or missing clickerSetId when groupOrder given; 500 on error | writes (deletes from) variablesGroups; note deleteMany({}) wipes every group when clickerSetId is absent |
| GET | `/api/variables-groups` | public-by-design | Lists variable groups for a clicker set (defaults to the default set), backfilling legacy groups into it. | query: clickerSetId (optional; falls back to the default clicker set) | { success, groups[] } sorted by groupOrder; 400 if no resolvable clickerSetId; 500 on error | Writes despite being a GET: ensureDefaultClickerSet may insertOne into clickerSets; legacy groups lacking clickerSetId are backfilled via updateMany on variablesGroups. No external calls. |
| POST | `/api/variables-groups` | admin-session | Seeds default groups for a clicker set (seedDefault) or upserts a single variable group by groupOrder. | body: clickerSetId (required, must exist in clickerSets); seedDefault? (bool); group{ groupOrder(required number), chartId?, titleOverride?, variables[]?, specialType?='report-content', visibleInClicker?, visibleInManual? } | { success, groups[] } for seed, or { success, group } for upsert; 400 invalid/missing clickerSetId or payload; 500 on error | writes variablesGroups (insertMany seed of 8 groups, or updateOne upsert); reads clickerSets to validate the set exists |

## Auth gaps (UNGUARDED-GAP)

**None open @ dd34e229.** The nine rows this section used to list have all been closed or reclassified. Verified by reading each handler:

- `POST /api/auto-generate-chart-block` — now `requireEditorAccess` (app/api/auto-generate-chart-block/route.ts:28): admin session or any page-access edit grant, because EditorDashboard's ReportContentManager calls it (7d3ef3bb).
- `POST`/`PUT`/`DELETE /api/hashtag-colors` — now `requireAdmin` (app/api/hashtag-colors/route.ts:55, :120, :222; 7d3ef3bb).
- `DELETE /api/hashtags` — now `requireAdmin` (app/api/hashtags/route.ts:163; 7d3ef3bb). `POST /api/hashtags` also gained `requireEditorAccess` (route.ts:113).
- `POST`/`PUT`/`DELETE /api/variables-config` — now `requireAdmin` (app/api/variables-config/route.ts:219, :417, :455; 7d3ef3bb).
- `GET /api/clicker-sets` — still has no guard (app/api/clicker-sets/route.ts:37). This is deliberate: the page-password OrganizationEditorDashboard reads it. Its lazy `ensureDefaultSet` insert is accepted as bounded init and frozen in `KNOWN_UNGUARDED_READS` [editor] (tests/api-mutation-auth.test.ts). It is now labelled public-by-design, matching `GET /api/variables-groups`.

`KNOWN_UNGUARDED` in tests/api-mutation-auth.test.ts now holds only the five public-by-design write routes (admin/clear-cookies, admin/login, admin/register, contact, client-error) plus two machine-integration entries (integrations/camera/partners and camera/sso-session) whose own token handling is documented above as machine-token. The mutation sweep is per-handler, so a new unguarded handler fails CI. (`PUT /api/admin/project-partners` was the one new gap this reference originally surfaced. It was fixed in the same wave and is `requireAdmin` today.)

## Deprecation candidates (evidence-backed, feed Wave 2)

- `POST /api/admin/login` — Deprecated local login stub — always returns 410 pointing callers to SSO. (no guard; permanently returns 410 Gone — local login removed in favor of SSO (app/api/admin/login/route.ts:20-25))
- `POST /api/admin/register` — Removed self-registration stub — always returns 410 pointing users to SSO login. (no guard — always returns HTTP 410 (register/route.ts:9-12))

