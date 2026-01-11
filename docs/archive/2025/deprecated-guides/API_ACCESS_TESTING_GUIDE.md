# API Access Testing Guide
Status: Archived
Last Updated: 2026-01-11T22:28:38.000Z
Canonical: No
Owner: Architecture

**Version:** 10.6.1  
**Created:** 2025-11-05T12:45:00.000Z

---

## ✅ Delivered Features

All API access management features have been implemented and are ready for testing:

1. ✅ **Role Selection** - Create users as Admin or API type
2. ✅ **Auto-Enable API** - API users get immediate API access
3. ✅ **API Toggle Button** - Enable/disable API access per user
4. ✅ **Usage Statistics** - View API call count and last call timestamp
5. ✅ **Visual Badges** - Distinguish API users from Admin users

---

## 🧪 Quick Test Scenarios

### Scenario 1: Create an API User

1. Go to `/admin/users`
2. Click **➕ Add User**
3. Fill in:
   - Email: `test-api@example.com`
   - Name: `Test API User`
   - User Type: **API User (Programmatic Access)** ⬅️ Select this!
4. Click **Create User**
5. **Copy the API key** from the modal (32-character hex string)
6. Close modal

**Expected Result:**
- User appears in list with:
  - Role: 🔑 API
  - API Access: ✅ Enabled
  - API Usage: 0
  - Last API Call: Never

---

### Scenario 2: Test the API Key

```bash
# Replace YOUR_API_KEY with the key from step 1
curl -H "Authorization: Bearer YOUR_API_KEY" \
  http://localhost:3000/api/public/partners

# Expected: 200 OK with partners JSON
```

**Expected Result:**
- API returns partners data
- Refresh user list → API Usage increments to 1
- Last API Call shows current timestamp

---

### Scenario 3: Create an Admin User

1. Go to `/admin/users`
2. Click **➕ Add User**
3. Fill in:
   - Email: `test-admin@example.com`
   - Name: `Test Admin User`
   - User Type: **Admin User (Dashboard Access)** ⬅️ Default
4. Click **Create User**
5. Copy the password from modal
6. Close modal

**Expected Result:**
- User appears in list with:
  - Role: 👤 Admin
  - API Access: ❌ Disabled
  - API Usage: 0
  - Last API Call: Never

---

### Scenario 4: Toggle API Access for Admin User

1. Find the admin user created in Scenario 3
2. Click **🔓 Enable API** button in row actions
3. Confirm the dialog
4. User list refreshes

**Expected Result:**
- API Access changes to: ✅ Enabled
- Button changes to: 🔒 Disable API
- Alert shows: "Security tip: Regenerate password to create a long random API key"

---

### Scenario 5: Disable API Access

1. Find an API-enabled user (from Scenario 2 or 4)
2. Click **🔒 Disable API** button
3. Confirm the warning dialog
4. User list refreshes

**Expected Result:**
- API Access changes to: ❌ Disabled
- Button changes to: 🔓 Enable API
- Subsequent API calls with that key → 403 Forbidden

---

## 🔍 Visual Verification Checklist

Go to `/admin/users` and verify:

### User List Columns
- [ ] Email (bold, left-aligned)
- [ ] Name (gray text)
- [ ] Role (colored badge: 🔑 API in green, 👤 Admin in blue)
- [ ] API Access (✅ Enabled / ❌ Disabled)
- [ ] API Usage (numeric count, right-aligned)
- [ ] Last API Call (date or "Never")
- [ ] Last Login (date or "Never")
- [ ] Created (date)

### Row Actions (per user)
- [ ] 🔓 Enable API / 🔒 Disable API (dynamic label)
- [ ] 🔄 Regenerate (password/API key)
- [ ] 🗑️ Delete

### Create User Modal
- [ ] Email input
- [ ] Name input
- [ ] User Type dropdown (Admin / API)
- [ ] Helper text explaining difference
- [ ] Conditional info box for API users (checkmarks)
- [ ] Dynamic note about password vs API key generation

---

## 🔐 Security Tests

### Test 1: API User Cannot Login to Dashboard
```bash
# Try logging in at /admin/login with API user credentials
# Expected: Login fails (API users don't have dashboard access)
```

### Test 2: Disabled API Key is Rejected
```bash
# 1. Disable API access for a user
# 2. Try using their API key
curl -H "Authorization: Bearer OLD_API_KEY" \
  http://localhost:3000/api/public/partners

# Expected: 403 Forbidden
```

### Test 3: Regenerate Changes API Key
```bash
# 1. Use current API key → works
# 2. Click Regenerate → get new key
# 3. Try old key → 403 Forbidden
# 4. Try new key → 200 OK
```

---

## 📊 Database Verification

Optional: Check MongoDB directly to verify data structure:

```javascript
// In MongoDB Compass or Atlas
db.users.findOne({ email: "test-api@example.com" })

// Expected fields:
{
  _id: ObjectId("..."),
  email: "test-api@example.com",
  name: "Test API User",
  role: "api",                  // NEW VALUE ✅
  password: "32-char-hex...",   // Serves as API key
  apiKeyEnabled: true,          // Auto-enabled for API role ✅
  apiUsageCount: 1,             // Increments with each API call ✅
  lastAPICallAt: "2025-11-05...", // Updated on API calls ✅
  createdAt: "2025-11-05...",
  updatedAt: "2025-11-05..."
}
```

---

## 🚀 Integration Testing

### External System Simulation

```bash
# Simulate partner integration calling MessMass API

# 1. Create API user via admin panel
# 2. Copy API key

# 3. Test list partners
curl -H "Authorization: Bearer YOUR_KEY" \
  http://localhost:3000/api/public/partners?limit=5

# 4. Test get partner by ID
curl -H "Authorization: Bearer YOUR_KEY" \
  http://localhost:3000/api/public/partners/PARTNER_ID

# 5. Test get partner's events
curl -H "Authorization: Bearer YOUR_KEY" \
  http://localhost:3000/api/public/partners/PARTNER_ID/events

# 6. Test get event by ID
curl -H "Authorization: Bearer YOUR_KEY" \
  http://localhost:3000/api/public/events/EVENT_ID

# All should return 200 OK with JSON data
```

---

## 📸 Screenshots to Capture

For documentation:
1. Create user modal with **User Type dropdown** expanded
2. API user info box with checkmarks
3. User list showing both Admin and API users
4. Row actions with **Enable API / Disable API** button
5. API key display modal after creation
6. Confirmation dialog for disable API

---

## ✅ Success Criteria

Feature is working correctly if:

1. ✅ Can create users with role='api' or role='admin'
2. ✅ API users automatically have API access enabled
3. ✅ Admin users have API access disabled by default
4. ✅ Toggle button enables/disables API access
5. ✅ API calls work with valid Bearer tokens
6. ✅ API calls fail with disabled tokens (403)
7. ✅ Usage counter increments on each API call
8. ✅ Last API call timestamp updates
9. ✅ Visual badges distinguish user types
10. ✅ All TypeScript types compile without errors

---

## 🐛 Known Limitations (Future Enhancements)

- API keys cannot expire (planned: expiration dates)
- No scoped permissions (all API users see all data)
- No IP whitelisting
- No rate limit per-key customization
- Password serves dual purpose (login + API key for admins)

See `API_ACCESS_ENHANCEMENT_PLAN.md` Phase 2/3 features for roadmap.

---

## 📚 Related Documentation

- **`API_PUBLIC.md`** - Public API reference with authentication guide
- **`API_ACCESS_ENHANCEMENT_PLAN.md`** - Implementation plan and architecture
- **`AUTHENTICATION_AND_ACCESS.md`** - Complete authentication system docs
- **`WARP.md`** - Development guide

---

**Status:** 🟢 Ready for Testing  
**Build:** Verified (exit code 0)  
**Commit:** f4a8684  
**Pushed:** Yes (origin/main)
