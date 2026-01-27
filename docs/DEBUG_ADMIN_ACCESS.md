# Debugging Admin Access Issues

## Quick Diagnosis Steps

### 1. Check Your Current Role

Open browser console (F12) and run:

```javascript
// Check your session and role
fetch('/api/admin/auth')
  .then(r => r.json())
  .then(data => {
    console.log('Your current role:', data.user?.role);
    console.log('Full user data:', data.user);
  });
```

### 2. Check What Routes You Can Access

Based on your role, here's what you should be able to access:

**If you have `guest` role:**
- ✅ `/admin` (dashboard)
- ✅ `/admin/help`
- ❌ Everything else

**If you have `user` role:**
- ✅ `/admin` (dashboard)
- ✅ `/admin/help`
- ✅ `/admin/partners`
- ✅ `/admin/events`
- ✅ `/admin/filter`
- ❌ `/admin/kyc`, `/admin/charts`, etc. (requires `admin`)
- ❌ `/admin/hashtags`, `/admin/users`, etc. (requires `superadmin`)

**If you have `admin` role:**
- ✅ `/admin` (dashboard)
- ✅ `/admin/help`
- ✅ `/admin/partners`
- ✅ `/admin/events`
- ✅ `/admin/filter`
- ✅ `/admin/kyc`
- ✅ `/admin/charts`
- ✅ `/admin/clicker-manager`
- ✅ `/admin/bitly`
- ✅ `/admin/visualization`
- ✅ `/admin/design`
- ❌ `/admin/hashtags`, `/admin/users`, etc. (requires `superadmin`)

**If you have `superadmin` role:**
- ✅ All admin routes

### 3. Common Issues and Fixes

#### Issue: "Insufficient permissions" error
**Cause:** Your role is lower than required for the route.

**Fix:**
1. Check your role using step 1 above
2. If you need a higher role, ask a superadmin to update your role in `/admin/users`
3. Or log out and log back in if your role was recently changed

#### Issue: Redirected to `/admin/login`
**Cause:** Session cookie is missing or invalid.

**Fix:**
1. Clear cookies for the site
2. Log in again at `/admin/login`
3. Make sure cookies are enabled in your browser

#### Issue: Session token expired
**Cause:** Session expired (7-day expiration).

**Fix:**
1. Log out and log back in
2. Or visit `/admin/clear-session` to clear expired session

### 4. Check Session Cookie

Open browser DevTools → Application → Cookies and check:
- `admin-session` cookie exists
- Cookie is not expired
- Cookie domain matches your site

### 5. Check Browser Console for Errors

Look for:
- `⚠️ Insufficient permissions: [role] attempted [path]` - Role too low
- `Invalid or expired session token` - Session expired
- `Unauthenticated admin access attempt` - No session

### 6. Verify Your User in Database

If you have database access, check your user document:

```javascript
// In MongoDB shell or Compass
db.users.findOne({ email: "your-email@example.com" })
// Check the "role" field
```

### 7. Force Re-login

If nothing works:
1. Visit `/admin/clear-session` to clear your session
2. Visit `/admin/login` and log in again
3. Check your role after login

## Role Hierarchy

```
guest (0) < user (1) < admin (2) < superadmin (3)
```

Your role must be **equal to or higher than** the required role for a route.

## Route Requirements

| Route | Minimum Role |
|-------|--------------|
| `/admin` | `guest` |
| `/admin/help` | `guest` |
| `/admin/partners` | `user` |
| `/admin/events` | `user` |
| `/admin/filter` | `user` |
| `/admin/kyc` | `admin` |
| `/admin/charts` | `admin` |
| `/admin/clicker-manager` | `admin` |
| `/admin/bitly` | `admin` |
| `/admin/visualization` | `admin` |
| `/admin/design` | `admin` |
| `/admin/hashtags` | `superadmin` |
| `/admin/categories` | `superadmin` |
| `/admin/insights` | `superadmin` |
| `/admin/users` | `superadmin` |
| `/admin/cache` | `superadmin` |
