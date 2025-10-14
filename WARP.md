# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## ⚡ Quick Start Commands

### Development Environment
```bash
# Main application development
npm run dev              # Start Next.js app on :3000

# WebSocket server (separate terminal)
cd server && npm start   # WebSocket server on :7654

# Production build and validation
npm run build           # Build for production
npm run type-check      # TypeScript validation
npm run lint            # ESLint validation
```

### Critical Pre-Flight Checks
Before any development work:
1. **Increment PATCH version** in `package.json` before `npm run dev`
2. **Search existing codebase** before creating any new component/function/file
3. **Check dependencies** - reuse existing patterns and components

## 🏗️ System Architecture

**MessMass** is a real-time collaborative event statistics dashboard with:

### Frontend Architecture
- **Next.js 15.4.6** with App Router (`/app` directory)
- **TypeScript** with strict mode for type safety
- **React 18** with real-time WebSocket integration
- **CSS Modules** with project-wide CSS variables (see `app/styles/theme.css`) for styling
- **Component-based architecture** with unified hashtag system

### Backend Architecture
- **MongoDB Atlas** for data persistence
- **Standalone WebSocket server** (Node.js) for real-time collaboration
- **Next.js API routes** for REST operations (`/app/api`)
- **Session-based authentication** with HTTP-only cookies

### Real-Time System
- **WebSocket server**: `server/websocket-server.js` (port 7654)
- **Project-based rooms** for isolated collaboration
- **Automatic reconnection** with exponential backoff
- **Message types**: `join-project`, `stat-update`, `project-update`, `heartbeat`

## 📁 Key Directory Structure

```
messmass/
├── app/                    # Next.js App Router
│   ├── api/               # REST API endpoints
│   ├── admin/             # Admin panel pages
│   ├── stats/[slug]/      # Public project stats
│   ├── edit/[slug]/       # Project editing
│   └── filter/[slug]/     # Hashtag filtering
├── components/            # React components
├── lib/                   # Utility functions
│   ├── mongodb.ts         # Database connection
│   ├── auth.ts           # Authentication logic
│   └── hashtagCategoryUtils.ts
├── hooks/                 # Custom React hooks
├── server/               # WebSocket server (separate service)
├── contexts/             # React contexts
├── public/               # Static assets
└── scripts/              # Database migration scripts
```

## 🎯 Unified Hashtag System

The project features a **completely unified hashtag system** with consistent components:

### Core Components
- **`ColoredHashtagBubble`** - Universal hashtag display (interactive, removable modes)
- **`UnifiedHashtagInput`** - Category-aware hashtag input with autocomplete
- **`useHashtags`** - Centralized API hook for all hashtag operations

### Category System
- **Category-prefixed hashtags**: `"category:hashtag"` format
- **Dual storage**: Both plain and categorized hashtags in database
- **Color inheritance**: Categories define hashtag colors
- **Backward compatibility**: Existing plain hashtags work unchanged

## 🔄 Mandatory Development Protocols

### Versioning Requirements
```bash
# BEFORE npm run dev
# Increment PATCH version: 2.6.2 → 2.6.3

# BEFORE git commit  
# Increment MINOR, reset PATCH: 2.6.3 → 2.7.0
```

**Version must be updated in:**
- `package.json`
- All documentation files (ARCHITECTURE.md, TASKLIST.md, etc.)

### Code Quality Standards
- **All code MUST include comments** explaining what and why
- **Strategic comments**: Explain implementation decisions and architectural choices
- **TypeScript strict mode** enforced
- **ESLint validation** required before commits
- **No test files** - MVP factory approach (tests prohibited)

### Timestamp Format (Mandatory)
**All timestamps MUST use:** `YYYY-MM-DDTHH:MM:SS.sssZ`
- Database records (`createdAt`, `updatedAt`)
- WebSocket messages and logs
- Documentation timestamps

### Reuse Before Creation Rule
**BEFORE creating anything new:**
1. Search existing codebase for reusable components/functions
2. Check `components/`, `lib/`, `hooks/` directories
3. Review existing API patterns in `/app/api`
4. Only create new if existing solutions don't fit

## 🔧 Database Schema (MongoDB)

### Projects Collection
```typescript
{
  _id: ObjectId,
  eventName: string,
  eventDate: string, // ISO 8601
  hashtags?: string[], // Traditional hashtags
  categorizedHashtags?: { // Category-specific hashtags
    [categoryName: string]: string[]
  },
  stats: {
    // Image tracking
    remoteImages: number, hostessImages: number, selfies: number,
    // Demographics  
    female: number, male: number,
    genAlpha: number, genYZ: number, genX: number, boomer: number,
    // Location
    indoor: number, outdoor: number, stadium: number,
    // Merchandise
    merched: number, jersey: number, scarf: number, flags: number,
    baseballCap: number, other: number,
    // Success Manager metrics (optional)
    eventAttendees?: number,
    eventTicketPurchases?: number,
    // ... other optional success manager fields
  },
  createdAt: string, // ISO 8601 with milliseconds
  updatedAt: string  // ISO 8601 with milliseconds
}
```

### Hashtag Categories Collection
```typescript
{
  _id: ObjectId,
  name: string,        // e.g., "country", "period"
  color: string,       // Hex color code
  createdAt: Date,
  updatedAt: Date
}
```

## 🌐 API Endpoints

### Core APIs
- **`GET /api/projects`** - List projects. Supports:
  - Default mode: cursor pagination by updatedAt desc (nextCursor)
  - Sort/Search mode: offset pagination with totalMatched/nextOffset
  - sortField: eventName | eventDate | images | fans | attendees; sortOrder: asc | desc
- **`POST /api/projects`** - Create project (requires eventName, eventDate, stats)
- **`PUT /api/projects`** - Update project (supports hashtags and categorizedHashtags)
- **`DELETE /api/projects?projectId=...`** - Delete project

### Hashtag APIs
- **`GET /api/hashtags`** - All hashtags with project counts
- **`GET /api/hashtags/[hashtag]`** - Aggregated stats for specific hashtag
- **`POST /api/hashtags/filter`** - Filter projects by hashtags (admin)
- **`GET /api/hashtags/filter-by-slug/[slug]`** - Public filtering

### Admin APIs
- **`GET /api/admin/hashtag-categories`** - List categories
- **`POST /api/admin/hashtag-categories`** - Create category
- **`PUT /api/admin/hashtag-categories/[id]`** - Update category
- **`DELETE /api/admin/hashtag-categories/[id]`** - Delete category

### Variables APIs
- **`GET /api/variables-config`** - Fetch all variables with flags and ordering
- **`POST /api/variables-config`** - Create/update variable metadata and flags
- **`DELETE /api/variables-config?name=...`** - Delete custom variable
- **`GET /api/variables-groups`** - Fetch variable groups
- **`POST /api/variables-groups`** - Create/update group or seed defaults
- **`DELETE /api/variables-groups`** - Delete all groups

## 🔢 Admin Variables & Metrics System

### Key Files
- **`lib/variablesRegistry.ts`** - Base and derived variable definitions
- **`lib/variableRefs.ts`** - SEYU token generation with normalization
- **`app/admin/variables/page.tsx`** - Variables management UI
- **`app/api/variables-config/route.ts`** - Configuration API

### SEYU Reference Tokens

**Format**: `[SEYUSUFFIX]` with organization prefix

**Normalization Rules**:
- `ALL` → `TOTAL` (e.g., `allImages` → `[SEYUTOTALIMAGES]`)
- `VISITED` → `VISIT` (e.g., `eventValuePropositionVisited` → `[SEYUPROPOSITIONVISIT]`)
- `VISIT*` → `*VISIT` (e.g., `visitShortUrl` → `[SEYUSHORTURLVISIT]`)
- Add `FANS` suffix (e.g., `stadium` → `[SEYUSTADIUMFANS]`)
- Add `MERCH` prefix (e.g., `jersey` → `[SEYUMERCHERSEY]`)

**Usage in Chart Formulas**:
```javascript
"formula": "([SEYUMERCHEDFANS] / [SEYUTOTALFANS]) * [SEYUATTENDEES]"
```

### Variable Types

**Base Variables** (defined in registry):
- **Images**: `remoteImages`, `hostessImages`, `selfies`
- **Fans**: `remoteFans`, `stadium`
- **Demographics**: `female`, `male`, `genAlpha`, `genYZ`, `genX`, `boomer`
- **Merchandise**: `merched`, `jersey`, `scarf`, `flags`, `baseballCap`, `other`
- **Visits**: `visitQrCode`, `visitShortUrl`, `visitWeb`, `socialVisit`, `eventValuePropositionVisited`, `eventValuePropositionPurchases`
- **Event**: `eventAttendees`, `eventResultHome`, `eventResultVisitor`

**Derived Variables** (auto-computed):
- `allImages` (Total Images): `remoteImages + hostessImages + selfies`
- `totalFans`: `remoteFans + stadium`
- `totalVisit`: Sum of all visit sources

**Custom Variables**:
- User-defined metrics (e.g., `vipGuests`, `pressAttendees`)
- Created via Admin UI, stored in `project.stats`

### Visibility Flags

Each variable has two independent flags:

| Flag | Purpose | Default |
|------|---------|----------|
| `visibleInClicker` | Show in Editor Clicker UI | `true` for Images, Fans, Demographics, Merchandise |
| `editableInManual` | Allow manual editing | `true` for all base variables |

**Important**: Derived and text variables are NOT editable (flags forced to `false`).

### Variable Groups

Control Editor layout via groups:
- **Group Order**: Display sequence
- **Chart ID**: Optional KPI chart above variables
- **Title Override**: Custom section title
- **Variables Array**: Ordered list of variables in group

**Default Groups**:
1. Images (remoteImages, hostessImages, selfies) + `all-images-taken` chart
2. Location (remoteFans, stadium) + `total-fans` chart
3. Demographics (female, male, genAlpha, genYZ, genX, boomer)
4. Merchandise (merched, jersey, scarf, flags, baseballCap, other)

### Common Patterns

**Adding a New Variable**:
1. Add to `BASE_STATS_VARIABLES` in `lib/variablesRegistry.ts`
2. Add SEYU mapping to `EXPLICIT_SUFFIX_MAP` in `lib/variableRefs.ts` (if needed)
3. Variable appears in Admin UI with default flags based on category

**Creating Custom Variable**:
1. Go to `/admin/variables`
2. Click "New Variable"
3. Fill form: name (camelCase), label, type, category, flags
4. Variable persists in MongoDB and appears in Editor

**Hiding Variable from Clicker**:
1. Go to `/admin/variables`
2. Find variable card
3. Uncheck "Visible in Clicker"
4. Save automatically persists flag

**Reordering Clicker Buttons**:
1. Go to `/admin/variables`
2. Click "Reorder Clicker" button
3. Drag-and-drop within categories
4. Click "Save order"

## 🔒 Authentication System

- Full documentation: see `AUTHENTICATION_AND_ACCESS.md` for admin sessions, page passwords, and zero-trust access.

### Admin Access
- **Route**: `/admin` (protected by `middleware.ts`)
- **Login**: `/admin/login` with password-based auth
- **Session**: HTTP-only cookies via `lib/auth.ts`
- **Protection**: Route-level middleware for admin pages

### Page Protection
- **Public stats**: Password-protected via `lib/pagePassword.ts`
- **Edit access**: Session validation required
- **Admin features**: Full authentication required

## 🎨 Chart System & Visualization

### Enhanced Chart Components
- **`components/StatsCharts.tsx`** - SVG pie charts and horizontal bar charts
- **Chart export** - html2canvas integration for PNG downloads
- **Core Fan Team metric**: `(merched fans / total fans) × attendees`

### Chart Layout
```
Row 1: Merchandise | Engagement | Value
Row 2: Gender Distribution | Age Groups  
Row 3: Location | Sources
```

## 🚀 Deployment Architecture

### Development
```bash
npm run dev               # Next.js on :3000
cd server && npm start    # WebSocket on :7654 
```

### Production
- **Next.js app**: Deploy to Vercel
- **WebSocket server**: Deploy separately (Railway, Heroku, etc.)
- **Environment variables**: Set `NEXT_PUBLIC_WS_URL` to production WebSocket URL

### Required Environment Variables
```bash
# Database
MONGODB_URI=mongodb+srv://...
MONGODB_DB=messmass

# WebSocket (Real-time collaboration)
NEXT_PUBLIC_WS_URL=wss://your-websocket-server.com

# Authentication
ADMIN_PASSWORD=your_secure_password

# Bitly API Integration (v5.54.11+)
# WHAT: Required for Bitly link management and analytics
# WHY: Enables importing Bitly links and tracking click analytics for event URLs
BITLY_ACCESS_TOKEN=your_bitly_access_token
BITLY_ORGANIZATION_GUID=your_org_guid  # From Bitly dashboard URL
BITLY_GROUP_GUID=your_group_guid      # From Bitly dashboard URL
```

**Finding Bitly GUIDs:**
- Go to: `https://app.bitly.com/settings/organization/{ORG_GUID}/groups/{GROUP_GUID}`
- Example: `https://app.bitly.com/settings/organization/Ok3navgADoq/groups/Bk3nahlqFcH`
  - Organization GUID: `Ok3navgADoq`
  - Group GUID: `Bk3nahlqFcH`

**Bitly Access Token:**
- Get from: https://app.bitly.com/settings/api/
- Click "Generate Token" or use existing token

## ⚠️ Critical Rules & Prohibitions

### Mandatory Protocols
- **Documentation updates**: All relevant docs must be updated with changes
- **Version consistency**: Version must match across package.json and all documentation  
- **Comment requirements**: All code needs functional + strategic comments
- **Timestamp standards**: ISO 8601 with milliseconds everywhere
- **Board Card Width Rule**: All cards on any board/grid must have equal width within that board (set widths at the grid container, not per-card).

### Prohibited Patterns
- **No breadcrumb navigation** - Use clear top-level navigation
- **No test files** - MVP factory approach, tests are prohibited
- **No manual timestamps** - Must use ISO 8601 with milliseconds format
- **No component duplication** - Search and reuse before creating
- **No backup file suffixes** - Never commit files like `*2.tsx`, `*2.ts`, `page 3.tsx`, etc.

### File Naming and Version Control
- **Use git branches** for experimental work, not file copies
- **Prohibited file patterns**: `*2.tsx`, `*2.ts`, `*2.js`, `* 2.*`, `page N.tsx` (N > 2)
- **Version control over file copies**: Use branches, commits, tags for history
- **Clean working directory**: No backup files should exist in the repository
- **.gitignore enforcement**: Duplicate patterns are blocked to prevent accidental commits
- **Rationale**: Duplicate files confuse developers, bloat the repo, and create maintenance burden

## 📚 Documentation Ecosystem

For detailed information, see:
- **`ARCHITECTURE.md`** - Complete system architecture and component relationships
- **`HASHTAG_SYSTEM.md`** - Unified hashtag system documentation
- **`ADMIN_VARIABLES_SYSTEM.md`** - Variables & metrics management system
- **`TASKLIST.md`** - Current active tasks and project status
- **`LEARNINGS.md`** - Historical decisions and lessons learned
- **`ROADMAP.md`** - Future development plans and milestones
- **`RELEASE_NOTES.md`** - Version history and changes

## 🔍 Common Implementation Patterns

### Adding New Components
1. **Search** `components/` for similar existing components
2. **Check** if `ColoredHashtagBubble` or `UnifiedHashtagInput` can be reused
3. **Follow** existing naming conventions and styling patterns
4. **Include** strategic comments explaining design decisions

### Database Operations
1. **Use** existing MongoDB connection from `lib/mongodb.ts`
2. **Follow** existing API patterns in `/app/api` directories
3. **Maintain** timestamp consistency with ISO 8601 format (with milliseconds)
4. **Update** both traditional and categorized hashtag fields when relevant

### Real-Time Features
1. **Extend** existing WebSocket message types in `server/websocket-server.js`
2. **Follow** project-room pattern for isolation
3. **Implement** optimistic updates with server validation
4. **Handle** reconnection and error scenarios

---

## 📢 Notification System

### Intelligent Grouping (v5.54.12+)
- **5-minute time window** for grouping similar notifications
- **Prevents spam** during rapid editing workflows
- **Updates timestamp** instead of creating duplicates
- **Match criteria**: Same user + activity type + project + within 5 minutes

### Notification Types
- **create**: New project created (✨ icon)
- **edit**: Project details updated (✏️ icon)
- **edit-stats**: Statistics modified (📊 icon)

### Implementation
- **Backend**: `lib/notificationUtils.ts` with MongoDB time-window query
- **Frontend**: `components/NotificationPanel.tsx` with real-time updates
- **Database**: `notifications` collection with `readBy` and `archivedBy` arrays

---

*Version: 5.54.12 | Last Updated: 2025-10-14T11:48:00.000Z | Status: Active Development*
