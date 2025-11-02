# Orphaned Style References Report

**Generated:** 2025-11-02T19:45:22.907Z  
**Mode:** Live Execution

## Summary

- **Total Existing Styles:** 0
- **Projects with styleIdEnhanced:** 17
- **Orphaned References Found:** 17
- **Status:** ✅ Issues Fixed

## Overview

This report identifies projects that reference deleted or non-existent `styleIdEnhanced` values.

When a project has an orphaned style reference:
- The application falls back to the global default style
- No visual breakage occurs, but the intended custom styling is lost
- Setting `styleIdEnhanced: null` makes the fallback behavior explicit

## Affected Projects


### 1. ⚽ Hungary x Sweden

- **Project ID:** `68ac42658c6bcf1a4e104aae`
- **Orphaned Style ID:** `68c9b7e33843948981b3f986`
- **Action Taken:** Set styleIdEnhanced to null
- **Result:** Now explicitly uses default style


### 2. 🏀 Hungary x Finland

- **Project ID:** `68ad8782afcfe0b38d8ed332`
- **Orphaned Style ID:** `68c9b7e33843948981b3f986`
- **Action Taken:** Set styleIdEnhanced to null
- **Result:** Now explicitly uses default style


### 3. ⚽ Hungary x Portugal

- **Project ID:** `68b01f835eb842d4f6c9fd1f`
- **Orphaned Style ID:** `68c9b7e33843948981b3f986`
- **Action Taken:** Set styleIdEnhanced to null
- **Result:** Now explicitly uses default style


### 4. FIBA 3x3 Women's Series - Day 2 @Debrecen - 2025-08-30

- **Project ID:** `68b0b3217cb40eb4efe43df4`
- **Orphaned Style ID:** `68bb26e4cf07685efe74ae18`
- **Action Taken:** Set styleIdEnhanced to null
- **Result:** Now explicitly uses default style


### 5. FIBA 3x3 World Tour - Day 1 @Debrecen - 2025-08-29

- **Project ID:** `68b0b3837cb40eb4efe43df5`
- **Orphaned Style ID:** `68bb26e4cf07685efe74ae18`
- **Action Taken:** Set styleIdEnhanced to null
- **Result:** Now explicitly uses default style


### 6. 🏒 KalPa Kuopio x Red Bull Salzburg

- **Project ID:** `68bbd5361fc6df8bb9066186`
- **Orphaned Style ID:** `68c9b7e33843948981b3f986`
- **Action Taken:** Set styleIdEnhanced to null
- **Result:** Now explicitly uses default style


### 7. [🏒] 🔴 Lausanne HC x Mountfield HK ⚪

- **Project ID:** `68ee4aa85f04158e33236474`
- **Orphaned Style ID:** `68fa2c861d5fdc1dc6e7e8b3`
- **Action Taken:** Set styleIdEnhanced to null
- **Result:** Now explicitly uses default style


### 8. 🤾 Orlen Wisla Plock x Paris Saint-Germain

- **Project ID:** `68ef4ba8370adfaf1dac15cc`
- **Orphaned Style ID:** `68fa2c861d5fdc1dc6e7e8b3`
- **Action Taken:** Set styleIdEnhanced to null
- **Result:** Now explicitly uses default style


### 9. 🤾 OTP Bank - PICK Szeged x SC Magdeburg

- **Project ID:** `68ef4bf0370adfaf1dac15ce`
- **Orphaned Style ID:** `68fa2c861d5fdc1dc6e7e8b3`
- **Action Taken:** Set styleIdEnhanced to null
- **Result:** Now explicitly uses default style


### 10. ⚽ Újpest FC x Ferencvárosi TC

- **Project ID:** `68f257753c7621720a9bdb10`
- **Orphaned Style ID:** `68fa2c861d5fdc1dc6e7e8b3`
- **Action Taken:** Set styleIdEnhanced to null
- **Result:** Now explicitly uses default style


### 11. ⚽ MTK x Nyíregyháza FC

- **Project ID:** `68f2579c3c7621720a9bdb12`
- **Orphaned Style ID:** `68fa2c861d5fdc1dc6e7e8b3`
- **Action Taken:** Set styleIdEnhanced to null
- **Result:** Now explicitly uses default style


### 12. HC Zagreb x GOG Håndbold

- **Project ID:** `68f545e49cc603657f751c00`
- **Orphaned Style ID:** `68fa2c861d5fdc1dc6e7e8b3`
- **Action Taken:** Set styleIdEnhanced to null
- **Result:** Now explicitly uses default style


### 13. HC Zagreb x OTP Bank - PICK Szeged

- **Project ID:** `68f8b7c96a3ac49f87d02d1f`
- **Orphaned Style ID:** `68fa2c861d5fdc1dc6e7e8b3`
- **Action Taken:** Set styleIdEnhanced to null
- **Result:** Now explicitly uses default style


### 14. CS Dinamo București x Industria Kielce

- **Project ID:** `68f8b7ee6a3ac49f87d02d21`
- **Orphaned Style ID:** `68fa2c861d5fdc1dc6e7e8b3`
- **Action Taken:** Set styleIdEnhanced to null
- **Result:** Now explicitly uses default style


### 15. One Veszprém HC x Füchse Berlin

- **Project ID:** `68f8b8086a3ac49f87d02d23`
- **Orphaned Style ID:** `68fa2c861d5fdc1dc6e7e8b3`
- **Action Taken:** Set styleIdEnhanced to null
- **Result:** Now explicitly uses default style


### 16. Orlen Wisla Plock x Barça

- **Project ID:** `68f8b821ea10e29ce9651ecb`
- **Orphaned Style ID:** `68fa2c861d5fdc1dc6e7e8b3`
- **Action Taken:** Set styleIdEnhanced to null
- **Result:** Now explicitly uses default style


### 17. DVTK x Paksi FC

- **Project ID:** `68faf7acd4767f8a6d45aa29`
- **Orphaned Style ID:** `68fa2c861d5fdc1dc6e7e8b3`
- **Action Taken:** Set styleIdEnhanced to null
- **Result:** Now explicitly uses default style


## Technical Details

### Database Changes (Applied)

```javascript
// MongoDB update operation
db.projects.updateMany(
  { _id: { $in: [ObjectId("68ac42658c6bcf1a4e104aae"), ObjectId("68ad8782afcfe0b38d8ed332"), ObjectId("68b01f835eb842d4f6c9fd1f"), ObjectId("68b0b3217cb40eb4efe43df4"), ObjectId("68b0b3837cb40eb4efe43df5"), ObjectId("68bbd5361fc6df8bb9066186"), ObjectId("68ee4aa85f04158e33236474"), ObjectId("68ef4ba8370adfaf1dac15cc"), ObjectId("68ef4bf0370adfaf1dac15ce"), ObjectId("68f257753c7621720a9bdb10"), ObjectId("68f2579c3c7621720a9bdb12"), ObjectId("68f545e49cc603657f751c00"), ObjectId("68f8b7c96a3ac49f87d02d1f"), ObjectId("68f8b7ee6a3ac49f87d02d21"), ObjectId("68f8b8086a3ac49f87d02d23"), ObjectId("68f8b821ea10e29ce9651ecb"), ObjectId("68faf7acd4767f8a6d45aa29")] } },
  { 
    $set: { styleIdEnhanced: null },
    $currentDate: { updatedAt: true }
  }
)
```

### Style Fallback Behavior

When `styleIdEnhanced` is `null`:
1. Application checks for project-specific style (none found)
2. Falls back to global default style from `styles` collection
3. Rendering continues without errors
4. User may notice different visual styling from original

## Recommendations


1. **Review Affected Projects:** Verify that default styling is acceptable for these events
2. **Reapply Custom Styles (if needed):** Use the Admin UI to assign new custom styles
3. **Style Cleanup:** Consider removing unused styles from the database
4. **Prevent Future Orphaning:** Before deleting a style, reassign all projects using it


## Prevention Strategy

To avoid orphaned references in the future:

1. **Before deleting a style:**
   - Query for projects using the style: `db.projects.find({ styleIdEnhanced: styleId })`
   - Reassign those projects to a different style or set to `null`

2. **Add referential integrity:**
   - Consider adding a pre-delete hook in the Admin UI
   - Warn admins when attempting to delete a style that's in use

3. **Regular audits:**
   - Run this script periodically (monthly) to catch orphaned references early
   - Add to maintenance checklist

---

*Generated by: `scripts/fixOrphanedStyleReferences.ts`*  
*Database: messmass*  
*Timestamp: 2025-11-02T19:45:22.907Z*
