# Investigation: CSRF Token Issue in Chart Algorithm Manager

**Date:** 2026-01-02  
**Reporter:** Sultan  
**Investigator:** Tribeca  
**Status:** ✅ FIXED

---

## Issue Summary

When attempting to save a chart configuration with a formula variable (e.g., `[szerencsejatekHostessAllRegistered]`) in the algorithm editor, the save operation fails with:

```
Save failed: CSRF token invalid or missing
```

---

## Investigation

### Scope
- **File:** `components/ChartAlgorithmManager.tsx`
- **Functions affected:**
  - `saveConfiguration()` - Line 319
  - `updateConfiguration()` - Line 266
  - `deleteConfiguration()` - Line 370
  - `toggleConfigurationActive()` - Line 401
  - `moveConfiguration()` - Line 427
  - Cache invalidation action - Line 610

### Root Cause

**What failed:**
- All state-changing operations (POST/PUT/DELETE) in ChartAlgorithmManager were using raw `fetch()` calls instead of the `apiClient` wrapper functions.

**Why it failed:**
- The `apiClient.ts` module (`lib/apiClient.ts`) provides `apiPost()`, `apiPut()`, and `apiDelete()` functions that automatically:
  1. Read CSRF token from cookies
  2. Fetch token from `/api/csrf-token` if missing
  3. Include `X-CSRF-Token` header in all state-changing requests
  4. Handle CSRF errors gracefully
- Raw `fetch()` calls bypass this protection, causing middleware to reject requests with 403.

**Why it wasn't caught earlier:**
- Other components (EditorDashboard, PartnerEditorDashboard, KYC page) correctly use `apiPut()`/`apiPost()`.
- ChartAlgorithmManager was likely created before the CSRF protection was fully implemented, or was refactored without updating fetch calls.

### Classification
- **Type:** Code defect (missing CSRF token handling)
- **Severity:** P0 (blocks user workflow)
- **Impact:** Users cannot save chart configurations in production

---

## Fix Applied

**Commit:** (pending)

**Changes:**
1. Added import: `import { apiPost, apiPut, apiDelete } from '@/lib/apiClient';`
2. Replaced all raw `fetch()` calls with appropriate `apiClient` functions:
   - `saveConfiguration()`: `fetch()` → `apiPost()`/`apiPut()`
   - `updateConfiguration()`: `fetch()` → `apiPost()`/`apiPut()`
   - `deleteConfiguration()`: `fetch()` → `apiDelete()`
   - `toggleConfigurationActive()`: `fetch()` → `apiPut()`
   - `moveConfiguration()`: `fetch()` → `apiPut()` (2 calls)
   - Cache invalidation: `fetch()` → `apiPut()`

**Boundary:**
- Minimal fix at correct boundary (adapter layer)
- No core type changes
- Reused existing `apiClient` utilities
- No duplication

---

## Verification

**Local:**
- ✅ Build passes (`npm run build`)
- ✅ Type check passes
- ✅ No linting errors

**Preview:**
- ⏳ Pending user verification: Test saving chart configuration with formula variable `[szerencsejatekHostessAllRegistered]`

---

## Notes

- All GET requests remain unchanged (no CSRF token required)
- Error handling improved: `deleteConfiguration()` now shows proper error messages
- Consistent with other components in codebase (EditorDashboard, PartnerEditorDashboard)

---

**Signed-off-by:** Tribeca

