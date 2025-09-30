# ROADMAP.md

Current Version: 5.11.0
Last Updated: 2025-09-30T11:47:48.000Z

## Operational — Style System Hardening (Q3 2025)
Priority: High
Dependencies: Design tokens, AdminHero, Layout utilities
- Action: Remove inline styles from admin hero, design manager, and editor dashboard; centralize into CSS Modules using tokens
- Action: Consolidate duplicated CSS files (components N.css, admin N.css, globals 2.css) — keep only canonical imports
- Action: Prepare Atlas-managed theme injection plan (GET/PUT /api/admin/theme)
Logged at: 2025-09-27T12:32:04.000Z
Author: Agent Mode

## Operational — Version Sync & Release v5.4.0 (Q3 2025)
Priority: High
Dependencies: Lint, Type-Check, Build
- Action: Bump MINOR to 5.4.0 and synchronize documentation (README.md, WARP.md, ROADMAP.md, TASKLIST.md, ARCHITECTURE.md, DESIGN_SYSTEM.md, RELEASE_NOTES.md)
- Action: Validate lint, type-check, and production build before commit
- Action: Commit and push to origin/main
Logged at: 2025-09-27T11:08:32.000Z
Author: Agent Mode

## Operational — Documentation Sync & Governance v5.5.0 (Q3 2025)
Priority: High
Dependencies: Lint, Type-Check, Build
- Action: Mark v5.4.0 release tasks complete in TASKLIST.md and log completion
- Action: Bump MINOR to 5.5.0 and synchronize documentation timestamps
- Action: Commit and push to origin/main after validations
Logged at: 2025-09-27T11:26:38.000Z
Author: Agent Mode

## Milestones

### Milestone: Admin Variables — Org-Prefixed References & Card Layout (Q4 2025)
Priority: High
Dependencies: variablesRegistry, /api/variables-config, Admin styles
- Action: Introduce SEYU-prefixed reference tokens with normalization (TOTAL, VISIT order, FANS suffix, MERCH prefix) — centralized util
- Action: Refactor /admin/variables cards to enforce exact line order and equal heights
- Action: Standardize derived label (All Images → Total Images)
- Acceptance:
  - Cards show lines in the order: Label → [REF] → Details → Visible in Clicker → Editable in Manual → TYPE
  - All cards are the same visual size within the grid
  - Reference tokens match mappings, e.g. [EVENTVALUEPROPOSITIONVISITED] → [SEYUPROPOSITIONVISIT]
Logged at: 2025-09-27T18:31:47.000Z
Author: Agent Mode

### Milestone: Variable Visibility & Editability Flags + Edit Integration (Q4 2025)
Priority: High
Dependencies: Variables registry and EditorDashboard
- Persist per-variable flags (visibleInClicker, editableInManual) and support custom variables
- Admin → Variables: Toggle flags per variable; create custom variables via modal
- Edit page: Respect flags in clicker/manual sections; show Custom Variables; bind to project.stats
- Acceptance:
  - Flags persist across sessions and affect Editor immediately
  - Custom variables appear and persist values in stats
  - No UI drift; buttons/styles follow centralized system

### Milestone: Config Hardening & Inline Style Migration (Q3–Q4 2025)

### Milestone: Search & Paging Unification (Q4 2025)
Priority: High
Dependencies: Hashtags API pagination (v5.0.0)
- Extend server-side search + 20-per-page pagination to:
  - Admin → Hashtags
  - Admin → Categories
  - Admin → Charts
  - Admin → Users
- Evaluate public pages (/hashtag) for similar search UX without admin dependencies
- Acceptance: Consistent HERO search, server search with offset/limit, and Load 20 more on each page; documentation updated
Priority: High
Dependencies: Governance kickoff; sequential steps as listed
- P0: Settings governance and loader hardening
  - 1) Inventory baked settings (CSV under docs/audit)
  - 2) Define config schema and .env.example; document loader
  - 3) Plan Atlas settings collection (non-secrets) + caching; precedence env > DB
  - 4) Implement/extend config loader; replace direct env usages; remove baked defaults; remove hard-coded service base URLs
- P1: Styling migration
  - 5) Phase 1 (shared components) — extract repeated inline styles to CSS Modules with theme tokens
  - 6) Phase 2 (pages) — migrate remaining page-level inline styles
- Governance & Release
  - 7) Align documentation with actual stack (CSS Modules + theme.css)
  - 8) Versioning, build, release, deployment per DoD
  - 9) Guardrail scripts to prevent regressions

Acceptance summary
- Zero baked settings remaining in code grep (outside config and bootstrap)
- InlineStyles reduced to ≤ 5 (excluding computed token-driven cases)
- .env.example present; docs updated with ISO 8601 ms timestamps

Artifacts
- Settings inventory CSV: docs/audit/settings-inventory.csv (generated 2025-09-23T12:32:28.000Z)

### Milestone: Admin UI Consistency (Q3)
Priority: High
Dependencies: None
- Standardize Admin HERO across all admin pages (single source, consistent background/width)
- Introduce and adopt design-managed `.content-surface` with `--content-bg` for main content areas
- Widen narrow pages to match admin main content width
- Documentation sync, versioning, and clean commit to main

### Milestone: CSV and Visualization Parity Polish (Q3)
Priority: High
Dependencies: Completed v3.0.0 parity, v3.1.0 hide no-data
- Admin Grid Settings UI (High)
  - Build UI under /admin/visualization to edit desktop/tablet/mobile units via /api/grid-settings
  - Dependency: grid-settings API (done)
- Derived Metrics in CSV (Medium)
  - Include computed totals (e.g., totalImages, totalFans) as additional rows
  - Optional: toggle for including derived metrics
- Chart Label Customization (Medium)
  - Allow renaming chart titles/subtitles per block for public display
  - Dependency: block editing model

### Milestone: Data Quality and UX (Q3)
Priority: Medium
Dependencies: None
- Empty-Block UX (Medium)
  - If a block hides all charts due to no data, provide an optional friendly message toggle (admin-configurable)
- Performance pass for stats pages (Medium)
  - Audit inline CSS generation and ensure minimal reflows
- Export options (Low)
  - Download chart data as CSV (per chart) in addition to PNG

### Milestone: Admin Productivity (Q4)
Priority: Medium
Dependencies: None
- Bulk chart assignment tools (Medium)
  - Multi-select charts and assign to blocks quickly
- Reorder blocks with drag-and-drop (Medium)
  - Improve ordering UX
- Audit and simplify unused admin features (Low)
  - Remove stale preview-only code paths

## Version 2.2.0 - Hashtag Categories System
*Target Release: 2025-01-28*

### Overview
Implementation of hashtag categories system to organize project hashtags into custom groups (e.g., city, vetting, success, year) with category-specific styling and enhanced user interface.

### Key Features

#### 🏷️ Hashtag Categories Management
- **Admin Hashtag Manager Page**: New dedicated page at `/admin/hashtags` (moved from embedded toggle in AdminDashboard)
- **Category CRUD Operations**: Create, edit, delete, and reorder custom categories
- **Category-Specific Colors**: Each category has its own color that overrides individual hashtag colors
- **Shared Hashtag Pool**: All categories use the same global hashtag list for consistency

#### 📝 Enhanced Project Interface
- **Default Hashtag Section**: Preserve existing "Add hashtags to categorize this project..." input
- **Dynamic Category Sections**: Each custom category displays as "CategoryName [existing tags] [+ add input]"
- **Category Color Application**: Hashtags display in their category's color when assigned to a category
- **Responsive Design**: Mobile-friendly category management interface

#### 👀 View More Functionality
- **Aggregated Statistics**: Limit initial display to top 10 hashtags, expandable with "View More" button
- **Project Management Table**: Add pagination/lazy loading for large project lists
- **Smooth Animations**: Expand/collapse animations for better user experience

#### 💾 Data Architecture
- **New Collection**: `hashtag_categories` with name, color, order, timestamps
- **Extended Projects**: Add `categorizedHashtags` field while maintaining backward compatibility
- **Migration Support**: Seamless transition for existing projects without data loss

### Implementation Phases

#### Phase 1: Foundation (Week 1)
- [x] Version increment to 2.2.0
- [x] Database schema design
- [ ] API endpoints for category management
- [ ] Basic admin page structure

#### Phase 2: Core Features (Week 2)
- [ ] Category CRUD interface
- [ ] Project form enhancements
- [ ] Hashtag display component updates
- [ ] Color inheritance system

#### Phase 3: Enhancement & Polish (Week 3)
- [ ] View More functionality
- [ ] Mobile responsiveness
- [ ] Data migration scripts
- [ ] Backward compatibility testing

#### Phase 4: Testing & Deployment (Week 4)
- [ ] Comprehensive testing across all features
- [ ] Performance optimization
- [ ] Documentation updates
- [ ] Production deployment

### Dependencies
- MongoDB Atlas for data storage
- Next.js App Router for page structure
- Existing hashtag system and API architecture
- Admin authentication system

### Success Metrics
- ✅ All existing hashtag functionality preserved
- ✅ Category creation and management working smoothly
- ✅ Color inheritance system functioning correctly
- ✅ Mobile-responsive category interface
- ✅ Zero data loss during migration
- ✅ Performance impact < 100ms for category operations

### Future Considerations
- Category-based hashtag statistics
- Category export/import functionality
- Advanced category filtering and search
- Category-based project templates

---

## Version 2.3.0 - Shareables Component Library
*Target Release: 2025-02-15*

### Overview
Launch of MessMass Shareables - a comprehensive library of reusable UI components and authentication systems extracted from the main application. Components will be available as live demos with source code viewing, copy-paste snippets, and downloadable packages.

### Key Features

#### 🔐 Authentication Components Library
- **Password-Based Login System**: Complete authentication flow with secure session management
- **Glass Card Login Form**: Beautiful glassmorphism-styled login interface
- **Session Management Utils**: Token-based authentication with secure cookies
- **Auth Context Provider**: React context for application-wide authentication state
- **TypeScript Definitions**: Full type safety with exported interfaces

#### 📚 Component Documentation System
- **Live Interactive Demos**: Real-time component testing with mock data
- **Syntax-Highlighted Code Viewer**: Browse source code with proper syntax highlighting
- **One-Click Copy Functionality**: Copy code snippets directly to clipboard
- **Dependency Management**: Automatic listing of required packages and versions
- **Setup Instructions**: Step-by-step implementation guides

#### 🎨 Design System Components
- **Glass Card System**: Reusable glassmorphism components
- **Form System**: Input fields, labels, validation states
- **Button Variants**: Primary, secondary, success, danger, info buttons
- **Typography Components**: Titles, subtitles, section headers
- **Loading States**: Spinners, animations, skeleton screens

#### 🌐 Public Component Library
- **Searchable Component Gallery**: Filter and discover components by category
- **Component Categories**: Authentication, Forms, UI, Charts, Layout
- **Export Functionality**: Download component packages as ZIP files
- **Version Compatibility**: Next.js and React version compatibility matrix
- **Usage Analytics**: Track most popular components

### Implementation Phases

#### Phase 1: Foundation & Authentication (Week 1)
- [x] Version increment to 2.3.0
- [ ] Directory structure setup for shareables
- [ ] Authentication component extraction and refactoring
- [ ] Basic component documentation system

#### Phase 2: Documentation & Demos (Week 2)
- [ ] Live demo system implementation
- [ ] Code viewer with syntax highlighting
- [ ] Copy functionality and clipboard integration
- [ ] Authentication showcase page development

#### Phase 3: Component Library Expansion (Week 3)
- [ ] Extract additional UI components (forms, buttons, cards)
- [ ] Build component metadata and registry system
- [ ] Implement search and filtering functionality
- [ ] Create shareables landing page

#### Phase 4: Export & Polish (Week 4)
- [ ] ZIP export functionality for component packages
- [ ] Responsive design and mobile optimization
- [ ] Performance optimization for large component library
- [ ] Production deployment and testing

### Technical Architecture

#### Directory Structure
```
app/
├── shareables/
│   ├── page.tsx                 # Component library homepage
│   ├── auth/
│   │   └── page.tsx            # Authentication showcase
│   └── [component]/
│       └── page.tsx            # Dynamic component pages
lib/
├── shareables/
│   ├── auth/                   # Authentication components
│   ├── components/             # Documentation components
│   ├── ui/                     # Extracted UI components
│   └── metadata.ts             # Component registry
public/
└── shareables/
    ├── code-snippets/          # Downloadable code files
    └── assets/                 # Component screenshots
```

#### Dependencies
- Next.js 15+ App Router for public pages
- React 18+ for component development
- TypeScript for type safety
- Prism.js for syntax highlighting
- JSZip for package exports

### Success Metrics
- ✅ Authentication component fully extracted and functional
- ✅ Live demo system working across all components
- ✅ Code copying functionality tested across browsers
- ✅ Mobile-responsive component library interface
- ✅ ZIP export generating complete, runnable packages
- ✅ Public deployment at messmass.doneisbetter.com/shareables

### Educational Impact
- **Developer Resources**: Provide real-world, production-tested components
- **Learning Platform**: Show best practices for Next.js authentication
- **Open Source Contribution**: Give back to the developer community
- **Brand Building**: Establish MessMass as a source of quality UI components
