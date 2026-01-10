# Report Template Management - Implementation Plan

**Date:** 2026-01-02  
**Feature:** Add Rename, Copy, Delete operations to Report Template management  
**Location:** `app/admin/visualization/page.tsx` (Visualization Manager)

---

## Current State

**Template Selector UI:**
- Dropdown to select template
- "🎯 Edit Live Partner Reports" button
- "➕ New Template" button
- Template info display (blocks count, grid size)

**Existing API:**
- `GET /api/report-templates` - List templates
- `POST /api/report-templates` - Create template
- `PUT /api/report-templates?templateId=...` - Update template (supports name update)
- `DELETE /api/report-templates?templateId=...` - Delete template (with safety checks)

**Existing Modal System:**
- `FormModal` - For forms (create/edit)
- `ConfirmDialog` - For confirmations (delete)
- `BaseModal` - For custom layouts

---

## Implementation Plan

### 1. UI Changes

**Add "Edit Template" button:**
- Location: Next to template dropdown (after "New Template" button)
- Icon: Material Icon "edit" or "more_vert" (menu)
- Action: Opens template management modal

**Template Management Modal:**
- Title: "📝 Manage Report Template: [Template Name]"
- Size: `md` (medium)
- Three sections:
  1. **Rename Section**
     - Input field (pre-filled with current name)
     - "Save" button
     - Updates template name via PUT API
  2. **Copy Section**
     - "Copy Template" button
     - Creates duplicate with "Copy of [Name]" suffix
     - Uses POST API with all template data
     - Auto-selects new template after copy
  3. **Delete Section**
     - "Delete Template" button (danger style)
     - Opens ConfirmDialog for confirmation
     - Shows warning if template is in use
     - Uses DELETE API

### 2. Component Structure

**Modal Component:**
- Use `BaseModal` or `FormModal` (depending on layout needs)
- If using `FormModal`: Custom footer with 3 action buttons
- If using `BaseModal`: Custom layout with 3 sections

**State Management:**
```typescript
const [showTemplateEditModal, setShowTemplateEditModal] = useState(false);
const [templateEditName, setTemplateEditName] = useState('');
const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
```

**API Calls:**
- Rename: `apiPut('/api/report-templates?templateId=...', { name: newName })`
- Copy: `apiPost('/api/report-templates', { ...template, name: 'Copy of ' + template.name, isDefault: false })`
- Delete: `apiDelete('/api/report-templates?templateId=...')`

### 3. Implementation Details

**Rename Operation:**
1. User clicks "Edit Template" button
2. Modal opens with current template name in input
3. User edits name
4. User clicks "Save" button
5. PUT request to update name
6. Refresh templates list
7. Update selected template if it was renamed
8. Close modal

**Copy Operation:**
1. User clicks "Copy Template" button
2. POST request with template data (excluding _id, createdAt)
3. New template created with "Copy of [Name]" suffix
4. Refresh templates list
5. Auto-select new template
6. Show success message
7. Close modal

**Delete Operation:**
1. User clicks "Delete Template" button
2. Open ConfirmDialog with warning message
3. If confirmed, DELETE request
4. If template is in use, show error from API
5. Refresh templates list
6. Clear selection if deleted template was selected
7. Close modal

### 4. Safety Checks

**Delete Safety (from API):**
- Cannot delete default template
- Cannot delete template in use by partners/projects
- API returns error with details

**Copy Safety:**
- New template should not be marked as default
- Copy all dataBlocks, gridSettings, heroSettings, alignmentSettings
- Generate new _id (handled by API)

**Rename Safety:**
- Validate name is not empty
- Check for duplicate names (optional - can allow duplicates)

### 5. User Experience

**Modal Layout:**
```
┌─────────────────────────────────────┐
│ 📝 Manage Report Template: [Name]  │
├─────────────────────────────────────┤
│                                     │
│ Rename Template                     │
│ ┌─────────────────────────────┐   │
│ │ [Template Name Input]       │   │
│ └─────────────────────────────┘   │
│ [Save Name]                        │
│                                     │
│ Copy Template                       │
│ [Copy Template]                     │
│                                     │
│ Delete Template                     │
│ [Delete Template] (danger)         │
│                                     │
│ [Cancel]                            │
└─────────────────────────────────────┘
```

**Button Styles:**
- Rename "Save": `btn-primary`
- Copy: `btn-secondary`
- Delete: `btn-danger`
- Cancel: `btn-secondary` (in modal footer)

### 6. Files to Modify

1. **`app/admin/visualization/page.tsx`**
   - Add state for edit modal
   - Add "Edit Template" button
   - Add template management modal
   - Add handlers for rename/copy/delete
   - Use `apiPut`, `apiPost`, `apiDelete` from `apiClient.ts`

2. **`app/admin/visualization/Visualization.module.css`** (if needed)
   - Add styles for template management modal sections

### 7. Dependencies

**Existing Modules:**
- `FormModal` or `BaseModal` from `components/modals/`
- `ConfirmDialog` from `components/modals/`
- `apiPut`, `apiPost`, `apiDelete` from `lib/apiClient.ts`
- `MaterialIcon` from `components/MaterialIcon.tsx`

**No New Dependencies Required**

---

## Implementation Steps

1. ✅ Read existing code (done)
2. ⏳ Add state management for edit modal
3. ⏳ Add "Edit Template" button to UI
4. ⏳ Create template management modal component
5. ⏳ Implement rename handler
6. ⏳ Implement copy handler
7. ⏳ Implement delete handler with ConfirmDialog
8. ⏳ Add error handling and success messages
9. ⏳ Test all three operations
10. ⏳ Update documentation

---

## Acceptance Criteria

- [ ] "Edit Template" button visible next to template dropdown
- [ ] Clicking "Edit Template" opens modal with current template name
- [ ] Rename operation updates template name and refreshes list
- [ ] Copy operation creates new template with "Copy of [Name]" and auto-selects it
- [ ] Delete operation shows confirmation dialog and prevents deletion if in use
- [ ] All operations use existing modal system (FormModal/BaseModal/ConfirmDialog)
- [ ] All operations use existing API client (apiPut/apiPost/apiDelete)
- [ ] Error handling shows user-friendly messages
- [ ] Success messages confirm actions
- [ ] No hardcoded values, uses design system

---

*Plan created: 2026-01-02 | Tribeca*

