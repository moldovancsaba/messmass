# MEMORY.md — Long-term context (MessMass)

**Project:** MessMass — enterprise event analytics platform (real-time stats, partners, Bitly, theming, Sports Match Builder).  
**Live:** https://messmass.doneisbetter.com  
**Stack:** Next.js, MongoDB, WebSocket server (port 7654), Vercel + Railway/Heroku.

**Recent focus (as of 2025-02-21):**
- OPS-SEC: user password migration tooling, sanitize hardening, production flags, passwordHash checks.
- Google Sheets Phase 2.5: auto-provision, docs.
- Docs refactor and operational hardening (OPS-SEC-03).

**Branches:** `preview` is the active branch; `main`, phase5/phase6 recovery and migration branches exist.

**Dev:** `npm run dev` (Next on 3001), WebSocket in `server/` on 7654. Env: `.env.local` (MongoDB, WS URL, ADMIN_PASSWORD, Bitly, etc.).

**Product SSOT:** Version = `package.json`; doc entry = README + `docs/index.md`; execution state = `docs/operations/operations-action-plan.md`; canonical map = `docs/_meta/meta-canonical-map.md`. Governance: `docs/documentation-governance.md` (Product SSOT section added 2026-02-21).

**Delivery focus:** Top 5 board issues: #44, #57, #58, #59, #46. #71 Done, #38 Done, #46 Done (SSO DoneIsBetter, 2026-02-21). See `docs/operations/operations-delivery-focus.md`. Board = source of truth.

**Agent habit:** After completing code changes that are ready to test, always commit and push to the preview/feature branch (e.g. landing-kpi-emdash) without being asked. Do not wait for the user to say "commit and push."
