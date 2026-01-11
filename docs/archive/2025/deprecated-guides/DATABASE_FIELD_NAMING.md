# Database Field Naming - Definitive Answer
Status: Archived
Last Updated: 2026-01-11T22:28:38.000Z
Canonical: No
Owner: Architecture

**Question**: What is the variable name for "female" in the database?

**Answer**: `female` (lowercase)

---

## ✅ Verification from Production Database

**Date**: 2025-01-27  
**Project Inspected**: ⚽ MTK x ETO FC Győr

### Actual Database Field Names in `stats` Object:

```
- allImages          ✅ lowercase camelCase
- approvedImages     ✅ lowercase camelCase
- baseballCap        ✅ lowercase camelCase
- boomer             ✅ lowercase
- eventAttendees     ✅ lowercase camelCase
- eventResultHome    ✅ lowercase camelCase
- eventResultVisitor ✅ lowercase camelCase
- female             ✅ lowercase  ← ANSWER
- flags              ✅ lowercase
- genAlpha           ✅ lowercase camelCase
- genX               ✅ lowercase camelCase
- genYZ              ✅ lowercase camelCase
- hostessImages      ✅ lowercase camelCase
- indoor             ✅ lowercase
- jersey             ✅ lowercase
- male               ✅ lowercase
- merched            ✅ lowercase
- other              ✅ lowercase
- outdoor            ✅ lowercase
- rejectedImages     ✅ lowercase camelCase
- remoteFans         ✅ lowercase camelCase
- remoteImages       ✅ lowercase camelCase
- scarf              ✅ lowercase
- selfies            ✅ lowercase
- stadium            ✅ lowercase
- totalFans          ✅ lowercase camelCase
- visitFacebook      ✅ lowercase camelCase
- visitInstagram     ✅ lowercase camelCase
- visitTiktok        ✅ lowercase camelCase
- visitTrustpilot    ✅ lowercase camelCase
- visitX             ✅ lowercase camelCase
- visitYoutube       ✅ lowercase camelCase
```

### Specific Values Checked:
```
stats.female = 4           ✅ EXISTS (lowercase)
stats.male = 72            ✅ EXISTS (lowercase)
stats.Woman = undefined    ❌ DOES NOT EXIST
stats.Man = undefined      ❌ DOES NOT EXIST
stats.FEMALE = undefined   ❌ DOES NOT EXIST
```

---

## 🎯 The Three Representations

For the female attendees metric, you will see:

### 1. **In the Database** (MongoDB)
```json
{
  "stats": {
    "female": 4
  }
}
```
**Field name**: `female` (lowercase)

### 2. **In Chart Formulas**
```typescript
formula: '[female]'
formula: '[female] / ([female] + [male]) * 100'
```
**Token**: `[female]` (lowercase in brackets)

### 3. **In the UI/Clicker** (Admin Variables System)
```typescript
{
  name: 'female',
  label: 'Female Attendees',
  displayName: 'Female Attendees'
}
```
**Variable name**: `female` (lowercase)  
**Display label**: "Female Attendees" (Title Case)

---

## 🔄 Single Reference System

**The rule is simple:**

```
Database field name = Chart token = Variable name = Everything
```

| Use Case | Format | Example |
|----------|--------|---------|
| MongoDB query | `stats.female` | `{ "stats.female": { $gt: 0 } }` |
| Chart formula | `[female]` | `[female] / ([female] + [male])` |
| TypeScript code | `stats.female` | `const count = project.stats.female` |
| API endpoint | `stats: { female: 4 }` | POST/PUT with lowercase field |
| Clicker button | `incrementStat('female')` | Lowercase field name |

---

## ❌ What Does NOT Exist

The database does **NOT** have:
- `stats.Woman` (capital W)
- `stats.FEMALE` (all caps)
- `stats.Female` (capital F)
- `stats.female_count` (snake_case)

**Only `stats.female` (lowercase) exists.**

---

## 🧪 How to Verify Yourself

Run this command to check any field name:

```bash
npx tsx -r dotenv/config scripts/checkDatabaseFields.ts dotenv_config_path=.env.local
```

This will show:
1. All field names in the database
2. Specific field values
3. Confirmation that `female` is lowercase

---

## 📝 Summary

**Database field name for female attendees**: `female` (lowercase)

This is consistent everywhere in the system:
- ✅ MongoDB database stores `stats.female`
- ✅ Chart formulas use `[female]`
- ✅ Clicker uses `female` as the key
- ✅ API endpoints send/receive `female`
- ✅ TypeScript types define `female: number`

**No translation. No mapping. Just `female`.**

---

_Last verified: 2025-01-27 via production MongoDB database_
