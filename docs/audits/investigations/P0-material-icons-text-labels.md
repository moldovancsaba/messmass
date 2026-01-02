# Investigation: Material Icons Show as Text Labels (P0)

**Date:** 2026-01-02T20:10:00+01:00  
**Issue:** Material Icons render as text labels (e.g., "handshake", "event") instead of icons  
**Priority:** P0 (CRITICAL - Visual regression, impacts usability/credibility)

## Investigation Notes

### What Failed
- Material Icons in sidebar (and potentially elsewhere) display as text labels instead of icon glyphs
- Users see "handshake", "event" text instead of icon symbols
- Affects Preview + Production environments

### Why It Failed
**Root Cause Analysis:**

1. **Font Loading Location:**
   - Material Icons fonts are loaded in `app/layout.tsx` (lines 114-127)
   - Three variants loaded: `Material Icons`, `Material Icons Outlined`, `Material Icons Round`
   - Preconnect links present for `fonts.googleapis.com` and `fonts.gstatic.com` (lines 97-98)

2. **Component Usage:**
   - `MaterialIcon` component uses `material-icons` class (line 98)
   - Sets `fontFamily` to `Material Icons Outlined` or `Material Icons Round` (lines 81-83, 104)
   - Icon names normalized (hyphens/spaces → underscores)

3. **Potential Issues:**
   - **CSP blocking:** Middleware or headers may block `fonts.googleapis.com` / `fonts.gstatic.com`
   - **Font not loading:** Network requests may fail (404, CORS, timeout)
   - **Font family mismatch:** Component uses `Material Icons Outlined` but base `Material Icons` may be required
   - **Build-time removal:** Next.js may strip external stylesheets during build
   - **Admin layout isolation:** Admin layout may not inherit root layout font loading

### Why It Wasn't Caught Earlier
- **Local cache:** macOS/local development may have cached fonts, masking the issue
- **No visual regression tests:** No automated checks for icon rendering
- **Preview not tested:** Changes may have been tested only locally

### Classification
- **Type:** Environment mismatch + Missing verification
- **Root Cause:** Font loading failure (CSP, network, or font family mismatch)

### Scope
- **Environments:** Preview + Production (Vercel)
- **Impact:** All Material Icons throughout application (sidebar, charts, UI elements)
- **Files Affected:**
  - `app/layout.tsx` (font loading)
  - `components/MaterialIcon.tsx` (icon rendering)
  - `components/Sidebar.tsx` (sidebar icons)
  - `app/admin/layout.tsx` (admin layout)

### Required Actions
1. Verify font loading in production (Network tab, CSP errors)
2. Check CSP configuration (middleware, headers)
3. Verify font family names match between stylesheet and component
4. Test icon rendering on Preview deployment
5. Fix font loading issue (add missing stylesheet, fix CSP, or fix font family)

### Constraints
- Must not hardcode per-page fixes (single global source only)
- Must maintain backward compatibility
- Must work in Preview + Production

---

## Fix Applied

**Commit:** `367bf1d4c` (2026-01-02T20:15:00+01:00)

**Changes:**
- Updated CSP in `middleware.ts`:
  - Added `https://fonts.googleapis.com` to `style-src` directive
  - Changed `font-src` to explicitly allow `https://fonts.gstatic.com`

**Rationale:**
- Minimal fix at correct boundary (middleware, single global source)
- CSP remains single source of truth (no per-page workarounds)
- Explicit allowlist for Google Fonts domains (security best practice)

---

## Verification

**Date:** 2026-01-02T20:20:00+01:00  
**Verified By:** Sultan  
**Status:** ✅ CONFIRMED

**Evidence:**
- Material Icons render correctly as icon glyphs (not text labels)
- Sidebar icons ("handshake", "event", etc.) display as icons
- All Material Icons throughout application render correctly
- Preview deployment verified working

**Verification Checklist:**
- ✅ Build passes
- ✅ Type check passes
- ✅ Preview deployment: Icons render correctly
- ✅ No CSP violations in browser console
- ✅ Network tab: Material Icons fonts load successfully (200 status)

**Future Prevention:**
- CSP remains single source of truth in middleware (no per-page workarounds)
- Any CSP changes must be tested with Material Icons rendering

