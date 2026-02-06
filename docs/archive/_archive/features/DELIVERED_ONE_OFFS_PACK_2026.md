# Delivered One-Off Feature Notes (2026)
Status: Archived
Last Updated: 2026-02-05T20:57:30.000Z
Canonical: No
Owner: Documentation

This pack preserves one-off delivered feature summaries that were previously kept at `docs/*.md`.
We archive these to keep the active tree focused on canonical guides + operations workflow.

Canonical replacements:
- Google Sheets: `docs/features/GOOGLE_SHEETS_INTEGRATION.md`
- Partners: `docs/features/PARTNERS_SYSTEM_GUIDE.md`
- Release log: `docs/operations/RELEASE_NOTES.md`

## Table Of Contents
- [2026-02-04_GOOGLE_SHEETS_PARTNER_SYNC](#2026-02-04-google-sheets-partner-sync) (source: `docs/2026-02-04_GOOGLE_SHEETS_PARTNER_SYNC.md`)
- [PARTNER_EMOJI_VISIBILITY_FEATURE](#partner-emoji-visibility-feature) (source: `docs/PARTNER_EMOJI_VISIBILITY_FEATURE.md`)

## 2026-02-04_GOOGLE_SHEETS_PARTNER_SYNC
<a id="2026-02-04-google-sheets-partner-sync"></a>

- Source: `docs/2026-02-04_GOOGLE_SHEETS_PARTNER_SYNC.md`

```markdown
# Google Sheets Partner Sync — Phase 2 Deliverable
Status: Delivered
Last Updated: 2026-02-04T16:00:00.000Z
Canonical: No
Owner: Integrations

**Version:** 12.1.0 (Phase 2)  
**Created:** 2026-02-04T16:00:00.000Z  

## 1. Summary
Completed the remaining reliability work for Partner-Level Google Sheets sync (Phase 2). While the sync APIs, buttons, and modals already existed, the UI was still showing stale statistics after a connect/disconnect or manual pull/push. This delivery hooks the status component into a refresh trigger so it always re-queries `/api/partners/[id]/google-sheet/status` after any change and keeps the partner metadata in sync with the latest stats.

## 2. Scope
- Partner detail UI (connect modal, sync buttons, status card)
- Google Sheets status API response and caching instrumentation
- Documentation (release notes + feature ledger)

## 3. Implementation Details
1. **Partner Detail Refresh Flow**
   - Added a `fetchPartner` helper and `statusRefreshKey` state so the page can reload partner metadata on demand without losing the loading/error guardrails.
   - All sync lifecycle events (connect success, disconnect, pull/push completion) now increment `statusRefreshKey` and re-run the helper, ensuring the UI reflects the latest sync configuration and stats.
2. **Status Card Refresh Trigger**
   - `GoogleSheetsSyncStatus` now accepts a `refreshKey` prop and reruns its `fetchStatus()` effect any time that key changes.
   - Sync buttons call a shared `handleSyncComplete` callback that increments the refresh key, so a single manual sync immediately refreshes the status card.
3. **Status Documentation**
   - Documented the liveliness behavior in the release notes and this feature summary so future developers understand the UI contract.

## 4. Testing / Verification
- Manual validation against a configured partner sheet:
  1. Open `/admin/partners/<id>` before connecting a sheet.
  2. Connect a Google Sheet via the modal.
  3. Trigger Pull or Push (dry-run toggle optional).
  4. Verify the status card immediately updates statistics and health info without a browser refresh.
  5. Disconnect and confirm the status card switches to the “not connected” state.

> Note: Automated Google Sheets tests require service account credentials and a live spreadsheet, so they remain flagged for manual verification until those fixtures are available.

## 5. Rollout & Monitoring
- Deploy the Next.js app along with the change set above.
- After deployment, validate by connecting a staging partner sheet and performing a pull/push; confirm console logs show `statusRefreshKey` increments and the API returns the updated stats.
- Track any sync errors via the existing logging in `pullEventsFromSheet` and `pushEventsToSheet`.

## 6. Reusable Connect Modal & CSV Template
- The new `GoogleSheetsConnectModal` is now generic: supply any `connectEndpoint`, `targetLabel`, and `templateContext` and it reuses `useGoogleSheetsConnector` for sheet ID extraction, CSRF-protected POST, and error handling. This keeps the modal within the Layout Grammar-friendly card architecture so the modal always fits the admin surface without overflowing or triggering ellipsis.
- The modal also exposes a “Download sample CSV” button powered by `/api/google-sheets/template`. The template builder (`lib/googleSheets/template.ts`) derives headers from `FIELD_DEFINITIONS`, seeds a sample row with ISO dates/strings/numbers, and lets admins download the same layout our pull/push endpoints already understand.
- To reuse across other admin surfaces (events, algorithms, KYC, mass syncs), point the modal at the appropriate endpoint (`/api/events/[id]/google-sheet/connect`, `/api/algorithms/google-sheet/connect`, etc.), trunk the `targetLabel` to describe the sync, and the modal will handle the rest.
```

## PARTNER_EMOJI_VISIBILITY_FEATURE
<a id="partner-emoji-visibility-feature"></a>

- Source: `docs/PARTNER_EMOJI_VISIBILITY_FEATURE.md`

```markdown
# Partner Emoji Visibility Feature - Implementation Summary
Status: Active
Last Updated: 2026-02-05T00:00:00.000Z
Canonical: No
Owner: Admin

## Feature Overview
Added an optional checkbox to partner edit/stat pages that allows partners to control whether their emoji is displayed in reports and throughout the application.

## Key Changes Implemented

### 1. **Database Schema Update**
**File:** `lib/partner.types.ts`

Added `showEmoji?: boolean` field to:
- `Partner` interface
- `CreatePartnerInput` interface  
- `UpdatePartnerInput` interface

**Default Behavior:** `showEmoji !== false` (shows emoji by default for backward compatibility)

### 2. **Admin Interface Updates**
**File:** `app/admin/partners/page.tsx`

**Create Partner Form:**
- Added checkbox: "Show emoji in reports and displays"
- Default state: `showEmoji: true`
- Helper text explaining the feature

**Edit Partner Form:**
- Added identical checkbox to edit form
- Loads existing `showEmoji` value with fallback to `true`
- Updates state management for both forms

### 3. **Component Updates (Emoji Display Logic)**

Updated all components that display partner emojis to respect the `showEmoji` flag:

**Core Components:**
- `components/ResourceLoader.tsx` - Partner logo fallback
- `components/PartnerSelector.tsx` - Partner selection chips and dropdown
- `lib/adapters/partnersAdapter.tsx` - Admin table display
- `components/PartnerEditorDashboard.tsx` - Editor dashboard header

**Report & Display Components:**
- `components/UnifiedPageHero.tsx` - Report page headers
- `app/partner-report/[slug]/page.tsx` - Partner report hero
- `app/admin/partners/[id]/page.tsx` - Partner detail page
- `app/admin/partners/[id]/kyc-data/page.tsx` - KYC data page

**Event & Project Components:**
- `app/admin/quick-add/page.tsx` - Match preview displays
- `app/admin/events/ProjectsPageClient.tsx` - Event listings
- `lib/adapters/projectsAdapter.tsx` - Project table display

## Technical Implementation

### Logic Pattern
```javascript
// Standard pattern used across all components
{partner.showEmoji !== false ? partner.emoji : ''}

// For components with additional conditions
{partner.emoji && partner.showEmoji !== false && (
  <span className="emoji">{partner.emoji}</span>
)}
```

### Backward Compatibility
- Existing partners without `showEmoji` field will show emoji (default behavior)
- `showEmoji: undefined` → Shows emoji
- `showEmoji: null` → Shows emoji  
- `showEmoji: true` → Shows emoji
- `showEmoji: false` → Hides emoji

### State Management
```javascript
// Create form state
const [newPartnerData, setNewPartnerData] = useState({
  // ... other fields
  showEmoji: true, // Default to showing emoji
});

// Edit form state  
const [editPartnerData, setEditPartnerData] = useState({
  // ... other fields
  showEmoji: true, // Default to showing emoji
});

// Loading existing partner data
setEditPartnerData({
  // ... other fields
  showEmoji: partner.showEmoji ?? true, // Default to true if not set
});
```

## User Interface

### Checkbox Implementation
```jsx
<div className="form-group mb-4">
  <label className="form-label-block">
    <input
      type="checkbox"
      checked={partnerData.showEmoji}
      onChange={(e) => setPartnerData(prev => ({ 
        ...prev, 
        showEmoji: e.target.checked 
      }))}
      className="mr-2"
    />
    Show emoji in reports and displays
  </label>
  <p className="form-hint">
    💡 Uncheck to hide the emoji while keeping it stored for future use
  </p>
</div>
```

## Use Cases

1. **Sports Teams:** May want to hide emoji during certain seasons or campaigns
2. **Corporate Partners:** May prefer clean, professional display without emoji
3. **Temporary Hiding:** Keep emoji stored but hide temporarily for specific events
4. **Brand Guidelines:** Some partners may have strict brand guidelines about emoji usage

## Benefits

- **Flexibility:** Partners can control their visual representation
- **Professional Options:** Clean display without emoji when needed
- **Non-Destructive:** Emoji is preserved even when hidden
- **Backward Compatible:** Existing partners continue to show emoji by default
- **Consistent:** Applied across all partner display locations

## Testing

Run the test script to verify functionality:
```bash
node test-partner-emoji-visibility.js
```

The test validates:
- Default behavior (show emoji when undefined/null)
- Explicit show/hide behavior
- Rendering logic across different scenarios
- Backward compatibility

## Future Enhancements

Potential future improvements:
- Bulk emoji visibility toggle for multiple partners
- Time-based emoji visibility (show/hide during specific periods)
- Role-based emoji visibility (different visibility for different user types)
- Emoji visibility analytics (track when partners toggle visibility)

## Database Migration

For existing installations, no migration is required as:
- `showEmoji` is optional with safe default behavior
- Existing partners will continue showing emoji (showEmoji !== false)
- New partners default to showing emoji (showEmoji: true)
```

