# messmass in the SEYU fleet

messmass is the master of partner/event/organization data and the event-report
+ AI-analytics surface. It runs on Vercel.

- **messmass ↔ camera** (bidirectional): messmass provisions orgs/partners/events
  INTO camera (`lib/cameraProvision.ts` → camera `/api/internal/messmass/*`).
  camera calls BACK to mint sessions (`/api/integrations/camera/sso-session`) and
  push native partners (`/api/integrations/camera/partners`). camera also reads
  the resolved theme of an event (`/api/integrations/camera/events/[id]/frame-context`:
  partner and team logos, effective report template and style, font) to build the
  event's default frame, and posts the scans it counts on an event's tracked links
  (`/api/integrations/camera/events/[id]/link-stats`), and, once the owner switches it on,
  the photo, people and journey counters of an event as `camera_`-prefixed stats
  (`/api/integrations/camera/events/[id]/photo-stats`), and reads a partner's current
  style for its partner workspace (`/api/integrations/camera/partners/[id]/style-context`).
  Those six inbound routes take the shared camera secret (`assertCameraSecret`); four
  operator routes under the same path (`link-partners`, `provision-missing`,
  `link-existing`, `sync-linked`) drive the outbound provisioning and take the fanmass
  integration token. messmass tells camera when a
  report style or a partner's look changed (`lib/cameraThemeNotify.ts` → camera
  `/api/internal/messmass/theme-updated`). The link from an event to camera's
  `/admin/vetting?eventId=…` is the "Open in Camera" action of each row in the events
  list (`lib/adapters/projectsAdapter.tsx`, disabled for an event Camera does not know;
  drift register entry 81, fixed 2026-11-15). camera is also messmass's email transport. The try-on integration of camera is gone (camera issue 557); it was
  never a messmass edge.
- **messmass ← fanmass**: fanmass is the caller on every channel. messmass
  exposes 31 `/api/integrations/fanmass/*` route files guarded by
  `FANMASS_INTEGRATION_TOKEN`: the per-photo analysis contract, drive photos,
  evidence, match events, commands, variables and the SZRT routes. The old
  event-level channels (summaries, dashboard snapshots, rescan queue, the
  `/sync` + `/callbacks` pull from `FANMASS_BASE_URL`) answer 410 Gone since
  af08b361 (2026-10-20), so no request waits on fanmass being reachable.
- **messmass → SSO**: confidential OAuth client (secret, no PKCE). Local password
  login is retired (410 Gone). The same client also serves the stakeholder
  login (#231), gated by local `stakeholder_grants`.
- Four auth layers: admin session, page passwords, machine tokens
  (integration tokens, plus hashed public API keys for `/api/public/*`), and
  stakeholder sessions (#231).

Canonical cross-app map: `docs/_audit/fleet-architecture.md`.
API surface: `docs/_audit/api-reference.md` (248 route files under `app/api`,
measured against `endpoints.json`; its header carries the verification stamp).
