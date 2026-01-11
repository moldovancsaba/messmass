# SINGLE REFERENCE SYSTEM - Quick Reference
Status: Archived
Last Updated: 2026-01-11T22:45:21.000Z
Canonical: No
Owner: Architecture

**Version:** 7.0.2 | **Status:** ✅ Production Ready

---

## The One Rule

```
Database field name = Chart token = Everything
```

**Example:**
- DB: `female` → Chart: `[female]` → Code: `stats.female`
- DB: `remoteFans` → Chart: `[remoteFans]` → Code: `stats.remoteFans`

---

## Adding A New Variable

1. Add to database: `stats.newField = 123`
2. Use in chart: `[newField]`
3. **Done!** (No registration, no mapping, no code changes)

---

## Renaming A Variable

1. Update database: `female` → `Woman`
2. Update charts: `[female]` → `[Woman]`
3. **Done!** (System auto-resolves `stats.Woman`)

---

## Current Variables (Key Ones)

| Field Name | Token | Type | Description |
|------------|-------|------|-------------|
| `remoteFans` | `[remoteFans]` | number | Fans engaging remotely |
| `stadium` | `[stadium]` | number | On-site fans at venue |
| `totalFans` | `[totalFans]` | computed | remoteFans + stadium |
| `female` | `[female]` | number | Female fans |
| `male` | `[male]` | number | Male fans |
| `merched` | `[merched]` | number | Fans with merchandise |
| `eventAttendees` | `[eventAttendees]` | number | Total event attendees |
| `allImages` | `[allImages]` | computed | Total images taken |

---

## Computed Fields

These don't exist in DB but are calculated on-the-fly:

- `totalFans` = `remoteFans + stadium`
- `allImages` = `remoteImages + hostessImages + selfies`
- `totalUnder40` = `genAlpha + genYZ`
- `totalOver40` = `genX + boomer`

---

## Helper Commands

```bash
# Check migration status
npm run migrate:remoteFans
npm run migrate:chart-formulas

# Run dev server
npm run dev

# Build production
npm run build
```

---

## Files To Know

| File | Purpose |
|------|---------|
| `lib/formulaEngine.ts` | Formula evaluation (direct field access) |
| `lib/variableRefs.ts` | Token generation (1 line!) |
| `lib/variablesRegistry.ts` | Variable definitions |
| `components/StatsCharts.tsx` | Chart components (transparent helpers) |

---

## Backward Compatibility

System automatically handles:
- ✅ New schema (`remoteFans`)
- ✅ Legacy schema (`indoor + outdoor`)
- ✅ Mixed data during migration

**Result:** Zero breakage, works with any data!

---

## Documentation

- **Complete Guide**: [SINGLE_REFERENCE_SYSTEM.md](./SINGLE_REFERENCE_SYSTEM.md)
- **Implementation Summary**: [IMPLEMENTATION_COMPLETE.md](./IMPLEMENTATION_COMPLETE.md)
- **Project Guide**: [WARP.md](../../../../WARP.md)

---

**Questions?** Everything is documented in `SINGLE_REFERENCE_SYSTEM.md`

🎉 **The system is complete and production-ready!**
