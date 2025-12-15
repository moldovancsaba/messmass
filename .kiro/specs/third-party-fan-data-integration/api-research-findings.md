# API Research Findings

## Existing Public API Infrastructure

### Authentication System (`lib/apiAuth.ts`)

**Current Implementation:**
- ✅ Bearer token authentication via `Authorization: Bearer <token>` header
- ✅ Token is user's password field (MD5-style 32-char hex string)
- ✅ Users have `apiKeyEnabled` boolean flag to control API access
- ✅ Usage tracking: `apiUsageCount` and `lastAPICallAt` fields
- ✅ Rate limiting: 1000 requests/minute for authenticated users
- ✅ Rejects cookie-based authentication (Bearer only)
- ✅ CORS support via `applyCorsHeaders()`
- ✅ Comprehensive logging and error codes

**Key Functions:**
- `requireAPIAuth(request)` - Middleware for protecting endpoints
- `validateAPIKey(token)` - Validates Bearer token against users collection
- `parseAuthorizationHeader(request)` - Extracts Bearer token
- `getUserIdForRateLimit(request)` - Gets user ID for rate limiting

**Error Codes:**
- `MISSING_TOKEN` - No Authorization header
- `INVALID_TOKEN` - Token not found in users collection
- `API_ACCESS_DISABLED` - User exists but apiKeyEnabled=false
- `COOKIES_NOT_ALLOWED` - Request included cookies (not allowed)
- `AUTH_ERROR` - Internal authentication error

### User Management (`lib/users.ts`)

**User Document Structure:**
```typescript
interface UserDoc {
  _id: ObjectId
  email: string
  name: string
  role: 'admin' | 'super-admin'
  password: string // MD5-style token, also serves as API key
  lastLogin?: string
  apiKeyEnabled?: boolean // Enable/disable API access
  apiUsageCount?: number // Track API calls
  lastAPICallAt?: string // Last successful API request
  createdAt: string
  updatedAt: string
}
```

**Key Functions:**
- `findUserByPassword(password)` - Find user by API key (password)
- `updateAPIUsage(id)` - Increment usage counter
- `toggleAPIAccess(id, enabled)` - Enable/disable API access
- `listUsers()` - Get all users for admin UI

**Example API User:**
```json
{
  "email": "camera@messmass.com",
  "name": "Camera Obscura",
  "role": "admin",
  "password": "a1b2c3d4e5f6789012345678901234ab",
  "apiKeyEnabled": true,
  "apiUsageCount": 1247,
  "lastAPICallAt": "2025-01-27T16:30:00.000Z"
}
```

### Existing Public API Endpoints

**Read-Only Endpoints:**
- `GET /api/public/partners` - List partners with pagination/search
- `GET /api/public/partners/[id]` - Get partner details
- `GET /api/public/partners/[id]/events` - Get partner's events
- `GET /api/public/events/[id]` - Get event details with stats

**Response Format:**
```json
{
  "success": true,
  "data": { ... },
  "pagination": { ... },
  "timestamp": "2025-01-27T16:30:00.000Z"
}
```

**Error Format:**
```json
{
  "success": false,
  "error": "Error message",
  "errorCode": "ERROR_CODE",
  "timestamp": "2025-01-27T16:30:00.000Z"
}
```

### Common Patterns

**1. Route Structure:**
```typescript
export async function GET(request: NextRequest) {
  const startTime = logRequestStart({ ... });
  
  try {
    // 1. Authenticate
    const authResult = await requireAPIAuth(request);
    if (!authResult.success) {
      return applyCorsHeaders(authResult.response!, request);
    }
    
    // 2. Validate input
    // 3. Query database
    // 4. Sanitize response
    // 5. Log and return
    
    logRequestEnd(startTime, { ... }, 200);
    const response = NextResponse.json({ success: true, ... });
    return applyCorsHeaders(response, request);
    
  } catch (error) {
    logRequestEnd(startTime, { ... }, 500);
    const response = NextResponse.json({ success: false, error: ... });
    return applyCorsHeaders(response, request);
  }
}

export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 204 });
  return applyCorsHeaders(response, request);
}
```

**2. Consistent Logging:**
- `logRequestStart()` at beginning
- `logRequestEnd()` before each return
- Includes method, pathname, userId, status code

**3. CORS Handling:**
- All responses wrapped with `applyCorsHeaders(response, request)`
- OPTIONS handler for preflight requests

**4. Pagination:**
- `limit` (default 20, max 100)
- `offset` (default 0)
- Response includes `pagination: { total, limit, offset, hasMore }`

## What's Missing for Fanmass Integration

### 1. Write Endpoints (Data Injection)

**Need to Add:**
- `POST /api/public/events/[id]/stats` - Inject fan data into event KYC
- `PATCH /api/public/events/[id]/stats` - Partial update of stats

**Requirements:**
- Same authentication pattern (`requireAPIAuth`)
- Validate write permissions (check user role or add `apiWriteEnabled` flag)
- Validate input data (non-negative integers, valid field names)
- Update `updatedAt` timestamp
- Trigger derived metrics recalculation
- Create audit log entry
- Create notification for admin

### 2. Webhook System

**Need to Add:**
- Webhook configuration storage (new collection: `webhooks`)
- Webhook delivery service
- Signature generation (HMAC-SHA256)
- Retry logic with exponential backoff
- Delivery logging
- Admin UI for webhook management

**Webhook Document Structure:**
```typescript
interface WebhookDoc {
  _id: ObjectId
  url: string // HTTPS only
  secret: string // For HMAC signature
  eventTypes: string[] // ['event.created', 'event.updated']
  active: boolean
  createdAt: string
  updatedAt: string
  // Delivery stats
  totalDeliveries: number
  successfulDeliveries: number
  failedDeliveries: number
  lastDeliveryAt?: string
  lastDeliveryStatus?: 'success' | 'failed'
  consecutiveFailures: number // Auto-disable after 10
}
```

### 3. Audit Logging

**Need to Add:**
- Audit log collection (`api_audit_logs`)
- Log all write operations
- Include before/after values
- Track user, IP, timestamp

**Audit Log Document Structure:**
```typescript
interface AuditLogDoc {
  _id: ObjectId
  eventId: ObjectId
  userId: ObjectId
  userEmail: string
  action: 'stats_update'
  timestamp: string
  ipAddress: string
  userAgent: string
  changes: {
    field: string
    before: any
    after: any
  }[]
}
```

### 4. Enhanced Notifications

**Need to Add:**
- Notification type for API data injections
- Group by service/time period
- Display in admin UI separately from manual edits

## Recommendations

### Option 1: Extend Existing Public API (RECOMMENDED)

**Pros:**
- Consistent authentication (reuse `requireAPIAuth`)
- Consistent patterns (logging, CORS, error handling)
- Minimal new infrastructure
- Leverages existing user management

**Cons:**
- Need to add write permission checking
- Need to build webhook system from scratch

**Implementation:**
1. Add `POST /api/public/events/[id]/stats` endpoint
2. Add write permission check to `requireAPIAuth` or create `requireAPIWriteAuth`
3. Build webhook system as separate service
4. Add audit logging middleware
5. Extend notification system

### Option 2: Create Separate Integration API

**Pros:**
- Clean separation of concerns
- Can have different rate limits
- Easier to version independently

**Cons:**
- Duplicate authentication logic
- Duplicate patterns and utilities
- More maintenance overhead
- Confusing for developers (two API systems)

## Conclusion

**Recommendation: Extend the existing Public API**

The current Public API infrastructure is well-designed and production-ready. We should:

1. **Add write endpoints** following the same patterns
2. **Add write permission checking** (new `apiWriteEnabled` flag or check role)
3. **Build webhook system** as a new module
4. **Add audit logging** as middleware
5. **Extend notifications** to include API activity

This approach maintains consistency, reduces duplication, and leverages the solid foundation already in place.
