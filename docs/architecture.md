# {messmass} Architecture Documentation
Status: Active
Last Updated: 2026-09-09
Canonical: No
Owner: Architecture

Version: 12.3.36

> **Scope.** This file describes how messmass works *now*: the modules that exist,
> the routes that are served, the contracts between them. It is not a changelog,
> not a plan, and not a record of how anything came to be that way.
>
> - Dated release history: [`docs/operations/operations-release-notes.md`](operations/operations-release-notes.md)
> - Extracted narrative: [`docs/archive/architecture-changelog-pre-2026-08.md`](archive/architecture-changelog-pre-2026-08.md) (2026-08-17)
>   and [`docs/archive/architecture-changelog-2026-09.md`](archive/architecture-changelog-2026-09.md) (2026-09-16)
>
> **What does not belong here:** migration plans and their status, "future
> enhancements", debugging narratives, manual-QA checklists, before/after
> performance tables, and version stamps on section headings. An audit on
> 2026-09-16 tested this document's falsifiable claims against the code: 43 were
> false, and roughly 85% of its file-path and line-count claims failed. Fiction
> in an architecture document is worse than no document, because it is trusted.
> Roughly 1,300 lines were deleted and 900 archived as a result (issues #408-#410).
>
> **If you change code that this file describes, change this file in the same
> commit.** If you find a claim here that is not true, delete it -- do not
> annotate it.

## 🔍 MANDATORY: Implementation Standards

**Before implementing ANY feature or component:**

### Rule 1: Search Existing Implementations

**NEVER create custom implementations without checking existing patterns first.**

**Reference Files:**
- **Modals**: `components/modals/FormModal.tsx`
- **Cards**: `components/ColoredCard.tsx`
- **Forms**: `app/admin/projects/ProjectsPageClient.tsx`
- **Hashtags**: `components/UnifiedHashtagInput.tsx`
- **Partners**: `components/PartnerSelector.tsx`
- **Admin Layout**: `components/UnifiedAdminHeroWithSearch.tsx`

### Rule 2: Use Design Tokens Exclusively

**ALL styling MUST use CSS variables from `app/styles/theme.css`**

```css
/* ✅ CORRECT */
.myComponent {
  color: var(--mm-gray-900);
  padding: var(--mm-space-4);
  border-radius: var(--mm-radius-lg);
}

/* ❌ FORBIDDEN */
.badComponent {
  color: #1f2937;      /* ❌ */
  padding: 16px;       /* ❌ */
  border-radius: 8px;  /* ❌ */
}
```

### Rule 3: Match Existing Structure Exactly

**Example - Modal Pattern:**
```tsx
// ✅ CORRECT: Use FormModal
import FormModal from '@/components/modals/FormModal';

<FormModal
  isOpen={isOpen}
  onClose={onClose}
  onSubmit={handleSubmit}
  title="Your Title"
  size="lg"
>
  {/* Content */}
</FormModal>
```

**Real Implementation:** See `app/admin/partners/page.tsx` for complete example.

### Rule 4: Consequences of Non-Compliance

| Violation | Result |
|-----------|--------|
| Custom modal instead of FormModal | ❌ Rejection |
| Hardcoded colors/spacing | ❌ Rejection |
| Not using ColoredCard | ❌ Rejection |
| Not searching codebase first | ❌ Rejection |

**See:** `docs/coding-standards.md` for complete rules and enforcement.

---

## 🏗️ Centralized Module Architecture

### Module Management Philosophy

**{messmass} operates on a centralized module architecture where ALL reusable components, utilities, and styling systems are maintained as single-source-of-truth implementations.**

**Core Principle**: One implementation, many consumers.

### Module Inventory & Catalog

Generated from the filesystem by `npm run architecture:generate`; CI fails when
it drifts. Do not edit between the markers.

<!-- GENERATED:modules -->

| Category | Count | Location |
|----------|-------|----------|
| **UI Components** | 105 | `components/` |
| **Utility Modules** | 201 | `lib/` |
| **Hooks** | 12 | `hooks/` |
| **Design Tokens** | 408 | `app/styles/theme.css` |
| **Utility CSS classes** | 192 | `app/styles/utilities.css` |
| **App routes (pages)** | 71 | `app/**/page.tsx` |
| **API routes** | 194 | `app/api/**/route.ts` |

The modules with the most importers — the ones whose change radius is
largest, and the ones to read first:

| Module | Importers | Lines |
|--------|-----------|-------|
| `lib/config.ts` | 107 | 204 |
| `lib/mongodb.ts` | 93 | 112 |
| `lib/logger.ts` | 86 | 392 |
| `lib/auth.ts` | 84 | 118 |
| `lib/apiGuards.ts` | 59 | 137 |
| `lib/apiClient.ts` | 43 | 258 |
| `components/ColoredCard.tsx` | 42 | 52 |
| `lib/db.ts` | 38 | 17 |
| `components/MaterialIcon.tsx` | 33 | 119 |
| `lib/fanmassIntegration.ts` | 30 | 441 |
| `components/UnifiedAdminHeroWithSearch.tsx` | 26 | 192 |
| `lib/permissions.ts` | 18 | 141 |
| `lib/mongoose-v3.ts` | 18 | 53 |
| `hooks/useAdminAuth.ts` | 17 | 65 |
| `lib/report-calculator.ts` | 17 | 727 |

Importers are counted by resolved import specifier, not by symbol name, so
a re-export through a barrel file counts for the barrel. A module missing
from this table has few importers or none; that is not on its own proof it
is dead — settle reachability with a symbol search and a build.
<!-- /GENERATED:modules -->
### Module Dependency Map

**Critical Dependencies** (update with care):

```
FormModal (components/modals/FormModal.tsx)
├── Used by: 12 admin pages
├── Depends on: BaseModal, design tokens
├── CSS: FormModal.module.css
└── Impact: High (core admin functionality)

ColoredCard (components/ColoredCard.tsx)
├── Used by: 25+ pages/components
├── Depends on: design tokens
├── CSS: ColoredCard.module.css
└── Impact: Critical (universal card component)

theme.css (app/styles/theme.css)
├── Used by: ALL styled components (100+)
├── Tokens: 200+ CSS variables
├── Scope: Global (:root)
└── Impact: System-wide (changes affect entire app)

formulaEngine (lib/formulaEngine.ts)
├── Used by: Chart system, analytics, KYC
├── Depends on: Variable metadata, stats schema
├── Functions: 12+ formula evaluation functions
└── Impact: High (core calculation engine)
```

### Centralized Update Strategy

**When ANY module needs updating:**

#### Step 1: Impact Assessment
```bash
# Find all usages
grep -r "import.*FormModal" app/ components/
grep -r "from '@/components/modals/FormModal'" app/ components/

# Count affected files
grep -r "FormModal" app/ components/ --include="*.tsx" | wc -l
```

#### Step 2: Document Affected Modules
**MANDATORY in task planning:**

```markdown
## Task: Add Loading State to FormModal

### Affected Modules:
- **Primary**: `components/modals/FormModal.tsx`
- **Dependent**: 12 admin pages
  - app/admin/partners/page.tsx
  - app/admin/kyc/page.tsx
  - app/admin/categories/page.tsx
  - app/admin/users/page.tsx
  - [... the rest; `grep -rl FormModal app/admin` is the live list]

### Impact Level: HIGH
- Core component used system-wide
- Requires testing across all admin workflows
- CSS changes may affect modal height calculations
```

#### Step 3: Single-Point Update
**Update ONLY the canonical implementation:**

```tsx
// components/modals/FormModal.tsx
// ✅ Update here ONCE

export interface FormModalProps {
  // ... existing props
  isLoading?: boolean; // ✅ New prop added centrally
}
```

**DO NOT update individual consumers unless necessary.**

#### Step 4: Propagation Testing
**Test ALL affected pages:**

```bash
# Start dev server
npm run dev

# Test matrix (example for FormModal update):
# ☐ Partners page - Create/Edit modal
# ☐ Variables page - Create/Edit modal
# ☐ KYC page - Create/Edit modal
# ☐ Categories page - Create/Edit modal
# ... (all 12 pages)

# Verify:
# - Modal opens/closes correctly
# - Form submission works
# - Loading states display properly
# - Mobile responsiveness maintained
```

#### Step 5: Version & Document
**Update version and document changes:**

```
Version: 9.1.0 → 9.2.0 (MINOR - new prop)
Module: FormModal
Change: Added `isLoading` prop for async operations
Affected: 12 admin pages
Tested: All admin workflows verified
Released: 2025-11-01T16:00:00.000Z
```

### Module Security Implications

**Centralized modules = centralized security:**

**Vulnerabilities**:
- SQL/NoSQL injection in `formulaEngine.ts` affects ALL charts
- XSS in `FormModal.tsx` affects ALL admin forms
- CSRF bypass in `csrf.ts` affects ALL state-changing operations

**Mitigation Strategy**:
1. **Regular Audits**: Quarterly security review of top 20 modules
2. **Dependency Scanning**: `npm audit` + Snyk integration
3. **Input Sanitization**: Centralized in utility functions
4. **Output Encoding**: Enforced in shared components
5. **Version Pinning**: Lock critical dependencies

**Audit Schedule**:
- **Monthly**: Design tokens, core components (FormModal, ColoredCard)
- **Quarterly**: Utility functions, analytics engines
- **Annual**: Complete module inventory review

### Module Deprecation Protocol

**If a centralized module must be replaced:**

1. **Create Replacement**: New canonical implementation
2. **Deprecation Notice**: Add `@deprecated` JSDoc tag
3. **Migration Guide**: Document step-by-step migration
4. **Grace Period**: Minimum 2 versions (e.g., 9.1.0 → 9.3.0)
5. **Automated Migration**: Provide codemod script if possible
6. **Final Removal**: Delete after grace period + verification

**Example Deprecation:**
```tsx
/**
 * @deprecated Use FormModal from @/components/modals/FormModal instead.
 * This component will be removed in v10.0.0.
 * Migration guide: See MODAL_SYSTEM.md#migration
 */
export function LegacyModal() { ... }
```

---

## Project Overview

{messmass} is an enterprise-grade event analytics platform built with Next.js 15, TypeScript, and MongoDB Atlas, designed for sports organizations, venues, brands, and event managers. The platform provides comprehensive real-time statistics tracking, intelligent partner management, automated event creation workflows (Sports Match Builder), advanced Bitly link analytics with many-to-many event associations, parameterized KPI dashboards with marketing multipliers, Bitly enrichment charts, and a unified hashtag system with category-aware organization.

Section headers below are stamped with the version that introduced them, kept as-is
because they're load-bearing reference content (data models, API endpoints, current
behavior) — not a changelog entry. For the flat shipped-version history, see
[`docs/operations/operations-release-notes.md`](operations/operations-release-notes.md)
or the extracted list in
[`docs/archive/architecture-changelog-pre-2026-08.md`](archive/architecture-changelog-pre-2026-08.md).

---

## Partners Management System
### Overview

The Partners Management System provides comprehensive infrastructure for managing organizational entities (clubs, federations, venues, brands) that participate in or host events. Partners serve as the foundation for rapid event creation via the Sports Match Builder and maintain associations with Bitly tracking links for attribution.

**Status**: Production-Ready (Fully migrated to UnifiedAdminPage system in v10.7.0)
**Key Enhancement**: Partner report pages with shareable public URLs

### Key Features

- **Partner Database**: Comprehensive directory of organizations with metadata
- **Partner Profiles**: Emoji identifiers, hashtags, Bitly link associations
- **Searchable Directory**: Pagination, sorting, and predictive search
- **Reusable Components**: PartnerSelector with chip-based selection pattern
- **Event Integration**: Automatic hashtag and link inheritance in Sports Match Builder
- **Bitly Attribution**: Partners associated with tracking links for analytics

### Architecture Components

#### 1. Data Model

**Partners Collection** (`partners`)
```typescript
interface Partner {
  _id: ObjectId;
  name: string;                    // Partner name (e.g., "FC Barcelona")
  emoji: string;                   // Visual identifier (e.g., "⚽")
  viewSlug?: string;               // URL-safe slug for partner report pages (v10.7.0)
  hashtags?: string[];             // Traditional hashtags
  categorizedHashtags?: {          // Category-specific hashtags
    [categoryName: string]: string[];
  };
  bitlyLinkIds?: ObjectId[];       // Associated Bitly links (references to bitly_links)
  createdAt: Date;                 // ISO 8601 with milliseconds
  updatedAt: Date;                 // ISO 8601 with milliseconds
}
```

**Example Partner Document**:
```json
{
  "_id": ObjectId("..."),
  "name": "Ferencvárosi TC",
  "emoji": "⚽",
  "viewSlug": "fradi-ferencvarosi-tc-abc123",
  "hashtags": ["football", "greenwhite"],
  "categorizedHashtags": {
    "location": ["budapest", "hungary"],
    "sport": ["football"]
  },
  "bitlyLinkIds": [ObjectId("..."), ObjectId("...")],
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-20T14:22:00.000Z"
}
```

#### 2. API Endpoints

**Partner Management**
- `GET /api/partners` - List partners with pagination, search, and sorting
  - Query params:
    - `limit` (number, default 20)
    - `offset` (number, default 0)
    - `search` (string, searches name field)
    - `sortField` (name | createdAt | updatedAt)
    - `sortOrder` (asc | desc)
  - Response:
    ```json
    {
      "success": true,
      "partners": [...],
      "pagination": {
        "totalMatched": 150,
        "limit": 20,
        "offset": 0,
        "nextOffset": 20
      }
    }
    ```

- `POST /api/partners` - Create new partner
  - Body: `{ name, emoji, hashtags?, categorizedHashtags?, bitlyLinkIds? }`
  - Requires authentication
  - Returns created partner with `_id`

- `PUT /api/partners` - Update existing partner
  - Query param: `partnerId` (ObjectId)
  - Body: Partial partner data to update
  - Requires authentication
  - Updates `updatedAt` timestamp automatically

- `DELETE /api/partners` - Delete partner
  - Query param: `partnerId` (ObjectId)
  - Requires authentication
  - Returns `{ success: true, deletedCount: 1 }`

**Bitly Links Populated**: When fetching partners, Bitly links are populated from the `bitly_links` collection to provide full link details (bitlink, title, long_url) in the response.

#### 3. UI Components

**PartnerSelector Component** (`components/PartnerSelector.tsx`)
- **Pattern**: Chip-based selector with predictive search (follows ProjectSelector pattern)
- **Features**:
  - Predictive search filtering by partner name
  - Dropdown with emoji + name display
  - Transforms to chip when partner selected
  - Keyboard navigation (arrow keys, enter, escape)
  - Click-outside handling to close dropdown
  - Remove button (X) to clear selection
  - Full accessibility (ARIA labels, focus management)

**Usage Example**:
```typescript
import PartnerSelector from '@/components/PartnerSelector';

<PartnerSelector
  selectedPartnerId={partner1Id}
  partners={partners}
  onChange={(id) => setPartner1Id(id || '')}
  placeholder="Search home team..."
  disabled={loadingPartners}
/>
```

**Partner Admin Page** (`app/admin/partners/page.tsx`)
- **Layout**: AdminHero + table + modals (matches /admin/projects and /admin/bitly patterns)
- **Features**:
  - Searchable partner table with pagination (20 per page)
  - Sortable columns (name, created date)
  - Add/Edit modals with full CRUD operations
  - Hashtag integration via UnifiedHashtagInput
  - Bitly link association via BitlyLinksSelector
  - Delete confirmation with safety checks

**Design System Compliance**:
- Uses `AdminHero` for page header
- Modal patterns consistent with project/Bitly pages
- Table styling matches admin design system
- Chip-based components use success color scheme (green)
- All spacing and typography use design tokens (`--mm-*`)

**Unified Admin System Integration** (v10.7.0):
- Partners page fully migrated to UnifiedAdminPage component
- Uses `partnersAdapter` from `lib/adapters/partnersAdapter.tsx`
- Server-side search, sort, pagination (matches projects page pattern)
- Card/list view toggle with localStorage persistence
- All CRUD operations work through adapter handlers
- Report button available in both list and card views

#### 4. Sports Match Builder Integration

**Quick Add Page** (`app/admin/quick-add/page.tsx`)
- **Purpose**: Rapid event creation from partner selection
- **Features**:
  - Tabbed interface: "From Sheet" | "Sports Match"
  - Partner 1 (Home Team) selector
  - Partner 2 (Away Team) selector
  - Match date picker
  - Event preview with merged data
  - One-click event creation

**Event Generation Logic**:

1. **Event Name**: `{Partner1.emoji} {Partner1.name} x {Partner2.name}`
   - Example: "⚽ Ferencvárosi TC x Újpest FC"

2. **Hashtag Merging**:
   - Partner 1: ALL hashtags (traditional + categorized)
   - Partner 2: All hashtags EXCEPT location category
   - Deduplication: Remove duplicate hashtags across both partners
   - Result: Home team location + both teams' hashtags

3. **Bitly Link Inheritance**:
   - Only Partner 1 (Home Team) Bitly links are inherited
   - Rationale: Home team's tracking links used for event attribution

4. **Event Date**: User-selected date from date picker

**Example Preview**:
```json
{
  "eventName": "⚽ Ferencvárosi TC x Újpest FC",
  "eventDate": "2025-02-15",
  "hashtags": ["football", "greenwhite", "purple"],
  "categorizedHashtags": {
    "location": ["budapest"],
    "sport": ["football"]
  },
  "bitlyLinks": [ObjectId("...")]
}
```

#### 5. Partner Report Pages
**Purpose**: Shareable public reporting pages for partners showing profile and related events

**Route**: `/partner-report/[slug]/page.tsx`

**Features**:
- **Hero Block**: Partner emoji, name, logo, hashtags, timestamps (created/updated)
- **Export Actions**: CSV and PDF export buttons
- **Totals Summary**: Aggregate statistics across all partner events (total events, images, fans, attendees)
- **Related Events List**: 3-column card grid with event stats (images, fans, merch, attendees)
- **Password Protection**: server component checks `isPageProtected`/`hasPageAccess` (`lib/pageAccess.ts`) and renders `ServerPageGate` before any data is read. `/report/[slug]` applies the identical gate in `app/report/[slug]/layout.tsx` (v12.3.36); its data route `GET /api/projects/stats/[slug]` enforces via `requirePageAccess`
- **Responsive Design**: Desktop 3-column grid, mobile single column

**API Endpoint**:
- `GET /api/partners/report/[slug]` - Fetches partner by viewSlug with related events
  - Returns: Partner object + events array sorted by eventDate descending
  - Next.js 15 compatible (async params)
  - Authorization: Password-protected (same as project stats pages)

**viewSlug Auto-Generation** (v10.7.0):
- New partners automatically get `viewSlug` on creation (POST /api/partners)
- Existing partners get `viewSlug` on first edit/update (PUT /api/partners)
- Uses UUID-based slug generation (`generateUniqueViewSlug()` from `lib/slugUtils`)
- Checks uniqueness across all partner viewSlugs to avoid collisions
- Backward compatibility: Old partners created before feature will auto-populate on next edit

**Report Button Integration**:
- Available in partners page row actions (list view)
- Available in partners page card actions (card view)
- Opens `/partner-report/[viewSlug]` in new tab
- Shows alert if partner missing viewSlug (prompts user to edit and save)

**Example Report URL**: `https://messmass.app/partner-report/abc-123-partner-name`

**Files**:
- `app/partner-report/[slug]/page.tsx` - Report page component
- `app/styles/report-page.module.css` - Shared report page styles
- `app/api/partners/report/[slug]/route.ts` - Report API endpoint
- `lib/adapters/partnersAdapter.tsx` - Report button definition

#### 6. Database Integration

**Collections Involved**:
- `partners` - Partner entities
- `projects` - Events created from partners
- `bitly_links` - Tracking links associated with partners
- `bitly_project_links` - Many-to-many junction for link-event associations

**Relationships**:
```
partners (1) ----< (N) bitlyLinkIds
partners (1) ----< (N) projects (via Sports Match Builder)
bitly_links (N) ----< (N) projects (via bitly_project_links junction)
```

### Benefits

1. **Rapid Event Creation**: Sports Match Builder reduces event creation time from minutes to seconds
2. **Data Consistency**: Partner profiles ensure consistent hashtags and naming across events
3. **Attribution**: Bitly link associations enable accurate traffic attribution to partners
4. **Scalability**: Partner directory grows with organization, reusable across all events
5. **Searchability**: Predictive search makes finding partners fast even with large directories
6. **Flexibility**: Partners support multiple types (clubs, federations, venues, brands)

### Performance Considerations

1. **Pagination**: 20 partners per page prevents overloading UI
2. **Search Optimization**: Case-insensitive regex search on indexed `name` field
3. **Lazy Loading**: Bitly links fetched only when needed (modal open)
4. **Cached Partners**: Partner list cached during Sports Match Builder session
5. **Indexed Fields**: MongoDB indexes on `name` and `createdAt` for fast queries

## Template System Architecture
### Overview

The Template System provides hierarchical report visualization management across the {messmass} platform. It enables customization of how data is displayed in event reports, partner reports, and global dashboards through a database-driven template and data block architecture.

### Key Features

- **Hierarchical Template Resolution**: Entity-specific → Partner → Default → Hardcoded fallback
- **Visual Block Management**: Drag-and-drop interface for organizing chart blocks
- **Responsive Grid System**: Configurable layouts for desktop, tablet, and mobile
- **Real-time Preview**: Live chart previews with sample data
- **Template Inheritance**: Partners and projects can inherit or override templates

### Architecture Components

#### 1. Template Resolution Hierarchy

**Resolution order varies by entity type:**

**For Event Reports (projects):**
```typescript
1. Project-Specific Template (project.reportTemplateId)
2. Partner Template via project.partner1 (partner.reportTemplateId)
3. Special Case: __default_event__ identifier forces default event template
4. Default Template (isDefault: true, ANY type - no type filter)
5. Hardcoded Fallback (emergency system template from lib/reportTemplateTypes.ts)
```

**For Partner Reports (partners):**
```typescript
1. Partner-Specific Template (partner.reportTemplateId)
2. Default Template (isDefault: true, ANY type - no type filter)
3. Hardcoded Fallback (emergency system template)
```

**Key Implementation Details:**
- Default template lookup does NOT filter by type (code: `findOne({ isDefault: true })`)
- Partner template resolution follows project.partner1 reference automatically
- Special `__default_event__` identifier used by partner report system for card layouts
- Hardcoded fallback defined in `HARDCODED_DEFAULT_TEMPLATE` constant
- All resolution handled by `/api/report-config/[identifier]?type=project|partner`

#### 2. Data Model

**Report Templates Collection** (`report_templates`)
```typescript
interface ReportTemplate {
  _id: ObjectId;
  name: string;
  type: 'event' | 'partner' | 'global';
  isDefault: boolean;
  dataBlocks: Array<{
    blockId: string;
    order: number;
  }>;
  gridSettings: {
    desktopUnits: number;
    tabletUnits: number;
    mobileUnits: number;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

#### 3. API Endpoints

**Template Management**
- `GET /api/report-templates` - List all templates with optional associations
- `POST /api/report-templates` - Create new template
- `PUT /api/report-templates?templateId=X` - Update template configuration

**Template Resolution**
- `GET /api/report-config/{identifier}?type=partner` - Resolve template for partner reports
- `GET /api/report-config/{identifier}?type=project` - Resolve template for event reports

#### 4. UI Components

**Visualization Admin** (`app/admin/visualization/page.tsx`)
- Template selector with clear usage indicators
- Data block management interface
- Chart configuration and preview
- Real-time chart preview with sample data

### Template System Best Practices

#### When to Create New Template vs Reuse

**Create New Template If**:
- Different grid layout needed (3-column vs 4-column)
- Different block order required
- Partner/client has unique branding requirements
- Specific chart combinations not available in existing templates

**Reuse Existing Template If**:
- Grid layout matches needs
- Block order is acceptable (can customize per-project)
- No special branding required
- Standard report structure works

#### Template Assignment Workflow

1. **Global Default**: Set one template as `isDefault: true` for new projects
2. **Partner Level**: Assign template to partner → all partner events inherit
3. **Project Override**: Assign template to specific project → overrides partner template
4. **Testing**: Use Builder Mode (`/edit/[slug]`) to preview template before publishing

#### Debugging Template Issues

**Template Not Loading:**
```bash
# Check API response
curl "http://localhost:3000/api/report-config/PROJECT_SLUG?type=project"

# Expected response:
{
  "success": true,
  "template": { ... },
  "resolvedFrom": "project" | "partner" | "default" | "hardcoded",
  "source": "template_name_or_entity"
}
```

**Chart Not Displaying:**
1. Verify chart exists: Check `/api/chart-config` for chartId
2. Check formula: Ensure variables exist in `stats` object
3. Validate data: Run formula evaluation with real project data
4. Check visibility: Ensure `isActive: true` on data block

**Partner Template Not Applying:**
1. Verify `partner.reportTemplateId` field exists in database
2. Check `project.partner1` references correct partner ObjectId
3. Test resolution: Query `/api/report-config/[projectSlug]?type=project`
4. Check logs: Server console shows resolution path

### Performance Considerations

**Template Loading**:
- Templates cached in memory after first load (<100ms subsequent loads)
- Data blocks populated via single database query
- Chart configurations loaded separately (lazy loaded)

**Report Rendering**:
- Builder Mode: <500ms for 10-20 blocks
- Public Stats Page: <800ms full render with all charts
- Partner Report: <1200ms (includes multiple event cards)

**Optimization Tips**:
1. Limit template to 20 blocks maximum (UX + performance)
2. Use derived variables instead of complex formulas
3. Enable chart result caching for expensive calculations
4. Lazy load images (use loading="lazy" attribute)

---

## Styling Architecture
### Overview
- Introduced a design-managed content surface to unify the main content block across admin and public pages.
- Centralized theming via CSS variables to eliminate hard-coded per-page styles.
- Enforced board-level card width consistency: boards use equal-width columns (repeat(N, 1fr)); avoid per-card width overrides.

### CSS Variables
- `--page-bg`: Page background gradient/color (fallback: `var(--gradient-primary)`).
- `--header-bg`: Header/Hero surface background (fallback: `rgba(255, 255, 255, 0.95)`).
- `--content-bg`: Main content surface background (new in 4.2.0), controlled by Design Manager (pageStyle.contentBackgroundColor).

### Core Components
- `<ColoredCard>`: Card component with optional colored left accent border (see CARD_SYSTEM.md)
- `<AdminLayout>`: Admin page wrapper with Sidebar + TopHeader (see ADMIN_LAYOUT_SYSTEM.md)

### Design System
- All design tokens documented in [DESIGN_SYSTEM.md](docs/design/design-system.md)
- The "TailAdmin V2 flat design" system described in this 4.2.0-era section has since been superseded by GDS (the fleet-wide General Design System — `@sovereignsquad/gds-admin`/`gds-core`/`gds-theme` on Mantine 8); see the Technology Stack section below and `docs/design/design-system.md`, which explicitly says not to rely on TailAdmin-era guidance or removed utility classes.
- **ALL CSS card classes REMOVED**: `.glass-card`, `.content-surface`, `.section-card`, `.admin-card`
- **ONLY USE**: `<ColoredCard>` component for all card UI
- Current components: `ColoredCard`, `AdminLayout`, `Sidebar`, `TopHeader`
- All card styling uses `<ColoredCard>` component ONLY (component-based architecture)
- Admin: `app/admin/layout.tsx` provides AdminLayout wrapper with sidebar navigation
- Public: `components/PagePasswordLogin.tsx` resolves page style via `/api/report-config/[id]?type=…` then `/api/report-styles/[styleId]`

## Configuration Loader

### Admin Filter Search & Paging
- Hashtags API now supports server-side search + pagination for efficient selection in /admin/filter
- Endpoint: GET /api/hashtags
  - Query params: `search?`, `offset` (number), `limit` (default 20)
  - Response: `{ success, hashtags: Array<{hashtag:string,count:number}>, pagination: { mode: 'aggregation', limit, offset, nextOffset, totalMatched } }`
- Rationale: Reduce page load and improve operator workflow by fetching only visible hashtag pages; consistent with Admin → Projects pagination approach

### Overview
A centralized configuration module lives at `lib/config.ts`. It provides a single, typed source of truth for server and client configuration values and prevents hard-coded settings scattered across the codebase.

### Keys (minimum set)
- Server-only:
  - MONGODB_URI
  - MONGODB_DB
  - SSO_BASE_URL
  - SSO_CLIENT_ID
  - SSO_CLIENT_SECRET
  - APP_BASE_URL
  - API_BASE_URL
- Client-exposed (browser):
  - NEXT_PUBLIC_APP_URL

Note: `ADMIN_PASSWORD` is not a config key here — local admin login was removed; admin auth is SSO-only (see "Authentication Model" below).

### Resolution order and precedence
1) Environment variables (authoritative for secrets)
2) Optional Atlas “settings” overlay (non-secrets only, behind a feature flag)
- Precedence: env > DB (environment values always win when both exist)
- No baked defaults for secrets; required secrets must be present or fail fast

### Client/server boundary rules
- Only NEXT_PUBLIC_* keys are exposed to the client. All other keys are server-only.
- If a UI needs a value that isn’t prefixed NEXT_PUBLIC_*, inject it via server-rendered props or server APIs — do not access server-only keys on the client.

### Example usage patterns
Server (API route or server module):
```ts path=null start=null
import config from '@/lib/config';

// MongoDB connection
const uri = config.mongodbUri; // from MONGODB_URI
const dbName = config.dbName;  // from MONGODB_DB (defaulting strategy removed in Step 4)

// Service bases
const apiBase = process.env.API_BASE_URL; // or expose via config.get('API_BASE_URL') once helpers are added
```

Client (browser code):
```ts path=null start=null
// Only NEXT_PUBLIC_* keys are safe on the client
declare const process: { env: { NEXT_PUBLIC_APP_URL?: string } };
const appUrl = process.env.NEXT_PUBLIC_APP_URL;
```

### Optional Atlas overlay (non-secrets only)
- Collection shape (proposed in Step 3): { project, env, key, value, updated_at, comment }
- Purpose: centralize non-sensitive toggles and base URLs; never secrets
- Caching: in-process TTL (e.g., 300000 ms) with manual bust method
- Reference: see `docs/operations/operations-learnings.md` entry “2025-09-24T11:07:46.000Z — Atlas settings collection plan”

## Hashtag Categories System
### Overview

The hashtag categories system allows users to organize hashtags into categories and filter projects using both traditional hashtags and category-prefixed hashtags (e.g., "country:hungary", "period:summer"). This enables better organization and more precise filtering capabilities.

### Key Features

- **Category-Prefixed Hashtags**: Support for hashtags in the format "category:hashtag"
- **Dual Format Support**: Hashtags work both as plain hashtags and category-prefixed hashtags
- **Visual Category Indicators**: UI components display category colors and prefixes
- **Advanced Filtering**: Search supports both traditional and categorized hashtag filtering
- **Backward Compatibility**: Existing plain hashtags continue to work without changes

### Architecture Components

#### 1. Data Model

**Hashtag Categories Collection** (`hashtag_categories`)
```typescript
interface HashtagCategory {
  _id: ObjectId;
  name: string;        // Category name (e.g., "country", "period")
  color: string;       // Hex color code for visual distinction
  createdAt: Date;
  updatedAt: Date;
}
```

**Projects Collection Extension**
```typescript
interface Project {
  // ... existing fields
  hashtags: string[];  // Traditional hashtags
  categorizedHashtags: {
    [categoryName: string]: string[];  // Category-specific hashtags
  };
}
```

**Hashtags Collection Enhancement**
```typescript
interface HashtagDoc {
  _id: string;         // Hashtag text (e.g., "summer" or "period:summer")
  count: number;       // Usage count across all projects
  projects: ObjectId[]; // Projects using this hashtag
}
```

#### 2. Utility Functions (`lib/hashtagCategoryUtils.ts`)

**Core Functions:**

- `expandHashtagsWithCategories()`: Converts categorized hashtags to "category:hashtag" format
- `parseHashtagQuery()`: Parses "category:hashtag" into category and hashtag components
- `matchHashtagInProject()`: Checks if a hashtag exists in traditional or categorized fields

**Example Usage:**
```typescript
// Expand categorized hashtags for display
const expandedTags = expandHashtagsWithCategories(
  ["summer", "travel"],
  { country: ["hungary"], period: ["summer"] }
);
// Returns: ["summer", "travel", "country:hungary", "period:summer"]

// Parse category-prefixed hashtag
const parsed = parseHashtagQuery("country:hungary");
// Returns: { category: "country", hashtag: "hungary" }
```

#### 3. API Endpoints

**Hashtag Categories Management**
- `GET /api/hashtag-categories` - List categories with search and pagination
- `POST /api/hashtag-categories` - Create category; requires `admin-session`
- `PUT /api/hashtag-categories` - Update category by `id` in the request body; requires `admin-session`
- `DELETE /api/hashtag-categories?id=<categoryId>` - Delete category; requires `admin-session`

**Enhanced Project APIs**
- `POST /api/projects` - Create project with categorized hashtags
- `PUT /api/projects/[id]` - Update project with categorized hashtags
- Both endpoints automatically store both plain and category-prefixed versions

**Enhanced Filtering API**
- `POST /api/hashtags/filter` - Filter projects by hashtags (admin)
- `GET /api/hashtags/filter-by-slug/[slug]` - Public filter endpoint supporting both filter slugs and direct hashtag queries
- `GET /api/hashtags/slugs` - Get available hashtags for filtering
- Supports mixed queries: `["summer", "country:hungary"]`
- Uses MongoDB `$or` queries to search both traditional and categorized hashtags
- **Note**: Individual hashtag statistics pages (`/hashtag/[hashtag]`) have been consolidated into the filter system

#### 4. UI Components

**ColoredHashtagBubble Component**
- Displays hashtags with category colors
- Shows category prefixes visually (e.g., "period:" in lighter text)
- Includes tooltips with full category context

**UnifiedHashtagInput Component**
- Enhanced to support category-prefixed hashtag input
- Visual distinction between plain and categorized hashtags
- Autocomplete supports both formats

**Project Forms**
- Category-specific hashtag input sections
- Proper loading and display of categorized hashtags during editing
- Validation to prevent hashtag duplication across categories

#### 5. Filtering Logic

The system supports sophisticated filtering with both traditional and categorized hashtags:

**Query Types:**
1. **Plain hashtag**: "summer" - searches in all categories + traditional hashtags
2. **Category-prefixed**: "period:summer" - searches only in specified category
3. **Mixed queries**: `["summer", "country:hungary"]` - combines both approaches

**MongoDB Query Structure:**
```javascript
{
  $and: [
    {
      $or: [
        { hashtags: { $in: ["summer"] } },
        { "categorizedHashtags.country": { $in: ["summer"] } },
        { "categorizedHashtags.period": { $in: ["summer"] } }
        // ... other categories
      ]
    },
    {
      $or: [
        { "categorizedHashtags.country": { $in: ["hungary"] } }
      ]
    }
  ]
}
```

### Implementation Details

#### Database Strategy

1. **Dual Storage**: Both plain and category-prefixed hashtags are stored in the hashtags collection for efficient filtering
2. **Backward Compatibility**: Existing projects continue to work with traditional hashtags
3. **Incremental Migration**: New projects automatically adopt the dual format

#### Performance Considerations

1. **Indexed Queries**: MongoDB indexes on both `hashtags` and `categorizedHashtags` fields
2. **Efficient Filtering**: Single query handles both traditional and categorized hashtag searches
3. **Client-Side Optimization**: Utility functions minimize redundant processing

#### UI/UX Design

1. **Visual Hierarchy**: Category prefixes are displayed in lighter/smaller text
2. **Color Coding**: Each category has a distinct color for easy identification
3. **Consistent Experience**: Same hashtag works in both traditional and categorized contexts

### Benefits

1. **Enhanced Organization**: Users can organize hashtags by meaningful categories
2. **Precise Filtering**: Category-prefixed searches provide exact matches
3. **Flexible Usage**: Same hashtag can exist in multiple categories without conflict
4. **Backward Compatibility**: No disruption to existing workflows
5. **Future-Proof**: Extensible architecture for additional categorization features

## URL Structure and Routing

Generated from `app/` and from `docs/_audit/endpoints.json` (itself gated by
`npm run inventory:check`) by `npm run architecture:generate`. CI fails when it
drifts. Do not edit between the markers: a route added, renamed or deleted
shows up here on the next regeneration, which is the point.

<!-- GENERATED:routes -->

### Pages (71)

| Route | File |
|-------|------|
| `/` | `app/page.tsx` |
| `/admin` | `app/admin/page.tsx` |
| `/admin/analytics` | `app/admin/analytics/page.tsx` |
| `/admin/analytics/ai` | `app/admin/analytics/ai/page.tsx` |
| `/admin/analytics/ai/[eventId]` | `app/admin/analytics/ai/[eventId]/page.tsx` |
| `/admin/analytics/executive` | `app/admin/analytics/executive/page.tsx` |
| `/admin/analytics/insights` | `app/admin/analytics/insights/page.tsx` |
| `/admin/analytics/marketing` | `app/admin/analytics/marketing/page.tsx` |
| `/admin/analytics/operations` | `app/admin/analytics/operations/page.tsx` |
| `/admin/analytics/sponsorship` | `app/admin/analytics/sponsorship/page.tsx` |
| `/admin/analytics/sponsorship/activation` | `app/admin/analytics/sponsorship/activation/page.tsx` |
| `/admin/analytics/sponsorship/activation/recap/[partnerId]` | `app/admin/analytics/sponsorship/activation/recap/[partnerId]/page.tsx` |
| `/admin/api-football-enrich` | `app/admin/api-football-enrich/page.tsx` |
| `/admin/bitly` | `app/admin/bitly/page.tsx` |
| `/admin/cache` | `app/admin/cache/page.tsx` |
| `/admin/categories` | `app/admin/categories/page.tsx` |
| `/admin/charts` | `app/admin/charts/page.tsx` |
| `/admin/clear-session` | `app/admin/clear-session/page.tsx` |
| `/admin/clicker-manager` | `app/admin/clicker-manager/page.tsx` |
| `/admin/content-library` | `app/admin/content-library/page.tsx` |
| `/admin/cookie-test` | `app/admin/cookie-test/page.tsx` |
| `/admin/dashboard` | `app/admin/dashboard/page.tsx` |
| `/admin/design` | `app/admin/design/page.tsx` |
| `/admin/events` | `app/admin/events/page.tsx` |
| `/admin/events/[id]/kyc-data` | `app/admin/events/[id]/kyc-data/page.tsx` |
| `/admin/fanmass` | `app/admin/fanmass/page.tsx` |
| `/admin/filter` | `app/admin/filter/page.tsx` |
| `/admin/filter/[slug]/reports` | `app/admin/filter/[slug]/reports/page.tsx` |
| `/admin/hashtags` | `app/admin/hashtags/page.tsx` |
| `/admin/hashtags/[hashtag]/reports` | `app/admin/hashtags/[hashtag]/reports/page.tsx` |
| `/admin/help` | `app/admin/help/page.tsx` |
| `/admin/help/guides` | `app/admin/help/guides/page.tsx` |
| `/admin/help/guides/[slug]` | `app/admin/help/guides/[slug]/page.tsx` |
| `/admin/insights` | `app/admin/insights/page.tsx` |
| `/admin/kyc` | `app/admin/kyc/page.tsx` |
| `/admin/login` | `app/admin/login/page.tsx` |
| `/admin/mainpage` | `app/admin/mainpage/page.tsx` |
| `/admin/messages` | `app/admin/messages/page.tsx` |
| `/admin/organizations` | `app/admin/organizations/page.tsx` |
| `/admin/organizations/[id]/reports` | `app/admin/organizations/[id]/reports/page.tsx` |
| `/admin/partners` | `app/admin/partners/page.tsx` |
| `/admin/partners/[id]` | `app/admin/partners/[id]/page.tsx` |
| `/admin/partners/[id]/analytics` | `app/admin/partners/[id]/analytics/page.tsx` |
| `/admin/partners/[id]/kyc-data` | `app/admin/partners/[id]/kyc-data/page.tsx` |
| `/admin/partners/[id]/reports` | `app/admin/partners/[id]/reports/page.tsx` |
| `/admin/project-partners` | `app/admin/project-partners/page.tsx` |
| `/admin/projects` | `app/admin/projects/page.tsx` |
| `/admin/quick-add` | `app/admin/quick-add/page.tsx` |
| `/admin/register` | `app/admin/register/page.tsx` |
| `/admin/reports` | `app/admin/reports/page.tsx` |
| `/admin/styles` | `app/admin/styles/page.tsx` |
| `/admin/styles/[id]` | `app/admin/styles/[id]/page.tsx` |
| `/admin/unauthorized` | `app/admin/unauthorized/page.tsx` |
| `/admin/users` | `app/admin/users/page.tsx` |
| `/admin/visualization` | `app/admin/visualization/page.tsx` |
| `/dashboard/filter/[filterSlug]` | `app/dashboard/filter/[filterSlug]/page.tsx` |
| `/dashboard/hashtag/[hashtag]` | `app/dashboard/hashtag/[hashtag]/page.tsx` |
| `/dashboard/partner/[partnerId]` | `app/dashboard/partner/[partnerId]/page.tsx` |
| `/debug/hashtag-categories` | `app/debug/hashtag-categories/page.tsx` |
| `/edit/[slug]` | `app/edit/[slug]/page.tsx` |
| `/examples/password-gate-demo` | `app/examples/password-gate-demo/page.tsx` |
| `/filter/[slug]` | `app/filter/[slug]/page.tsx` |
| `/hashtag/[hashtag]` | `app/hashtag/[hashtag]/page.tsx` |
| `/organization-edit/[id]` | `app/organization-edit/[id]/page.tsx` |
| `/organization-report/[id]` | `app/organization-report/[id]/page.tsx` |
| `/partner-edit/[slug]` | `app/partner-edit/[slug]/page.tsx` |
| `/partner-report/[slug]` | `app/partner-report/[slug]/page.tsx` |
| `/privacy` | `app/privacy/page.tsx` |
| `/report/[slug]` | `app/report/[slug]/page.tsx` |
| `/terms` | `app/terms/page.tsx` |
| `/test-csrf` | `app/test-csrf/page.tsx` |

### API routes (194)

`auth` is the guard symbol the route actually calls. A blank cell
means the route calls none — public by construction, or a gap.

#### `/api/admin`

| Route | Methods | Auth |
|-------|---------|------|
| `/api/admin/auth` | GET | `getAdminUser` |
| `/api/admin/clear-cache` | POST | `getAdminUser` |
| `/api/admin/clear-cookies` | GET, POST | — |
| `/api/admin/contact-inquiries` | GET | `getAdminUser` |
| `/api/admin/email-selftest` | GET | `requireSession` |
| `/api/admin/fanmass/commands` | POST | `getAdminUser` |
| `/api/admin/fanmass/events` | GET | `getAdminUser, requireAdmin` |
| `/api/admin/fanmass/events/[eventId]` | GET, POST | `getAdminUser, requireAdmin` |
| `/api/admin/fanmass/snapshot` | GET | `getAdminUser, requireAdmin` |
| `/api/admin/filter-style` | GET, POST | `requireAdmin` |
| `/api/admin/fix-mojibake-text` | GET | `getAdminUser` |
| `/api/admin/hashtag-style` | GET, POST | `requireAdmin` |
| `/api/admin/landing-projects` | GET | `getAdminUser` |
| `/api/admin/landing-settings` | GET, PUT | `getAdminUser` |
| `/api/admin/landing-static-generate` | POST | `getAdminUser` |
| `/api/admin/local-users` | GET, POST | `getAdminUser` |
| `/api/admin/local-users/[id]` | PUT, DELETE | `getAdminUser` |
| `/api/admin/local-users/[id]/api-access` | POST, PUT | `getAdminUser` |
| `/api/admin/local-users/[id]/send-email` | POST | `getAdminUser` |
| `/api/admin/login` | POST, DELETE | — |
| `/api/admin/organizations` | GET, POST | `getAdminUser` |
| `/api/admin/organizations/[id]` | GET, PUT, PATCH, DELETE | `getAdminUser` |
| `/api/admin/organizations/[id]/members` | GET, PUT | `getAdminUser` |
| `/api/admin/partners` | GET | `requireSession` |
| `/api/admin/permissions` | GET, POST, DELETE | — |
| `/api/admin/project-partners` | GET, PUT | `getAdminUser, requireAdmin, requireSession` |
| `/api/admin/project-partners/auto-suggest` | POST | `requireSession` |
| `/api/admin/projects/[id]` | DELETE | — |
| `/api/admin/register` | POST | — |
| `/api/admin/sync-events-to-camera` | GET | `getAdminUser` |
| `/api/admin/sync-partners-to-camera` | GET | `getAdminUser` |
| `/api/admin/ui-settings` | GET, PUT | `requireAdmin` |
| `/api/admin/users/[id]/role` | PUT | `getAdminUser` |
| `/api/admin/variables/merge` | POST | `getAdminUser` |
| `/api/admin/variables/merge-candidates` | GET | `getAdminUser` |

#### `/api/analytics`

| Route | Methods | Auth |
|-------|---------|------|
| `/api/analytics/aggregates` | GET | `getAdminUser` |
| `/api/analytics/aggregates/partners` | GET | `getAdminUser` |
| `/api/analytics/ai/coverage` | GET | `getAdminUser` |
| `/api/analytics/ai/events` | GET | `getAdminUser` |
| `/api/analytics/ai/events/[eventId]/drive-sync` | POST | `getAdminUser` |
| `/api/analytics/ai/events/[eventId]/rescan` | GET, POST | `getAdminUser` |
| `/api/analytics/ai/events/[eventId]/summary` | GET | `getAdminUser` |
| `/api/analytics/ai/variables` | GET | `getAdminUser` |
| `/api/analytics/benchmarks` | GET | `requireSession` |
| `/api/analytics/compare` | GET | `requireSession` |
| `/api/analytics/compare/partners` | GET | `requireSession` |
| `/api/analytics/compare/periods` | GET | `requireSession` |
| `/api/analytics/event/[projectId]` | GET | `requireSession` |
| `/api/analytics/executive/insights` | GET | `requireSession` |
| `/api/analytics/executive/metrics` | GET | `requireSession` |
| `/api/analytics/executive/top-events` | GET | `requireSession` |
| `/api/analytics/insights` | GET | `getAdminUser` |
| `/api/analytics/insights/[projectId]` | GET | `requireSession` |
| `/api/analytics/insights/organizations/[orgId]` | GET | `getAdminUser` |
| `/api/analytics/insights/partners/[partnerId]` | GET | `getAdminUser` |
| `/api/analytics/insights/summary` | GET | `getAdminUser` |
| `/api/analytics/partner/[partnerId]` | GET | `requireSession` |
| `/api/analytics/sponsorship-hub` | GET | `getAdminUser` |
| `/api/analytics/trends` | GET | `requireSession` |

#### `/api/api-football`

| Route | Methods | Auth |
|-------|---------|------|
| `/api/api-football/enrich-partners` | GET, POST | `getAdminUser` |

#### `/api/auth`

| Route | Methods | Auth |
|-------|---------|------|
| `/api/auth/check` | GET | `getAdminUser` |
| `/api/auth/sso/callback` | GET | — |
| `/api/auth/sso/config` | GET | — |
| `/api/auth/sso/login` | GET | — |

#### `/api/auto-generate-chart-block`

| Route | Methods | Auth |
|-------|---------|------|
| `/api/auto-generate-chart-block` | POST | `requireAdmin` |

#### `/api/available-fonts`

| Route | Methods | Auth |
|-------|---------|------|
| `/api/available-fonts` | GET, POST, PUT, DELETE | `requireSession` |

#### `/api/bitly`

| Route | Methods | Auth |
|-------|---------|------|
| `/api/bitly/analytics/[linkId]` | GET | `getAdminUser` |
| `/api/bitly/associations` | DELETE | `getAdminUser` |
| `/api/bitly/links` | GET, POST | `getAdminUser` |
| `/api/bitly/links/[linkId]` | PUT, DELETE | `getAdminUser` |
| `/api/bitly/partners/associate` | POST, DELETE | `getAdminUser` |
| `/api/bitly/project-metrics/[projectId]` | GET | `requireSession` |
| `/api/bitly/pull` | POST | `getAdminUser` |
| `/api/bitly/recalculate` | GET, POST | `requireSession` |
| `/api/bitly/sync` | GET, POST | `getAdminUser` |

#### `/api/blob-upload-token`

| Route | Methods | Auth |
|-------|---------|------|
| `/api/blob-upload-token` | POST | `requireSession` |

#### `/api/chart-config`

| Route | Methods | Auth |
|-------|---------|------|
| `/api/chart-config` | GET, POST, PUT, DELETE | `getAdminUser` |
| `/api/chart-config/public` | GET | — |

#### `/api/chart-configs`

| Route | Methods | Auth |
|-------|---------|------|
| `/api/chart-configs` | GET | `requireSession` |

#### `/api/chart-formatting-defaults`

| Route | Methods | Auth |
|-------|---------|------|
| `/api/chart-formatting-defaults` | GET, PUT | `requireSession` |

#### `/api/charts`

| Route | Methods | Auth |
|-------|---------|------|
| `/api/charts` | GET, POST, DELETE | `requireSession` |

#### `/api/cities`

| Route | Methods | Auth |
|-------|---------|------|
| `/api/cities` | GET | `requireSession` |

#### `/api/clicker-sets`

| Route | Methods | Auth |
|-------|---------|------|
| `/api/clicker-sets` | GET, POST, PUT, DELETE | `requireAdmin` |

#### `/api/client-error`

| Route | Methods | Auth |
|-------|---------|------|
| `/api/client-error` | POST | — |

#### `/api/contact`

| Route | Methods | Auth |
|-------|---------|------|
| `/api/contact` | POST | — |

#### `/api/content-assets`

| Route | Methods | Auth |
|-------|---------|------|
| `/api/content-assets` | GET, POST, PUT, DELETE | `getAdminUser, requireSession` |
| `/api/content-assets/usage` | GET | `requireSession` |

#### `/api/countries`

| Route | Methods | Auth |
|-------|---------|------|
| `/api/countries` | GET | — |
| `/api/countries/[code]` | GET | — |

#### `/api/cron`

| Route | Methods | Auth |
|-------|---------|------|
| `/api/cron/analytics-aggregation` | GET, POST | `getAdminUser` |
| `/api/cron/bitly-refresh` | GET, POST | — |
| `/api/cron/google-sheets-sync` | GET | — |

#### `/api/csrf-token`

| Route | Methods | Auth |
|-------|---------|------|
| `/api/csrf-token` | GET | — |

#### `/api/data-blocks`

| Route | Methods | Auth |
|-------|---------|------|
| `/api/data-blocks` | GET, POST, PUT, DELETE | `requireAdmin` |

#### `/api/debug`

| Route | Methods | Auth |
|-------|---------|------|
| `/api/debug/categorized-hashtags` | GET | `requireSession` |
| `/api/debug/notifications` | GET | `getAdminUser` |
| `/api/debug/overview-block` | GET | `requireSession` |

#### `/api/derived-variable-config`

| Route | Methods | Auth |
|-------|---------|------|
| `/api/derived-variable-config` | GET | — |

#### `/api/drive-folders`

| Route | Methods | Auth |
|-------|---------|------|
| `/api/drive-folders` | GET, POST | `getAdminUser` |
| `/api/drive-folders/[linkId]` | PATCH, DELETE | `getAdminUser` |

#### `/api/export`

| Route | Methods | Auth |
|-------|---------|------|
| `/api/export/pdf` | GET | — |

#### `/api/filter-slug`

| Route | Methods | Auth |
|-------|---------|------|
| `/api/filter-slug` | POST | `requireSession` |

#### `/api/football-data`

| Route | Methods | Auth |
|-------|---------|------|
| `/api/football-data/fixtures` | GET | `getAdminUser` |
| `/api/football-data/sync` | POST | `getAdminUser` |

#### `/api/google-sheets`

| Route | Methods | Auth |
|-------|---------|------|
| `/api/google-sheets/template` | GET | — |

#### `/api/grid-settings`

| Route | Methods | Auth |
|-------|---------|------|
| `/api/grid-settings` | GET, PUT | `requireSession` |

#### `/api/hashtag-categories`

| Route | Methods | Auth |
|-------|---------|------|
| `/api/hashtag-categories` | GET, POST, PUT, DELETE | `requireAdmin` |

#### `/api/hashtag-colors`

| Route | Methods | Auth |
|-------|---------|------|
| `/api/hashtag-colors` | GET, POST, PUT, DELETE | `requireAdmin` |

#### `/api/hashtags`

| Route | Methods | Auth |
|-------|---------|------|
| `/api/hashtags` | GET, POST, DELETE | `requireAdmin` |
| `/api/hashtags/[hashtag]` | GET | — |
| `/api/hashtags/filter` | GET, POST | `requireSession` |
| `/api/hashtags/filter-by-slug/[slug]` | GET | `requirePageAccess` |
| `/api/hashtags/slugs` | GET | `requireSession` |

#### `/api/integrations`

| Route | Methods | Auth |
|-------|---------|------|
| `/api/integrations/camera/link-partners` | POST | `requireFanmassIntegrationAuth` |
| `/api/integrations/camera/partners` | POST | — |
| `/api/integrations/camera/provision-missing` | POST | `requireFanmassIntegrationAuth` |
| `/api/integrations/camera/sso-session` | POST | — |
| `/api/integrations/fanmass/callbacks` | POST | `requireFanmassIntegrationAuth` |
| `/api/integrations/fanmass/commands` | GET | `requireFanmassIntegrationAuth` |
| `/api/integrations/fanmass/commands/[commandId]` | DELETE | `requireFanmassIntegrationAuth` |
| `/api/integrations/fanmass/dashboard-snapshot` | POST | `requireFanmassIntegrationAuth` |
| `/api/integrations/fanmass/drive-folders` | GET | `requireFanmassIntegrationAuth` |
| `/api/integrations/fanmass/drive-folders/pending-sync` | GET | `requireFanmassIntegrationAuth` |
| `/api/integrations/fanmass/events` | POST | `requireFanmassIntegrationAuth` |
| `/api/integrations/fanmass/events/[eventId]/analysis-summary` | POST | `requireFanmassIntegrationAuth` |
| `/api/integrations/fanmass/events/[eventId]/context` | GET | `requireFanmassIntegrationAuth` |
| `/api/integrations/fanmass/events/[eventId]/drive-folders/status` | POST | `requireFanmassIntegrationAuth` |
| `/api/integrations/fanmass/events/[eventId]/link` | GET, POST | `requireFanmassIntegrationAuth` |
| `/api/integrations/fanmass/events/[eventId]/stats` | POST | `requireFanmassIntegrationAuth` |
| `/api/integrations/fanmass/events/[eventId]/sync` | GET, POST | `requireFanmassIntegrationAuth` |
| `/api/integrations/fanmass/partners` | GET, POST | `requireFanmassIntegrationAuth` |
| `/api/integrations/fanmass/partners/[partnerId]/events` | GET | `requireFanmassIntegrationAuth` |
| `/api/integrations/fanmass/rescan-requests` | GET | `requireFanmassIntegrationAuth` |
| `/api/integrations/fanmass/rescan-requests/[eventId]` | DELETE | `requireFanmassIntegrationAuth` |
| `/api/integrations/fanmass/variables` | GET, POST | `requireFanmassIntegrationAuth` |

#### `/api/landing-static`

| Route | Methods | Auth |
|-------|---------|------|
| `/api/landing-static` | GET | — |

#### `/api/notifications`

| Route | Methods | Auth |
|-------|---------|------|
| `/api/notifications` | GET | `getAdminUser` |
| `/api/notifications/mark-read` | PUT | `getAdminUser` |

#### `/api/organizations`

| Route | Methods | Auth |
|-------|---------|------|
| `/api/organizations/edit/[id]` | GET, PUT | `getAdminUser` |
| `/api/organizations/report/[id]` | GET | — |
| `/api/organizations/report/[id]/activities` | GET | — |

#### `/api/page-passwords`

| Route | Methods | Auth |
|-------|---------|------|
| `/api/page-passwords` | GET, POST, PUT, DELETE | `getAdminUser, requireSession` |

#### `/api/partners`

| Route | Methods | Auth |
|-------|---------|------|
| `/api/partners` | GET, POST, PUT, DELETE | `requireAdmin` |
| `/api/partners/[id]/bitly-kyc` | GET | `getAdminUser` |
| `/api/partners/[id]/events` | GET | `requireSession` |
| `/api/partners/[id]/google-sheet/connect` | POST | `requireSession` |
| `/api/partners/[id]/google-sheet/disconnect` | DELETE | `requireSession` |
| `/api/partners/[id]/google-sheet/provision` | POST | `requireSession` |
| `/api/partners/[id]/google-sheet/pull` | POST | `requireSession` |
| `/api/partners/[id]/google-sheet/push` | POST | `requireSession` |
| `/api/partners/[id]/google-sheet/rename` | POST | `requireSession` |
| `/api/partners/[id]/google-sheet/setup` | POST | `requireSession` |
| `/api/partners/[id]/google-sheet/status` | GET | `requireSession` |
| `/api/partners/edit/[slug]` | GET, PUT | `getAdminUser` |
| `/api/partners/link-football-data` | POST | `getAdminUser` |
| `/api/partners/report/[slug]` | GET | — |
| `/api/partners/upload-logo` | POST | `requireSession` |

#### `/api/projects`

| Route | Methods | Auth |
|-------|---------|------|
| `/api/projects` | GET, POST, PUT, DELETE | `requireAdmin` |
| `/api/projects/[id]` | GET, PUT, DELETE | `requireSession` |
| `/api/projects/edit/[slug]` | GET | `requirePageAccess` |
| `/api/projects/stats/[slug]` | GET | `requirePageAccess` |

#### `/api/public`

| Route | Methods | Auth |
|-------|---------|------|
| `/api/public/events/[id]` | GET, OPTIONS | — |
| `/api/public/partners` | GET, OPTIONS | — |
| `/api/public/partners/[id]` | GET, OPTIONS | — |
| `/api/public/partners/[id]/events` | GET, OPTIONS | — |

#### `/api/report-config`

| Route | Methods | Auth |
|-------|---------|------|
| `/api/report-config/[identifier]` | GET | — |

#### `/api/report-styles`

| Route | Methods | Auth |
|-------|---------|------|
| `/api/report-styles` | GET, POST, PUT, DELETE | — |
| `/api/report-styles/[id]` | GET | — |

#### `/api/report-templates`

| Route | Methods | Auth |
|-------|---------|------|
| `/api/report-templates` | GET, POST, PUT, DELETE | `getAdminUser` |
| `/api/report-templates/assign` | POST, DELETE | `getAdminUser` |

#### `/api/report-variants`

| Route | Methods | Auth |
|-------|---------|------|
| `/api/report-variants` | GET, POST | `getAdminUser` |
| `/api/report-variants/[id]` | GET, PUT | `getAdminUser` |

#### `/api/reports`

| Route | Methods | Auth |
|-------|---------|------|
| `/api/reports/resolve` | GET | — |

#### `/api/sports-db`

| Route | Methods | Auth |
|-------|---------|------|
| `/api/sports-db/fixtures` | GET | `getAdminUser` |
| `/api/sports-db/fixtures/draft` | POST | `getAdminUser` |
| `/api/sports-db/lookup` | GET, POST, PUT, DELETE | `requireSession` |
| `/api/sports-db/search` | GET, POST, PUT, DELETE | `requireSession` |
| `/api/sports-db/sync` | POST | `getAdminUser` |

#### `/api/stats`

| Route | Methods | Auth |
|-------|---------|------|
| `/api/stats` | GET | `requireSession` |

#### `/api/user-preferences`

| Route | Methods | Auth |
|-------|---------|------|
| `/api/user-preferences` | GET, PUT | `getAdminUser` |

#### `/api/v3`

| Route | Methods | Auth |
|-------|---------|------|
| `/api/v3/activities` | GET | — |
| `/api/v3/activities/[id]/participants` | GET, POST | — |
| `/api/v3/activities/[id]/participants/[entityId]` | DELETE | — |
| `/api/v3/entities` | GET | — |
| `/api/v3/entities/[id]` | GET | — |
| `/api/v3/health` | GET, POST | — |
| `/api/v3/metrics/record` | POST | — |
| `/api/v3/organizations/report/[id]` | GET | — |
| `/api/v3/organizations/report/[id]/activities` | GET | `getAdminUser` |
| `/api/v3/reporting/dashboard` | GET | — |
| `/api/v3/reporting/export/[entityId]` | GET | — |
| `/api/v3/reports/resolve` | GET | — |

#### `/api/variables-config`

| Route | Methods | Auth |
|-------|---------|------|
| `/api/variables-config` | GET, POST, PUT, DELETE | `requireAdmin` |

#### `/api/variables-groups`

| Route | Methods | Auth |
|-------|---------|------|
| `/api/variables-groups` | GET, POST, DELETE | `requireAdmin` |
<!-- /GENERATED:routes -->

---
## 📊 Reporting System v12 Architecture
**Last Updated: 2026-01-16T11:30:00.000Z
**Status:** Production (v12.0.0 migration in progress)
**Technical Audit:** See `docs/audits/documentation-consistency-audit-2026-06-26.md` for current documentation consistency analysis.

### Overview

The Reporting System v12 represents a complete architectural migration to a unified, type-safe chart rendering system. The system provides dynamic report generation with formula-based calculations, responsive grid layouts, PDF export, and visual editing through Builder Mode.

**Key Capabilities:**
- **Dynamic Reports**: Formula-driven charts with real-time calculation
- **6 Chart Types**: KPI, PIE, BAR, TEXT, IMAGE, VALUE (composite)
- **Responsive Grid**: CSS Grid with aspect ratio preservation
- **PDF Export**: Smart pagination with hero repetition
- **Visual Editor**: Builder Mode for inline report editing
- **Template System**: Project → Partner → Default hierarchy

### Architecture Components

#### 1. Chart Rendering Pipeline

**Data Flow:**
```
Project Stats (MongoDB)
  ↓
ReportCalculator (lib/report-calculator.ts)
  ↓ Evaluates formulas using formulaEngine
  ↓ Returns ChartResult objects
ReportContent (app/report/[slug]/ReportContent.tsx)
  ↓ Layouts blocks with CSS Grid
  ↓ Manages responsive breakpoints
ReportChart (app/report/[slug]/ReportChart.tsx)
  ↓ Renders individual chart types (all six are local to this file)
  ↓ Handles no-data states
```

#### 2. Core Components

**Primary Renderer:**
- **`app/report/[slug]/ReportChart.tsx`** - Unified v12 chart renderer
  - Supports all 6 chart types
  - Atomic component design
  - Type-safe props interface
  - No-data state handling

**Layout Management:**
- **`app/report/[slug]/ReportContent.tsx`** - Grid layout & block rendering
  - Responsive row system
  - Width measurement with ResizeObserver
  - Height calculation via blockHeightCalculator
  - Aspect ratio awareness

**Calculation Engine:**
- **`lib/report-calculator.ts`** - Formula evaluation orchestrator
  - Batch formula processing
  - Result caching
  - Error handling
  - Type conversion

**Formula Engine:**
- **`lib/formulaEngine.ts`** - Formula parsing & evaluation
  - Stats variable resolution
  - PARAM token support (marketing multipliers)
  - MANUAL token support (aggregated data)
  - Arithmetic operations

#### 3. Chart Types System

| Type | Purpose | Elements |
|------|---------|----------|
| **KPI** | Large metric display | 1 |
| **PIE** | Circular percentage | 2 |
| **BAR** | Horizontal bars | 5 |
| **TEXT** | Formatted text | 1 |
| **IMAGE** | Aspect ratio images | 1 |
| **VALUE** | Composite (KPI+BAR) | Variable |

All six render from local functions inside `ReportChart.tsx`. There is no
per-type component file; the `components/charts/` directory holds only
`ChartBase`.

A cell's width is a `LayoutUnit` -- `1 | 2` (`app/admin/visualization/page.tsx`).
An IMAGE cell's aspect ratio is not a width: it is that cell's weight in the
block height solver. See
[`docs/design/design-chart-height-system.md`](design/design-chart-height-system.md).

**Aspect Ratio Utilities:**
- **`lib/aspectRatioResolver.ts`** - ratio to the numeric weight the height
  solver multiplies by.

#### 4. Builder Mode
**Component:** `components/BuilderMode.tsx`

**Purpose:** Visual report template editor with inline inputs

**Architecture:**
```
BuilderMode
├── Template Fetching
│   ├── /api/report-config/[projectId]?type=project
│   └── Hierarchy: project → partner → default → hardcoded
├── Chart Configuration
│   ├── /api/chart-config/public
│   └── All chart definitions loaded
├── Chart Builders (Type-Specific)
│   ├── ChartBuilderKPI.tsx - 1 numeric input
│   ├── ChartBuilderBar.tsx - 5 inputs with colors
│   ├── ChartBuilderPie.tsx - 2 inputs with percentages
│   ├── ChartBuilderImage.tsx - Image uploader
│   └── ChartBuilderText.tsx - Textarea editor
└── Save Mechanism
    └── Parent EditorDashboard.saveProject()
```

**Features:**
- Auto-save on blur for all inputs
- Manual save button in header
- Loading states for template fetch
- Error recovery with fallbacks
- VALUE charts read-only (shows warning)

**Template Resolution:**
1. Project-level template (if assigned)
2. Partner-level template (if project has partner)
3. Default global template
4. Hardcoded fallback (empty state)

#### 5. Report Content Manager
**Component:** `components/ReportContentManager.tsx`

**Purpose:** Manage reportImageN and reportTextN slots (1-500)

**Features:**
- **Bulk Upload**: Multiple images → ImgBB → reportImageN slots
- **Auto-Generation**: Chart blocks created automatically via `/api/auto-generate-chart-block`
- **Slot Management**: Replace, clear, swap, compact operations
- **Usage Tracking**: Shows occupied slots

**Auto-Generation (v11.9.0 Innovation):**
```typescript
// WHAT: Automatically create chart algorithms when uploading content
// WHY: Streamline workflow - upload in Clicker → immediately available in Visualization
// HOW: API creates both chart_algorithms and data_blocks documents

// On image upload to reportImage3:
// 1. Stats updated: { reportImage3: "https://i.ibb.co/..." }
// 2. Chart created: chart_algorithms { chartId: "report-image-3", type: "image", formula: "stats.reportImage3" }
// 3. Block created: data_blocks { chartId: "report-image-3", width: 3, order: ... }
// Result: Image immediately appears in Visualization editor for drag-and-drop
```

**Slot Structure:**
- `reportImage1` through `reportImage500` - ImgBB URLs
- `reportText1` through `reportText500` - Text content
- All stored in `project.stats` (Single Reference System)

#### 7. Chart Configuration System

**Collections:**
- **`chart_algorithms`** - Chart definitions (formulas, types, elements)
- **`data_blocks`** - Layout configuration (width, order, visibility)
- **`report_templates`** - Complete report structures

**Chart Algorithm Schema:**
```typescript
interface ChartAlgorithm {
  chartId: string;              // Unique identifier
  title: string;                // Display title
  subtitle?: string;            // Optional subtitle
  type: ChartType;              // kpi | pie | bar | text | image | value
  icon: string;                 // Material Icon name
  iconVariant?: IconVariant;    // outlined | filled | rounded
  order: number;                // Display order
  showTitle?: boolean;          // Show title in chart (default: true)
  aspectRatio?: AspectRatio;    // For IMAGE charts (16:9 | 9:16 | 1:1)
  elements: ChartElement[];     // Chart-specific data
  formatting?: FormattingOptions; // Prefix, suffix, decimals
}
```

**Report Template Schema:**
```typescript
interface ReportTemplate {
  _id: ObjectId;
  name: string;
  type: 'global' | 'partner' | 'project';
  assignedTo?: ObjectId;        // Partner or Project ID
  gridSettings: {
    desktopUnits: number;       // 3-4 columns typical
    tabletUnits: number;        // 2 columns typical
    mobileUnits: number;        // 1 column
  };
  dataBlocks: DataBlock[];      // Ordered list of blocks
  createdAt: string;
  updatedAt: string;
}
```

### Performance Characteristics

**Rendering:**
- Report load time: <500ms (cached calculations)
- Builder mode load: ~1-2 seconds (template + chart config fetch)
- Chart rendering: <100ms per chart
- Grid layout: Instant (CSS Grid native)

**Formula Evaluation:**
- Simple formula: <1ms
- Complex formula (5+ operations): <5ms
- Batch evaluation (20 charts): <100ms
- Caching: Results cached per render cycle

### Error Handling

**Chart Level:**
- Formula evaluation errors → "NA" display
- Missing data → No-data placeholder
- Invalid chart type → Error message in card

**Template Level:**
- Missing template → Fallback to default
- API failures → Error state with retry
- Invalid configuration → Validation warnings

**Export Level:**
- Canvas capture failure → Error alert with helpful message
- Missing blocks → Warning in console
- Large reports → Progress indicator

### Related Documentation

- **Technical Audit:** `docs/audits/documentation-consistency-audit-2026-06-26.md`
- **Operations Notes:** `docs/operations/ops-warp.md`
- **Block Heights & Aspect Ratios:** `docs/design/design-chart-height-system.md`
- **Coding Standards:** `docs/coding-standards.md` Component patterns

### Core vs Partner Resolution (2026-03-10)

Report template, style, and clicker set are resolved in a **project → partner → default** order. Partner-level assignment is supported; event-level overrides take precedence.

| Surface | Template | Style | Clicker set |
|---------|----------|-------|-------------|
| Event report | project → partner → default | project → partner → template | N/A (view) |
| Partner report | partner → default | partner → template | N/A (view) |
| Event edit | project → partner → default | project → partner → template | partner.clickerSetId → default |
| Partner edit | partner → default | partner.styleId | N/A (content only) |

**Implementation:** `/api/report-config/[identifier]` (project/partner type); style in same resolution; variable groups via `clickerSetId` from partner. **Audit and full classification:** [docs/2026-03-09_AUDIT_CORE_VS_PARTNER_FUNCTIONS.md](2026-03-09_AUDIT_CORE_VS_PARTNER_FUNCTIONS.md) (Sections 5A, 5B, 5C).

---

## Visualization Grid System (Stats/Admin Parity)

- Shared Component: `app/report/[slug]/ReportContent.tsx` renders blocks and charts. `app/admin/visualization/page.tsx` is the builder that authors the layout it renders. (This line named `components/UnifiedDataVisualization.tsx` and the `/stats` route, both deleted.)
- Desktop Layout: Each chart defines its width in grid columns (1-N). Charts automatically wrap when their combined widths exceed the block's total available units.
- Tablet/Mobile Layout: Uses global tabletUnits and mobileUnits from page-config grid settings. Chart spans are clamped at each breakpoint to available units.
- CSS Grid System: Uses explicit `fr` units calculated from chart widths, with responsive wrapping via media queries.
- Aspect Ratio Handling: Image charts use CSS `aspect-ratio` property to maintain correct height within their allocated width.
- Data Flow: `gridSettings` (`desktopUnits` / `tabletUnits` / `mobileUnits`) live on the report template and are read by the visualization builder. There is no `/api/page-config` endpoint.
---

## Multi-User Notification System
### Overview

The multi-user notification system tracks and displays project-related activities (creation, edits, statistics updates) to all users while maintaining independent read and archive states per user. This ensures team-wide visibility with personal notification management.

### Key Features

- **Multi-User Awareness**: All users see the same notifications
- **Independent State Management**: Each user can mark notifications as read or archived independently
- **Real-Time Updates**: Badge counts update automatically via polling
- **Activity Tracking**: Captures project creation, edits, and statistics updates
- **New Event Indicator**: Animated pulse on badge when new notifications arrive
- **Archive Functionality**: Users can hide notifications without affecting other users

### Architecture Components

#### 1. Data Model

**Notifications Collection** (`notifications`)
```typescript
interface Notification {
  _id: ObjectId;
  type: 'project-created' | 'project-edited' | 'stats-updated';
  message: string;          // Human-readable notification text
  projectId: string;        // Related project ID
  projectSlug: string;      // Project slug for linking
  eventName: string;        // Project event name
  userName?: string;        // User who triggered the action (optional)
  readBy: string[];         // Array of user IDs who marked as read
  archivedBy: string[];     // Array of user IDs who archived
  createdAt: string;        // ISO 8601 timestamp with milliseconds
}
```

#### 2. API Endpoints

**Notification Management**
- `GET /api/notifications` - Fetch notifications for current user
  - Filters out archived notifications for the current user
  - Returns unread count and notification list
  - Requires authentication
- `POST /api/notifications` - Create new notification (internal use)
  - Called automatically by project operations
  - Initializes with empty readBy and archivedBy arrays
- `PUT /api/notifications/mark-read` - Mark notification as read or archive
  - Query params: `notificationId`, `action` (read | archive)
  - Adds current user ID to appropriate array
  - Requires authentication

**Diagnostic Endpoint**
- `GET /api/debug/notifications` - Production troubleshooting
  - Shows authentication status
  - Displays notification counts and recent notifications
  - Provides troubleshooting guidance

#### 3. UI Components

**NotificationPanel Component** (`components/NotificationPanel.tsx`)
- Bell icon with badge count in top header
- Dropdown panel showing notification list
- Mark as read functionality (checkmark button)
- Archive functionality (X button)
- New event indicator (animated pulse)
- Links to related projects
- Empty state messaging

**Integration Points**
- Integrated into `TopHeader` component
- Polls every 30 seconds for updates
- Updates badge count automatically
- Handles authentication and error states

#### 4. Notification Triggers

Notifications are automatically created when:

1. **Project Creation** (`POST /api/projects`)
   - Type: `project-created`
   - Message: "📊 New project created: {eventName}"

2. **Project Edit** (`PUT /api/projects`)
   - Type: `project-edited`
   - Message: "✏️ Project updated: {eventName}"

3. **Statistics Update** (via API)
   - Type: `stats-updated`
   - Message: "📈 Statistics updated for: {eventName}"

### Implementation Details

#### Multi-User State Management

1. **Array-Based Tracking**: Uses `readBy` and `archivedBy` arrays containing user IDs
2. **Independent Actions**: Each user's actions only affect their own arrays
3. **Visibility Logic**:
   - Notification visible if user ID NOT in `archivedBy`
   - Badge count includes notifications where user ID NOT in `readBy`

#### Performance Considerations

1. **Polling Strategy**: 30-second interval for badge updates (configurable)
2. **Efficient Queries**: MongoDB queries filter archived notifications server-side
3. **Index Recommendations**: Index on `createdAt` for sorting, compound index on `archivedBy` for filtering

#### Authentication Integration

1. **Session-Based**: Uses existing admin authentication system
2. **User ID Resolution**: Extracts user ID from session (email as identifier)
3. **Protection**: All endpoints require authentication via middleware

### Usage Examples

#### Fetching Notifications (Client)
```typescript
const response = await fetch('/api/notifications');
const data = await response.json();
// Returns: { success: true, notifications: [...], unreadCount: 5 }
```

#### Marking as Read
```typescript
await fetch(`/api/notifications/mark-read?notificationId=${id}&action=read`, {
  method: 'PUT'
});
```

#### Archiving Notification
```typescript
await fetch(`/api/notifications/mark-read?notificationId=${id}&action=archive`, {
  method: 'PUT'
});
```

### Benefits

1. **Team Coordination**: All users stay informed of project activities
2. **Personal Control**: Each user manages their own notification state
3. **Non-Intrusive**: Archive function removes clutter without deleting for others
4. **Audit Trail**: Complete history of project activities preserved
5. **Extensible**: Easy to add new notification types and triggers

### Troubleshooting

For production issues:
1. Use diagnostic endpoint: `/api/debug/notifications`
2. Check authentication status
3. Verify MongoDB connection
4. Review notification counts and recent entries
5. See detailed troubleshooting guide in [MULTI_USER_NOTIFICATIONS.md](docs/features/features-multi-user-notifications.md)

---

## Unified Admin System
### Overview

The Unified Admin System provides a consistent, reusable architecture for admin pages with card/list toggle, server-side search, modal CRUD operations, and responsive design. It eliminates code duplication across admin pages while maintaining flexibility for page-specific features.

**Status**: Production-Ready
**Migrated Pages**: Categories (v9.3.0), Users (v9.3.0), Projects (v10.1.0)
**Key Achievement**: Server-side search with zero client-side filtering

### Core Components

#### 1. UnifiedAdminPage (`components/UnifiedAdminPage.tsx`)
**Role**: Master wrapper orchestrating hero, search, view toggle, and data display
**Features**:
- Auto-detects client-side vs server-side search mode
- Manages view mode persistence (localStorage)
- Handles search debouncing (300ms)
- Renders UnifiedListView or UnifiedCardView based on toggle

**Props**:
```typescript
interface UnifiedAdminPageProps<T> {
  adapter: AdminPageAdapter<T>;           // Page-specific configuration
  items: T[];                             // Data to display
  isLoading?: boolean;                    // Loading state
  title: string;                          // Page title
  subtitle?: string;                      // Optional subtitle
  backLink?: string;                      // Optional back button
  actionButtons?: ActionButton[];         // Header action buttons
  enableSearch?: boolean;                 // Client-side search (default: true)
  enableSort?: boolean;                   // Client-side sort (default: true)
  externalSearchValue?: string;           // Server-side search value
  onExternalSearchChange?: (v: string) => void; // Server-side search handler
  searchPlaceholder?: string;             // Search input placeholder
  totalMatched?: number;                  // Total count for pagination stats
  showPaginationStats?: boolean;          // Show "X of Y items"
}
```

**Search Mode Detection**:
```typescript
const isServerSideSearch = externalSearchValue !== undefined && onExternalSearchChange !== undefined;
// If server-side: skip internal debouncing, pass search through immediately
// If client-side: apply debouncing and filter items locally
```

#### 2. Adapters (`lib/adapters/*.tsx`)
**Role**: Page-specific configuration defining list/card structure and actions
**Pattern**: Single adapter per admin page

**Example** (`lib/adapters/projectsAdapter.tsx`):
```typescript
export const projectsAdapter: AdminPageAdapter<ProjectDTO> = {
  pageName: 'projects',
  defaultView: 'list',
  listConfig: {
    columns: [ /* column definitions */ ],
    rowActions: [ /* CSV, View Stats, Edit, Delete */ ]
  },
  cardConfig: {
    primaryField: 'eventName',
    secondaryField: (project) => new Date(project.eventDate).toLocaleDateString(),
    metaFields: [ /* images, fans, merch, attendees */ ],
    cardActions: [ /* CSV, Edit */ ]
  },
  searchFields: ['eventName', 'hashtags', 'categorizedHashtags'],
  emptyStateMessage: 'No projects found.',
  emptyStateIcon: '🍿'
};
```

#### 3. UnifiedListView (`components/UnifiedListView.tsx`)
**Role**: Table-based data display with sortable columns
**Features**:
- Responsive table layout
- Sortable columns (visual indicators)
- Action buttons per row
- Empty state handling

#### 4. UnifiedCardView (`components/UnifiedCardView.tsx`)
**Role**: Grid-based card display
**Features**:
- Responsive grid (1-4 columns based on screen size)
- Colored accent borders
- Meta fields with icons
- Action buttons per card

#### 5. UnifiedAdminHeroWithSearch (`components/UnifiedAdminHeroWithSearch.tsx`)
**Role**: Header with title, search, view toggle, action buttons
**Features**:
- Integrated search input
- Card/list view toggle
- Primary action button ("Add New")
- Optional back button

### Server-Side Search Pattern
**Problem**: Projects page needed database search, not client-side filtering

**Solution**:
1. Parent component manages search state with `useDebouncedValue(searchQuery, 300)`
2. Parent passes debounced value to UnifiedAdminPage via `externalSearchValue`
3. UnifiedAdminPage detects server mode, skips internal debouncing
4. Parent's useEffect triggers API call when debounced value changes
5. API returns filtered results, parent updates items

**Code Pattern**:
```typescript
const [searchQuery, setSearchQuery] = useState('');
const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);

useEffect(() => {
  if (user) {
    loadProjects(true); // Fetch with debouncedSearchQuery
  }
}, [debouncedSearchQuery, sortField, sortOrder, user]);

return (
  <UnifiedAdminPage
    adapter={projectsAdapter}
    items={projects}
    enableSearch={true}
    externalSearchValue={searchQuery}
    onExternalSearchChange={setSearchQuery}
    showPaginationStats={true}
    totalMatched={totalMatched}
  />
);
```

### Files

**Core Components**:
- `components/UnifiedAdminPage.tsx` - Master wrapper
- `components/UnifiedAdminHeroWithSearch.tsx` - Header with search
- `components/UnifiedListView.tsx` - Table view
- `components/UnifiedCardView.tsx` - Grid view
- `components/UnifiedAdminViewToggle.tsx` - Card/list switcher

**Adapters**:
- `lib/adapters/categoriesAdapter.tsx`
- `lib/adapters/usersAdapter.tsx`
- `lib/adapters/projectsAdapter.tsx`
- `lib/adapters/partnersAdapter.tsx` - **Added v10.7.0** (includes Report button)
- `lib/adapters/index.ts` - Central exports

**Types**:
- `lib/adminDataAdapters.ts` - Adapter type definitions
- `lib/adminViewState.ts` - View persistence
- `lib/types/api.ts` - DTO interfaces

### Performance

- **Search**: <200ms response (MongoDB aggregation pipeline)
- **View Toggle**: <50ms (localStorage read/write)
- **Pagination**: Cursor-based (default) or offset-based (search/sort)
- **Debouncing**: 300ms to reduce API calls

---

## Admin Layout & Navigation System
### Overview

The Admin Layout & Navigation System provides a comprehensive, responsive layout framework for all {messmass} admin pages. It features a collapsible sidebar navigation, top header with user info and notifications, and adaptive behavior across desktop, tablet, and mobile devices.

**Status**: Stable, Production-Ready
**Documentation**: See [ADMIN_LAYOUT_SYSTEM (archived)](archive/_archive/deprecated-guides-2025/archive-legacy-guides-pack.md#legacy-admin_layout_system) for complete documentation
**Code Review (Archived)**: See [admin-layout-code-review-findings-2026-02-05.md](archive/_archive/admin/admin-layout-code-review-findings-2026-02-05.md)

### Key Components

#### 1. SidebarContext (`contexts/SidebarContext.tsx`)
- **Role**: Centralized state management for sidebar behavior
- **State**: `isCollapsed` (desktop/tablet) and `isMobileOpen` (mobile overlay)
- **SSR-Safe**: Pure React state, no localStorage (avoids hydration mismatches)
- **Integration**: Provider wraps entire admin layout in `app/admin/layout.tsx`

#### 2. Sidebar (`components/Sidebar.tsx`)
- **Role**: Navigation menu with responsive behavior
- **Navigation Sections**: Content, Configuration, Settings, Help
- **Active Detection**: Uses `usePathname()` with `startsWith()` logic
- **Accessibility**: `role="navigation"`, ARIA attributes, keyboard navigation
- **Mobile**: Hamburger toggle, backdrop click/Escape to close, body scroll lock

#### 3. AdminLayout (`components/AdminLayout.tsx`)
- **Role**: Layout wrapper providing structure for all admin pages
- **Composition**: Fixed sidebar + main wrapper (header + content)
- **Dynamic Margins**: Content margin adjusts based on sidebar state
- **Max-width**: Content limited to 1600px for readability

#### 4. TopHeader (`components/TopHeader.tsx`)
- **Role**: Top navigation bar with user info, notifications, and logout
- **Features**: Welcome message, notification bell (integrated with NotificationPanel), user avatar, logout button
- **Policy**: No breadcrumbs (per WARP.md policy)
- **Integration**: Notification system uses 30-second polling

### Component Relationships & Data Flow

```
app/admin/layout.tsx (Server Component)
  ├─> Fetches admin user + style settings
  └─> SidebarProvider (Context)
      └─> AdminLayout (Client Component)
          ├─> Sidebar (consumes SidebarContext)
          └─> mainWrapper
              ├─> TopHeader (user, notifications)
              └─> main content (children pages)
```

### Responsive Behavior

| Breakpoint | Sidebar Width | Behavior | State Variable |
|------------|---------------|----------|----------------|
| Desktop (≥1280px) | 280px expanded / 80px collapsed | User toggles with button | `isCollapsed` |
| Tablet (768-1279px) | 80px (auto-collapsed rail) | Icons only, labels hidden | `isCollapsed` (CSS) |
| Mobile (<768px) | Overlay (off-canvas) | Hamburger menu opens drawer | `isMobileOpen` |

**Main Content Margins**:
- Desktop expanded: `margin-left: 280px`
- Desktop/tablet collapsed: `margin-left: 80px`
- Mobile: `margin-left: 0` (sidebar is overlay)

### Design System Integration

**CSS Modules**: All components use scoped CSS Modules
**Theme Tokens**: Leverages `app/styles/theme.css` for colors, spacing, typography
**Tokens Used**: `--mm-space-*`, `--mm-gray-*`, `--mm-color-primary-*`, `--mm-shadow-*`, `--z-*`

**Tech Debt** (documented in CODE_REVIEW_FINDINGS):
- Hard-coded widths (280px, 80px) should be tokenized
- Hard-coded breakpoints (768px, 1280px) should be tokenized
- Missing tooltips on collapsed sidebar icons
- Missing skip-to-content link (WCAG 2.4.1)

### Accessibility

**Compliance**: WCAG 2.1 Level AA Compliant
- ✅ Keyboard navigation (Tab, Enter, Escape)
- ✅ ARIA attributes (`role`, `aria-label`, `aria-expanded`, `aria-controls`)
- ✅ Color contrast meets 4.5:1 minimum
- ✅ Touch targets ≥44x44px
- ✅ Focus-visible styles

### Usage Pattern

All admin pages automatically inherit the layout via `app/admin/layout.tsx`. No explicit imports required:

```tsx
// app/admin/my-feature/page.tsx
export default function MyFeaturePage() {
  return (
    <div>
      <h1>My Feature</h1>
      {/* Sidebar, header, and layout applied automatically */}
    </div>
  );
}
```

To access sidebar state in child components:
```typescript
import { useSidebar } from '@/contexts/SidebarContext';
const { isCollapsed, setIsCollapsed } = useSidebar();
```

### Performance

- ✅ Zero unnecessary re-renders
- ✅ Static navigation data (no fetch required)
- ✅ Optimized conditional rendering
- ✅ CSS Modules tree-shakable
- ✅ No heavy dependencies

## Guided Tour System
### Overview

A manually-triggered spotlight/backdrop product tour for the admin panel — a dark backdrop with a cutout highlighting one nav item at a time, plus a step-by-step tooltip. No auto-start: a "Guided tours" entry point in `TopHeader.tsx` opens a menu offering a short welcome tour (introduces the six sidebar sections) and one tour per section (Operations, Entities, Reports, Data, Analytics, System). No equivalent existed anywhere in this codebase or its dependencies before this — see `components/tour/`, `lib/tour/`.

### Key Components

#### 1. `useTourController` (`lib/tour/useTourController.ts`)
- **Role**: Step-sequencing state (`start`/`next`/`back`/`skip`) for one tour
- **Integration**: Registers with `@sovereignsquad/gds-core`'s `OverlayManagerProvider` as a `popover` overlay, so a tour yields correctly to the notification panel or any other overlay instead of running its own independent stack
- **Note**: `next()` reads `currentIndex` from the hook's closure rather than a `setCurrentIndex` functional updater — the alternative called a side-effecting `finish()` (mutating a *different* component's overlay state) from inside a value React can invoke during another component's render pass, which is unsafe

#### 2. `TourOverlay` (`components/tour/TourOverlay.tsx`)
- **Role**: Presentational spotlight/backdrop/tooltip renderer, purely driven by a `TourController`
- **Measurement**: `getBoundingClientRect()` against `[data-tour-id="..."]`, tracked live via `ResizeObserver` + `resize`/`scroll` listeners
- **Retry**: polls briefly (~3s) for a target that hasn't mounted yet before concluding it genuinely won't appear and auto-skipping the step — tracked via a separate `measuring` boolean so a not-yet-mounted target renders nothing rather than a misleading centered dialog

#### 3. `TourMenu` (`components/tour/TourMenu.tsx`)
- **Role**: The "Guided tours" entry point — an `ActionIcon` + dropdown panel in `TopHeader.tsx`, structured like the existing `NotificationPanel.tsx` (outside-click-to-close, Escape-to-close, focus-on-open) for consistency with that already-proven pattern
- **Role filtering**: fetches the current user's role via `/api/admin/auth` (same call `Sidebar.tsx` already makes) and hides any tour with zero accessible items for that role, via `canAccessMenuItem` (`lib/permissions.ts`)
- **Ownership**: mounts all seven `useTourController` instances (welcome + 6 segments) and their `TourOverlay`s; none auto-start

#### 4. Step content (`lib/tour/config/segmentTourSteps.ts`, `welcomeTourSteps.ts`)
- Segment tour steps are **derived** from `lib/adminNavigation.ts`'s `adminNavSections` — each nav item's existing `label`/`description` (already authored, shown as hover text) becomes the step's title/description, so tour copy and nav copy can't drift apart
- `AdminNavItem` gained an optional `tourDescription?: string` field, used only where the existing `description` assumed knowledge a first-time reader wouldn't have (e.g. "KYC Variables", "Clicker Sets", "Reporting Workspace") — `description` remains the fallback and the default for every item where it already reads fine standalone
- The welcome tour targets `data-tour-id="nav-section-<key>"` (one per sidebar section) and drops any section with zero accessible items for the current role, since `Sidebar.tsx` itself doesn't render that section's wrapper when nothing inside it is visible

### `data-tour-id` convention

The only DOM-targeting-attribute convention in this codebase so far (no prior `data-testid`/`data-tour-id` existed anywhere). Added directly to `components/Sidebar.tsx`'s existing nav `<li>` elements and section wrapper `<div>`s:
- `data-tour-id="nav-<path>"` on each nav item (parent and child)
- `data-tour-id="nav-section-<key>"` on each section wrapper

### Persistence

`lib/tour/storage.ts` — plain exported functions (`hasTourBeenSeen`/`markTourSeen`), SSR-guarded, try/catch, mirroring `lib/adminViewState.ts`'s existing style rather than introducing a new persistence pattern. `localStorage` keys: `mm-tour-<tourId>`.

### Provider scope

`OverlayManagerProvider` is mounted in `components/AdminLayout.tsx`, not the app-wide `app/providers.tsx` — deliberately scoped to the admin layout only, since public report pages (`/report/[slug]`, etc.) share the root providers and have no need for overlay-manager machinery.

### Accessibility

`role="dialog"` `aria-modal="true"` tooltip, manual Tab focus-trap, `Escape` to skip, `aria-live="polite"` step announcements, `prefers-reduced-motion` disables the spotlight-move transition, focus returns to the triggering element on exit.

---

## Security Enhancements — API Protection & Observability
### Overview

The Security Enhancements system provides comprehensive API protection through rate limiting, CSRF protection, and centralized logging. These layers work together to protect against abuse, ensure request authenticity, and provide operational visibility.

**Status**: Production-Ready
**Documentation**: See [security-enhancements.md](security/security-enhancements.md) and [security-migration-guide.md](security/security-migration-guide.md)

### Key Components

#### 1. Rate Limiting Module (`lib/rateLimit.ts`)
- **Algorithm**: Fixed-window request counter per identifier (not a token bucket) — a window opens on the first request and resets once `resetTime` has passed
- **Endpoint Types** (current `RATE_LIMITS`, one config per endpoint class):
  - Auth (`/api/admin/login`, `/api/auth/*`, excluding DELETE/logout): 5 requests / 15 minutes
  - Write (POST/PUT/PATCH/DELETE, generally): 30 requests/minute
  - Read (GET, generally): 500 requests/minute
  - Public (`/stats/*`, `/hashtag/*`): 60 requests/minute
  - Contact form (`POST /api/contact`): 5 requests / 15 minutes
  - PDF export (`app/api/export/pdf`): 6 requests/minute
- **Storage**: In-memory `Map`, keyed by `<client-identifier>:<pathname>`, with automatic cleanup (suitable for single-instance deployment)
- **Response Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` (plus `Retry-After` when a request is blocked)
- **Retry-After**: Not a fixed cooldown — computed per request as the time remaining until that identifier's window resets

**Features**:
- Per-IP tracking (`X-Forwarded-For`, falling back to `X-Real-Ip` then the `Host` header)
- Entries older than 24 hours are swept every hour by an unref'd interval timer (so it never keeps a process, including a test run, alive on its own)
- Structured logging integration via `lib/logger.ts` (`logRateLimitExceeded`)

**Configuration** (`RATE_LIMITS`, abbreviated):
```typescript
export const RATE_LIMITS = {
  AUTH:    { windowMs: 15 * 60 * 1000, maxRequests: 5 },
  WRITE:   { windowMs: 60 * 1000,      maxRequests: 30 },
  READ:    { windowMs: 60 * 1000,      maxRequests: 500 },
  PUBLIC:  { windowMs: 60 * 1000,      maxRequests: 60 },
  CONTACT: { windowMs: 15 * 60 * 1000, maxRequests: 5 },
  EXPORT:  { windowMs: 60 * 1000,      maxRequests: 6 },
} as const;
```

#### 2. CSRF Protection Module (`lib/csrf.ts`)
- **Pattern**: Double-submit cookie (secure, HttpOnly, SameSite=Lax)
- **Token Generation**: Cryptographically secure random tokens (32 bytes, hex-encoded)
- **Validation**: Compares cookie token with request header token
- **Protected Methods**: POST, PUT, DELETE, PATCH
- **Excluded Paths**: GET, HEAD, OPTIONS, and public endpoints

**Integration Points**:
- Middleware sets CSRF cookie on first request
- `/api/csrf-token` endpoint for AJAX token retrieval
- `apiClient` wrapper automatically includes token in headers

**Security Features**:
- HttpOnly cookies prevent XSS token theft
- SameSite=Lax prevents CSRF attacks
- Constant-time comparison prevents timing attacks
- Token rotation on validation failure

#### 3. Centralized Logging System (`lib/logger.ts`)
- **Output**: Structured JSON (production) or human-readable (development)
- **Log Levels**: DEBUG, INFO, WARN, ERROR
- **Sensitive Data Redaction**: Passwords, tokens, cookies automatically redacted
- **Integration**: Winston-compatible (ready for CloudWatch, Datadog)

**Log Types**:
- Request lifecycle (start, end, error)
- Security events (rate limit exceeded, CSRF violation)
- Application errors with stack traces
- Performance metrics (request duration)

**Usage Example**:
```typescript
import { logRequestStart, logRequestEnd, logRequestError } from '@/lib/logger';

const startTime = logRequestStart({ method: 'GET', pathname: '/api/projects', ip: '127.0.0.1' });
// ... handle request
logRequestEnd(startTime, { method: 'GET', pathname: '/api/projects' }, 200);
```

#### 4. Client API Wrapper (`lib/apiClient.ts`)
- **Purpose**: Transparent CSRF token management for client-side requests
- **Features**:
  - Automatic CSRF token fetching and caching
  - Token injection in request headers
  - Unified error handling (rate limits, CSRF violations)
  - TypeScript-safe JSON handling

**Exported Functions**:
```typescript
export async function apiGet<T>(url: string): Promise<T>
export async function apiPost<T>(url: string, data: any): Promise<T>
export async function apiPut<T>(url: string, data: any): Promise<T>
export async function apiDelete<T>(url: string): Promise<T>
export async function apiRequest<T>(url: string, options: RequestInit): Promise<T>
```

**Migration Path**: Replace raw `fetch()` calls with `apiClient` functions

#### 5. Security Middleware (`middleware.ts`)
- **Integration**: Next.js middleware pipeline
- **Applied To**: All API routes, admin pages, public stats pages
- **Excluded**: Static assets (/_next/*, /favicon.ico, etc.)

**Execution Order**:
1. Rate limiting check
2. CSRF token validation (for state-changing requests)
3. Request logging (start)
4. Route handler execution
5. Request logging (end)

**Response Modifications**:
- Sets CSRF cookie if missing
- Adds rate limit headers
- Logs security violations

### Security Benefits

1. **DDoS Protection**: Rate limiting prevents API abuse and resource exhaustion
2. **CSRF Prevention**: Double-submit cookie pattern blocks cross-site request forgery
3. **Audit Trail**: Centralized logging provides complete request history
4. **Attack Detection**: Security violations logged for monitoring
5. **Performance Monitoring**: Request duration tracking identifies bottlenecks

### Troubleshooting

**Common Issues**:

1. **"CSRF token invalid" error**:
   - Cause: Missing or expired token
   - Solution: Use `apiClient` instead of raw `fetch`, clear cookies

2. **Rate limit exceeded**:
   - Cause: Too many requests in short time
   - Solution: Implement exponential backoff, increase limits if legitimate

3. **Missing CSRF token cookie**:
   - Cause: First request hasn't set cookie yet
   - Solution: `apiClient` auto-fetches token via `/api/csrf-token`

### Migration Guide

See [security-migration-guide.md](security/security-migration-guide.md) for step-by-step migration instructions, including:
- Replacing `fetch()` calls with `apiClient`
- Adding logging to API routes
- Testing security features
- Performance validation

---

## Admin Variables & Metrics Management System
### Overview

**🚀 MAJOR ARCHITECTURE CHANGE**: The Variable System has been completely migrated to a **database-first architecture** with **Single Reference System** using full database paths.

**Key Changes**:
- ✅ ALL variables stored in MongoDB `variables_metadata` collection
- ✅ Full database paths used everywhere: `stats.female`, `stats.remoteImages`
- ✅ No code changes needed to add variables - fully dynamic via admin UI
- ✅ UI aliases for display names (e.g., "Women" for `stats.female`)
- ✅ System variables (schema fields) protected from deletion
- ✅ In-memory caching for performance (5-minute TTL)

**Status**: Production-Ready
**Documentation**: See [VARIABLES_DATABASE_SCHEMA.md (archived)](archive/_archive/legacy-variable-system/archive-variables-database-schema.md) and [ADMIN_VARIABLES_SYSTEM.md (archived)](archive/_archive/legacy-variable-system/archive-admin-variables-system.md)

### Core Principles

#### Single Reference System

**WHAT**: Use full MongoDB document paths as canonical reference everywhere
**WHY**: Zero translation layer = zero confusion, one source of truth
**HOW**: Database path `stats.female` = Formula token `[stats.female]` = Code reference `stats.female`

**Rules**:
- ✅ **Code/Formulas**: Always use full path `stats.female`
- ✅ **Database**: Store as `{ stats: { female: 120 } }`
- ✅ **UI Display**: Show alias "Women" OR full path "stats.female" (user choice in KYC)
- ❌ **Never**: Use short aliases in code or formulas

### Architecture Components

#### 1. Variables Metadata Collection (`variables_metadata`)

**Role**: Single source of truth for ALL variables (system + custom)

**Schema**:
```typescript
interface VariableMetadata {
  _id: ObjectId;
  name: string;                    // Full DB path: "stats.female", "stats.remoteImages"
  label: string;                   // Display name: "Female", "Remote Images"
  type: 'count' | 'percentage' | 'currency' | 'numeric' | 'text' | 'boolean' | 'date';
  category: string;                // "Images", "Demographics", etc.
  description?: string;
  unit?: string;                   // "€", "%", "clicks"
  derived: boolean;                // True for computed variables
  formula?: string;                // Formula using full paths: "stats.female + stats.male"
  flags: {
    visibleInClicker: boolean;     // Show in Editor clicker buttons
    editableInManual: boolean;     // Allow manual editing
  };
  isSystem: boolean;               // True = cannot delete (schema fields)
  order: number;                   // Sort order within category
  alias?: string;                  // User-defined display alias (UI only)
  createdAt: string;               // ISO 8601 with milliseconds (UTC)
  updatedAt: string;
  createdBy?: string;              // "system" or user ID
  updatedBy?: string;
}
```

**System vs Custom Variables**:
- **System** (`isSystem: true`): Schema fields, cannot delete, can edit metadata
- **Custom** (`isSystem: false`): User-created, full CRUD control

#### 2. Variables Configuration API (`/api/variables-config`)

**Endpoint**: `GET /POST /api/variables-config`

**GET Response**:
```json
{
  "success": true,
  "variables": [
    {
      "name": "stats.female",
      "label": "Female",
      "type": "count",
      "category": "Demographics",
      "derived": false,
      "flags": {
        "visibleInClicker": true,
        "editableInManual": true
      },
      "isSystem": true,
      "order": 0
    }
  ],
  "count": 92,
  "cached": true
}
```

**Features**:
- In-memory cache (5-minute TTL)
- Cache invalidation on variable mutations
- Sorted by category → order → label

#### 3. Variable Seeding System

**Command**: none — the `seed:variables` script was removed in v12.3.36 (scripts prune, messmass#352); variables are managed in `/admin/kyc`.

**Purpose**: Migrate all base/derived variables from code registry to MongoDB

**Process**:
1. Read `lib/variablesRegistry.ts` (BASE_STATS_VARIABLES + DERIVED_VARIABLES)
2. Upsert each to `variables_metadata` with `isSystem: true`
3. Create performance indexes
4. Verify seeding success

**Idempotency**: Can run multiple times safely (uses upsert)

#### 4. KYC Variables Admin (`/app/admin/kyc/page.tsx`)

**Features**:
- View all variables (system + custom) with metadata
- Search and filter by source (manual/system/derived/text), flags, categories
- Edit variable metadata (label, category, description)
- Create custom variables via modal
- Export to CSV/JSON
- **Alias Management**: Set user-friendly display names

**UI Display**:
- Shows full database path: `stats.female` in `<code>` block
- Shows display label: "Female"
- Shows alias if set: "Women" (badge)
- Lock icon for system variables (cannot delete)

#### 5. Clicker Variables Manager (`app/admin/clicker-manager/page.tsx`)

**Purpose**: Control which variables appear in Editor clicker and their button order

**Features**:
- Drag-and-drop button reordering within categories
- Toggle visibleInClicker / editableInManual flags
- Group management for Editor layout
- Integration with KPI charts

### Data Model

**Variable Definition (Registry)**
```typescript
interface VariableDefinition {
  name: string;           // camelCase identifier
  label: string;          // Display name
  type: 'count' | 'percentage' | 'currency' | 'numeric' | 'text';
  category: string;       // Grouping (Images, Fans, Demographics, etc.)
  description?: string;
  derived?: boolean;      // True for computed variables
  formula?: string;       // Formula string for derived variables
  aliases?: string[];     // Alternative names
}
```

**Variable Config (Database)**
```typescript
interface VariableConfigDoc {
  _id: string;            // Equals name for easy upsert
  name: string;
  label?: string;         // Override registry label
  type?: string;          // Override registry type
  category?: string;      // Override registry category
  derived?: boolean;
  formula?: string;
  isCustom?: boolean;     // True for user-defined variables
  flags: {
    visibleInClicker: boolean;    // Show in Editor Clicker UI
    editableInManual: boolean;    // Allow manual editing
  };
  clickerOrder?: number;  // Button position in Clicker
  manualOrder?: number;   // Field position in Manual mode
  createdAt: string;      // ISO 8601 with milliseconds
  updatedAt: string;      // ISO 8601 with milliseconds
}
```

**Variable Group (Database)**
```typescript
interface VariableGroup {
  _id?: string;
  groupOrder: number;         // Display sequence
  chartId?: string;           // KPI chart to show above variables
  titleOverride?: string;     // Custom section title
  variables: string[];        // Ordered array of variable names
}
```

### Visibility & Editability Flags

**Default Flags by Category**:
- **Images, Fans, Demographics, Merchandise**: `{ visibleInClicker: true, editableInManual: true }`
- **Moderation, Visits, Event**: `{ visibleInClicker: false, editableInManual: true }`
- **Derived/Text**: `{ visibleInClicker: false, editableInManual: false }`

**Rationale**:
- Clicker designed for high-frequency live event metrics
- Manual mode for post-event data entry (all base stats)
- Derived/text variables are computed or non-numeric

### Variable Groups Manager

**Purpose**: Controls Editor dashboard layout by organizing variables into themed sections with optional KPI charts.

**Default Groups** (initialized via "Initialize default groups"):
1. **Images** (order 1) — remoteImages, hostessImages, selfies + `all-images-taken` chart
2. **Location** (order 2) — remoteFans, stadium + `total-fans` chart
3. **Demographics** (order 3) — female, male, genAlpha, genYZ, genX, boomer
4. **Merchandise** (order 4) — merched, jersey, scarf, flags, baseballCap, other

**API**: `/api/variables-groups` (GET/POST/DELETE)

### Custom Variables

**Purpose**: Allows admins to define project-specific metrics beyond base registry (e.g., `vipGuests`, `pressAttendees`).

**Creation Flow**:
1. Click "New Variable" in Admin Variables page
2. Fill form: name (camelCase), label, type, category, flags
3. Variable persisted with `isCustom: true` in MongoDB
4. Values stored in `project.stats` alongside base variables

**Deletion**: Custom variables deletable via "🗑️ Delete" button (admin has full CRUD control).

### Integration with Editor

**Editor Dashboard Consumption** (`/app/edit/[slug]/page.tsx`):
1. Fetches `/api/variables-config` on mount
2. Filters for Clicker: `visibleInClicker === true`

---

## Chart System Enhancement Phase B
### Overview

Chart System Enhancement Phase B transforms the Chart Algorithm Manager from hardcoded formulas to a fully flexible, data-driven system with parameterized values, Bitly enrichment charts, and support for aggregated analytics.

**Status**: Production-Ready
**Release**: v6.10.0 (2025-01-16)
**Components**: Formula engine extensions, 3 Bitly charts, parameter migration

### Phase B.1: Parameterized Marketing Multipliers

#### Overview

Enables marketing teams to tune CPM values and multipliers without code changes by introducing `[PARAM:key]` tokens in formulas.

**Before** (Hardcoded):
```typescript
formula: "([remoteImages] + [hostessImages] + [selfies]) * 4.87"
```

**After** (Parameterized):
```typescript
formula: "([remoteImages] + [hostessImages] + [selfies]) * [PARAM:cpmEmailOptin]",
parameters: {
  cpmEmailOptin: {
    value: 4.87,
    label: "Email Opt-in CPM",
    unit: "EUR",
    description: "€4.87 avg market cost per email opt-in in Europe, 2025"
  }
}
```

#### Implementation

**Formula Engine Extension** (`lib/formulaEngine.ts`):
```typescript
// Updated signature to accept parameters
export function evaluateFormula(
  formula: string,
  stats: ProjectStats,
  parameters?: Record<string, number>,
  manualData?: Record<string, number>
): number | 'NA'

// PARAM token substitution
if (parameters) {
  processedFormula = processedFormula.replace(
    /\[PARAM:([a-zA-Z0-9_]+)\]/g,
    (_match, paramKey) => {
      const value = parameters[paramKey];
      return value !== undefined ? String(value) : '0';
    }
  );
}
```

**ChartElement Type Extension** (`lib/chartConfigTypes.ts`):
```typescript
interface ChartElement {
  id: string;
  label: string;
  formula: string;
  color: string;
  description?: string;

  parameters?: {
    [key: string]: {
      value: number;
      label: string;
      description: string;
      unit?: string; // "EUR", "%", "count", "multiplier"
    }
  };
}
```

**Value Chart Migration** (`scripts/parameterize-value-chart.js`):
- Migrated 5 Value chart elements to use `[PARAM:x]` tokens
- Parameters: `cpmEmailOptin`, `cpmEmailAddon`, `cpmStadiumAd`, `exposureRatio`, `premiumContactValue`, `sharedImages`, `avgViews`, `cpmSocialOrganic`
- All parameters documented with EUR values and descriptions

#### Benefits

1. **Marketing Flexibility**: Update CPM values via MongoDB without code deployment
2. **Regional Adaptation**: Different parameter sets per region or partner
3. **A/B Testing**: Test different multiplier values without formula changes
4. **Audit Trail**: Parameters stored with metadata (source, date, rationale)

### Phase B.2: Bitly Enrichment Charts

#### Overview

Three new charts visualize Bitly clickstream data (device types, traffic sources, geographic reach) when Bitly integration is active.

#### New Charts Created

**1. Bitly Device Split** (Pie Chart, Order 35)
```typescript
{
  chartId: 'bitly-device-split',
  title: 'Bitly Device Split',
  type: 'pie',
  emoji: '📱',
  elements: [
    { label: 'Mobile', formula: '[bitlyMobileClicks]', color: '#3b82f6' },
    { label: 'Desktop + Tablet', formula: '[bitlyDesktopClicks] + [bitlyTabletClicks]', color: '#8b5cf6' }
  ]
}
```

**2. Bitly Referrers** (Bar Chart, Order 36)
```typescript
{
  chartId: 'bitly-referrers',
  title: 'Bitly Referrers',
  type: 'bar',
  elements: [
    { label: 'QR Code', formula: '[bitlyQrCodeClicks]', color: '#10b981' },
    { label: 'Instagram', formula: '[bitlyInstagramMobileClicks] + [bitlyInstagramWebClicks]', color: '#ec4899' },
    { label: 'Facebook', formula: '[bitlyFacebookMobileClicks] + [bitlyFacebookMessengerClicks]', color: '#3b82f6' },
    { label: 'Other Social', formula: '[bitlySocialClicks]', color: '#8b5cf6' },
    { label: 'Direct', formula: '[bitlyDirectClicks]', color: '#6b7280' }
  ]
}
```

**3. Bitly Geographic Reach** (KPI Chart, Order 37)
```typescript
{
  chartId: 'bitly-geographic-reach',
  title: 'Bitly Geographic Reach',
  type: 'kpi',
  emoji: '🌍',
  elements: [
    { label: 'Countries Reached', formula: '[bitlyCountryCount]', color: '#3b82f6' }
  ]
}
```

#### Bitly Variables Added (25 total)

**Core Metrics**:
- `bitlyTotalClicks`, `bitlyUniqueClicks`

**Geographic**:
- `bitlyClicksByCountry`, `bitlyTopCountry`, `bitlyCountryCount`

**Traffic Sources (Platform-level)**:
- `bitlyDirectClicks`, `bitlySocialClicks`, `bitlyTopReferrer`, `bitlyReferrerCount`

**Referring Domains (Granular)**:
- `bitlyTopDomain`, `bitlyDomainCount`, `bitlyQrCodeClicks`, `bitlyInstagramMobileClicks`, `bitlyInstagramWebClicks`, `bitlyFacebookMobileClicks`, `bitlyFacebookMessengerClicks`

**Device & Platform**:
- `bitlyMobileClicks`, `bitlyDesktopClicks`, `bitlyTabletClicks`, `bitlyiOSClicks`, `bitlyAndroidClicks`

**Browsers**:
- `bitlyChromeClicks`, `bitlySafariClicks`, `bitlyFirefoxClicks`

#### Data Requirements

Bitly charts display "NA" if project lacks Bitly data. Expected data source:
- Bitly API analytics aggregated into `project.stats` (future implementation)
- Manual entry via Admin Variables (interim solution)

### Phase B.3: Manual Data Token Support

#### Overview

Enables `[MANUAL:key]` tokens for aggregated analytics data that doesn't belong in individual project stats (e.g., hashtag seasonality, partner benchmarks).

#### Implementation

**Formula Engine Extension**:
```typescript
// MANUAL token substitution
if (manualData) {
  processedFormula = processedFormula.replace(
    /\[MANUAL:([a-zA-Z0-9_]+)\]/g,
    (_match, manualKey) => {
      const value = manualData[manualKey];
      return value !== undefined ? String(value) : '0';
    }
  );
}
```

**ChartElement Type Extension**:
```typescript
interface ChartElement {
  // ... existing fields
  manualData?: {
    [key: string]: number; // Simple key-value map for aggregated data
  };
}
```

**Validation Support**:
- `[PARAM:x]` and `[MANUAL:x]` tokens always considered valid
- No mapping required in VARIABLE_MAPPINGS
- Resolved externally at evaluation time

#### Use Cases

**Hashtag Seasonality** (Future):
```typescript
formula: "[MANUAL:q1EventCount] + [MANUAL:q2EventCount] + [MANUAL:q3EventCount]",
manualData: {
  q1EventCount: 45, // Pre-aggregated from MongoDB query
  q2EventCount: 62,
  q3EventCount: 38
}
```

**Partner Benchmarks** (Future):
```typescript
formula: "[MANUAL:avgFansPerEvent] / [totalFans] * 100",
manualData: {
  avgFansPerEvent: 4200 // Computed across all partner events
}
```

### Integration Points

**Chart Calculator** (`lib/chartCalculator.ts`):
```typescript
// Extract parameters and manualData from element
const paramValues = element.parameters
  ? Object.fromEntries(Object.entries(element.parameters).map(([k, v]) => [k, v.value]))
  : undefined;

const manualValues = element.manualData;

const value = evaluateFormula(element.formula, stats, paramValues, manualValues);
```

## Advanced Chart Formatting System with VALUE Chart Type
### Overview

The Advanced Chart Formatting System replaces hardcoded type-based formatting with a flexible, configurable interface supporting custom prefix/suffix combinations and decimal precision control. This enables white-label deployments with multiple currencies and custom units without code changes.

**Status**: Production-Ready
**Release**: v8.17.0 (2025-10-31)
**Components**: ChartValueFormatting interface, VALUE chart type, dual formatting UI, API validation

### Key Features

#### 1. ChartValueFormatting Interface

```typescript
interface ChartValueFormatting {
  rounded?: boolean;  // true = whole numbers, false = 2 decimal places
  prefix?: string;    // Custom prefix (€, $, £, etc.)
  suffix?: string;    // Custom suffix (%, pts, etc.)
}
```

**Benefits**:
- **White-Label Ready**: Configure currency symbols per deployment ($, €, £, ¥, etc.)
- **Flexible Units**: Support any prefix/suffix (%, pts, units, goals, etc.)
- **Precision Control**: Toggle between whole numbers and 2 decimal places
- **No Code Changes**: All configuration via MongoDB or Admin UI

#### 2. NEW: VALUE Chart Type

**Purpose**: Financial dashboards combining KPI total with horizontal bar breakdown

**Requirements**:
- **Exactly 5 elements** (validated at API and component level)
- **Dual formatting configs**:
  - `kpiFormatting` - Separate formatting for large total display
  - `barFormatting` - Unified formatting for all 5 bar elements
- **Layout Support**: Portrait and landscape orientations

**Visual Structure**:
```
┌─────────────────────────┐
│  €142,500 ← KPI total   │ (uses kpiFormatting)
│                         │
│  Element 1: €45,000 ━━━ │ (uses barFormatting)
│  Element 2: €32,000 ━━  │
│  Element 3: €28,000 ━   │
│  Element 4: €22,000 ━   │
│  Element 5: €15,500 ━   │
└─────────────────────────┘
```

**Example Configuration**:
```typescript
{
  chartId: 'total-ad-value',
  title: 'Total Ad Value',
  type: 'value',
  emoji: '💰',
  kpiFormatting: {
    rounded: true,
    prefix: '€',
    suffix: ''
  },
  barFormatting: {
    rounded: true,
    prefix: '€',
    suffix: ''
  },
  elements: [
    { label: 'Email', formula: '[allImages] * [PARAM:cpmEmailOptin]', ... },
    { label: 'Social', formula: '[allImages] * [PARAM:cpmSocialOrganic]', ... },
    { label: 'Stadium', formula: '[indoor] * [PARAM:cpmStadiumAd]', ... },
    { label: 'Premium', formula: '[genYZ] * [PARAM:premiumContactValue]', ... },
    { label: 'Reoptin', formula: '[allImages] * [PARAM:cpmEmailAddon]', ... }
  ]
}
```

#### 3. Updated Chart Components

**Value Chart Rendering** (`app/report/[slug]/ReportChart.tsx`):
- Uses the current report renderer with dual formatting support
- Validates the required value-chain shape before display
- Supports responsive portrait and landscape report layouts
- Uses large KPI display plus supporting value rows/bars where configured

**Existing Chart Updates**:
- **PieChart**: Updated to use `formatting` field (backward compatible)
- **BarChart**: Updated with flexible total formatting and **50/50 fixed layout** (v9.2.1)
  - **Layout**: Bar (50% left) | Legend (50% right) with `grid-template-columns: 1fr 1fr`
  - **Text Overflow**: Legend uses `.text-fade-end` utility (5% gradient fade to `var(--mm-white)`)
  - **Purpose**: Ensures consistent bar widths regardless of legend text length
  - **Design Tokens**: All spacing, colors, transitions use CSS variables (no hardcoded values)
- **KPIChart**: Maintains compatibility with legacy `type` field

**Backward Compatibility**:
```typescript
// Legacy mode (still works)
{ type: 'currency' } → displays as "€1,234.56"
{ type: 'percentage' } → displays as "45.67%"

// New mode (preferred)
{ formatting: { rounded: true, prefix: '€', suffix: '' } } → displays as "€1,235"
```

#### 4. formatChartValue() Function

**Updated Signature** (`lib/chartCalculator.ts`):
```typescript
function formatChartValue(
  value: number | 'NA',
  formatting?: { rounded?: boolean; prefix?: string; suffix?: string },
  type?: 'currency' | 'percentage' | 'number' // DEPRECATED, for backward compatibility
): string
```

**Logic**:
1. If `value === 'NA'`, return `'N/A'`
2. If `formatting` provided (new mode):
   - Round to 0 or 2 decimal places based on `rounded` flag
   - Use `toLocaleString()` for thousands separators
   - Return `prefix + number + suffix`
3. Else if `type` provided (legacy mode):
   - Apply hardcoded formatting based on type
4. Else: Return raw number with 2 decimals

**Examples**:
```typescript
formatChartValue(1234.567, { rounded: true, prefix: '€', suffix: '' })
// → "€1,235"

formatChartValue(0.4567, { rounded: false, prefix: '', suffix: '%' })
// → "0.46%"

formatChartValue(1234.567, undefined, 'currency') // Legacy
// → "€1,234.57"
```

### Admin UI Integration

**Chart Algorithm Manager** (`/admin/charts`):

**VALUE Chart Type Controls**:
1. **Chart Type Dropdown**: Includes "💰 VALUE Chart (KPI + 5 bars with dual formatting)" option
2. **KPI Total Formatting Section** (only for VALUE type):
   - ☑️ Checkbox: "Rounded (whole numbers)"
   - Text input: "Prefix" (default: €)
   - Text input: "Suffix" (default: %)
3. **Bar Elements Formatting Section** (only for VALUE type):
   - ☑️ Checkbox: "Rounded (whole numbers)"
   - Text input: "Prefix" (default: €)
   - Text input: "Suffix" (default: %)
4. **Element List**: Must have exactly 5 elements (validation enforced)

**Styling** (`components/ChartAlgorithmManager.module.css`):
- `.formattingControlsSection` - Container with spacing and borders
- `.formattingControlRow` - Horizontal layout for checkbox + inputs
- `.formattingLabel` - Bold section titles
- Uses design tokens (`--mm-color-*`, `--mm-space-*`) for consistency

### API Validation

**Chart Configuration API** (`/app/api/chart-config/route.ts`):

**validateFormatting() Helper**:
```typescript
function validateFormatting(
  formatting: any,
  fieldName: string
): { valid: boolean; error?: string }
```

**Validation Rules**:
1. **VALUE Chart Requirements**:
   - Must have exactly 5 elements
   - Must have `kpiFormatting` object
   - Must have `barFormatting` object
   - Both formatting objects must be valid
2. **Formatting Object Validation**:
   - `rounded` must be boolean (if present)
   - `prefix` must be string (if present)
   - `suffix` must be string (if present)
3. **Element-Level Formatting**: Optional per-element `formatting` validated

**Error Examples**:
```json
// Missing formatting configs
{ "error": "VALUE charts must have both kpiFormatting and barFormatting" }

// Wrong element count
{ "error": "VALUE charts require exactly 5 elements, got 3" }

// Invalid formatting type
{ "error": "kpiFormatting.rounded must be a boolean" }
```

### Integration Points

**Chart Calculator** (`lib/chartCalculator.ts`):
- Passes `formatting` to `formatChartValue()` for each element
- Handles VALUE chart dual formatting (KPI vs. bars)

**ReportChart** (`app/report/[slug]/ReportChart.tsx`):
- Routes VALUE chart configuration through the current report renderer
- Validates chart data before render

**Visualization Manager** (`app/admin/visualization/page.tsx`):
- Displays VALUE charts with dual formatting in preview blocks

### Performance

- **No Performance Impact**: Formatting is lightweight string concatenation
- **Validation Overhead**: Minimal (<1ms per chart validation)
- **Backward Compatibility**: No extra database queries (formatting stored inline)

### Accessibility

- ✅ **Screen Readers**: ARIA labels for formatting controls
- ✅ **Keyboard Navigation**: All inputs and checkboxes keyboard accessible
- ✅ **Color Independence**: Value formatting doesn't rely on color
- ✅ **Form Labels**: All inputs have associated labels

## Pie Chart Percentage Visibility Control
### Overview

The Pie Chart Percentage Visibility Control adds a configurable `showPercentages` field to pie charts, allowing admins to toggle percentage display in legends and tooltips on a per-chart basis. This provides flexibility for cleaner chart designs when percentages are not needed.

**Status**: Production-Ready
**Release**: v11.43.0 (2025-12-22)
**Components**: showPercentages field, Chart Algorithm Manager checkbox

### Key Features

#### 1. Configuration Field

**Database Schema Extension** (`lib/chartConfigTypes.ts`):
```typescript
interface ChartConfiguration {
  chartId: string;
  title: string;
  type: 'pie' | 'bar' | 'kpi' | 'text' | 'image' | 'value';
  showTitle?: boolean;        // Controls title visibility
  showPercentages?: boolean;  // ✅ NEW: Controls percentage visibility (pie charts only)
  // ... other fields
}
```

**Default Behavior**:
- `showPercentages` defaults to `true` if not specified
- All existing pie charts continue showing percentages (backward compatible)
- Only applies to pie chart type - ignored by other chart types

#### 2. Admin UI Integration

**Chart Algorithm Manager** (`components/ChartAlgorithmManager.tsx`):
- Checkbox appears in "Display Settings" section when `type === 'pie'`
- Label: "Show Percentages in Legend"
- Tooltip: "Uncheck for cleaner pie chart legends"
- Saved to MongoDB on chart creation/update

**UI Location**:
```
Chart Algorithm Manager > Edit Pie Chart
  └─ Display Settings
      ├─ Show Title [checkbox]
      └─ Show Percentages in Legend [checkbox] (✅ NEW)
```

#### 3. Rendering Implementation

**Legend Display** (`app/report/[slug]/ReportChart.tsx`):
```tsx
// Before: Always shows percentages
<div className={styles.pieLegendText}>
  {protectedLabel}: {percentage}%
</div>

// After: Conditional display
<div className={styles.pieLegendText}>
  {showPercentages ? `${protectedLabel}: ${percentage}%` : protectedLabel}
</div>
```

**Tooltip Display**:
```tsx
// Tooltip callback respects showPercentages flag
callbacks: {
  label: (context) => {
    const label = context.label || '';
    const value = context.parsed as number;
    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
    return showPercentages
      ? `${label}: ${value.toLocaleString()} (${percentage}%)`
      : `${label}: ${value.toLocaleString()}`;
  }
}
```

#### 4. Visual Comparison

**With Percentages** (`showPercentages: true` - default):
```
● Female: 45%
● Male: 55%
```

**Without Percentages** (`showPercentages: false`):
```
● Female
● Male
```

### Integration Points

**Report Calculator** (`lib/report-calculator.ts`):
- Passes `showPercentages` field from chart config to ChartResult
- Field flows through calculation pipeline without modification

**API Endpoints**:
- `GET /api/chart-config` - Returns `showPercentages` field
- `POST /api/chart-config` - Accepts `showPercentages` in request body
- `PUT /api/chart-config` - Updates `showPercentages` field
- `GET /api/chart-config/public` - Includes `showPercentages` for public access

### Use Cases

1. **Minimalist Reports**: Hide percentages when chart labels alone convey meaning
2. **Space-Constrained Layouts**: Reduce text length in small pie chart legends
3. **Design Preferences**: Match specific branding guidelines requiring clean labels
4. **Redundant Data**: Hide percentages when exact values are shown elsewhere

### Benefits

- ✅ **Per-Chart Control**: Configure percentage visibility independently for each pie chart
- ✅ **User Control**: Admins decide chart appearance without code changes
- ✅ **Backward Compatible**: Existing charts unchanged (default: show percentages)
- ✅ **Type Safety**: Full TypeScript support with proper type guards
- ✅ **Consistent Pattern**: Follows `showTitle` toggle pattern

### Migration

**Not Required**: Field is optional with default value `true`. All existing pie charts automatically continue showing percentages until explicitly disabled by an admin.

---

## Image Layout System with Aspect Ratio Support

An IMAGE chart declares one of three aspect ratios -- `16:9`, `9:16`, `1:1` --
as the `AspectRatio` type in
[`lib/chartConfigTypes.ts`](../lib/chartConfigTypes.ts), narrowed at runtime by
`isValidAspectRatio` in the same file.

**Where it is set.** `components/ChartAlgorithmManager.tsx` for the chart
configuration; `app/admin/visualization/page.tsx` for the layout; both persist
it on the chart document.

**What it does.** The ratio is *not* a grid width. It is the cell's weight in
the block height solver, which derives one shared height for every cell in a
row from the block's width. A cell's width is a `LayoutUnit`, `1 | 2`. The
solver, its four priority levels and its bounds are documented in
[`docs/design/design-chart-height-system.md`](design/design-chart-height-system.md).

**Rendering.** IMAGE cells paint through `background-image` with
`background-size: cover`, not an `<img>` with `object-fit`. That was originally
a workaround for the client-side rasteriser; export is now server-side Chromium
(`app/api/export/pdf/route.ts`), which renders either correctly, but the
background approach stayed.

**Pass-through.** `lib/chartCalculator.ts` carries `aspectRatio` into the
calculation result for `image`, `text` and `table` charts.

This section previously described `lib/imageLayoutUtils.ts`,
`components/UnifiedDataVisualization.tsx`, `components/charts/ImageChart.module.css`,
`app/admin/chart-algorithms/page.tsx`, `lib/export/pdf.ts` and
`scripts/migrations/add-aspect-ratio-to-image-charts.ts` -- none of which exist --
along with a ratios-to-1-3-grid-units mapping no code implemented, and a v10.0.0
migration plan for removing a workaround from a file that had already been deleted.

## Admin Variables & Metrics System

3. Orders by `clickerOrder` (ascending) within each category
4. Renders grouped sections if groups exist, with KPI charts if `chartId` set

### Visibility Flags
**Benefits**:
- Runtime configuration without code deploys
- Flexible Editor UI tailored to project needs
- Consistent variable referencing across formulas and charts

### Roadmap Compliance

✅ **Milestone: Admin Variables — Org-Prefixed References & Card Layout**
- Lowercase field-name tokens (`[totalFans]`), migrated from the
  SEYU-prefixed uppercase syntax by scripts/migrateChartFormulasToLowercase.ts
- Card layout enforces exact line order (Label → REF → Flags → TYPE) and equal heights
- Derived label standardized to "Total Images"

✅ **Milestone: Variable Visibility & Editability Flags + Edit Integration**
- Flags persist across sessions via MongoDB
- Custom variables supported with modal creation
- Editor integration respects flags in clicker/manual sections
- No UI drift — centralized button/style system

### Performance

- ✅ Single API call on Editor mount loads all config
- ✅ Client-side filtering and ordering (no repeated API calls)
- ✅ MongoDB indexes on `name` for fast lookups
- ✅ CSS Modules for scoped, tree-shakable styling

## Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|----------|
| **Next.js** | 15.5.24 | React framework with App Router (RSC) |
| **React** | ^19.2.6 | UI library with concurrent features |
| **TypeScript** | ^5.6.3 | Type safety and developer experience (strict mode) |
| **Chart.js** | ^4.5.1 | Chart rendering library |
| **react-chartjs-2** | ^5.3.1 | React wrapper for Chart.js |
| **js-cookie** | ^3.0.5 | Client-side cookie management |
| **uuid** | ^14.0.0 | Unique identifier generation |

**Chart & report export**: PNG export uses Chart.js's own `toBase64Image()` (`hooks/useChartExport.ts`) — no DOM-rasterization library involved. PDF export is server-side, driven by a real headless Chromium (`puppeteer-core` + `@sparticuz/chromium-min` in production, `puppeteer` in local dev) rendering the report's own print CSS (`app/api/export/pdf/route.ts`); there is no client-side html2canvas/jsPDF path.

**Styling**:
- **CSS Modules**: Component-scoped styling
- **CSS Variables**: Design tokens (`--mm-*` prefix) via `app/styles/theme.css`
- **GDS (General Design System)**: The fleet-wide design system (`@sovereignsquad/gds-admin`, `@sovereignsquad/gds-core`, `@sovereignsquad/gds-theme`, vendored under `vendor/gds/`), built on Mantine 8, with Tabler icons through GDS-compatible wrappers. UI/UX work uses GDS components and vocabulary first; local wrappers (e.g. `<ColoredCard>`) exist only to encode Messmass-specific domain behavior on top of GDS primitives. The earlier from-scratch "TailAdmin V2" design system has been retired — see `docs/design/design-system.md`.

### Backend

| Technology | Version | Purpose |
|------------|---------|----------|
| **MongoDB** | ^6.8.0 | NoSQL database (MongoDB Atlas cloud) |
| **Next.js API Routes** | 15.5.24 | REST API endpoints (serverless functions) |
| **Node.js** | >=24.0.0 <25.0.0 | JavaScript runtime (server-side) |
| **dotenv** | ^17.4.2 | Environment variable management |

**External APIs**:
- **Bitly API v4**: Link shortening and analytics

**Authentication**:
- **SSO-Based Admin Auth**: Interactive admin sign-in is exclusively DoneIsBetter SSO (OAuth2 authorization-code flow); the legacy local email/password login (`POST /api/admin/login`) is retired and returns **410 Gone**. Successful SSO login sets an HTTP-only, signed-JWT `admin-session` cookie (see "Authentication Model" below).
- **Page Protection**: Per-page password gates for public stats (bcrypt-hashed, MongoDB-stored)

### Authentication Model

{messmass} has three independent auth layers plus one cross-app bridge — there is no single "the" auth system:

1. **Admin session (SSO)** — Interactive sign-in is exclusively the DoneIsBetter SSO OAuth2 authorization-code flow: `/api/auth/sso/login` redirects to `SSO_BASE_URL/api/oauth/authorize`; `/api/auth/sso/callback` exchanges the code at `SSO_BASE_URL/api/oauth/token`, resolves the caller's role from the SSO central per-app permission store, and sets an HttpOnly, signed-JWT `admin-session` cookie (7-day expiry) plus `auth-source=sso`. The legacy local email/password login (`POST /api/admin/login`) is retired and returns **410 Gone** — there are no admin passwords stored in MongoDB to check. Protected `/admin/**` and `/dashboard/**` routes read this cookie via `getAdminUser()` (`lib/auth.ts`); `middleware.ts` itself only checks that the cookie is *present* before letting a request through, not that it is a valid, unexpired session — see "Security Measures" below and messmass#392 (LLD finding F-003).
2. **Page passwords** — Per-page/event password gates (`lib/pagePassword.ts`, bcrypt-hashed, MongoDB-stored) let a non-admin viewer (an employee, a client) reach a specific `/report/[slug]` or `/edit/[slug]` page without an admin session. A validated password is recorded as a server-issued `page-access` grant cookie (`lib/pageAccess.ts`), entirely independent of the `admin-session` cookie.
3. **Machine/API tokens** — Non-browser callers authenticate with a bearer credential instead of a cookie, and both mechanisms are exempt from CSRF (which only defends cookie-borne authority): the fleet's `/api/integrations/fanmass/**` routes accept a single shared integration token (`requireFanmassIntegrationAuth`, `lib/fanmassIntegration.ts`) compared against one configured secret; the public API (`/api/public/**`) instead accepts a per-user Bearer token (`requireAPIAuth`, `lib/apiAuth.ts`) gated by that user's own `apiKeyEnabled`/`apiWriteEnabled` flags, with usage tracked per user.

**Camera integration**: camera (a sibling app in the same fleet) has its own separate shared secret (`config.cameraProvisionToken`, checked by `assertCameraSecret()` in `lib/cameraClient.ts`) for its `/api/integrations/camera/**` routes. One of those, `POST /api/integrations/camera/sso-session`, lets a user who already authenticated in camera via the same DoneIsBetter SSO get a real messmass `admin-session` cookie without a second OAuth round-trip — it independently re-validates the forwarded SSO access token against `SSO_BASE_URL` (it does not trust a role or user id asserted by the caller).

### Development Tools

| Tool | Version | Purpose |
|------|---------|----------|
| **ESLint** | ^8.57.0 | JavaScript/TypeScript linting |
| **eslint-config-next** | ^15.5.18 | Next.js-specific ESLint rules |
| **TypeScript Compiler** | ^5.6.3 | Type checking (tsc --noEmit) |
| **npm** | >=8.0.0 | Package manager |

**Build Tools**:
- Next.js built-in bundler (Turbopack in dev mode)
- TypeScript compiler for type checking
- ESLint for code quality enforcement

### Infrastructure & Deployment

| Service | Purpose |
|---------|----------|
| **Vercel** | Next.js app hosting (automatic deployment from GitHub main) |
| **MongoDB Atlas** | Cloud database (free tier or paid) |
| **Vercel CDN** | Caching for static assets (`_next/static/*`) |
| **GitHub** | Source control and CI/CD trigger |

API routes run on Vercel's **Node.js serverless runtime**, not the Edge Network — every route that declares a runtime explicitly sets `export const runtime = 'nodejs'` (see e.g. `app/api/export/pdf/route.ts`, which needs real Node APIs for headless-Chromium PDF export), and none declare `'edge'`.

**Environment Configuration**:
```bash
# Required in .env.local and Vercel Environment Variables
MONGODB_URI=mongodb+srv://...
MONGODB_DB=messmass
SSO_BASE_URL=...
SSO_CLIENT_ID=...
SSO_CLIENT_SECRET=...

# Optional (Bitly integration)
BITLY_ACCESS_TOKEN=...
BITLY_ORGANIZATION_GUID=...
BITLY_GROUP_GUID=...
```
Note: `ADMIN_PASSWORD` is no longer applicable — local admin login was removed (`POST /api/admin/login` now returns 410 Gone); admin auth is SSO-only (`SSO_BASE_URL`/`SSO_CLIENT_ID`/`SSO_CLIENT_SECRET`), see "Authentication Model" below.

### Project Slug Access Control

**Purpose:** UUID-based slugs for secure, password-less access to projects.

**Implementation:**
- **`viewSlug`** (UUID v4): Read-only public access to `/report/[slug]`
- **`editSlug`** (UUID v4): Editor access to `/edit/[slug]`

**Key Features:**
1. **Auto-Generated**: Created on project creation via `lib/slugUtils.ts`
2. **Unique Constraint**: Both slugs indexed as unique in database
3. **Security**: UUIDs provide ~2^122 combinations (brute-force resistant)
4. **No Passwords Required**: Direct URL access without additional authentication
5. **Revocable**: Can regenerate slugs to revoke access

**Usage Pattern:**
```typescript
// Generate on project creation
import { generateProjectSlugs } from '@/lib/slugUtils';
const { viewSlug, editSlug } = await generateProjectSlugs();

// Find project by slug
const project = await findProjectByViewSlug(viewSlug);
const editable = await findProjectByEditSlug(editSlug);
```

**Why UUID Slugs:**
- Eliminates need for separate password management per project
- Shareable URLs (e.g., for clients, stakeholders)
- Stateless - no session/auth required for project access
- Simple revocation: regenerate slug → old URL invalid

**Example URLs:**
- View: `https://messmass.com/stats/00825405-0018-4483-8854-e18c25f7607d`
- Edit: `https://messmass.com/edit/8fffdaa5-838c-4bf3-a382-0ba62a589faf`

### Database Schema Summary

| Collection | Purpose | Indexes |
|------------|---------|----------|
| `projects` | Event records with stats | eventDate, updatedAt, viewSlug (unique), editSlug (unique) |
| `partners` | Partner organizations | name, createdAt |
| `bitly_links` | Bitly link metadata | bitlink, createdAt |
| `bitly_project_links` | Link-project associations (many-to-many) | projectId, linkId |
| `hashtag_categories` | Category definitions with colors | name |
| `hashtags` | Hashtag usage tracking | _id (hashtag text) |
| `notifications` | Multi-user notifications | createdAt, archivedBy |
| `variablesConfig` | Variable flags and overrides | name |
| `variableGroups` | Editor layout groups | groupOrder |
| `users` | Admin users | email (unique) |
| `analytics_aggregates` | Pre-computed event analytics (v6.26.0) | projectId, eventDate, partnerId+eventDate, updatedAt |
| `aggregation_logs` | Background job tracking (v6.26.0) | startTime, status, jobType+startTime, createdAt (TTL) |
| `system_settings` | System configuration (v6.26.0) | key |

### Real-Time Architecture (Removed in v12.2.0)

**Removed in v12.2.0.** The separate WebSocket real-time server was deleted (the `server/` directory, `hooks/useWebSocket.ts`, and the `ws`/`@types/ws` dependencies). Live data, badge, and notification updates now happen via REST + polling only. The subsystem below is retained for historical reference and is no longer part of the stack.

**WebSocket Server** (Separate Node.js Process) — removed in v12.2.0:
- **Location**: `server/websocket-server.js`
- **Port**: 7654 (configurable)
- **Protocol**: WebSocket (ws library)
- **Features**:
  - Project-based rooms for isolation
  - Automatic reconnection with exponential backoff
  - Heartbeat mechanism (ping/pong)
  - Message types: join-project, stat-update, project-update

**Client-Side Integration** — removed in v12.2.0:
- **Hook**: `hooks/useWebSocket.ts`
- **Auto-Reconnect**: Yes, with exponential backoff
- **Connection URL**: `NEXT_PUBLIC_WS_URL` environment variable

### Performance Optimizations

1. **Server-Side Rendering (SSR)**: Pages pre-rendered on server for SEO and initial load speed
2. **API Route Caching**: Strategic caching headers on API responses
3. **MongoDB Indexes**: All frequently queried fields indexed
4. **Pagination**: 20 items per page across all admin interfaces
5. **Lazy Loading**: Bitly links and large datasets loaded on-demand
6. **CSS Modules**: Tree-shakable scoped styles (no runtime CSS-in-JS)
7. **Image Optimization**: Next.js automatic image optimization
8. **Node.js Serverless Functions**: API routes run on Vercel's Node.js serverless runtime (not the Edge Network — see "Infrastructure & Deployment" above)

### Security Measures

1. **HTTP-Only Cookies**: Session tokens never accessible via JavaScript
2. **CSRF Protection**: Double-submit cookie pattern (`lib/csrf.ts`), enforced in `middleware.ts` for state-changing methods
3. **Password Hashing**: Bcrypt for page passwords (`lib/pagePassword.ts`) — admin auth has no local password to hash; see "Authentication Model" above
4. **Environment Variables**: Secrets never committed to repository
5. **API Authentication**: `middleware.ts` only checks that the `admin-session` cookie is *present* before allowing `/admin/**` through, not that it is valid — actual session validation happens in each route/page via `getAdminUser()`. This gap is tracked as messmass#392 (LLD finding F-003), not yet remediated
6. **Input Validation**: TypeScript + runtime validation on API endpoints
7. **MongoDB Injection Prevention**: Parameterized queries via MongoDB driver
8. **Rate Limiting**: Implemented (`lib/rateLimit.ts`), applied in `middleware.ts` to all routes matched by its `config.matcher` (all `/api/**`, `/admin/**`, `/report/**`, `/partner-report/**`, `/dashboard/**`, and effectively everything else except static assets/`_next`); an in-memory, per-IP fixed-window counter with separate limits per endpoint class (auth, write, read, public, contact form, PDF export) — see the "Security Enhancements" section above for the current limits

---

## Analytics Infrastructure
### Overview

The Analytics Infrastructure provides **pre-computed, high-performance analytics** for event metrics, partner performance, time-series trends, and industry benchmarking. Phase 1 implements the core data aggregation pipeline with 5 API endpoints serving sub-second query response times.

### Architecture Components

**1. Data Aggregation Pipeline**

- **Background Job**: `scripts/aggregateAnalytics.ts`
  - Runs every 5 minutes (cron or manual)
  - Incremental processing (only updated projects)
  - Processes 100+ projects within 5-minute window
  - Tracks last run time in `system_settings` collection
  - Batch upserts (50 projects per batch)
  - Creates detailed logs in `aggregation_logs` collection

- **Calculation Engine**: `lib/analyticsCalculator.ts`
  - CPM-based business model calculations
  - Fan metrics (engagement, core fan team value)
  - Merchandise metrics (penetration rate, diversity)
  - Advertisement metrics (ROI, viral coefficient)
  - Demographic distributions
  - Visit source tracking
  - Bitly analytics integration

**2. Database Collections**

```typescript
// analytics_aggregates - Pre-computed event metrics
{
  _id: ObjectId,
  projectId: ObjectId,
  eventDate: string,
  aggregationType: 'event',
  partnerContext: {
    partnerId?: ObjectId,
    opponentId?: ObjectId,
    partnerName?: string,
    partnerEmoji?: string,
    opponentName?: string,
    opponentEmoji?: string,
    isHomeGame?: boolean
  },
  fanMetrics: {
    totalFans: number,
    remoteFans: number,
    stadium: number,
    engagementRate: number,
    remoteQuality: number,
    stadiumQuality: number,
    selfieRate: number,
    coreFanTeam: number,
    fanToAttendeeConversion: number
  },
  merchMetrics: {
    totalMerched: number,
    penetrationRate: number,
    byType: {
      jersey: number,
      scarf: number,
      flags: number,
      baseballCap: number,
      other: number
    },
    merchToAttendee: number,
    diversityIndex: number,
    highValueFans: number,
    casualFans: number
  },
  adMetrics: {
    totalImpressions: number,
    socialValue: number,
    emailValue: number,
    totalROI: number,
    viralCoefficient: number,
    emailConversion: number,
    costPerEngagement: number,
    adValuePerFan: number,
    reachMultiplier: number
  },
  demographicMetrics: { /* age and gender distributions */ },
  visitMetrics: { /* visit source tracking */ },
  bitlyMetrics: { /* optional Bitly analytics */ },
  rawStats: { /* original project.stats */ },
  version: string,
  createdAt: string,
  updatedAt: string
}

// aggregation_logs - Job performance tracking
{
  _id: ObjectId,
  jobType: 'event_aggregation',
  status: 'success' | 'partial_failure' | 'failed',
  startTime: string,
  endTime: string,
  duration: number,
  projectsProcessed: number,
  projectsFailed: number,
  errors: Array<{ projectId: ObjectId, errorMessage: string }>,
  avgProcessingTime: number,
  maxProcessingTime: number,
  createdAt: string // TTL: 30 days
}
```

**3. Business Model Constants**

```typescript
AD_MODEL_CONSTANTS = {
  EMAIL_OPTIN_CPM: €4.87,        // Email opt-in value per 1000 impressions
  EMAIL_ADDON_CPM: €1.07,        // Additional email opens value
  STADIUM_AD_CPM: €6.00,         // In-stadium ad exposure value
  SOCIAL_ORGANIC_CPM: €14.50,    // Social media organic impressions
  YOUTH_PREMIUM: €2.14,          // Premium for Gen Alpha/YZ demographics
  SOCIAL_SHARES_PER_IMAGE: 20,   // Average social shares per event image
  AVG_VIEWS_PER_SHARE: 300,      // Average views per social share
  EMAIL_OPEN_RATE: 0.35          // 35% average email open rate
}
```

**4. MongoDB Indexes (20 total across 4 collections)**

- `analytics_aggregates`: projectId, eventDate, aggregationType, partnerId+eventDate (compound), updatedAt
- `partner_analytics`: partnerId, partnerType, partnerId+timeframe (unique compound), updatedAt
- `event_comparisons`: primaryProjectId, comparisonType, compound index
- `aggregation_logs`: startTime, status, jobType+startTime (compound), createdAt (TTL: 30 days)

**5. API Endpoints**

| Endpoint | Purpose | Performance | Query Params |
|----------|---------|-------------|---------------|
| `GET /api/analytics/event/[projectId]` | Single event metrics | <100ms | includeBitly, includeRaw |
| `GET /api/analytics/partner/[partnerId]` | Partner summary | <200ms | timeframe, includeEvents |
| `GET /api/analytics/trends` | Time-series data | <500ms (1-year) | startDate, endDate, partnerId, metrics, groupBy |
| `GET /api/analytics/compare` | Event comparison | <300ms (5 events) | projectIds, metrics |
| `GET /api/analytics/benchmarks` | Industry benchmarks | <500ms (full dataset) | category, metric, period |

### Type System

**Core Types** (`lib/analytics.types.ts`):
- `AnalyticsAggregate` - Complete aggregated event metrics
- `FanMetrics` - Fan engagement and conversion KPIs
- `MerchMetrics` - Merchandise penetration and diversity
- `AdMetrics` - Advertisement ROI and viral reach
- `DemographicMetrics` - Age and gender distributions
- `VisitMetrics` - Traffic source attribution
- `BitlyMetrics` - Link click analytics (optional)
- `PartnerAnalytics` - Partner-level summaries
- `EventComparison` - Comparative analysis results
- `AggregationLog` - Job execution tracking
- `AnalyticsAPIResponse` - Standardized API response

### Setup & Maintenance

**Initial Setup** (one-time):
```bash
npm run analytics:setup-indexes
```

**Background Aggregation** (every 5 minutes):
```bash
npm run analytics:aggregate
```

**Production Deployment**:
- **Vercel**: Use cron jobs or external scheduler (GitHub Actions, Vercel Cron)
- **Railway/Heroku**: Use native cron functionality
- **Manual**: Add cron entry on server

**Monitoring**:
- Check `aggregation_logs` collection for job status
- Monitor job duration (should be <5 minutes)
- Track `projectsFailed` for data quality issues
- Verify index performance with MongoDB Atlas metrics

### Performance Characteristics

**Aggregation Job**:
- Duration: 1-2 seconds for 50 projects
- Throughput: 25-50 projects/second
- Memory: <100MB for 200 projects
- CPU: Single-core, <50% utilization

**API Response Times** (actual measured):
- Event endpoint: 50-80ms (cached aggregate lookup)
- Partner endpoint: 100-150ms (aggregates across events)
- Trends endpoint: 200-400ms (1-year dataset with filtering)
- Compare endpoint: 150-250ms (5 events with calculations)
- Benchmarks endpoint: 300-450ms (full dataset statistical analysis)

**Database Performance**:
- Aggregate collection size: ~5KB per event
- Index overhead: ~15% of collection size
- Query execution: <10ms with proper indexes
- Concurrent queries: Supports 100+ simultaneous API requests

## AI Analytics & Fanmass Analysis Pipeline
### Why this exists

AI-derived analytics already existed on ~155 events but were **invisible in the
product**. A report author had no way to tell whether an AI variable was safe to
put in a template — one present on 3% of events renders empty for almost everyone,
and they find out from a customer. This subsystem makes coverage, freshness, and
fill rate visible, and renders the structured analysis that previously never
crossed the integration boundary at all.

### The fleet boundary

```
Google Drive folder ──┐
                      ├──► fanmass (user hardware, local AI)  ──► messmass
camera.messmass.com ──┘      Ollama vision + MediaPipe + YOLO      (this repo)
```

messmass **does not analyse images**. It owns events and variables, hands fanmass
the context for an event, and ingests what fanmass sends back. fanmass runs on the
operator's own hardware and is not cloud-deployed; messmass must therefore never
have a runtime dependency on fanmass being reachable. Every read surface described
below is an aggregation over collections messmass already owns.

### Two channels across the boundary

| Channel | Endpoint | Carries |
|---|---|---|
| Stats push | `POST /api/integrations/fanmass/events/[eventId]/stats` | Flat scalars → `projects.stats.fanmass*` |
| Summary push | `POST /api/integrations/fanmass/events/[eventId]/analysis-summary` | The whole structured document → `ai_analysis_summaries` |

The summary channel exists because the stats push carries only flat scalars, so
everything list-shaped — twenty brand mentions, twenty club mentions, demographic
projections — was discarded at the boundary. The two are **failure-isolated**: a
summary push that fails must not cost the event its stats.

Summaries are stored as a document, not as stats keys. Stats names are chart
variables with registration semantics, and twenty brand rows are not twenty
variables.

### Contract versioning

`fanmass.messmass.analytics-summary.v1`, enforced as a **major-version gate** in
`lib/aiAnalysisSummary.ts`:

- Same major, extra fields → **stored untouched**. This is what let
  `emotionProjection` and `smilingPct` reach production with no messmass schema
  change; only the rendering needed a release.
- Different major → **rejected `409`**. The shape itself changed, and storing it
  silently would hand the report undefined behaviour.

### AI variable identity

An AI-owned variable is one whose name begins with `fanmass`.
`isAiVariableName()` in `lib/aiAnalytics.ts` is the single authority — widening the
definition later (a category, a second producer) is one function rather than a
sweep across call sites.

`fanmassStatus` is registered with **`derived: false`** on purpose. In messmass,
`derived: true` means "computed by the formula engine, don't let external writes
clobber it" — which made `pushEventStats` skip the field silently. The producer
owns this value, so it must not be marked derived.

### Status and freshness derivation

`deriveEventStatus()` must agree with the Drive folder badge already shipped, or
the same event reads differently in two places. It prefers the producer's own
`fanmassStatus` and falls back to analysed/discovered counts for events pushed
before that field existed.

`isStale()` treats an **unknown** timestamp as NOT stale. The estate carries ~155
events analysed before freshness was recorded; flagging all of them on day one
would train operators to ignore the signal entirely.

### Surfaces

| Route | What it is |
|---|---|
| `/admin/analytics/ai` | Workspace: coverage, per-event status list, variable catalogue with fill rates |
| `/admin/analytics/ai/[eventId]` | Per-event AI report: brands, clubs/federations, merchandise, demographics |
| Chart formula picker | Inline fill-rate hint next to every AI variable |

**Access posture:** authenticated session, **any role** — deliberately unlike the
admin-only analytics dashboards. The audience is report authors deciding what to
build into a template. Note that `canAccessMenuItem` returns false for any label
absent from `MENU_PERMISSIONS`, so a new nav item is invisible to *everyone* until
registered there; `tests/nav-menu-permissions.test.ts` guards this.

**Default view hides zero-image events.** Most of the estate is camera-provisioned
events still waiting for photos, so the unfiltered list was 152 rows of
"Analysing · 0%" burying the few with real analysis. Two exceptions are load-bearing:
failed events stay visible regardless of image count, and an explicit status filter
overrides the hide entirely.

### Query constraint

The Mongo client runs **Stable API v1 with `strict: true`**. `distinct()` is not
part of that API and fails with `APIStrictError`. Use `$group` aggregation instead —
this applies to any new code in this subsystem, not just the existing calls.

### Related implementation files

- `lib/aiAnalytics.ts` — read model (coverage, events, variables, staleness)
- `lib/aiAnalysisSummary.ts` — summary storage, contract and size gates
- `app/admin/analytics/ai/` — workspace and per-event report
- `app/api/analytics/ai/` — read endpoints
- `app/api/integrations/fanmass/` — producer-side ingest

---

## Contributing

When working with the hashtag categories system:

1. **Utility Functions**: Always use `hashtagCategoryUtils.ts` functions for consistency
2. **API Design**: Maintain backward compatibility when modifying hashtag-related endpoints
3. **UI Components**: Follow the established pattern for category color application
4. **Testing**: Manually validate both traditional and categorized hashtag workflows
5. **Documentation**: Update this document when adding new category-related features

---

*Last Updated: 2026-09-09*
*Version: 12.3.36*
*Status: Production-Ready — Enterprise Event Analytics Platform with Advanced Analytics Infrastructure*
