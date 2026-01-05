# Font Management System

**Version:** 1.0.0  
**Last Updated:** 2026-01-02  
**Status:** ✅ Complete

## Overview

The Font Management System provides **centralized, database-driven font configuration** with zero hardcoding. All available fonts are stored in MongoDB and can be managed dynamically without code changes.

## Architecture

### Database Collection: `available_fonts`

Fonts are stored in MongoDB with the following schema:

```typescript
interface AvailableFont {
  _id?: string;
  name: string;                    // Display name (e.g., "Inter", "AS Roma", "Aquatic")
  fontFamily: string;              // CSS font-family value (e.g., '"Inter", sans-serif')
  category: 'google' | 'custom' | 'system';
  isActive: boolean;               // Whether font is available for selection
  displayOrder: number;            // Order in dropdown (lower = first)
  description?: string;
  fontFile?: string;               // Path to font file for custom fonts
  createdAt: string;
  updatedAt: string;
}
```

### API Endpoints

- **GET** `/api/available-fonts` - Fetch all active fonts
- **POST** `/api/available-fonts` - Create new font
- **PUT** `/api/available-fonts?id=...` - Update existing font
- **DELETE** `/api/available-fonts?id=...` - Delete/deactivate font

### React Hook: `useAvailableFonts()`

```typescript
const { fonts, loading, error, refetch } = useAvailableFonts();
```

Fetches fonts from API and provides loading/error states.

## Initial Setup

### 1. Seed Initial Fonts

Run the migration script to populate the database with default fonts:

```bash
npx tsx scripts/seed-available-fonts.ts
```

This will create:
- Inter (Google Font)
- Roboto (Google Font)
- Poppins (Google Font)
- Montserrat (Google Font)
- AS Roma (Custom Font)
- Aquatic (Custom Font)
- System Default (System Font)

### 2. Add Custom Font Files

For custom fonts (AS Roma, Aquatic), ensure font files are in `/public/fonts/`:
- `/public/fonts/ASRoma-Regular.woff`
- `/public/fonts/Aquatic-Regular.woff`

Font declarations are in `app/globals.css`:

```css
@font-face {
  font-family: 'AS Roma';
  src: url('/fonts/ASRoma-Regular.woff') format('woff');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}
```

## Adding New Fonts

### Method 1: Via API (Recommended)

```bash
curl -X POST http://localhost:3000/api/available-fonts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Font",
    "fontFamily": "\"New Font\", sans-serif",
    "category": "custom",
    "isActive": true,
    "displayOrder": 8,
    "description": "Custom font description",
    "fontFile": "/fonts/NewFont-Regular.woff"
  }'
```

### Method 2: Direct MongoDB Insert

```javascript
db.available_fonts.insertOne({
  name: "New Font",
  fontFamily: '"New Font", sans-serif',
  category: "custom",
  isActive: true,
  displayOrder: 8,
  description: "Custom font description",
  fontFile: "/fonts/NewFont-Regular.woff",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});
```

### Method 3: Update Seed Script

Add to `lib/fontTypes.ts` `DEFAULT_FONTS` array, then re-run seed script with `--force`.

## Usage in Components

### Style Editor

The Style Editor automatically fetches fonts from the database:

```tsx
const { fonts: availableFonts, loading: fontsLoading } = useAvailableFonts();

<select disabled={fontsLoading}>
  {availableFonts.map(font => (
    <option key={font._id} value={font.name}>{font.name}</option>
  ))}
</select>
```

### Admin Design Page

Global typography selection uses the same dynamic font list.

### Layout (Server-Side)

`app/layout.tsx` fetches fonts from MongoDB during SSR to build the font map:

```typescript
const fonts = await db.collection('available_fonts')
  .find({ isActive: true })
  .sort({ displayOrder: 1 })
  .toArray();
```

## Font Categories

### Google Fonts
- **Category:** `google`
- **fontFamily:** Uses CSS variable (e.g., `var(--font-inter)`)
- **Note:** Must be loaded via `next/font/google` in `app/layout.tsx`

### Custom Fonts
- **Category:** `custom`
- **fontFamily:** Quoted name (e.g., `"AS Roma", sans-serif`)
- **fontFile:** Path to `.woff` file in `/public/fonts/`
- **Note:** Requires `@font-face` declaration in `app/globals.css`

### System Fonts
- **Category:** `system`
- **fontFamily:** System font stack (e.g., `system-ui`)
- **Note:** No font file needed

## Benefits

✅ **Zero Hardcoding** - All fonts managed in database  
✅ **Dynamic Updates** - Add/remove fonts without code changes  
✅ **Single Source of Truth** - MongoDB is authoritative  
✅ **Maintainable** - No scattered font lists across codebase  
✅ **Extensible** - Easy to add new fonts via API or database  

## Migration Notes

- Old hardcoded font lists have been removed
- All components now use `useAvailableFonts()` hook
- API validation uses dynamic font list from database
- Fallback to `DEFAULT_FONTS` if database is empty

## Files Changed

- ✅ `lib/fontTypes.ts` - Type definitions and defaults
- ✅ `app/api/available-fonts/route.ts` - CRUD API
- ✅ `hooks/useAvailableFonts.ts` - React hook
- ✅ `lib/fontUtils.ts` - Utility functions
- ✅ `app/admin/styles/[id]/page.tsx` - Style Editor (dynamic font list)
- ✅ `app/admin/design/page.tsx` - Admin Design (dynamic font list)
- ✅ `app/api/admin/ui-settings/route.ts` - Dynamic validation
- ✅ `app/layout.tsx` - Dynamic font mapping
- ✅ `components/StylePreview.tsx` - Updated font mapping
- ✅ `scripts/seed-available-fonts.ts` - Migration script

---

*Font Management System Documentation*  
*Version 1.0.0 | 2026-01-02*

