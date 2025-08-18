# Changelog

All notable changes to the MessMass project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
