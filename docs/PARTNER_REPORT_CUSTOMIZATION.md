# Partner Report Customization Feature

**Version:** 8.7.1  
**Date:** 2025-10-30  
**Status:** ✅ Implemented

## Overview

Partner report pages can now be customized with event-specific text notes and uploaded images. This enables richer, more personalized reports for partners.

## Features

### 📝 Text Fields (10)
- **Variables:** `stats.reportText1` through `stats.reportText10`
- **Type:** Multi-line textarea with auto-save
- **Storage:** String values in MongoDB `project.stats`
- **No character limit** (informational counter only)
- **Labels customizable** via Admin → KYC Variables

### 🖼️ Image Fields (10)
- **Variables:** `stats.reportImage1` through `stats.reportImage10`
- **Type:** Image upload with preview
- **Storage:** ImgBB URLs stored as strings in MongoDB
- **Features:**
  - Drag-and-drop or click to upload
  - Preview with replace/delete buttons
  - Hosted on imgbb.com (requires API key)

## Architecture

### Components

#### `TextareaField.tsx`
- **Location:** `/components/TextareaField.tsx`
- **Props:**
  - `label`: Field label
  - `value`: Current text value
  - `onSave`: Callback when text changes (on blur)
  - `rows`: Number of textarea rows (default: 4)
- **Styling:** Uses only centralized CSS variables (`--mm-*`)

#### `ImageUploadField.tsx`
- **Location:** `/components/ImageUploadField.tsx`
- **Props:**
  - `label`: Field label
  - `value`: Current image URL
  - `onSave`: Callback when image is uploaded
- **Styling:** Uses only centralized CSS variables (`--mm-*`)

### API Endpoints

#### `POST /api/upload-image`
- **Purpose:** Upload image to ImgBB and return URL
- **Request:** `multipart/form-data` with `image` field
- **Response:**
  ```json
  {
    "success": true,
    "url": "https://i.ibb.co/..."
  }
  ```
- **Error handling:** Returns user-friendly error messages

### Database Schema

#### `variables_metadata` Collection
```javascript
{
  name: "stats.reportText1", // or reportImage1, etc.
  label: "reportText1",      // Customizable in admin
  type: "text",              // Both text and images use 'text' type
  category: "Partner Report",
  flags: {
    visibleInClicker: true,
    editableInManual: true
  },
  order: 300-410            // Text: 300-310, Images: 400-410
}
```

#### `projects` Collection
```javascript
{
  stats: {
    // Numeric fields
    remoteImages: 150,
    // ...
    
    // Text fields (strings)
    reportText1: "This event had exceptional turnout...",
    reportText2: "",
    
    // Image fields (ImgBB URLs as strings)
    reportImage1: "https://i.ibb.co/abc123/image.jpg",
    reportImage2: ""
  }
}
```

### Configuration

#### Environment Variables

**Required for image upload:**
```bash
IMGBB_API_KEY=your_imgbb_api_key_here
```

Get your ImgBB API key at: https://api.imgbb.com/

#### Config System
- Added `imgbbApiKey` to `lib/config.ts`
- Type-safe access via `config.imgbbApiKey`

## Usage

### 1. Database Setup

Run the setup script to add variables to your database:

```bash
node scripts/add-partner-report-variables.js
```

This creates:
- 10 text variables: `stats.reportText1` - `stats.reportText10`
- 10 image variables: `stats.reportImage1` - `stats.reportImage10`

### 2. Configure Variable Groups (Optional)

Go to `/admin/variables` to:
- Customize field labels (e.g., "Event Summary", "Sponsor Logo")
- Create variable groups for organized layout
- Control visibility in Clicker vs Manual mode

### 3. Use in Clicker Editor

Navigate to `/edit/[slug]` for any project:

**Text fields:**
- Multi-line textarea automatically appears
- Type your notes
- Auto-saves on blur (when you leave the field)
- Character count displayed

**Image fields:**
- Click or drag-and-drop to upload
- Preview appears with image
- "Replace" button to upload new image
- "Delete" button to remove image

### 4. Display in Reports

Text and image fields can be used in:
- **Chart formulas** (reference as `[stats.reportText1]`, etc.)
- **Custom chart types** (create "text" and "image" chart types)
- **PDF exports** (future enhancement)

## Integration with Existing Systems

### Editor Dashboard
- Automatically detects `reportText*` and `reportImage*` variables
- Renders appropriate input component based on variable name pattern
- Both Clicker and Manual modes supported

### Variable Groups System
- Partner Report variables can be grouped like other KYC variables
- Supports custom titles and KPI charts above groups
- Respects visibility flags (`visibleInClicker`, `editableInManual`)

### Centralized Styling
- **NO hardcoded styles** in component CSS modules
- **ALL styling** uses design tokens from `app/styles/theme.css`
- Consistent with existing form components (`.form-input`, `.input-card`)

## Design Principles

### ✅ Centralized Styling Only
All CSS uses `--mm-*` variables:
- Colors: `--mm-gray-*`, `--mm-color-primary-*`, `--mm-error`
- Spacing: `--mm-space-*`
- Typography: `--mm-font-size-*`, `--mm-font-weight-*`
- Borders: `--mm-border-width-*`, `--mm-radius-*`
- Shadows: `--mm-shadow-*`
- Transitions: `--transition-*`

### ✅ Reuse Before Creation
- Searched existing codebase before creating new components
- Reused existing form patterns and API structures
- Followed established naming conventions

### ✅ Professional Comments
Every function includes:
- **WHAT:** What the code does
- **WHY:** Why this approach was chosen
- **HOW:** How it works technically

## Future Enhancements

### ✅ Chart Types (Phase 2 - Complete)
Chart types for displaying content on stats pages:

**Text Chart:**
- ✅ Display `reportText*` values as formatted text blocks
- ✅ Preserves line breaks with `white-space: pre-wrap`
- ✅ Placeholder for empty content
- ✅ Consistent card styling with title/subtitle
- Location: `components/charts/TextChart.tsx`

**Image Chart:**
- ✅ Display `reportImage*` as full-width responsive images
- ✅ No text overlay in image display area
- ✅ Responsive scaling with `object-fit: cover`
- ✅ Placeholder for missing images
- ✅ Direct ImgBB URL rendering (no Next.js config needed)
- Location: `components/charts/ImageChart.tsx`

**Integration:**
- ✅ Added to `DynamicChart.tsx` rendering logic
- ✅ Supported in Chart Algorithm Manager
- ✅ Type-safe in all chart calculation results
- ✅ Validation in `UnifiedDataVisualization.tsx`

### Bulk Operations
- Upload multiple images at once
- Template text blocks for common report sections

### Rich Text Editor
- Replace plain textarea with WYSIWYG editor
- Support bold, italic, lists, links

## Troubleshooting

### Images not uploading
1. Check `IMGBB_API_KEY` is set in `.env.local`
2. Verify ImgBB API key is valid at https://api.imgbb.com/
3. Check browser console for error messages
4. Check `/api/upload-image` response in Network tab

### Text not saving
1. Ensure you've blurred the textarea (clicked outside)
2. Check save status indicator in editor header
3. Verify MongoDB connection in server logs

### Fields not appearing in editor
1. Run database setup script: `node scripts/add-partner-report-variables.js`
2. Check `/admin/variables` to verify variables exist
3. Ensure `visibleInClicker` flag is `true`
4. Create variable groups if needed

## Version History

### v8.7.1 (2025-10-30) - Complete

**Phase 1: Data Entry (Clicker Editor)**
- ✅ Added 20 partner report variables (10 text + 10 images)
- ✅ Created `TextareaField` component with auto-save
- ✅ Created `ImageUploadField` component with ImgBB integration
- ✅ Created `/api/upload-image` endpoint
- ✅ Integrated into `EditorDashboard` with automatic detection
- ✅ Updated TypeScript types to support string values in `project.stats`
- ✅ Added `imgbbApiKey` to centralized config system

**Phase 2: Display (Stats Pages)**
- ✅ Created `TextChart` component for text display
- ✅ Created `ImageChart` component for image display
- ✅ Added text/image chart type support to type system
- ✅ Integrated into `DynamicChart` rendering pipeline
- ✅ Updated `UnifiedDataVisualization` validation logic
- ✅ Added centralized CSS styles (`.text-chart-*`, `.image-chart-*`)
- ✅ Type-safe handling in Chart Algorithm Manager
- ✅ All styling uses centralized design tokens only

## References

- **Variables System:** `ADMIN_VARIABLES_SYSTEM.md`
- **Design Tokens:** `app/styles/theme.css`
- **API Client:** `lib/apiClient.ts`
- **Config System:** `lib/config.ts`
- **WARP Rules:** `WARP.md`
