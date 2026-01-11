# 📡 API Reference
Status: Active
Last Updated: 2026-01-11T22:28:38.000Z
Canonical: No
Owner: Architecture

**Version:** 11.25.2  
**Last Updated:** 2026-01-11T22:28:38.000Z (UTC)  
**Status:** Production

Quick API reference for MessMass v6.0.0. See detailed guides for complete schemas and examples.

---

## Base URL

```
https://messmass.com/api
```

## Authentication

All admin endpoints require session authentication via HTTP-only cookie.

**Login**: `POST /api/admin/login`  
**Logout**: `DELETE /api/admin/login`

**See**: [AUTHENTICATION_AND_ACCESS.md](../features/AUTHENTICATION.md) for details

---

## Projects API

### GET /api/projects
List projects with pagination, search, and sorting.

**Query Params**: `limit`, `offset`, `search`, `sortField`, `sortOrder`, `nextCursor`

### POST /api/projects
Create new project.

**Body**: `{ eventName, eventDate, stats, hashtags?, categorizedHashtags? }`

### PUT /api/projects
Update existing project.

**Body**: `{ _id, eventName?, eventDate?, stats?, hashtags?, categorizedHashtags? }`

### DELETE /api/projects
Delete project.

**Query**: `projectId`

**See**: [USER_GUIDE.md (archived)](docs/archive/2025/deprecated-guides/USER_GUIDE.md#project-management) for usage examples

---

## Partners API

### GET /api/partners
List partners with pagination and search.

### POST /api/partners
Create new partner.

### PUT /api/partners
Update partner.

### DELETE /api/partners
Delete partner.

**See**: [PARTNERS_SYSTEM_GUIDE.md](../features/PARTNERS_SYSTEM_GUIDE.md#api-reference) for complete details

---

## Bitly API

### GET /api/bitly/links
List Bitly links with associated projects.

### POST /api/bitly/pull
Bulk import links from Bitly organization.

### GET /api/bitly/project-metrics/[projectId]
Get Bitly metrics for specific project.

### POST /api/bitly/associations
Create link-project association.

### DELETE /api/bitly/associations
Remove link-project association.

### POST /api/bitly/recalculate
Trigger date range and cache refresh.

**See**: [BITLY_INTEGRATION_GUIDE.md](../features/BITLY_INTEGRATION_GUIDE.md#api-endpoints) for schemas

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

**See**: [HASHTAG_SYSTEM.md](../features/HASHTAG_SYSTEM.md) for usage

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

**See**: [ADMIN_VARIABLES_SYSTEM.md (archived)](docs/archive/2025/deprecated-guides/ADMIN_VARIABLES_SYSTEM.md#api-reference) for details

---

## Admin Categories API

### GET /api/admin/hashtag-categories
List all hashtag categories.

### POST /api/admin/hashtag-categories
Create new category.

### PUT /api/admin/hashtag-categories/[id]
Update category.

### DELETE /api/admin/hashtag-categories/[id]
Delete category.

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
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `SERVER_ERROR` | 500 | Internal error |

---

## Rate Limiting

- **Admin APIs**: 100 requests/minute per session
- **Public APIs**: 60 requests/minute per IP
- **Bitly Sync**: 50 requests/minute (Bitly API limit)

**Headers**:
- `X-RateLimit-Limit`: Maximum requests
- `X-RateLimit-Remaining`: Requests left
- `X-RateLimit-Reset`: Reset timestamp

---

## WebSocket API

**URL**: `wss://messmass.com` (separate WebSocket server, port 7654)

**Messages**:
- `join-project`: Join project room
- `stat-update`: Statistics changed
- `project-update`: Metadata changed
- `heartbeat`: Keep-alive

**See**: [ARCHITECTURE.md](../../ARCHITECTURE.md) for WebSocket details

---

## Pagination

Two pagination modes supported:

### Cursor-Based (Default)
```
GET /api/projects?limit=20&nextCursor=abc123
```

Returns: `{ projects: [...], nextCursor: "def456" }`

### Offset-Based (Search/Sort)
```
GET /api/projects?limit=20&offset=40&sortField=eventDate&sortOrder=desc
```

Returns: `{ projects: [...], totalMatched: 150, nextOffset: 60 }`

---

## For Complete Documentation

- **Projects**: [USER_GUIDE.md (archived)](docs/archive/2025/deprecated-guides/USER_GUIDE.md)
- **Partners**: [PARTNERS_SYSTEM_GUIDE.md](../features/PARTNERS_SYSTEM_GUIDE.md)
- **Bitly**: [BITLY_INTEGRATION_GUIDE.md](../features/BITLY_INTEGRATION_GUIDE.md)
- **Quick Add**: [QUICK_ADD_GUIDE.md (archived)](docs/archive/2025/deprecated-guides/QUICK_ADD_GUIDE.md)
- **Hashtags**: [HASHTAG_SYSTEM.md](../features/HASHTAG_SYSTEM.md)
- **Variables**: [ADMIN_VARIABLES_SYSTEM.md (archived)](docs/archive/2025/deprecated-guides/ADMIN_VARIABLES_SYSTEM.md)
- **Auth**: [AUTHENTICATION_AND_ACCESS.md](../features/AUTHENTICATION.md)

---

**MessMass API Reference Version 6.0.0**  
**Last Updated: 2025-01-21T11:14:00.000Z (UTC)**  
**© 2025 MessMass Platform**
