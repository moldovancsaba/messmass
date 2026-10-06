# messmass API Reference

Generated for the fleet audit (messmass#350); measured against `docs/_audit/endpoints.json` (inventory head dd34e229, 222 endpoints; the frame-context route added 2026-10-06). Every route below was verified by reading its `route.ts` handler, not just the marker scan; the Auth column was re-verified against the handlers @ dd34e229 (2026-09-28).

Coverage: 222 of 222 routes documented, enforced by
`tests/api-reference-covers-every-route.test.ts` — five routes were missing when
that claim was last made by hand.

## Cross-cutting behavior (middleware.ts)

Every request passes through, in order: rate limiting, CSRF protection, CORS. CSRF (double-submit cookie + `X-CSRF-Token` header) applies to all mutating `/api/*` methods EXCEPT `/api/admin/login`, `/api/page-passwords`, and `/api/integrations/*` (token-authed server-to-server). Note: the CSRF token is issued to any anonymous caller via `GET /api/csrf-token`, so CSRF is a cross-site hurdle, **not** authentication (this is the documented rationale for `lib/apiGuards.ts`). Page-level auth for `/admin/*` and `/dashboard/*` HTML routes is also enforced in middleware (admin-session cookie, SSO required when `SSO_BASE_URL` is set).

## Auth layers (exact guards)

| Guard | Source | What it proves |
|---|---|---|
| `getAdminUser` | `lib/auth` | Valid admin-session cookie (SSO-backed). Role checks are per-route. |
| `requireSession` | `lib/apiGuards` | Same as getAdminUser, returns 401 response object (F-009 retrofit guard). Authentication only — it documents that it checks no role. |
| `requireAdmin` | `lib/apiGuards` | Authenticated **and** role is admin or superadmin; 403 otherwise (F-025 / #400). |
| `requireSuperadmin` | `lib/apiGuards` | Authenticated **and** role is superadmin; 403 otherwise (messmass#227). |
| `requireEditorAccess` | `lib/apiGuards` | Admin session **or** any page-access `edit:`/`partner-edit:` grant. For the two routes the editors drive that carry no project id to scope against. 401 `EDIT_ACCESS_REQUIRED` otherwise. |
| `requireProjectWrite` / `requireProjectWriteAccess` | `lib/apiGuards` | Admin session, or a current `edit:<editSlug>` grant for that one project (issued by its edit password, or by `GET /api/projects/edit/[slug]` serving an editor with no password to a caller holding its UUID edit link). Current = issued no earlier than the editor's newest `edit` password, so setting or regenerating one cuts earlier holders off. A grant holder may write only `EVENT_EDITOR_WRITABLE_FIELDS`. 401 `EDIT_ACCESS_REQUIRED` otherwise, the same body for an unknown id. |
| `requirePartnerWrite` / `requirePartnerWriteAccess` | `lib/apiGuards` | Admin session, or a current `partner-edit` grant for that partner's _id or viewSlug. Only a partner-edit password issues one: an unprotected partner editor's slug is its public report slug, so it grants nothing. A grant holder may write only `PARTNER_EDITOR_WRITABLE_FIELDS`. 401 `EDIT_ACCESS_REQUIRED` otherwise. |
| `requirePageAccess` / `requirePageAccessDecision` | `lib/pageAccess` | Page password grant (or admin session) for a protected page slug, across every alias passed in. 401 `PAGE_PASSWORD_REQUIRED` otherwise. The decision form also says how the caller passed, so the editor loaders renew only grants the caller already holds and never convert an admin session into a grant. Grants live in the signed HttpOnly `page-access` cookie, each expiring 12 h after it was last issued. A grant from a token signed before per-grant issue times (dated only by the token's `iat`) is never current on a protected page: not renewed, not accepted for a save. |
| `requireOrgEditPageAccess` / `requirePartnerEditPageAccess` | route-local (`organizations/edit/[id]`, `partners/edit/[slug]`) | If the page (or any alias / variant key of it) is password-protected: admin session or an `organization-edit` / `partner-edit` grant for one of those keys; an unprotected page is open (messmass#386). |
| `requireFanmassIntegrationAuth` | `lib/fanmassIntegration` | `FANMASS_INTEGRATION_TOKEN` via Bearer or `x-api-key`; 503 when unconfigured. |
| `assertCameraSecret` | `lib/cameraClient` | Camera provision token via Bearer or `x-camera-secret`; 503 when unconfigured. |
| `requireAPIAuth` | `lib/apiAuth` | Machine Bearer key matched against the user's bcrypt `apiKeyHash` and requiring `apiKeyEnabled`; rejects any request carrying cookies. Backs `/api/public/*` only; login passwords are not accepted (6f31990d). |
| `CRON_SECRET` | env, inline | `Authorization: Bearer <CRON_SECRET>`. |
| SSO bearer | inline, `POST <SSO_BASE_URL>/api/validate` | SSO access token validated against the SSO service. |
| `withOrgContext` | `lib/middleware/v3/orgContext`, `lib/v3/middleware` | getAdminUser + injects `x-v3-org-id` scoping header. |
| `validateOrganizationAccess` | `lib/auth/orgGuard` | getAdminUser + org membership check for the requested org. |
| `requireStakeholderRole` | `lib/apiGuards`, `lib/auth/stakeholderSession` | Valid `stakeholder-session` cookie (HS256 JWT, `JWT_SECRET`, 30 days, minted by `/api/auth/sso/stakeholder-callback` from a non-revoked `stakeholder_grants` row) with an allowed role; the route must compare `session.scopeId` itself (messmass#231). No route calls it @ dd34e229. |

## /api/admin (36 routes)

| Path | Methods | Auth | Request | Response | Side effects |
|---|---|---|---|---|---|
| /api/admin/variables/merge | POST | getAdminUser + admin/superadmin role | `{sourceId,targetId}` | `{success,merged}` | rewrites variable references, deletes the source |
| /api/admin/variables/merge-candidates | GET | getAdminUser + admin/superadmin role | — | `{success,candidates[]}` | reads variable registry |
| /api/admin/auth | GET | getAdminUser | — | `{success,user}` | none |
| /api/admin/clear-cache | POST | getAdminUser | `{type}` | `{success,message}` | clears in-process caches |
| /api/admin/clear-cookies | GET, POST | none (public-by-design) | — | `{success,message}` | deletes caller's own `admin-session` cookie |
| /api/admin/contact-inquiries | GET | getAdminUser | — | `{success,inquiries[]}` | reads `contact_inquiries` |
| /api/admin/email-selftest | GET | requireSession; rate-limited | — | `{sent,recipient}` | sends diagnostic email to SUPERADMIN_EMAIL via camera email service |
| /api/admin/fanmass/commands | POST | getAdminUser + role check | `{type,payload?}` | `{success,command}` | inserts `fanmass_commands` |
| /api/admin/fanmass/events/[eventId] | GET, POST | getAdminUser + role check | POST `{fanmassBatchId?,status?,action?('sync'\|'dry-run'),force?}` | `{success,link,sync?}` | upserts `fanmass_event_links`; sync writes project stats |
| /api/admin/fanmass/events | GET | getAdminUser + role check | — | `{success,events[]}` | reads `fanmass_event_links`/`projects` |
| /api/admin/fanmass/snapshot | GET | getAdminUser + role check | `?eventId` | `{success,snapshot}` | reads `fanmass_dashboard_snapshot` |
| /api/admin/filter-style | GET, POST | requireAdmin (both methods) | GET `?hashtags=a,b`; POST `{hashtags[],styleId}` | `{success,styleId…}` | insert/update `filter_slugs` |
| /api/admin/fix-mojibake-text | GET | getAdminUser | `?apply=1` (dry-run default) | scan/repair report | updates mojibake text across multiple collections when applied |
| /api/admin/hashtag-style | GET, POST | requireAdmin (both methods) | GET `?hashtag=`; POST `{hashtag,styleId}` | `{success,styleId…}` | updates `hashtag_slugs` |
| /api/admin/landing-projects | GET | getAdminUser | — | `{success,projects[]}` | reads `projects` |
| /api/admin/landing-settings | GET, PUT | getAdminUser | PUT `{landingReportSlug,…}` | `{success,settings}` | updates `settings` (landing doc) |
| /api/admin/landing-static-generate | POST | getAdminUser | — | `{success,generatedAt}` | reads `report_templates`,`data_blocks`,`partners`,`chart_configurations`; self-fetch of own config API; writes snapshot into `settings` |
| /api/admin/local-users/[id]/api-access | POST, PUT | getAdminUser + admin/superadmin role; a superadmin's key only by a superadmin (dd34e229) | POST none (rotate key); PUT `{enabled: boolean}` | POST `{success,apiKey (plaintext, shown once),user}`; PUT `{success,message,recommendation?,user}` (409 if API calls in the last 5 min) | POST sets `users.apiKeyHash` (bcrypt of a new random key); PUT sets `users.apiKeyEnabled` |
| /api/admin/local-users/[id] | PUT, DELETE | getAdminUser | PUT `{name,role,…}` | `{success}` | update/delete `users` |
| /api/admin/local-users/[id]/send-email | POST | getAdminUser | `{…email params}` | `{success}` | reads `users`; outbound email via camera service |
| /api/admin/local-users | GET, POST | getAdminUser | GET `?search&limit&offset`; POST `{email,name,role,…}` | `{success,users[]/user}` | inserts `users` |
| /api/admin/login | POST, DELETE | none (public-by-design: auth lifecycle) | — | POST: **410 Gone** (SSO-only); DELETE: logout | DELETE clears session cookies + best-effort SSO token revocation (outbound SSO) |
| /api/admin/organizations/[id]/members | GET, PUT | getAdminUser | PUT `{memberPartnerIds[]}` | `{success,members}` | updates `organizations`, `partners.updateMany`, V3Entity.updateMany |
| /api/admin/organizations/[id] | GET, PUT, PATCH, DELETE | getAdminUser | PUT/PATCH `{name,metadata,…}` | `{success,organization}` | update/delete `organizations`; detaches `partners` on delete |
| /api/admin/organizations | GET, POST | getAdminUser | POST `{name,…}` | `{success,organizations[]/organization}` | inserts `organizations` |
| /api/admin/partners | GET | requireSession | — | `{success,partners[]}` (name + reportTemplateId) | reads `partners` |
| /api/admin/permissions | GET, POST, DELETE | SSO bearer (validated via SSO `/api/validate`) | POST `{userId,projectId,role,…}`; DELETE `?projectId&userId` | `{success,…}` | writes `project_permissions`, `audit_logs` |
| /api/admin/project-partners/auto-suggest | POST | requireSession | — | `{success,updated}` | matches partners to projects by hashtag, updates `projects` |
| /api/admin/project-partners | GET, PUT | requireAdmin (both methods) | PUT `{projectId,partnerIds…}` | `{success,…}` | PUT updates `projects` partner links |
| /api/admin/projects/[id] | DELETE | SSO bearer | path id | `{success}` | deletes from `projects`, inserts `audit_logs` |
| /api/admin/register | POST | none (public-by-design) | — | **410 Gone** (SSO-only) | none |
| /api/admin/sync-events-to-camera | GET | getAdminUser | — | `{success,synced}` | reads `projects`; outbound POSTs to camera internal API |
| /api/admin/sync-partners-to-camera | GET | getAdminUser | — | `{success,synced}` | reads `partners`; outbound POSTs to camera internal API |
| /api/admin/ui-settings | GET, PUT | requireAdmin (both methods) | PUT `{fontFamily,…}` | `{success,settings}` | updates `settings` (typography), reads `available_fonts` |
| /api/admin/users/[id]/organizations | PUT | getAdminUser + superadmin role | `{organizationIds[]}` | `{success,user}` | updates `users.organizationIds`, validated against `organizations` (messmass#395) |
| /api/admin/users/[id]/role | PUT | getAdminUser (role-checked) | `{role}` | `{success}` | updates `users` |

## /api/analytics (25 routes)

All reads; the aggregation store is `analytics_aggregates` / `partner_analytics` (written by the cron aggregation job, not by these routes).

| Path | Methods | Auth | Request | Response | Side effects |
|---|---|---|---|---|---|
| /api/analytics/aggregates/partners | GET | getAdminUser | `?partnerId&limit&offset&sortBy&sortOrder` | `{success,aggregates[]}` | reads `partner_analytics` |
| /api/analytics/aggregates | GET | getAdminUser | `?bucket&startDate&endDate&partnerId(s)&hashtag&year&month&limit&offset&sort…` | `{success,aggregates[]}` | reads `analytics_aggregates` |
| /api/analytics/ai/coverage | GET | getAdminUser | — | `{success,coverage}` | reads AI-analytics state (projects/fanmass links) |
| /api/analytics/ai/events/[eventId]/drive-sync | POST | getAdminUser | `{…options}` | `{success,command}` | enqueues drive-sync (`fanmass_commands`, `drive_folder_links`) |
| /api/analytics/ai/events/[eventId]/rescan | GET, POST | getAdminUser | POST `{…options}` | `{success,request}` | writes `ai_rescan_requests` |
| /api/analytics/ai/events/[eventId]/summary | GET | getAdminUser | — | `{success,summary}` | reads `ai_analysis_summaries` |
| /api/analytics/ai/events | GET | getAdminUser | `?status&limit` | `{success,events[]}` | reads fanmass-linked events |
| /api/analytics/ai/variables | GET | getAdminUser | — | `{success,variables[]}` | reads `variables_metadata` |
| /api/analytics/benchmarks | GET | requireSession | `?category&metric&period` | benchmark stats | reads `analytics_aggregates` |
| /api/analytics/compare/partners | GET | requireSession | `?partnerIds&metrics` | comparison series | reads `partner_analytics` |
| /api/analytics/compare/periods | GET | requireSession | `?periodA&periodB&bucket&partnerId` | period deltas | reads `analytics_aggregates` |
| /api/analytics/compare | GET | requireSession | `?projectIds&metrics` | comparison series | reads `analytics_aggregates` |
| /api/analytics/event/[projectId] | GET | requireSession | `?includeBitly&includeRaw` | event analytics | reads `analytics_aggregates` |
| /api/analytics/executive/insights | GET | requireSession | `?priority&limit&period` | executive insights | reads `analytics_aggregates` |
| /api/analytics/executive/metrics | GET | requireSession | `?period` | portfolio KPIs | reads `analytics_aggregates` |
| /api/analytics/executive/top-events | GET | requireSession | `?period&limit&sortBy` | top events | reads `analytics_aggregates` |
| /api/analytics/insights/combined | GET | requireSession | `?limit` | merged executive + analytics insights | reads `analytics_aggregates`, `projects` (messmass#414) |
| /api/analytics/insights/[projectId] | GET | requireSession | `?includeRecommendations&severity` | per-event insights | reads `analytics_aggregates` |
| /api/analytics/insights/organizations/[orgId] | GET | getAdminUser | — | org insights | computed via insights engine |
| /api/analytics/insights/partners/[partnerId] | GET | getAdminUser | — | partner insights | computed via insights engine |
| /api/analytics/insights | GET | getAdminUser | `?type&severity&limit&since` | portfolio insights | reads `projects` |
| /api/analytics/insights/summary | GET | getAdminUser | `?partnerId&period&maxEvents` | insight summary | reads `analytics_aggregates` |
| /api/analytics/partner/[partnerId] | GET | requireSession | `?timeframe&includeEvents` | partner analytics | reads `analytics_aggregates`, `partners` |
| /api/analytics/sponsorship-hub | GET | getAdminUser | `?scopeType&scopeId&rangePreset` | sponsorship hub data | reads via `lib/sponsorshipHub` |
| /api/analytics/trends | GET | requireSession | `?startDate&endDate&partnerId&metrics&groupBy` | trend series | reads `analytics_aggregates` |

## /api/api-football (1 route)

| Path | Methods | Auth | Request | Response | Side effects |
|---|---|---|---|---|---|
| /api/api-football/enrich-partners | GET, POST | getAdminUser | POST triggers enrichment | `{success,log/status}` | outbound API-Football; updates `partners`, inserts `api_football_enrichment_log` |

## /api/auth (6 routes)

| Path | Methods | Auth | Request | Response | Side effects |
|---|---|---|---|---|---|
| /api/auth/check | GET | getAdminUser | — | `{authenticated,user?}` | none |
| /api/auth/sso/callback | GET | none (public-by-design: OAuth callback) | `?code&state&error` | 302 redirect | outbound SSO token exchange; sets session + `sso-tokens` cookies; best-effort camera SSO propagation |
| /api/auth/sso/config | GET | none (public-by-design) | — | public SSO client config | none |
| /api/auth/sso/login | GET | none (public-by-design: OAuth initiation) | `?redirect_uri&from_logout` | 302 to SSO authorize URL | sets state/PKCE cookies |
| /api/auth/sso/stakeholder-callback | GET | none (public-by-design: OAuth callback) | `?code&state&error` | 302 redirect | exchanges code, checks `stakeholder_grants` by verified email, mints `stakeholder-session` (messmass#231) |
| /api/auth/sso/stakeholder-login | GET | none (public-by-design: OAuth initiation) | — | 302 to SSO authorize URL | sets stakeholder pending-state cookie (messmass#231) |

## /api/bitly (9 routes)

| Path | Methods | Auth | Request | Response | Side effects |
|---|---|---|---|---|---|
| /api/bitly/analytics/[linkId] | GET | getAdminUser | `?refresh&format` | link analytics | reads `bitly_links`; on refresh, outbound Bitly API + findOneAndUpdate `bitly_links` |
| /api/bitly/associations | DELETE | getAdminUser | `?bitlyLinkId&projectId` | `{success}` | deletes from `bitly_project_links` |
| /api/bitly/links/[linkId] | PUT, DELETE | getAdminUser | PUT `UpdateLinkInput`; DELETE `?hard` | `{success,link?}` | updates/deletes `bitly_links` (soft-delete default) |
| /api/bitly/links | GET, POST | getAdminUser | GET `?search&projectId&includeAnalytics&…`; POST `AssociateLinkInput` | `{success,links[]/link}` | inserts `bitly_links`; reads `projects`, `bitly_project_links`, `partners` |
| /api/bitly/partners/associate | POST, DELETE | getAdminUser | POST `{bitlyLinkId,partnerId}`; DELETE query params | `{success}` | updates `partners` |
| /api/bitly/project-metrics/[projectId] | GET | requireSession | path id | per-project bitly metrics | reads `projects`, `bitly_project_links`, `bitly_links` |
| /api/bitly/pull | POST | getAdminUser | `{groupGuid?,…}` | `{success,imported}` | outbound Bitly; insertMany `bitly_links` |
| /api/bitly/recalculate | GET, POST | requireSession (both methods) | POST `{mode:'bitlink'\|'project'\|'all',bitlyLinkId?,projectId?}` | `{success,…counts}` | recalculates date ranges/cached metrics (writes via `lib/bitly-recalculator`) |
| /api/bitly/sync | GET, POST | CRON_SECRET bearer OR getAdminUser (GET forwards to POST for Vercel Cron) | `{…options}` | `{success,synced}` | outbound Bitly; updates `bitly_links`, inserts `bitly_sync_logs` |

## Charts and chart config (5 routes)

| Path | Methods | Auth | Request | Response | Side effects |
|---|---|---|---|---|---|
| /api/chart-config/public | GET | none (public-by-design: report rendering) | — | active chart configs | reads `chart_configurations` |
| /api/chart-config | GET, POST, PUT, DELETE | getAdminUser (all methods) | `?search&limit&offset&sort…`; POST/PUT config body; DELETE `?configurationId` | `{success,…}` | insert/update/delete `chart_configurations` |
| /api/chart-configs | GET | requireSession | — | chart config list | reads `chart_configurations` |
| /api/chart-formatting-defaults | GET, PUT | requireSession (both methods) | PUT `{defaults}` | `{success,defaults}` | updates `chart_formatting_defaults` |
| /api/charts | GET, POST, DELETE | requireSession (all methods) | GET `?chartIds&isActive&type`; POST chart body; DELETE `?chartId` | `{success,charts[]}` | upserts/deletes `charts` |

## /api/cron (3 routes)

| Path | Methods | Auth | Request | Response | Side effects |
|---|---|---|---|---|---|
| /api/cron/analytics-aggregation | GET, POST | CRON_SECRET bearer OR getAdminUser (requires admin when secret unset — fails closed) | POST `?force`; GET `?limit` (job history) | `{success,job/jobs}` | inserts/updates `aggregation_jobs`; rebuilds `analytics_aggregates` |
| /api/cron/bitly-refresh | GET, POST | CRON_SECRET (401 when unset or wrong — fails closed, messmass#348) | — | `{success,refreshed}` | refreshes bitly cached metrics (writes via lib) |
| /api/cron/google-sheets-sync | GET | CRON_SECRET (503 in production when unset — fails closed) | — | `{success,synced}` | outbound Google Sheets API; insert/update `projects`, updates `partners` sync state |

## /api/integrations/camera (5 routes)

| Path | Methods | Auth | Request | Response | Side effects |
|---|---|---|---|---|---|
| /api/integrations/camera/events/[messmassEventId]/frame-context | GET | assertCameraSecret | path ObjectId | `{success,event,partner,template,style}` (`style.page` = the page colours of the style for camera's guest pages); 400 invalid id, 404 unknown event | reads `projects`, `partners`, `report_templates`, `report_styles`, `available_fonts`; resolves the effective template and style for camera's default event frame (camera#231), including the system default style |
| /api/integrations/camera/link-partners | POST | requireFanmassIntegrationAuth | link payload | `{success,…}` | links partners to camera orgs (writes `partners`) |
| /api/integrations/camera/partners | POST | assertCameraSecret | partner payload | `{success,partner}` | upserts partner link data from camera |
| /api/integrations/camera/provision-missing | POST | requireFanmassIntegrationAuth | `?limit` | `{success,provisioned}` | outbound camera provisioning API; updates `partners` |
| /api/integrations/camera/sso-session | POST | assertCameraSecret | session payload | `{success}` | mints/propagates SSO session state (camera to messmass) |

## /api/integrations/fanmass (18 routes)

All 18 use `requireFanmassIntegrationAuth` (Bearer/`x-api-key` shared token) and are CSRF-exempt. Store: `fanmass_event_links`, `fanmass_commands`, `fanmass_dashboard_snapshot`, `drive_folder_links`, `ai_rescan_requests`, `ai_analysis_summaries`, `variables_metadata`, plus `projects`/`partners`/`organizations`.

| Path | Methods | Request | Response | Side effects |
|---|---|---|---|---|
| /api/integrations/fanmass/callbacks | POST | callback envelope | `{success}` | records callback, updates `fanmass_event_links` |
| /api/integrations/fanmass/commands/[commandId] | DELETE | path id | `{success}` | acks/removes from `fanmass_commands` |
| /api/integrations/fanmass/commands | GET | — | pending commands | reads `fanmass_commands` |
| /api/integrations/fanmass/dashboard-snapshot | POST | snapshot body | `{success}` | upserts `fanmass_dashboard_snapshot` |
| /api/integrations/fanmass/drive-folders/pending-sync | GET | — | folders pending sync | reads `drive_folder_links` |
| /api/integrations/fanmass/drive-folders | GET | — | drive folder links | reads `drive_folder_links` |
| /api/integrations/fanmass/events/[eventId]/analysis-summary | POST | summary body | `{success}` | upserts `ai_analysis_summaries` |
| /api/integrations/fanmass/events/[eventId]/context | GET | path id | event context | reads `projects`/links |
| /api/integrations/fanmass/events/[eventId]/drive-folders/status | POST | status body | `{success}` | updates `drive_folder_links` status |
| /api/integrations/fanmass/events/[eventId]/link | GET, POST | POST link body | `{success,link}` | reads/upserts `fanmass_event_links` |
| /api/integrations/fanmass/events/[eventId]/stats | POST | stats body | `{success}` | writes event stats into `projects` |
| /api/integrations/fanmass/events/[eventId]/sync | GET, POST | `?dryRun&force` | sync status/result | runs analytics sync; writes `projects`/links |
| /api/integrations/fanmass/events | POST | event resolve body | `{success,event}` | resolves/creates event links |
| /api/integrations/fanmass/partners/[partnerId]/events | GET | path id | partner's events | reads `projects` |
| /api/integrations/fanmass/partners | GET, POST | POST partner body | `{success,partners[]}` | reads/links `partners` |
| /api/integrations/fanmass/rescan-requests/[eventId] | DELETE | path id | `{success}` | removes from `ai_rescan_requests` |
| /api/integrations/fanmass/rescan-requests | GET | — | pending rescans | reads `ai_rescan_requests` |
| /api/integrations/fanmass/variables | GET, POST | POST variables body | `{success,variables}` | reads/writes `variables_metadata` |

## /api/hashtags and hashtag config (7 routes)

| Path | Methods | Auth | Request | Response | Side effects |
|---|---|---|---|---|---|
| /api/hashtag-categories | GET, POST, PUT, DELETE | GET none (public read for rendering); POST/PUT/DELETE requireAdmin (7d3ef3bb) | `?search&limit&offset`; bodies; DELETE `?id` | `{success,categories[]}` | insert/update/delete `hashtag_categories`; reads `projects` |
| /api/hashtag-colors | GET, POST, PUT, DELETE | GET none (public read); POST/PUT/DELETE requireAdmin (7d3ef3bb) | POST `{name,color}`; PUT `{_id,name,color}`; DELETE `?id` | `{success,colors[]}` | insert/update/delete `hashtag_colors` |
| /api/hashtags/[hashtag] | GET | none (public-by-design per `KNOWN_UNGUARDED_READS`; note it applies no page password, unlike filter-by-slug) | `?variant` | aggregated hashtag stats | reads `projects`, `hashtag_slugs` |
| /api/hashtags/filter | GET, POST | requireSession (both methods) | GET `?tags=`; POST `{hashtags[]}` | filtered aggregate stats | reads `projects` |
| /api/hashtags/filter-by-slug/[slug] | GET | requirePageAccess('filter', slug) | `?variant` | filter stats | reads `projects` |
| /api/hashtags | GET, POST, DELETE | GET none (read-only counts, editor autocomplete); POST requireEditorAccess; DELETE requireAdmin (cascade-capable) (7d3ef3bb) | GET `?search&limit&offset`; POST `{hashtag}`; DELETE `?hashtag&mode=cascade` | `{success,hashtags[]}`; POST `{success,hashtag}`, 401 `EDIT_ACCESS_REQUIRED` without a session or edit grant | DELETE cascade: updateMany `projects`/`partners`, deletes `hashtag_colors`, `hashtags`, `hashtag_slugs` |
| /api/hashtags/slugs | GET | requireSession (lazily inserts missing slugs) | — | hashtag→slug map | reads `projects`; inserts missing `hashtag_slugs` |

## /api/partners (16 routes)

| Path | Methods | Auth | Request | Response | Side effects |
|---|---|---|---|---|---|
| /api/partners/[id]/bitly-kyc | GET | getAdminUser | path id | KYC metrics | reads `projects` |
| /api/partners/[id]/events | GET | requireSession | path id | partner's events | reads `partners`, `projects` |
| /api/partners/[id]/google-sheet/connect | POST | requireSession | `ConnectRequest` | `{success}` | outbound Google Sheets; updates `partners` |
| /api/partners/[id]/google-sheet/disconnect | DELETE | requireSession | path id | `{success}` | updates `partners` (removes config) |
| /api/partners/[id]/google-sheet/provision | POST | requireSession | options | `{success,sheetId}` | outbound Google Sheets (creates sheet); updates `partners` |
| /api/partners/[id]/google-sheet/pull | POST | requireSession | `PullRequest` | `{success,imported}` | outbound Google Sheets; insertMany/update `projects`, updates `partners` |
| /api/partners/[id]/google-sheet/push | POST | requireSession | `PushRequest` | `{success,pushed}` | outbound Google Sheets; updates `projects`, `partners` |
| /api/partners/[id]/google-sheet/rename | POST | requireSession | `{title}` | `{success}` | outbound Google Sheets; updates `partners` |
| /api/partners/[id]/google-sheet/setup | POST | requireSession | setup body | `{success}` | outbound Google Sheets; updates `partners` |
| /api/partners/[id]/google-sheet/status | GET | requireSession | `?checkHealth` | connection status + sheet URL | reads `partners`; optional outbound health probe |
| /api/partners/[id]/lifecycle | GET, PUT | requireAdmin | PUT `{override: 'proposal'\|'postmortem'\|null}` | `{success,lifecycle}` | reads `partners`,`projects`; PUT sets/clears `partners.lifecycleStageOverride` (messmass#235) |
| /api/partners/edit/[slug] | GET, PUT | Read gate requirePartnerEditPageAccess (route-local: when protected, admin session or a current 'partner-edit' grant for any alias of the partner, variant keys included; messmass#386), 401 `PAGE_PASSWORD_REQUIRED`. PUT also needs write access (callerMayWrite: admin session, or a current 'partner-edit' grant for the _id/viewSlug or this variant's key), 401 `EDIT_ACCESS_REQUIRED`; passing the gate on an unprotected partner is not enough (F-009) | PUT `{metadata, tabId?, clientSeq?}`; `?variant` (PUT: custom variant only). `maxDuration` 20 s | GET `{success,partner,canSave}` (with a custom `?variant`, the variant's own values over the partner's, `showOnlyTeam1Events` included, and its `statsOverrides` as `stats`); PUT `{success,partner}`, or `{success,stale:true}` when a newer save from the same tab is stored | GET renews (Set-Cookie `page-access`) only current grants the caller already holds, issues none; PUT updates the custom variant's overrides (field-level `statsChanges`/`statsRemoved` as `statsOverrides.<key>` paths; `metadata.logoUrl` `''` or null unsets the variant's own logo, so the partner's shows; `editorSeq.<tabId>`) |
| /api/partners/link-football-data | POST | getAdminUser | `{partnerId,teamId,…}` | `{success}` | updates `partners` |
| /api/partners/report/[slug] | GET | none (public-by-design: shareable slug-keyed report) | `?variant` | partner report data | reads `projects` |
| /api/partners | GET, POST, PUT, DELETE | GET/POST/DELETE requireAdmin; PUT requirePartnerWriteAccess (admin/superadmin session: every field; current 'partner-edit' grant for that partner, from its password only, or a signed-in account below admin: `PARTNER_EDITOR_WRITABLE_FIELDS` only, others ignored), 401 `EDIT_ACCESS_REQUIRED`. `maxDuration` 20 s | GET `?limit&offset&sort&search`; POST/PUT bodies (PUT: `stats` or field-level `statsChanges`/`statsRemoved`; optional `tabId`+`clientSeq` late-write guard); DELETE `?partnerId` | `{success,partners[]}`; PUT `{success,stale:true}` when a newer save from the same tab is stored | insert/update/delete `partners` (PUT field-level: named `stats.<key>` paths; `editorSeq.<tabId>`) |
| /api/partners/upload-logo | POST | requireSession | `{badgeUrl,partnerName}` | `{success,logoUrl}` | outbound ImgBB upload |

## /api/projects (4 routes)

| Path | Methods | Auth | Request | Response | Side effects |
|---|---|---|---|---|---|
| /api/projects/[id] | GET, PUT, DELETE | requireSession (all methods; messmass#386) | PUT full update body | `{success,project}` | update/delete `projects` |
| /api/projects/edit/[slug] | GET | requirePageAccessDecision('edit', [slug, editSlug, _id]) (admin session or a current grant when any address has a password), 401 `PAGE_PASSWORD_REQUIRED`; opened by the public _id without a session or current grant, 403 `EDIT_LINK_REQUIRED` | path slug (editSlug UUID, or _id) | `{success,project,canSave}` | sets the `page-access` cookie: issues `edit:<editSlug>` when no address has a password and the UUID edit link was used, or when the caller holds a current grant for the _id; renews current grants the caller holds; none on the admin path |
| /api/projects | GET, POST, PUT, DELETE | GET/POST/DELETE requireAdmin (c02f4b6f); PUT requireProjectWriteAccess (admin/superadmin session: every field; a current `edit:<editSlug>` grant or a signed-in account below admin: stats and hashtags only, eventName/eventDate/style/template/partner refs ignored in either body form), 401 `EDIT_ACCESS_REQUIRED`. `maxDuration` 20 s | GET `?projectId&limit&cursor&q&offset&sort…`; POST/PUT project bodies (PUT: `projectId` a 24-hex string; legacy `stats`, or field-level `statsChanges` with null = remove / `statsRemoved` / `statsIncrements` (whole-number counts, `$inc`, need the guard); keys no `.`/`$`, max 100 chars; values number/string/null; optional `tabId`+`clientSeq` late-write guard; POST/PUT hashtag lists shape-checked before any write); DELETE `?projectId` | `{success,projects[]/project}`; PUT `{success,modified}`, or `{success,stale:true}` when a newer (or the same) save from the same tab is already stored; 400 on an invalid projectId, stat key/value/count, tabId/clientSeq or hashtag list | insert/update/delete `projects` (PUT field-level: only the named `stats.<key>` paths (`$inc` for counts, clamped at 0) plus changed derived totals; `editorSeq.<tabId>`); maintains `hashtags` counts (PUT: only hashtags the save added or removed, after the write landed, then deletes the count docs of removed ones no project uses, max 20 checks); reads `partners`, `report_styles` |
| /api/projects/stats/[slug] | GET | requirePageAccess('event-report', slug) | path slug | event stats payload | none |

## /api/public (4 routes) — machine-token API

All require `requireAPIAuth` (Bearer machine token, cookies rejected). OPTIONS is public CORS preflight.

| Path | Methods | Request | Response | Side effects |
|---|---|---|---|---|
| /api/public/events/[id] | GET, OPTIONS | `?includeStats` | event object | reads `projects`, `partners` |
| /api/public/partners/[id]/events | GET, OPTIONS | `?limit&offset&sortOrder` | partner's events | reads `partners`, `projects` |
| /api/public/partners/[id] | GET, OPTIONS | path id | partner object | reads `partners` |
| /api/public/partners | GET, OPTIONS | `?search&limit&offset&sortField&sortOrder` | partner list | reads `partners` |

## Reports, templates, styles, variants (8 routes)

| Path | Methods | Auth | Request | Response | Side effects |
|---|---|---|---|---|---|
| /api/report-config/[identifier] | GET | none (public-by-design: report rendering config) | `?type=project\|partner\|hashtag\|filter` | resolved report config | reads `report_templates`, `projects`, `partners`, `data_blocks` |
| /api/report-styles/[id] | GET | none (public-by-design: report styling) | path id | style object | reads `report_styles` |
| /api/report-styles | GET, POST, PUT, DELETE | withOrgContext → getAdminUser (all methods) | POST/PUT style bodies; `?id` | `{success,styles[]}` | insert/update/delete `report_styles` |
| /api/report-templates/assign | POST, DELETE | getAdminUser | POST `{templateId,projectIds?,partnerIds?}`; DELETE `?projectIds&partnerIds` | `{success,updated}` | updateMany `projects`, `partners` |
| /api/report-templates | GET, POST, PUT, DELETE | withOrgContext → getAdminUser (all methods) | `?type&includeDefault&includeAssociations`; bodies; `?templateId` | `{success,templates[]}` | insert/update/delete `report_templates` |
| /api/report-variants/[id] | GET, PUT | getAdminUser | PUT variant body | `{success,variant}` | reads/updates `report_variants` |
| /api/report-variants | GET, POST | getAdminUser | `?ownerType&ownerId`; POST variant body | `{success,variants[]}` | inserts `report_variants` |
| /api/reports/resolve | GET | none (public-by-design: report resolution for rendering) | `?projectId\|partnerId&pack?` | `{success,report,resolvedFrom}` | reads template hierarchy; `?pack=` filters blocks to an audience pack's allowlist (messmass#236), omitted = unchanged |

## /api/sports-db (5 routes)

| Path | Methods | Auth | Request | Response | Side effects |
|---|---|---|---|---|---|
| /api/sports-db/fixtures/draft | POST | getAdminUser | fixture draft body | `{success,draft}` | creates draft events from fixtures |
| /api/sports-db/fixtures | GET | getAdminUser | `?partnerId&homeOnly&teamId&dateFrom&dateTo&status&limit&offset` | fixtures list | reads `sportsdb_fixtures` |
| /api/sports-db/lookup | GET, POST, PUT, DELETE | requireSession (all methods); POST/PUT/DELETE are 405 stubs | `?type&id` | TheSportsDB lookup result | outbound TheSportsDB |
| /api/sports-db/search | GET, POST, PUT, DELETE | requireSession (all methods); POST/PUT/DELETE are 405 stubs | `?type&query` | TheSportsDB search result | outbound TheSportsDB |
| /api/sports-db/sync | POST | getAdminUser | — | `{success,sync,matched}` | outbound TheSportsDB; writes `sportsdb_fixtures`, matches to `partners` |

## /api/v3 (14 routes)

All wrapped in `withOrgContext` (getAdminUser + `x-v3-org-id` injection) except the two org-report routes, which use `validateOrganizationAccess` (getAdminUser + org membership). Data layer is Mongoose (v3_* models).

| Path | Methods | Auth | Request | Response | Side effects |
|---|---|---|---|---|---|
| /api/v3/activities/[id]/participants/[entityId] | DELETE | withOrgContext | path ids | `{message}` | deletes V3ActivityParticipant |
| /api/v3/activities/[id]/participants | GET, POST | withOrgContext | POST `{entityId,role,metadata}` | participants | upserts V3ActivityParticipant |
| /api/v3/activities | GET | withOrgContext | `?ownerEntityId&status&type` | activities | reads V3Activity |
| /api/v3/entities/[id] | GET | withOrgContext | path id | entity | reads V3Entity |
| /api/v3/entities | GET | withOrgContext | `?type&parentEntityId` | entities | reads V3Entity |
| /api/v3/health | GET, POST | withOrgContext | — | `{status,context}` | none |
| /api/v3/metrics/export | GET | requireAdmin + withOrgContext | `?orgId` (superadmin only, validated) | `{success,contractVersion,metrics[]}` | reads `v3_metric_values`+`v3_metric_definitions`+`v3_entities`+`v3_activities` (messmass#232) |
| /api/v3/metrics/record | POST | withOrgContext + rate limit | `{dataPoints[]}` | `{inserted}` | insertMany V3MetricValue |
| /api/v3/metrics/sync | POST | requireAdmin | — | `{success,definitionsWritten,activitiesEligible,activitiesMaterialized,skipped[]}` | seeds `v3_metric_definitions`, writes `v3_metric_values` from synced activity stats (messmass#232) |
| /api/v3/organizations/report/[id]/activities | GET | validateOrganizationAccess | path org id | org activities | reads V3Activity, V3ActivityParticipant |
| /api/v3/organizations/report/[id] | GET | validateOrganizationAccess | path org id | org report (metrics + layout) | reads V3Organization, V3Entity, metric aggregates |
| /api/v3/reporting/dashboard | GET | withOrgContext | `?entityId&metrics&startDate&endDate` | aggregated metrics | reads V3MetricValue |
| /api/v3/reporting/export/[entityId] | GET | withOrgContext | path entity id | CSV download | aggregates V3MetricValue |
| /api/v3/reports/resolve | GET | withOrgContext | `?activityId\|entityId` | resolved template | reads v3 report config |

## Remaining root routes (56 routes)

| Path | Methods | Auth | Request | Response | Side effects |
|---|---|---|---|---|---|
| /api/activation-templates | GET, POST | requireAdmin | POST `{name,description?,partnerId?,dataFields[]}` | `{success,template\|templates}` | reads/writes `activation_templates` (messmass#228) |
| /api/audience-packs | GET | requireAdmin | — | `{success,packs[]}` | seeds + reads `audience_packs` (messmass#236) |
| /api/audience-packs/[key] | GET, PUT | requireAdmin | PUT `{allowedBlockIds[]}` | `{success,pack}` | reads/writes `audience_packs` |
| /api/activation-templates/[id] | GET | requireAdmin | — | `{success,template,yield}` | reads `activation_templates`; computes yield from `activation_participations` |
| /api/activation-templates/[id]/participations | GET, POST | requireAdmin | POST `{fanIdentityId,responses,occurredAt?}` | `{success,participation\|participations}` | writes `activation_participations` + a `fan_identity_link` (messmass#227) |
| /api/blob-upload-token | POST | requireSession | `{pathname,contentType}` | Vercel Blob client token | none (mints an upload token) |
| /api/derived-variable-config | GET | none (public-by-design) | — | `{success,config}` | reads derived-variable definitions for report rendering |
| /api/export/pdf | GET | none (same-origin path allowlist + rate limit) | `?path=/report/<slug>` | `application/pdf` | launches headless Chromium, renders the report page |
| /api/fan-identities | GET, POST | requireAdmin | POST `{consent}` | `{success,identity\|identities}` | reads/writes `fan_identities` (messmass#227) |
| /api/fan-identities/[id] | GET, DELETE | requireAdmin | — | `{success,identity,links}` | reads `fan_identities`+`fan_identity_links`; DELETE removes both permanently (right-to-deletion) |
| /api/fan-identities/[id]/links | GET, POST | requireAdmin | POST `{linkType,sourceRef,occurredAt,evidence?}` | `{success,link\|links}` | reads/writes `fan_identity_links` |
| /api/fan-identities/[id]/loyalty-balance | GET | requireAdmin | — | `{success,balance}` | reads `loyalty_completions` (messmass#229) |
| /api/fan-identities/merge-candidates | GET, POST | requireAdmin | POST `{identityIdA,identityIdB,evidence}` | `{success,candidate\|candidates}` | reads/writes `fan_identity_merge_candidates` -- flags only, never merges |
| /api/fan-identities/merge-candidates/[id]/approve | POST | requireSuperadmin | — | `{success}` | the one action that actually merges two identities |
| /api/fan-identities/merge-candidates/[id]/reject | POST | requireAdmin | — | `{success}` | closes the candidate without merging |
| /api/auto-generate-chart-block | POST | requireEditorAccess (7d3ef3bb), 401 `EDIT_ACCESS_REQUIRED` | `{type:'image'\|'text',index,value}` | `{success,action,chartId,blockId?}` | insert/update `chart_configurations`, `data_blocks` |
| /api/available-fonts | GET, POST, PUT, DELETE | requireSession (all methods) | `?includeInactive`; bodies; `?id&hardDelete` | `{success,fonts[]}` | insert/update/delete `available_fonts` |
| /api/cities | GET | requireSession | `?countryId` | city list | reads `cities` |
| /api/clicker-sets | GET, POST, PUT, DELETE | GET none (page-password editor read; lazily inserts the default set); POST/PUT/DELETE requireAdmin | bodies; `?clickerSetId` | `{success,sets[]}` | insert/update/delete clicker sets + groups collections |
| /api/client-error | POST | none (public-by-design: anonymous crash reporting, documented in-file) | error report body | `{success}` | server-side structured log only |
| /api/contact | POST | none (public-by-design: public contact form; sanitized + size-limited) | `{name,email,message}` | `{success}` | inserts `contact_inquiries` |
| /api/content-assets | GET, POST, PUT, DELETE | GET none (public asset read for reports); POST/PUT/DELETE requireSession | GET `?type&category&tags&search&sort…`; bodies; DELETE `?id\|slug&force` | `{success,assets[]}` | insert/update/delete `content_assets`; reads `chart_configurations` on delete |
| /api/content-assets/usage | GET | requireSession | `?slug` | usage refs | reads `chart_configurations` |
| /api/countries/[code] | GET | none (public-by-design: reference data) | path code | country | country service |
| /api/countries | GET | none (public-by-design: reference data) | `?region` | country list | country service |
| /api/csrf-token | GET | none (public-by-design: CSRF bootstrap) | — | `{token}` + cookie | sets CSRF cookie |
| /api/data-blocks | GET, POST, PUT, DELETE | requireAdmin, all methods (messmass#386 admin-only read; #400 admin role) | bodies; `?id` | `{success,blocks[]}` | insert/update/delete `data_blocks` |
| /api/data-blocks/duplicate | POST | requireAdmin | `{sourceBlockId,name?}` | `{success,blockId,block}` | inserts a `data_blocks` copy with `sourceBlockId` lineage (messmass#230) |
| /api/debug/categorized-hashtags | GET | requireSession | — | hashtag migration debug data | reads `projects` |
| /api/debug/notifications | GET | getAdminUser | — | notification debug data | reads `notifications` |
| /api/debug/overview-block | GET | requireSession | — | data-block debug dump | reads `data_blocks` |
| /api/drive-folders/[linkId] | PATCH, DELETE | getAdminUser | `?projectId`; PATCH body | `{success}` | update/delete `drive_folder_links` |
| /api/drive-folders | GET, POST | getAdminUser | `?projectId`; POST folder body | `{success,folders[]}` | reads/inserts `drive_folder_links` |
| /api/filter-slug | POST | requireSession | `{hashtags[]}` | `{success,slug}` | mints filter slug (`filter_slugs`) |
| /api/football-data/fixtures | GET | getAdminUser | `?competitionId&partnerId&status&dateFrom&dateTo&limit&offset` | fixtures | reads `football_data_fixtures` |
| /api/football-data/sync | POST | getAdminUser | `{…options}` | `{success,synced}` | outbound football-data.org; writes `football_data_fixtures` |
| /api/google-sheets/template | GET | none (public-by-design: static CSV template) | `?context` | CSV attachment | none |
| /api/grid-settings | GET, PUT | requireSession (both methods) | PUT `{desktopUnits,tabletUnits,mobileUnits}` | `{success,settings}` | updates `settings` |
| /api/landing-static | GET | none (public-by-design: pre-generated landing snapshot) | — | `{staticSnapshot,generatedAt}` | reads `settings` |
| /api/loyalty-missions | GET, POST | requireAdmin | POST `{name,type,pointsPerCompletion,repeatable,partnerId?}` | `{success,mission\|missions}` | reads/writes `loyalty_missions` (messmass#229) |
| /api/loyalty-missions/[id] | GET | requireAdmin | — | `{success,mission,participation}` | reads `loyalty_missions`; computes participation from `loyalty_completions` |
| /api/loyalty-missions/[id]/completions | GET, POST | requireAdmin | POST `{fanIdentityId,occurredAt?}` | `{success,completion\|completions}` | writes `loyalty_completions` + a `fan_identity_link` (messmass#227) |
| /api/notifications/mark-read | PUT | getAdminUser | `{ids?\|all}` | `{success,modified}` | updateMany `notifications` |
| /api/notifications | GET | getAdminUser | `?limit&offset&unreadOnly&archivedOnly&excludeArchived` | notifications | reads `notifications` |
| /api/organizations/edit/[id] | GET, PUT | requireOrgEditPageAccess (route-local: when protected, admin session or an 'organization-edit' grant for the base or variant key; messmass#386) | `?variant`; PUT `{name,metadata,…}` | org edit payload | PUT updates `organizations` |
| /api/organizations/report/[id]/activities | GET | none (public-by-design: shareable org report) | `?variant` | org activities | reads `organizations`, `partners`, `projects` |
| /api/organizations/report/[id] | GET | none (public-by-design: shareable org report) | `?variant` | org report | reads `organizations`, `partners`, `projects` |
| /api/page-passwords | GET, POST, PUT, DELETE | GET/POST/DELETE requireSession then requirePageResourceAccess (status read / minting-revealing / removal: the caller must be able to manage that page — F-009, #376); PUT none (public-by-design: PUT *is* the password check; admin session bypasses) | GET/DELETE `?pageId&pageType`; POST `{pageId,pageType,regenerate?}`; PUT `{pageId,pageType,password}` (pageType `edit`: checked against the event's newest `edit` password across its editSlug and _id) | `{success,…grant}` | reads/writes page-password store (DELETE removes protection); PUT sets access grant |
| /api/paid-campaigns | GET, POST | requireAdmin | POST `{name,platform,projectId,spend,currency,notes?}` | `{success,campaign\|campaigns}` | reads/writes `paid_campaigns` (messmass#226) |
| /api/paid-campaigns/[id] | DELETE | requireAdmin | — | `{success}` | deletes from `paid_campaigns` |
| /api/paid-campaigns/[id]/measurement | GET | requireAdmin | — | `{success,campaign,organicEvidence,costPerBitlyClick}` | reads `paid_campaigns`, `projects`, `bitly_project_links` -- paid spend juxtaposed with real organic evidence, not attributed |
| /api/stakeholder/invite | POST | requireAdmin | `{email,role,scopeType,scopeId}` | `{success,grant,loginUrl}` | writes `stakeholder_grants` (messmass#231) |
| /api/stats | GET | requireSession | `?slug\|id` | redirect or basic info | none |
| /api/user-preferences | GET, PUT | getAdminUser | PUT preferences body | `{success,preferences}` | upserts `user_preferences` |
| /api/variables-config | GET, POST, PUT, DELETE | GET none (read-only metadata, editor read); POST/PUT/DELETE requireAdmin (7d3ef3bb) | bodies; `?action`/`?name` | `{success,variables[]}` | update/delete `variables_metadata` store |
| /api/variables-groups | GET, POST, DELETE | GET none (editor read; lazy default-set insert + legacy backfill); POST/DELETE requireAdmin | `?clickerSetId`; POST body; DELETE `?clickerSetId&groupOrder` | `{success,groups[]}` | insert/update/delete variable groups (+ clicker-set seed) |

## Adjudication of routes with no auth guard

Re-run 2026-09-16 against current code, per HTTP method rather than per file.
Buckets re-checked @ dd34e229 (2026-09-28): unchanged.
CSRF is never counted as a guard: any anonymous caller can fetch the token from
`GET /api/csrf-token`, which is the whole reason `lib/apiGuards.ts` exists.

| | routes |
|---|---:|
| Fully guarded (every method) | **190** |
| Open write method, public by design | **5** |
| Open GET only, writes guarded or absent | **27** |
| **Total** | **222** |

The previous run of this section (2026-08) listed 40 GAP routes, 21 of them
unauthenticated writes. Those are closed: messmass#347 and #386 took the first
tranche, #400 added role checks to routes that authenticated but authorised
nothing, and 7d3ef3bb closed the last five — `/api/hashtag-colors`,
`/api/hashtags`, `/api/hashtag-categories`, `/api/variables-config` and
`/api/auto-generate-chart-block`, three of which were demonstrated live,
not inferred. Of those, `/api/hashtag-categories` was the instructive one: it
was not unguarded, it had a local `validateAdminAccess()` that returned true
whenever an `admin-session` cookie was merely *present*.

### Open write methods — all public by design (5)

| Route | Methods | Why it is open |
|---|---|---|
| `/api/admin/login` | POST, DELETE | Returns 410 Gone; auth is SSO-only. DELETE is self-logout. |
| `/api/admin/register` | POST | Returns 410 Gone. |
| `/api/admin/clear-cookies` | POST | Deletes the caller's own cookies; nothing to protect. |
| `/api/client-error` | POST | Records a crash report. A logged-out visitor can crash too. |
| `/api/contact` | POST | Public contact form, rate-limited by middleware. |

### Open GET only (27)

Each serves an anonymously-reachable surface, or is pre-auth. Where a route
also exposes writes, those writes are guarded — the asymmetry is deliberate:
the page-password editors read these without a session.

| Route | Guarded methods on the same route |
|---|---|
| `/api/auth/sso/callback` | — (read-only route) |
| `/api/auth/sso/config` | — (read-only route) |
| `/api/auth/sso/login` | — (read-only route) |
| `/api/auth/sso/stakeholder-callback` | — (read-only route) |
| `/api/auth/sso/stakeholder-login` | — (read-only route) |
| `/api/chart-config/public` | — (read-only route) |
| `/api/clicker-sets` | POST, PUT, DELETE |
| `/api/content-assets` | POST, PUT, DELETE |
| `/api/countries` | — (read-only route) |
| `/api/countries/[code]` | — (read-only route) |
| `/api/csrf-token` | — (read-only route) |
| `/api/derived-variable-config` | — (read-only route) |
| `/api/export/pdf` | — (read-only route) |
| `/api/google-sheets/template` | — (read-only route) |
| `/api/hashtag-categories` | POST, PUT, DELETE |
| `/api/hashtag-colors` | POST, PUT, DELETE |
| `/api/hashtags` | POST, DELETE |
| `/api/hashtags/[hashtag]` | — (read-only route) |
| `/api/landing-static` | — (read-only route) |
| `/api/organizations/report/[id]` | — (read-only route) |
| `/api/organizations/report/[id]/activities` | — (read-only route) |
| `/api/partners/report/[slug]` | — (read-only route) |
| `/api/report-config/[identifier]` | — (read-only route) |
| `/api/report-styles/[id]` | — (read-only route) |
| `/api/reports/resolve` | — (read-only route) |
| `/api/variables-config` | POST, PUT, DELETE |
| `/api/variables-groups` | POST, DELETE |

Page passwords, where they apply, are enforced by the routes that serve the
protected data via `requirePageAccess` — not by these.

### Corrections to endpoints.json markers found during this pass

- `/api/admin/project-partners`: marker said getAdminUser, but the function was imported and never called — both methods were unauthenticated. Since fixed: both are requireAdmin.
- `/api/content-assets`: marker said getAdminUser, but only POST called it; PUT and DELETE were unauthenticated. Since fixed: POST/PUT/DELETE are requireSession.
- `/api/admin/permissions`, `/api/admin/projects/[id]`: marker scan shows none/getAdminUser, but these actually validate an SSO bearer token against the SSO service — they are guarded. (`/api/admin/projects` and `/api/admin/users` were deleted in 62a47a0d.)
- `/api/report-templates` and all `/api/v3/*` routes: guarded via `withOrgContext`/`validateOrganizationAccess` wrappers (both call getAdminUser), which marker scans that look for direct calls can miss.
- `/api/admin/filter-style`, `/api/admin/hashtag-style`, `/api/admin/ui-settings`, `/api/data-blocks`, `/api/filter-slug`, `/api/partners/upload-logo`, `/api/partners/[id]/google-sheet/*`: guarded by `requireSession` (marker list did not track that guard). The first four have since moved to `requireAdmin` (#400).
