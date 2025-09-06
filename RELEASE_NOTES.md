# MessMass Release Notes

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
