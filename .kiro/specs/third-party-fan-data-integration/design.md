# Design Document

## Overview

This design extends the existing MessMass Public API to support bidirectional integration with Fanmass (fan identification service). The system will enable Fanmass to retrieve event data, receive real-time notifications when events change, and inject enriched fan identification data back into the MessMass KYC system.

**Design Philosophy:** Extend, don't rebuild. We leverage the existing Public API infrastructure (`lib/apiAuth.ts`, user management, rate limiting, CORS) and add write capabilities, webhooks, and audit logging following the same patterns.

## Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         MESSMASS                                 │
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│  │   Events     │───▶│  Public API  │───▶│   Fanmass    │     │
│  │  Collection  │    │  (Read)      │    │   Service    │     │
│  └──────────────┘    └──────────────┘    └──────────────┘     │
│         │                                        │               │
│         │                                        │               │
│         │            ┌──────────────┐           │               │
│         │            │   Webhook    │───────────┘               │
│         │            │   System     │                           │
│         │            └──────────────┘                           │
│         │                                                        │
│         │            ┌──────────────┐           ┌─────────┐    │
│         └───────────▶│  Public API  │◀──────────│ Fanmass │    │
│                      │  (Write)     │           │ Results │    │
│                      └──────────────┘           └─────────┘    │
│                             │                                    │
│                             ▼                                    │
│                      ┌──────────────┐                           │
│                      │ Audit Logs   │                           │
│                      │ Notifications│                           │
│                      └──────────────┘                           │
└─────────────────────────────────────────────────────────────────┘
```

### Component Architecture

```
app/api/public/
├── events/
│   └── [id]/
│       ├── route.ts (existing GET)
│       └── stats/
│           └── route.ts (NEW: POST for data injection)
├── partners/ (existing)
└── webhooks/
    ├── route.ts (NEW: webhook management)
    └── test/
        └── route.ts (NEW: test webhook delivery)

lib/
├── apiAuth.ts (existing - extend with write permissions)
├── webhooks.ts (NEW: webhook delivery service)
├── auditLog.ts (NEW: audit logging)
└── notificationUtils.ts (existing - extend for API activity)

MongoDB Collections:
├── users (existing - add apiWriteEnabled field)
├── projects (existing - update stats)
├── webhooks (NEW)
├── api_audit_logs (NEW)
└── notifications (existing - extend types)
```

## Components and Interfaces

### 1. Write Endpoint for Stats Injection

**Endpoint:** `POST /api/public/events/[id]/stats`

**Purpose:** Allow Fanmass to inject enriched fan identification data into event KYC statistics.

**Authentication:** Bearer token with write permissions

**Request Schema:**
```typescript
interface StatsUpdateRequest {
  stats: {
    // Demographics (optional)
    male?: number
    female?: number
    genAlpha?: number
    genYZ?: number
    genX?: number
    boomer?: number
    
    // Merchandise (optional)
    merched?: number
    jersey?: number
    scarf?: number
    flags?: number
    baseballCap?: number
    
    // Fan counts (optional)
    remoteFans?: number
    stadium?: number
    indoor?: number
    outdoor?: number
  }
  source?: string // e.g., "fanmass-v1.2.3"
  metadata?: {
    processingTime?: number
    confidence?: number
    [key: string]: any
  }
}
```

**Response Schema:**
```typescript
interface StatsUpdateResponse {
  success: boolean
  event: {
    id: string
    eventName: string
    updatedAt: string
  }
  updated: string[] // List of fields that were updated
  derived: string[] // List of derived metrics recalculated
  timestamp: string
}
```

**Validation Rules:**
- All numeric values must be non-negative integers
- At least one stat field must be provided
- Event must exist
- User must have write permissions

**Implementation Pattern:**
```typescript
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = logRequestStart({ ... });
  
  try {
    const { id } = await params;
    
    // 1. Authenticate with write permission check
    const authResult = await requireAPIWriteAuth(request);
    if (!authResult.success) {
      return applyCorsHeaders(authResult.response!, request);
    }
    
    // 2. Validate event ID
    if (!ObjectId.isValid(id)) {
      return errorResponse(400, 'Invalid event ID');
    }
    
    // 3. Parse and validate request body
    const body = await request.json();
    const validation = validateStatsUpdate(body);
    if (!validation.valid) {
      return errorResponse(400, validation.errors);
    }
    
    // 4. Get existing event
    const event = await getEvent(id);
    if (!event) {
      return errorResponse(404, 'Event not found');
    }
    
    // 5. Merge stats and recalculate derived metrics
    const updatedStats = mergeStats(event.stats, body.stats);
    const enrichedStats = addDerivedMetrics(updatedStats);
    
    // 6. Update database
    await updateEventStats(id, enrichedStats);
    
    // 7. Create audit log
    await createAuditLog({
      eventId: id,
      userId: authResult.user.id,
      action: 'stats_update',
      changes: getChanges(event.stats, body.stats),
      metadata: body.metadata
    });
    
    // 8. Create notification
    await createNotification({
      type: 'api_stats_update',
      eventId: id,
      userId: authResult.user.id,
      fields: Object.keys(body.stats)
    });
    
    // 9. Return success
    logRequestEnd(startTime, { ... }, 200);
    return successResponse({ ... });
    
  } catch (error) {
    logRequestEnd(startTime, { ... }, 500);
    return errorResponse(500, 'Internal server error');
  }
}
```

### 2. Write Permission System

**Extend User Document:**
```typescript
interface UserDoc {
  // ... existing fields
  apiKeyEnabled?: boolean // Existing: enable API read access
  apiWriteEnabled?: boolean // NEW: enable API write access
  apiUsageCount?: number
  apiWriteCount?: number // NEW: track write operations separately
  lastAPICallAt?: string
  lastAPIWriteAt?: string // NEW: track last write operation
}
```

**New Auth Function:**
```typescript
/**
 * requireAPIWriteAuth
 * WHAT: Middleware for write endpoints requiring write permissions
 * WHY: Separate read and write permissions for security
 */
export async function requireAPIWriteAuth(request: NextRequest): Promise<{
  success: boolean;
  user?: AdminUser;
  response?: NextResponse;
}> {
  // 1. Perform standard API auth
  const authResult = await requireAPIAuth(request);
  if (!authResult.success) {
    return authResult;
  }
  
  // 2. Check write permission
  const user = await findUserById(authResult.user!.id);
  if (!user?.apiWriteEnabled) {
    return {
      success: false,
      response: NextResponse.json(
        {
          success: false,
          error: 'Write access not enabled for this API user',
          errorCode: 'WRITE_ACCESS_DISABLED'
        },
        { status: 403 }
      )
    };
  }
  
  // 3. Update write usage tracking
  await updateAPIWriteUsage(user._id!.toString());
  
  return {
    success: true,
    user: authResult.user
  };
}
```

### 3. Webhook System

**Webhook Collection Schema:**
```typescript
interface WebhookDoc {
  _id: ObjectId
  url: string // HTTPS only
  secret: string // For HMAC-SHA256 signature
  eventTypes: string[] // ['event.created', 'event.updated']
  active: boolean
  description?: string // Optional description
  
  // Delivery statistics
  totalDeliveries: number
  successfulDeliveries: number
  failedDeliveries: number
  consecutiveFailures: number // Auto-disable after 10
  lastDeliveryAt?: string
  lastDeliveryStatus?: 'success' | 'failed'
  lastDeliveryError?: string
  
  // Timestamps
  createdAt: string
  updatedAt: string
}
```

**Webhook Payload Schema:**
```typescript
interface WebhookPayload {
  event: 'event.created' | 'event.updated'
  timestamp: string // ISO 8601
  data: {
    id: string
    eventName: string
    eventDate: string
    viewSlug: string
    partner?: {
      id: string
      name: string
      emoji: string
    }
    stats: {
      // Current statistics
    }
    imageUrls?: string[] // URLs to event images
    updatedAt: string
  }
}
```

**Webhook Signature:**
```
X-MessMass-Signature: sha256=<HMAC-SHA256(secret, payload_body)>
X-MessMass-Delivery: <delivery_id>
X-MessMass-Event: event.created
```

**Webhook Delivery Service:**
```typescript
/**
 * deliverWebhook
 * WHAT: Deliver webhook notification with retry logic
 * WHY: Ensure reliable delivery to external services
 */
export async function deliverWebhook(
  webhook: WebhookDoc,
  payload: WebhookPayload
): Promise<void> {
  const deliveryId = generateDeliveryId();
  const signature = generateSignature(webhook.secret, payload);
  
  const maxRetries = 3;
  const backoffMs = [1000, 5000, 15000]; // Exponential backoff
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-MessMass-Signature': `sha256=${signature}`,
          'X-MessMass-Delivery': deliveryId,
          'X-MessMass-Event': payload.event,
          'User-Agent': 'MessMass-Webhooks/1.0'
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      
      if (response.ok) {
        // Success
        await updateWebhookStats(webhook._id, 'success');
        await logWebhookDelivery(webhook._id, deliveryId, 'success', response.status);
        return;
      }
      
      // Non-2xx response
      const error = await response.text();
      await logWebhookDelivery(webhook._id, deliveryId, 'failed', response.status, error);
      
      if (attempt < maxRetries - 1) {
        await sleep(backoffMs[attempt]);
      }
      
    } catch (error) {
      // Network error or timeout
      await logWebhookDelivery(webhook._id, deliveryId, 'failed', 0, error.message);
      
      if (attempt < maxRetries - 1) {
        await sleep(backoffMs[attempt]);
      }
    }
  }
  
  // All retries failed
  await updateWebhookStats(webhook._id, 'failed');
  
  // Auto-disable after 10 consecutive failures
  const webhook = await getWebhook(webhook._id);
  if (webhook.consecutiveFailures >= 10) {
    await disableWebhook(webhook._id);
    await createNotification({
      type: 'webhook_disabled',
      webhookId: webhook._id.toString(),
      reason: '10 consecutive failures'
    });
  }
}
```

**Webhook Trigger Points:**
```typescript
// In POST /api/projects (event creation)
await triggerWebhooks('event.created', {
  id: projectId,
  eventName,
  eventDate,
  // ... event data
});

// In PUT /api/projects (event update)
await triggerWebhooks('event.updated', {
  id: projectId,
  eventName,
  eventDate,
  // ... event data
});
```

### 4. Audit Logging

**Audit Log Collection Schema:**
```typescript
interface AuditLogDoc {
  _id: ObjectId
  
  // Context
  eventId: ObjectId
  userId: ObjectId
  userEmail: string
  action: 'stats_update'
  
  // Request metadata
  timestamp: string
  ipAddress: string
  userAgent: string
  source?: string // From request body metadata
  
  // Changes
  changes: {
    field: string
    before: any
    after: any
  }[]
  
  // Additional metadata
  metadata?: {
    processingTime?: number
    confidence?: number
    [key: string]: any
  }
}
```

**Audit Log Functions:**
```typescript
/**
 * createAuditLog
 * WHAT: Create audit log entry for API write operation
 * WHY: Track all external data modifications for compliance
 */
export async function createAuditLog(params: {
  eventId: string
  userId: string
  action: string
  changes: { field: string; before: any; after: any }[]
  metadata?: any
  request: NextRequest
}): Promise<void> {
  const db = await getDb();
  const collection = db.collection('api_audit_logs');
  
  const log: AuditLogDoc = {
    eventId: new ObjectId(params.eventId),
    userId: new ObjectId(params.userId),
    userEmail: await getUserEmail(params.userId),
    action: params.action,
    timestamp: new Date().toISOString(),
    ipAddress: params.request.headers.get('x-forwarded-for') || 'unknown',
    userAgent: params.request.headers.get('user-agent') || 'unknown',
    source: params.metadata?.source,
    changes: params.changes,
    metadata: params.metadata
  };
  
  await collection.insertOne(log);
}

/**
 * getAuditLogs
 * WHAT: Query audit logs with filtering and pagination
 * WHY: Admin UI needs to display audit trail
 */
export async function getAuditLogs(params: {
  eventId?: string
  userId?: string
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number
}): Promise<{ logs: AuditLogDoc[]; total: number }> {
  const db = await getDb();
  const collection = db.collection('api_audit_logs');
  
  const filter: any = {};
  if (params.eventId) filter.eventId = new ObjectId(params.eventId);
  if (params.userId) filter.userId = new ObjectId(params.userId);
  if (params.startDate || params.endDate) {
    filter.timestamp = {};
    if (params.startDate) filter.timestamp.$gte = params.startDate;
    if (params.endDate) filter.timestamp.$lte = params.endDate;
  }
  
  const limit = params.limit || 50;
  const offset = params.offset || 0;
  
  const logs = await collection
    .find(filter)
    .sort({ timestamp: -1 })
    .skip(offset)
    .limit(limit)
    .toArray();
  
  const total = await collection.countDocuments(filter);
  
  return { logs, total };
}
```

### 5. Enhanced Notifications

**Extend Notification Types:**
```typescript
type NotificationType = 
  | 'create'
  | 'edit'
  | 'edit-stats'
  | 'delete'
  | 'api_stats_update' // NEW
  | 'webhook_disabled' // NEW
  | 'webhook_failed'; // NEW

interface NotificationDoc {
  // ... existing fields
  activityType: NotificationType
  apiUser?: {
    id: string
    email: string
  } // NEW: for API activity
  modifiedFields?: string[] // NEW: which stats were changed
}
```

**Notification Creation:**
```typescript
// For API stats updates
await createNotification(db, {
  activityType: 'api_stats_update',
  user: {
    id: authResult.user.id,
    email: authResult.user.email,
    name: authResult.user.name
  },
  projectId: eventId,
  projectName: event.eventName,
  projectSlug: event.viewSlug,
  modifiedFields: Object.keys(statsUpdate)
});
```

## Data Models

### User Document (Extended)
```typescript
interface UserDoc {
  _id: ObjectId
  email: string
  name: string
  role: 'admin' | 'super-admin'
  password: string
  lastLogin?: string
  
  // API Access (existing)
  apiKeyEnabled?: boolean
  apiUsageCount?: number
  lastAPICallAt?: string
  
  // API Write Access (NEW)
  apiWriteEnabled?: boolean
  apiWriteCount?: number
  lastAPIWriteAt?: string
  
  createdAt: string
  updatedAt: string
}
```

### Webhook Document (NEW)
```typescript
interface WebhookDoc {
  _id: ObjectId
  url: string
  secret: string
  eventTypes: string[]
  active: boolean
  description?: string
  totalDeliveries: number
  successfulDeliveries: number
  failedDeliveries: number
  consecutiveFailures: number
  lastDeliveryAt?: string
  lastDeliveryStatus?: 'success' | 'failed'
  lastDeliveryError?: string
  createdAt: string
  updatedAt: string
}
```

### Audit Log Document (NEW)
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
  source?: string
  changes: {
    field: string
    before: any
    after: any
  }[]
  metadata?: any
}
```

### Webhook Delivery Log Document (NEW)
```typescript
interface WebhookDeliveryLogDoc {
  _id: ObjectId
  webhookId: ObjectId
  deliveryId: string
  eventType: string
  status: 'success' | 'failed'
  statusCode: number
  error?: string
  responseTime: number
  timestamp: string
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Authentication grants access
*For any* valid API user with `apiKeyEnabled=true`, authenticating with their Bearer token should grant access to read endpoints.
**Validates: Requirements 1.1**

### Property 2: Event data completeness
*For any* event in the system, requesting its details via `/api/public/events/[id]` should return all required fields (eventName, eventDate, partner, stats, imageUrls).
**Validates: Requirements 1.2**

### Property 3: Partner data completeness
*For any* partner in the system, requesting its details via `/api/public/partners/[id]` should return all required fields (name, emoji, hashtags, events).
**Validates: Requirements 1.3**

### Property 4: Rate limiting enforcement
*For any* API user, making 1001 requests within a 60-second window should result in the 1001st request being rejected with HTTP 429.
**Validates: Requirements 1.4**

### Property 5: Response format consistency
*For any* successful API request, the response should be valid JSON with an ISO 8601 timestamp field.
**Validates: Requirements 1.5**

### Property 6: Write authentication
*For any* valid API user with `apiWriteEnabled=true`, authenticating with their Bearer token should grant access to write endpoints.
**Validates: Requirements 2.1**

### Property 7: Stats update round-trip
*For any* event and any valid stats update, writing stats then reading the event should return the updated values.
**Validates: Requirements 2.2**

### Property 8: Invalid data rejection
*For any* stats update with negative numbers or invalid types, the request should be rejected with HTTP 400 and detailed validation errors.
**Validates: Requirements 2.3**

### Property 9: Non-existent event handling
*For any* non-existent event ID, attempting to update stats should return HTTP 404 with appropriate error message.
**Validates: Requirements 2.4**

### Property 10: Timestamp and recalculation on update
*For any* successful stats injection, the event's `updatedAt` timestamp should be newer than before, and derived metrics should be recalculated.
**Validates: Requirements 2.5**

### Property 11: Notification creation on success
*For any* successful stats injection, a notification record should exist with the service name, event name, and timestamp.
**Validates: Requirements 3.1**

### Property 12: Error notification creation
*For any* failed stats injection, an error notification should exist with the failure reason.
**Validates: Requirements 3.2**

### Property 13: Notification grouping
*For any* set of multiple injections within a time period, notifications should be grouped by time period.
**Validates: Requirements 3.3**

### Property 14: API activity separation
*For any* notification from API activity, it should have a type tag that allows filtering separately from manual edits.
**Validates: Requirements 3.4**

### Property 15: Notification metadata completeness
*For any* API notification, it should contain the list of modified KYC fields.
**Validates: Requirements 3.5**

### Property 16: API user token generation
*For any* API user creation, the password token should be exactly 32 characters of hexadecimal.
**Validates: Requirements 4.1**

### Property 17: Permission assignment
*For any* API user, the `apiKeyEnabled` and `apiWriteEnabled` flags should be stored correctly as specified during creation.
**Validates: Requirements 4.2**

### Property 18: API user data completeness
*For any* API user, viewing their details should return email, name, API enabled status, creation date, and last login date.
**Validates: Requirements 4.3**

### Property 19: API access revocation
*For any* API user, after disabling `apiKeyEnabled`, requests with that user's token should be rejected with HTTP 401.
**Validates: Requirements 4.4**

### Property 20: Usage tracking
*For any* API request, the user's `lastAPICallAt` timestamp should be updated and `apiUsageCount` should be incremented.
**Validates: Requirements 4.5**

### Property 21: Webhook delivery on event creation
*For any* new event creation, all active webhooks with `event.created` in their eventTypes should receive a notification.
**Validates: Requirements 5.1**

### Property 22: Webhook delivery on event update
*For any* event update, all active webhooks with `event.updated` in their eventTypes should receive a notification.
**Validates: Requirements 5.2**

### Property 23: Webhook payload completeness
*For any* webhook notification, the payload should contain event ID, event name, event date, partner information, image URLs, and signature.
**Validates: Requirements 5.3**

### Property 24: Webhook retry logic
*For any* failed webhook delivery, the system should retry up to 3 times with exponential backoff (1s, 5s, 15s).
**Validates: Requirements 5.4**

### Property 25: Webhook delivery logging
*For any* webhook delivery attempt, a log entry should exist with delivery status, response code, and response time.
**Validates: Requirements 5.5**

### Property 26: Webhook URL validation
*For any* webhook registration with a non-HTTPS URL, the request should be rejected with validation error.
**Validates: Requirements 6.1**

### Property 27: Webhook event type configuration
*For any* webhook, the configured event types should be stored correctly and only those event types should trigger deliveries.
**Validates: Requirements 6.2**

### Property 28: Webhook test functionality
*For any* webhook, testing should send a test payload and return the HTTP response from the webhook URL.
**Validates: Requirements 6.3**

### Property 29: Webhook data completeness
*For any* webhook, viewing its details should return URL, event types, status, and delivery statistics.
**Validates: Requirements 6.4**

### Property 30: Webhook disable preserves configuration
*For any* webhook, after disabling, no notifications should be sent, but the webhook record should still exist with all configuration intact.
**Validates: Requirements 6.5**

### Property 31: Webhook signature presence
*For any* webhook notification, the `X-MessMass-Signature` header should be present and contain a valid HMAC-SHA256 signature.
**Validates: Requirements 7.1**

### Property 32: Webhook secret uniqueness
*For any* two webhooks, their secrets should be different (cryptographically unique).
**Validates: Requirements 7.2**

### Property 33: Webhook timestamp inclusion
*For any* webhook payload, a timestamp field should be present in ISO 8601 format.
**Validates: Requirements 7.5**

### Property 34: Demographic variables acceptance
*For any* stats update containing demographic variables (male, female, genAlpha, genYZ, genX, boomer), the update should be accepted and persisted.
**Validates: Requirements 8.1**

### Property 35: Merchandise variables acceptance
*For any* stats update containing merchandise variables (merched, jersey, scarf, flags, baseballCap), the update should be accepted and persisted.
**Validates: Requirements 8.2**

### Property 36: Fan count variables acceptance
*For any* stats update containing fan count variables (remoteFans, stadium, indoor, outdoor), the update should be accepted and persisted.
**Validates: Requirements 8.3**

### Property 37: Non-negative integer validation
*For any* stats update with negative numbers, the request should be rejected with validation error.
**Validates: Requirements 8.4**

### Property 38: Derived metrics recalculation
*For any* stats update, derived metrics (totalFans, totalImages, conversionRates) should be automatically recalculated based on the formulas.
**Validates: Requirements 8.5**

### Property 39: Audit log creation
*For any* stats injection, an audit log entry should exist with service name, API user email, timestamp, and modified fields.
**Validates: Requirements 9.1**

### Property 40: Audit log before/after values
*For any* audit log entry, it should contain both before and after values for all modified statistics.
**Validates: Requirements 9.2**

### Property 41: Audit log filtering
*For any* audit log query with filters (event, date range, modified fields), the results should only include logs matching all specified filters.
**Validates: Requirements 9.3**

### Property 42: Audit log metadata
*For any* audit log entry, it should contain the IP address and user agent of the requesting service.
**Validates: Requirements 9.4**

### Property 43: Audit log pagination
*For any* audit log query, requesting page 2 with limit 50 should return entries 51-100.
**Validates: Requirements 9.5**

### Property 44: Endpoint documentation completeness
*For any* integration endpoint, the OpenAPI documentation should include request schema, response schema, authentication requirements, and error codes.
**Validates: Requirements 10.3**

## Error Handling

### Error Response Format

All error responses follow the existing Public API pattern:

```typescript
interface ErrorResponse {
  success: false
  error: string // Human-readable error message
  errorCode: string // Machine-readable error code
  details?: any // Optional additional details
  timestamp: string // ISO 8601
}
```

### Error Codes

**Authentication Errors (4xx):**
- `MISSING_TOKEN` - No Authorization header provided
- `INVALID_TOKEN` - Bearer token not found in users collection
- `API_ACCESS_DISABLED` - User exists but apiKeyEnabled=false
- `WRITE_ACCESS_DISABLED` - User exists but apiWriteEnabled=false
- `COOKIES_NOT_ALLOWED` - Request included cookies (not allowed)

**Validation Errors (4xx):**
- `INVALID_EVENT_ID` - Event ID is not a valid ObjectId
- `EVENT_NOT_FOUND` - Event does not exist
- `INVALID_STATS_DATA` - Stats data failed validation
- `NEGATIVE_VALUE` - Numeric value is negative
- `INVALID_TYPE` - Field has wrong data type
- `MISSING_REQUIRED_FIELD` - Required field is missing

**Webhook Errors (4xx):**
- `INVALID_WEBHOOK_URL` - URL is not HTTPS
- `WEBHOOK_NOT_FOUND` - Webhook does not exist
- `WEBHOOK_DISABLED` - Webhook is disabled

**Rate Limiting (4xx):**
- `RATE_LIMIT_EXCEEDED` - Too many requests

**Server Errors (5xx):**
- `INTERNAL_ERROR` - Unexpected server error
- `DATABASE_ERROR` - Database operation failed
- `WEBHOOK_DELIVERY_FAILED` - All webhook delivery attempts failed

### Error Handling Strategy

1. **Validation Errors:** Return immediately with 400 and detailed error messages
2. **Authentication Errors:** Return 401 with WWW-Authenticate header
3. **Permission Errors:** Return 403 with clear explanation
4. **Not Found Errors:** Return 404 with resource type
5. **Rate Limit Errors:** Return 429 with Retry-After header
6. **Server Errors:** Log full error, return 500 with generic message (don't expose internals)

### Webhook Delivery Error Handling

**Retry Strategy:**
- Attempt 1: Immediate
- Attempt 2: After 1 second
- Attempt 3: After 5 seconds
- Attempt 4: After 15 seconds

**Failure Handling:**
- Log each failed attempt with error details
- Increment `consecutiveFailures` counter
- After 10 consecutive failures, auto-disable webhook
- Create admin notification when webhook is auto-disabled

**Timeout Handling:**
- 10 second timeout per delivery attempt
- Treat timeout as failed delivery
- Include timeout in retry logic

## Testing Strategy

### Unit Testing

**Authentication Tests:**
- Valid Bearer token grants access
- Invalid token returns 401
- Disabled API access returns 401
- Disabled write access returns 403
- Missing token returns 401
- Cookie-based auth is rejected

**Validation Tests:**
- Valid stats update is accepted
- Negative numbers are rejected
- Invalid types are rejected
- Missing event returns 404
- Invalid event ID returns 400

**Stats Update Tests:**
- Stats are persisted correctly
- Derived metrics are recalculated
- Timestamp is updated
- Audit log is created
- Notification is created

**Webhook Tests:**
- Webhook is triggered on event creation
- Webhook is triggered on event update
- Signature is generated correctly
- Retry logic works with exponential backoff
- Auto-disable after 10 failures
- Disabled webhooks don't receive notifications

**Audit Log Tests:**
- Audit log is created on write
- Before/after values are captured
- Filtering works correctly
- Pagination works correctly

### Property-Based Testing

We will use **fast-check** (JavaScript/TypeScript property-based testing library) for property tests.

**Configuration:**
- Minimum 100 iterations per property test
- Each test tagged with property number and requirement reference

**Property Test Examples:**

```typescript
import fc from 'fast-check';

// Property 7: Stats update round-trip
test('Property 7: Stats update round-trip', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.record({
        male: fc.nat(),
        female: fc.nat(),
        remoteFans: fc.nat()
      }),
      async (stats) => {
        // Feature: third-party-fan-data-integration, Property 7: Stats update round-trip
        // Validates: Requirements 2.2
        
        const event = await createTestEvent();
        await updateEventStats(event.id, stats);
        const updated = await getEvent(event.id);
        
        expect(updated.stats.male).toBe(stats.male);
        expect(updated.stats.female).toBe(stats.female);
        expect(updated.stats.remoteFans).toBe(stats.remoteFans);
      }
    ),
    { numRuns: 100 }
  );
});

// Property 8: Invalid data rejection
test('Property 8: Invalid data rejection', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.record({
        male: fc.integer({ max: -1 }) // Generate negative numbers
      }),
      async (invalidStats) => {
        // Feature: third-party-fan-data-integration, Property 8: Invalid data rejection
        // Validates: Requirements 2.3
        
        const event = await createTestEvent();
        const response = await updateEventStats(event.id, invalidStats);
        
        expect(response.status).toBe(400);
        expect(response.body.errorCode).toBe('NEGATIVE_VALUE');
      }
    ),
    { numRuns: 100 }
  );
});

// Property 24: Webhook retry logic
test('Property 24: Webhook retry logic', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.record({
        eventName: fc.string(),
        eventDate: fc.date().map(d => d.toISOString())
      }),
      async (eventData) => {
        // Feature: third-party-fan-data-integration, Property 24: Webhook retry logic
        // Validates: Requirements 5.4
        
        const webhook = await createTestWebhook({ url: 'https://failing-endpoint.test' });
        const deliveryLogs = [];
        
        // Mock fetch to fail
        global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
        
        await deliverWebhook(webhook, { event: 'event.created', data: eventData });
        
        const logs = await getWebhookDeliveryLogs(webhook._id);
        
        // Should have 4 attempts (initial + 3 retries)
        expect(logs.length).toBe(4);
        
        // Check timing between attempts (approximately 1s, 5s, 15s)
        const timings = logs.map((log, i) => 
          i > 0 ? new Date(log.timestamp) - new Date(logs[i-1].timestamp) : 0
        );
        
        expect(timings[1]).toBeGreaterThanOrEqual(900); // ~1s
        expect(timings[2]).toBeGreaterThanOrEqual(4500); // ~5s
        expect(timings[3]).toBeGreaterThanOrEqual(14000); // ~15s
      }
    ),
    { numRuns: 100 }
  );
});
```

### Integration Testing

**End-to-End Flow Tests:**
1. Create API user with write permissions
2. Authenticate with Bearer token
3. Create event via admin API
4. Verify webhook is delivered
5. Inject stats via public API
6. Verify stats are persisted
7. Verify audit log exists
8. Verify notification exists
9. Verify derived metrics are correct

**Webhook Integration Tests:**
1. Register webhook with test server
2. Create event
3. Verify webhook received correct payload
4. Verify signature is valid
5. Update event
6. Verify webhook received update
7. Disable webhook
8. Create another event
9. Verify webhook was not called

### Manual Testing Checklist

- [ ] Create API user via admin UI
- [ ] Enable API access and write access
- [ ] Copy Bearer token
- [ ] Test read endpoints with Postman/cURL
- [ ] Test write endpoint with valid data
- [ ] Test write endpoint with invalid data
- [ ] Verify audit logs in admin UI
- [ ] Verify notifications in admin UI
- [ ] Register webhook
- [ ] Test webhook delivery
- [ ] Verify webhook signature
- [ ] Test webhook retry on failure
- [ ] Test webhook auto-disable after 10 failures

## Performance Considerations

### Database Indexes

**Required Indexes:**
```javascript
// users collection
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ password: 1 }) // For API key lookup
db.users.createIndex({ apiKeyEnabled: 1 })

// webhooks collection
db.webhooks.createIndex({ active: 1 })
db.webhooks.createIndex({ eventTypes: 1 })

// api_audit_logs collection
db.api_audit_logs.createIndex({ eventId: 1 })
db.api_audit_logs.createIndex({ userId: 1 })
db.api_audit_logs.createIndex({ timestamp: -1 })
db.api_audit_logs.createIndex({ eventId: 1, timestamp: -1 })

// webhook_delivery_logs collection
db.webhook_delivery_logs.createIndex({ webhookId: 1, timestamp: -1 })
db.webhook_delivery_logs.createIndex({ timestamp: -1 })
```

### Caching Strategy

**No caching for write operations** - Always read from database to ensure consistency

**Webhook configuration caching:**
- Cache active webhooks in memory for 5 minutes
- Invalidate cache on webhook create/update/delete
- Reduces database queries on every event creation/update

### Rate Limiting

**Existing rate limits (reuse):**
- Anonymous: 60 requests/minute per IP
- Authenticated: 1000 requests/minute per user

**Write-specific limits (new):**
- Write operations: 100 requests/minute per user
- Prevents abuse of stats injection endpoint

### Webhook Delivery Performance

**Async delivery:**
- Webhook delivery happens asynchronously (don't block event creation/update)
- Use background job queue (or simple setTimeout for MVP)
- Event creation/update returns immediately

**Timeout:**
- 10 second timeout per webhook delivery
- Prevents slow webhooks from blocking system

**Concurrent deliveries:**
- Deliver to multiple webhooks in parallel
- Use Promise.all() for concurrent HTTP requests

### Audit Log Performance

**Write performance:**
- Audit logs written asynchronously (don't block response)
- Use fire-and-forget pattern with error logging

**Query performance:**
- Compound indexes for common filter combinations
- Pagination to limit result set size
- Consider archiving old logs (>1 year) to separate collection

## Security Considerations

### Authentication Security

**Bearer Token Security:**
- Tokens are 32-character hex strings (128 bits of entropy)
- Stored as plaintext in database (acceptable for v1, see roadmap)
- Transmitted over HTTPS only
- Never logged in full (only last 4 characters)

**Permission Model:**
- Separate read and write permissions
- Write permission is opt-in (apiWriteEnabled flag)
- Admin can revoke access instantly

### Webhook Security

**Signature Verification:**
- HMAC-SHA256 signature on every webhook
- Secret is unique per webhook (32-byte random)
- Signature includes full payload body
- Prevents tampering and spoofing

**URL Validation:**
- Only HTTPS URLs allowed
- Prevents man-in-the-middle attacks
- Validates URL format before saving

**Replay Attack Prevention:**
- Timestamp included in payload
- Fanmass should reject old notifications (>5 minutes)

### Input Validation

**Stats Data Validation:**
- All numeric values must be non-negative integers
- Field names must match known KYC variables
- No arbitrary fields allowed
- Prevents injection attacks

**Event ID Validation:**
- Must be valid MongoDB ObjectId
- Prevents NoSQL injection

### Audit Trail

**Complete Audit Logging:**
- Every write operation logged
- IP address and user agent captured
- Before/after values recorded
- Immutable audit logs (no updates/deletes)

### Rate Limiting

**DDoS Protection:**
- Rate limits enforced per user
- Prevents abuse and resource exhaustion
- Returns 429 with Retry-After header

## Deployment Considerations

### Environment Variables

**New environment variables:**
```bash
# Webhook configuration
WEBHOOK_TIMEOUT_MS=10000
WEBHOOK_MAX_RETRIES=3
WEBHOOK_RETRY_BACKOFF_MS=1000,5000,15000

# Rate limiting
API_WRITE_RATE_LIMIT=100 # per minute per user

# Audit log retention
AUDIT_LOG_RETENTION_DAYS=365
```

### Database Migrations

**Migration 1: Add API write fields to users**
```javascript
db.users.updateMany(
  {},
  {
    $set: {
      apiWriteEnabled: false,
      apiWriteCount: 0
    }
  }
)
```

**Migration 2: Create webhooks collection**
```javascript
db.createCollection('webhooks')
db.webhooks.createIndex({ active: 1 })
db.webhooks.createIndex({ eventTypes: 1 })
```

**Migration 3: Create audit logs collection**
```javascript
db.createCollection('api_audit_logs')
db.api_audit_logs.createIndex({ eventId: 1 })
db.api_audit_logs.createIndex({ userId: 1 })
db.api_audit_logs.createIndex({ timestamp: -1 })
```

**Migration 4: Create webhook delivery logs collection**
```javascript
db.createCollection('webhook_delivery_logs')
db.webhook_delivery_logs.createIndex({ webhookId: 1, timestamp: -1 })
```

### Monitoring and Alerting

**Metrics to Monitor:**
- API write request rate
- API write error rate
- Webhook delivery success rate
- Webhook delivery latency
- Audit log write rate
- Database query performance

**Alerts to Configure:**
- Webhook delivery failure rate > 10%
- API write error rate > 5%
- Webhook auto-disabled (immediate alert)
- Audit log write failures
- Database connection errors

### Rollback Plan

**If issues arise:**
1. Disable write endpoint (return 503)
2. Disable webhook delivery
3. Investigate audit logs
4. Fix issues
5. Re-enable gradually

**Feature Flags:**
- `ENABLE_API_WRITE` - Toggle write endpoint
- `ENABLE_WEBHOOKS` - Toggle webhook delivery
- `ENABLE_AUDIT_LOGS` - Toggle audit logging

## Future Enhancements

### Phase 2: Enhanced Security

- Dedicated API keys (separate from login password)
- API key rotation
- Multiple keys per user with scopes
- Key expiration dates
- Hashed API keys in database

### Phase 3: Advanced Webhooks

- Webhook payload filtering (only send specific fields)
- Webhook transformation templates
- Webhook batching (group multiple events)
- Webhook replay (resend past events)

### Phase 4: Analytics Dashboard

- API usage dashboard for admins
- Webhook delivery statistics
- Audit log visualization
- Data quality metrics from Fanmass

### Phase 5: Bidirectional Sync

- Fanmass can query for events needing processing
- Status tracking (pending, processing, completed)
- Progress updates from Fanmass
- Batch processing support

## Documentation Requirements

### API Documentation

**OpenAPI 3.0 Specification:**
- Complete schema for all endpoints
- Request/response examples
- Authentication requirements
- Error codes and descriptions

**Code Examples:**
- JavaScript/Node.js
- Python
- cURL

**Webhook Documentation:**
- Payload schema
- Signature verification code
- Retry behavior
- Error handling

### Admin Documentation

**User Guide:**
- How to create API users
- How to enable write access
- How to configure webhooks
- How to view audit logs
- How to monitor API activity

**Troubleshooting Guide:**
- Common error codes and solutions
- Webhook delivery failures
- Rate limiting issues
- Permission problems

## Conclusion

This design extends the existing MessMass Public API with write capabilities, webhooks, and audit logging to enable seamless integration with Fanmass. The design follows existing patterns, reuses infrastructure, and maintains consistency with the current system architecture.

**Key Design Decisions:**
1. Extend existing Public API rather than create separate system
2. Reuse existing authentication and user management
3. Add write permissions as separate flag for security
4. Implement webhooks as async background service
5. Comprehensive audit logging for compliance
6. Property-based testing for correctness guarantees

**Implementation Priority:**
1. Write endpoint for stats injection (highest value)
2. Audit logging (compliance requirement)
3. Enhanced notifications (admin visibility)
4. Webhook system (automation)
5. Admin UI for webhook management (usability)
