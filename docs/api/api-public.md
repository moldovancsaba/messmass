# {messmass} Public API
Status: Active
Last Updated: 2026-05-20
Canonical: Yes
Owner: Architecture

**Version:** 12.1.12  
**Base URL:** `https://messmass.com`  
**Local development base URL:** `http://localhost:3001`

## Purpose

The public API provides authenticated read access to partner data and partner-linked event data for external integrations.

Current scope in code:

- partner list
- single partner details
- partner events

## Authentication

Public API routes require Bearer token authentication.

Header:

```http
Authorization: Bearer YOUR_API_KEY
```

Important behavior:

- public routes do **not** accept browser admin session cookies as the auth mechanism
- requests are CORS-enabled through the server CORS helper
- all responses are JSON

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
- `editSlug`
- `hashtags`
- `categorizedHashtags`
- `matchContext`
- `summary`
- `createdAt`
- `updatedAt`

`summary` currently includes:

- `totalImages`
- `totalFans`
- `eventAttendees`

## CORS And Preflight

All current public partner routes support `OPTIONS` for browser preflight handling:

- `OPTIONS /api/public/partners`
- `OPTIONS /api/public/partners/{id}`
- `OPTIONS /api/public/partners/{id}/events`

## Error Behavior

Common patterns:

- `401` — missing or invalid Bearer token
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

## Related Docs

- `/Users/moldovancsaba/Projects/messmass/docs/api/api-reference.md`
- `/Users/moldovancsaba/Projects/messmass/docs/features/features-authentication.md`
