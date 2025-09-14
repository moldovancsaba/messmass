# MessMass Release Notes

## [v3.17.0] — 2025-09-14T07:24:39.000Z

### Share Popup Refresh Fix (Project Management)
- Switching between “Share Edit Page” and “Share Statistics Page” now refreshes the popup with the correct URL and password.
- Implementation: force remount via key, reset local state on open/target change, and disable cache for the link fetch.

---

## [v3.16.0] — 2025-09-13T10:50:00.000Z

### Variables Page Improvements
- Updated derived variable descriptions to reflect current logic (e.g., Total Fans = Remote + Stadium; no references to Indoor/Outdoor).
- Correctly display text variables (e.g., General Hashtags) as text, not numeric.
- Variable cards now show bracketed format for numeric variables as used in /admin/charts (e.g., [JERSEY]).
- Edit button opens a read-only details modal for clarity.

---

## [v3.15.0] — 2025-09-13T10:30:00.000Z

### Variables Registry + Admin Variables
- Added centralized variables registry and /api/variables to power Admin → Variables.
- Covers base stats, derived totals (All Images, Total Fans, Total Under/Over 40, Total Visit), and dynamic text variables for each hashtag category.
- Admin Variables UI now fetches from API and shows derived formulas.

### Design Manager Enforcement
- All public pages (stats, filter, hashtag, edit) and password overlay now fetch page style config with cache: 'no-store' to always reflect the latest Admin → Design selection.
- Admin layout already applies admin style; this aligns public pages reliably.

---

## [v3.14.0] — 2025-09-12T14:35:00.000Z

### 🖱️ Editor Clicker — Remote Fans fixed
- Remote in 👥 Fans is now clickable in Clicker mode.
- Behavior: increments/decrements persist to stats.remoteFans.
- If stats.remoteFans is undefined, the base value derives from (indoor + outdoor) so the first click initializes the stored field correctly.

### 🧮 Variables — Add TOTAL_FANS and remove deprecated
- New variable: [TOTAL_FANS] = [REMOTE_FANS] + [STADIUM]
- Mapped in formula engine with safe fallback for [REMOTE_FANS] when unset
- Removed deprecated: [EVENT_TICKET_PURCHASES]
- Updated internal scripts and defaults to reference [TOTAL_FANS] where appropriate

---

## [v3.13.0] — 2025-09-12T14:22:31.000Z

### 🎨 Page Style System — Unified via CSS Variables
- Introduced CSS custom properties for page and header backgrounds:
  - --page-bg (fallback: var(--gradient-primary))
  - --header-bg (fallback: rgba(255, 255, 255, 0.95))
- Replaced direct background overrides with variable injection on pages:
  - /stats/[slug], /filter/[slug], /hashtag/[hashtag] now set --page-bg/--header-bg based on Design Manager pageStyle
- Applied style variables to the Edit page (/edit/[slug]) by fetching /api/page-config?projectId=...
- Refactored password overlay to respect page styles:
  - PagePasswordLogin uses .login-container (which consumes --page-bg) and resolves pageStyle (projectId or filter slug) to set variables on :root

### 🛠 Technical
- globals.css: body, .admin-container, .admin-dashboard, .login-container now use var(--page-bg, var(--gradient-primary)); .admin-header uses var(--header-bg, rgba(255,255,255,0.95))
- app/styles/layout.css: .app-container and .admin-container backgrounds switched to var(--page-bg, var(--gradient-primary))
- Added page-style variable injection blocks in stats/filter/hashtag/edit pages
- Removed hard-coded gradient from PagePasswordLogin background; overlay inherits variables

Outcome: Design Manager styles now apply consistently and reliably across all public pages and the password prompt.

---

## [v3.12.0] — 2025-09-11T13:39:27.000Z

### 🔐 Admin Password Generation Reliability
- Forced Node.js runtime for routes that generate/regenerate passwords to ensure Node crypto is available:
  - app/api/page-passwords/route.ts
  - app/api/admin/local-users/route.ts
  - app/api/admin/local-users/[id]/route.ts
- Outcome: Admin user creation/regeneration and page password generation now work reliably in all environments.

### 🎨 Page Style Application on Public Pages
- Stats (/stats/[slug]) and Filter (/filter/[slug]) pages now inject pageStyle gradients into `.admin-container` and `.admin-header`, matching the hashtag page behavior.
- Outcome: Consistent design system styling across public pages when a style is configured in Design Manager.

### 🔗 Share Popup UX
- Added a "Visit" button alongside "Copy" to open the shared page in a new tab directly.
- Outcome: Faster sharing workflow; users can verify links immediately.

### 🛠 Technical
- Type-check and production build validated.

---

## [v3.11.0] — 2025-09-11T13:14:27.000Z

### 🎨 UI Design System Refinements
- Buttons: standardized min-height (40px), consistent edge spacing via small default margins, unified focus and disabled states across variants.
- Inputs & Dropdowns: added unified .form-select and generic select styling to align with .form-input; enforced min-height 40px; consistent padding, radius, and focus rings.
- Spacing: ensured buttons and form controls don’t stick to container edges in dense layouts by adding small default margins.

### 📚 Documentation
- Added DESIGN_SYSTEM.md describing tokens, components, usage rules, recent refinements, and migration guidelines.

---

## [v3.10.0] — 2025-09-11T12:25:16.000Z

### 📊 Five New Bar Charts (5 elements each)
All inserted into chartConfigurations and editable in Admin → Charts:
- merch-items-mix — Merch Items Mix (Counts): JERSEY, SCARF, FLAGS, BASEBALL_CAP, OTHER
- social-platform-visits — Social Platform Visits: FACEBOOK, INSTAGRAM, YOUTUBE, TIKTOK, X
- fan-distribution-extended — INDOOR, OUTDOOR, STADIUM, MERCHED, NON‑MERCHED
- content-pipeline — REMOTE_IMAGES, HOSTESS_IMAGES, SELFIES, APPROVED_IMAGES, REJECTED_IMAGES
- activation-funnel — Total Images, Social Interactions, Direct/QR/Web, VP Visits, Purchases

Each chart strictly follows validation (bar = 5 elements). Formulas use AVAILABLE_VARIABLES or derived expressions allowed by the system.

### 🛠 Technical
- Added scripts/add-bar-charts.js to insert bars safely with ordering and ISO timestamps.

---

## [v3.9.0] — 2025-09-11T08:33:40.000Z

### 🥧 Ten New Pie Charts (two-segment A/B insights)
All inserted to chartConfigurations and immediately editable in Admin → Charts. Each pie uses exactly two elements per validation rules:
- merch-vs-nonmerch — Merch vs Non‑Merch Fans
- hostess-vs-fan-images — Hostess vs Fan Images
- approval-split — Approved vs Rejected Images
- indoor-vs-outdoor — Indoor vs Outdoor Fans
- apparel-vs-accessories — Apparel vs Accessories
- social-vs-direct — Social vs Direct Traffic
- vp-funnel — Value Prop: Buyers vs Browsers
- match-result-share — Match Result Share
- engaged-share — Engaged vs Not Engaged
- qr-vs-short — QR vs Short URL

All formulas rely on AVAILABLE_VARIABLES in lib/chartConfigTypes.ts. Ordering appended after existing charts; timestamps stored in ISO with milliseconds.

### 🛠 Technical
- Added scripts/add-pie-charts.js for safe, idempotent insertion.

---

## [v3.8.0] — 2025-09-11T08:21:15.000Z

### 📈 New KPI Chart Configurations (DB-inserted, editable in Admin → Charts)
Inserted 8 new KPI charts into chartConfigurations (no duplicates; ordered after existing charts):
- remote-fan-share — Remote Fan Share (%)
- merch-adoption-rate — Merch Adoption Rate (%)
- image-approval-rate — Image Approval Rate (%)
- content-capture-rate — Content Capture Rate (images per 100 attendees)
- youth-audience-share — Youth Audience Share (%)
- value-prop-conversion-rate — Value Prop Conversion Rate (%)
- social-per-image — Social Interactions per Image
- items-per-merched-fan — Items per Merched Fan

All formulas use existing variables (see lib/chartConfigTypes.ts AVAILABLE_VARIABLES). Charts appear in Admin → Charts and can be updated, reordered, edited, or deleted. Timestamps stored in ISO 8601 with milliseconds.

### 🛠 Technical
- Added script scripts/add-kpi-charts.js (uses scripts/config.js) to insert KPIs safely with proper ordering and timestamps.
- No schema changes; reuses chartConfigurations collection.

---

## [v3.7.0] — 2025-09-10T13:24:05.000Z

### 🔐 Admin Authentication — DB-only + Regenerable Passwords
- Removed legacy env-based admin password fallback; authentication now validates only against the Users collection.
- "admin" email alias supported: login attempts with "admin" resolve to the canonical "admin@messmass.com" user.
- Fixed server-side password generator to use Node.js crypto (32-char MD5-style random hex) for both admin and page passwords.
- Admin session continues to bypass page-specific password prompts; static admin password checks were removed from page password validation.

### 🛠 Technical
- app/api/admin/login/route.ts: removed env fallback, added alias, DB-only check, comments.
- lib/pagePassword.ts: server-safe generator via crypto.randomBytes(16).toString('hex'); removed static admin password validation; clarified comments.
- Version bump and doc synchronization per protocol; timestamps in ISO 8601 with milliseconds.

---

## [v3.6.0] — 2025-09-10T09:30:45.000Z

### 🔐 Multi-User Admin Authentication + Admin Bypass for Page Passwords
- Introduced email + password login at /admin/login (replaces password-only flow).
- Added MongoDB-backed Users collection with admin UI at /admin/users to create, regenerate, and delete users.
- Password generation uses the same MD5-style generator as page-specific passwords (one-time reveal on creation/regeneration).
- Admin session now bypasses page-specific passwords on /stats/[slug], /edit/[slug], and /filter/[slug].
- Legacy admin master password preserved for bootstrapping; first successful login seeds a super-admin if missing.
- Centralized admin password source via lib/config to avoid drift.

### 🛠 Technical
- lib/auth.ts refactored to DB-backed session validation (cookie: admin-session).
- /api/admin/login accepts { email, password } and returns a 7-day session cookie.
- /api/admin/local-users (GET, POST), /api/admin/local-users/[id] (PUT regenerate, DELETE) implemented.
- components/PagePasswordLogin auto-bypasses if an admin session exists.
- /api/page-passwords PUT short-circuits when admin session is present.
- Version bump and documentation sync per protocol.

---

## [v3.5.0] — 2025-09-08T14:12:11.000Z

### 🧭 Stats Page Searching State
- When opening a stats page, a searching state is shown while the system resolves the slug:
  - Title: "📊 Searching the Project page"
  - Message: "We are preparing the statistics page you're looking for."
- Prevents the premature "Project Not Found" message before data resolves.

---

## [v3.4.0] — 2025-09-08T10:19:38.000Z

### 📦 Admin & UX Enhancements
- Admin Projects: Added per-row CSV export button before event name, so admins can download directly.
- Admin Visualization: Drag-and-drop reordering for data blocks with immediate persistence.
- Standardized loading/empty/error UX: Introduced StandardState component and applied to admin projects loading state (initial pass).

---

## [v3.3.0] — 2025-09-08T09:42:22.000Z

### ⚙️ Admin Grid Settings UI + CSV Derived Metrics Toggle
- Added Grid Settings editor in /admin/visualization to update desktop/tablet/mobile units via /api/grid-settings.
- CSV exports on stats/filter/hashtag pages now support an “Include derived metrics” toggle in the header.

---

## [v3.2.0] — 2025-09-08T09:33:04.000Z

### 🧼 Admin Cleanup
- Removed Global Stats Preview from /admin/visualization — no longer needed after parity was achieved.
- Admin page still supports per-block previews for editing blocks.

---

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
