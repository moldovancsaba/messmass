# MessMass

A real-time collaborative event statistics dashboard with an admin panel, unified hashtag system, and modern TailAdmin V2 design system.

- Version: v5.21.2
- Last Updated: 2025-10-06T19:57:45.000Z
- Website: https://messmass.doneisbetter.com
- Deployment: Production deployment triggered to restore working authentication (commit 055c357)

Quickstart

- Development
  - npm install
  - npm run dev (Next.js on :3000)
  - cd server && npm start (WebSocket server on :7654)
- Production
  - npm run build
  - Deploy Next.js app to Vercel; deploy WebSocket server separately

Docs

### User Guides
- END_USER_GUIDE.md — For event organizers using MessMass
- ADMIN_GUIDE.md — For system administrators and power users
- DEVELOPER_ONBOARDING.md — For new developers joining the project

### Technical Documentation
- ARCHITECTURE.md — System overview, components, and styling architecture
- DESIGN_SYSTEM.md — Complete TailAdmin V2 token reference and usage guide
- AUTHENTICATION_AND_ACCESS.md — Admin sessions, page passwords, and zero-trust page access
- LEARNINGS.md — Practical insights and resolved issues
- WARP.md — Rules and protocols for development in this repo

### Project Management
- ROADMAP.md — Forward-looking milestones
- TASKLIST.md — Active and upcoming tasks (with owners and dates)
- RELEASE_NOTES.md — Versioned log of changes

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

Timestamps

- All timestamps use ISO 8601 with milliseconds (UTC): YYYY-MM-DDTHH:MM:SS.sssZ
