# Template Selection Persistence - Implementation

**Date:** 2026-01-02  
**Feature:** Remember selected template in Visualization Manager across sessions  
**Status:** ✅ IMPLEMENTED

---

## Overview

The Visualization Manager remembers the user's last selected report template across:
- Page reloads
- Browser sessions
- Different devices (per user account)

---

## Implementation Details

### 1. User Preferences API

**Endpoint:** `/api/user-preferences`

**GET** - Fetch user preferences:
- Returns `lastSelectedTemplateId` if set
- Keyed by user email (from authentication)

**PUT** - Update user preferences:
- Accepts `lastSelectedTemplateId` in request body
- Stores in MongoDB `user_preferences` collection
- Uses upsert to create or update

**Storage:**
- Collection: `user_preferences`
- Key: `userId` (user email)
- Field: `lastSelectedTemplateId` (string, optional)

### 2. Visualization Manager Flow

**On Page Load:**
1. Load all templates from `/api/report-templates`
2. Load user preferences from `/api/user-preferences`
3. If `lastSelectedTemplateId` exists and template still exists:
   - Select that template
4. Otherwise:
   - Select default template (if exists)
   - Or select first template

**On Template Change:**
1. User selects template from dropdown
2. `handleTemplateChange()` is called
3. Updates local state immediately
4. Saves preference to `/api/user-preferences` (fire-and-forget)
5. Preference persists for next visit

### 3. Code Locations

**Frontend:**
- `app/admin/visualization/page.tsx`
  - `loadUserPreferences()` - Lines 229-266
  - `handleTemplateChange()` - Lines 270-282
  - Initialization - Lines 138-147

**Backend:**
- `app/api/user-preferences/route.ts`
  - GET handler - Lines 20-46
  - PUT handler - Lines 52-92

### 4. Error Handling

**Load Preferences:**
- If API fails: Falls back to default template
- If template doesn't exist: Falls back to default template
- Errors are logged but don't block UI

**Save Preferences:**
- Uses fire-and-forget pattern
- Errors are silently ignored (doesn't block template selection)
- Uses `apiPut()` for CSRF protection

### 5. User Experience

**First Visit:**
- No preference stored
- Selects default template (or first template)

**Subsequent Visits:**
- Automatically selects last used template
- User can still change selection manually
- New selection is remembered for next visit

**Template Deleted:**
- If saved template is deleted, falls back to default
- User can select a new template, which is then remembered

---

## Technical Notes

**CSRF Protection:**
- Uses `apiPut()` from `apiClient.ts` for preference updates
- Automatically includes CSRF token in request headers

**Race Condition Prevention:**
- Templates are loaded before preferences are checked
- Ensures template exists before selecting it

**Persistence Scope:**
- Per-user (based on email)
- Cross-browser (same user account)
- Cross-device (same user account)
- Not shared between different users

---

## Testing

**Manual Test:**
1. Select a template in Visualization Manager
2. Reload the page
3. Verify same template is selected
4. Change template
5. Reload again
6. Verify new template is selected

**Edge Cases:**
- Template deleted after being saved as preference → Falls back to default
- No templates available → No selection (handled gracefully)
- User not authenticated → Falls back to default (no error)

---

## Future Enhancements

**Potential Improvements:**
- Add preference for other settings (grid units, collapsed blocks, etc.)
- Add UI indicator showing "Last used template"
- Add option to clear saved preference
- Add preference sync across devices (if needed)

---

**Signed-off-by:** Tribeca  
**Last Updated:** 2026-01-02

