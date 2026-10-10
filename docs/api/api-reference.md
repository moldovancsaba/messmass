# 📡 API Reference
Status: Active
Last Updated: 2026-09-28T12:00:00.000Z
Canonical: Yes
Owner: Backend

**Version:** 12.3.41
**Last Updated:** 2026-09-28T12:00:00.000Z (UTC)
**Status:** Production

Quick API reference for {messmass}. See detailed guides for complete schemas and examples.

> **Complete coverage-measured reference:** for every endpoint under `app/api/` (all 333 method-endpoints across 221 route files) with its auth layer, request/response shape, and side effects, see [api-reference-complete.md](api-reference-complete.md) (messmass#350). This quick reference is the curated subset.

---

## Base URL

```
https://messmass.com/api
```

## Authentication

All admin endpoints require session authentication via the HTTP-only `admin-session`
cookie. Interactive sign-in is **DoneIsBetter SSO only** (OAuth2 authorization-code).

**Login**: `GET /api/auth/sso/login` (redirects into the SSO authorization-code flow;
the callback `/api/auth/sso/callback` mints the session). The old
`POST /api/admin/login` is retired and returns **410 Gone**.
**Logout**: `DELETE /api/admin/login`

Being signed in is not always enough. `requireAdmin` in `lib/apiGuards.ts` also requires role
`admin` or `superadmin` (403 otherwise), and some routes are superadmin-only.

### Public API Bearer keys (`/api/public/*` only)

`requireAPIAuth` in `lib/apiAuth.ts` guards the four `/api/public/*` routes and nothing else.
Send `Authorization: Bearer <api-key>`. The key is matched against the user's bcrypt
`apiKeyHash`, and the account must have `apiKeyEnabled: true`. A request that carries any
`Cookie` header is rejected (401 `COOKIES_NOT_ALLOWED`). Login passwords are not accepted as
API keys (6f31990d, #397). Keys are issued by `POST /api/admin/local-users/[id]/api-access`,
which is admin/superadmin only; only a superadmin can manage a superadmin's key. The plaintext
key is returned once. `PUT` on the same path toggles `apiKeyEnabled`. `apiWriteEnabled` gates
writes through `requireAPIWriteAuth` (403 `WRITE_ACCESS_DISABLED`), but no route calls it at
dd34e229: every `/api/public/*` route is read-only. Full flow and error codes:
[api-public.md](api-public.md).

### Stakeholder session (#231)

External stakeholders (sponsor, agency, media, operator) sign in through the same SSO client,
but on a separate flow that never creates an admin session:

1. An admin records the invite with `POST /api/stakeholder/invite`
   (`{ email, role, scopeType, scopeId }`, admin/superadmin). This upserts a
   `stakeholder_grants` row and returns `loginUrl: /api/auth/sso/stakeholder-login`.
   Nothing is emailed.
2. `GET /api/auth/sso/stakeholder-login` redirects to SSO. It is rate-limited to 5 per 15 min
   per client and sets the `messmass_stakeholder_pending` state cookie.
3. `GET /api/auth/sso/stakeholder-callback` exchanges the code and looks up the verified email
   in `stakeholder_grants`, ignoring revoked grants. It does not check SSO staff permission.
   On a match it marks the grant `active` and sets the `stakeholder-session` cookie, then
   redirects to the granted report (`/partner-report/…`, `/organization-report/…`,
   `/hashtag/…` or `/filter/…`). The cookie is an HS256 JWT signed with `JWT_SECRET`, lasts
   30 days and carries `grantId, email, role, scopeType, scopeId`. If no grant matches, the
   callback redirects to `/stakeholder-access?error=not_invited`.

The guard for this session is `requireStakeholderRole(request, roles)` in `lib/apiGuards.ts`.
It returns 401 without a valid session and 403 when the role is not allowed. The calling
route must still compare `session.scopeId` with the resource it serves. At dd34e229 no API
route calls this guard, so a stakeholder session does not unlock any endpoint yet.

**See**: [AUTHENTICATION.md](../features/features-authentication.md) for details

---

## Projects API

### GET /api/projects
List projects with pagination, search, and sorting.

**Query Params**: `limit`, `cursor`, `q` (search), `offset`, `sortField`, `sortOrder`, `projectId` (single-project lookup)

### POST /api/projects
Create new project.

**Body**: `{ eventName, eventDate, stats, hashtags?, categorizedHashtags? }`

### PUT /api/projects
Update existing project. This is the event editor's save.

**Body**: `{ projectId, statsChanges?, statsRemoved?, statsIncrements?, hashtags?, categorizedHashtags?, tabId?, clientSeq? }`, or the older whole-`stats` form (never both). Every field is optional except `projectId` (the 24-hex id, as a string): a field left out keeps its stored value. `statsChanges` sets or (null) removes single stats, `statsIncrements` adds a whole number to a counter (the editor's clicker taps; needs `tabId` + `clientSeq`). Admin and superadmin sessions may also send `eventName`, `eventDate`, `styleId`, `reportTemplateId`, `partner1Id`, `partner2Id`.

**Auth**: admin session, or the `page-access` grant for this event's edit link (issued by its edit password, or by opening an editor that has no password through its edit link). Anyone but an admin or superadmin -- a grant holder, or a signed-in account with another role -- changes stats and hashtags only; the other fields in the body are ignored. Without either: 401 `EDIT_ACCESS_REQUIRED`.

**Checks**: malformed hashtag lists (not a list of non-empty texts; a category that is not a list) are refused with 400 before anything is written. With `tabId` + `clientSeq`, a save older than one already stored from the same tab, or the same save arriving twice, stores nothing and answers `{ success: true, stale: true }`. Full rules: [api-reference-complete.md](api-reference-complete.md).

### DELETE /api/projects
Delete project.

**Query**: `projectId`

**See**: [USER_GUIDE (archived)](../archive/_archive/deprecated-guides-2025/archive-legacy-guides-pack.md#legacy-user_guide) for usage examples

---

## Partners API

### GET /api/partners
List partners with pagination and search.

### POST /api/partners
Create new partner.

### PUT /api/partners
Update partner. Also the partner editor's save.

**Auth**: admin session (every field), or a `partner-edit` grant from the partner-edit password (report content, logo, emoji, style, template and events-list switches only). An unprotected partner editor gives no grant: its link is the public report link. Without either: 401 `EDIT_ACCESS_REQUIRED`.

### DELETE /api/partners
Delete partner.

**See**: [PARTNERS_SYSTEM_GUIDE.md](../features/features-partners-system-guide.md#api-reference) for complete details

---

## Organizations API (v12.1.10+)

All admin organization endpoints require an authenticated admin session and `superadmin` role.

### GET /api/admin/organizations
List organization records from the live `organizations` collection.

### POST /api/admin/organizations
Create organization. Body: `{ name, slug?, status?, metadata? }`

### GET /api/admin/organizations/[id]
Fetch a single organization for admin/editor use.

### PUT /api/admin/organizations/[id]
Update an organization. Body: `{ name?, slug?, status?, metadata? }`

Organization metadata supports report-generation parity fields:
- `metadata.styleId`
- `metadata.reportTemplateId` (legacy-compatible mirror: `metadata.reportId`)
- `metadata.clickerSetId`
- `metadata.logoUrl`
- `metadata.emoji`

### PATCH /api/admin/organizations/[id]
Alias of `PUT /api/admin/organizations/[id]`.

### DELETE /api/admin/organizations/[id]
Delete an organization only when no partners are still assigned.

### GET /api/admin/organizations/[id]/members
Return all partners with assignment state for the predictive-search member selector.

### PUT /api/admin/organizations/[id]/members
Apply bulk membership assignment. Body: `{ memberPartnerIds: string[] }`

### GET /api/organizations/report/[id]
Get aggregated metrics, resolved report config, and member partner list for admin-managed organizations.

Report resolution precedence:
1. `organization.metadata.reportTemplateId`
2. `organization.metadata.reportId` (legacy compatibility)
3. default partner report template

### GET /api/organizations/report/[id]/activities
Get the aggregated activity list derived from projects owned by member partners.

### Compatibility: GET /api/v3/organizations/report/[id]
Legacy V3 organization reporting path remains available as a fallback for older records.

### Compatibility: GET /api/v3/organizations/report/[id]/activities
Legacy V3 organization activity timeline path remains available as a fallback for older records.

---

## Bitly API

### GET /api/bitly/links
List Bitly links with associated projects.

### POST /api/bitly/pull
Bulk import links from Bitly organization.

### GET /api/bitly/project-metrics/[projectId]
Get Bitly metrics for specific project.

### POST /api/bitly/links
Import a link and associate it with a project (`/api/bitly/associations` has no POST handler).

### DELETE /api/bitly/associations
Remove link-project association.

### POST /api/bitly/recalculate
Trigger date range and cache refresh.

**See**: [BITLY_INTEGRATION_GUIDE.md](../features/features-bitly-integration-guide.md#api-endpoints) for schemas

---

## Hashtags API

### GET /api/hashtags
List all hashtags with project counts.

### GET /api/hashtags/[hashtag]
Get aggregated stats for specific hashtag.

### POST /api/hashtags/filter
Filter projects by hashtags (admin).

### GET /api/hashtags/filter-by-slug/[slug]
Public hashtag filtering.

**See**: [HASHTAG_SYSTEM.md](../features/features-hashtag-system.md) for usage

---

## Variables API

### GET /api/variables-config
Fetch all variable configurations with flags.

### POST /api/variables-config
Create/update variable metadata.

### DELETE /api/variables-config
Delete custom variable.

### GET /api/variables-groups
Fetch variable groups for Editor layout.

### POST /api/variables-groups
Create/update groups.

**See**: [VARIABLE_SYSTEM_HISTORY.md](../archive/2025/deprecated-guides/archive-variable-system-history.md) for background and migration context

---

## Hashtag Categories API

### GET /api/hashtag-categories
List hashtag categories with optional `search`, `limit`, and `offset` query parameters. This read route is public because category labels are used on public and login-facing screens.

### POST /api/hashtag-categories
Create a category. Requires an `admin-session` with role `admin` or `superadmin` (`requireAdmin`).

**Body**: `{ name: string, color: string, order?: number }`

### PUT /api/hashtag-categories
Update a category. Requires an `admin-session` with role `admin` or `superadmin` (`requireAdmin`).

**Body**: `{ id: string, name?: string, color?: string, order?: number }`

### DELETE /api/hashtag-categories
Delete a category. Requires an `admin-session` with role `admin` or `superadmin` (`requireAdmin`).

**Query**: `id=<categoryId>`

---

## Landing / Main Page API

Public main page and admin configuration for which report drives messmass.com and optional static snapshot.

### GET /api/landing-static (public)
Returns payload for the main page: `{ success, staticSnapshot?, generatedAt?, landingReportSlug }`. If `staticSnapshot` is set, the site renders static content; otherwise it uses `landingReportSlug` for the live report.

### GET /api/admin/landing-settings (admin)
Returns `{ success, settings: { landingReportSlug, generatedAt? } }`. Requires session + role `admin`.

### PUT /api/admin/landing-settings (admin)
Body: `{ landingReportSlug: string }`. Updates the selected report. Requires session, role `admin`, and **X-CSRF-Token** header (use `apiPut` from `lib/apiClient`).

### POST /api/admin/landing-static-generate (admin)
Generates static snapshot from current landing report and saves it. Returns `{ success, generatedAt?, blocksCount? }`. Requires session, role `admin`, and **X-CSRF-Token** header (use `apiPost`).

### GET /api/admin/landing-projects (admin)
Returns `{ success, projects: [{ _id, eventName, viewSlug, eventDate? }] }` for the report selector. Requires session + role `admin`.

**See**: [features-landing-main-page.md](../features/features-landing-main-page.md) for integration and storage.

---

## Response Format

All API endpoints return JSON with consistent structure:

**Success**:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

**Error**:
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | No valid session |
| `EDIT_ACCESS_REQUIRED` | 401 | An editor save or editor-driven write without an admin session or a current edit grant; reopen the edit link, enter the password, or sign in |
| `PAGE_PASSWORD_REQUIRED` | 401 | The page is password protected and the caller holds no current grant for it |
| `EDIT_LINK_REQUIRED` | 403 | `GET /api/projects/edit/<_id>`: the event editor was opened by its public id instead of its edit link |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `SERVER_ERROR` | 500 | Internal error |

---

## Rate Limiting

Counted per client IP + path in `middleware.ts` (`lib/rateLimit.ts`), first match wins:

- **Auth** (`/api/admin/login`, `/api/auth/*`, except DELETE): 5 requests / 15 minutes
- **Contact form** (`POST /api/contact`): 5 requests / 15 minutes
- **Public pages** (`/stats/*`, `/hashtag/*`): 60 requests/minute
- **Editor saves** (`PUT /api/projects`, `PUT /api/partners`, `PUT /api/partners/edit/<id-or-slug>`): 120 requests/minute
- **Other writes** (POST, PUT, PATCH, DELETE): 30 requests/minute
- **Reads** (GET): 500 requests/minute
- **Bitly Sync**: 50 requests/minute (Bitly API limit)

**Headers**:
- `X-RateLimit-Limit`: Maximum requests
- `X-RateLimit-Remaining`: Requests left
- `X-RateLimit-Reset`: Reset timestamp


---

## Pagination

Two pagination modes supported:

### Cursor-Based (Default)
```
GET /api/projects?limit=20&cursor=abc123
```

Returns: `{ projects: [...], pagination: { mode: "cursor", nextCursor: "def456", ... } }`. Pass `pagination.nextCursor` back as `cursor`.

### Offset-Based (Search/Sort)
```
GET /api/projects?limit=20&offset=40&sortField=eventDate&sortOrder=desc
```

Returns: `{ projects: [...], pagination: { mode: "sort", totalMatched: 150, nextOffset: 60, ... } }` (`mode: "search"` when `q` is set)

---

## For Complete Documentation

- **Projects**: [USER_GUIDE (archived)](../archive/_archive/deprecated-guides-2025/archive-legacy-guides-pack.md#legacy-user_guide)
- **Partners**: [PARTNERS_SYSTEM_GUIDE.md](../features/features-partners-system-guide.md)
- **Bitly**: [BITLY_INTEGRATION_GUIDE.md](../features/features-bitly-integration-guide.md)
- **Quick Add**: [QUICK_ADD_GUIDE (archived)](../archive/_archive/deprecated-guides-2025/archive-legacy-guides-pack.md#legacy-quick_add_guide)
- **Hashtags**: [HASHTAG_SYSTEM.md](../features/features-hashtag-system.md)
- **Variables**: [VARIABLE_SYSTEM_HISTORY.md](../archive/2025/deprecated-guides/archive-variable-system-history.md)
- **Auth**: [AUTHENTICATION.md](../features/features-authentication.md)
- **Landing / Main page**: [features-landing-main-page.md](../features/features-landing-main-page.md)

---

**{messmass} API Reference 12.1.16**
**Last Updated: 2026-06-26T10:00:00.000Z (UTC)**
**© 2026 {messmass} Platform**
