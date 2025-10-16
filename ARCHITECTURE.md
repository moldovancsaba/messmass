# MessMass Architecture Documentation

Last Updated: 2025-10-16T07:52:00.000Z
Version: 6.5.0

## Project Overview

MessMass is an enterprise-grade event analytics platform built with Next.js 15, TypeScript, and MongoDB Atlas, designed for sports organizations, venues, brands, and event managers. The platform provides comprehensive real-time statistics tracking, intelligent partner management, automated event creation workflows (Sports Match Builder), advanced Bitly link analytics with many-to-many event associations, configurable KPI dashboards, and a unified hashtag system with category-aware organization.

## Version History

- **Version 6.8.0** — KYC creation flow and boolean/date types
- **Version 6.7.0** — KYC export and advanced filters (source/tags/flags)
- **Version 6.6.0** — KYC Variables page and Clicker Manager split
- **Version 6.5.0** — Analytics Insights: In-page Help and Usage Guide
- **Version 6.4.0** — Bitly Search UX Enhancement (Loading State Separation)
- **Version 6.0.0** — Partners Management System + Sports Match Builder + Comprehensive Documentation
- **Version 5.57.0** — PartnerSelector Component with Predictive Search
- **Version 5.56.0-5.56.3** — Partners CRUD System with Pagination and Search
- **Version 5.54.0-5.54.12** — Bitly Integration Enhancements (Many-to-Many, Notification Grouping)
- **Version 5.52.0** — Admin Variables & Metrics Management System
- **Version 5.49.3** — Admin Layout & Navigation System
- **Version 5.48.0** — Multi-User Notification System
- **Version 4.2.0** — Admin HERO Standardization and Content Surface
- **Version 2.2.0** — Hashtag Categories System ✅ **COMPLETED**

---

## Partners Management System (Version 6.0.0)

### Overview

The Partners Management System provides comprehensive infrastructure for managing organizational entities (clubs, federations, venues, brands) that participate in or host events. Partners serve as the foundation for rapid event creation via the Sports Match Builder and maintain associations with Bitly tracking links for attribution.

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

#### 5. Database Integration

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

### Future Enhancements

- **Partner Types**: Add explicit type field (club, federation, venue, brand)
- **Partner Logos**: Upload and display partner logos
- **Partner Statistics**: Aggregate event stats per partner
- **Partner Relationships**: Parent-child relationships (federation > clubs)
- **Bulk Import**: CSV/Excel import for large partner datasets
- **Partner API Keys**: Allow partners to access their own event data

---

## Styling Architecture (4.2.0)

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
- All design tokens documented in [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)
- TailAdmin V2 flat design (no glass-morphism)
- **ALL CSS card classes REMOVED**: `.glass-card`, `.content-surface`, `.section-card`, `.admin-card`
- **ONLY USE**: `<ColoredCard>` component for all card UI
- Current components: `ColoredCard`, `AdminLayout`, `Sidebar`, `TopHeader`
- All card styling uses `<ColoredCard>` component ONLY (component-based architecture)
- Admin: `app/admin/layout.tsx` provides AdminLayout wrapper with sidebar navigation
- Public: `components/PagePasswordLogin.tsx` resolves page style via `/api/page-config`

## Configuration Loader (4.2.x)

### Admin Filter Search & Paging (v5.0.0)
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
  - ADMIN_PASSWORD
  - SSO_BASE_URL
  - APP_BASE_URL
  - API_BASE_URL
- Client-exposed (browser):
  - NEXT_PUBLIC_APP_URL
  - NEXT_PUBLIC_WS_URL

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
declare const process: { env: { NEXT_PUBLIC_APP_URL?: string; NEXT_PUBLIC_WS_URL?: string } };
const appUrl = process.env.NEXT_PUBLIC_APP_URL;
const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
```

### Optional Atlas overlay (non-secrets only)
- Collection shape (proposed in Step 3): { project, env, key, value, updated_at, comment }
- Purpose: centralize non-sensitive toggles and base URLs; never secrets
- Caching: in-process TTL (e.g., 300000 ms) with manual bust method
- Reference: see LEARNINGS.md entry “2025-09-24T11:07:46.000Z — Atlas settings collection plan”

### Migration plan (Step 4)
- Replace direct `process.env.*` usages with the config module
- Remove baked defaults for secrets
- Remove hard-coded service base URLs (replace with APP_BASE_URL, API_BASE_URL, SSO_BASE_URL, NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_WS_URL)

---

## Hashtag Categories System (Version 2.2.0)

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
- `GET /api/admin/hashtag-categories` - List all categories
- `POST /api/admin/hashtag-categories` - Create new category
- `PUT /api/admin/hashtag-categories/[id]` - Update category
- `DELETE /api/admin/hashtag-categories/[id]` - Delete category

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

### Migration and Compatibility

- **Zero-Downtime Migration**: Existing projects continue working without changes
- **Gradual Adoption**: Users can adopt categorized hashtags at their own pace
- **Data Integrity**: Validation prevents duplicate hashtags within the same category
- **API Compatibility**: All existing API endpoints maintain backward compatibility

---

## URL Structure and Routing

### Public Pages
- `/stats/[slug]` - Individual project statistics (password protected)
- `/edit/[slug]` - Project editing interface (password protected)
- `/filter/[slug]` - Hashtag filtering and statistics (supports both filter slugs and direct hashtag names)
- `/hashtag/[hashtag]` - Aggregated statistics for a single hashtag (resurfaced; leverages the same style system)

### Admin Pages
- `/admin` - Admin dashboard with navigation cards
- `/admin/projects` - Project management (CRUD, pagination, search, sorting)
- `/admin/partners` - **Partner management (v6.0.0)** (CRUD, pagination, search)
- `/admin/quick-add` - **Sports Match Builder + Sheet Import (v6.0.0)**
- `/admin/bitly` - Bitly link management and sync
- `/admin/hashtags` - Hashtag color management
- `/admin/categories` - Hashtag category management
- `/admin/filter` - Advanced hashtag filtering tool
- `/admin/variables` - Variable & metrics configuration
- `/admin/charts` - Chart configuration management
- `/admin/design` - UI design customization
- `/admin/visualization` - Data visualization settings

### API Endpoints

**Projects**
- `GET /api/projects` - List projects with pagination, search, and sorting
  - Default mode: cursor pagination by updatedAt desc (nextCursor)
  - Sort/Search mode: offset pagination with totalMatched/nextOffset
  - sortField: eventName | eventDate | images | fans | attendees
  - sortOrder: asc | desc
- `POST /api/projects` - Create new project
- `PUT /api/projects` - Update existing project
- `DELETE /api/projects` - Delete project

**Partners** (v6.0.0)
- `GET /api/partners` - List partners with pagination, search, and sorting
- `POST /api/partners` - Create new partner
- `PUT /api/partners` - Update existing partner
- `DELETE /api/partners` - Delete partner

**Bitly Integration**
- `GET /api/bitly/links` - List Bitly links with pagination and search
- `POST /api/bitly/links` - Create or associate Bitly link
- `PUT /api/bitly/links` - Update Bitly link metadata
- `DELETE /api/bitly/links` - Delete Bitly link
- `POST /api/bitly/pull` - Bulk import links from Bitly account
- `POST /api/bitly/sync` - Sync analytics data for all links
- `POST /api/bitly/sync/[linkId]` - Sync analytics for specific link
- `GET /api/bitly/associations` - Get link-project associations
- `POST /api/bitly/associations` - Create link-project association
- `DELETE /api/bitly/associations` - Remove link-project association

**Hashtags & Filtering**
- `GET /api/hashtags` - List hashtags with counts (supports search + pagination)
- `POST /api/hashtags/filter` - Admin hashtag filtering
- `GET /api/hashtags/filter-by-slug/[slug]` - Public filtering (slugs or direct queries)
- `GET /api/hashtags/slugs` - Available hashtag listing
- `GET /api/hashtags/[hashtag]` - Aggregated stats for single hashtag

**Hashtag Categories**
- `GET /api/admin/hashtag-categories` - List categories
- `POST /api/admin/hashtag-categories` - Create category
- `PUT /api/admin/hashtag-categories/[id]` - Update category
- `DELETE /api/admin/hashtag-categories/[id]` - Delete category

**Variables & Metrics**
- `GET /api/variables-config` - Fetch all variables with flags and ordering
- `POST /api/variables-config` - Create/update variable metadata and flags
- `DELETE /api/variables-config` - Delete custom variable
- `GET /api/variables-groups` - Fetch variable groups
- `POST /api/variables-groups` - Create/update group or seed defaults
- `DELETE /api/variables-groups` - Delete all groups

**Notifications**
- `GET /api/notifications` - Fetch notifications for current user
- `POST /api/notifications` - Create notification (internal)
- `PUT /api/notifications/mark-read` - Mark as read or archive

**Configuration**
- `GET /api/page-config` - Page styling configuration
- `GET /api/chart-config` - Chart configuration
- `GET /api/hashtag-colors` - Hashtag color management

### URL Notes (v2.6.0 → v2.10.0)
- v2.6.0: Hashtag pages were deprecated in favor of the unified filter system
- v2.10.0: `/hashtag/[hashtag]` is available for single-hashtag aggregated stats (shares styling and components with filter/stats pages)
- Redirect behavior may exist for legacy routes, but the hashtag page is supported and styled

---

## Visualization Grid System (Stats/Admin Parity)

- Shared Component: components/UnifiedDataVisualization.tsx is the single source of truth for rendering blocks and charts across Admin Visualization, /stats, /filter, and /hashtag pages.
- Desktop Layout: Each data visualization block uses its configured gridColumns value (1–6) for desktop. This is capped by global desktop units from page-config grid settings to prevent over-allocation.
- Tablet/Mobile Layout: Uses global tabletUnits and mobileUnits from page-config grid settings. Chart spans are clamped at each breakpoint to available units.
- CSS Specificity: Per-block, id-scoped grid classes (udv-grid-[blockId]) are injected to ensure layout cannot be overridden by legacy/global CSS. Important flags are applied where necessary to neutralize conflicts.
- Pixel Constraints Removed: Chart container and legend min/max-width constraints are overridden to ensure unit-based grid math governs layout.
- Data Flow: gridSettings are served by /api/page-config and passed to pages, then forwarded to UnifiedDataVisualization as gridUnits.
---

## Multi-User Notification System (Version 5.48.0+)

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

3. **Statistics Update** (Real-time via WebSocket or API)
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

### Future Enhancements

- **WebSocket Integration**: Real-time push notifications without polling
- **Notification Preferences**: User-configurable notification types
- **Digest Mode**: Daily/weekly notification summaries
- **Notification History**: Separate view for archived notifications
- **Rich Notifications**: Include change details and diffs
- **User Mentions**: @mention functionality in project notes

### Troubleshooting

For production issues:
1. Use diagnostic endpoint: `/api/debug/notifications`
2. Check authentication status
3. Verify MongoDB connection
4. Review notification counts and recent entries
5. See detailed troubleshooting guide in `MULTI_USER_NOTIFICATIONS.md`

---

## Admin Layout & Navigation System (Version 5.49.3+)

### Overview

The Admin Layout & Navigation System provides a comprehensive, responsive layout framework for all MessMass admin pages. It features a collapsible sidebar navigation, top header with user info and notifications, and adaptive behavior across desktop, tablet, and mobile devices.

**Status**: Stable, Production-Ready  
**Documentation**: See [ADMIN_LAYOUT_SYSTEM.md](./ADMIN_LAYOUT_SYSTEM.md) for complete documentation  
**Code Review**: See [CODE_REVIEW_FINDINGS_ADMIN_LAYOUT.md](./CODE_REVIEW_FINDINGS_ADMIN_LAYOUT.md)

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

### Future Enhancements

See ROADMAP.md for planned improvements:
1. Tokenize sidebar widths and breakpoints (High priority)
2. Add tooltips for collapsed sidebar (Medium priority)
3. Add skip-to-content link (Medium priority)
4. Persist sidebar state with localStorage (Low priority)
5. Implement focus trap in mobile overlay (Low priority)

For complete documentation, usage examples, troubleshooting, and technical details, see [ADMIN_LAYOUT_SYSTEM.md](./ADMIN_LAYOUT_SYSTEM.md).

---

## Admin Variables & Metrics Management System (Version 5.52.0)

### Overview

The Admin Variables System is a centralized configuration layer that controls which metrics appear in the Editor's rapid-counting interface (Clicker), which metrics are manually editable, how variables are grouped and ordered, and how they're referenced in formulas and chart configurations.

**Status**: Production-Ready  
**Documentation**: See [ADMIN_VARIABLES_SYSTEM.md](./ADMIN_VARIABLES_SYSTEM.md) for complete documentation

### Key Components

#### 1. Variable Registry (`lib/variablesRegistry.ts`)
- **Role**: Single source of truth for base and derived variables
- **Base Variables**: Stats fields (images, fans, demographics, merchandise, visits, event)
- **Derived Variables**: Auto-computed metrics (totalImages, totalFans, totalVisit)
- **Text Variables**: Dynamic hashtag category variables
- **Type Safety**: TypeScript interfaces for `VariableDefinition`

#### 2. SEYU Reference Tokens (`lib/variableRefs.ts`)
- **Role**: Organization-prefixed token generation for multi-tenancy readiness
- **Format**: `[SEYUSUFFIX]` with normalization rules
- **Normalization**: ALL→TOTAL, VISITED→VISIT, VISIT*→*VISIT, FANS suffix, MERCH prefix
- **Usage**: Chart formulas reference variables as `[SEYUMERCHEDFANS]`, `[SEYUTOTALIMAGES]`

#### 3. Variables Configuration API (`/api/variables-config`)
- **Role**: Merge registry with MongoDB overrides and flags
- **GET**: Fetch all variables with flags and ordering
- **POST**: Create/update variable metadata and flags
- **DELETE**: Remove custom or overridden variables
- **Collection**: `variablesConfig` in MongoDB

#### 4. Variables Admin UI (`/app/admin/variables/page.tsx`)
- **Features**: CRUD operations, search/filter, drag-and-drop ordering
- **Groups Manager**: Control Editor layout with variable grouping
- **Flags Management**: Toggle visibleInClicker / editableInManual per variable
- **Custom Variables**: Create project-specific metrics via modal

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

### SEYU Token Examples

| Variable Name | Registry Label | SEYU Token | Normalization Rule |
|---------------|---------------|------------|--------------------|
| `allImages` | Total Images | `[SEYUTOTALIMAGES]` | ALL → TOTAL |
| `visitShortUrl` | Short URL Visits | `[SEYUSHORTURLVISIT]` | VISIT* → *VISIT |
| `eventValuePropositionVisited` | Value Prop Visited | `[SEYUPROPOSITIONVISIT]` | VISITED → VISIT |
| `stadium` | Location | `[SEYUSTADIUMFANS]` | Add FANS suffix |
| `merched` | People with Merch | `[SEYUMERCHEDFANS]` | Explicit mapping |
| `jersey` | Jerseys | `[SEYUMERCHERSEY]` | MERCH prefix |

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
3. Orders by `clickerOrder` (ascending) within each category
4. Renders grouped sections if groups exist, with KPI charts if `chartId` set
5. Manual mode checks `editableInManual` flag to show/hide input fields

**Benefits**:
- Runtime configuration without code deploys
- Flexible Editor UI tailored to project needs
- Consistent variable referencing across formulas and charts
- Multi-tenancy ready with SEYU namespace

### Roadmap Compliance

✅ **Milestone: Admin Variables — Org-Prefixed References & Card Layout**
- SEYU-prefixed reference tokens with normalization
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

### Future Enhancements

See ROADMAP.md for planned improvements:
1. Bulk variable operations (enable/disable multiple)
2. Variable templates (predefined sets for common event types)
3. Formula validation in UI for derived variables
4. Export/import variable configurations
5. Variable usage analytics (which variables are edited most)

For complete documentation, API reference, usage patterns, and technical decisions, see [ADMIN_VARIABLES_SYSTEM.md](./ADMIN_VARIABLES_SYSTEM.md).

---

## Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|----------|
| **Next.js** | 15.5.4 | React framework with App Router (RSC) |
| **React** | 18.3.1 | UI library with concurrent features |
| **TypeScript** | 5.6.3 | Type safety and developer experience (strict mode) |
| **Chart.js** | 4.5.0 | Chart rendering library |
| **react-chartjs-2** | 5.3.0 | React wrapper for Chart.js |
| **html2canvas** | 1.4.1 | PNG export for charts |
| **jsPDF** | 3.0.1 | PDF generation for exports |
| **WebSocket (ws)** | 8.18.3 | Real-time client-server communication |
| **js-cookie** | 3.0.5 | Client-side cookie management |
| **uuid** | 11.1.0 | Unique identifier generation |

**Styling**:
- **CSS Modules**: Component-scoped styling
- **CSS Variables**: Design tokens (`--mm-*` prefix) via `app/styles/theme.css`
- **No Tailwind**: Fully custom design system (TailAdmin V2 flat design)
- **No External UI Library**: All components built from scratch

### Backend

| Technology | Version | Purpose |
|------------|---------|----------|
| **MongoDB** | 6.8.0 | NoSQL database (MongoDB Atlas cloud) |
| **Next.js API Routes** | 15.5.4 | REST API endpoints (serverless functions) |
| **Node.js** | ≥18.0.0 | JavaScript runtime (server-side) |
| **dotenv** | 17.2.1 | Environment variable management |

**External APIs**:
- **Bitly API v4**: Link shortening and analytics

**Authentication**:
- **Custom Session-Based Auth**: HTTP-only cookies (no NextAuth.js)
- **Password-Based**: Admin login with bcrypt hashing
- **Page Protection**: Per-page password gates for public stats

### Development Tools

| Tool | Version | Purpose |
|------|---------|----------|
| **ESLint** | 8.57.0 | JavaScript/TypeScript linting |
| **eslint-config-next** | 15.5.4 | Next.js-specific ESLint rules |
| **TypeScript Compiler** | 5.6.3 | Type checking (tsc --noEmit) |
| **npm** | ≥8.0.0 | Package manager |

**Build Tools**:
- Next.js built-in bundler (Turbopack in dev mode)
- TypeScript compiler for type checking
- ESLint for code quality enforcement

### Infrastructure & Deployment

| Service | Purpose |
|---------|----------|
| **Vercel** | Next.js app hosting (automatic deployment from GitHub main) |
| **Railway/Heroku** | WebSocket server hosting (separate Node.js process) |
| **MongoDB Atlas** | Cloud database (free tier or paid) |
| **Vercel Edge Network** | CDN for static assets and API routes |
| **GitHub** | Source control and CI/CD trigger |

**Environment Configuration**:
```bash
# Required in .env.local and Vercel Environment Variables
MONGODB_URI=mongodb+srv://...
MONGODB_DB=messmass
NEXT_PUBLIC_WS_URL=wss://websocket-server.com
ADMIN_PASSWORD=secure_password

# Optional (Bitly integration)
BITLY_ACCESS_TOKEN=...
BITLY_ORGANIZATION_GUID=...
BITLY_GROUP_GUID=...
```

### Database Schema Summary

| Collection | Purpose | Indexes |
|------------|---------|----------|
| `projects` | Event records with stats | eventDate, updatedAt, slug |
| `partners` | Partner organizations | name, createdAt |
| `bitly_links` | Bitly link metadata | bitlink, createdAt |
| `bitly_project_links` | Link-project associations (many-to-many) | projectId, linkId |
| `hashtag_categories` | Category definitions with colors | name |
| `hashtags` | Hashtag usage tracking | _id (hashtag text) |
| `notifications` | Multi-user notifications | createdAt, archivedBy |
| `variablesConfig` | Variable flags and overrides | name |
| `variableGroups` | Editor layout groups | groupOrder |
| `users` | Admin users | email (unique) |

### Real-Time Architecture

**WebSocket Server** (Separate Node.js Process):
- **Location**: `server/websocket-server.js`
- **Port**: 7654 (configurable)
- **Protocol**: WebSocket (ws library)
- **Features**:
  - Project-based rooms for isolation
  - Automatic reconnection with exponential backoff
  - Heartbeat mechanism (ping/pong)
  - Message types: join-project, stat-update, project-update

**Client-Side Integration**:
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
8. **Edge Functions**: API routes deployed to Vercel Edge Network

### Security Measures

1. **HTTP-Only Cookies**: Session tokens never accessible via JavaScript
2. **CSRF Protection**: SameSite cookie attribute
3. **Password Hashing**: Bcrypt for admin passwords (if implemented)
4. **Environment Variables**: Secrets never committed to repository
5. **API Authentication**: Middleware validates session on all protected routes
6. **Input Validation**: TypeScript + runtime validation on API endpoints
7. **MongoDB Injection Prevention**: Parameterized queries via MongoDB driver
8. **Rate Limiting**: (To be implemented) Prevent brute force attacks

---

## Future Enhancements

### Planned Features (Version 2.3.0+)
- **Shareables Component Library** - Extract reusable components for other projects
- **Advanced Analytics** - Category-based project analytics and insights
- **Import/Export** - Category-aware project data migration tools
- **Team Collaboration** - Shared category definitions across team projects

### Technical Debt
- Consider MongoDB aggregation pipelines for complex filtering scenarios
- Implement caching layer for frequently accessed hashtag categories
- Add comprehensive error handling for category-related operations

---

## Contributing

When working with the hashtag categories system:

1. **Utility Functions**: Always use `hashtagCategoryUtils.ts` functions for consistency
2. **API Design**: Maintain backward compatibility when modifying hashtag-related endpoints
3. **UI Components**: Follow the established pattern for category color application
4. **Testing**: Manually validate both traditional and categorized hashtag workflows
5. **Documentation**: Update this document when adding new category-related features

---

*Last Updated: 2025-01-21T11:14:00.000Z*  
*Version: 6.0.0*  
*Status: Production-Ready — Enterprise Event Analytics Platform*
