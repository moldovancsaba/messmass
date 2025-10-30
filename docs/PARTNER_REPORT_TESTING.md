# Partner Report Customization - Testing Guide

**Version:** 8.7.1  
**Date:** 2025-10-30  
**Status:** ✅ Ready for Testing

## Prerequisites

✅ ImgBB API key configured in `.env.local`
✅ MongoDB connection working
✅ Production build passing
✅ TypeScript compilation clean

## Testing Checklist

### Phase 1: Database Setup

**1. Run Variable Setup Script**
```bash
node scripts/add-partner-report-variables.js
```

**Expected Output:**
```
✅ Connected to MongoDB
📝 Adding text fields (reportText1-10)...
  ✅ Created: stats.reportText1
  ... (10 total)
🖼️  Adding image fields (reportImage1-10)...
  ✅ Created: stats.reportImage1
  ... (10 total)

✅ Partner Report Variables Summary:
   Text fields:  10 total (10 new)
   Image fields: 10 total (10 new)
```

**Verification:**
- Go to `/admin/kyc` (or `/admin/variables`)
- Search for "reportText" and "reportImage"
- Should see 20 variables in "Partner Report" category

---

### Phase 2: Customize Labels (Optional)

**1. Navigate to Variable Manager**
- URL: `/admin/variables`

**2. Edit Variable Labels**
- Find `reportText1`, click edit
- Change label to: "Event Summary"
- Find `reportImage1`, click edit
- Change label to: "Event Banner"
- Save changes

**Expected Result:**
- Labels updated in database
- New labels appear in Clicker editor

---

### Phase 3: Test Data Entry (Clicker)

**1. Open Clicker Editor**
- Navigate to any project: `/edit/[slug]`
- Login if required

**2. Test Text Fields**
- Scroll to "Partner Report" section (if grouped)
- Find text field labeled "Event Summary" (or reportText1)
- Type multi-line text:
  ```
  This event had exceptional turnout!
  
  Key highlights:
  - Record attendance
  - High merchandise sales
  - Great fan engagement
  ```
- Click outside field (blur)
- Watch for "💾 Saving..." indicator
- Verify "✅ Saved" appears in header

**3. Test Image Upload**
- Find image field labeled "Event Banner" (or reportImage1)
- Click upload area or drag image file
- Watch for "⏳ Uploading..." indicator
- Verify preview appears with image
- Verify "Replace" and "Delete" buttons show

**4. Test Image Actions**
- Click "Replace" → Upload different image
- Verify new image replaces old one
- Click "Delete" → Verify image removed
- Verify empty upload area shows again

**Expected Results:**
- ✅ Text auto-saves on blur
- ✅ Images upload to ImgBB
- ✅ URLs stored in MongoDB
- ✅ Character counter updates
- ✅ No console errors

---

### Phase 4: Create Chart Configurations

**1. Navigate to Chart Algorithm Manager**
- URL: `/admin/charts`

**2. Create Text Chart**
- Click "➕ New Configuration"
- Chart ID: `event-summary`
- Title: `Event Summary`
- Type: Select **`text`** from dropdown
- Order: 100
- Active: ✅ Checked
- Elements: Should auto-create 1 element
  - Label: "Summary"
  - Formula: `[stats.reportText1]`
  - Color: (any)
- Click "💾 Save Configuration"

**3. Create Image Chart**
- Click "➕ New Configuration"
- Chart ID: `event-banner`
- Title: `Event Banner`
- Type: Select **`image`** from dropdown
- Order: 101
- Active: ✅ Checked
- Elements: Should auto-create 1 element
  - Label: "Banner"
  - Formula: `[stats.reportImage1]`
  - Color: (any)
- Click "💾 Save Configuration"

**Expected Results:**
- ✅ Text and image types available in dropdown
- ✅ Charts save successfully
- ✅ Appear in chart list with correct type badges
- ✅ No validation errors

---

### Phase 5: Add Charts to Data Blocks

**1. Navigate to Page Style Configurator**
- URL: `/admin/page-style`

**2. Add Charts to Block**
- Find or create a data visualization block
- Click "Add Chart" in block
- Select "Event Summary" (text chart)
- Width: 1 or 2 (test both)
- Order: 1
- Click "Add Chart" again
- Select "Event Banner" (image chart)
- Width: 2 (recommended for images)
- Order: 2
- Save block configuration

**Expected Results:**
- ✅ Both charts added to block
- ✅ Preview shows in admin (if available)
- ✅ Configuration saves successfully

---

### Phase 6: View on Stats Page

**1. Navigate to Stats Page**
- URL: `/stats/[slug]` (same project used in Clicker)
- Enter password if required

**2. Verify Text Chart Display**
- Find "Event Summary" chart
- Verify text content matches what you entered
- Check line breaks preserved
- Check styling (bordered card, title, subtitle if configured)

**3. Verify Image Chart Display**
- Find "Event Banner" chart
- Verify image displays full-width
- Check responsive scaling
- Verify no text overlay on image area

**4. Test Responsive Behavior**
- Resize browser window
- Verify text wraps properly
- Verify image scales correctly
- Test on tablet width (768-1023px)
- Test on mobile width (<768px)

**Expected Results:**
- ✅ Text displays with preserved formatting
- ✅ Images display full-width
- ✅ Placeholders show for empty content
- ✅ Responsive layout works
- ✅ Charts integrate with other chart types

---

### Phase 7: Test Edge Cases

**1. Empty Content**
- Create project with no reportText1 value
- Verify text chart shows: "No content available"
- Create project with no reportImage1 value
- Verify image chart shows placeholder

**2. Long Text**
- Enter very long text (2000+ characters)
- Verify saves successfully
- Verify displays without overflow issues
- Verify character counter shows correctly

**3. Special Characters in Text**
- Enter text with:
  - Line breaks
  - Quotes: "test"
  - Apostrophes: it's
  - Emojis: 🎉 🎊
- Verify all display correctly

**4. Large Images**
- Upload image > 5MB
- Verify upload succeeds (ImgBB limit check)
- Verify display scales correctly

**5. Invalid Image URL**
- Manually edit project.stats with invalid URL
- Verify broken image handling (alt text or placeholder)

**Expected Results:**
- ✅ Graceful fallbacks for all edge cases
- ✅ No console errors
- ✅ User-friendly error messages where needed

---

### Phase 8: Chart Algorithm Manager Testing

**1. Edit Text/Image Chart**
- Go to `/admin/charts`
- Click "✏️ Edit" on text chart
- Change title, formula, or subtitle
- Save
- Verify changes reflected on stats page

**2. Toggle Active State**
- Click toggle button to deactivate chart
- Verify chart disappears from stats page
- Toggle back to active
- Verify chart reappears

**3. Reorder Charts**
- Use order controls to move charts
- Verify order changes in data blocks
- Verify order changes on stats page

**4. Delete Chart**
- Create test text chart
- Delete it
- Verify removed from database
- Verify removed from stats page

**Expected Results:**
- ✅ All CRUD operations work
- ✅ Changes propagate to stats pages
- ✅ No orphaned data

---

### Phase 9: Integration Testing

**1. Test with Other Chart Types**
- Create block with mixed charts:
  - 1 KPI chart
  - 1 Text chart
  - 1 Pie chart
  - 1 Image chart
- Verify all render correctly
- Verify spacing/alignment consistent

**2. Test PDF Export (if implemented)**
- Export stats page with text/image charts
- Verify charts included in PDF
- Verify formatting preserved

**3. Test WebSocket Real-time Updates (if applicable)**
- Open Clicker and Stats page side-by-side
- Edit text in Clicker
- Verify updates on Stats page (if real-time enabled)

**Expected Results:**
- ✅ Text/image charts integrate seamlessly
- ✅ No layout issues with mixed chart types
- ✅ Consistent styling across all charts

---

## Performance Testing

**1. Load Time**
- Stats page with 5+ text/image charts
- Measure initial page load
- Should load in < 2 seconds

**2. Image Loading**
- Stats page with 10 images
- Verify progressive loading
- Verify no layout shift during load

**3. Clicker Responsiveness**
- Upload 10 images sequentially
- Verify each upload completes before next
- Verify no memory leaks

**Expected Results:**
- ✅ Fast page loads
- ✅ Smooth image loading
- ✅ No performance degradation

---

## Known Limitations

**Image Upload:**
- Max file size: ImgBB limit (typically 32MB)
- Supported formats: JPG, PNG, GIF, BMP, WEBP
- Requires internet connection for ImgBB API

**Text Fields:**
- No rich text formatting (plain text only)
- No markdown support (Phase 3 feature)
- Character counter informational only (no limit enforced)

**Chart Display:**
- Text charts don't support HTML rendering
- Image charts require valid URLs
- No local file storage (ImgBB only)

---

## Troubleshooting

### Images Not Uploading

**Symptom:** Upload fails, error message shown

**Causes:**
1. Invalid ImgBB API key
2. Network connection issue
3. File too large
4. Unsupported file format

**Solutions:**
1. Verify `IMGBB_API_KEY` in `.env.local`
2. Check browser console for error details
3. Try smaller image (<5MB)
4. Convert to JPG or PNG format

### Text Not Saving

**Symptom:** Text disappears after blur

**Causes:**
1. MongoDB connection lost
2. Validation error
3. Browser console errors

**Solutions:**
1. Check MongoDB connection in server logs
2. Verify no TypeScript errors
3. Check browser network tab for failed API calls

### Charts Not Appearing

**Symptom:** Stats page doesn't show new charts

**Causes:**
1. Chart not active
2. Chart not added to data block
3. Formula syntax error
4. Cache issue

**Solutions:**
1. Verify chart active in `/admin/charts`
2. Check data block configuration in `/admin/page-style`
3. Test formula in Chart Algorithm Manager
4. Hard refresh stats page (Ctrl+Shift+R)

---

## Success Criteria

✅ All 20 variables created in database  
✅ Text fields auto-save in Clicker  
✅ Images upload to ImgBB successfully  
✅ Text charts display on stats pages  
✅ Image charts display on stats pages  
✅ Responsive layout works correctly  
✅ No console errors during normal operation  
✅ Production build succeeds  
✅ TypeScript compilation clean  
✅ Integration with existing charts seamless  

---

## Deployment Checklist

Before deploying to production:

- [ ] All tests passed locally
- [ ] ImgBB API key set in production environment
- [ ] MongoDB connection verified
- [ ] Build succeeds without errors
- [ ] Documentation reviewed and updated
- [ ] Example charts created for demo
- [ ] User training materials prepared (if needed)
- [ ] Rollback plan documented

---

## Support & References

- **Feature Documentation:** `PARTNER_REPORT_CUSTOMIZATION.md`
- **Admin Variables Guide:** `ADMIN_VARIABLES_SYSTEM.md`
- **Chart System:** `lib/chartConfigTypes.ts`
- **ImgBB API:** https://api.imgbb.com/

**Questions?** Check documentation or review code comments (WHAT/WHY/HOW format).
