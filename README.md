# MessMass

A real-time collaborative event statistics dashboard with an admin panel, unified hashtag system, and configurable design system.

- Version: v5.7.0
- Last Updated: 2025-09-27T12:32:04.000Z
- Website: https://messmass.doneisbetter.com

Quickstart

- Development
  - npm install
  - npm run dev (Next.js on :3000)
  - cd server && npm start (WebSocket server on :7654)
- Production
  - npm run build
  - Deploy Next.js app to Vercel; deploy WebSocket server separately

Docs

- ARCHITECTURE.md — System overview, components, and styling architecture (includes content-surface and CSS variables)
- ROADMAP.md — Forward-looking milestones
- TASKLIST.md — Active and upcoming tasks (with owners and dates)
- RELEASE_NOTES.md — Versioned log of changes
- LEARNINGS.md — Practical insights and resolved issues
- WARP.md — Rules and protocols for development in this repo

Key Features

- Admin HERO standardization across all admin pages (single source)
- Design-managed content surface via `--content-bg` and `.content-surface`
- Unified hashtag system with category-aware input and display
- Real-time WebSocket updates and CSV exports

Timestamps

- All timestamps use ISO 8601 with milliseconds (UTC): YYYY-MM-DDTHH:MM:SS.sssZ
