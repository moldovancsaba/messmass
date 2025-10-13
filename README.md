# MessMass

A real-time collaborative event statistics dashboard with an admin panel, unified hashtag system, and modern TailAdmin V2 design system.

- Version: v5.53.0
- Last Updated: 2025-10-13T11:23:00.000Z
- Website: https://messmass.doneisbetter.com
- Status: TailAdmin V2 flat design complete - zero gradients, 100% design token compliance

Quickstart

- Development
  - npm install
  - npm run dev (Next.js on :3000)
  - cd server && npm start (WebSocket server on :7654)
- Production
  - npm run build
  - npm run style:check (verify design system compliance)
  - Deploy Next.js app to Vercel; deploy WebSocket server separately

Docs

- ARCHITECTURE.md — System overview, components, and styling architecture
- DESIGN_SYSTEM.md — Design tokens, utilities, patterns (consolidated authority)
- CARD_SYSTEM.md — ColoredCard component reference
- ADMIN_LAYOUT_SYSTEM.md — Admin navigation and responsive layout
- ADMIN_VARIABLES_SYSTEM.md — Variables and metrics management
- ROADMAP.md — Forward-looking milestones
- TASKLIST.md — Active and upcoming tasks (with owners and dates)
- RELEASE_NOTES.md — Versioned log of changes
- LEARNINGS.md — Practical insights and resolved issues
- WARP.md — Rules and protocols for development in this repo
- AUTHENTICATION_AND_ACCESS.md — Admin sessions, page passwords, and zero-trust page access

Examples
- /examples/password-gate-demo — Demo for PasswordGate (generate password and unlock a gated section)

Public Docs
- Authentication & Zero-Trust Guide (GitHub): https://github.com/moldovancsaba/messmass/blob/main/AUTHENTICATION_AND_ACCESS.md

Key Features

- Modern TailAdmin V2 flat design with responsive sidebar navigation
- Professional Chart.js charts with PNG export and PDF generation
- Google Fonts integration with admin-selectable typography (Inter, Roboto, Poppins)
- Unified hashtag system with category-aware input and display
- Real-time WebSocket updates and comprehensive admin dashboard
- Complete design token system with CSS variables (`--mm-*` prefixed)

Utility Classes (Quick Reference)

The design system provides 30+ utility classes for consistent styling:

**Layout & Containers**
- `.page-bg-gray` / `.page-bg-white` - Page backgrounds
- `.loading-container` + `.loading-card` - Loading states
- `.error-container` + `.error-card` - Error states
- `.centered-flex` - Centered flexbox layout

**Cards & Panels**
- `.card` / `.card-md` / `.card-lg` - Card variants
- `.card-header` / `.card-body` / `.card-footer` - Card sections

**Spacing**
- `.p-sm` / `.p-md` / `.p-lg` / `.p-xl` - Padding utilities
- `.gap-sm` / `.gap-md` / `.gap-lg` - Gap utilities
- `.mt-*` / `.mb-*` - Margin utilities

**Flexbox**
- `.flex` / `.flex-col` - Flex containers
- `.items-center` / `.justify-center` / `.justify-between` - Alignment

**Width & Text**
- `.w-full` / `.max-w-*` - Width utilities
- `.text-center` / `.text-left` / `.text-right` - Text alignment

All utilities use design tokens from `theme.css` (--mm-* variables).
See `app/globals.css` for complete utility definitions.

**Design System Validation**
- Run `npm run style:check` to detect gradients and glass-morphism violations
- Automated checker enforces flat design compliance
- Zero violations required before commits

Timestamps

- All timestamps use ISO 8601 with milliseconds (UTC): YYYY-MM-DDTHH:MM:SS.sssZ
