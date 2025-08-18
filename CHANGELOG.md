# Changelog

All notable changes to the MessMass project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.0] - 2025-08-18

### 🏷️ Major Feature: Hashtag System Implementation
- **Hashtag Overview Dashboard**: Visual grid displaying all hashtags with project counts and direct navigation
- **Aggregated Statistics**: Combined analytics from all projects sharing the same hashtag
- **Project Tagging**: Add up to 5 hashtags per project for easy categorization and organization
- **Cross-Project Analytics**: Compare performance across related events using hashtag-based grouping
- **Date Range Aggregation**: Shows time span from oldest to newest project for each hashtag
- **Real-time Hashtag Updates**: Automatic recalculation when projects are created, modified, or deleted

### ✨ Added
- **`/api/hashtags` API**: Endpoint for hashtag management and statistics
- **`/api/hashtags/[hashtag]` API**: Aggregated statistics endpoint for specific hashtags
- **`/app/hashtag/[hashtag]/page.tsx`**: Dedicated hashtag statistics visualization page
- **`components/HashtagInput.tsx`**: Reusable hashtag input component with tag management
- **Hashtag Overview Section**: Integrated into admin dashboard between Success Manager and Project Management
- **Responsive Hashtag Grid**: Auto-adjusting layout optimized for different screen sizes

### 🔧 Enhanced
- **Admin Dashboard**: Added hashtag overview section with visual buttons and navigation
- **Project Management**: Enhanced CRUD operations with hashtag support
- **Database Schema**: Extended project documents to include hashtags array field
- **State Management**: Improved React state handling for hashtag calculations and updates

### 🔍 Technical Improvements
- **Next.js 15 Compatibility**: Fixed async params pattern for dynamic routes
- **TypeScript Enhancements**: Proper type safety for hashtag-related components
- **Error Handling**: Comprehensive error states for hashtag operations
- **Performance Optimization**: Efficient hashtag calculation using client-side aggregation

### 📊 Admin Dashboard Features
- **Hashtag Buttons**: Large, interactive buttons showing hashtag names and project counts
- **Visual Design**: Gradient backgrounds with hover effects and smooth animations
- **Navigation Integration**: Direct links from hashtag overview to detailed statistics pages
- **Empty State Handling**: Graceful display when no hashtags exist in the system

### 🚀 Migration Benefits
- **Better Organization**: Projects can now be categorized and grouped using hashtags
- **Enhanced Reporting**: Aggregate analytics across multiple related events
- **Improved Navigation**: Quick access to related project statistics
- **Future-Proof**: Foundation for advanced filtering and search capabilities

## [1.3.0] - 2025-08-18

### 🏗️ Major Architecture Refactor
- **Modular CSS System**: Complete refactor from monolithic `globals.css` to focused CSS modules
- **Design Token System**: Centralized CSS variables for colors, typography, spacing, and effects
- **Performance Optimization**: Per-page CSS loading to reduce bundle size and improve loading performance
- **Maintainable Architecture**: Clear separation of concerns with dedicated files for different functionalities

### ✨ Added
- **`theme.css`**: Design tokens and CSS custom properties for consistent theming
- **`components.css`**: Reusable UI component styles (buttons, cards, forms, typography)
- **`layout.css`**: Grid systems, flexbox utilities, and responsive containers
- **`admin.css`**: Admin dashboard specific styling with modular imports
- **`charts.css`**: Chart visualization styles with enhanced bar and pie chart layouts
- **CSS_ARCHITECTURE.md**: Comprehensive documentation of the new design system

### 🎨 Enhanced Chart Styling
- **Two-Column Bar Charts**: Legends on left, colored bars on right for better readability
- **Improved Pie Charts**: Larger scale (1.4x), drop shadows, and shimmer animations
- **Clean Legend Design**: Removed box backgrounds, consistent with flat design principles
- **Color System**: CSS custom properties for dynamic bar colors and consistent theming
- **Responsive Grids**: Optimized chart layouts for different screen sizes

### 🔧 Technical Improvements
- **Import Strategy**: Selective CSS loading per page instead of global imports
- **CSS Custom Properties**: Dynamic color application using CSS variables
- **Build Optimization**: Improved CSS bundling and tree-shaking
- **Browser Compatibility**: Enhanced support across different browsers
- **Performance**: Reduced initial CSS payload and faster page loads

### 📚 Documentation Updates
- **README.md**: Updated with CSS architecture overview and modular system documentation
- **CSS_ARCHITECTURE.md**: Detailed design system documentation with examples and best practices
- **Project Structure**: Updated file structure to reflect new CSS organization

### 🚀 Migration Benefits
- **Maintainability**: Easier to modify and extend specific UI components
- **Performance**: Faster loading with reduced CSS bundle sizes
- **Scalability**: Clear patterns for adding new components and styles
- **Developer Experience**: Better organization and easier debugging

## [1.2.0] - 2025-08-18

### ✨ Added
- **Chart Algorithm Manager**: Admin interface for customizing chart formulas and configurations
- **Dynamic Chart System**: Data-driven chart rendering with configurable calculations
- **Formula Parser**: Advanced formula parsing with variables and mathematical functions
- **Chart Configuration API**: CRUD operations for chart settings and algorithms
- **Live Preview**: Real-time chart preview when editing formulas in admin panel

### 🔧 Enhanced
- **Admin Dashboard**: Integrated Chart Algorithm Manager with dedicated navigation
- **Chart Rendering**: Dynamic chart generation based on database configurations
- **Error Handling**: Improved error handling for chart calculations and API operations

## [1.1.0] - 2025-08-18

### 🔧 Fixed
- **MongoDB Connection**: Enhanced connection handling with timeout and retry options
- **Error Handling**: Improved API error responses and connection stability
- **Environment Variables**: Cleaned up duplicate configurations

## [1.0.3] - 2025-08-18

### ✨ Added
- **Core Fan Team Metric**: New advanced engagement calculation `(merched fans / total fans) × event attendees`
- **Enhanced Engagement Chart**: 5-metric analysis system with Front-runners, Fanaticals, and Casuals
- **Simplified Chart Legends**: Clean text-only labels without calculation details
- **Organized Chart Layout**: Logical row-based arrangement (Merch/Engagement/Value → Gender/Age → Location/Sources)
- **Large Emoji Centers**: 36px emojis in pie charts (👥📍🌐) for improved visual appeal
- **Sources Chart Simplification**: Combined QR+Short URL vs Other categories

### 🎨 Changed
- **Pie Chart Centers**: Removed number displays, enlarged emojis to 36px
- **Value Chart Labels**: Simplified to CPM, eDM, Ads, U40 Eng., Branding (text only)
- **Engagement Chart Labels**: Updated to Engaged, Interactive, Front-runners, Fanaticals, Casuals
- **Visitor Sources**: Renamed chart to "Sources" with simplified categories
- **Chart Calculations**: All metrics now return whole numbers using Math.round()

### 🔧 Fixed
- **Core Fan Team Calculation**: Corrected formula to use event attendees instead of visitors
- **Chart Visual Consistency**: Unified styling and emoji sizing across all charts
- **Engagement Explanations**: Removed calculation explanations from chart display

### 📚 Documentation
- Updated `memory.md` with latest chart system details and Core Fan Team metric
- Enhanced `README.md` with comprehensive feature overview and chart system documentation
- Updated `WARP.md` with chart implementation standards and Core Fan Team formula
- Created `CHANGELOG.md` for version tracking and feature documentation

## [1.0.2] - 2025-08-17

### ✨ Added
- **Chart Export Functionality**: PNG download capability for all charts using html2canvas
- **Individual Chart Components**: Separated chart logic into reusable components
- **Professional Chart Styling**: Consistent design with legends and totals

### 🔧 Fixed
- **html2canvas Integration**: Resolved build errors and dependencies
- **Chart Rendering**: Improved SVG-based pie chart rendering
- **Export Quality**: High-resolution PNG output for professional use

## [1.0.1] - 2025-08-16

### ✨ Added
- **Admin Dashboard**: Complete password-protected management interface
- **Authentication System**: Secure admin access with session management
- **Project Management**: CRUD operations for event projects
- **Data Visualization**: Initial chart system implementation
- **CSV Export**: Data export functionality for admin users

### 🎨 Changed
- **Design System**: Unified styling across main app and admin interface
- **Database Schema**: Enhanced with Success Manager fields
- **UI Components**: Glass-card effects with gradient backgrounds

## [1.0.0] - 2025-08-15

### 🎉 Initial Release
- **Real-time Collaboration**: Multi-user editing with WebSocket synchronization
- **Event Statistics Tracking**: Complete statistics management system
- **MongoDB Integration**: Cloud database with automatic persistence
- **Responsive Design**: Mobile, tablet, and desktop optimization
- **Professional UI**: Modern design with animations and visual effects
- **WebSocket Server**: Railway-hosted production server for real-time features

### 🛠️ Technical Stack
- **Frontend**: Next.js 15.4.6 with React 18 and TypeScript
- **Database**: MongoDB Atlas cloud storage
- **Real-time**: WebSocket server on Railway
- **Deployment**: Vercel for frontend, Railway for WebSocket
- **Styling**: Unified CSS design system

---

## Version Numbering

- **MAJOR**: Breaking changes or significant architecture updates
- **MINOR**: New features and enhancements
- **PATCH**: Bug fixes and minor improvements

## Links

- [Production Application](https://messmass.doneisbetter.com)
- [Admin Dashboard](https://messmass.doneisbetter.com/admin)
- [GitHub Repository](https://github.com/moldovancsaba/messmass)
- [Project Documentation](./memory.md)
