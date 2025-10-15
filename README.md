# MessMass

**A comprehensive real-time collaborative event statistics dashboard with advanced partner management, intelligent link tracking, and modern flat design system.**

- **Version**: v6.0.0
- **Last Updated**: 2025-01-21T11:14:00.000Z
- **Website**: https://messmass.doneisbetter.com
- **Status**: Production-Ready — Full-featured event management platform with partner ecosystem

## Overview

MessMass is an enterprise-grade event analytics platform designed for sports organizations, venues, brands, and event managers. It provides real-time statistics tracking, intelligent partner management, automated event creation workflows, and comprehensive Bitly link analytics.

**Core Capabilities**:
- 📊 Real-time event statistics with WebSocket collaboration
- 🤝 Partner management system (clubs, federations, venues, brands)
- ⚡ Sports Match Builder for rapid event creation
- 🔗 Advanced Bitly integration with many-to-many event associations
- 🎨 Professional TailAdmin V2 flat design (zero gradients)
- 📈 Configurable metrics and KPI dashboards
- 🏷️ Unified hashtag system with category-aware organization
- 🔐 Zero-trust authentication with session-based admin access

## Quick Start

### Development Environment

```bash
# Install dependencies
npm install

# Start Next.js development server (port 3000)
npm run dev

# Start WebSocket server (port 7654) - in separate terminal
cd server && npm start
```

### Production Deployment

```bash
# Build for production
npm run build

# Validate TypeScript
npm run type-check

# Verify design system compliance
npm run style:check

# Deploy
# - Next.js app → Vercel (automatic via GitHub)
# - WebSocket server → Railway/Heroku (separate deployment)
```

### Environment Variables Required

```bash
# Database
MONGODB_URI=mongodb+srv://...
MONGODB_DB=messmass

# Real-time WebSocket
NEXT_PUBLIC_WS_URL=wss://your-websocket-server.com

# Authentication
ADMIN_PASSWORD=your_secure_password

# Bitly Integration (optional)
BITLY_ACCESS_TOKEN=your_bitly_token
BITLY_ORGANIZATION_GUID=your_org_guid
BITLY_GROUP_GUID=your_group_guid
```

## Documentation

### Core Documentation

| Document | Description |
|----------|-------------|
| **ARCHITECTURE.md** | Complete system architecture, database schemas, component hierarchy |
| **DESIGN_SYSTEM.md** | Design tokens, utility classes, UI patterns (authoritative source) |
| **WARP.md** | Development rules, protocols, and AI agent guidelines |
| **RELEASE_NOTES.md** | Versioned changelog with implementation details |
| **TASKLIST.md** | Active tasks with priorities, owners, and delivery dates |
| **ROADMAP.md** | Forward-looking development plans and milestones |
| **LEARNINGS.md** | Historical decisions, resolved issues, and best practices |

### Feature-Specific Guides

| Document | Description |
|----------|-------------|
| **ADMIN_VARIABLES_SYSTEM.md** | Variable manager, KPI configuration, SEYU tokens |
| **HASHTAG_SYSTEM.md** | Unified hashtag system with category colors |
| **BITLY_INTEGRATION_GUIDE.md** | Bitly API integration, analytics, many-to-many associations |
| **AUTHENTICATION_AND_ACCESS.md** | Admin auth, session management, zero-trust access |
| **ADMIN_LAYOUT_SYSTEM.md** | Admin navigation, sidebar, responsive layout patterns |
| **CARD_SYSTEM.md** | ColoredCard component API and usage patterns |
| **NOTIFICATION_INTEGRATION_GUIDE.md** | Multi-user notification system implementation |

### Implementation Guides

| Document | Description |
|----------|-------------|
| **BITLY_MANY_TO_MANY_IMPLEMENTATION.md** | Many-to-many link-event associations with temporal boundaries |
| **BITLY_MANY_TO_MANY_TESTING_GUIDE.md** | Testing scenarios for overlapping events |
| **CATEGORY_COLOR_SETUP_GUIDE.md** | Hashtag category color configuration |

### Public Resources

- **GitHub Repository**: https://github.com/moldovancsaba/messmass
- **Authentication Guide**: https://github.com/moldovancsaba/messmass/blob/main/AUTHENTICATION_AND_ACCESS.md
- **Live Demo**: https://messmass.doneisbetter.com

## Key Features

### Partner & Event Management

- **🤝 Partners Management System**
  - Comprehensive partner database (clubs, federations, venues, brands)
  - Partner profiles with emoji identifiers, hashtags, and Bitly links
  - Searchable partner directory with pagination and sorting
  - Reusable partner selector components with predictive search

- **⚡ Sports Match Builder** (Quick Add)
  - Rapid event creation from partner selection
  - Home/Away team selection with predictive search
  - Automatic hashtag merging (home team location + both teams' hashtags)
  - Bitly link inheritance from home team
  - Event name auto-generation with emoji prefix

- **📊 Event Statistics Dashboard**
  - Real-time statistics tracking via WebSocket
  - Clicker interface for rapid data entry
  - Manual entry for detailed metrics
  - Success Manager fields (attendees, ticket purchases, visit tracking)
  - Comprehensive demographic tracking (age groups, gender)
  - Merchandise tracking (jerseys, scarves, flags, caps)
  - Location and image source metrics

### Analytics & Tracking

- **🔗 Bitly Integration**
  - Many-to-many link-to-event associations
  - Temporal boundaries for accurate attribution
  - Auto-calculated date ranges (overlapping event handling)
  - Click analytics with country-level tracking
  - Referring domains and traffic source analysis
  - Cached metrics with daily refresh jobs
  - Bulk import from Bitly account (3000+ links)

- **📈 Variable & KPI Management**
  - Base variables (images, fans, demographics, merchandise)
  - Derived variables (total fans, all images, conversion rates)
  - Custom variables (user-defined metrics)
  - SEYU reference tokens for chart formulas
  - Visibility flags (clicker, manual entry)
  - Variable groups with ordering and chart assignments

### User Experience

- **🎨 Modern Flat Design System**
  - TailAdmin V2 design language (zero gradients)
  - Complete CSS variable system (`--mm-*` prefix)
  - 30+ utility classes for consistent styling
  - Responsive sidebar navigation
  - Professional Chart.js charts with PNG/PDF export
  - Google Fonts integration (Inter, Roboto, Poppins)

- **🏷️ Unified Hashtag System**
  - Category-aware hashtag organization
  - Color-coded categories with visual consistency
  - Predictive search with autocomplete
  - Chip-based display with remove functionality
  - Backward compatible with plain hashtags

- **🔔 Multi-User Notifications**
  - Real-time activity tracking
  - Intelligent grouping (5-minute windows)
  - Read/archive status per user
  - Project-specific notifications
  - Spam prevention via duplicate detection

### Administration

- **🔐 Security & Access Control**
  - Session-based admin authentication
  - HTTP-only cookies for security
  - Password-protected public stats pages
  - Zero-trust page access model
  - Automatic session timeout

- **🛠️ Admin Dashboard**
  - Project management with pagination and search
  - Partner management interface
  - Bitly link management and sync
  - Hashtag category color configuration
  - Variable and metrics configuration
  - Notification panel with filtering

### Technical Features

- **⚙️ Real-Time Collaboration**
  - WebSocket server for live updates
  - Project-based rooms for isolation
  - Automatic reconnection with exponential backoff
  - Heartbeat mechanism for connection health

- **💾 Data Management**
  - MongoDB Atlas for persistence
  - Optimistic updates with server validation
  - Automatic timestamp tracking (ISO 8601 with milliseconds)
  - Data migration scripts for schema updates
  - Infinite data retention (no rolling windows)

- **🚀 Developer Experience**
  - Next.js 15 with App Router
  - TypeScript strict mode
  - Reusable component library
  - Comprehensive inline documentation
  - Design system compliance validation (`npm run style:check`)
  - Full type safety across codebase

## Technology Stack

### Frontend

- **Framework**: Next.js 15.5.4 (App Router)
- **Language**: TypeScript 5.6.3 (strict mode)
- **UI Library**: React 18.3.1
- **Styling**: CSS Modules + CSS Variables (`--mm-*` design tokens)
- **Charts**: Chart.js 4.5.0 + react-chartjs-2 5.3.0
- **Export**: html2canvas 1.4.1 + jsPDF 3.0.1
- **Real-time**: WebSocket (ws 8.18.3)

### Backend

- **Database**: MongoDB Atlas 6.8.0
- **API**: Next.js API Routes (REST)
- **Authentication**: Session-based with HTTP-only cookies
- **External APIs**: Bitly API v4

### Development Tools

- **Linting**: ESLint 8.57.0 with Next.js config
- **Type Checking**: TypeScript Compiler
- **Build Tool**: Next.js built-in (Turbopack in dev)
- **Package Manager**: npm 8.0.0+

### Infrastructure

- **Hosting**: Vercel (Next.js app) + Railway/Heroku (WebSocket)
- **Database**: MongoDB Atlas (cloud)
- **CDN**: Vercel Edge Network
- **Monitoring**: Built-in error handling and logging

### Reusable Components

| Component | Purpose | Pattern |
|-----------|---------|----------|
| `PartnerSelector` | Partner selection with search | Chip-based selector |
| `ProjectSelector` | Project selection with search | Chip-based selector |
| `BitlyLinksSelector` | Multi-select Bitly links | Chip-based multi-select |
| `UnifiedHashtagInput` | Hashtag input with categories | Predictive autocomplete |
| `ColoredHashtagBubble` | Hashtag display | Category-colored chips |
| `AdminHero` | Page header with actions | Standardized admin header |
| `ColoredCard` | Content container | Accent border card |
| `NotificationPanel` | Activity notifications | Slide-in panel |
| `StatsCharts` | KPI visualizations | SVG pie + bar charts |

## Utility Classes (Quick Reference)

The design system provides 30+ utility classes for consistent styling:

### Layout & Containers

- `.page-bg-gray` / `.page-bg-white` - Page backgrounds
- `.loading-container` + `.loading-card` - Loading states
- `.error-container` + `.error-card` - Error states
- `.centered-flex` - Centered flexbox layout

### Cards & Panels

- `.card` / `.card-md` / `.card-lg` - Card variants
- `.card-header` / `.card-body` / `.card-footer` - Card sections

### Spacing

- `.p-sm` / `.p-md` / `.p-lg` / `.p-xl` - Padding utilities
- `.gap-sm` / `.gap-md` / `.gap-lg` - Gap utilities
- `.mt-*` / `.mb-*` - Margin utilities

### Flexbox

- `.flex` / `.flex-col` - Flex containers
- `.items-center` / `.justify-center` / `.justify-between` - Alignment

### Width & Text

- `.w-full` / `.max-w-*` - Width utilities
- `.text-center` / `.text-left` / `.text-right` - Text alignment

**Note**: All utilities use design tokens from `theme.css` (`--mm-*` variables). See `app/globals.css` for complete utility definitions.

## Design System Validation

MessMass enforces strict design system compliance:

```bash
# Check for design violations
npm run style:check
```

**Validation Rules**:
- ❌ No CSS gradients allowed (TailAdmin V2 flat design)
- ❌ No glass-morphism effects
- ✅ Zero violations required before commits
- ✅ Automated checking in CI/CD pipeline

## Standards & Conventions

### Timestamps

All timestamps throughout the application use **ISO 8601 format with milliseconds (UTC)**:

```
YYYY-MM-DDTHH:MM:SS.sssZ
Example: 2025-01-21T11:14:52.789Z
```

This applies to:
- Database records (`createdAt`, `updatedAt`)
- API responses
- WebSocket messages
- Documentation timestamps
- Notification timestamps

### Naming Conventions

- **Variables**: camelCase (`eventName`, `totalFans`)
- **Components**: PascalCase (`PartnerSelector`, `AdminHero`)
- **CSS Classes**: kebab-case (`.page-container`, `.btn-primary`)
- **CSS Variables**: kebab-case with prefix (`--mm-color-primary-500`)
- **API Routes**: kebab-case (`/api/partners`, `/api/bitly/links`)
- **Database Collections**: snake_case (`projects`, `bitly_links`, `hashtag_categories`)

### Code Documentation

All code includes comprehensive comments following the WHAT-WHY-HOW pattern:

```typescript
// WHAT: Brief description of what the code does
// WHY: Explanation of why this approach was chosen
// HOW: Implementation details (if complex)
```

## License

**MIT License**

Copyright (c) 2025 Csaba Moldovan

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

---

**MessMass v6.0.0** — Built with ❤️ by Csaba Moldovan  
**Repository**: https://github.com/moldovancsaba/messmass  
**Contact**: moldovancsaba@gmail.com
