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

## 🔍 MANDATORY: Implementation Standards

### Search Before Creating (NON-NEGOTIABLE)

**Before writing ANY code:**

1. **Search for similar implementations** in the codebase
2. **Identify the reference file** to copy from
3. **Use the exact same pattern** - class names, structure, tokens
4. **Verify with examples** below

### Reference Implementations

#### Modals - MUST Use FormModal

**Reference:** `components/modals/FormModal.tsx` + `.module.css`

```tsx
// ✅ CORRECT
import FormModal from '@/components/modals/FormModal';

<FormModal
  isOpen={isOpen}
  onClose={onClose}
  onSubmit={handleSubmit}
  title="Modal Title"
  size="lg"
>
  {/* Content */}
</FormModal>
```

**CSS Pattern (if needed):**
```css
/* EXACT MATCH to FormModal structure */
.header {
  padding: 2rem;
  padding-right: 3.5rem;
  border-bottom: 1px solid var(--mm-gray-200);
}

.body {
  padding: 2rem;
  overflow-y: auto;
}

@media (max-width: 640px) {
  .header { padding: 1.5rem; padding-right: 3rem; }
  .body { padding: 1.5rem; }
}
```

**Real Examples:**
- `components/SharePopup.tsx` (lines 110-231)
- `components/PageStyleEditor.tsx` (lines 105-536)

#### Cards - MUST Use ColoredCard

**Reference:** `components/ColoredCard.tsx`

```tsx
// ✅ CORRECT
import ColoredCard from '@/components/ColoredCard';

<ColoredCard accentColor="#3b82f6" hoverable={true}>
  {/* Content */}
</ColoredCard>
```

**Examples:**
- `app/admin/projects/ProjectsPageClient.tsx` (lines 205-220)
- `app/admin/filter/page.tsx` (lines 195-210)

#### Forms - Use Standard Classes

**Pattern:**
```tsx
<div className="form-group mb-4">
  <label className="form-label-block">Label *</label>
  <input type="text" className="form-input" />
</div>
```

**Reference:** `app/admin/projects/ProjectsPageClient.tsx` (lines 916-960)

### Design Tokens (MANDATORY)

**ALL styling MUST use design tokens. Hardcoded values = REJECTION.**

```css
/* ✅ CORRECT: Design tokens */
.component {
  color: var(--mm-gray-900);
  background: var(--mm-white);
  padding: var(--mm-space-4);
  font-size: var(--mm-font-size-sm);
  border-radius: var(--mm-radius-lg);
  transition: all var(--transition-fast);
}

/* ❌ FORBIDDEN: Hardcoded values */
.bad {
  color: #1f2937;        /* ❌ Use var(--mm-gray-900) */
  padding: 16px;         /* ❌ Use var(--mm-space-4) */
  font-size: 14px;       /* ❌ Use var(--mm-font-size-sm) */
  border-radius: 8px;    /* ❌ Use var(--mm-radius-lg) */
}
```

**Token Reference:** `app/styles/theme.css`

### Enforcement

**Code will be REJECTED for:**
- ❌ Not searching existing implementations first
- ❌ Using hardcoded colors/spacing instead of tokens
- ❌ Creating custom modals instead of FormModal
- ❌ Creating custom cards instead of ColoredCard
- ❌ Deviating from reference implementations
- ❌ Using inline `style` prop (except PageStyle gradients)

**Verification Commands:**
```bash
# Check for hardcoded hex colors
grep -r "#[0-9a-f]\{6\}" --include="*.css" components/

# Check for hardcoded px values
grep -r "[3-9][0-9]*px" --include="*.css" components/

# Check for inline styles
grep -r 'style={{' --include="*.tsx" components/ app/
```

**See:** `CODING_STANDARDS.md` for complete rules and examples

## 🏭️ System Architecture

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
- **No inline styles** - The `style` prop is PROHIBITED on DOM elements (see `CODING_STANDARDS.md`)

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
    // ALL variables stored here (system + custom)
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
    // Event metrics
    eventAttendees?: number,
    eventTicketPurchases?: number,
    // Bitly metrics
    totalBitlyClicks?: number,
    uniqueBitlyClicks?: number,
    // ... all 96 system variables + user-created custom variables
    // Access pattern: project.stats.variableName (Single Reference System)
  },
  createdAt: string, // ISO 8601 with milliseconds
  updatedAt: string  // ISO 8601 with milliseconds
}
```

### Variables Metadata Collection (v7.0.0)
```typescript
{
  _id: ObjectId,
  name: string,               // Database field name (camelCase)
  alias: string,              // UI display label (editable in KYC Management)
  type: 'number' | 'text' | 'derived',
  category: string,           // e.g., 'images', 'demographics'
  visibleInClicker: boolean,  // Show in Clicker UI
  editableInManual: boolean,  // Allow manual editing
  isSystemVariable: boolean,  // true for seeded variables, false for custom
  clickerOrder?: number,      // Button display order
  createdAt: Date,
  updatedAt: Date
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

### Analytics Collections (v6.26.0)
```typescript
// analytics_aggregates - Pre-computed event metrics
{
  _id: ObjectId,
  projectId: ObjectId,
  eventDate: string,
  aggregationType: 'event',
  partnerContext: {
    partnerId: ObjectId,
    opponentId: ObjectId,
    partnerName: string,
    opponentName: string,
    isHomeGame: boolean
  },
  fanMetrics: {
    totalFans: number,
    engagementRate: number,
    coreFanTeam: number,
    // ... other fan KPIs
  },
  merchMetrics: {
    totalMerched: number,
    penetrationRate: number,
    // ... other merch KPIs
  },
  adMetrics: {
    totalROI: number,
    socialValue: number,
    emailValue: number,
    // ... other ad KPIs
  },
  rawStats: { /* original project.stats */ },
  version: string,
  createdAt: string,
  updatedAt: string
}

// aggregation_logs - Background job tracking
{
  _id: ObjectId,
  jobType: 'event_aggregation',
  status: 'success' | 'partial_failure' | 'failed',
  startTime: string,
  endTime: string,
  duration: number,
  projectsProcessed: number,
  projectsFailed: number,
  errors: Array<{ projectId: ObjectId, message: string }>,
  createdAt: string // TTL: 30 days
}
```

## 📊 Analytics Infrastructure (v6.26.0)

### Background Aggregation Job
- **Script**: `npm run analytics:aggregate`
- **Schedule**: Every 5 minutes (cron or manual)
- **Function**: Pre-computes analytics metrics for fast API responses
- **Performance**: Processes 100+ projects within 5-minute window
- **Strategy**: Incremental aggregation (only updated projects)
- **Indexes**: 20 optimized indexes across 4 collections

### Business Model Constants (CPM)
```typescript
AD_MODEL_CONSTANTS = {
  EMAIL_OPTIN_CPM: €4.87,        // Email opt-in value
  EMAIL_ADDON_CPM: €1.07,        // Additional email opens
  STADIUM_AD_CPM: €6.00,         // In-stadium ad exposure
  SOCIAL_ORGANIC_CPM: €14.50,    // Social media impressions
  YOUTH_PREMIUM: €2.14,          // Gen Alpha/YZ premium
  SOCIAL_SHARES_PER_IMAGE: 20,
  AVG_VIEWS_PER_SHARE: 300,
  EMAIL_OPEN_RATE: 0.35            // 35% average
}
```

### Key Files
- **`lib/analytics.types.ts`** - Complete TypeScript type system
- **`lib/analyticsCalculator.ts`** - CPM-based metric calculations
- **`scripts/setupAnalyticsIndexes.ts`** - MongoDB index setup
- **`scripts/aggregateAnalytics.ts`** - Background aggregation job
- **`app/api/analytics/*`** - 5 analytics API endpoints

### Setup Commands
```bash
# One-time index setup
npm run analytics:setup-indexes

# Manual aggregation run
npm run analytics:aggregate

# Backfill historical data (future)
npm run analytics:backfill
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

### Analytics APIs (Phase 1 - v6.26.0)
- **`GET /api/analytics/event/[projectId]`** - Single event pre-computed analytics
  - Query: `includeBitly` (default: true), `includeRaw` (default: false)
  - Performance: <100ms response time
  - Returns: Fan metrics, merch metrics, ad metrics, demographics, visit metrics
- **`GET /api/analytics/partner/[partnerId]`** - Partner-level aggregated metrics
  - Query: `timeframe` ('all', 'season', 'year', 'month'), `includeEvents` (default: false)
  - Performance: <200ms response time
  - Returns: Summary across all partner events, optional event breakdown
- **`GET /api/analytics/trends`** - Time-series analytics for trend visualization
  - Query: `startDate` (required), `endDate` (required), `partnerId` (optional), `metrics` (comma-separated), `groupBy` ('day', 'week', 'month')
  - Performance: <500ms for 1-year datasets
  - Returns: Time-series data points, summary statistics
- **`GET /api/analytics/compare`** - Compare 2-5 events side-by-side
  - Query: `projectIds` (comma-separated, 2-5 required), `metrics` (comma-separated)
  - Performance: <300ms for 5 events
  - Returns: Comparative analysis with rankings and deltas
- **`GET /api/analytics/benchmarks`** - League/category benchmark statistics
  - Query: `category` (optional), `metric` (optional), `period` ('all', 'year', 'quarter', 'month')
  - Performance: <500ms for full dataset
  - Returns: Percentile distributions (p10, p25, p50, p75, p90, p95), mean, median, std dev, top performers

### Insights API (Phase 2 - v6.27.0)
- **`GET /api/analytics/insights/[projectId]`** - AI-generated actionable insights
  - Query: `includeRecommendations` (default: true), `severity` (filter by priority)
  - Performance: <300ms response time
  - Returns: 5-10 prioritized insights with categories, confidence scores, and recommendations
  - Features: Anomaly detection, trend analysis, benchmarking, opportunity identification

## 🧠 Insights Engine & Intelligence Layer (v6.27.0)

### Core Intelligence Libraries

**Anomaly Detection** (`lib/anomalyDetection.ts`):
- **Z-Score Method**: Statistical outlier detection (>2σ from mean)
- **IQR Method**: Interquartile range for robust outlier identification
- **Percent Change**: Detect significant deviations from baseline
- **Multi-Method Consensus**: Combine methods for high-confidence detection
- Use case: Identify unusual spikes/drops in attendance, merch sales, ad value

**Trend Analysis** (`lib/trendAnalysis.ts`):
- **Moving Averages**: Simple and exponential moving averages
- **Linear Regression**: Fit trend lines and predict future values
- **Growth Rate**: MoM, QoQ, YoY calculations with annualization
- **Seasonality Detection**: Autocorrelation analysis for recurring patterns
- **Volatility Analysis**: Coefficient of variation for trend reliability
- Use case: Identify growth trajectories, forecast next event performance

**Benchmarking Engine** (`lib/benchmarkEngine.ts`):
- **Percentile Ranking**: Compare against league/venue/historical distributions
- **Performance Rating**: Excellent (>p75), Good (>p50), Average, Below Average (<p25)
- **Multi-Metric Benchmarking**: Compare multiple KPIs simultaneously
- **Historical Comparisons**: Event-over-event performance tracking
- **Outlier Identification**: Flag statistically exceptional performances
- Use case: Understand event performance relative to peers and history

**Insights Engine** (`lib/insightsEngine.ts`):
- **Anomaly Insights**: Auto-generate explanations for detected outliers
- **Trend Insights**: Natural language descriptions of growth patterns
- **Benchmark Insights**: Performance positioning with recommendations
- **Opportunity Insights**: Identify untapped potential and improvement areas
- **Prioritization**: Sort by impact (critical > high > medium > low) and confidence
- Use case: Generate 5-10 actionable insights per event for stakeholder reports

### Insight Structure

```typescript
interface Insight {
  id: string;
  category: 'anomaly' | 'trend' | 'benchmark' | 'opportunity';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string; // Short headline
  message: string; // Detailed explanation
  metrics: string[]; // Affected metrics
  confidence: number; // 0-1, how reliable the insight is
  impact: 'positive' | 'negative' | 'neutral';
  recommendation: string; // Actionable advice
  context: Record<string, unknown>; // Supporting data
}
```

### Insight Generation Flow

1. **Fetch Data**: Current event aggregate + 50 historical events (same partner) + 500 league benchmarks
2. **Run Analyses**: Anomaly detection → Trend analysis → Benchmarking → Opportunity identification
3. **Generate Insights**: Each analysis produces 0-3 insights with natural language
4. **Prioritize**: Sort by priority (critical first) and confidence (high first)
5. **Return Top 10**: Most important and actionable insights for decision-making

### Key Files
- **`lib/anomalyDetection.ts`** (389 lines) - Statistical outlier detection
- **`lib/trendAnalysis.ts`** (459 lines) - Trend fitting and forecasting
- **`lib/benchmarkEngine.ts`** (383 lines) - Percentile-based comparisons
- **`lib/insightsEngine.ts`** (437 lines) - Rule-based insight generation
- **`app/api/analytics/insights/[projectId]/route.ts`** (224 lines) - Insights API endpoint

### Performance Targets (Phase 2)
- **Anomaly Detection**: <10ms per metric
- **Trend Analysis**: <50ms per metric with 50 data points
- **Benchmarking**: <100ms per metric with 500 benchmarks
- **Insights Generation**: <200ms for complete report (5-10 insights)
- **API Response Time**: <300ms total (including database queries)

### Example Use Cases

**Anomaly Insight**:
> "🚨 Total Fans spike: 2,531 fans (+127% vs. avg 1,113) — highest in 12 months"
> Recommendation: "Analyze what drove attendance surge (opponent, promotion, timing) and replicate for future events."

**Trend Insight**:
> "📈 Merchandise Sales upward trend (strong confidence: 82%) — +45.3% change"
> Recommendation: "Merchandise momentum is strong. Expand product variety to capitalize on growing demand."

**Benchmark Insight**:
> "⭐ Ad Value: €14,790 ranks at 78th percentile — above league average"
> Recommendation: "Leverage high ad value performance in marketing materials"

**Opportunity Insight**:
> "💡 Merchandise penetration at 38% — growth potential. Only 38% of 2,531 fans purchased merchandise. Industry average is 50-60%."
> Recommendation: "Improve merchandise visibility and variety. Potential revenue uplift: €15,186 (20% increase at €30/fan)"

## 🔢 Database-First Variables & Metrics System (v7.0.0)

### System Overview

MessMass uses a **database-first variable management system** where all variables are stored in MongoDB and seeded on server initialization. Variables are accessed via the **Single Reference System** using the `stats.` prefix.

### Key Files
- **`lib/variablesConfig.ts`** - System variables seed data (96 variables)
- **`scripts/seedVariables.ts`** - Database seeding script
- **`lib/variableRefs.ts`** - SEYU token generation with normalization
- **`app/admin/kyc/page.tsx`** - KYC Management UI (alias editing)
- **`app/api/variables-config/route.ts`** - Configuration API

### Seeding Variables

**First-time setup or after schema changes:**
```bash
npm run seed:variables
```

This populates the `variables_metadata` collection with all system variables.

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

**System Variables** (96 total, seeded from `lib/variablesConfig.ts`):
- **Images**: `remoteImages`, `hostessImages`, `selfies`
- **Fans**: `remoteFans`, `stadium`
- **Demographics**: `female`, `male`, `genAlpha`, `genYZ`, `genX`, `boomer`
- **Merchandise**: `merched`, `jersey`, `scarf`, `flags`, `baseballCap`, `other`
- **Visits**: `visitQrCode`, `visitShortUrl`, `visitWeb`, `socialVisit`
- **Event**: `eventAttendees`, `eventResultHome`, `eventResultVisitor`
- **Bitly**: `totalBitlyClicks`, `uniqueBitlyClicks`, `bitlyClicksByCountryUS`, etc.

**Derived Variables** (auto-computed):
- `allImages`: `remoteImages + hostessImages + selfies`
- `totalFans`: `remoteFans + stadium`
- `totalVisit`: Sum of all visit sources

**Custom Variables**:
- User-created via Admin UI → stored in `variables_metadata` collection
- Stored in `project.stats` with camelCase naming

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

### Single Reference System

All code and formulas MUST reference variables using the `stats.` prefix:

```typescript
// ✅ CORRECT: Single Reference System
const value = project.stats.remoteImages;
const formula = 'stats.remoteImages + stats.hostessImages';

// ❌ WRONG: Direct field access
const value = project.remoteImages;
```

**Why?** All variables are stored in MongoDB under `project.stats`, ensuring a single source of truth.

### Common Patterns

**Adding a New System Variable**:
1. Add to `VARIABLES_CONFIG` in `lib/variablesConfig.ts`
2. Add SEYU mapping to `EXPLICIT_SUFFIX_MAP` in `lib/variableRefs.ts` (if needed)
3. Run `npm run seed:variables` to update database

**Creating Custom Variable (User)**:
1. Go to `/admin/kyc`
2. Click "Add Variable"
3. Fill form: name (camelCase), alias (display label), type, category, flags
4. Variable persists in MongoDB and appears in Editor

**Editing Alias (Display Name)**:
1. Go to `/admin/kyc`
2. Find variable card
3. Edit "Alias" field (UI label only, does NOT affect database field)
4. Changes save automatically

**Hiding Variable from Clicker**:
1. Go to `/admin/kyc`
2. Find variable card
3. Uncheck "Visible in Clicker"
4. Save automatically persists flag

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

## 🎨 Chart System & Visualization (v9.0.0)

### Chart Types
- **PIE** - 2 elements, circular segments with percentages
- **BAR** - 5 elements, horizontal bars with legends
- **KPI** - 1 element, large metric display with emoji
- **TEXT** - 1 element, formatted text display
- **IMAGE** - 1 element, full-width image display

### Chart Components
- **`components/DynamicChart.tsx`** - Main chart renderer (all types)
- **Chart export** - html2canvas integration for PNG downloads
- **Formatting system** - Flexible prefix/suffix with rounding control

## 📄 PDF Export System

### Critical Implementation Rule: Object-Fit Cover Handling

**MANDATORY**: When exporting PDFs with `html2canvas`, images using `object-fit: cover` MUST be converted to `background-image` before capture to preserve cropping.

**Problem**: `html2canvas` captures the full image (e.g., 100x100px) even when CSS crops it with `object-fit: cover` (e.g., to 100x60px center). This causes distortion in PDFs.

**Solution** (implemented in `lib/export/pdf.ts`):
1. Before capture: Find all `img` elements with `object-fit: cover`
2. Replace with `div` elements using `background-image` + `background-size: cover`
3. Capture with `html2canvas` (backgrounds crop correctly)
4. After capture: Restore original `img` elements

**Code Pattern**:
```typescript
// Convert images to background divs before capture
const imagesToRestore = [];
const coverImages = element.querySelectorAll('img');
coverImages.forEach((img) => {
  if (getComputedStyle(img).objectFit === 'cover') {
    const placeholder = document.createElement('div');
    placeholder.style.backgroundImage = `url("${img.src}")`;
    placeholder.style.backgroundSize = 'cover';
    placeholder.style.backgroundPosition = 'center';
    // ... copy all relevant styles
    parent.replaceChild(placeholder, img);
    imagesToRestore.push({ parent, img, placeholder });
  }
});

// Capture with html2canvas
await html2canvas(element, options);

// Restore original images
imagesToRestore.forEach(({ parent, img, placeholder }) => {
  parent.replaceChild(img, placeholder);
});
```

**When to Apply**:
- ✅ All PDF exports using `html2canvas`
- ✅ Any component with `object-fit: cover` images
- ✅ Image charts, hero images, background images

**Key Files**:
- **`lib/export/pdf.ts`** - PDF export with object-fit handling
- **`app/styles/components.css`** - `.image-chart-img` uses `object-fit: cover`

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
- **No inline styles** - `style` prop forbidden on DOM elements; use CSS modules or utility classes

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
- **`CODING_STANDARDS.md`** - **MANDATORY** coding standards including inline style prohibition
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

*Version: 8.16.1 | Last Updated: 2025-10-30T21:10:00.000Z (UTC) | Status: Production-Ready*
