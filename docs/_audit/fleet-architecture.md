# SEYU Fleet Architecture — canonical map

Fleet audit P1. Written 2026-08-19 from code read on BOTH sides of every edge;
each edge is stamped with the SHAs it was verified against. This is the doc a
new developer reads first. Canonical copy lives here in messmass;
camera/fanmass/try-on carry pointers to it. Header-less by design (docs:audit
version gate).

Verified against: messmass `6d28c7f3` · camera `97c1f67` · fanmass `1d173e9` ·
try-on `e2c92c6`.

## The five systems

| System | Repo | Runs on | Role |
|---|---|---|---|
| **messmass** | moldovancsaba/messmass | Vercel | Master of partners/events/organizations; event reports; AI-analytics UI over fanmass |
| **camera** | moldovancsaba/camera | Vercel | Fan photo capture; try-on job producer + moderation; the fleet's only email sender |
| **fanmass** | moldovancsaba/fanmass | local Mac (launchd supervisor) | AI image analysis; always the outbound caller (no public inbound address) |
| **try-on** | moldovancsaba/try-on | local Mac (launchd: app-server + worker) | Virtual try-on renders; Atlas queue worker + local render server |
| **SSO** | moldovancsaba/sso | sso.doneisbetter.com | Shared OAuth2/OIDC identity + per-app permission store (audited consumer-side only) |

Two Mongo worlds: messmass and fanmass each own a database; **camera and
try-on share one Atlas database** (the try-on job queue). fanmass reaches
messmass and camera only over HTTP.

## Edge contracts

### E1 · camera ↔ try-on (shared Atlas + completion webhook)
Verified messmass n/a · camera `97c1f67` · try-on `e2c92c6`.
- **Transport**: shared Atlas DB. Collections and camera-side owner:
  `tryon_jobs` (queue), `leather_suits` (garment catalog),
  `tryon_setups` (pipeline presets), `camera_setup_preferences`,
  `tryon_worker_heartbeats`, `tryon_moderation_events`
  (camera lib/db/schemas.ts:33-54; try-on binds them at
  scripts/tryon_queue_worker.py:627-631).
- **Claiming**: try-on worker does an atomic find_one_and_update, FIFO by
  createdAt, lease = TRYON_LEASE_DURATION_SECONDS (600s default), heartbeat at
  40% of lease extends the lease (tryon_queue_worker.py:1243-1308). Five
  recovery sweeps reclaim stale/aborted jobs before each claim (:2896-2900).
- **Completion (try-on → camera)**: POST `CAMERA_TRYON_COMPLETE_URL` (try-on
  env) → camera `POST /api/internal/tryon/complete`
  (camera app/api/internal/tryon/complete/route.ts:34-71). Auth: shared secret
  `CAMERA_TRYON_INTERNAL_SECRET`, header `x-camera-tryon-secret` or Bearer
  (camera lib/tryon/completion.ts:72-85; try-on sends x-camera-tryon-secret at
  :2508). Both sides fail-closed when the secret is unset.
- **Reconciliation cron (camera)**: vercel.json every 5 min hits
  `GET /api/internal/tryon/sync?status=done` to materialize any results the
  webhook missed — because camera ALSO ships an in-repo worker
  (the camera-side `tryon:worker` script, lib/tryon/worker.ts) that writes
  Mongo directly and skips the webhook. **Both sides verified; two divergences flagged**: (a) the
  sync route accepts a spoofable `x-vercel-cron:1` header when the secret is
  absent (camera#119); (b) try-on probes up to 16 completion POSTs per job over
  id candidates `source.eventMongoId`/`eventId` that are NOT in the contract's
  tryon_jobs schema (try-on#40 §4 — confirm which shape camera accepts).
- **Provider routing (try-on)**: garment-typed jersey/top/bottom jobs on a
  `segmind_idm_vton` setup reroute to FASHN v1.6/fal
  (tryon_queue_worker.py:448-465); motorsport suits and local/google setups do
  not. Provider inputs are base64 (fal data-URI, Segmind raw); ImgBB is used
  only to publish results. Documented in docs/TRYON_ATLAS_CONTRACT.md (the most
  accurate doc in the fleet) — with two known omissions (Segmind base64, white
  compositing).

### E2 · fanmass → messmass (six push channels + two poll/ack channels)
Verified messmass `6d28c7f3` · fanmass `1d173e9`. fanmass is always the caller.
- **Auth**: fanmass sends Bearer + `x-api-key` = FANMASS_INTEGRATION_TOKEN;
  messmass verifies via requireFanmassIntegrationAuth
  (messmass lib/fanmassIntegration.ts:76-90 — 503 if unset, 401 on mismatch,
  plain string compare). All /api/integrations/* is CSRF-exempt (lib/csrf.ts:174-181).
- **Push (fanmass → messmass)**, all POST, messmass route ← fanmass caller:
  1. event-context pull GET `.../events/{id}/context` (fanmass on-demand)
  2. legacy analytics callback POST `messmass_callback_url` (HMAC-signed when a
     secret is set; dark on the live box — callback URL unset)
  3. mapped scalar stats POST `.../events/{id}/stats`
  4. analysis-summary POST `.../events/{id}/analysis-summary`
     (contract `fanmass.messmass.analytics-summary.v1`)
  5. dashboard-snapshot POST `.../dashboard-snapshot` (fire-and-forget)
  6. drive-folder status POST `.../events/{id}/drive-folders/status`
  (fanmass services/messmass_client.py + messmass_integration.py; cadence
  messmass_push_minutes default 60 via camera_sync.py tick).
- **Poll/ack (messmass → fanmass, inverted to outbound polls)**: fanmass runs a
  dedicated 5s `fanmass-rescan` thread on `GET/DELETE /api/integrations/fanmass/
  rescan-requests[/{eventId}]` and a 5s `fanmass-command` thread on
  `GET/DELETE .../commands[/{commandId}]` (fanmass workers/detection_worker.py:
  217-277; messmass lib/aiRescan.ts, lib/fanmassCommands.ts). Ack is
  after-apply; unknown command type is left pending, not errored. Command types:
  run_control.start/stop_batch, entity.confirm/reject_cluster/rename/merge,
  settings.update, settings.rotateApiKey.
- **Admin-enqueue (messmass side)**: `POST /api/admin/fanmass/commands` and the
  rescan/drive-sync routes use the ADMIN SESSION, never the integration token —
  do not confuse the two credentials.
- **Blocking outbound (messmass → fanmass)**: `/sync` and `/callbacks` pull from
  `GET {FANMASS_BASE_URL}/.../analytics-summary` with a 15s timeout — the one
  place messmass has a runtime dependency on fanmass reachability (contradicts
  architecture.md:4530).

### E3 · fanmass → camera (media pull)
Verified camera `97c1f67` · fanmass `1d173e9`. Direction is fanmass-pulls.
- fanmass `GET {cameraBaseUrl}/api/internal/fanmass/events` and
  `.../events/{eventId}/media?since=` (fanmass services/camera_client.py:109-124).
- **Auth**: header `x-fanmass-secret` = cameraApiKey + Bearer; camera verifies
  via assertInternalFanmassSecret (camera lib/fanmass/internal.ts:11-25,
  CAMERA_FANMASS_INTERNAL_SECRET). Media excludes `submissionKind:'tryon_result'`,
  requires originalImageUrl (camera media route:30-54).
- The returned i.ibb.co URLs are then fetched by fanmass **unauthenticated**
  (public host) — deliberate (fanmass camera_client.py:127-128).
- Cadence camera_poll_minutes (15). Cursor per event in system_state; a broken
  media URL holds the cursor back so nothing is skipped.

### E4 · messmass ↔ camera (master data + session + email)
Verified messmass `6d28c7f3` · camera `97c1f67`. **Bidirectional.**
- **messmass → camera (master, outbound)**: messmass is master; provisions
  organizations/partners/events into camera via
  `/api/internal/messmass/{organizations,partners,events}`, writing back
  cameraOrganizationId/cameraPartnerId/externalRefs.camera (messmass
  lib/cameraProvision.ts, lib/cameraClient.ts:98-109). Auth
  CAMERA_MESSMASS_INTERNAL_SECRET, camera verifies via assertInternalMessmassSecret.
- **camera → messmass (reverse, outbound from camera)**: camera pushes
  partners it creates natively → messmass `POST /api/integrations/camera/partners`
  (INSERTS new partners, messmass lib/cameraPartnerSync.ts:77), and mints a
  cross-app session → `POST /api/integrations/camera/sso-session` (messmass
  re-verifies the forwarded SSO token independently, never trusting the caller's
  identity claim). **This reverse direction is documented as non-existent in
  both repos' guides** (camera W1/W2, messmass guides-tutorial-camera-app.md:22-24)
  — the single most consequential doc error in the fleet.
- **Email**: camera is the only sender. messmass and fanmass both call
  `POST /api/internal/email/send` on camera (accepts either app's secret; forces
  the from-domain to camera's own). messmass has NO Resend dependency (verified).

### E5 · all apps → SSO (sso.doneisbetter.com)
Verified consumer-side only (SSO repo not in scope).
- **messmass**: CONFIDENTIAL client — client secret, PKCE skipped when secret
  present (lib/auth/ssoOAuth.ts:73-78). Local login retired: POST /api/admin/
  {login,register} → 410 Gone. Four legacy /api/admin/* routes still validate
  against the retired `{SSO_BASE_URL}/api/validate` (obsoletion candidates).
- **camera**: PUBLIC PKCE client by default (confidential only when
  SSO_CONFIDENTIAL_OAUTH=1 + secret set); redirect_uri derived per-request from
  forwarded host (camera lib/auth/sso.ts:106-113).
- **fanmass**: PUBLIC PKCE client, no secret (fanmass services/sso_oauth.py:9-12);
  unconfigured on the live box (login 307s to an error). Its own data API is
  gated by an api_key-or-operator-session check.
- **Common**: all three decode but do NOT cryptographically verify the ID token
  (trusting TLS from the token endpoint) — a shared, deliberate design choice
  worth a single fleet note. Access requires the central per-app permission
  store to return approved.

### E6 · external tail
- **Providers (try-on)**: Segmind IDM-VTON, fal/FASHN v1.6, google-edge (local),
  local CatVTON. fal is the only provider with automatic fallback ladders
  (pre-dispatch, mid-render, startup probe). Circuit breaker under all calls.
- **ImgBB**: try-on result publishing only (inputs are base64 now); camera
  result upload; messmass browser-direct upload (NEXT_PUBLIC_IMGBB_API_KEY).
- **messmass enrichment**: Bitly, Google Sheets+Drive, football-data.org,
  api-sports.io, thesportsdb.com.
- **fanmass**: Ollama/qwen2.5vl (default) or local Gemma/LiteRT fallback; local
  YOLO; Google Drive (local mount preferred over REST); **undocumented**
  Wikipedia + TheSportsDB egress from the entity-logo researcher.

## Runtime topology
- **Vercel**: messmass, camera. Redeploy on push to main; crons via vercel.json.
- **Local Mac (launchd)**: fanmass under a single `com.fanmass.supervisor`
  agent that forks worker+web; try-on under two agents
  (`com.tryon.app-server` port 7860, `com.tryon.camera-worker`). All local
  services `KeepAlive=true`; secrets from `.env.*` files, never the plists.
- **Restart lessons** (learned the hard way this month): the try-on worker can
  respawn-loop on a held lock; a stale worker can run week-old code after a
  push; both are documented in the try-on runbook (try-on#40).

## Security posture — cross-cutting (each tracked as its own issue)
- **fanmass** binds 0.0.0.0 + CORS `*` + a 4-char api_key; 44 routes
  unauthenticated incl. raw fan photos and a state-mutating status route; docs
  claim 127.0.0.1 (fanmass#83).
- **try-on** has zero auth on 31 routes incl. arbitrary-path file write and
  launchd control, protected only by the loopback bind and no origin check
  (try-on#41).
- **camera**: spoofable cron trigger; unauthenticated PATCH /api/submissions;
  session cookies unencrypted despite the comment (camera#119).
- **messmass**: `development_secret` cron fallback; unauthenticated google-sheet
  + hashtag-style mutations (messmass#347).

## How to keep this true (P6)
Any change to a shared collection, cross-app endpoint, or integration token
must update this map and the affected contract doc in the same commit
(contract-first). Regenerate the per-repo inventories under docs/_audit/ with
messmass `scripts/fleet-audit-inventory.py` and re-stamp the SHAs above.
