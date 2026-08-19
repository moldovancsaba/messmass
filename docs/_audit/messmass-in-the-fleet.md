# messmass in the SEYU fleet

messmass is the master of partner/event/organization data and the event-report
+ AI-analytics surface. It runs on Vercel.

- **messmass ↔ camera** (bidirectional): messmass provisions orgs/partners/events
  INTO camera (`lib/cameraProvision.ts` → camera `/api/internal/messmass/*`).
  camera calls BACK to mint sessions (`/api/integrations/camera/sso-session`) and
  push native partners (`/api/integrations/camera/partners`). camera is also
  messmass's email transport.
- **messmass ← fanmass**: fanmass is always the outbound caller. messmass exposes
  18 `/api/integrations/fanmass/*` routes (dashboard snapshots, command queue,
  rescan queue, summaries, drive-folder status) guarded by
  `FANMASS_INTEGRATION_TOKEN`. messmass also PULLS analytics-summary from
  `FANMASS_BASE_URL` in the `/sync` + `/callbacks` routes (its one runtime
  dependency on fanmass reachability).
- **messmass → SSO**: confidential OAuth client (secret, no PKCE). Local password
  login is retired (410 Gone).
- Three auth layers: admin session, page passwords, machine/integration tokens.

Canonical cross-app map: `docs/_audit/fleet-architecture.md`.
API surface: `docs/_audit/api-reference.md` (194 routes).
