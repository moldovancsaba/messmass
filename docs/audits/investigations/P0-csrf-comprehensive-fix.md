# Comprehensive CSRF Fix - All State-Changing Operations

**Date:** 2026-01-02  
**Status:** ✅ COMPLETE  
**Scope:** All raw `fetch()` calls replaced with `apiClient` functions

---

## Summary

Fixed all CSRF token issues by replacing raw `fetch()` calls with `apiPost()`, `apiPut()`, `apiDelete()`, and `apiRequest()` from `lib/apiClient.ts` across the entire codebase.

---

## Files Fixed

### 1. `app/admin/clear-session/page.tsx` ✅
- **Issue:** Raw `fetch()` for POST `/api/admin/clear-cookies`
- **Fix:** Replaced with `apiPost()`
- **Lines:** 20

### 2. `app/admin/partners/page.tsx` ✅
- **Issue:** 3 raw `fetch()` calls for Google Sheets operations
- **Fix:** Replaced with `apiPost()` for:
  - `/api/partners/{id}/google-sheet/setup` (POST)
  - `/api/partners/{id}/google-sheet/connect` (POST)
  - `/api/partners/{id}/google-sheet/pull` (POST)
  - `/api/partners/{id}/google-sheet/push` (POST)
- **Lines:** 980-1038

### 3. `components/ReportContentManager.tsx` ✅
- **Issue:** Raw `fetch()` for auto-generate chart blocks
- **Fix:** Replaced with `apiPost()` for `/api/auto-generate-chart-block`
- **Lines:** 70-78

### 4. `components/GoogleSheetsConnectModal.tsx` ✅
- **Issue:** Raw `fetch()` for connecting Google Sheets
- **Fix:** Replaced with `apiPost()` for `/api/partners/{id}/google-sheet/connect`
- **Lines:** 75-88

### 5. `components/UnifiedHashtagInput.tsx` ✅
- **Issue:** Raw `fetch()` for creating hashtags
- **Fix:** Replaced with `apiPost()` for `/api/hashtags`
- **Lines:** 181-182

### 6. `components/HashtagInput.tsx` ✅
- **Issue:** Raw `fetch()` for creating hashtags
- **Fix:** Replaced with `apiPost()` for `/api/hashtags`
- **Lines:** 131-137

### 7. `components/ImageUploader.tsx` ✅
- **Issue:** Raw `fetch()` for image uploads (FormData)
- **Fix:** Replaced with `apiRequest()` for `/api/upload-image` (FormData support)
- **Lines:** 64-72

### 8. `components/ChartConfiguration.tsx` ✅
- **Issue:** 2 raw `fetch()` calls
- **Fix:** Replaced with:
  - `apiPost()` for `/api/chart-config` (POST)
  - `apiDelete()` for `/api/chart-config` (DELETE)
- **Lines:** 49-56, 84-86

### 9. `app/admin/content-library/page.tsx` ✅
- **Issue:** Raw `fetch()` for deleting content assets
- **Fix:** Replaced with `apiDelete()` for `/api/content-assets`
- **Lines:** 149-151

### 10. `app/admin/bitly/page.tsx` ✅
- **Issue:** 10 raw `fetch()` calls for various Bitly operations
- **Fix:** Replaced with:
  - `apiPost()` for:
    - `/api/bitly/links` (POST) - 2 calls
    - `/api/bitly/sync` (POST)
    - `/api/bitly/recalculate` (POST)
    - `/api/bitly/pull` (POST)
    - `/api/bitly/partners/associate` (POST)
  - `apiPut()` for:
    - `/api/bitly/links/{id}` (PUT) - favorite status
  - `apiDelete()` for:
    - `/api/bitly/associations` (DELETE)
    - `/api/bitly/links/{id}` (DELETE)
    - `/api/bitly/partners/associate` (DELETE)
- **Lines:** 368-789

---

## Pattern Applied

**Before:**
```typescript
const response = await fetch('/api/endpoint', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
const result = await response.json();
```

**After:**
```typescript
// WHAT: Use apiPost() for automatic CSRF token handling
// WHY: Production middleware requires X-CSRF-Token header for POST requests
const result = await apiPost('/api/endpoint', data);
```

**For FormData:**
```typescript
// WHAT: Use apiRequest for FormData uploads with CSRF protection
// WHY: apiPost uses JSON.stringify which doesn't work with FormData
const result = await apiRequest('/api/upload-image', {
  method: 'POST',
  body: formData
});
```

---

## Total Fixes

- **10 files** fixed
- **20+ fetch() calls** replaced
- **All state-changing operations** now protected

---

## Verification

✅ Build passes  
✅ No linter errors  
✅ All imports added correctly  
✅ CSRF protection in place for all operations  

---

## Previously Fixed (Not in this batch)

- `components/ChartAlgorithmManager.tsx` - Fixed earlier
- `app/admin/visualization/page.tsx` - Template creation fixed
- `app/admin/styles/[id]/page.tsx` - Fixed earlier
- `components/ImageUploadField.tsx` - Fixed earlier
- `components/ReportContentManager.tsx` - Image uploads fixed earlier

---

**Signed-off-by:** Tribeca  
**Date:** 2026-01-02

