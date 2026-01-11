# Block Saving Fix Plan - Visualization Manager
Status: Active
Last Updated: 2026-01-11T22:28:38.000Z
Canonical: No
Owner: Architecture

**Date:** 2026-01-02  
**Issue:** Block creation/updates don't save reliably, no visual feedback  
**Priority:** P0 (Blocks user workflow)

---

## Problem Analysis

### Current Issues

1. **`saveTemplateConfig` uses raw `fetch()`**
   - Missing CSRF token → fails in production
   - No error handling or retry logic
   - Silent failures

2. **No visual feedback during save operations**
   - User doesn't know if save is in progress
   - No success/error indicators
   - Clicker has `SaveStatusIndicator`, Visualization Manager doesn't

3. **Block creation has two-step save**
   - Step 1: Create block via `/api/data-blocks` (POST)
   - Step 2: Save template config via `saveTemplateConfig()` (PUT)
   - If step 2 fails, block exists but isn't in template
   - No rollback if step 2 fails

4. **Block updates require modal submission**
   - No onBlur auto-save for block name
   - Must click "Update Block" button
   - Clicker pattern: auto-save on blur

5. **No save status tracking**
   - Can't show "Saving...", "Saved", "Error" states
   - No way to prevent duplicate saves

---

## Solution Plan

### Phase 1: Fix Core Save Infrastructure

**1.1 Replace `saveTemplateConfig` with `apiPut()`**
- **File:** `app/admin/visualization/page.tsx`
- **Change:** Replace raw `fetch()` with `apiPut()` from `apiClient.ts`
- **Why:** CSRF protection, consistent error handling
- **Lines:** ~342-393

**1.2 Add save status state management**
- **File:** `app/admin/visualization/page.tsx`
- **Add:**
  ```typescript
  const [blockSaveStatus, setBlockSaveStatus] = useState<SaveStatus>('idle');
  const [templateSaveStatus, setTemplateSaveStatus] = useState<SaveStatus>('idle');
  ```
- **Why:** Track save state for visual feedback

**1.3 Add `SaveStatusIndicator` component**
- **File:** `app/admin/visualization/page.tsx`
- **Import:** `import SaveStatusIndicator, { SaveStatus } from '@/components/SaveStatusIndicator';`
- **Why:** Consistent UX with clicker

---

### Phase 2: Fix Block Creation

**2.1 Make block creation atomic**
- **File:** `app/admin/visualization/page.tsx`
- **Function:** `handleCreateBlock()`
- **Change:**
  1. Set `blockSaveStatus = 'saving'`
  2. Create block via `apiPost('/api/data-blocks')`
  3. If success, immediately save template config
  4. If template save fails, show error and keep block (don't delete)
  5. Set status to 'saved' or 'error'
  6. Auto-reset to 'idle' after 2s (success) or 3s (error)
- **Why:** Ensure block is always added to template

**2.2 Add visual feedback to create block form**
- **File:** `app/admin/visualization/page.tsx`
- **Location:** Create Block modal/form
- **Add:** `<SaveStatusIndicator status={blockSaveStatus} />` near "Create Block" button
- **Why:** User sees save progress

---

### Phase 3: Fix Block Updates

**3.1 Add onBlur auto-save for block name**
- **File:** `app/admin/visualization/page.tsx`
- **Location:** Edit Block modal (block name input)
- **Change:**
  ```typescript
  <input
    type="text"
    value={editingBlock.name}
    onChange={(e) => setEditingBlock({ ...editingBlock, name: e.target.value })}
    onBlur={async () => {
      if (editingBlock && editingBlock._id) {
        await handleUpdateBlock(editingBlock);
      }
    }}
    placeholder="e.g., Main Dashboard"
    className="form-input"
  />
  ```
- **Why:** Auto-save like clicker pattern

**3.2 Update `handleUpdateBlock` with save status**
- **File:** `app/admin/visualization/page.tsx`
- **Function:** `handleUpdateBlock()`
- **Change:**
  1. Set `blockSaveStatus = 'saving'`
  2. Call `apiPut('/api/data-blocks', block)`
  3. If success, update local state and save template config
  4. Set status to 'saved' or 'error'
  5. Auto-reset to 'idle' after 2s (success) or 3s (error)
- **Why:** Visual feedback during updates

**3.3 Add save status indicator to edit modal**
- **File:** `app/admin/visualization/page.tsx`
- **Location:** Edit Block modal header or footer
- **Add:** `<SaveStatusIndicator status={blockSaveStatus} />`
- **Why:** User sees save progress

---

### Phase 4: Fix Template Config Saving

**4.1 Update `saveTemplateConfig` with save status**
- **File:** `app/admin/visualization/page.tsx`
- **Function:** `saveTemplateConfig()`
- **Change:**
  1. Set `templateSaveStatus = 'saving'`
  2. Use `apiPut()` instead of `fetch()`
  3. Handle errors properly
  4. Set status to 'saved' or 'error'
  5. Auto-reset to 'idle' after 2s (success) or 3s (error)
- **Why:** Reliable saves with feedback

**4.2 Add save status indicator for template operations**
- **File:** `app/admin/visualization/page.tsx`
- **Location:** Template selector area or near grid settings
- **Add:** `<SaveStatusIndicator status={templateSaveStatus} />`
- **Why:** User sees template save progress

---

### Phase 5: Error Handling & Retry Logic

**5.1 Add retry logic for failed saves**
- **File:** `app/admin/visualization/page.tsx`
- **Function:** `saveTemplateConfig()` and `handleUpdateBlock()`
- **Change:**
  - If save fails with network error, retry once after 1s
  - If retry fails, show error message
  - Log errors for debugging
- **Why:** Handle transient network issues

**5.2 Add validation before save**
- **File:** `app/admin/visualization/page.tsx`
- **Function:** `handleCreateBlock()` and `handleUpdateBlock()`
- **Change:**
  - Validate block name is not empty
  - Validate template is selected
  - Show validation errors before attempting save
- **Why:** Prevent invalid saves

---

## Implementation Checklist

### Phase 1: Core Infrastructure
- [ ] Replace `saveTemplateConfig` `fetch()` with `apiPut()`
- [ ] Add `blockSaveStatus` state
- [ ] Add `templateSaveStatus` state
- [ ] Import `SaveStatusIndicator` component

### Phase 2: Block Creation
- [ ] Update `handleCreateBlock` with save status
- [ ] Make block creation atomic (create + save template)
- [ ] Add `SaveStatusIndicator` to create block form
- [ ] Test: Create block → verify it appears in template

### Phase 3: Block Updates
- [ ] Add onBlur auto-save for block name
- [ ] Update `handleUpdateBlock` with save status
- [ ] Add `SaveStatusIndicator` to edit modal
- [ ] Test: Edit block name → verify auto-save on blur

### Phase 4: Template Config
- [ ] Update `saveTemplateConfig` with save status
- [ ] Add `SaveStatusIndicator` for template operations
- [ ] Test: Change grid settings → verify save

### Phase 5: Error Handling
- [ ] Add retry logic for failed saves
- [ ] Add validation before save
- [ ] Test: Network failure → verify retry
- [ ] Test: Invalid data → verify validation errors

---

## Testing Plan

### Manual Tests

1. **Block Creation:**
   - Create new block
   - Verify "Saving..." appears
   - Verify "Saved" appears
   - Verify block appears in template
   - Reload page → verify block persists

2. **Block Update:**
   - Edit block name
   - Blur field → verify auto-save
   - Verify "Saving..." → "Saved" feedback
   - Reload page → verify name persists

3. **Template Save:**
   - Change grid settings
   - Verify template save status
   - Reload page → verify settings persist

4. **Error Handling:**
   - Disconnect network
   - Try to save block
   - Verify error message
   - Reconnect → verify retry works

---

## Code Changes Summary

### Files to Modify

1. **`app/admin/visualization/page.tsx`**
   - Add save status states
   - Replace `fetch()` with `apiPut()`
   - Add `SaveStatusIndicator` components
   - Add onBlur handlers
   - Add error handling and retry logic

### New Dependencies

- None (reuse existing `SaveStatusIndicator` component)

### API Changes

- None (use existing endpoints)

---

## Success Criteria

✅ Block creation saves reliably to template  
✅ Block updates auto-save on blur  
✅ Visual feedback shows save progress  
✅ Errors are handled gracefully  
✅ CSRF protection is in place  
✅ Consistent UX with clicker pattern  

---

**Signed-off-by:** Tribeca  
**Status:** 📋 PLAN READY FOR IMPLEMENTATION

