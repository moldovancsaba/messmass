# MessMass Public API Documentation
Status: Active
Last Updated: 2026-01-11T22:28:38.000Z
Canonical: No
Owner: Architecture

**Version:** 10.6.0  
**Last Updated:** 2026-01-11T22:28:38.000Z
**Status:** Production Ready  
**Base URL:** `https://messmass.com` (or `http://localhost:3000` for development)

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Rate Limits](#rate-limits)
4. [Endpoints](#endpoints)
5. [Error Handling](#error-handling)
6. [Code Examples](#code-examples)
7. [Testing Guide](#testing-guide)

---

## Overview

The MessMass Public API provides read-only access to partner and event data for authorized third-party integrations. All endpoints use Bearer token authentication and return JSON responses with ISO 8601 timestamps.

### Key Features

✅ **RESTful Design** - Standard HTTP methods and status codes  
✅ **Bearer Token Auth** - Secure API key authentication  
✅ **Pagination** - All list endpoints support limit/offset pagination  
✅ **CORS Enabled** - Cross-origin requests allowed for configured origins  
✅ **Rate Limited** - Fair usage with 1000 requests/minute for authenticated users  
✅ **ISO 8601 Timestamps** - All dates in `YYYY-MM-DDTHH:MM:SS.sssZ` format

---

## Authentication

### Obtaining an API Key

API keys are managed by MessMass administrators. To get access:

1. **Request an API user account** from your MessMass administrator
2. **Receive your API key** (32-character hexadecimal token)
3. **Store securely** - Never commit API keys to version control

### Using Your API Key

All requests must include an `Authorization` header:

```http
Authorization: Bearer YOUR_API_KEY_HERE
```

**❌ Cookies are NOT supported** - Public API endpoints reject session cookies and require Bearer tokens only.

### Security Best Practices

- **Rotate keys regularly** - Request new keys every 90 days
- **Use environment variables** - Never hardcode keys in source code
- **Limit access** - Use dedicated service accounts, not personal admin accounts
- **Monitor usage** - Track API calls via admin dashboard

---

## Rate Limits

### Limits by Authentication Status

| Auth Status | Rate Limit | Window | Key |
|-------------|------------|--------|-----|
| Anonymous | 60 requests | 1 minute | IP address |
| Authenticated | 1000 requests | 1 minute | User ID |

### Rate Limit Headers

Every response includes rate limit information:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 998
X-RateLimit-Reset: 2025-11-04T21:45:00.000Z
```

### Handling Rate Limits

When rate limit is exceeded (HTTP 429):

```json
{
  "error": "Too many requests",
  "retryAfter": 42,
  "resetTime": "2025-11-04T21:45:00.000Z"
}
```

**Best Practice:** Implement exponential backoff and respect `Retry-After` header.

---

## Endpoints

### Partners

#### List All Partners

```http
GET /api/public/partners
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `search` | string | - | Search by partner name (case-insensitive) |
| `limit` | integer | 20 | Results per page (max: 100) |
| `offset` | integer | 0 | Pagination offset |
| `sortField` | string | `name` | Sort by: `name`, `createdAt` |
| `sortOrder` | string | `asc` | Sort direction: `asc`, `desc` |

**Example Request:**

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  "https://messmass.com/api/public/partners?limit=10&search=FC"
```

**Example Response:**

```json
{
  "success": true,
  "partners": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "FC Barcelona",
      "emoji": "⚽",
      "logoUrl": "https://i.ibb.co/abc123/logo.png",
      "hashtags": ["football", "laliga"],
      "categorizedHashtags": {
        "league": ["laliga"],
        "sport": ["football"]
      },
      "sportsDb": {
        "teamId": "133604",
        "teamName": "FC Barcelona",
        "league": "Spanish La Liga",
        "sport": "Soccer"
      },
      "createdAt": "2025-01-15T10:30:00.000Z",
      "updatedAt": "2025-11-04T12:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 45,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  },
  "timestamp": "2025-11-04T21:44:00.000Z"
}
```

---

#### Get Partner by ID

```http
GET /api/public/partners/{id}
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | ✅ | Partner ObjectId (24-character hex) |

**Example Request:**

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  "https://messmass.com/api/public/partners/507f1f77bcf86cd799439011"
```

**Example Response:**

```json
{
  "success": true,
  "partner": {
    "id": "507f1f77bcf86cd799439011",
    "name": "FC Barcelona",
    "emoji": "⚽",
    "logoUrl": "https://i.ibb.co/abc123/logo.png",
    "hashtags": ["football", "laliga"],
    "categorizedHashtags": {
      "league": ["laliga"],
      "sport": ["football"]
    },
    "sportsDb": {
      "teamId": "133604",
      "teamName": "FC Barcelona",
      "league": "Spanish La Liga",
      "sport": "Soccer"
    },
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-11-04T12:00:00.000Z"
  },
  "timestamp": "2025-11-04T21:44:00.000Z"
}
```

---

#### Get Partner's Events

```http
GET /api/public/partners/{id}/events
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | ✅ | Partner ObjectId |

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | 20 | Results per page (max: 100) |
| `offset` | integer | 0 | Pagination offset |
| `sortOrder` | string | `desc` | Sort by eventDate: `asc`, `desc` |

**Example Request:**

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  "https://messmass.com/api/public/partners/507f1f77bcf86cd799439011/events?limit=5"
```

**Example Response:**

```json
{
  "success": true,
  "events": [
    {
      "id": "67890abcdef1234567890abc",
      "eventName": "FC Barcelona vs Real Madrid",
      "eventDate": "2025-10-26T19:00:00.000Z",
      "viewSlug": "barca-real-2025",
      "editSlug": "edit-barca-real-2025",
      "hashtags": ["clasico", "laliga"],
      "categorizedHashtags": {
        "competition": ["clasico"],
        "league": ["laliga"]
      },
      "matchContext": {
        "opponentId": "507f1f77bcf86cd799439099",
        "opponentName": "Real Madrid",
        "isHomeGame": true,
        "venue": "Camp Nou"
      },
      "summary": {
        "totalImages": 1247,
        "totalFans": 3521,
        "eventAttendees": 89234
      },
      "createdAt": "2025-10-20T08:00:00.000Z",
      "updatedAt": "2025-10-27T02:15:00.000Z"
    }
  ],
  "partner": {
    "id": "507f1f77bcf86cd799439011",
    "name": "FC Barcelona",
    "emoji": "⚽"
  },
  "pagination": {
    "total": 38,
    "limit": 5,
    "offset": 0,
    "hasMore": true
  },
  "timestamp": "2025-11-04T21:44:00.000Z"
}
```

---

### Events

#### Get Event by ID

```http
GET /api/public/events/{id}
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | ✅ | Event/Project ObjectId |

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `includeStats` | boolean | `true` | Include full statistics object (96+ variables) |

**Example Request:**

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  "https://messmass.com/api/public/events/67890abcdef1234567890abc"
```

**Example Response:**

```json
{
  "success": true,
  "event": {
    "id": "67890abcdef1234567890abc",
    "eventName": "FC Barcelona vs Real Madrid",
    "eventDate": "2025-10-26T19:00:00.000Z",
    "viewSlug": "barca-real-2025",
    "editSlug": "edit-barca-real-2025",
    "hashtags": ["clasico", "laliga"],
    "categorizedHashtags": {
      "competition": ["clasico"],
      "league": ["laliga"]
    },
    "partner": {
      "id": "507f1f77bcf86cd799439011",
      "name": "FC Barcelona",
      "emoji": "⚽",
      "logoUrl": "https://i.ibb.co/abc123/logo.png"
    },
    "matchContext": {
      "opponentId": "507f1f77bcf86cd799439099",
      "opponentName": "Real Madrid",
      "isHomeGame": true,
      "venue": "Camp Nou",
      "fixtureId": "12345",
      "scoreHome": 2,
      "scoreAway": 1
    },
    "stats": {
      "remoteImages": 847,
      "hostessImages": 312,
      "selfies": 88,
      "remoteFans": 2104,
      "stadium": 1417,
      "female": 1243,
      "male": 2278,
      "genAlpha": 421,
      "genYZ": 1876,
      "genX": 892,
      "boomer": 332,
      "merched": 1456,
      "jersey": 892,
      "scarf": 234,
      "flags": 187,
      "baseballCap": 98,
      "other": 45,
      "eventAttendees": 89234
    },
    "createdAt": "2025-10-20T08:00:00.000Z",
    "updatedAt": "2025-10-27T02:15:00.000Z"
  },
  "timestamp": "2025-11-04T21:44:00.000Z"
}
```

**Without Stats:**

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  "https://messmass.com/api/public/events/67890abcdef1234567890abc?includeStats=false"
```

---

## Error Handling

### Standard Error Response

All errors follow this format:

```json
{
  "success": false,
  "error": "Error message here",
  "errorCode": "ERROR_CODE",
  "timestamp": "2025-11-04T21:44:00.000Z"
}
```

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 400 | Bad Request | Invalid parameters or malformed request |
| 401 | Unauthorized | Missing, invalid, or expired API key |
| 403 | Forbidden | API access not enabled for this user |
| 404 | Not Found | Resource does not exist |
| 409 | Conflict | Request conflicts with current state |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side error (contact support) |

### Error Codes

| Error Code | Description | Solution |
|------------|-------------|----------|
| `MISSING_TOKEN` | No Authorization header | Add `Authorization: Bearer <key>` |
| `INVALID_TOKEN` | API key not found | Verify key is correct |
| `API_ACCESS_DISABLED` | User's API access is off | Contact admin to enable |
| `COOKIES_NOT_ALLOWED` | Request included cookies | Remove cookies, use Bearer only |

---

## Code Examples

### JavaScript (Node.js)

```javascript
const axios = require('axios');

const API_KEY = process.env.MESSMASS_API_KEY;
const BASE_URL = 'https://messmass.com';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${API_KEY}`
  }
});

async function getPartners() {
  try {
    const { data } = await api.get('/api/public/partners', {
      params: {
        limit: 10,
        search: 'FC'
      }
    });
    console.log(`Found ${data.pagination.total} partners`);
    return data.partners;
  } catch (error) {
    if (error.response?.status === 429) {
      console.error('Rate limit exceeded, retry after', error.response.headers['retry-after']);
    } else {
      console.error('API Error:', error.response?.data?.error);
    }
  }
}

async function getEventDetails(eventId) {
  const { data } = await api.get(`/api/public/events/${eventId}`);
  return data.event;
}

// Usage
getPartners().then(partners => {
  console.log(partners);
});
```

### Python

```python
import os
import requests

API_KEY = os.getenv('MESSMASS_API_KEY')
BASE_URL = 'https://messmass.com'

headers = {
    'Authorization': f'Bearer {API_KEY}'
}

def get_partners(limit=10, search=''):
    response = requests.get(
        f'{BASE_URL}/api/public/partners',
        headers=headers,
        params={'limit': limit, 'search': search}
    )
    response.raise_for_status()
    data = response.json()
    print(f"Found {data['pagination']['total']} partners")
    return data['partners']

def get_event_details(event_id):
    response = requests.get(
        f'{BASE_URL}/api/public/events/{event_id}',
        headers=headers
    )
    response.raise_for_status()
    return response.json()['event']

# Usage
partners = get_partners(search='FC')
for partner in partners:
    print(f"{partner['emoji']} {partner['name']}")
```

### cURL

```bash
#!/bin/bash

API_KEY="your_api_key_here"
BASE_URL="https://messmass.com"

# List partners
curl -H "Authorization: Bearer $API_KEY" \
  "$BASE_URL/api/public/partners?limit=5"

# Get specific partner
PARTNER_ID="507f1f77bcf86cd799439011"
curl -H "Authorization: Bearer $API_KEY" \
  "$BASE_URL/api/public/partners/$PARTNER_ID"

# Get partner's events
curl -H "Authorization: Bearer $API_KEY" \
  "$BASE_URL/api/public/partners/$PARTNER_ID/events"

# Get event details
EVENT_ID="67890abcdef1234567890abc"
curl -H "Authorization: Bearer $API_KEY" \
  "$BASE_URL/api/public/events/$EVENT_ID"
```

---

## Testing Guide

### Step 1: Get API Access

Contact your MessMass administrator to:
1. Create an API user account
2. Enable API access for your user
3. Receive your 32-character API key

### Step 2: Test Authentication

```bash
# Test with your API key
curl -H "Authorization: Bearer YOUR_API_KEY" \
  http://localhost:3000/api/public/partners

# Expected: HTTP 200 with partners list
# If 401: Check your API key
# If 403: API access not enabled - contact admin
```

### Step 3: Test Endpoints

```bash
# 1. List partners
curl -H "Authorization: Bearer YOUR_API_KEY" \
  "http://localhost:3000/api/public/partners?limit=5"

# 2. Get partner by ID (use real ID from step 1)
curl -H "Authorization: Bearer YOUR_API_KEY" \
  "http://localhost:3000/api/public/partners/PARTNER_ID"

# 3. Get partner's events
curl -H "Authorization: Bearer YOUR_API_KEY" \
  "http://localhost:3000/api/public/partners/PARTNER_ID/events"

# 4. Get event details (use real event ID from step 3)
curl -H "Authorization: Bearer YOUR_API_KEY" \
  "http://localhost:3000/api/public/events/EVENT_ID"
```

### Step 4: Test Error Handling

```bash
# Test missing auth (expect 401)
curl http://localhost:3000/api/public/partners

# Test invalid ID (expect 400)
curl -H "Authorization: Bearer YOUR_API_KEY" \
  "http://localhost:3000/api/public/partners/invalid-id"

# Test non-existent resource (expect 404)
curl -H "Authorization: Bearer YOUR_API_KEY" \
  "http://localhost:3000/api/public/partners/000000000000000000000000"
```

### Step 5: Monitor Usage

Check your admin dashboard for:
- API usage count
- Last API call timestamp
- Rate limit status

---

## Support

**Questions?** Contact your MessMass administrator or technical support.

**Found a bug?** Report issues via your support channel.

**Need more endpoints?** Request additional API features through your account manager.

---

**Document Version:** 10.6.0  
**API Version:** 10.6.0  
**Last Updated:** 2025-11-04T21:48:00.000Z
**Status:** ✅ Production Ready
