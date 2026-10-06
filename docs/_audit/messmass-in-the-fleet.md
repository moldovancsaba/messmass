# messmass in the SEYU fleet

messmass is the master of partner/event/organization data and the event-report
+ AI-analytics surface. It runs on Vercel.

- **messmass ↔ camera** (bidirectional): messmass provisions orgs/partners/events
  INTO camera (`lib/cameraProvision.ts` → camera `/api/internal/messmass/*`).
  camera calls BACK to mint sessions (`/api/integrations/camera/sso-session`) and
  push native partners (`/api/integrations/camera/partners`). camera also reads
  the resolved theme of an event (`/api/integrations/camera/events/[id]/frame-context`:
  partner and team logos, effective report template and style, font) to build the
  event's default frame. camera is also messmass's email transport.
- **messmass ← fanmass**: fanmass is the caller on every channel except the
  analytics-summary pull (below). messmass exposes
  18 `/api/integrations/fanmass/*` routes (dashboard snapshots, command queue,
  rescan queue, summaries, drive-folder status) guarded by
  `FANMASS_INTEGRATION_TOKEN`. messmass also PULLS analytics-summary from
  `FANMASS_BASE_URL` in the `/sync` + `/callbacks` routes (its one runtime
  dependency on fanmass reachability).
- **messmass → SSO**: confidential OAuth client (secret, no PKCE). Local password
  login is retired (410 Gone). The same client also serves the stakeholder
  login (#231), gated by local `stakeholder_grants`.
- Four auth layers: admin session, page passwords, machine tokens
  (integration tokens, plus hashed public API keys for `/api/public/*`), and
  stakeholder sessions (#231).

Canonical cross-app map: `docs/_audit/fleet-architecture.md`.
API surface: `docs/_audit/api-reference.md` (221 route files under `app/api`,
verified @ dd34e229, 2026-09-28).
