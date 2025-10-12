# Category Color Setup Guide

**Version:** 5.48.3  
**Last Updated:** 2025-10-12T14:13:00.000Z

## Overview

This guide explains how to set up and configure hashtag category colors in MessMass, specifically addressing the issue where partner hashtags may not display in their intended color.

---

## How Category Colors Work

### Color Resolution Priority

When displaying a hashtag, the system uses this priority order:

1. **Category Color** (highest priority) - If hashtag belongs to a category, use that category's color
2. **Individual Hashtag Color** - If no category, use the hashtag's own color
3. **Default Color** - Purple fallback (`#a855f7`)

### Technical Implementation

The `useHashtagColorResolver` hook in `/hooks/useHashtagColorResolver.ts` handles intelligent color resolution:

```typescript
// Example: "partner:redbull" → uses "partner" category color
// Example: "summer" with no category → uses individual hashtag color or default
```

---

## Problem: Partner Hashtags Not Showing Partner Color

### Root Cause

Partner hashtags are not displaying in the partner category color because:
1. The "partner" category may not exist in the database
2. The "partner" category may not have the correct color assigned
3. You may not have permissions to edit categories in the admin UI

### Solution Steps

#### Step 1: Verify Category Exists

1. Log in to the admin panel: `https://www.messmass.com/admin`
2. Navigate to: **📁 Categories** page (`/admin/categories`)
3. Look for a category named "partner"

#### Step 2: Check Current Color

If the "partner" category exists:
- Look at the colored left border of the category card
- Check if it matches your desired color (e.g., orange for partners)

#### Step 3: Edit Category Color

To change the partner category color:

1. On the Categories page, find the "partner" category card
2. Click the **✏️ Edit** button on the right side
3. In the edit modal, you'll see:
   - Category Name field
   - Display Order field
   - Category Color section (color picker + hex code input)
4. Use the color picker or enter a hex code (e.g., `#FF6B35` for orange)
5. Click **✔️ Update Category**

#### Step 4: Create Category If Missing

If the "partner" category doesn't exist:

1. Click the **➕ New Category** button at the top
2. Fill in the form:
   - **Category Name**: `partner` (lowercase, as stored in database)
   - **Display Order**: `1` (or your preferred order)
   - **Category Color**: Choose orange or enter `#FF6B35`
3. Click **🆕 Create Category**

---

## Troubleshooting

### Issue: Cannot Edit or Create Categories

If the Edit button doesn't work or the modal doesn't open:

**Possible Causes:**
1. JavaScript error in browser console
2. Authentication session expired
3. Network/API error

**Debug Steps:**

1. **Check Browser Console:**
   - Open Developer Tools (F12 or Cmd+Option+I)
   - Look for red error messages
   - Check Network tab for failed API calls

2. **Verify Authentication:**
   - Ensure you're logged in to `/admin`
   - Try logging out and back in
   - Check if the session cookie exists

3. **Test API Directly:**
   - Open browser console on `/admin/categories` page
   - Run this command:
   ```javascript
   fetch('/api/hashtag-categories')
     .then(r => r.json())
     .then(data => console.log('Categories:', data));
   ```
   - You should see: `{ success: true, categories: [...] }`

4. **Check for Validation Errors:**
   - If creating/editing fails, check for alert messages
   - Common issues:
     - Empty category name
     - Duplicate category name
     - Invalid hex color code

### Issue: Changes Don't Appear on Frontend

If you successfully edit the category color but don't see changes:

1. **Clear Browser Cache:**
   - Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
   - Or clear cache in browser settings

2. **Check ETag Caching:**
   - The API uses ETag caching for categories
   - Categories are marked as `CACHE_PRESETS.STATIC`
   - Browser may be serving cached data

3. **Force API Refresh:**
   - In browser console, run:
   ```javascript
   fetch('/api/hashtag-categories', { cache: 'reload' })
     .then(r => r.json())
     .then(data => console.log('Fresh categories:', data));
   ```

### Issue: Partner Hashtags Still Wrong Color After Category Edit

If partner hashtags still don't show the partner color:

1. **Verify Category Name Match:**
   - Database stores categories as lowercase (e.g., "partner")
   - Projects store `categorizedHashtags.partner` array
   - Names must match exactly

2. **Check Project Data:**
   - Go to `/admin/projects`
   - Click a project that should have partner hashtags
   - Verify `categorizedHashtags` includes "partner" category

3. **Rebuild Hashtag Display:**
   - Partner hashtags should be in format: `"partner:redbull"`
   - The component splits by `:` to determine category
   - If stored differently, color resolution won't work

---

## Manual Database Fix (Advanced)

If the admin UI is completely blocked, you can manually update via MongoDB:

### Prerequisites
- Access to MongoDB Atlas or your database instance
- Database name: (from `MONGODB_URI` env var)

### Update Category Color

```javascript
// Connect to MongoDB and run:
db.hashtag_categories.updateOne(
  { name: "partner" },
  {
    $set: {
      color: "#FF6B35",  // Your desired color
      updatedAt: new Date().toISOString()
    }
  }
);
```

### Create Missing Category

```javascript
// Connect to MongoDB and run:
db.hashtag_categories.insertOne({
  name: "partner",
  color: "#FF6B35",  // Orange for partners
  order: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});
```

---

## Verification Steps

After making changes, verify the fix:

### 1. Check Category in Admin
- Visit `/admin/categories`
- Confirm "partner" category shows correct color on card border

### 2. Check Hashtag Display
- Visit `/admin/projects` or `/admin/hashtags`
- Find projects with partner hashtags (e.g., "partner:redbull")
- Verify the hashtag bubble shows in partner color

### 3. Check Public Pages
- Visit a project stats page with partner hashtags
- Verify colors display correctly for end users

---

## Recommended Partner Category Color

For optimal visibility and branding consistency:

- **Color Name:** Orange
- **Hex Code:** `#FF6B35`
- **RGB:** `rgb(255, 107, 53)`
- **Usage:** High-contrast, sponsor-friendly, stands out from default purple

Alternative options:
- **Gold:** `#FFB800` - Premium feel
- **Bright Orange:** `#FF8C00` - High energy
- **Coral:** `#FF6F61` - Softer, modern

---

## Common Category Color Recommendations

| Category | Suggested Color | Hex Code | Use Case |
|----------|----------------|----------|----------|
| partner  | Orange         | #FF6B35  | Sponsors, collaborators |
| sport    | Blue           | #3B82F6  | Sports, athletics |
| team     | Green          | #10B981  | Teams, groups |
| location | Red            | #EF4444  | Places, venues |
| period   | Indigo         | #6366F1  | Time periods, seasons |

---

## Code References

For developers investigating color resolution issues:

- **Color Resolver Hook:** `/hooks/useHashtagColorResolver.ts`
- **Category API:** `/app/api/hashtag-categories/route.ts`
- **Category Page:** `/app/admin/categories/page.tsx`
- **Hashtag Bubble Component:** `/components/ColoredHashtagBubble.tsx`
- **Utility Functions:** `/lib/hashtagCategoryUtils.ts`

---

## Need Further Assistance?

If you've followed all steps and still cannot:
1. Access the Categories page
2. Edit category colors
3. See partner hashtags in the correct color

Then the issue may be:
- **Permission/Role-based access control** not yet implemented
- **Database connection issue** preventing reads/writes
- **Code bug** in the admin UI or API

Next debugging steps:
1. Check `/api/debug/notifications` endpoint for auth status
2. Review server logs for API errors
3. Test API endpoints directly with curl/Postman
4. Check MongoDB connection and permissions

---

*This guide is maintained as part of the MessMass documentation system.*  
*Last Updated: 2025-10-12T14:13:00.000Z*
