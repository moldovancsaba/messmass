# MessMass Naming Conventions
Status: Active
Last Updated: 2026-01-11T22:28:38.000Z
Canonical: No
Owner: Architecture

**Last Updated: 2026-01-11T22:28:38.000Z
**Status:** ✅ VERIFIED & ENFORCED

**This document consolidates:**
- DATABASE_FIELD_NAMING.md
- MONGODB_FIELD_NAMING_VERIFICATION.md
- VARIABLE_NAMING_GUIDE.md

---

## 🎯 Quick Reference

| Context | Convention | Example |
|---------|-----------|---------|
| **MongoDB Fields** | camelCase | `createdAt`, `categorizedHashtags` |
| **TypeScript/JavaScript** | camelCase | `const userName = project.eventName` |
| **CSS Classes** | kebab-case | `.form-group`, `.button-primary` |
| **React Components** | PascalCase | `FormModal`, `ColoredCard` |
| **Constants** | UPPER_SNAKE_CASE | `DEFAULT_LIMIT`, `MAX_RETRIES` |
| **Role Names** | lowercase single word | `'superadmin'`, `'admin'` |

---

## 1. MongoDB Field Naming

### ✅ VERIFIED STANDARD: camelCase

**CRITICAL:** MessMass MongoDB uses **camelCase** for ALL fields, NOT snake_case.

```javascript
// ✅ CORRECT: Actual MongoDB schema (verified from backup)
{
  _id: ObjectId("..."),
  createdAt: ISODate("2025-12-25T10:00:00.000Z"),
  updatedAt: ISODate("2025-12-25T10:15:00.000Z"),
  categorizedHashtags: {
    "country": ["USA", "Canada"],
    "period": ["2024-2025"]
  },
  viewSlug: "project-view-uuid-abc123",
  editSlug: "project-edit-uuid-def456",
  reportTemplateId: ObjectId("..."),
  styleIdEnhanced: ObjectId("..."),
  partner1Id: ObjectId("..."),
  partner2Id: ObjectId("...")
}

// ❌ WRONG: These fields do NOT exist
{
  created_at: "...",           // ❌ Not in database
  categorized_hashtags: {...}, // ❌ Not in database
  view_slug: "...",            // ❌ Not in database
  report_template_id: "...",   // ❌ Not in database
}
```

### Why camelCase?

**Advantages:**
1. **Zero Transformation:** MongoDB documents → JavaScript objects (no conversion needed)
2. **TypeScript-Friendly:** Interfaces match database exactly
3. **Consistency:** Same naming everywhere (DB, code, DTOs)
4. **Performance:** No adapter overhead for field name conversion

**Industry Precedent:**
- Meteor framework uses camelCase in MongoDB
- Parse platform uses camelCase in MongoDB
- Many Node.js applications use camelCase when MongoDB is primary database

### Code Access Pattern

```typescript
// ✅ CORRECT: Direct access (matches MongoDB)
const project = await collection.findOne({ _id: projectId });
const created = project.createdAt;           // Direct access
const hashtags = project.categorizedHashtags; // No transformation
const slug = project.viewSlug;                // Zero overhead

// ❌ WRONG: Snake case access (fields don't exist)
const created = project.created_at;           // undefined!
const hashtags = project.categorized_hashtags; // undefined!
```

### TypeScript Interfaces

```typescript
// ✅ CORRECT: Matches MongoDB exactly
interface Project {
  _id: ObjectId;
  eventName: string;
  eventDate: string;
  createdAt: string;
  updatedAt: string;
  categorizedHashtags?: Record<string, string[]>;
  viewSlug: string;
  editSlug: string;
  reportTemplateId?: ObjectId;
  partner1Id?: ObjectId;
  partner2Id?: ObjectId;
  stats: ProjectStats;
}

// TypeScript interfaces map 1:1 with MongoDB fields
// No adapter or transformation layer needed
```

---

## 2. Role Naming

### ✅ ENFORCED STANDARD: Single Word, Lowercase

**CRITICAL FIX:** All role naming inconsistencies were fixed on 2025-12-25 (22 files updated).

```typescript
// ✅ CORRECT: Current standard
type Role = 'guest' | 'user' | 'admin' | 'superadmin' | 'api';
//                                      ^^^^^^^^^^^ Single word, no separators

// ❌ WRONG: Old formats (DEPRECATED, do not use)
type OldRole = 'super-admin' | 'super_admin'; // Fixed on 2025-12-25
```

### Role Check Examples

```typescript
// ✅ CORRECT
if (user.role === 'superadmin') {
  // Grant full access
}

if (user.role === 'admin' || user.role === 'superadmin') {
  // Grant admin access
}

// ❌ WRONG (will fail)
if (user.role === 'super-admin') {  // Won't match!
if (user.role === 'super_admin') {  // Won't match!
```

### Migration Note

**All system components updated:**
- ✅ API routes (4 files)
- ✅ Auth library (4 files)
- ✅ Creation scripts (2 files)
- ✅ Middleware
- ✅ Type definitions

**See:** `NAMING_CONSISTENCY_FULL_AUDIT.md` for complete audit report.

---

## 3. JavaScript/TypeScript Naming

### Variables & Functions

```typescript
// ✅ CORRECT: camelCase for variables and functions
const userName = 'John Doe';
const totalCount = 42;
let isActive = true;

function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

const fetchUserData = async (userId: string) => {
  // ...
};
```

### Constants

```typescript
// ✅ CORRECT: UPPER_SNAKE_CASE for true constants
const DEFAULT_LIMIT = 20;
const MAX_RETRIES = 3;
const API_BASE_URL = 'https://api.example.com';

// ✅ CORRECT: camelCase for config objects
const apiConfig = {
  baseUrl: 'https://api.example.com',
  timeout: 5000,
  retries: 3
};
```

### React Components

```typescript
// ✅ CORRECT: PascalCase for components
function FormModal({ isOpen, onClose }: FormModalProps) {
  return <div>{/* ... */}</div>;
}

const ColoredCard: React.FC<ColoredCardProps> = ({ children }) => {
  return <div>{children}</div>;
};

export default UserProfile;
```

### Custom Hooks

```typescript
// ✅ CORRECT: camelCase starting with 'use'
function useHashtags() {
  // ...
}

const useReportData = (projectId: string) => {
  // ...
};
```

---

## 4. CSS Naming

### Class Names

```css
/* ✅ CORRECT: kebab-case for class names */
.form-group {
  margin-bottom: 1rem;
}

.button-primary {
  background: var(--mm-primary);
}

.modal-header {
  padding: var(--mm-space-4);
}

.card-container {
  border-radius: var(--mm-radius-lg);
}
```

### CSS Variables (Design Tokens)

```css
/* ✅ CORRECT: kebab-case with prefix */
:root {
  --mm-gray-900: #1f2937;
  --mm-primary: #3b82f6;
  --mm-space-4: 1rem;
  --mm-font-size-sm: 0.875rem;
  --mm-radius-lg: 0.5rem;
  --transition-fast: 150ms ease-in-out;
}
```

### CSS Modules

```typescript
// ✅ CORRECT: camelCase for imported styles
import styles from './FormModal.module.css';

<div className={styles.modalHeader}>
  <div className={styles.closeButton}>×</div>
</div>
```

---

## 5. File Naming

### Components

```
✅ CORRECT:
FormModal.tsx
ColoredCard.tsx
UnifiedHashtagInput.tsx

❌ WRONG:
form-modal.tsx
formModal.tsx
form_modal.tsx
```

### Utilities & Helpers

```
✅ CORRECT:
hashtagCategoryUtils.ts
slugUtils.ts
dataValidator.ts

❌ WRONG:
HashtagCategoryUtils.ts
hashtag_category_utils.ts
```

### CSS Modules

```
✅ CORRECT:
FormModal.module.css
ColoredCard.module.css

❌ WRONG:
formModal.module.css
form-modal.module.css
```

---

## 6. API Routes & Endpoints

### Route Files

```
✅ CORRECT:
app/api/projects/route.ts
app/api/hashtags/[hashtag]/route.ts
app/api/admin/projects/[id]/route.ts

(Next.js convention: route.ts)
```

### Endpoint Naming

```typescript
// ✅ CORRECT: RESTful, kebab-case in URLs
GET  /api/projects
POST /api/projects
GET  /api/hashtags/filter-by-slug/[slug]
GET  /api/chart-config/public

// ✅ CORRECT: camelCase in query params
GET  /api/projects?sortField=eventName&sortOrder=asc

// ❌ WRONG: Inconsistent casing
GET  /api/Projects
GET  /api/hashtags/FilterBySlug
```

---

## 7. Variables System (KYC)

### Database Field Names

```javascript
// ✅ CORRECT: camelCase in MongoDB
{
  stats: {
    remoteImages: 150,
    hostessImages: 75,
    selfies: 50,
    totalFans: 2500,
    eventAttendees: 3000,
    categorizedHashtags: {...}
  }
}
```

### Variable Names in Code

```typescript
// ✅ CORRECT: camelCase matching database
const remoteImages = project.stats.remoteImages;
const hostessImages = project.stats.hostessImages;
const totalFans = project.stats.totalFans;

// ✅ CORRECT: Variable metadata
interface VariableMetadata {
  name: string;          // Database field name (camelCase)
  alias: string;         // UI display label
  type: 'number' | 'text' | 'derived';
  category: string;
  visibleInClicker: boolean;
  editableInManual: boolean;
}
```

### SEYU Reference Tokens

```javascript
// ✅ CORRECT: UPPERCASE with organization prefix
"[SEYUTOTALIMAGES]"      // remoteImages + hostessImages + selfies
"[SEYUTOTALFANS]"        // remoteFans + stadium
"[SEYUMERCHEDFANS]"      // merched fans count
"[SEYUATTENDEES]"        // eventAttendees

// Used in chart formulas:
"formula": "([SEYUMERCHEDFANS] / [SEYUTOTALFANS]) * 100"
```

---

## 8. Common Patterns

### Project/Event Fields

```typescript
// ✅ Standard project fields (camelCase)
interface Project {
  eventName: string;
  eventDate: string;
  createdAt: string;
  updatedAt: string;
  viewSlug: string;
  editSlug: string;
  hashtags?: string[];
  categorizedHashtags?: Record<string, string[]>;
}
```

### Partner Fields

```typescript
// ✅ Standard partner fields (camelCase)
interface Partner {
  name: string;
  emoji: string;
  logoUrl?: string;
  createdAt: string;
  updatedAt: string;
  viewSlug: string;
  editSlug: string;
  categorizedHashtags?: Record<string, string[]>;
  bitlyLinkIds?: ObjectId[];
}
```

---

## 9. Verification & Enforcement

### Pre-Commit Checks

```bash
# Check for snake_case in code (should return nothing)
grep -r "project\.created_at" app/ lib/ components/
grep -r "project\.categorized_hashtags" app/ lib/ components/
grep -r "project\.view_slug" app/ lib/ components/

# Expected: No matches (all use camelCase)
```

### ESLint Rules

```javascript
// Enforce naming conventions
{
  "rules": {
    "@typescript-eslint/naming-convention": [
      "error",
      {
        "selector": "variable",
        "format": ["camelCase", "UPPER_CASE"]
      },
      {
        "selector": "function",
        "format": ["camelCase", "PascalCase"]
      },
      {
        "selector": "typeLike",
        "format": ["PascalCase"]
      }
    ]
  }
}
```

---

## 10. Migration Guide

### If You Find Inconsistencies

**DO NOT change the MongoDB field names!** The database uses camelCase and changing it would require massive migration.

**Instead:**
1. Update code to use camelCase (match database)
2. Update TypeScript interfaces
3. Remove any adapter layers converting snake_case

### Common Mistakes

```typescript
// ❌ WRONG: Creating adapters for no reason
function projectFromDB(doc: any) {
  return {
    createdAt: doc.created_at  // Field doesn't exist!
  };
}

// ✅ CORRECT: Direct access (no adapter needed)
const project = await collection.findOne({...});
console.log(project.createdAt); // Already camelCase!
```

---

## References

- **Verification Report:** `MONGODB_FIELD_NAMING_VERIFICATION.md`
- **Role Naming Audit:** `NAMING_CONSISTENCY_FULL_AUDIT.md`
- **Code Standards:** `CODING_STANDARDS.md`
- **Architecture:** `ARCHITECTURE.md`

---

**Last Verified:** 2025-12-25 (MongoDB backup analysis)  
**Status:** ✅ All conventions enforced system-wide  
**Maintenance:** Review quarterly, update as needed
