# MessMass Release Notes

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
