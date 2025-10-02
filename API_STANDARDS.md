# API Standards Documentation

**Version**: 5.18.0  
**Last Updated**: 2025-10-02T11:30:00.000Z  
**Status**: Active Standard

---

## Overview

This document defines the API standards for MessMass. All API endpoints MUST follow these conventions to ensure consistency, maintainability, and excellent developer experience.

**Principles**:
1. **Consistency**: All endpoints use the same response structure
2. **Type Safety**: Full TypeScript support with runtime validation
3. **Error Handling**: Standardized error codes and messages
4. **Documentation**: Self-documenting through types and examples

---

## Response Format

### Standard Response Envelope

All API responses follow this structure:

```typescript
interface APIResponse<T> {
  success: boolean;      // Operation success indicator
  data?: T;             // Response data (present on success)
  error?: APIError;     // Error details (present on failure)
  meta?: APIResponseMeta; // Metadata (timestamp, requestId)
}
```

### Success Response Example

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "eventName": "MTK vs DVTK",
    "eventDate": "2025-08-15",
    "stats": { ... }
  },
  "meta": {
    "timestamp": "2025-10-02T11:30:00.123Z"
  }
}
```

### Error Response Example

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Project with identifier \"invalid-id\" not found",
    "timestamp": "2025-10-02T11:30:00.123Z"
  },
  "meta": {
    "timestamp": "2025-10-02T11:30:00.123Z"
  }
}
```

### Paginated Response Example

```json
{
  "success": true,
  "data": [
    { ...project1 },
    { ...project2 }
  ],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 150,
    "hasMore": true,
    "nextOffset": 20
  },
  "meta": {
    "timestamp": "2025-10-02T11:30:00.123Z"
  }
}
```

---

## HTTP Status Codes

### Success Codes
- `200 OK`: Standard successful response
- `201 Created`: Resource successfully created
- `204 No Content`: Successful deletion (no response body)

### Client Error Codes (4xx)
- `400 Bad Request`: Invalid request format or parameters
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Authenticated but not authorized
- `404 Not Found`: Resource does not exist
- `409 Conflict`: Duplicate resource or state conflict
- `422 Unprocessable Entity`: Validation failed

### Server Error Codes (5xx)
- `500 Internal Server Error`: Unexpected server error
- `503 Service Unavailable`: Temporary service outage

---

## Error Codes

### Standard Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `BAD_REQUEST` | 400 | Invalid request format |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Permission denied |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource conflict |
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `DUPLICATE_ENTRY` | 409 | Resource already exists |
| `INVALID_OPERATION` | 422 | Operation not allowed |
| `RESOURCE_LIMIT_EXCEEDED` | 422 | Quota or limit reached |
| `DATABASE_ERROR` | 500 | Database operation failed |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

### Error Response Fields

```typescript
interface APIError {
  code: string;         // Machine-readable error code
  message: string;      // Human-readable error message
  details?: unknown;    // Additional error context
  field?: string;       // Field name (for validation errors)
  timestamp: string;    // ISO 8601 timestamp
}
```

---

## Implementation Guide

### Creating API Routes

Use the standard response helpers from `lib/api/response.ts`:

#### Success Response

```typescript
import { successResponse } from '@/lib/api/response';
import { HTTP_STATUS_CODES } from '@/lib/types/api';

export async function GET(request: Request) {
  const projects = await getProjects();
  return successResponse(projects);
}

export async function POST(request: Request) {
  const newProject = await createProject(data);
  return successResponse(
    newProject,
    { status: HTTP_STATUS_CODES.CREATED }
  );
}
```

#### Error Response

```typescript
import { errorResponse, notFoundResponse } from '@/lib/api/response';
import { APIErrorCode } from '@/lib/types/api';

export async function GET(request: Request) {
  const project = await findProject(id);
  
  if (!project) {
    return notFoundResponse('Project', id);
  }
  
  return successResponse(project);
}
```

#### Paginated Response

```typescript
import { paginatedResponse } from '@/lib/api/response';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');
  
  const { projects, total } = await getProjects(limit, offset);
  
  return paginatedResponse(projects, {
    limit,
    offset,
    total,
    hasMore: offset + limit < total,
    nextOffset: offset + limit < total ? offset + limit : undefined
  });
}
```

#### Input Validation

```typescript
import { validateRequiredFields, errorResponse } from '@/lib/api/response';
import { APIErrorCode } from '@/lib/types/api';

export async function POST(request: Request) {
  const body = await request.json();
  
  // Validate required fields
  const validationError = validateRequiredFields(body, ['eventName', 'eventDate']);
  if (validationError) return validationError;
  
  // Additional validation
  if (!isValidDate(body.eventDate)) {
    return errorResponse(
      APIErrorCode.VALIDATION_ERROR,
      'Invalid date format',
      { field: 'eventDate', details: { format: 'YYYY-MM-DD' } }
    );
  }
  
  const project = await createProject(body);
  return successResponse(project, { status: HTTP_STATUS_CODES.CREATED });
}
```

#### Error Handling Wrapper

```typescript
import { withErrorHandling } from '@/lib/api/response';

export const GET = withErrorHandling(async (request: Request) => {
  // If any unhandled error occurs, it will be caught and formatted
  const projects = await getProjects(); // Might throw
  return successResponse(projects);
});
```

---

## Pagination Standards

### Query Parameters

- `limit`: Number of items per page (default: 20, max: 100)
- `offset`: Number of items to skip (for offset-based pagination)
- `cursor`: Opaque cursor string (for cursor-based pagination)

### Pagination Response Fields

```typescript
interface PaginationConfig {
  limit: number;        // Items per page
  offset?: number;      // Current offset (offset pagination)
  cursor?: string;      // Current cursor (cursor pagination)
  total?: number;       // Total items (if available)
  hasMore: boolean;     // Whether more items exist
  nextOffset?: number;  // Next offset (offset pagination)
  nextCursor?: string;  // Next cursor (cursor pagination)
}
```

### Offset-Based Pagination Example

**Request**:
```
GET /api/projects?limit=20&offset=40
```

**Response**:
```json
{
  "success": true,
  "data": [ ...items ],
  "pagination": {
    "limit": 20,
    "offset": 40,
    "total": 150,
    "hasMore": true,
    "nextOffset": 60
  }
}
```

### Cursor-Based Pagination Example

**Request**:
```
GET /api/projects?limit=20&cursor=eyJfaWQiOiI1MDdmMWY3NyJ9
```

**Response**:
```json
{
  "success": true,
  "data": [ ...items ],
  "pagination": {
    "limit": 20,
    "cursor": "eyJfaWQiOiI1MDdmMWY3NyJ9",
    "hasMore": true,
    "nextCursor": "eyJfaWQiOiI1MDdmMWY4OCJ9"
  }
}
```

---

## Authentication & Authorization

### Protected Routes

Use middleware or route-level checks:

```typescript
import { unauthorizedResponse, forbiddenResponse } from '@/lib/api/response';
import { getSession } from '@/lib/auth';

export async function DELETE(request: Request) {
  const session = await getSession();
  
  if (!session) {
    return unauthorizedResponse();
  }
  
  if (session.role !== 'admin') {
    return forbiddenResponse();
  }
  
  await deleteResource(id);
  return successResponse({ message: 'Deleted successfully' });
}
```

---

## Best Practices

### DO ✅

1. **Always use response helpers**
   ```typescript
   return successResponse(data);
   return errorResponse(APIErrorCode.NOT_FOUND, 'Not found');
   ```

2. **Validate input early**
   ```typescript
   const validationError = validateRequiredFields(body, ['field1', 'field2']);
   if (validationError) return validationError;
   ```

3. **Use proper HTTP status codes**
   ```typescript
   return successResponse(newResource, { status: HTTP_STATUS_CODES.CREATED });
   ```

4. **Provide helpful error messages**
   ```typescript
   return errorResponse(
     APIErrorCode.VALIDATION_ERROR,
     'Invalid email format. Expected format: user@example.com',
     { field: 'email' }
   );
   ```

5. **Include pagination for list endpoints**
   ```typescript
   return paginatedResponse(items, { limit, offset, total, hasMore });
   ```

### DON'T ❌

1. **Don't return inconsistent formats**
   ```typescript
   // ❌ Bad
   return NextResponse.json({ items, count });
   
   // ✅ Good
   return successResponse({ items, count });
   ```

2. **Don't use generic error messages**
   ```typescript
   // ❌ Bad
   return errorResponse(APIErrorCode.INTERNAL_ERROR, 'Error');
   
   // ✅ Good
   return errorResponse(APIErrorCode.NOT_FOUND, 'Project with ID "123" not found');
   ```

3. **Don't mix response formats**
   ```typescript
   // ❌ Bad - some routes return { success, data }, others return data directly
   
   // ✅ Good - all routes use successResponse()
   ```

4. **Don't skip validation**
   ```typescript
   // ❌ Bad
   const project = await createProject(body); // Might fail with obscure error
   
   // ✅ Good
   const validationError = validateRequiredFields(body, ['eventName', 'eventDate']);
   if (validationError) return validationError;
   const project = await createProject(body);
   ```

---

## Type Safety

### Using DTOs (Data Transfer Objects)

Always use typed DTOs for responses:

```typescript
import type { ProjectDTO, ProjectResponse } from '@/lib/types/api';

export async function GET(request: Request): Promise<NextResponse<ProjectResponse>> {
  const project: ProjectDTO = await getProject(id);
  return successResponse(project);
}
```

### Client-Side Type Usage

```typescript
import type { APIResponse, ProjectDTO } from '@/lib/types/api';
import { isSuccessResponse, isErrorResponse } from '@/lib/types/api';

async function fetchProject(id: string): Promise<ProjectDTO> {
  const response = await fetch(`/api/projects/${id}`);
  const data: APIResponse<ProjectDTO> = await response.json();
  
  if (isSuccessResponse(data)) {
    return data.data; // TypeScript knows data.data is ProjectDTO
  }
  
  if (isErrorResponse(data)) {
    throw new Error(data.error.message);
  }
  
  throw new Error('Invalid response format');
}
```

---

## Migration Checklist

When updating existing API routes to this standard:

- [ ] Import response helpers from `lib/api/response`
- [ ] Replace direct `NextResponse.json()` with `successResponse()`
- [ ] Replace error responses with `errorResponse()` or specific helpers
- [ ] Add input validation using `validateRequiredFields()`
- [ ] Use proper error codes from `APIErrorCode` enum
- [ ] Add pagination support for list endpoints
- [ ] Update TypeScript types to use DTOs from `lib/types/api`
- [ ] Test success and error cases
- [ ] Update client-side consumers if needed

---

## Reference

### Key Files

- **Type Definitions**: `lib/types/api.ts`
- **Response Helpers**: `lib/api/response.ts`
- **Usage Examples**: This document

### Related Documentation

- **ARCHITECTURE.md**: System architecture overview
- **WARP.md**: Development guidelines and protocols
- **LEARNINGS.md**: Historical decisions and lessons

---

**Document Status**: Living Standard  
**Enforcement**: Mandatory for all new and refactored API routes  
**Exceptions**: Must be documented and approved
