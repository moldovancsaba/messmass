# MessMass Project Summary for Kiro

**Version:** 11.25.0  
**Last Updated:** 2025-11-26  
**Project Type:** Enterprise Event Analytics Platform

---

## Project Overview

MessMass is an enterprise-grade event statistics platform built with Next.js 15, TypeScript, and MongoDB Atlas. It provides real-time analytics, partner management, and intelligent link tracking for sports organizations, venues, brands, and event managers.

**Tech Stack:**
- **Frontend:** Next.js 15.4.6 (App Router), React 18, TypeScript (strict mode)
- **Backend:** Next.js API routes, MongoDB Atlas, WebSocket server (Node.js on port 7654)
- **Styling:** CSS Modules with centralized design tokens (`app/styles/theme.css`)
- **Real-Time:** WebSocket-based collaboration with automatic reconnection

---

## Core Features

### 1. Event Management (Projects)
- CRUD operations for events with 96+ tracked variables
- Real-time clicker interface for stat tracking
- Public stats pages with password protection
- CSV export and partner associations
- Server-side search, sort, and pagination

### 2. Partners Management
- Organizations (clubs, federations, venues, brands)
- Sports Match Builder for rapid event creation
- Partner report pages with shareable URLs
- Automatic hashtag and Bitly link inheritance

### 3. Bitly Integration
- Many-to-many link-to-event associations
- Automatic analytics sync (clicks, geography, referrers, devices)
- Smart date range attribution for multi-event campaigns
- Cached metrics for performance

### 4. Hashtag System
- Traditional hashtags + categorized hashtags (`category:value`)
- Visual category indicators with custom colors
- Advanced filtering across all events
- Public filter pages with aggregated stats

### 5. Variables & Metrics (v7.0.0 - Database-First)
- 96 system variables + custom user variables
- Single Reference System (`stats.` prefix)
- Clicker visibility and manual edit flags
- Variable groups for organized UI

### 6. Analytics & Charts
- 5 chart types: PIE, BAR, KPI, TEXT, IMAGE
- Formula-based calculations with variable references
- Aspect ratio support for images (16:9, 9:16, 1:1)
- Material Icons v10.4.0 integration
- PDF export with html2canvas

### 7. User Management & API Access
- Admin users (dashboard access)
- API users (programmatic access with Bearer tokens)
- Public API endpoints for partners and events
- Rate limiting (1000 req/min)

---

## Critical Architecture Patterns

### Centralized Module Management

**MANDATORY RULE:** Search existing implementations before creating anything new.

**Reference Components:**
- **Modals:** `components/modals/FormModal.tsx` (ONLY modal component allowed)
- **Cards:** `components/ColoredCard.tsx` (ONLY card component allowed)
- **Forms:** Standard classes (`.form-input`, `.form-label-block`)
- **Hashtags:** `components/UnifiedHashtagInput.tsx`
- **Partners:** `components/PartnerSelector.tsx`
- **Admin Layout:** `components/AdminHero.tsx`

**Complete Inventory:** See `REUSABLE_COMPONENTS_INVENTORY.md` (210+ modules)

### Design Token System

**ALL styling MUST use CSS variables from `app/styles/theme.css`**

```css
/* ✅ CORRECT */
.component {
  color: var(--mm-gray-900);
  padding: var(--mm-space-4);
  border-radius: var(--mm-radius-lg);
}

/* ❌ FORBIDDEN */
.bad {
  color: #1f2937;      /* ❌ Use var(--mm-gray-900) */
  padding: 16px;       /* ❌ Use var(--mm-space-4) */
}
```

**200+ tokens available:** Colors, spacing, typography, shadows, transitions

### Prohibited Patterns

❌ **NEVER:**
- Use inline `style` prop (except PageStyle gradients from database)
- Create custom modals (use FormModal)
- Create custom cards (use ColoredCard)
- Hardcode colors, spacing, or typography
- Use `.trim()` without documented justification
- Duplicate existing components

### Unified Admin System (v10.1.0+)

**Pattern:** All admin pages use `UnifiedAdminPage` component with adapters

**Features:**
- Card/list view toggle with localStorage persistence
- Server-side search with 300ms debouncing
- Modal CRUD operations
- Responsive design (desktop/tablet/mobile)

**Migrated Pages:** Projects, Partners, Categories, Users

**Adapter Pattern:**
```typescript
// lib/adapters/myAdapter.tsx
export const myAdapter: AdminPageAdapter<MyType> = {
  pageName: 'my-feature',
  defaultView: 'list',
  listConfig: { columns: [...], rowActions: [...] },
  cardConfig: { primaryField: 'name', metaFields: [...] },
  searchFields: ['name', 'description'],
  emptyStateMessage: 'No items found.'
};
```

---

## Database Schema (MongoDB Atlas)

### Key Collections

**projects** - Events with stats
```typescript
{
  _id: ObjectId,
  eventName: string,
  eventDate: string, // ISO 8601
  hashtags: string[],
  categorizedHashtags: { [category]: string[] },
  stats: {
    // ALL 96+ variables stored here
    remoteImages: number,
    remoteFans: number,
    female: number,
    male: number,
    // ... etc
  },
  partner1Id?: ObjectId,
  partner2Id?: ObjectId,
  styleId?: ObjectId,
  viewSlug: string,
  editSlug: string,
  createdAt: string,
  updatedAt: string
}
```

**partners** - Organizations
```typescript
{
  _id: ObjectId,
  name: string,
  emoji: string,
  viewSlug: string, // v10.7.0 for report pages
  hashtags: string[],
  categorizedHashtags: { [category]: string[] },
  bitlyLinkIds: ObjectId[],
  createdAt: string,
  updatedAt: string
}
```

**variables_metadata** - Variable definitions (v7.0.0)
```typescript
{
  _id: ObjectId,
  name: string, // camelCase database field
  alias: string, // UI display label
  type: 'number' | 'text' | 'derived',
  category: string,
  visibleInClicker: boolean,
  editableInManual: boolean,
  isSystemVariable: boolean,
  clickerOrder?: number,
  createdAt: Date,
  updatedAt: Date
}
```

**chart_configurations** - Chart definitions
```typescript
{
  _id: ObjectId,
  chartId: string,
  type: 'pie' | 'bar' | 'kpi' | 'text' | 'image',
  title: string,
  subtitle?: string,
  icon?: string, // Material Icon name (v10.4.0)
  iconVariant?: string, // outlined, filled, etc.
  formula?: string, // e.g., "stats.female + stats.male"
  elements: Array<{
    label: string,
    formula: string,
    formatting?: { prefix, suffix, decimals }
  }>,
  aspectRatio?: '16:9' | '9:16' | '1:1', // IMAGE charts
  createdAt: string,
  updatedAt: string
}
```

**users** - Admin and API users
```typescript
{
  _id: ObjectId,
  email: string,
  name: string,
  password: string, // bcrypt hashed
  role: 'admin' | 'api',
  apiAccessEnabled: boolean,
  apiUsageCount: number,
  lastApiCall?: Date,
  createdAt: Date,
  updatedAt: Date
}
```

---

## API Endpoints

### Projects
- `GET /api/projects` - List with search, sort, pagination
- `POST /api/projects` - Create
- `PUT /api/projects` - Update
- `DELETE /api/projects?projectId=X` - Delete

### Partners
- `GET /api/partners` - List with search, sort, pagination
- `POST /api/partners` - Create (auto-generates viewSlug)
- `PUT /api/partners` - Update
- `DELETE /api/partners?partnerId=X` - Delete
- `GET /api/partners/report/[slug]` - Report page data

### Public API (Bearer Token Auth)
- `GET /api/public/partners` - List all partners
- `GET /api/public/partners/{id}` - Get partner by ID
- `GET /api/public/partners/{id}/events` - Partner's events
- `GET /api/public/events/{id}` - Get event by ID

### Variables
- `GET /api/variables-config` - All variables with flags
- `POST /api/variables-config` - Create/update variable
- `DELETE /api/variables-config?name=X` - Delete custom variable

### Charts
- `GET /api/chart-config` - All chart configurations
- `POST /api/chart-config` - Create chart
- `PUT /api/chart-config?chartId=X` - Update chart
- `DELETE /api/chart-config?chartId=X` - Delete chart

---

## Development Workflow

### Before Starting Any Task

1. **Search existing implementations:**
   ```bash
   grep -r "FormModal\|ColoredCard\|UnifiedHashtagInput" components/
   cat REUSABLE_COMPONENTS_INVENTORY.md
   ```

2. **Check design tokens:**
   ```bash
   grep "--mm-" app/styles/theme.css
   ```

3. **Verify no hardcoded values:**
   ```bash
   grep -r "#[0-9a-f]\{6\}" --include="*.css" components/
   grep -r "[3-9][0-9]*px" --include="*.css" components/
   ```

### Development Commands

```bash
# Start development
npm run dev              # Next.js on :3000
cd server && npm start   # WebSocket on :7654

# Build and validate
npm run build           # Production build
npm run type-check      # TypeScript validation
npm run lint            # ESLint validation

# Database operations
npm run seed:variables  # Seed variables_metadata collection
```

### Version Management

**MANDATORY:** Increment version before every commit
- **PATCH:** Bug fixes (11.25.0 → 11.25.1)
- **MINOR:** New features (11.25.0 → 11.26.0)
- **MAJOR:** Breaking changes (11.25.0 → 12.0.0)

**Update in:**
- `package.json`
- `VERSION.md`
- All documentation files (ARCHITECTURE.md, TASKLIST.md, etc.)

---

## Code Quality Standards

### Comments (MANDATORY)

**All code MUST include:**
- **WHAT:** What the code does
- **WHY:** Why this approach was chosen
- **Strategic comments:** Explain architectural decisions

```typescript
// WHAT: Fetch partner data with populated Bitly links
// WHY: Avoid N+1 queries by using $in operator with Map lookup
const partnerIds = projects.map(p => p.partner1Id).filter(Boolean);
const partners = await db.collection('partners')
  .find({ _id: { $in: partnerIds } })
  .toArray();
```

### TypeScript

- **Strict mode:** Enabled
- **No `any` types:** Use proper interfaces
- **Interfaces over types:** For object shapes
- **Optional chaining:** Use `?.` for nullable fields

### CSS Modules

- **Scoped styles:** Every component has `.module.css` file
- **Design tokens:** 100% token usage required
- **Mobile responsive:** Include `@media` queries
- **No inline styles:** Except PageStyle gradients

### Testing

**MVP Factory Approach:** No test files allowed
- Manual testing only
- Validation through user feedback
- Focus on shipping features fast

---

## Common Patterns

### Modal Pattern (FormModal)

```tsx
import FormModal from '@/components/modals/FormModal';

<FormModal
  isOpen={isOpen}
  onClose={onClose}
  onSubmit={handleSubmit}
  title="Create Item"
  submitText="Save"
  size="lg"
>
  <div className="form-group mb-4">
    <label className="form-label-block">Name *</label>
    <input
      type="text"
      className="form-input"
      value={formData.name}
      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
    />
  </div>
</FormModal>
```

### Card Pattern (ColoredCard)

```tsx
import ColoredCard from '@/components/ColoredCard';

<ColoredCard 
  accentColor="#3b82f6"
  hoverable={true}
  className="p-4"
>
  <h3>{item.name}</h3>
  <p>{item.description}</p>
</ColoredCard>
```

### Server-Side Search Pattern

```tsx
const [searchQuery, setSearchQuery] = useState('');
const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);

useEffect(() => {
  if (user) {
    loadData(); // Fetch with debouncedSearchQuery
  }
}, [debouncedSearchQuery, sortField, sortOrder, user]);

return (
  <UnifiedAdminPage
    adapter={myAdapter}
    items={items}
    externalSearchValue={searchQuery}
    onExternalSearchChange={setSearchQuery}
    totalMatched={totalMatched}
    showPaginationStats={true}
  />
);
```

---

## Key Learnings from LEARNINGS.md

### MongoDB Regex Bug (v10.1.0)
```typescript
// ❌ WRONG: Can't mix RegExp object + $options
{ $regex: new RegExp(query, 'i'), $options: 'i' }

// ✅ CORRECT: RegExp already has flags
{ $regex: new RegExp(query, 'i') }
```

### Form State Must Match Database Schema (v10.4.0)
- Every database field that users can edit MUST be in form state
- Missing fields cause empty inputs even when data exists
- Check all code paths: API → State → UI → API

### Conflicting useEffects (v10.1.0)
- Each data-loading concern should have ONE owner useEffect
- Avoid dependencies that recreate functions (causes infinite loops)
- Initial load vs search should be separate effects

### Double Debouncing = Broken Search (v10.1.0)
- Parent debounces (300ms) + Component debounces (300ms) = 600ms + never fires
- Server-side search should skip component-level debouncing
- Use `externalSearchValue` prop to signal server mode

### String .trim() Causes Issues (v11.5.0)
- Don't use `.trim()` without documented justification
- Trimming masks data quality issues
- Preserve data fidelity by default
- Only trim user input from forms with explicit comment

---

## Documentation Files

**Essential Reading:**
- `ARCHITECTURE.md` - Complete system architecture (3,789 lines)
- `CODING_STANDARDS.md` - Mandatory coding rules (11.25.0)
- `DESIGN_SYSTEM.md` - Design tokens and components (9.1.0)
- `WARP.md` - AI development guidelines (1,209 lines)
- `LEARNINGS.md` - Development lessons learned (6,195 lines)
- `USER_GUIDE.md` - Complete user documentation (1,655 lines)

**Reference:**
- `REUSABLE_COMPONENTS_INVENTORY.md` - 210+ module catalog
- `QUICK_REFERENCE.md` - Single Reference System guide
- `ROADMAP.md` - Future enhancements and milestones
- `TASKLIST.md` - Active and planned tasks

**Specs:**
- `.kiro/specs/analytics-dashboard.md` - Analytics features
- `.kiro/specs/bitly-integration.md` - Bitly system
- `.kiro/specs/event-management.md` - Event CRUD
- `.kiro/specs/hashtag-system.md` - Hashtag features
- `.kiro/specs/partners-management.md` - Partner system
- `.kiro/specs/variables-system.md` - Variables v7.0.0

---

## Enforcement & Verification

### Pre-Commit Checklist

- [ ] Version incremented in `package.json` and `VERSION.md`
- [ ] Searched existing implementations before creating new code
- [ ] Used design tokens exclusively (no hardcoded values)
- [ ] Used FormModal for modals, ColoredCard for cards
- [ ] Added WHAT/WHY comments to all code
- [ ] Ran `npm run build` successfully
- [ ] Ran `npm run type-check` successfully
- [ ] Updated RELEASE_NOTES.md with changes

### Verification Commands

```bash
# Check for hardcoded colors
grep -r "#[0-9a-f]\{6\}" --include="*.css" components/ app/

# Check for hardcoded spacing
grep -r "[3-9][0-9]*px" --include="*.css" components/

# Check for inline styles
grep -r 'style={{' --include="*.tsx" components/ app/

# Check for .trim() usage
grep -r "\.trim()" --include="*.ts" --include="*.tsx" app/ components/ lib/

# All should return minimal or zero results
```

### Consequences of Non-Compliance

| Violation | Result |
|-----------|--------|
| Inline styles | ❌ Immediate rejection |
| Hardcoded colors/spacing | ❌ Rejection - convert to tokens |
| Custom modals/cards | ❌ Rejection - use standard components |
| Not searching codebase first | ❌ Rejection - demonstrate research |
| Unnecessary .trim() | ❌ Rejection - remove or justify |

---

## Quick Reference

**Project Root:** `/Users/[user]/messmass/`  
**MongoDB:** Atlas (cloud) - connection via `lib/mongodb.ts`  
**WebSocket:** `server/websocket-server.js` on port 7654  
**Design Tokens:** `app/styles/theme.css` (200+ variables)  
**Component Inventory:** `REUSABLE_COMPONENTS_INVENTORY.md`  
**Current Version:** 11.25.0  
**Last Updated:** 2025-11-17T14:59:10.000Z

**Key Principle:** Search → Reuse → Document → Verify

---

*This summary is generated from the complete MessMass documentation suite. For detailed information, refer to the specific documentation files listed above.*
