# API Access Enhancement Plan
Status: Archived
Last Updated: 2026-01-11T22:28:38.000Z
Canonical: No
Owner: Architecture

**Version:** 10.6.0  
**Created:** 2025-11-05T12:35:00.000Z  
**Status:** Ready for Implementation

---

## 📋 Current State Analysis

### ✅ What We Already Have

#### 1. Public API Endpoints (Production-Ready)
- **`GET /api/public/partners`** - List all partners with pagination
- **`GET /api/public/partners/{id}`** - Get partner by MongoDB ObjectId
- **`GET /api/public/partners/{id}/events`** - Get partner's events
- **`GET /api/public/events/{id}`** - Get event by MongoDB ObjectId

**Features:**
- ✅ Bearer token authentication (32-character hex API keys)
- ✅ Rate limiting (1000 requests/minute for authenticated users)
- ✅ Pagination support (limit/offset)
- ✅ Search and sorting capabilities
- ✅ ISO 8601 timestamp format
- ✅ CORS enabled for cross-origin requests
- ✅ Comprehensive error handling

**Documentation:** `API_PUBLIC.md` (complete with code examples)

#### 2. API Access Backend Infrastructure
- **`PUT /api/admin/local-users/[id]/api-access`** - Enable/disable API access per user
- **Database Schema:** Users collection includes:
  - `apiKeyEnabled`: boolean (default: false)
  - `apiUsageCount`: number (tracks usage)
  - `lastAPICallAt`: ISO 8601 timestamp

**Authentication Flow:**
1. User credentials stored in `users` collection (MongoDB)
2. Password field doubles as API key (32-char hex MD5-style token)
3. Bearer token auth validates against user.password field
4. Access only granted if `apiKeyEnabled === true`

#### 3. User Management UI
- **Location:** `/admin/users`
- **Current Features:**
  - ✅ Create admin users
  - ✅ Regenerate passwords
  - ✅ Delete users
  - ✅ View user list with pagination
- **Missing Features:**
  - ❌ Role selection during creation (currently hardcoded to 'admin')
  - ❌ API access toggle UI
  - ❌ API usage statistics display
  - ❌ API key visibility (requires regenerate password)

---

## 🎯 Enhancement Requirements

### User Story
> "As an administrator, I want to create API users with dedicated API keys so that external systems can securely access MessMass partner and event data via the Public API."

### Acceptance Criteria

#### 1. Create User Modal Enhancement
**Location:** `app/admin/users/page.tsx` (FormModal component)

**Add Role Selection:**
```tsx
<div className="form-group mb-6">
  <label className="form-label-block text-sm text-gray-700">
    User Type *
  </label>
  <select 
    className="form-input" 
    value={role} 
    onChange={(e) => setRole(e.target.value)}
  >
    <option value="admin">Admin User (Dashboard Access)</option>
    <option value="api">API User (Programmatic Access)</option>
  </select>
  <p className="form-help-text mt-2">
    Admin users log in via web interface. API users authenticate with Bearer tokens.
  </p>
</div>
```

**API User Fields** (conditional, shown only when role='api'):
```tsx
{role === 'api' && (
  <div className="info-box mb-6">
    <p><strong>API User Configuration:</strong></p>
    <ul>
      <li>✅ API access automatically enabled</li>
      <li>✅ 32-character API key generated</li>
      <li>✅ Bearer token authentication</li>
      <li>❌ No web dashboard access</li>
    </ul>
  </div>
)}
```

#### 2. Backend API Update
**File:** `app/api/admin/local-users/route.ts`

**Current POST Logic:**
```typescript
// Hardcoded role:
role: 'admin'
```

**Enhanced POST Logic:**
```typescript
const body = await request.json()
const emailRaw = (body?.email || '').toString()
const name = (body?.name || '').toString()
const requestedRole = body?.role || 'admin'  // NEW: Accept role from request

// WHAT: Validate role is either 'admin' or 'api'
// WHY: Security - prevent arbitrary role creation
const role = ['admin', 'api'].includes(requestedRole) ? requestedRole : 'admin'

// WHAT: Auto-enable API access for 'api' role users
// WHY: API users need immediate access without additional toggle
const apiKeyEnabled = (role === 'api')

const created = await createUser({
  email,
  name,
  role,
  password,
  apiKeyEnabled,  // NEW: Set based on role
  createdAt: now,
  updatedAt: now
})
```

#### 3. User List Display Enhancement
**Location:** `lib/adapters/usersAdapter.tsx`

**Add API Access Column:**
```typescript
columns: [
  { key: 'email', label: 'Email', sortable: true },
  { key: 'name', label: 'Name', sortable: true },
  { key: 'role', label: 'Role', sortable: true },
  { key: 'apiAccess', label: 'API Access', sortable: false }, // NEW
  { key: 'apiUsageCount', label: 'API Usage', sortable: true }, // NEW
  { key: 'lastAPICallAt', label: 'Last API Call', sortable: true }, // NEW
  { key: 'updatedAt', label: 'Updated', sortable: true },
  { key: 'actions', label: 'Actions', sortable: false }
]
```

**Data Rendering:**
```typescript
// In adapter's data transformation:
apiAccess: user.apiKeyEnabled 
  ? '✅ Enabled' 
  : '❌ Disabled',
apiUsageCount: (user.apiUsageCount || 0).toLocaleString(),
lastAPICallAt: user.lastAPICallAt 
  ? new Date(user.lastAPICallAt).toLocaleString() 
  : 'Never'
```

#### 4. API Access Toggle Button
**Location:** Row actions in user list

**Add Toggle Action:**
```typescript
rowActions: [
  {
    label: user => user.apiKeyEnabled ? 'Disable API' : 'Enable API',
    icon: user => user.apiKeyEnabled ? '🔒' : '🔓',
    variant: user => user.apiKeyEnabled ? 'warning' : 'success',
    handler: async (user) => {
      const newState = !user.apiKeyEnabled
      const confirmed = window.confirm(
        newState 
          ? 'Enable API access for this user?' 
          : 'Disable API access? Active integrations may break.'
      )
      if (!confirmed) return
      
      const data = await apiPut(
        `/api/admin/local-users/${user.id}/api-access`,
        { enabled: newState }
      )
      
      if (data.success) {
        await refreshUsers()
        if (newState && data.recommendation) {
          alert(data.recommendation)
        }
      }
    }
  },
  { label: 'Regenerate', icon: '🔄', variant: 'secondary', handler: onRegenerate },
  { label: 'Delete', icon: '🗑️', variant: 'danger', handler: onDelete }
]
```

---

## 🔐 Security Considerations

### API Key Storage
- **Current:** User password field stores 32-char hex token (MD5-style)
- **Authentication:** Bearer token validates against `users.password`
- **Access Control:** Requires `apiKeyEnabled === true`

### Best Practices
1. **Separate API Users:** API role cannot log in to web dashboard (security boundary)
2. **Usage Tracking:** All API calls increment `apiUsageCount` and update `lastAPICallAt`
3. **Rate Limiting:** 1000 req/min per authenticated user (existing infrastructure)
4. **Key Rotation:** Regenerate password = new API key (existing functionality)
5. **Audit Logging:** All enable/disable actions logged (existing)

### Anti-Patterns to Avoid
❌ Don't allow admin users to use their passwords as API keys (security risk)  
❌ Don't show API keys in plain text after initial generation (one-time display only)  
❌ Don't allow API users to log in to web dashboard (role separation)

---

## 📊 Database Schema Impact

### No Schema Changes Required ✅

**Existing Fields (Already Sufficient):**
```typescript
interface User {
  _id: ObjectId
  email: string
  name: string
  role: 'admin' | 'api'           // NEW VALUE: 'api' (no schema change)
  password: string                 // Serves as API key for 'api' role
  apiKeyEnabled: boolean           // Already exists
  apiUsageCount: number           // Already exists
  lastAPICallAt: string           // Already exists
  createdAt: string
  updatedAt: string
}
```

**Why No Migration?**
- Role field accepts any string (MongoDB flexibility)
- New 'api' value is just another valid enum entry
- All API access fields already exist from v10.5.1

---

## 🛠️ Implementation Plan

### Phase 1: Backend (30 minutes)
1. ✅ Update `POST /api/admin/local-users` to accept `role` parameter
2. ✅ Auto-set `apiKeyEnabled: true` for `role === 'api'`
3. ✅ Update response to include `apiKeyEnabled` status
4. ✅ Add validation: role must be 'admin' or 'api'

### Phase 2: Frontend - Create Modal (45 minutes)
1. ✅ Add `role` state to component
2. ✅ Add role selection dropdown to FormModal
3. ✅ Add conditional info box for API users
4. ✅ Update submit handler to pass role
5. ✅ Update PasswordModal title based on role ("API Key" vs "Password")

### Phase 3: Frontend - List View (45 minutes)
1. ✅ Update `usersAdapter` columns (add API Access, Usage, Last Call)
2. ✅ Add API toggle button to row actions
3. ✅ Implement toggle handler with confirmation
4. ✅ Add success/error toasts for toggle actions
5. ✅ Add visual badge for API vs Admin users

### Phase 4: Testing (30 minutes)
1. ✅ Create admin user → verify web login works
2. ✅ Create API user → verify web login blocked
3. ✅ Enable API access → test Bearer token auth
4. ✅ Make API calls → verify usage counter increments
5. ✅ Disable API access → verify 403 Forbidden response
6. ✅ Regenerate API key → verify old key rejected

### Phase 5: Documentation (20 minutes)
1. ✅ Update `API_PUBLIC.md` with user type examples
2. ✅ Update `AUTHENTICATION_AND_ACCESS.md` with role explanation
3. ✅ Add screenshots to user management guide
4. ✅ Update version in all docs

**Total Estimated Time:** 2.5 hours

---

## 🧪 Testing Scenarios

### Scenario 1: Create Admin User
```bash
# 1. Create via UI: role='admin', apiKeyEnabled=false
# 2. Try to use password as API key → 403 Forbidden (expected)
# 3. Enable API access via toggle → 200 OK
# 4. Use password as Bearer token → 200 OK with data
# 5. Disable API access → 403 Forbidden again
```

### Scenario 2: Create API User
```bash
# 1. Create via UI: role='api', apiKeyEnabled=true (auto)
# 2. Copy API key from PasswordModal
# 3. Test Bearer token immediately → 200 OK
# 4. Try web login at /admin/login → 401 Unauthorized (expected)
# 5. Regenerate API key → old key stops working
```

### Scenario 3: Usage Tracking
```bash
# 1. Create API user, note apiUsageCount=0
# 2. Make 10 API calls with Bearer token
# 3. Refresh user list → apiUsageCount=10
# 4. Check lastAPICallAt → recent timestamp
```

### Scenario 4: Security Validation
```bash
# 1. Create API user with apiKeyEnabled=true
# 2. Disable API access
# 3. Try API call within 5 minutes of last use → 409 Conflict (protection)
# 4. Wait 5 minutes, disable again → 200 OK
```

---

## 📝 Code Examples

### Creating an API User (Admin Dashboard)
```typescript
// Admin clicks "Add User" → selects "API User" role
const newUser = {
  email: 'integration@partner.com',
  name: 'Partner Integration',
  role: 'api'  // Auto-enables API access
}

// Backend generates API key
const apiKey = 'a1b2c3d4e5f6789012345678901234cd'

// Admin copies key and shares with partner securely
```

### Using the API Key (Partner System)
```bash
curl -H "Authorization: Bearer a1b2c3d4e5f6789012345678901234cd" \
  https://messmass.com/api/public/partners
```

### Monitoring API Usage (Admin Dashboard)
```typescript
// User list shows:
// - Email: integration@partner.com
// - Role: API User
// - API Access: ✅ Enabled
// - API Usage: 1,247 calls
// - Last API Call: 2025-11-05T12:30:00.000Z
```

---

## 🚀 Future Enhancements (Post-MVP)

### Phase 2 Features
1. **API Key Expiration:** Set expiry dates for temporary access
2. **Scoped Permissions:** Limit API users to specific partners/events
3. **Multiple Keys:** Allow users to have multiple active API keys
4. **Usage Alerts:** Email when rate limit is approached
5. **Analytics Dashboard:** Graph API usage over time

### Phase 3 Features
6. **Webhook Support:** Push notifications for events
7. **OAuth 2.0:** Industry-standard authentication
8. **IP Whitelisting:** Restrict API access by IP address
9. **GraphQL API:** Alternative to REST for complex queries
10. **SDK Libraries:** Node.js, Python, PHP client libraries

---

## ✅ Success Criteria

This enhancement is considered complete when:

1. ✅ Admin can create users with role selection (admin/api)
2. ✅ API users are automatically API-enabled on creation
3. ✅ API keys displayed once (PasswordModal) and never again
4. ✅ User list shows API access status and usage stats
5. ✅ API toggle button works with confirmation dialogs
6. ✅ API users cannot log in to web dashboard
7. ✅ Admin users can optionally enable API access
8. ✅ All API calls tracked (usage count + timestamp)
9. ✅ Build passes with zero TypeScript errors
10. ✅ Documentation updated with examples

---

## 📚 Related Documentation

- **`API_PUBLIC.md`** - Public API reference and authentication guide
- **`AUTHENTICATION_AND_ACCESS.md`** - Complete authentication system docs
- **`WARP.md`** - Development guide and architecture overview
- **`RELEASE_NOTES.md`** - Version history and changelog

---

**Status:** 🟡 Ready for Implementation  
**Priority:** High (External Integration Enabler)  
**Risk:** Low (No breaking changes, additive only)  
**Complexity:** Medium (2.5 hours estimated)
