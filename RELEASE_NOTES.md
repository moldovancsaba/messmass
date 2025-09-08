# MessMass Release Notes

## [v3.1.0] — 2025-09-08T09:14:45.000Z

### 🎯 Chart Visibility Fine-Tune
- Charts that would render "No data available" are now hidden from stats/filter/hashtag pages for that specific page view.
- Logic tightened in UnifiedDataVisualization: a chart is valid only if it has numeric elements and their sum > 0.

---

## [v3.0.0] — 2025-09-08T08:56:24.000Z

### 🚀 Major Update — Visualization Parity + CSV Table Exports
- Stats pages now render charts exactly as configured in Admin Visualization (parity across /stats, /filter, /hashtag)
- Two-column CSV exports (Variable, Value) across stats/filter/hashtag pages
- Centralized grid unit settings (GET/PUT /api/grid-settings), included in /api/page-config

### 🧹 Cleanup
- Removed legacy and duplicate files; unified components and styling
- Deleted outdated legacy stats page implementation

### ✅ Stability
- Type-check, lint, and production build verified

---

## [v2.18.0] — 2025-09-08T08:36:36.000Z

### 📄 CSV Export (Two-Column Table)
- All CSV exports on stats, filter, and hashtag pages now produce a two-column table with headers:
  - Variable, Value
- Each variable is a separate row:
  - Stats page: Event metadata (Event Name, Event Date, Created At, Updated At) + every project.stats field
  - Filter page: Filter Tags, Projects Matched, Date Range (Oldest/Newest/Formatted) + every project.stats field
  - Hashtag page: Hashtag, Projects Matched, Date Range (Oldest/Newest/Formatted) + every project.stats field
- Values are safely CSV-escaped and quoted.

### 🛠 Technical
- Updated export handlers in:
  - app/stats/[slug]/page.tsx
  - app/filter/[slug]/page.tsx
  - app/hashtag/[hashtag]/page.tsx

---

## [v2.17.0] — 2025-09-07T17:33:24.000Z

### 🧹 Cleanup & API
- Removed legacy file: app/stats/[slug]/page 2.tsx (superseded by unified stats page).
- Introduced Grid Settings API: GET/PUT /api/grid-settings for desktop/tablet/mobile unit configuration.
- Ensured page-config includes gridSettings (consumed by all stats pages and admin preview).

### 🛠 Technical
- Added lib/gridSettings.ts (central types/defaults/DB fetch/compute utilities).
- API uses settings collection doc {_id: 'gridSettings'} with upsert behavior.

---

## [v2.16.0] — 2025-09-07T17:18:45.000Z

### 📦 Release Finalization
- Documentation synchronized for visualization parity across stats and admin pages.
- Version bump to 2.16.0 per protocol (MINOR before commit).
- Type-check, lint, and build to be validated in this commit sequence.

### 🔎 Notes
- Core visualization parity details are listed in v2.15.1 entry below; this release formalizes and documents the change set across project docs.

---

## [v2.15.1] — 2025-09-07T17:16:38.000Z

### 📐 Visualization Parity & Chart Sizing
- Stats pages (/stats, /filter, /hashtag) now render charts with exactly the same grid, sizing, and behavior as configured in Admin Visualization.
- Desktop uses per-block gridColumns (as configured in admin), capped by global desktop units.
- Tablet/Mobile use global grid units with span clamping so widths greater than available units are gracefully limited to fit.
- Introduced per-block, id-scoped grid classes (udv-grid-[blockId]) with injected CSS to ensure specificity and avoid legacy overrides.
- Removed pixel-based min/max-width constraints for chart containers and legends so unit-based grid math is authoritative.

### 🛠 Technical
- Updated components/UnifiedDataVisualization.tsx to:
  - Apply per-block desktop columns (min 1, max block.gridColumns, capped by global desktop units).
  - Respect global tablet/mobile units and clamp chart spans accordingly.
  - Inject responsive CSS per block with !important flags where needed to neutralize legacy CSS.
  - Clamp chart width spans based on the current breakpoint’s unit count.
- Admin Visualization global preview continues to use the same shared component for exact parity.

---

## [v2.15.0] — 2025-09-06T14:21:50.000Z

### 🛠 Editor UX
- Fans (manual mode): Remote is now an input (stored as stats.remoteFans) instead of a non-editable stat card.

---

## [v2.14.0] — 2025-09-06T14:10:34.000Z

### ♻️ Variable Consolidation for Charts
- New variables: [REMOTE_FANS] (indoor + outdoor) and [SOCIAL_VISIT] (sum of social platforms)
- Formula engine supports REMOTE_FANS and SOCIAL_VISIT
- Default chart configs updated to use new variables (Fans Location, Engagement)
- Chart calculator totals now prefer stats.remoteFans when available

---

## [v2.13.0] — 2025-09-06T13:58:02.000Z

### 🧮 Edit Stats UI Overhaul
- Fans: show Remote (calculated Indoor+Outdoor), Location (renamed from Stadium), and Total Fans (calculated)
- Merch: “People with Merch” (label only; still stored as merched)
- Success Manager:
  - Image Management: Approved/Rejected Images (unchanged)
  - Visit Tracking: QR Code, Short URL, Web (unchanged)
  - eDM (moved up): Value Prop Visited/Purchases (formerly “Value Proposition”)
  - Social Visit: single aggregated field (sum of all social platforms)
  - Event Performance: Event Attendees, Event Result Home/Visitor (Ticket Purchases removed)

### 🔁 Migration Script
- Added scripts/migrate-stats-v2.13.0.js
  - stats.remoteFans = stats.indoor + stats.outdoor
  - stats.socialVisit = sum of individual social visits
  - Removes stats.eventTicketPurchases

---

## [v2.12.0] — 2025-09-06T12:49:22.000Z

### 🔧 Internal
- Centralized configuration in lib/config.ts (mongodbUri, dbName, adminPassword, nextPublicWsUrl, nodeEnv)
- Refactored multiple APIs to use config.dbName and config.adminPassword for consistency

---

## [v2.11.0] — 2025-09-06T12:38:27.000Z

### ✨ Improvements
- Admin area now auto-applies the configured Admin Style (settings: adminStyle) via app/admin/layout.tsx to admin-container/admin-header.
- Added inline “✓ saved” indicator for the style dropdown on /admin/filter when persisting a selection.

### 🛠 Technical
- No API changes; UI-only enhancement using existing admin-style endpoint.

---

## [v2.10.0] — 2025-09-06T11:38:15.000Z

### ✨ Features
- Persist filter style selection per hashtag combination via admin endpoint (auto-save on dropdown change)
  - New POST /api/admin/filter-style upserts styleId for a normalized hashtag combination in filter_slugs
  - Public /filter/[slug] applies the remembered style automatically
- Style application across pages
  - UnifiedStatsHero now forwards pageStyle to UnifiedPageHero, enabling styles on stats and filter pages
  - Hashtag stats page (/hashtag/[hashtag]) now fetches and applies page styles using /api/page-config?hashtags=...

### 🐛 Fixes
- page-config API no longer throws BSONError when projectId is a UUID
  - Only constructs ObjectId when ObjectId.isValid(projectId)
  - Guards project.styleId format before ObjectId conversion
- generateFilterSlug now persists provided styleId when a combination already exists

### 📦 Developer Notes
- Version bump: 2.9.7 → 2.10.0 (MINOR per protocol before commit)
- Build and type-check validated successfully

---

## [v2.7.0] — 2025-01-29T15:04:30.000Z

### 🎨 UI/UX Enhancements
- **New Loading Animation**: Replaced simple circular spinners with elegant rotating curve animation
- **Centered Loading Screen**: Loading states now appear in full-screen center overlay with glass-morphism card design
- **Consistent Loading Experience**: Applied new loading animation across stats, filter, and admin pages

### 📊 CSV Export Integration
- **Stats Page Export**: Added CSV export button directly to the UnifiedStatsHero component on individual project stats pages
- **Filter Page Export**: Added CSV export button to hashtag filter results pages for aggregated data export
- **Comprehensive Data Export**: CSV files include all project metrics, demographics, and success manager fields
- **Smart Filename Generation**: Export files use sanitized event names or hashtag combinations for clear identification

### 🔧 Technical Improvements
- **Enhanced CSS Animation System**: Added new curve-spinner animation with dual rotating elements for visual appeal
- **Loading State Standardization**: Centralized loading components with consistent styling across all pages
- **Component Integration**: Leveraged existing UnifiedStatsHero CSV export functionality for seamless user experience
- **Performance Optimization**: Loading animations use CSS transforms for smooth performance

### 🎯 User Experience Impact
- **Professional Loading States**: Beautiful, centered loading screens replace basic in-content spinners
- **Easy Data Export**: One-click CSV export directly from page headers for both individual projects and filtered results
- **Visual Consistency**: Unified loading experience across all application sections
- **Improved Accessibility**: Loading states provide clear visual feedback with descriptive text

### 💼 Business Value
- **Enhanced Data Accessibility**: Users can easily export detailed statistics for external analysis and reporting
- **Professional Presentation**: Elegant loading animations improve perceived application quality
- **Improved Workflow Efficiency**: Direct access to CSV export from stats and filter pages streamlines data workflows
- **Better User Retention**: Smooth, professional loading experiences reduce perceived wait times

---

## [v2.6.3] — 2025-01-29T16:00:00.000Z

### 📚 Documentation
- **WARP.md Creation**: Added comprehensive WARP.md file for AI development guidance
- **Development Guide**: Created consolidated reference for WARP instances with quick start commands, architecture overview, and mandatory project protocols
- **Project Rules Integration**: Included all critical development rules (versioning, commenting, timestamps, reuse-first principle)
- **Architecture Summary**: Documented unified hashtag system, database schema, API endpoints, and deployment architecture

### 🛠 Technical Changes
- Consolidated project documentation into a single practical reference for AI assistants
- Documented mandatory development protocols and prohibited patterns
- Created comprehensive API endpoint reference and database schema documentation

---

## [v2.6.2] — 2025-01-02

### 🐛 Bug Fixes
- **Background Overlay Fix**: Fixed white background overlay issue on stats pages caused by UnifiedPageHero component
- **Visual Consistency**: Resolved background gradient conflicts that were affecting page appearance

### 🛠 Technical Changes
- Removed `admin-container` class from UnifiedPageHero component which was adding unwanted background
- UnifiedPageHero now properly inherits page background without overlay interference
- Maintained all styling while fixing background rendering issue

---

## [v2.6.1] — 2025-01-02

### 🎨 UI/UX Improvements
- **Unified Block Styling**: Updated data visualization blocks in stats and filter pages to use consistent glass-card styling
- **Visual Consistency**: All data blocks now match the admin dashboard card design with proper border-radius and glass effect
- **Loading State Polish**: Improved loading and error state cards across stats and filter pages for consistent user experience

### 🛠 Technical Changes
- Enhanced UnifiedDataVisualization component to use `.glass-card` class for consistent styling
- Updated stats page loading/error states to match admin panel design system
- Updated filter page loading/error states to match admin panel design system
- Applied 20px border-radius and glass backdrop effect across all data visualization blocks

---

## [v2.6.0] — 2025-01-02

### ✨ Major Changes
- **Hashtag Pages Migration**: Removed deprecated individual hashtag statistics pages (`/hashtag/[hashtag]`)
- **Unified Statistics System**: All hashtag statistics now use the consolidated filter system for both single and multiple hashtag queries

### 🔄 URL Structure Changes
- **BREAKING**: Individual hashtag URLs (`/hashtag/example`) are no longer available
- **Redirect**: All old hashtag URLs automatically redirect to the filter system (`/filter/example`)
- **Benefit**: Consistent user experience between single and multi-hashtag statistics

### 🛠 Technical Improvements
- Enhanced filter API to handle direct hashtag queries (not just filter slugs)
- Updated admin project management to use new filter URLs for hashtag navigation
- Removed redundant API endpoint `/api/hashtags/[hashtag]`
- Added permanent redirects in Next.js configuration for SEO preservation

### 🗂 Architecture Changes
- Simplified routing structure with filter pages as single source of truth for hashtag statistics
- Consolidated codebase by removing duplicate hashtag page implementation
- Improved maintainability by reducing code duplication between hashtag and filter systems

### 📈 User Experience
- **Seamless Migration**: Existing hashtag links continue to work through automatic redirects
- **Consistent Interface**: Same UI components and styling for all hashtag statistics
- **Enhanced Functionality**: Single hashtag pages now have all the features of the filter system

---

## [v2.5.0] — 2025-01-02T13:50:00Z

### ✨ New Features
- **Manual/Clicker Mode Toggle**: Added toggle between manual input and clicker mode in editor dashboard
- **UI Reorganization**: Improved editor dashboard layout for better user experience

### 🐛 Bug Fixes
- Fixed build errors by removing duplicate files
- Fixed HashtagEditor to properly use context
- Fixed infinite loop in hashtag color fetching
- Fixed proper category color resolution

### 🛠 Technical Improvements
- Admin interface improvements and build optimizations
- Complete password protection implementation for pages
- Page-specific password protection system implementation

---

## [v2.4.0] — Previous Release

### ✨ Features
- Page-specific password protection system
- Enhanced admin system with hashtag categorization

### 🐛 Fixes
- Fixed edit page not saving category hashtags
- Fixed TypeScript errors in ColoredHashtagBubble component
- Recovered latest development work from stash

---

## [v2.3.x] — Previous Releases

### ✨ Features
- Major admin system refactor
- Hashtag categorization system implementation
- Enhanced project management capabilities

### 🐛 Bug Fixes
- Various TypeScript error fixes
- Improved hashtag handling and categorization
- Enhanced UI components and interactions
