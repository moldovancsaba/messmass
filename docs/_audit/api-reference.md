# messmass API Reference

Generated for the fleet audit (messmass#350); measured against `docs/_audit/endpoints.json` (head 6d28c7f3, 194 endpoints). Every route below was verified by reading its `route.ts` handler, not just the marker scan.

Coverage: 194 of 194 routes documented.

## Cross-cutting behavior (middleware.ts)

Every request passes through, in order: rate limiting, CSRF protection, CORS. CSRF (double-submit cookie + `X-CSRF-Token` header) applies to all mutating `/api/*` methods EXCEPT `/api/admin/login`, `/api/page-passwords`, and `/api/integrations/*` (token-authed server-to-server). Note: the CSRF token is issued to any anonymous caller via `GET /api/csrf-token`, so CSRF is a cross-site hurdle, **not** authentication (this is the documented rationale for `lib/apiGuards.ts`). Page-level auth for `/admin/*` and `/dashboard/*` HTML routes is also enforced in middleware (admin-session cookie, SSO required when `SSO_BASE_URL` is set).

## Auth layers (exact guards)

| Guard | Source | What it proves |
|---|---|---|
| `getAdminUser` | `lib/auth` | Valid admin-session cookie (SSO-backed). Role checks are per-route. |
| `requireSession` | `lib/apiGuards` | Same as getAdminUser, returns 401 response object (F-009 retrofit guard). |
| `requireProjectWrite` | `lib/apiGuards` | Admin session OR page-password edit grant for that one project. |
| `requirePageAccess` | `lib/pageAccess` | Page password grant (or admin session) for a protected page slug. |
| `requireFanmassIntegrationAuth` | `lib/fanmassIntegration` | `FANMASS_INTEGRATION_TOKEN` via Bearer or `x-api-key`; 503 when unconfigured. |
| `assertCameraSecret` | `lib/cameraClient` | Camera provision token via Bearer or `x-camera-secret`; 503 when unconfigured. |
| `requireAPIAuth` | `lib/apiAuth` | Machine Bearer token; rejects any request carrying cookies. |
| `CRON_SECRET` | env, inline | `Authorization: Bearer <CRON_SECRET>`. |
| SSO bearer | inline, `POST <SSO_BASE_URL>/api/validate` | SSO access token validated against the SSO service. |
| `withOrgContext` | `lib/middleware/v3/orgContext`, `lib/v3/middleware` | getAdminUser + injects `x-v3-org-id` scoping header. |
| `validateOrganizationAccess` | `lib/auth/orgGuard` | getAdminUser + org membership check for the requested org. |

## /api/admin (35 routes)

| Path | Methods | Auth | Request | Response | Side effects |
|---|---|---|---|---|---|
| /api/admin/auth | GET | getAdminUser | — | `{success,user}` | none |
| /api/admin/clear-cache | POST | getAdminUser | `{type}` | `{success,message}` | clears in-process caches |
| /api/admin/clear-cookies | GET, POST | none (public-by-design) | — | `{success,message}` | deletes caller's own `admin-session` cookie |
| /api/admin/contact-inquiries | GET | getAdminUser | — | `{success,inquiries[]}` | reads `contact_inquiries` |
| /api/admin/email-selftest | GET | none (public-by-design; rate-limited) | — | `{sent,recipient}` | sends diagnostic email to SUPERADMIN_EMAIL via camera email service |
| /api/admin/fanmass/commands | POST | getAdminUser + role check | `{type,payload?}` | `{success,command}` | inserts `fanmass_commands` |
| /api/admin/fanmass/events/[eventId] | GET, POST | getAdminUser + role check | POST `{fanmassBatchId?,status?,action?('sync'\|'dry-run'),force?}` | `{success,link,sync?}` | upserts `fanmass_event_links`; sync writes project stats |
| /api/admin/fanmass/events | GET | getAdminUser + role check | — | `{success,events[]}` | reads `fanmass_event_links`/`projects` |
| /api/admin/fanmass/snapshot | GET | getAdminUser + role check | `?eventId` | `{success,snapshot}` | reads `fanmass_dashboard_snapshot` |
| /api/admin/filter-style | GET, POST | GET none (public style read); POST requireSession | GET `?hashtags=a,b`; POST `{hashtags[],styleId}` | `{success,styleId…}` | insert/update `filter_slugs` |
| /api/admin/fix-mojibake-text | GET | getAdminUser | `?apply=1` (dry-run default) | scan/repair report | updates mojibake text across multiple collections when applied |
| /api/admin/hashtag-style | GET, POST | GET none (public style read); POST requireSession | GET `?hashtag=`; POST `{hashtag,styleId}` | `{success,styleId…}` | updates `hashtag_slugs` |
| /api/admin/landing-projects | GET | getAdminUser | — | `{success,projects[]}` | reads `projects` |
| /api/admin/landing-settings | GET, PUT | getAdminUser | PUT `{landingReportSlug,…}` | `{success,settings}` | updates `settings` (landing doc) |
| /api/admin/landing-static-generate | POST | getAdminUser | — | `{success,generatedAt}` | reads `report_templates`,`data_blocks`,`partners`,`chart_configurations`; self-fetch of own config API; writes snapshot into `settings` |
| /api/admin/local-users/[id]/api-access | PUT | getAdminUser | `{apiAccessEnabled}` | `{success,user}` | updates `users` |
| /api/admin/local-users/[id] | PUT, DELETE | getAdminUser | PUT `{name,role,…}` | `{success}` | update/delete `users` |
| /api/admin/local-users/[id]/send-email | POST | getAdminUser | `{…email params}` | `{success}` | reads `users`; outbound email via camera service |
| /api/admin/local-users | GET, POST | getAdminUser | GET `?search&limit&offset`; POST `{email,name,role,…}` | `{success,users[]/user}` | inserts `users` |
| /api/admin/login | POST, DELETE | none (public-by-design: auth lifecycle) | — | POST: **410 Gone** (SSO-only); DELETE: logout | DELETE clears session cookies + best-effort SSO token revocation (outbound SSO) |
| /api/admin/organizations/[id]/members | GET, PUT | getAdminUser | PUT `{memberPartnerIds[]}` | `{success,members}` | updates `organizations`, `partners.updateMany`, V3Entity.updateMany |
| /api/admin/organizations/[id] | GET, PUT, PATCH, DELETE | getAdminUser | PUT/PATCH `{name,metadata,…}` | `{success,organization}` | update/delete `organizations`; detaches `partners` on delete |
| /api/admin/organizations | GET, POST | getAdminUser | POST `{name,…}` | `{success,organizations[]/organization}` | inserts `organizations` |
| /api/admin/partners | GET | **none — GAP** | — | `{success,partners[]}` (name + reportTemplateId) | reads `partners` |
| /api/admin/permissions | GET, POST, DELETE | SSO bearer (validated via SSO `/api/validate`) | POST `{userId,projectId,role,…}`; DELETE `?projectId&userId` | `{success,…}` | writes `project_permissions`, `audit_logs` |
| /api/admin/project-partners/auto-suggest | POST | requireSession | — | `{success,updated}` | matches partners to projects by hashtag, updates `projects` |
| /api/admin/project-partners | GET, PUT | **none — GAP** (getAdminUser imported but never called) | PUT `{projectId,partnerIds…}` | `{success,…}` | PUT updates `projects` partner links |
| /api/admin/projects/[id] | DELETE | SSO bearer | path id | `{success}` | deletes from `projects`, inserts `audit_logs` |
| /api/admin/projects | GET, POST | SSO bearer | POST `{eventName,…}` | `{success,projects[]/project}` | inserts `projects` |
| /api/admin/register | POST | none (public-by-design) | — | **410 Gone** (SSO-only) | none |
| /api/admin/sync-events-to-camera | GET | getAdminUser | — | `{success,synced}` | reads `projects`; outbound POSTs to camera internal API |
| /api/admin/sync-partners-to-camera | GET | getAdminUser | — | `{success,synced}` | reads `partners`; outbound POSTs to camera internal API |
| /api/admin/ui-settings | GET, PUT | GET isAuthenticated (admin session); PUT requireSession | PUT `{fontFamily,…}` | `{success,settings}` | updates `settings` (typography), reads `available_fonts` |
| /api/admin/users/[id]/role | PUT | getAdminUser (role-checked) | `{role}` | `{success}` | updates `users` |
| /api/admin/users | GET, PUT | SSO bearer | PUT `{userId,role,…}` | proxied SSO response | proxies to SSO `/api/admin/users` (outbound) |

## /api/analytics (24 routes)

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
| /api/analytics/benchmarks | GET | **none — GAP** | `?category&metric&period` | benchmark stats | reads `analytics_aggregates` |
| /api/analytics/compare/partners | GET | **none — GAP** | `?partnerIds&metrics` | comparison series | reads `partner_analytics` |
| /api/analytics/compare/periods | GET | **none — GAP** | `?periodA&periodB&bucket&partnerId` | period deltas | reads `analytics_aggregates` |
| /api/analytics/compare | GET | **none — GAP** | `?projectIds&metrics` | comparison series | reads `analytics_aggregates` |
| /api/analytics/event/[projectId] | GET | **none — GAP** | `?includeBitly&includeRaw` | event analytics | reads `analytics_aggregates` |
| /api/analytics/executive/insights | GET | **none — GAP** | `?priority&limit&period` | executive insights | reads `analytics_aggregates` |
| /api/analytics/executive/metrics | GET | **none — GAP** | `?period` | portfolio KPIs | reads `analytics_aggregates` |
| /api/analytics/executive/top-events | GET | **none — GAP** | `?period&limit&sortBy` | top events | reads `analytics_aggregates` |
| /api/analytics/insights/[projectId] | GET | **none — GAP** | `?includeRecommendations&severity` | per-event insights | reads `analytics_aggregates` |
| /api/analytics/insights/organizations/[orgId] | GET | getAdminUser | — | org insights | computed via insights engine |
| /api/analytics/insights/partners/[partnerId] | GET | getAdminUser | — | partner insights | computed via insights engine |
| /api/analytics/insights | GET | getAdminUser | `?type&severity&limit&since` | portfolio insights | reads `projects` |
| /api/analytics/insights/summary | GET | getAdminUser | `?partnerId&period&maxEvents` | insight summary | reads `analytics_aggregates` |
| /api/analytics/partner/[partnerId] | GET | **none — GAP** | `?timeframe&includeEvents` | partner analytics | reads `analytics_aggregates`, `partners` |
| /api/analytics/sponsorship-hub | GET | getAdminUser | `?scopeType&scopeId&rangePreset` | sponsorship hub data | reads via `lib/sponsorshipHub` |
| /api/analytics/trends | GET | **none — GAP** | `?startDate&endDate&partnerId&metrics&groupBy` | trend series | reads `analytics_aggregates` |

## /api/api-football (1 route)

| Path | Methods | Auth | Request | Response | Side effects |
|---|---|---|---|---|---|
| /api/api-football/enrich-partners | GET, POST | getAdminUser | POST triggers enrichment | `{success,log/status}` | outbound API-Football; updates `partners`, inserts `api_football_enrichment_log` |

## /api/auth (4 routes)

| Path | Methods | Auth | Request | Response | Side effects |
|---|---|---|---|---|---|
| /api/auth/check | GET | getAdminUser | — | `{authenticated,user?}` | none |
| /api/auth/sso/callback | GET | none (public-by-design: OAuth callback) | `?code&state&error` | 302 redirect | outbound SSO token exchange; sets session + `sso-tokens` cookies; best-effort camera SSO propagation |
| /api/auth/sso/config | GET | none (public-by-design) | — | public SSO client config | none |
| /api/auth/sso/login | GET | none (public-by-design: OAuth initiation) | `?redirect_uri&from_logout` | 302 to SSO authorize URL | sets state/PKCE cookies |

## /api/bitly (9 routes)

| Path | Methods | Auth | Request | Response | Side effects |
|---|---|---|---|---|---|
| /api/bitly/analytics/[linkId] | GET | getAdminUser | `?refresh&format` | link analytics | reads `bitly_links`; on refresh, outbound Bitly API + findOneAndUpdate `bitly_links` |
| /api/bitly/associations | DELETE | getAdminUser | `?bitlyLinkId&projectId` | `{success}` | deletes from `bitly_project_links` |
| /api/bitly/links/[linkId] | PUT, DELETE | getAdminUser | PUT `UpdateLinkInput`; DELETE `?hard` | `{success,link?}` | updates/deletes `bitly_links` (soft-delete default) |
| /api/bitly/links | GET, POST | getAdminUser | GET `?search&projectId&includeAnalytics&…`; POST `AssociateLinkInput` | `{success,links[]/link}` | inserts `bitly_links`; reads `projects`, `bitly_project_links`, `partners` |
| /api/bitly/partners/associate | POST, DELETE | getAdminUser | POST `{bitlyLinkId,partnerId}`; DELETE query params | `{success}` | updates `partners` |
| /api/bitly/project-metrics/[projectId] | GET | none (public-by-design: report page metrics) | path id | per-project bitly metrics | reads `projects`, `bitly_project_links`, `bitly_links` |
| /api/bitly/pull | POST | getAdminUser | `{groupGuid?,…}` | `{success,imported}` | outbound Bitly; insertMany `bitly_links` |
| /api/bitly/recalculate | GET, POST | **none — GAP** | POST `{mode:'bitlink'\|'project'\|'all',bitlyLinkId?,projectId?}` | `{success,…counts}` | recalculates date ranges/cached metrics (writes via `lib/bitly-recalculator`) |
| /api/bitly/sync | POST | CRON_SECRET bearer OR getAdminUser | `{…options}` | `{success,synced}` | outbound Bitly; updates `bitly_links`, inserts `bitly_sync_logs` |

## Charts and chart config (5 routes)

| Path | Methods | Auth | Request | Response | Side effects |
|---|---|---|---|---|---|
| /api/chart-config/public | GET | none (public-by-design: report rendering) | — | active chart configs | reads `chart_configurations` |
| /api/chart-config | GET, POST, PUT, DELETE | getAdminUser (all methods) | `?search&limit&offset&sort…`; POST/PUT config body; DELETE `?configurationId` | `{success,…}` | insert/update/delete `chart_configurations` |
| /api/chart-configs | GET | none (public-by-design: report rendering) | — | chart config list | reads `chart_configurations` |
| /api/chart-formatting-defaults | GET, PUT | GET none (public read); PUT **none — GAP** | PUT `{defaults}` | `{success,defaults}` | updates `chart_formatting_defaults` |
| /api/charts | GET, POST, DELETE | GET none (read); POST/DELETE **none — GAP** | GET `?chartIds&isActive&type`; POST chart body; DELETE `?chartId` | `{success,charts[]}` | upserts/deletes `charts` |

## /api/cron (3 routes)

| Path | Methods | Auth | Request | Response | Side effects |
|---|---|---|---|---|---|
| /api/cron/analytics-aggregation | GET, POST | CRON_SECRET bearer OR getAdminUser (requires admin when secret unset — fails closed) | POST `?force`; GET `?limit` (job history) | `{success,job/jobs}` | inserts/updates `aggregation_jobs`; rebuilds `analytics_aggregates` |
| /api/cron/bitly-refresh | GET, POST | CRON_SECRET **only when set — open when unset (GAP caveat)** | — | `{success,refreshed}` | refreshes bitly cached metrics (writes via lib) |
| /api/cron/google-sheets-sync | GET | CRON_SECRET (503 in production when unset — fails closed) | — | `{success,synced}` | outbound Google Sheets API; insert/update `projects`, updates `partners` sync state |

## /api/integrations/camera (4 routes)

| Path | Methods | Auth | Request | Response | Side effects |
|---|---|---|---|---|---|
| /api/integrations/camera/link-partners | POST | requireFanmassIntegrationAuth | link payload | `{success,…}` | links partners to camera orgs (writes `partners`) |
| /api/integrations/camera/partners | POST | assertCameraSecret | partner payload | `{success,partner}` | upserts partner link data from camera |
| /api/integrations/camera/provision-missing | POST | requireFanmassIntegrationAuth | `?limit` | `{success,provisioned}` | outbound camera provisioning API; updates `partners` |
| /api/integrations/camera/sso-session | POST | assertCameraSecret | session payload | `{success}` | mints/propagates SSO session state (camera to messmass) |

## /api/integrations/fanmass (15 routes)

All 15 use `requireFanmassIntegrationAuth` (Bearer/`x-api-key` shared token) and are CSRF-exempt. Store: `fanmass_event_links`, `fanmass_commands`, `fanmass_dashboard_snapshot`, `drive_folder_links`, `ai_rescan_requests`, `ai_analysis_summaries`, `variables_metadata`, plus `projects`/`partners`/`organizations`.

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
| /api/hashtag-categories | GET, POST, PUT, DELETE | GET none (public read for rendering); writes **none — GAP** | `?search&limit&offset`; bodies; DELETE `?id` | `{success,categories[]}` | insert/update/delete `hashtag_categories`; reads `projects` |
| /api/hashtag-colors | GET, POST, PUT, DELETE | GET none (public read); writes **none — GAP** | POST `{name,color}`; PUT `{_id,name,color}`; DELETE `?id` | `{success,colors[]}` | insert/update/delete `hashtag_colors` |
| /api/hashtags/[hashtag] | GET | **none — GAP** (bypasses the page-password layer that filter-by-slug enforces) | `?variant` | aggregated hashtag stats | reads `projects`, `hashtag_slugs` |
| /api/hashtags/filter | GET, POST | none (public-by-design: filter page stats, read-only) | GET `?tags=`; POST `{hashtags[]}` | filtered aggregate stats | reads `projects` |
| /api/hashtags/filter-by-slug/[slug] | GET | requirePageAccess('filter', slug) | `?variant` | filter stats | reads `projects` |
| /api/hashtags | GET, POST, DELETE | GET none (read-only counts); POST/DELETE **none — GAP** (DELETE cascades) | GET `?search&limit&offset`; POST `{hashtag}`; DELETE `?hashtag&mode=cascade` | `{success,hashtags[]}` | DELETE cascade: updateMany `projects`/`partners`, deletes `hashtag_colors`, `hashtags`, `hashtag_slugs` |
| /api/hashtags/slugs | GET | **none — GAP** (discloses slugs that act as capability URLs; lazily inserts) | — | hashtag→slug map | reads `projects`; inserts missing `hashtag_slugs` |

## /api/partners (17 routes)

| Path | Methods | Auth | Request | Response | Side effects |
|---|---|---|---|---|---|
| /api/partners/[id]/bitly-kyc | GET | getAdminUser | path id | KYC metrics | reads `projects` |
| /api/partners/[id]/events | GET | none (public-by-design: partner report page) | path id | partner's events | reads `partners`, `projects` |
| /api/partners/[id]/google-sheet/connect | POST | requireSession | `ConnectRequest` | `{success}` | outbound Google Sheets; updates `partners` |
| /api/partners/[id]/google-sheet/disconnect | DELETE | requireSession | path id | `{success}` | updates `partners` (removes config) |
| /api/partners/[id]/google-sheet/provision | POST | requireSession | options | `{success,sheetId}` | outbound Google Sheets (creates sheet); updates `partners` |
| /api/partners/[id]/google-sheet/pull | POST | requireSession | `PullRequest` | `{success,imported}` | outbound Google Sheets; insertMany/update `projects`, updates `partners` |
| /api/partners/[id]/google-sheet/push | POST | requireSession | `PushRequest` | `{success,pushed}` | outbound Google Sheets; updates `projects`, `partners` |
| /api/partners/[id]/google-sheet/rename | POST | requireSession | `{title}` | `{success}` | outbound Google Sheets; updates `partners` |
| /api/partners/[id]/google-sheet/setup | POST | requireSession | setup body | `{success}` | outbound Google Sheets; updates `partners` |
| /api/partners/[id]/google-sheet/status | GET | requireSession | `?checkHealth` | connection status + sheet URL | reads `partners`; optional outbound health probe |
| /api/partners/edit/[slug] | GET, PUT | **none — GAP** (no requirePageAccess despite 'partner-edit' page-password type existing) | PUT content body; `?variant` | partner edit data | PUT updates partner content |
| /api/partners/link-football-data | POST | getAdminUser | `{partnerId,teamId,…}` | `{success}` | updates `partners` |
| /api/partners/report/[slug] | GET | none (public-by-design: shareable slug-keyed report) | `?variant` | partner report data | reads `projects` |
| /api/partners | GET, POST, PUT, DELETE | **none — GAP** (full unauthenticated CRUD) | GET `?limit&offset&sort&search`; POST/PUT bodies; DELETE `?partnerId` | `{success,partners[]}` | insert/update/delete `partners` |
| /api/partners/upload-logo | POST | requireSession | `{badgeUrl,partnerName}` | `{success,logoUrl}` | outbound ImgBB upload |

## /api/projects (4 routes)

| Path | Methods | Auth | Request | Response | Side effects |
|---|---|---|---|---|---|
| /api/projects/[id] | GET, PUT, DELETE | **none — GAP** (the guarded path is /api/projects; this id-variant never got the F-009 retrofit) | PUT full update body | `{success,project}` | update/delete `projects` |
| /api/projects/edit/[slug] | GET | requirePageAccess('edit', slug) | path slug | editor payload | none |
| /api/projects | GET, POST, PUT, DELETE | GET **none — GAP** (lists all events); POST requireSession; PUT requireProjectWrite (admin OR page-password edit grant); DELETE requireSession | GET `?projectId&limit&cursor&q&offset&sort…`; POST/PUT project bodies; DELETE `?projectId` | `{success,projects[]/project}` | insert/update/delete `projects`; maintains `hashtags` counts; reads `partners`, `report_styles` |
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
| /api/report-styles | GET, POST, PUT, DELETE | GET none (public read); writes **none — GAP** | POST/PUT style bodies; `?id` | `{success,styles[]}` | insert/update/delete `report_styles` |
| /api/report-templates/assign | POST, DELETE | getAdminUser | POST `{templateId,projectIds?,partnerIds?}`; DELETE `?projectIds&partnerIds` | `{success,updated}` | updateMany `projects`, `partners` |
| /api/report-templates | GET, POST, PUT, DELETE | withOrgContext → getAdminUser (all methods) | `?type&includeDefault&includeAssociations`; bodies; `?templateId` | `{success,templates[]}` | insert/update/delete `report_templates` |
| /api/report-variants/[id] | GET, PUT | getAdminUser | PUT variant body | `{success,variant}` | reads/updates `report_variants` |
| /api/report-variants | GET, POST | getAdminUser | `?ownerType&ownerId`; POST variant body | `{success,variants[]}` | inserts `report_variants` |
| /api/reports/resolve | GET | none (public-by-design: report resolution for rendering) | `?projectId\|partnerId` | `{success,report,resolvedFrom}` | reads template hierarchy |

## /api/sports-db (5 routes)

| Path | Methods | Auth | Request | Response | Side effects |
|---|---|---|---|---|---|
| /api/sports-db/fixtures/draft | POST | getAdminUser | fixture draft body | `{success,draft}` | creates draft events from fixtures |
| /api/sports-db/fixtures | GET | getAdminUser | `?partnerId&homeOnly&teamId&dateFrom&dateTo&status&limit&offset` | fixtures list | reads `sportsdb_fixtures` |
| /api/sports-db/lookup | GET, POST, PUT, DELETE | GET **none — GAP** (unauthenticated proxy spends server API quota); POST/PUT/DELETE are 405 stubs | `?type&id` | TheSportsDB lookup result | outbound TheSportsDB |
| /api/sports-db/search | GET, POST, PUT, DELETE | GET **none — GAP** (same proxy concern); POST/PUT/DELETE are 405 stubs | `?type&query` | TheSportsDB search result | outbound TheSportsDB |
| /api/sports-db/sync | POST | getAdminUser | — | `{success,sync,matched}` | outbound TheSportsDB; writes `sportsdb_fixtures`, matches to `partners` |

## /api/v3 (12 routes)

All wrapped in `withOrgContext` (getAdminUser + `x-v3-org-id` injection) except the two org-report routes, which use `validateOrganizationAccess` (getAdminUser + org membership). Data layer is Mongoose (v3_* models).

| Path | Methods | Auth | Request | Response | Side effects |
|---|---|---|---|---|---|
| /api/v3/activities/[id]/participants/[entityId] | DELETE | withOrgContext | path ids | `{message}` | deletes V3ActivityParticipant |
| /api/v3/activities/[id]/participants | GET, POST | withOrgContext | POST `{entityId,role,metadata}` | participants | upserts V3ActivityParticipant |
| /api/v3/activities | GET | withOrgContext | `?ownerEntityId&status&type` | activities | reads V3Activity |
| /api/v3/entities/[id] | GET | withOrgContext | path id | entity | reads V3Entity |
| /api/v3/entities | GET | withOrgContext | `?type&parentEntityId` | entities | reads V3Entity |
| /api/v3/health | GET, POST | withOrgContext | — | `{status,context}` | none |
| /api/v3/metrics/record | POST | withOrgContext + rate limit | `{dataPoints[]}` | `{inserted}` | insertMany V3MetricValue |
| /api/v3/organizations/report/[id]/activities | GET | validateOrganizationAccess | path org id | org activities | reads V3Activity, V3ActivityParticipant |
| /api/v3/organizations/report/[id] | GET | validateOrganizationAccess | path org id | org report (metrics + layout) | reads V3Organization, V3Entity, metric aggregates |
| /api/v3/reporting/dashboard | GET | withOrgContext | `?entityId&metrics&startDate&endDate` | aggregated metrics | reads V3MetricValue |
| /api/v3/reporting/export/[entityId] | GET | withOrgContext | path entity id | CSV download | aggregates V3MetricValue |
| /api/v3/reports/resolve | GET | withOrgContext | `?activityId\|entityId` | resolved template | reads v3 report config |

## Remaining root routes (34 routes)

| Path | Methods | Auth | Request | Response | Side effects |
|---|---|---|---|---|---|
| /api/auto-generate-chart-block | POST | **none — GAP** | `{variable,…}` | `{success,chartId,blockId?}` | insert/update `chart_configurations`, `data_blocks` |
| /api/available-fonts | GET, POST, PUT, DELETE | GET none (public font list for rendering); writes **none — GAP** | `?includeInactive`; bodies; `?id&hardDelete` | `{success,fonts[]}` | insert/update/delete `available_fonts` |
| /api/cities | GET | none (public-by-design: reference data) | `?countryId` | city list | reads `cities` |
| /api/clicker-sets | GET, POST, PUT, DELETE | GET none (read); writes **none — GAP** | bodies; `?clickerSetId` | `{success,sets[]}` | insert/update/delete clicker sets + groups collections |
| /api/client-error | POST | none (public-by-design: anonymous crash reporting, documented in-file) | error report body | `{success}` | server-side structured log only |
| /api/contact | POST | none (public-by-design: public contact form; sanitized + size-limited) | `{name,email,message}` | `{success}` | inserts `contact_inquiries` |
| /api/content-assets | GET, POST, PUT, DELETE | GET none (public asset read for reports); POST getAdminUser; PUT/DELETE **none — GAP** | GET `?type&category&tags&search&sort…`; bodies; DELETE `?id\|slug&force` | `{success,assets[]}` | insert/update/delete `content_assets`; reads `chart_configurations` on delete |
| /api/content-assets/usage | GET | **none — GAP** (low: read-only usage lookup) | `?slug` | usage refs | reads `chart_configurations` |
| /api/countries/[code] | GET | none (public-by-design: reference data) | path code | country | country service |
| /api/countries | GET | none (public-by-design: reference data) | `?region` | country list | country service |
| /api/csrf-token | GET | none (public-by-design: CSRF bootstrap) | — | `{token}` + cookie | sets CSRF cookie |
| /api/data-blocks | GET, POST, PUT, DELETE | GET none (public read for report rendering); POST/PUT/DELETE requireSession | bodies; `?id` | `{success,blocks[]}` | insert/update/delete `data_blocks` |
| /api/debug/categorized-hashtags | GET | **none — GAP** (debug endpoint) | — | hashtag migration debug data | reads `projects` |
| /api/debug/notifications | GET | getAdminUser | — | notification debug data | reads `notifications` |
| /api/debug/overview-block | GET | **none — GAP** (debug endpoint) | — | data-block debug dump | reads `data_blocks` |
| /api/drive-folders/[linkId] | PATCH, DELETE | getAdminUser | `?projectId`; PATCH body | `{success}` | update/delete `drive_folder_links` |
| /api/drive-folders | GET, POST | getAdminUser | `?projectId`; POST folder body | `{success,folders[]}` | reads/inserts `drive_folder_links` |
| /api/filter-slug | POST | requireSession | `{hashtags[]}` | `{success,slug}` | mints filter slug (`filter_slugs`) |
| /api/football-data/fixtures | GET | getAdminUser | `?competitionId&partnerId&status&dateFrom&dateTo&limit&offset` | fixtures | reads `football_data_fixtures` |
| /api/football-data/sync | POST | getAdminUser | `{…options}` | `{success,synced}` | outbound football-data.org; writes `football_data_fixtures` |
| /api/google-sheets/template | GET | none (public-by-design: static CSV template) | `?context` | CSV attachment | none |
| /api/grid-settings | GET, PUT | GET none (public layout config); PUT **none — GAP** (in-file comment admits auth deferred) | PUT `{desktopUnits,tabletUnits,mobileUnits}` | `{success,settings}` | updates `settings` |
| /api/images | GET | none (public-by-design: report images) | `?projectId\|slug` | image URL list | reads `projects` |
| /api/landing-report | GET | none (public-by-design: landing page content) | — | landing report payload | reads `projects`, `report_templates`, `data_blocks`, `chart_configurations`, `report_styles`, `partners` |
| /api/landing-static | GET | none (public-by-design: pre-generated landing snapshot) | — | `{staticSnapshot,generatedAt}` | reads `settings` |
| /api/me | GET | none (public-by-design: session probe, returns cookie-derived booleans only) | — | `{authenticated,user?}` | none |
| /api/notifications/mark-read | PUT | getAdminUser | `{ids?\|all}` | `{success,modified}` | updateMany `notifications` |
| /api/notifications | GET | getAdminUser | `?limit&offset&unreadOnly&archivedOnly&excludeArchived` | notifications | reads `notifications` |
| /api/organizations/edit/[id] | GET, PUT | **none — GAP** (no requirePageAccess despite 'organization-edit' page-password type existing) | `?variant`; PUT `{name,metadata,…}` | org edit payload | PUT updates `organizations` |
| /api/organizations/report/[id]/activities | GET | none (public-by-design: shareable org report) | `?variant` | org activities | reads `organizations`, `partners`, `projects` |
| /api/organizations/report/[id] | GET | none (public-by-design: shareable org report) | `?variant` | org report | reads `organizations`, `partners`, `projects` |
| /api/page-passwords | POST, PUT | POST requireSession (minting/revealing passwords — F-009 fix documented in-file); PUT none (public-by-design: PUT *is* the password check; admin session bypasses) | `{pageId,pageType,password?/regenerate?}` | `{success,…grant}` | reads/writes page-password store; PUT sets access grant |
| /api/stats | GET | none (public-by-design: redirect helper into the guarded stats route) | `?slug\|id` | redirect or basic info | none |
| /api/user-preferences | GET, PUT | getAdminUser | PUT preferences body | `{success,preferences}` | upserts `user_preferences` |
| /api/variables-config | GET, POST, PUT, DELETE | GET none (read-only metadata); writes **none — GAP** | bodies; `?action`/`?name` | `{success,variables[]}` | update/delete `variables_metadata` store |
| /api/variables-groups | GET, POST, DELETE | GET none (read); writes **none — GAP** | `?clickerSetId`; POST body; DELETE `?clickerSetId&groupOrder` | `{success,groups[]}` | insert/update/delete variable groups (+ clicker-set seed) |

## Adjudication of routes with no auth guard

Every route with at least one unauthenticated method was adjudicated. CSRF alone was never counted as a guard (any anonymous caller can obtain the token). Total: 34 public-by-design, 40 GAP, 120 fully guarded.

### Public-by-design (34 routes)

Auth lifecycle and stubs: `/api/admin/login` (410 + self-logout), `/api/admin/register` (410), `/api/admin/clear-cookies` (self-service), `/api/auth/sso/login`, `/api/auth/sso/callback`, `/api/auth/sso/config`, `/api/csrf-token`, `/api/me`, `/api/page-passwords` (PUT is the gate itself), `/api/admin/email-selftest` (fixed recipient, rate-limited, documented).

Public report/landing rendering (read-only): `/api/chart-config/public`, `/api/chart-configs`, `/api/data-blocks` (GET), `/api/report-config/[identifier]`, `/api/report-styles/[id]`, `/api/reports/resolve`, `/api/images`, `/api/landing-report`, `/api/landing-static`, `/api/stats`, `/api/bitly/project-metrics/[projectId]`, `/api/hashtags/filter`, `/api/admin/filter-style` (GET), `/api/admin/hashtag-style` (GET).

Shareable slug/id-keyed report pages: `/api/partners/report/[slug]`, `/api/partners/[id]/events`, `/api/organizations/report/[id]`, `/api/organizations/report/[id]/activities`.

Reference data and public forms: `/api/countries`, `/api/countries/[code]`, `/api/cities`, `/api/google-sheets/template`, `/api/contact`, `/api/client-error`.

### GAP — deprecation/hardening candidates (40 routes)

Unauthenticated writes (highest priority):
1. `/api/partners` — full CRUD on partners with no guard.
2. `/api/projects/[id]` — GET/PUT/DELETE with no guard; the F-009 retrofit covered `/api/projects` but not this id-variant. Anyone can update or delete any event by id.
3. `/api/organizations/edit/[id]` — unauthenticated org content editing ('organization-edit' page-password type exists but is not enforced here).
4. `/api/partners/edit/[slug]` — unauthenticated partner content editing ('partner-edit' type exists but is not enforced here).
5. `/api/admin/project-partners` — endpoints.json marks it getAdminUser, but the import is never called; PUT rewrites project↔partner links unauthenticated.
6. `/api/hashtags` — POST/DELETE unauthenticated; DELETE cascades across `projects`, `partners`, `hashtag_colors`, `hashtags`, `hashtag_slugs`.
7. `/api/auto-generate-chart-block` — unauthenticated writes to `chart_configurations`/`data_blocks`.
8. `/api/charts` — POST/DELETE unauthenticated.
9. `/api/report-styles` — POST/PUT/DELETE unauthenticated.
10. `/api/hashtag-categories` — writes unauthenticated.
11. `/api/hashtag-colors` — writes unauthenticated.
12. `/api/available-fonts` — writes unauthenticated.
13. `/api/clicker-sets` — writes unauthenticated.
14. `/api/variables-config` — writes unauthenticated.
15. `/api/variables-groups` — writes unauthenticated.
16. `/api/chart-formatting-defaults` — PUT unauthenticated (public GET is fine).
17. `/api/grid-settings` — PUT unauthenticated (in-file comment concedes auth was deferred).
18. `/api/content-assets` — PUT/DELETE unauthenticated (POST is guarded; asymmetry looks accidental).
19. `/api/bitly/recalculate` — unauthenticated trigger for expensive recalculation (write side effects via recalculator).
20. `/api/hashtags/slugs` — lazily inserts slug docs AND discloses slugs that function as capability URLs for protected pages.
21. `/api/cron/bitly-refresh` — guarded only when CRON_SECRET is set; open when unset (contrast: the sheets-sync cron fails closed in production — same treatment needed).

Unauthenticated reads exposing business data (medium priority):
22. `/api/analytics/benchmarks`
23. `/api/analytics/compare`
24. `/api/analytics/compare/partners`
25. `/api/analytics/compare/periods`
26. `/api/analytics/event/[projectId]`
27. `/api/analytics/executive/insights`
28. `/api/analytics/executive/metrics`
29. `/api/analytics/executive/top-events`
30. `/api/analytics/insights/[projectId]`
31. `/api/analytics/partner/[partnerId]`
32. `/api/analytics/trends`
   — eleven analytics routes serve aggregated business KPIs with no session, while the sibling `/api/analytics/insights*` and `/api/analytics/aggregates*` routes all require getAdminUser. The split looks accidental, not designed.
33. `/api/projects` — GET lists every event unauthenticated (writes are guarded).
34. `/api/admin/partners` — unauthenticated partner list under the /admin prefix.
35. `/api/hashtags/[hashtag]` — raw-name hashtag stats bypass the page-password layer that `/api/hashtags/filter-by-slug/[slug]` enforces.
36. `/api/debug/categorized-hashtags` — debug endpoint left open.
37. `/api/debug/overview-block` — debug endpoint left open.
38. `/api/content-assets/usage` — low-severity read-only admin helper.
39. `/api/sports-db/lookup` — unauthenticated proxy spending the server's TheSportsDB quota.
40. `/api/sports-db/search` — same proxy concern.

### Corrections to endpoints.json markers found during this pass

- `/api/admin/project-partners`: marker says getAdminUser, but the function is imported and never called — both methods are unauthenticated.
- `/api/content-assets`: marker says getAdminUser, but only POST calls it; PUT and DELETE are unauthenticated.
- `/api/admin/permissions`, `/api/admin/projects`, `/api/admin/projects/[id]`, `/api/admin/users`: marker scan shows none/getAdminUser, but these actually validate an SSO bearer token against the SSO service — they are guarded.
- `/api/report-templates` and all `/api/v3/*` routes: guarded via `withOrgContext`/`validateOrganizationAccess` wrappers (both call getAdminUser), which marker scans that look for direct calls can miss.
- `/api/admin/filter-style`, `/api/admin/hashtag-style`, `/api/admin/ui-settings`, `/api/data-blocks`, `/api/filter-slug`, `/api/partners/upload-logo`, `/api/partners/[id]/google-sheet/*`: guarded by `requireSession` (marker list did not track that guard).
