# Testing Guide: API Access Management System

**Version:** 10.6.0  
**Created:** 2025-11-04T21:52:00.000Z  
**Status:** Quick Reference Guide

---

## 🚀 Quick Start Testing

### Step 1: Run the Migration

```bash
npm run migrate:api-fields
```

**Expected Output:**
```
🚀 Starting migration: Add API fields to users collection
📋 Target fields: apiKeyEnabled, apiUsageCount, lastAPICallAt
📊 Found X user(s) in collection
🔍 Users needing migration: X
✅ Migration complete
🎉 Migration successful - all users updated
```

---

### Step 2: Enable API Access for a User

First, log in to the admin panel and get your session cookie, then:

```bash
# Replace USER_ID with actual MongoDB ObjectId
curl -X PUT http://localhost:3000/api/admin/local-users/USER_ID/api-access \
  -H "Content-Type: application/json" \
  -H "Cookie: admin-session=YOUR_SESSION_COOKIE" \
  -d '{"enabled": true}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "API access enabled successfully",
  "recommendation": "Security tip: Regenerate password to create a long random API key",
  "user": {
    "id": "...",
    "email": "user@example.com",
    "name": "User Name",
    "role": "admin",
    "apiKeyEnabled": true,
    "apiUsageCount": 0,
    "lastAPICallAt": null
  }
}
```

---

### Step 3: Get the User's Password (API Key)

The user's password IS their API key. You can:

**Option A:** Regenerate it for a fresh random key:
```bash
curl -X PUT http://localhost:3000/api/admin/local-users/USER_ID \
  -H "Content-Type: application/json" \
  -H "Cookie: admin-session=YOUR_SESSION" \
  -d '{"regeneratePassword": true}'
```

**Option B:** Query MongoDB directly:
```bash
# If you have MongoDB access
mongo "YOUR_MONGODB_URI" --eval "db.users.findOne({_id: ObjectId('USER_ID')}).password"
```

---

### Step 4: Test the Public API

```bash
# Use the password from Step 3 as your API key
export API_KEY="user_password_here"

# Test 1: List partners
curl -H "Authorization: Bearer $API_KEY" \
  http://localhost:3000/api/public/partners

# Test 2: Get specific partner (use real ID from test 1)
curl -H "Authorization: Bearer $API_KEY" \
  http://localhost:3000/api/public/partners/PARTNER_ID

# Test 3: Get partner's events
curl -H "Authorization: Bearer $API_KEY" \
  http://localhost:3000/api/public/partners/PARTNER_ID/events

# Test 4: Get event details (use real event ID from test 3)
curl -H "Authorization: Bearer $API_KEY" \
  http://localhost:3000/api/public/events/EVENT_ID
```

---

### Step 5: Verify Usage Tracking

After making API calls, check that usage is tracked:

```bash
curl -H "Cookie: admin-session=YOUR_SESSION" \
  http://localhost:3000/api/admin/local-users
```

**Look for:**
- `apiUsageCount` should be > 0
- `lastAPICallAt` should have recent timestamp

---

## 🔍 Testing Error Cases

### Test 1: Missing Authorization Header (401)

```bash
curl http://localhost:3000/api/public/partners
```

**Expected:**
```json
{
  "success": false,
  "error": "Authorization header required. Format: Bearer <api-key>",
  "errorCode": "MISSING_TOKEN"
}
```

---

### Test 2: Invalid API Key (401)

```bash
curl -H "Authorization: Bearer invalid_key_12345" \
  http://localhost:3000/api/public/partners
```

**Expected:**
```json
{
  "success": false,
  "error": "Invalid API key",
  "errorCode": "INVALID_TOKEN"
}
```

---

### Test 3: API Access Disabled (403)

```bash
# First disable API access
curl -X PUT http://localhost:3000/api/admin/local-users/USER_ID/api-access \
  -H "Content-Type: application/json" \
  -H "Cookie: admin-session=YOUR_SESSION" \
  -d '{"enabled": false}'

# Then try to use the API
curl -H "Authorization: Bearer $API_KEY" \
  http://localhost:3000/api/public/partners
```

**Expected:**
```json
{
  "success": false,
  "error": "API access not enabled for this user",
  "errorCode": "API_ACCESS_DISABLED"
}
```

---

### Test 4: Cookies Rejected (401)

```bash
curl -H "Authorization: Bearer $API_KEY" \
  -H "Cookie: some-cookie=value" \
  http://localhost:3000/api/public/partners
```

**Expected:**
```json
{
  "success": false,
  "error": "API authentication requires Bearer token, cookies are not supported",
  "errorCode": "COOKIES_NOT_ALLOWED"
}
```

---

## 📊 Monitoring & Debugging

### Check User API Status

```bash
curl -H "Cookie: admin-session=YOUR_SESSION" \
  "http://localhost:3000/api/admin/local-users?limit=10" \
  | jq '.users[] | {email, apiKeyEnabled, apiUsageCount, lastAPICallAt}'
```

### View Server Logs

When testing, watch the server console for:
- `✅ API auth successful` - Successful authentication
- `⚠️ API auth failed: invalid token` - Invalid key
- `⚠️ API auth failed: API access disabled` - Disabled user

---

## 🐛 Troubleshooting

### Issue: Migration says "0 users updated"

**Cause:** Users already have API fields  
**Solution:** This is normal if you've run the migration before. It's idempotent.

---

### Issue: API returns 401 with valid key

**Checks:**
1. Verify `apiKeyEnabled` is `true` in database
2. Confirm you're using the user's current password
3. Check if password was regenerated recently

---

### Issue: Usage count not incrementing

**Checks:**
1. Verify API calls are successful (200 response)
2. Check server logs for database errors
3. Confirm MongoDB connection is active

---

## 📚 Next Steps

Once basic testing is complete:

1. **Admin UI** - Test via web interface (coming soon)
2. **Rate Limiting** - Test with rapid requests
3. **Production** - Test with production MongoDB
4. **Third Parties** - Provide API keys to integration partners

---

**For Complete API Documentation:** See `API_PUBLIC.md`  
**For System Architecture:** See `ARCHITECTURE.md`  
**For Authentication Details:** See `AUTHENTICATION_AND_ACCESS.md`
