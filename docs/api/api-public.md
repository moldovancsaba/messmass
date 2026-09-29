# {messmass} Public API
Status: Active
Last Updated: 2026-05-20
Canonical: Yes
Owner: Architecture

**Version:** 12.3.37
**Base URL:** `https://messmass.com`
**Local development base URL:** `http://localhost:3001`

## Purpose

The public API provides authenticated read access to partner data and partner-linked event data for external integrations.

Current scope in code:

- partner list
- single partner details
- partner events
- single event details

## Authentication

Public API routes require Bearer token authentication.

Header:

```http
Authorization: Bearer YOUR_API_KEY
```

Important behavior:

- The guard is `requireAPIAuth` in `lib/apiAuth.ts`. It protects the four `/api/public/*` routes and nothing else.
- Any request that carries a `Cookie` header is rejected with 401 `COOKIES_NOT_ALLOWED`, even if it also has a valid Bearer key. Call from a server, or from a browser with credentials omitted.
- The key is matched against the account's bcrypt `apiKeyHash` (`findUserByApiKeyHash` in `lib/users.ts`). **Login passwords are not API keys.** The old fallback that accepted a user's login password as the Bearer token was removed in 6f31990d (#397, F-011). An account with no `apiKeyHash` cannot authenticate until an admin rotates a key for it.
- The account must also have `apiKeyEnabled: true`. Each successful call increments `apiUsageCount` and sets `lastAPICallAt`.
- Requests are CORS-enabled through `lib/cors.ts`, for origins in `ALLOWED_ORIGINS` (or localhost when that variable is unset).
- All responses are JSON.

### Getting an API key

1. An admin opens the admin users page (`/admin/users`) and uses the **Rotate API Key** row action (label from `lib/adapters/usersAdapter.tsx`). This calls `POST /api/admin/local-users/[id]/api-access`.
2. That endpoint accepts only role `admin` or `superadmin` (403 otherwise). Only a superadmin can rotate a superadmin's key (dd34e229).
3. The endpoint generates a random 32-byte hex key and stores only its bcrypt hash in `users.apiKeyHash`. The plaintext `apiKey` is returned once, shown in the "API Key Generated" modal, and never stored or logged. Rotating again replaces the hash, so the previous key stops working immediately. The user's login password is not affected.
4. Access is switched on and off separately, with the **Enable API** / **Disable API** row action (`PUT /api/admin/local-users/[id]/api-access`, body `{ "enabled": true|false }`, same role rules). This sets `apiKeyEnabled`. Disabling is refused with 409 if the account made an API call in the last 5 minutes.
5. `apiWriteEnabled` is a separate flag that gates writes through `requireAPIWriteAuth`. No `/api/public/*` route writes, and no route calls `requireAPIWriteAuth` at dd34e229. There is also no admin endpoint that sets `apiWriteEnabled`: `toggleAPIWriteAccess` in `lib/users.ts` has no route caller.

### Authentication error codes

Every auth failure returns `{ "success": false, "error": "...", "errorCode": "..." }` with a `WWW-Authenticate: Bearer realm="{messmass} API"` header:

| `errorCode` | HTTP | Cause (`lib/apiAuth.ts`) |
|---|---|---|
| `COOKIES_NOT_ALLOWED` | 401 | The request carried a `Cookie` header |
| `MISSING_TOKEN` | 401 | No `Authorization: Bearer <key>` header, or an empty one |
| `INVALID_TOKEN` | 401 | No account's `apiKeyHash` matches the key |
| `API_ACCESS_DISABLED` | 401 | The key matched, but the account has `apiKeyEnabled` false |
| `AUTH_ERROR` | 401 | Unexpected error while validating the key |
| `WRITE_ACCESS_DISABLED` | 403 | Only from `requireAPIWriteAuth` (account lacks `apiWriteEnabled`); not reachable from any current route |

## Rate Limiting

These routes use the same public API auth system referenced by `requireAPIAuth`. The integration-facing expectation remains:

- authenticated traffic is rate-limited
- consumers should handle `429` responses and retry later

## Endpoints

### `GET /api/public/partners`

Returns a paginated partner catalog.

Query parameters:

- `search` — case-insensitive name search
- `limit` — default `20`, max `100`
- `offset` — default `0`
- `sortField` — `name` or `createdAt`
- `sortOrder` — `asc` or `desc`

Response shape:

```json
{
  "success": true,
  "partners": [],
  "pagination": {
    "total": 0,
    "limit": 20,
    "offset": 0,
    "hasMore": false
  },
  "timestamp": "2026-05-20T10:00:00.000Z"
}
```

Public partner fields currently returned:

- `id`
- `name`
- `emoji`
- `logoUrl`
- `hashtags`
- `categorizedHashtags`
- `sportsDb`
- `createdAt`
- `updatedAt`

### `GET /api/public/partners/{id}`

Returns one public partner record.

Rules:

- `id` must be a valid MongoDB `ObjectId`
- invalid ID returns `400`
- missing partner returns `404`

Response shape:

```json
{
  "success": true,
  "partner": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Example Partner"
  },
  "timestamp": "2026-05-20T10:00:00.000Z"
}
```

### `GET /api/public/partners/{id}/events`

Returns public event data for one partner.

Query parameters:

- `limit` — default `20`, max `100`
- `offset` — default `0`
- `sortOrder` — `asc` or `desc`, sorted by `eventDate`

Rules:

- `id` must be a valid `ObjectId`
- partner must exist
- event lookup is currently based on `projects.partnerId`

Response shape:

```json
{
  "success": true,
  "events": [],
  "partner": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Example Partner",
    "emoji": "⚽"
  },
  "pagination": {
    "total": 0,
    "limit": 20,
    "offset": 0,
    "hasMore": false
  },
  "timestamp": "2026-05-20T10:00:00.000Z"
}
```

Current event fields returned:

- `id`
- `eventName`
- `eventDate`
- `viewSlug`
- `hashtags`
- `categorizedHashtags`
- `matchContext`
- `summary`
- `createdAt`
- `updatedAt`

Neither public event route returns the event's edit link. API keys are
read-only, and the edit link of an event editor with no password lets whoever
holds it save the event.

`summary` currently includes:

- `totalImages`
- `totalFans`
- `eventAttendees`

### `GET /api/public/events/{id}`

Returns one public event record with optional full stats.

Query parameters:

- `includeStats` — default `true`; set to `false` to omit the full `stats` object

Rules:

- `id` must be a valid MongoDB `ObjectId`
- invalid ID returns `400`
- missing event returns `404`

Response shape:

```json
{
  "success": true,
  "event": {
    "id": "507f1f77bcf86cd799439011",
    "eventName": "Example Event",
    "partner": {
      "id": "507f1f77bcf86cd799439012",
      "name": "Example Partner"
    }
  },
  "timestamp": "2026-06-26T10:00:00.000Z"
}
```

## CORS And Preflight

All current public partner routes support `OPTIONS` for browser preflight handling:

- `OPTIONS /api/public/partners`
- `OPTIONS /api/public/partners/{id}`
- `OPTIONS /api/public/partners/{id}/events`
- `OPTIONS /api/public/events/{id}`

## Error Behavior

Common patterns:

- `401` — authentication failed; see the `errorCode` table under [Authentication error codes](#authentication-error-codes)
- `400` — invalid partner ID format or invalid request parameters
- `404` — partner not found
- `500` — server error

Typical error shape:

```json
{
  "success": false,
  "error": "Partner not found",
  "timestamp": "2026-05-20T10:00:00.000Z"
}
```

## Example Requests

### List partners

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  "https://messmass.com/api/public/partners?limit=10&search=FC"
```

### Fetch one partner

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  "https://messmass.com/api/public/partners/507f1f77bcf86cd799439011"
```

### Fetch partner events

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  "https://messmass.com/api/public/partners/507f1f77bcf86cd799439011/events?limit=5"
```

### Fetch one event

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  "https://messmass.com/api/public/events/507f1f77bcf86cd799439011?includeStats=false"
```

## Related Docs

- `docs/api/api-reference.md`
- `docs/features/features-authentication.md`
