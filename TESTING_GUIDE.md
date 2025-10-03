# Testing Guide - TailAdmin V2 Overhaul

**Development Server**: http://localhost:3000  
**Version**: v5.21.0  
**Branch**: feat/tailadmin-v2-overhaul  
**Test Date**: 2025-10-03

---

## 🎯 Priority Testing Areas

### High Priority (Must Test)
1. **Admin Dashboard** - Core navigation and layout
2. **Chart Exports** - PNG and PDF functionality
3. **Responsive Sidebar** - All breakpoints
4. **Public Pages** - Stats, Edit, Filter pages

### Medium Priority (Should Test)
5. **Font Selection** - Google Fonts integration
6. **Error States** - All error handling
7. **Loading States** - Spinners and messages

### Low Priority (Nice to Test)
8. **Accessibility** - Keyboard navigation
9. **Cross-browser** - Multiple browsers

---

## 📝 Detailed Test Cases

### 1. Admin Dashboard (http://localhost:3000/admin)

#### Visual Checks ✓
- [ ] Flat white cards (no glass effect)
- [ ] Color-coded accent bars on left edge (4px)
- [ ] 8 navigation cards in grid layout
- [ ] Equal card widths
- [ ] Subtle shadows (not dramatic)
- [ ] Hover effects work (lift + shadow increase)

#### Navigation Cards
- [ ] 🗂️ Projects - Green accent
- [ ] 🔍 Filter - Cyan accent
- [ ] 🏷️ Hashtags - Purple accent
- [ ] 📁 Categories - Orange accent
- [ ] 🎨 Design - Pink accent
- [ ] 📊 Charts - Yellow accent
- [ ] 🔢 Variables - Blue accent
- [ ] 📈 Visualization - Teal accent

#### Sidebar
- [ ] Desktop (≥1280px): Full sidebar visible (280px)
- [ ] Tablet (768-1279px): Auto-collapsed (80px, icons only)
- [ ] Mobile (<768px): Hamburger menu shows drawer
- [ ] Active route has blue indicator
- [ ] Version displayed in footer (v5.21.0)
- [ ] Escape key closes drawer on mobile

### 2. Chart Components Test

#### Navigate to Admin → Visualization or any stats page

**Test Each Chart Type**:

1. **PieChart/Donut Charts**
   - [ ] Gender Distribution - Shows 👥 emoji
   - [ ] Fans Location - Shows 📍 emoji  
   - [ ] Age Groups - Shows 👥 emoji
   - [ ] Visitor Sources - Shows 🌐 emoji
   - [ ] Legend is interactive (click to toggle)
   - [ ] Hover shows percentage tooltips
   - [ ] Export buttons visible (📋 Copy, 💾 Download)

2. **VerticalBarChart Components**
   - [ ] Merchandise Distribution with KPI card above
   - [ ] Value Breakdown with Advertisement Value KPI
   - [ ] Engagement Metrics with Core Fan Team KPI
   - [ ] Tooltips show on hover
   - [ ] Bars have rounded tops (8px)

3. **KPI Cards**
   - [ ] Large prominent numbers
   - [ ] Format displays correctly (currency/percentage/number)
   - [ ] Color variants applied (primary/secondary/success/warning/info)
   - [ ] Hover effects work

#### Export Testing
**PNG Export**:
- [ ] Click 💾 Download on any chart
- [ ] PNG file downloads with correct name
- [ ] Image quality is good
- [ ] Chart renders correctly in PNG

**Copy to Clipboard**:
- [ ] Click 📋 Copy on any chart
- [ ] Success message appears
- [ ] Can paste image into another app

### 3. Public Stats Page

#### Access: http://localhost:3000/stats/[any-valid-slug]

**Visual Design**:
- [ ] Gray background (--mm-gray-50)
- [ ] Max-width container (1400px)
- [ ] No glass-morphism effects
- [ ] Flat white hero section
- [ ] Proper spacing throughout

**Hero Section**:
- [ ] Event name displays
- [ ] Hashtags show with colors
- [ ] Created/Updated dates visible
- [ ] Two export buttons side-by-side:
  - [ ] 📊 Export CSV button
  - [ ] 📄 Export PDF button
- [ ] "Include derived metrics" checkbox works

**PDF Export**:
- [ ] Click 📄 Export PDF button
- [ ] Wait for processing
- [ ] PDF downloads with event name in filename
- [ ] PDF contains all charts and data
- [ ] Multi-page if content is long
- [ ] Quality is acceptable (0.95)

**CSV Export**:
- [ ] Click 📊 Export CSV button
- [ ] CSV downloads immediately
- [ ] Contains variable names and values
- [ ] Derived metrics included when checkbox checked

**Charts Display**:
- [ ] All 9 charts render correctly
- [ ] Charts use new Chart.js components
- [ ] No legacy SVG charts visible
- [ ] Charts are responsive

### 4. Edit Page

#### Access: http://localhost:3000/edit/[any-valid-slug]

**Authentication**:
- [ ] Password prompt shows on first visit
- [ ] Login card has flat design (no glass)
- [ ] Loading state shows clean spinner card

**Error State** (try invalid slug):
- [ ] Error card has flat design
- [ ] 4px red top border visible
- [ ] "✕ Close Editor" button present
- [ ] Button has hover effect (lift + shadow)

**Editor Interface**:
- [ ] Gray background applied
- [ ] EditorDashboard loads correctly
- [ ] Stats can be edited (clicker/manual mode)
- [ ] Save status shows in header

### 5. Filter Page

#### Access: http://localhost:3000/filter/[any-valid-slug]

**Visual Design**:
- [ ] Gray background (--mm-gray-50)
- [ ] Max-width container (1400px)
- [ ] Flat white cards throughout

**Hero Section**:
- [ ] "Aggregated Statistics" title
- [ ] Date range displays
- [ ] Hashtags shown
- [ ] Export CSV button works
- [ ] Export PDF button works

**Content**:
- [ ] Charts display aggregated data
- [ ] Projects list shows below charts
- [ ] Project count is accurate
- [ ] Proper spacing between sections

**Error State** (invalid filter):
- [ ] Error card with orange top border (not found)
- [ ] Or red top border (actual error)
- [ ] Flat design (no glass)

### 6. Font Selection (Admin → Design)

**Font Selector**:
- [ ] Navigate to Admin → Design
- [ ] Font selection dropdown visible
- [ ] Three fonts available: Inter, Roboto, Poppins
- [ ] Selecting font updates immediately
- [ ] Font persists after page refresh
- [ ] Font applies to all pages

### 7. Responsive Testing

**Desktop (≥1280px)**:
- [ ] Sidebar fully expanded (280px)
- [ ] Content has left margin for sidebar
- [ ] Charts display in proper grid
- [ ] Cards have consistent widths
- [ ] Padding: 32px

**Tablet (768-1279px)**:
- [ ] Sidebar auto-collapsed to 80px
- [ ] Icons visible, text hidden
- [ ] Content margin adjusted
- [ ] Charts stack appropriately
- [ ] Padding: 24px

**Mobile (<768px)**:
- [ ] Hamburger menu button visible
- [ ] Sidebar appears as overlay
- [ ] Scrim backdrop present
- [ ] Drawer closes on outside click
- [ ] Charts stack vertically
- [ ] Touch targets adequate (≥44px)
- [ ] Padding: 16px

### 8. Accessibility Testing

**Keyboard Navigation**:
- [ ] Tab key navigates through all interactive elements
- [ ] Focus visible on all elements
- [ ] Enter key activates buttons
- [ ] Escape key closes modals/drawers
- [ ] No keyboard traps

**Focus Indicators**:
- [ ] Blue outline visible on focus
- [ ] Consistent across all elements
- [ ] Not hidden by other styles

**ARIA Labels**:
- [ ] Sidebar has role="navigation"
- [ ] Buttons have descriptive labels
- [ ] Form inputs have associated labels

### 9. Loading States

**Check All Loading States**:
- [ ] Admin pages: Clean spinner in white card
- [ ] Stats page: "Loading project editor..." message
- [ ] Edit page: Context-appropriate messages
- [ ] Filter page: "Loading filter statistics..." message
- [ ] Gray background visible during loading
- [ ] Spinner centers properly

### 10. Error Handling

**Test Error Scenarios**:
- [ ] Invalid project ID
- [ ] Invalid filter slug
- [ ] Network error
- [ ] Error cards have flat design
- [ ] Color-coded top borders (red/orange)
- [ ] Error messages are clear
- [ ] No console errors unrelated to feature

---

## 🐛 Known Issues / Edge Cases

### To Monitor:
1. **PDF Export on Large Pages**: May take 5-10 seconds for long content
2. **Chart Loading**: First render might be slightly slower (Chart.js initialization)
3. **Font Switching**: Requires page reload to see full effect (expected)
4. **Mobile Safari**: Test PDF export specifically (may need special handling)

---

## ✅ Sign-Off Checklist

Before merging to main, confirm:

### Critical ✓
- [ ] No console errors in browser
- [ ] All admin pages load
- [ ] All public pages load
- [ ] CSV export works
- [ ] PDF export works
- [ ] Charts render correctly
- [ ] No visual regressions

### Important ✓
- [ ] Sidebar responsive behavior correct
- [ ] Font selection persists
- [ ] All loading states display properly
- [ ] Error states styled correctly
- [ ] Hover effects work smoothly

### Nice to Have ✓
- [ ] Accessibility basics covered
- [ ] Mobile experience acceptable
- [ ] Cross-browser tested (Chrome minimum)

---

## 🎯 Quick Smoke Test (5 minutes)

For a fast verification:

1. **Start Dev Server**: `npm run dev` ✓ (Already running)
2. **Admin Dashboard**: Visit http://localhost:3000/admin
   - Check sidebar works
   - Check cards display correctly
3. **Stats Page**: Visit any stats page
   - Check charts render
   - Try PDF export (just once)
4. **Edit Page**: Visit any edit page
   - Check loads without errors
5. **Filter Page**: Visit any filter page
   - Check loads without errors

If all 5 pass → Ready for deeper testing  
If any fail → Investigate before proceeding

---

## 📊 Test Results Template

```markdown
## Test Results - [Your Name] - [Date]

### Environment
- Browser: [Chrome/Firefox/Safari]
- OS: [macOS/Windows/Linux]
- Screen Size: [Desktop/Tablet/Mobile]

### Tests Passed: [X/50]

### Critical Issues Found:
1. [None] or [Issue description]

### Minor Issues Found:
1. [None] or [Issue description]

### Notes:
[Any additional observations]

### Recommendation:
[ ] Ready to merge
[ ] Needs fixes before merge
[ ] Needs more testing
```

---

**Happy Testing! 🚀**

Report any issues in the PR or create a new issue with the "bug" label.
