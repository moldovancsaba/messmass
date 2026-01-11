# Unified Admin System - Complete Feature List
Status: Archived
Last Updated: 2026-01-11T22:28:38.000Z
Canonical: No
Owner: Architecture

**Version**: 10.1.2  
**Last Updated**: 2026-01-11T22:28:38.000Z  
**Status**: Partially Complete - Critical Gaps Identified

---

## Expected Features (Plain English)

### ✅ 1. **Live Filtering at Search**
**What it means**: As you type in the search box, results filter immediately  
**How it works**: Search updates after 300 milliseconds of no typing  
**What you can search**: Event names, hashtags, all text fields related to the item  

**Status by Page**:
- ✅ **Users**: Working - searches email, name, role
- ✅ **Categories**: Working - searches category name
- ⚠️ **Projects/Events**: Working but **missing column search** (currently searches only event name and hashtags, not all columns)

---

### ❌ 2. **Order by Columns** (Click Column Headers to Sort)
**What it means**: Click a column header once to sort A→Z, click again for Z→A, click third time to remove sorting  
**How it works**: Visual arrows show which column is sorted and in what direction  

**Status by Page**:
- ✅ **Users**: **WORKING PERFECTLY** - All columns sortable (Email, Name, Role, Last Login, Created)
- ❌ **Categories**: **NOT WORKING** - Columns marked as sortable but sorting handler not connected
- ❌ **Projects/Events**: **NOT WORKING** - `enableSort={false}` explicitly disabled in page code (line 364)

**THE PROBLEM**: Categories and Projects adapters have `sortable: true` on columns, but:
1. Categories page doesn't pass sort handlers to UnifiedAdminPage
2. Projects page has sorting disabled by design

---

### ✅ 3. **Search All Related Columns**
**What it means**: If you search "john", it finds matches in name, email, description, tags - anywhere relevant  
**How it works**: Backend searches multiple fields simultaneously  

**Status by Page**:
- ✅ **Users**: Searches email, name, role
- ✅ **Categories**: Searches name (only field)
- ⚠️ **Projects/Events**: **INCOMPLETE** - Only searches `eventName` and `hashtags`, misses:
  - Partner names
  - Event date
  - Custom notes/descriptions if they exist

---

### ❌ 4. **Working Pagination** (Load More Results)
**What it means**: When you scroll to bottom or click "Load More", next batch of results appears  
**How it works**: Fetches 20 items at a time, keeps track of position  

**Status by Page**:
- ⚠️ **Users**: No pagination (loads all users at once)
- ⚠️ **Categories**: No pagination (loads all categories at once)
- ❌ **Projects/Events**: **BROKEN** - Pagination code exists but "Load More" button missing from UI

---

### ❌ 5. **Edit Function** (Pencil Icon Opens Edit Modal)
**What it means**: Click "Edit" button on any item, modal opens with pre-filled data, change values, save  
**How it works**: Edit button → Modal → Update API call → Success message  

**Status by Page**:
- ⚠️ **Users**: Edit button shows **"Delete User" modal instead** (line 107 in usersAdapter.tsx)
- ⚠️ **Categories**: Edit button just logs to console, doesn't open modal
- ⚠️ **Projects/Events**: Edit button opens modal but **only edits metadata** (name, date, hashtags), **DOES NOT EDIT STATISTICS**

**CRITICAL BUG**: Users page Edit action has copy-paste error showing delete confirmation

---

### 🚨 6. **CRITICAL: Edit Stats Function** (The Main Purpose of MessMass)
**What it means**: Click a button to open the full statistics editor with all clicker buttons and manual input fields  
**How it works**: Should open `/edit/[slug]` page or inline editor modal  

**Status**:
- ❌ **Projects/Events**: **MISSING COMPLETELY**
- **The Problem**: Projects page only has "Edit" (metadata), "Delete", "View Stats", "CSV Export"
- **What's Missing**: **"Edit Stats" button** that navigates to `/edit/[editSlug]` or opens stats editor

**THIS IS THE MAIN APPLICATION FUNCTION - WITHOUT THIS, THE PAGE IS USELESS**

---

### ❌ 7. **Actions Under Each Other Vertically** (Stacked Button Layout)
**What it means**: Action buttons stack vertically in a dropdown or column, not horizontally squished  
**How it works**: Click "⋮" menu icon, buttons appear in vertical list  

**Status**:
- ❌ **All Pages**: Actions currently display **horizontally in a row** (see UnifiedListView.tsx line 162)
- **Expected**: Vertical dropdown menu (like industry standard admin panels)
- **Current**: All buttons visible at once, crowded on mobile

---

## Summary Table

| Feature | Users | Categories | Projects/Events | Expected |
|---------|-------|------------|-----------------|----------|
| **Live Search** | ✅ Works | ✅ Works | ⚠️ Partial | ✅ All columns |
| **Sort Columns** | ✅ Works | ❌ Broken | ❌ Disabled | ✅ All sortable columns |
| **Multi-Field Search** | ✅ Works | ⚠️ Single field | ⚠️ Limited | ✅ All relevant fields |
| **Pagination** | ⚠️ No pagination | ⚠️ No pagination | ❌ Broken | ✅ Load more button |
| **Edit Modal** | ❌ Wrong modal | ⚠️ No handler | ⚠️ Metadata only | ✅ Full edit |
| **Edit Stats** | N/A | N/A | 🚨 **MISSING** | ✅ **CRITICAL** |
| **Vertical Actions** | ❌ Horizontal | ❌ Horizontal | ❌ Horizontal | ✅ Dropdown menu |

---

## What Needs to Be Fixed (Priority Order)

### 🚨 **CRITICAL (P0) - Application is Broken Without These**

1. **Add "Edit Stats" button to Projects page**  
   - Add new row action in `projectsAdapter.tsx`
   - Button label: "📊 Edit Stats"
   - Handler: Navigate to `/edit/[editSlug]`
   - Position: Between "View Stats" and "Edit"

2. **Fix Users page Edit button showing Delete modal**  
   - Line 107 in `usersAdapter.tsx` has wrong confirmation message
   - Should show edit modal, not delete confirmation

---

### 🔴 **HIGH PRIORITY (P1) - Expected Standard Features**

3. **Enable column sorting on Projects page**  
   - Change `enableSort={false}` to `enableSort={true}` (line 364 in page.tsx)
   - Add sort handlers to UnifiedAdminPage call
   - Connect to existing sort logic (lines 182-218)

4. **Enable column sorting on Categories page**  
   - Add sort state management
   - Pass sort handlers to UnifiedAdminPage
   - Categories are small dataset, client-side sort is fine

5. **Add pagination "Load More" button to Projects page**  
   - UI component exists in code but not rendered
   - Should appear at bottom when more results available
   - Uses `nextCursor`, `searchOffset`, or `sortOffset` depending on mode

---

### 🟡 **MEDIUM PRIORITY (P2) - UX Improvements**

6. **Convert horizontal action buttons to vertical dropdown**  
   - Change `UnifiedListView.tsx` action button layout
   - Add "⋮" menu icon
   - Show buttons vertically on click
   - Follow industry standard admin panel pattern

7. **Expand Projects search to all relevant fields**  
   - Add partner names to search
   - Add event date to search (if user searches "2024-10", show those events)
   - Backend API already supports this, just needs query expansion

---

### 🟢 **LOW PRIORITY (P3) - Nice to Have**

8. **Add pagination to Users and Categories**  
   - Currently loads all items at once
   - Fine for small datasets (<100 items)
   - Add if performance becomes issue

---

## Root Cause Analysis

### Why is this inconsistent?

1. **Users page was built first** - Has most complete implementation
2. **Categories page** - Partially migrated, missing sort handlers
3. **Projects page** - Most complex, deliberately disabled sorting to focus on search
4. **Edit Stats button** - Forgotten during migration from old projects page

### Why does Users Edit show Delete?

**Copy-paste error** in `usersAdapter.tsx`:
```typescript
// Line 97-102: Edit action
handler: (user) => {
  console.log('Edit user:', user._id);
},
title: 'Edit user', // ← Says "Edit"

// Line 106-110: Delete action  
handler: (user) => {
  if (confirm(`Delete user "${user.email}"?`)) { // ← Shows delete modal
```

The Edit handler doesn't actually open an edit modal, just logs. The confirm dialog is in Delete handler but user sees it for Edit due to UI bug.

---

## Implementation Plan

See `TASKLIST.md` for specific implementation tasks with version increments.

---

**Questions?** This document explains what you should expect from a unified admin system based on industry standards (like WordPress admin, Shopify admin, Stripe dashboard, etc.).
