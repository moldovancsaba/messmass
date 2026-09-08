# SEYU Fleet Architecture — canonical map

Fleet audit P1. Written 2026-08-19 from code read on BOTH sides of every edge;
re-verified in full on 2026-09-08 against current code, both sides. Each edge
is stamped with the SHAs it was verified against. This is the doc a new
developer reads first. Canonical copy lives here in messmass;
camera/fanmass/try-on carry pointers to it. Header-less by design (docs:audit
version gate).

Verified messmass `44e2d007` · camera `88c6839` · fanmass `5d9a032` ·
try-on `c8ba623` · savetheworld `2239855` (2026-09-08).

## The six systems

| System | Repo | Runs on | Role |
|---|---|---|---|
| **messmass** | moldovancsaba/messmass | Vercel | Master of partners/events/organizations; event reports; analytics UI over fanmass results |
| **camera** | moldovancsaba/camera | Vercel | Fan photo capture; try-on job producer + moderation; the fleet's only email sender |
| **fanmass** | moldovancsaba/fanmass | local Mac (launchd supervisor, loopback-bound) | Vision-model image analysis; always the outbound caller (no public inbound address) |
| **try-on** | moldovancsaba/try-on | local Mac (launchd: app-server + worker, loopback-bound) | Virtual try-on renders; Atlas queue worker + local render server |
| **SSO** | moldovancsaba/sso | sso.doneisbetter.com | Shared OAuth2/OIDC identity + per-app permission store (audited consumer-side only) |
| **savetheworld** | moldovancsaba/savetheworld | Vercel (savetheplanet.vercel.app) | "Choose better" marketplace of companies and offers; wallet passes; pledge wall pulled from camera |

Two Mongo worlds: messmass and fanmass each own a database; **camera and
try-on share one Atlas database** (the try-on job queue). fanmass reaches
messmass and camera only over HTTP. savetheworld owns its own
database and reaches camera only over HTTP (E7).

## Edge contracts

### E1 · camera ↔ try-on (shared Atlas + completion webhook)
Verified messmass n/a · camera `88c6839` · try-on `c8ba623`.
- **Transport**: shared Atlas DB only — **camera never calls try-on over HTTP**
  (no try-on host/port anywhere in camera lib/app/scripts) and nothing in the
  fleet reaches the try-on app-server (loopback `127.0.0.1:7860`, origin guard,
  `x-tryon-local-secret` on its two control routes). Collections, camera-side
  owner (camera lib/db/schemas.ts:40-45): `tryon_jobs` (queue), `leather_suits`
  (garment catalog), `tryon_setups` (pipeline presets),
  `camera_setup_preferences`, `tryon_worker_heartbeats`,
  `tryon_moderation_events`. try-on binds the first five
  (scripts/tryon_queue_worker.py:644-648); `tryon_moderation_events` is
  camera-only.
- **Claiming**: try-on worker does an atomic find_one_and_update, FIFO by
  createdAt, lease = TRYON_LEASE_DURATION_SECONDS (600s default), heartbeat at
  40% of lease extends the lease (tryon_queue_worker.py:1267-1300, :2647).
  Five recovery sweeps reclaim stale/aborted jobs before each claim
  (:2990-2994).
- **Completion (try-on → camera)**: POST `CAMERA_TRYON_COMPLETE_URL` (try-on
  env, required at startup :281-288) → camera `POST /api/internal/tryon/complete`
  (camera app/api/internal/tryon/complete/route.ts:34-73). Auth: shared secret
  `CAMERA_TRYON_INTERNAL_SECRET`, header `x-camera-tryon-secret` or Bearer
  (camera lib/tryon/completion.ts:72-85; try-on sends x-camera-tryon-secret at
  :2596). Both sides fail-closed when the secret is unset. camera keys the
  completion on `jobId` + `publicResultUrl` (+ optional deleteUrl, workerId,
  processorMeta.pipelineVersion); try-on still probes up to 16 payload variants
  over `submissionId`/`sourceSubmissionId`/`source.eventMongoId`/`eventId`
  (:1423-1438) — camera ignores those fields, so the variants are harmless
  but dead weight (try-on#40 §4 — collapse to one shape).
- **Result storage**: Vercel Blob is the required primary
  (`BLOB_READ_WRITE_TOKEN`, :283-290); ImgBB is an optional best-effort mirror
  (:1533-1541).
- **Reconciliation cron (camera)**: vercel.json every 5 min hits
  `GET /api/internal/tryon/sync?status=done&limit=50` to materialize any
  results the webhook missed — because camera ALSO ships an in-repo worker
  (`tryon:worker` script, lib/tryon/worker.ts) that writes Mongo directly and
  skips the webhook. GET now requires `x-camera-tryon-secret` OR
  `Authorization: Bearer <CRON_SECRET>` and fails closed when CRON_SECRET is
  unset (sync/route.ts:40-55; camera#119 closed) — the spoofable
  `x-vercel-cron` branch is gone.
- **Provider routing (try-on)**: garment-typed jersey/top/bottom jobs on a
  `segmind_idm_vton` setup reroute to FASHN v1.6/fal
  (tryon_queue_worker.py:463-481, applied :2690-2698); motorsport suits and
  local/google setups do not. Provider inputs are base64 (fal data-URI, Segmind
  raw); transparent garments are composited onto white for fal. Documented in
  docs/TRYON_ATLAS_CONTRACT.md:66-73 (the two former omissions — Segmind
  base64, white compositing — are now in it).

### E2 · fanmass → messmass (six push channels + two poll/ack channels)
Verified messmass `44e2d007` · fanmass `5d9a032`. fanmass is always the caller.
- **Auth**: fanmass sends Bearer + `x-api-key` = FANMASS_INTEGRATION_TOKEN
  (fanmass services/messmass_client.py:28-29); messmass verifies via
  requireFanmassIntegrationAuth (messmass lib/fanmassIntegration.ts:74-87 —
  503 if unset, 401 on mismatch, plain string compare). All /api/integrations/*
  is CSRF-exempt (lib/csrf.ts:179).
- **Push (fanmass → messmass)**, messmass route ← fanmass caller:
  1. event-context pull GET `.../events/{id}/context` (fanmass on-demand,
     messmass_integration.py:104)
  2. legacy analytics callback POST `messmass_callback_url` (HMAC-SHA256-signed
     when `messmass_callback_secret` is set, :642-668; dark when the URL is
     unset — live-box state unverified here)
  3. mapped scalar stats POST `.../events/{id}/stats` (messmass_client.py:84)
  4. analysis-summary POST `.../events/{id}/analysis-summary`
     (contract `fanmass.messmass.analytics-summary.v1`, :72-79)
  5. dashboard-snapshot POST `.../dashboard-snapshot` (fire-and-forget, :86-91;
     contract `fanmass.messmass.dashboard-snapshot.v1`)
  6. drive-folder status POST `.../events/{id}/drive-folders/status` (:148)
  messmass_client.py also creates partners/events/variables via
  `POST /api/integrations/fanmass/{partners,events,variables}`. Cadence
  messmass_push_minutes default 60 via services/camera_sync.py tick (:177).
- **Poll/ack (messmass → fanmass, inverted to outbound polls)**: fanmass runs a
  dedicated 5s `fanmass-rescan` thread on `GET/DELETE /api/integrations/fanmass/
  rescan-requests[/{eventId}]` and a 5s `fanmass-command` thread on
  `GET/DELETE .../commands[/{commandId}]` (fanmass workers/detection_worker.py:
  221-275; messmass lib/aiRescan.ts, lib/fanmassCommands.ts). Ack is
  after-apply (messmass_integration.py:477); unknown command type is left
  pending, not errored (:466). Command types (lib/fanmassCommands.ts:24-31):
  run_control.start/stop_batch, entity.confirm/reject_cluster/rename/merge,
  settings.update, settings.rotateApiKey.
- **Admin-enqueue (messmass side)**: `POST /api/admin/fanmass/commands` and the
  rescan/drive-sync routes use the ADMIN SESSION (getAdminUser + role check),
  never the integration token — do not confuse the two credentials.
- **Blocking outbound (messmass → fanmass)**: `/sync` and `/callbacks` call
  syncFanmassAnalytics, which pulls
  `GET {FANMASS_BASE_URL}/api/integrations/messmass/batches/{batchId}/analytics-summary`
  with a 15s timeout, sending `x-api-key` = FANMASS_API_KEY (a THIRD credential,
  distinct from FANMASS_INTEGRATION_TOKEN; lib/fanmassIntegration.ts:258-265,
  :343; lib/config.ts:141-142). fanmass gates it with require_api_key
  (app.py:1098-1102). This is the one place messmass has a runtime dependency
  on fanmass reachability (contradicts architecture.md:4529).

### E3 · fanmass → camera (media pull)
Verified camera `88c6839` · fanmass `5d9a032`. Direction is fanmass-pulls.
- fanmass `GET {cameraBaseUrl}/api/internal/fanmass/events` and
  `.../events/{eventId}/media?since=` (fanmass services/camera_client.py:12-16,
  :120).
- **Auth**: header `x-fanmass-secret` = cameraApiKey + Bearer
  (camera_client.py:70-71); camera verifies via assertInternalFanmassSecret
  (camera lib/fanmass/internal.ts:11-25, CAMERA_FANMASS_INTERNAL_SECRET,
  fail-closed). Media excludes `submissionKind:'tryon_result'` and requires
  originalImageUrl (camera media route:37-38, :53).
- The returned i.ibb.co URLs are then fetched by fanmass **unauthenticated**
  (public host) — deliberate (camera_client.py:17, :129).
- camera never calls fanmass (no FANMASS_BASE_URL in camera). Cadence
  camera_poll_minutes (15). Cursor per event in system_state
  (`camera_cursor:<eventId>`, camera_sync.py:39-40, :87); a broken media URL
  holds the cursor back so nothing is skipped.

### E4 · messmass ↔ camera (master data + session + email)
Verified messmass `44e2d007` · camera `88c6839`. **Bidirectional.**
- **messmass → camera (master, outbound)**: messmass is master; provisions
  organizations/partners/events into camera via
  `/api/internal/messmass/{organizations,partners,events}`, writing back
  cameraOrganizationId/cameraPartnerId/externalRefs.camera (messmass
  lib/cameraProvision.ts:13-56, lib/cameraClient.ts:99-109). Auth
  `x-messmass-secret` (or Bearer) = CAMERA_MESSMASS_INTERNAL_SECRET, camera
  verifies via assertInternalMessmassSecret (lib/messmass/internal.ts:9-21,
  fail-closed).
- **camera → messmass (reverse, outbound from camera)**: camera pushes
  partners it creates natively → messmass `POST /api/integrations/camera/partners`
  (INSERTS new partners, messmass lib/cameraPartnerSync.ts:77; callers camera
  app/api/partners/route.ts + [partnerId]/route.ts via lib/messmassClient.ts:77-82,
  header `x-camera-secret` + Bearer = the SAME CAMERA_MESSMASS_INTERNAL_SECRET;
  messmass verifies via assertCameraSecret, lib/cameraClient.ts:16). The former
  "reverse direction does not exist" doc error is fixed: messmass
  docs/guides/guides-tutorial-camera-app.md:24 now says bidirectional.
- **Cross-app session (both directions)**: each app's SSO callback forwards the
  tokens it just received to the other app, which independently re-verifies
  them against SSO (getUserInfo + getAppPermission — never trusting the
  caller's identity claim) and mints its own cookie. camera →
  messmass `POST /api/integrations/camera/sso-session` (camera
  app/api/auth/callback/route.ts:29 → messmassClient.ts:49; messmass route
  :35, :60, :70, :81). messmass → camera `POST /api/internal/messmass/sso-session`
  (messmass app/api/auth/sso/callback → lib/cameraClient.ts:76-80; camera route
  :36, :47, :55, :70). Shared cookie domain via SESSION_COOKIE_DOMAIN on camera.
- **Email**: camera is the only sender. messmass calls camera
  `POST /api/internal/email/send` with `x-messmass-secret` + Bearer
  (lib/emailNotifications.ts:45-50; skipped when CAMERA_BASE_URL /
  CAMERA_MESSMASS_INTERNAL_SECRET are unset). camera's route accepts either the
  messmass or fanmass secret and forces the from-domain to CAMERA_EMAIL_FROM's
  domain (camera email/send/route.ts:11-26). **fanmass has no email caller
  today** (no `email/send` reference in fanmass code) — the fanmass-secret
  branch on camera is unused. messmass has NO Resend dependency (package.json).

### E5 · all apps → SSO (sso.doneisbetter.com)
Verified consumer-side only (SSO repo not in scope).
- **messmass**: CONFIDENTIAL client — client secret, PKCE skipped when
  SSO_CLIENT_SECRET is set (lib/auth/ssoOAuth.ts:9-11, :74, :149-171). Local
  login retired: POST /api/admin/{login,register} → 410 Gone. Two legacy
  routes still validate against the retired `{SSO_BASE_URL}/api/validate`
  (app/api/admin/projects/[id]/route.ts:16, app/api/admin/permissions/route.ts:16
  — obsoletion candidates); the two collection routes and lib/ssoClient.ts were
  deleted under messmass#386.
- **camera**: PUBLIC PKCE client by default (confidential only when
  SSO_CONFIDENTIAL_OAUTH=1 + secret set, lib/auth/sso.ts:8-9, :103-110);
  redirect_uri derived per-request from forwarded host (sso.ts:37-44). Session
  cookie is HMAC-signed, unsigned/tampered cookies rejected
  (lib/auth/session.ts:8-10, session-signing.ts; camera#122).
- **fanmass**: PUBLIC PKCE client, no secret (fanmass services/sso_oauth.py:9-12).
  Live-box SSO configuration state unverified here. Its own data API is gated
  by require_api_key (api_key or operator-session cookie, fails closed on an
  empty key; app.py:322-341, 106 uses) and image bytes by require_image_access
  (key, session cookie, or same-origin browser image load; app.py:346-368,
  7 uses).
- **Common**: all three decode but do NOT cryptographically verify the ID token
  (messmass ssoOAuth.ts:189-196, camera sso.ts:299, fanmass sso_oauth.py:122-127;
  trusting TLS from the token endpoint) — a shared, deliberate design choice
  worth a single fleet note. Access requires the central per-app permission
  store to return approved. The cross-app session paths in E4 use userinfo,
  not the ID token.

### E6 · external tail
- **Providers (try-on)**: Segmind IDM-VTON (api.segmind.com), fal/FASHN v1.6
  (fal.run, queue.fal.run), google-edge (local), local CatVTON. fal is the only
  provider with automatic fallback ladders. Circuit breaker under all calls.
- **Vercel Blob / ImgBB**: try-on publishes results to Vercel Blob (required)
  with ImgBB as optional mirror; camera result upload (lib/imgbb/upload.ts);
  messmass browser-direct upload (NEXT_PUBLIC_IMGBB_API_KEY,
  lib/imgbbClientUpload.ts).
- **messmass enrichment**: Bitly, Google Sheets+Drive, football-data.org,
  api-sports.io, thesportsdb.com (docs/_audit/outbound-hosts.json).
- **fanmass**: Ollama/qwen2.5vl (default) or local Gemma/LiteRT fallback; local
  YOLO; Google Drive (local mount preferred over REST); Wikipedia + TheSportsDB
  egress from the entity-logo researcher (now documented in
  docs/current-implementation.md and docs/entity-resolution.md).

### E7 · savetheworld → camera (pledge wall)
Verified camera `88c6839` · savetheworld `2239855`. Direction is savetheworld-pulls.
- **Caller**: savetheworld `src/lib/pledges/camera.ts` — `GET
  {CAMERA_BASE_URL}/api/internal/savetheworld/pledges?eventId=<CAMERA_PLEDGE_EVENT_ID>&limit=<n>`
  with header `x-savetheworld-secret: CAMERA_SAVETHEWORLD_INTERNAL_SECRET`; any
  missing variable or non-2xx answer yields an empty wall, silently (`:22`, `:33`).
- **Callee**: camera `app/api/internal/savetheworld/pledges/route.ts` —
  `assertInternalSavetheworldSecret` (lib/savetheworld/internal.ts) then
  submissions matched on `eventId` or `eventIds[]`; only share-visible
  submissions are returned, never e-mail addresses. `/events` and `/partners`
  under the same prefix have no caller in savetheworld (deprecation candidates
  in camera's api-reference).
- **Capture side**: the pledge CTA links to camera's public capture page for
  the event (`NEXT_PUBLIC_CAMERA_PLEDGE_URL`); the submission is created in
  camera, so the wall is only as full as camera's moderation queue lets it be.
  State on 2026-09-08: camera event `6a8dd2092eda4880debc333b`
  ("savetheworld — Take the Pledge") exists with 0 submissions.
- savetheworld shares SSO (E5) as a PKCE + client-secret OAuth client
  (redirect `https://savetheplanet.vercel.app/api/oauth/callback`) and ImgBB
  for admin uploads; it writes nothing into any other app.

## Runtime topology
- **Vercel**: messmass, camera. Redeploy on push to main; crons via vercel.json
  (camera: the 5-min try-on sync; messmass: analytics-aggregation, bitly).
- **Local Mac (launchd)**: fanmass under a single `com.fanmass.supervisor`
  agent (scripts/install_supervisor_agent.sh → scripts/fanmass_supervisor.py)
  that forks web+worker — the old `com.fanmass.web`/`com.fanmass.worker` plists
  are retired (RUNBOOK.md:7-9); binds `127.0.0.1:8787`, CORS loopback-only
  (.config/settings.example.json:3-7; app.py:71-72, :2776). try-on under two
  agents (`com.tryon.app-server` on `127.0.0.1:7860`, `com.tryon.camera-worker`).
  All local services `KeepAlive=true`; secrets from `.env.*` files, never the
  plists.
- **Restart lessons**: the try-on worker can respawn-loop on a held lock; a
  stale worker can run week-old code after a push — try-on RUNBOOK.md §Restart
  (try-on#40; exact wording unverified in this pass).

## Security posture — cross-cutting (each tracked as its own issue)
State as of 2026-09-08; every item below is closed except fanmass#87.
- **fanmass**: fanmass#83 (0.0.0.0 bind + CORS `*` + 44 unauthenticated routes
  incl. raw fan photos and a mutating status GET) — CLOSED via fanmass#84
  (10613ab, v12.2.0): bound to 127.0.0.1 with loopback-only CORS,
  require_api_key fails closed on an empty key, the orphan reconcile moved from
  `GET /api/run-control/status` to a credentialed POST; then v12.2.1 (da82c5a)
  put require_api_key on the 23 data GETs and require_image_access on the 6
  image-byte routes. Rotating the short api_key remains an operator step.
  **fanmass#87 (dead pre-SPA templates/scripts cleanup) is the only OPEN item**
  — partially landed in 0c9080b/1b49141.
- **try-on**: try-on#41 (zero auth on 31 routes incl. arbitrary-path file write
  and launchd control) — CLOSED via try-on#42: origin-guard middleware (403 on
  cross-origin) + output path contained to the project root (0ddb882), then
  `x-tryon-local-secret` on `POST /api/tryon/run` and
  `POST /api/worker/service-action` (28a76c2); the other routes stay
  loopback+origin-guard by design.
- **camera**: camera#119 — CLOSED (2f0c088): sync GET requires the try-on
  secret or Bearer CRON_SECRET; `PATCH /api/submissions/[submissionId]` allows
  the public first write only, admin appRole thereafter. camera#122 — CLOSED
  (74265ba, v12.2.23): session cookie HMAC-signed, unsigned cookies rejected.
- **messmass**: messmass#347 — CLOSED (52cff59e): `development_secret` cron
  fallback removed (analytics-aggregation fails closed), the 8 google-sheet
  routes + `POST /api/admin/hashtag-style` require a session. messmass#348 —
  CLOSED (9eccf118, v12.3.17): the two remaining fail-open cron variants
  (`/api/bitly/sync`, `/api/cron/bitly-refresh`) fail closed and the Bitly cron
  actually fires. messmass#386 — CLOSED (62a47a0d, v12.3.18): every debt read
  route guarded per verified caller, the two stale-SSO admin collection routes
  + lib/ssoClient.ts deleted. Page-password-protected pages now issue a signed
  HttpOnly grant cookie and their data routes call requirePageAccess
  (lib/pageAccess.ts:2-12, :125).

## How to keep this true (P6)
Any change to a shared collection, cross-app endpoint, or integration token
must update this map and the affected contract doc in the same commit
(contract-first, docs/_audit/contract-first-rule.md). Regenerate the per-repo
inventories under docs/_audit/ with messmass `scripts/fleet-audit-inventory.py`
and re-stamp the SHAs above.
