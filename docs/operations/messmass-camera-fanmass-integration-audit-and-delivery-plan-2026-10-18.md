# Messmass, Camera and Fanmass integration audit and delivery plan

**Audit baseline:** 2026-10-18; delivery status reconciled 2026-10-20
**Status:** The staged-design findings below are historical. The Atlas-owned, one-photo contract and Messmass per-photo result/report flow are merged and deployed. See **Current verified implementation** first; use the linked operator/API guides as the live contract.
**Purpose:** Establish a reliable, privacy-aware integration for photo capture, human vetting, AI-assisted analysis, correction, learning and reporting.

## Current verified implementation — 2026-10-20

The previous event/batch aggregate model is retired for Camera photo analytics. The authoritative current contract is the [Fanmass photo-analysis guide](../guides/guides-tutorial-fanmass.md), [analytics API guide](../api/api-analytics.md), and [complete API reference](../api/api-reference-complete.md).

| Boundary | Current responsibility |
|---|---|
| Camera | Owns partner/event/photo records, capture, identity, consent, retention/erasure and human vetting. Camera performs no Fanmass scheduling, image transfer, or analysis callback. |
| Fanmass | Independently discovers eligible Camera Atlas photos, owns the durable queue and global one-photo lease, analyzes one photo at a time, retains findings and boxes, and delivers one identity-free result or tombstone for that photo. |
| Messmass | Owns its partner/event records and the exact Camera links; validates each result's routing IDs; stores photo-level results and boxes; derives event summaries and report variables from those records. |

The task/result contract uses the Messmass event ID and Camera partner, event, and photo IDs, plus the source revision/generation and the findings for that single image. Fanmass does not receive guest name, email, login identity, consent text, or raw Camera documents. It does not query Messmass event context and does not send event reports, completion percentages, coverage, or projected audience totals. Messmass derives its own event report from stored photo results.

Production verification on 2026-10-20:

- **Event mapping:** 438 Messmass events had 438 unique Camera event links; zero duplicates, missing events, dangling links, wrong Messmass event IDs, partner mismatches, or eligible events without a Camera link.
- **Photo records:** 90 valid one-photo results were retained across 7 events; all had exact routing IDs and box arrays. Messmass rebuilt 7 summaries from those records.
- **Canonical report data:** 88 current photo-result variable definitions and 397 materialized canonical per-photo report fields; zero noncanonical Fanmass fields or legacy progress timestamps remained active.
- **Obsolete active data:** 221 old summaries, 261 dashboard snapshots, and 220 project-stat snapshots were removed from active collections; old variable definitions were replaced. Recoverable copies remain in the internal archive.
- **AI Analytics:** the page now presents received photo results, detections, boxes, brands/clubs, merchandise, and completed moderation checks. It does not imply event-wide completion, coverage, freshness, unique people, or projected audience totals.

The remaining product work is the separate human review/correction and quality-learning loop. The current result view is feedback evidence; it is not an AI approval step, a Camera vetting action, or automatic model training.

## 0. Original owner decision — 2026-10-20 (implemented with the per-photo contract below)

The owner explicitly rejected the Camera-produced HTTP queue as the integration
model. Camera must not create Fanmass work, call Fanmass, upload to Fanmass, or
receive analysis callbacks. This is a boundary refactor, not a smaller change to
the former poller.

| System | Required responsibility |
|---|---|
| **Camera** | Capture, identity and consent, retention/erasure, human vetting, and Camera's own audit trail. It writes its normal event/submission records and otherwise does not manage AI work. |
| **Fanmass** | Independently reads eligible Camera records from Atlas with a read-only source role; owns its durable queue, discovery/reconciliation, global one-photo lease, retries, full analysis/results/boxes, and deletion of its derived local copies. |
| **Messmass** | Receives one identity-free photo result at a time through the authenticated integration, stores it against the exact event/photo IDs, and derives event aggregates and reports. It does not receive guest contact data. |

Required lifecycle:

1. Camera saves a submission and later records its consent, identity, retention,
   and human publication decision. A no-login capture is excluded and remains
   under Camera's 24-hour erasure policy.
2. Fanmass discovers eligible source documents directly in Camera Atlas through
   a narrow projection that does not return email/name/login fields. A change
   stream is the low-latency path; bounded, resumable scans recover missed
   changes and source deletions.
3. Fanmass creates exactly one queue identity per source photo, regardless of
   event links. Fanmass alone acquires a global lease and processes one image at
   a time. It rechecks eligibility before download and before result commit.
4. Fanmass persists the complete normalized analysis and image-relative boxes
   in its own Atlas database. It retries transient errors and fences stale
   workers; a crash may cause recomputation, but cannot publish a stale result.
5. Fanmass sends the completed result for that photo to Messmass through the
   authenticated integration. A source withdrawal/deletion/ineligibility is
   sent as a photo-level tombstone and also queues retryable deletion of local
   image/derived data.

The implemented source-discovery contract is documented in Fanmass
`docs/CAMERA_ATLAS_QUEUE_CONTRACT.md`. The former Camera queue/private-media API
and claim/ack consumer are not part of the design. The current Messmass result
contract is `fanmass.messmass.photo-analysis.v1`; the one-photo endpoints and
the exact Camera↔Messmass event mapping are deployed. Retired event-level
Fanmass write routes remain unavailable and return `410 Gone`.

## 1. Executive recommendation

Keep the three systems and make their ownership explicit:

| System | Owns |
|---|---|
| **Messmass** | Organizations, partners, events, reports, report access, and event-level analytics presentation |
| **Camera** | Capture, guest identity and consent, retention/erasure, publication visibility, human vetting, and its own audit history |
| **Fanmass** | Independent Camera Atlas discovery, durable queue, one-photo scheduling, local AI analysis, full result/boxes, retries, provenance, and derived-data cleanup |

The source-discovery boundary is MongoDB Atlas with separate database
permissions. Fanmass reads eligible Camera records and writes its own pipeline
state. Camera does not create Fanmass jobs, send images, call Fanmass, or receive
result callbacks. Fanmass sends a single photo result to Messmass; Messmass
derives event analytics through its authenticated integration.

The target lifecycle is:

1. Camera persists capture, identity, consent, retention, and human publication
   state. An incomplete/no-login journey is excluded from review and AI, then
   erased by Camera after its 24-hour identity window.
2. Fanmass independently discovers source records through Atlas change streams
   and bounded resumable reconciliation. It receives only a minimal field
   projection; Atlas computes a real-identity boolean without returning contact
   data.
3. Fanmass gives each source photo one queue key derived from its source Mongo
   `_id`. A single global Atlas lease permits one queue photo to be analyzed at a
   time. Fanmass rechecks eligibility and source revision before download and
   before result persistence.
4. Fanmass writes the complete normalized analysis, provenance, summary, and
   image-relative people/face boxes to its own Atlas database. Fenced retries
   are at-least-once: failures can cause recomputation, but stale workers cannot
   publish results.
5. Fanmass sends a result or tombstone for one photo to Messmass using the
   authenticated API. Consent withdrawal, erasure, source deletion, or changed
   eligibility cancels output and triggers retryable cleanup of Fanmass's
   staged image and derived local data.

This architecture does not include AI suggestions in Camera's vetting UI or
Camera-authored corrections back to Fanmass. Those would be a separate,
explicitly designed product surface and data boundary; they must not reintroduce
Camera as the analysis queue owner.

Keep distinct state machines for publication review, Fanmass analysis, Camera
permission/retention, and decision-email delivery. A single `approved` state
must never stand in for consent, analysis completion, or email success.

## 2. Scope and evidence limits

The 2026-10-18 baseline was a source/documentation audit plus a local runtime restart. Subsequent delivery changed production code and analytics data; current verified production outcomes are listed at the top of this document and in the release notes. This section's runtime snapshot remains dated 2026-10-18 and must not be used as a current Fanmass health check. Secret values are not documented.

The source baseline checked was the repository remote-main refs available on 2026-10-18:

| Repository | Source baseline |
|---|---|
| Messmass | 181e49d5 |
| Camera | 2e6c1eb8 |
| Fanmass | 7032843 |

These remote-main refs were fetched again on 2026-10-19 before implementation. Implementation branches start from these refs.

The shared local checkouts were behind those refs (Messmass 28 commits; Fanmass 5; Camera’s local feature branch was 8 commits behind and 1 commit ahead of origin/main at the time of review). Source findings below therefore refer to the fetched remote-main refs, not the stale local source files. The local-runtime status below was refreshed after the requested restart on 2026-10-18. It describes this Mac only and does not establish production status elsewhere.

### 2.1 Local Fanmass runtime prerequisite — refreshed 2026-10-18 after restart

**Decision: Fanmass is running locally as requested, with Image.direct's inference listener stopped and Google Drive historical backfill disabled. This proves the current checkout can start, but does not qualify the Mac for unattended production integration.** Fanmass remains local-only: Camera and Messmass do not call a public Fanmass endpoint. Fanmass initiates the read-only Atlas connection from this machine; the existing outbound Messmass analytics delivery remains separate.

| Check | Observed after the requested operation | Readiness |
|---|---|---|
| Hardware and OS | Apple Silicon ARM64 Mac, 10 CPU cores, 16 GiB RAM | Compatible with the current service; representative event throughput and peak unified-memory pressure still need measurement. |
| Python runtime and model assets | Fanmass Python 3.11 environment, MongoDB 8.2.6, Ollama, YOLO11n weights and cached `qwen2.5vl:3b` are present. | Runtime started. `ollama ps` showed no model loaded at the snapshot; do not infer low total memory use from per-process RSS alone. |
| Exclusive local inference slot | The Image.direct process owning `127.0.0.1:8001` received SIGTERM and exited; the listener is closed. Fanmass now owns the local analysis workload. | Pass for this handoff. There is no automated mutual exclusion yet; implement the coordinator in Section 2.4 before scheduled switching or production use. |
| Supervisor and services | `com.fanmass.supervisor` is enabled and running in the current user's launchd domain. Fanmass `/api/health` returned HTTP 200 with `status=ok`, database connected, and vision, semantic, full and analytics capabilities ready. MongoDB, Ollama, web and worker listeners/processes are present. Supervisor state is fresh (`running`, web healthy, worker heartbeat about 13 seconds old). | Pass for this local restart. The LaunchAgent still depends on the logged-in user's GUI session. |
| API access | No Fanmass API key is configured. Camera/Messmass credential fields exist; secret values and live authentication were not inspected. | Local health is public and working, but protected dashboard/API access and cross-app credentials remain unverified. No key was generated as part of restart. |
| Disk headroom | Free space was about 12 GiB before start, fell to 9.9 GiB during startup, then read about 15 GiB at the final recheck; volume usage fluctuated between 97% and 98%. Existing Fanmass uploads, MongoDB data/logs and model caches remain intact. | **Production blocker.** The changing, low reserve needs investigation and a defined stop threshold, retention and log rotation. No cleanup or data deletion was performed. |
| Drive backfill | `.config/settings.json` had `gdriveBackfill=false`; no `GDRIVE_BACKFILL` override existed in the checked process environment, `.env`, or LaunchAgent. The then-present `cameraBackfill=false` value was a legacy setting and is not used by the Atlas-owned queue. | Historical Drive backfill was paused at the time of the 2026-10-18 check. The ordinary incremental Drive poll was separate from full-history backfill. |
| Repository age | Local Fanmass checkout remains 5 commits behind the fetched `origin/main` baseline from the audit; it was not pulled or changed during restart. | Agree the release and reconcile the checkout before production integration. |

Fanmass's public health endpoint and worker heartbeat are healthy, but this is not a production canary: no Camera/Messmass credential was exercised and no new processing purpose or event scope was enabled. The current-user LaunchAgent needs the user GUI session; if the service must survive logout or user-session failure, move it to a managed always-on local host/service account. The worker is active and the free disk reserve is low, so watch queue activity and disk growth.

**Gate 0 — local runtime readiness, before enabling the Fanmass Atlas reader in production:**

1. Confirm this Mac (or an explicitly designated always-on local host) is the supported Fanmass worker; reconcile its five-commit drift to the approved release and verify outbound Camera/Messmass access.
2. Resolve disk capacity, retention and log rotation. Define a minimum free-space stop threshold before unattended image ingestion.
3. Keep `gdriveBackfill=false`; separately decide whether ordinary incremental Drive polling should continue. Confirm event/partner scope. Provision a scoped Fanmass API key if operators need protected dashboard/API routes; validate outbound credentials without exposing values.
4. Keep Fanmass and Image.direct under one local inference lease coordinator (Section 2.4) before any automated switching. For a manual handoff, stop/unload the current model first, verify it released the listener/model and check memory pressure before starting the next.
5. Verify launchd state, `/api/health`, dependencies, fresh worker heartbeat, protected API access if required, and a non-mutating Camera/Messmass canary. Confirm restart and network-recovery behavior without enabling historical backfill.
6. Agree on worker availability and queue-age targets. Fanmass discovers independently from Atlas on a five-second scheduler with change streams for low latency; actual production Atlas connectivity and observed discovery latency remain unverified until deployed.

### 2.2 Local memory, inference and scheduled-job inventory — checked 2026-10-18

There is **no current-user crontab**, no `/etc/crontab`, and no custom daily/weekly/monthly script in the checked `/etc/periodic` directories. On this Mac, launchd and manually started services are the relevant schedulers.

| Runtime/job | Current finding | Meaning for Fanmass |
|---|---|---|
| Image.direct inference | Before handoff, its authenticated `/v1/health` reported `ready`, `modelLoaded=true`, backend `mlx`, `experimental=true`, and `memoryPressure=unknown`. The Python process owning `127.0.0.1:8001` was gracefully sent SIGTERM; afterward the port had no listener. | **Stopped for this Fanmass run.** Process RSS was not a reliable estimate of the loaded model's unified-memory footprint. It still lacks a shared start/stop coordinator with Fanmass; do not assume safe automatic model switching until Section 2.4 is implemented. |
| Try-on services | `com.tryon.app-server` and `com.tryon.camera-worker` are disabled in launchd; no matching process is running. The worker can use a local model path for some setups. | Not currently consuming inference resources. Keep disabled during Fanmass qualification unless an explicit concurrency test is planned. |
| OpenClaw gateway and local SearXNG | Both launch agents have `RunAtLoad` and `KeepAlive`; `launchctl print` showed repeated launches (178,351 and 178,350) ending with exit `78 / EX_CONFIG`, with no live process. The OpenClaw one-shot `setenv` job exited successfully. | They are not currently running model inference, but the two restart loops are separate recurring local jobs. Diagnose/disable the bad configuration through their owner before using host load as a Fanmass benchmark. This audit did not alter them. |
| Google AI Edge Gallery | The desktop app is open, at about 22 MiB RSS and 0% sampled CPU; no separate model-serving listener was found. | An on-device AI app is present, but no active inference was observed in this snapshot. |
| macOS analysis services | `photoanalysisd`, `mediaanalysisd` and Intelligence Platform services were present at low RSS/CPU in the snapshot. | OS-managed background analysis, not a project cron or Fanmass worker. Their activity can vary independently. |
| Fanmass | Supervisor enabled; health 200, MongoDB connected, worker heartbeat fresh; Ollama and MongoDB listeners present. | Fanmass is running locally. The ordinary scheduler can run; Drive history backfill is off. |

The pre-start memory snapshot showed 16 GiB installed, around 14 GiB reported used, about 1 GiB unused and about 4.2 GiB in the compressor. `memory_pressure` separately reported 59% system-wide free; macOS's figures use different accounting, and Image.direct reports its own pressure as unknown. Treat a measured, supervised startup and inference window as the authority; do not infer safe concurrency from RSS alone. The largest individual app process was a ChatGPT/Codex renderer at roughly 1.0 GiB. Approximate process-family RSS sums were 2.4 GiB for ChatGPT/Codex and 2.7 GiB for Claude; these app totals do not mean their language models are running locally, and summed RSS can double-count shared memory.

Disk is an additional capacity concern for a local model host: free space was about 12 GiB before startup, 9.9 GiB during startup and about 15 GiB at the final recheck; the volume reported 97–98% used. Current caches/stores include about 35 GiB in the Hugging Face cache, 16 GiB in `/Users/Shared/Models`, 13 GiB in the Ollama cache and 15 GiB in Fanmass `.runtime`. No cache, MongoDB data, image upload or log file was deleted. Fanmass's existing service logs and MongoDB log are large and have no automated rotation in the runbook. Investigate this fluctuation and establish a hard safety reserve before leaving continuous ingestion unattended.

### 2.3 Restart result and remaining local qualification

The requested local handoff was completed on 2026-10-18:

1. Set `gdriveBackfill=false` in Fanmass settings before starting it. No overriding `GDRIVE_BACKFILL` value was found in the checked environment, `.env`, or LaunchAgent. The historical `cameraBackfill` value was false but is obsolete; Atlas discovery no longer has a Camera-backfill setting.
2. Sent SIGTERM to the Image.direct Python process verified as the sole listener on `127.0.0.1:8001`. It exited cleanly and the port is closed. No force-kill was used.
3. Enabled and bootstrapped `com.fanmass.supervisor` using launchd. MongoDB and Ollama came up, then the web and detection worker. Startup took about two minutes as MongoDB initialized and models/modules warmed.
4. Verified Fanmass `/api/health` returned `status=ok`, MongoDB connected, and vision/semantic/full/analytics capabilities ready; the live supervisor file reported `running`, `webHealthy=true`, MongoDB/Ollama ready, and a fresh worker heartbeat. The local model slot is now assigned to Fanmass; Image.direct's inference listener remains stopped.

Remaining before production: bring the Fanmass checkout to the agreed release; protect disk headroom (it fluctuated from 9.9 GiB to 15 GiB free during this startup); validate the actual Camera/Messmass credentials and event scope; decide whether ordinary incremental Google Drive polling should also be paused; add a Fanmass API key only if needed for protected operator/API access; and implement the mutual-exclusion controller below. Do not delete uploads, database records, or model caches to recover space without a retention and backup decision.

### 2.4 One-at-a-time local model coordination — required design

Image.direct and Fanmass must request an exclusive **host-level model slot** from a small local coordinator instead of starting, stopping or force-killing each other. The coordinator is a local operational control plane only; it does not change Messmass, Camera or Fanmass business ownership, and it must never be reachable from the public network.

| Control | Required behavior |
|---|---|
| Lease and state | Persist one lease with owner (`fanmass` or `image.direct`), requested model/runtime, lease ID, PID/service identity, heartbeat, acquisition time and expiry. States: `idle → requested → draining → unloading → starting → ready`; failures transition to `failed` and require a verified cleanup before another owner starts. Use an OS file lock plus an atomic state record so simultaneous requests cannot both win. |
| Graceful handoff | Stop new inference claims for the current owner; let the current request finish or checkpoint it; drain queued work back to a durable queue; unload the model and stop its inference process; verify process, listener and model state are gone; then check available memory and disk before granting the next lease. Never preempt a generation in flight and never kill another project's PID based only on a port or process-name match. |
| Launch ownership | Put Image.direct's current manual `uv`/Python service under a documented launchd lifecycle (or a single small local supervisor). Make Fanmass's existing launchd supervisor honor the lease: when it does not own the slot, keep web/database available if safe but pause the detection worker and prevent automatic model reload/respawn. Only the coordinator starts/stops each project's inference child. |
| Recovery and fairness | Lease heartbeat and TTL detect abandoned owners after a crash, but expiry alone does not authorize a new model load. The coordinator first verifies the old process is dead and model unloaded. Queue requests FIFO by default, allow bounded priority for a live event window, and publish the next owner/estimated wait. Keep the Camera work queue durable during Fanmass idle periods. |
| Safety limits | Gate acquisition on measured macOS memory pressure, minimum free disk, required runtime health and a configured reserve. Image.direct currently reports `memoryPressure=unknown`, so add real host/unified-memory telemetry before tuning thresholds. Fail closed on unknown or stale lease state; emit operator-visible reason and recovery steps. |
| Operations and audit | Provide `status`, `request-start`, `request-stop`, `handoff`, and `recover` operations with authenticated local operator access, structured logs, one request/lease correlation ID, and alerts for stale heartbeat, failed unload, crash loop, queue age and disk threshold. Do not expose model endpoints or secrets on a public interface. |

Implement this after the business contract and before automated alternating schedules. Until then, use the manual sequence: drain/stop Image.direct, verify port 8001 and its model are released, start Fanmass, verify its live health and worker; to switch back, pause Fanmass claims, stop/unload its worker model cleanly, verify the slot is free, then start Image.direct. Do not run both inference workloads concurrently on this Mac.

## 3. Historical architecture baseline — revised by the current contract above

### 3.1 Connections described by the original staged design

- Messmass provisions organizations, partners and events into Camera through its internal APIs and receives Camera event-level counters.
- Camera writes captures, consent/identity, retention and vetting state to its own Atlas source database. It has no Fanmass image-feed or analysis callback route in the staged design.
- Fanmass initiates a least-privilege Atlas connection: read-only on Camera's source database and read/write only on Fanmass's pipeline database. It independently discovers, validates, queues and analyzes eligible photos.
- Fanmass sends one normalized, identity-free result per Camera photo to Messmass through the authenticated integration. Messmass stores the per-photo record and builds event aggregates; guest contact data is excluded.
- Fanmass's local analysis engine is serialized for this Camera queue: one durable source-photo item under one global Atlas lease at a time.

### 3.1.1 Source surfaces reviewed for the original audit

| Repository | Current implementation/doc surfaces |
|---|---|
| Camera | submission capture/admin/retention routes; `lib/photo-vetting/*`; `lib/submissions/visibility.ts`; `docs/MESSMASS_FANMASS_INTEGRATION.md`; `docs/AUTHORIZATION.md`; `docs/PRIVACY_DATA.md`; generated endpoint inventory. The obsolete HTTP feed is not the Fanmass source path. |
| Messmass | `lib/fanmassPhotoAnalyses.ts`; `lib/aiAnalysisSummary.ts`; AI Analytics pages and photo-result APIs; API reference and Fanmass guide. Retired event-level write routes return `410 Gone`. |
| Fanmass | `config.py`; `services/camera_atlas.py`; `services/camera_sync.py`; `services/camera_analysis_sync.py`; `services/messmass_integration.py`; `services/background_jobs.py`; `workers/detection_worker.py`; Atlas queue contract and runbook. The former `services/camera_client.py` is removed. |

This describes the original audit snapshot, not a current production access audit. See the current guide and release verification above for shipped behavior.

### 3.2 Selfie-to-analysis path in the original proposal

1. Camera saves its capture and records consent, identity, retention, and publication/vetting state. A capture without an identity is excluded from vetting and Fanmass analysis, then erased under Camera's 24-hour rule.
2. Fanmass independently observes Camera Atlas changes and performs recurring bounded scans. It receives a narrow projection; identity is evaluated in Atlas as a boolean, so contact values do not cross into Fanmass.
3. Fanmass creates or reconciles one durable queue record per source Mongo `_id`, independent of event associations. It rechecks the source before download and before saving results.
4. Fanmass obtains one global Atlas lease, downloads/stages one eligible source image, runs the full local analysis, stores normalized output and people/face boxes in Fanmass-owned Atlas, and only then releases that work item.
5. Fanmass sends one photo result or tombstone to Messmass. Messmass stores the result and derives the event summary. Source deletion, lost consent, erasure or lost eligibility removes the Fanmass result and queues deletion of local image-derived material.

Camera has no Fanmass scheduler, queue, image transfer, analysis callback or AI state to keep synchronized. Discovery and analysis continue or recover independently from Camera's normal source records.

### 3.3 Human and AI authority — current boundary and future correction work

The source contains distinct annotation stores:

- Camera’s reviewer data is stored on the submission, including people, people-review metadata and rejection reasons.
- Fanmass’s per-image analysis is stored in its batch/image records and, for Camera-source images, in the durable Fanmass-owned Atlas result record. Fanmass feedback remains separate from Camera’s publication/vetting history.
- Messmass stores Fanmass's versioned per-photo results and boxes, and derives event/report values from them. The result record is not a shared human-review record with Camera.

There is still no shared human-correction protocol or correction UI across the apps. Camera's publication decision and annotations remain Camera-owned; Fanmass's AI output remains Fanmass-owned; Messmass stores the returned per-photo result. The integration does not silently overwrite Camera vetting/annotations with Fanmass output.

### 3.3.1 Required event workflow: Camera publication first, Fanmass discovery second

Model event policy with two independent concerns: **whether human vetting gates publication** and **whether an eligible photo is due for Fanmass analysis**. Camera never schedules or transmits that analysis. Fanmass discovers eligible records from Atlas after Camera publication and consent rules are satisfied.

| Event mode | Human publication rule | Analysis workflow |
|---|---|---|
| Vetting required | Photo stays private until a human approves it. | Camera completes its own human decision first. Fanmass independently discovers only eligible, approved submissions from Atlas. There is no pre-vetting analysis, Camera queue or callback. |
| Vetting required; analysis happens later | Photo stays private until a human approves it. | Fanmass independently discovers the eligible, approved photo from Atlas and handles it in its own queue. Camera remains uninvolved. |
| Vetting not required | No human moderation is required before publication; apply consent, identity, retention and other configured publication rules normally. | Fanmass independently discovers each otherwise eligible submission from Atlas. There is no hidden moderation step or Camera queue. |

Analysis remains a separate event deliverable. `vettingRequired` controls Camera publication only; it does not start or stop Fanmass. With vetting enabled, Fanmass can discover a photo only after approval. With vetting disabled, every photo that meets the consent, identity, retention and publication rules is eligible. Fanmass exposes per-photo states `not_eligible`, `queued`, `running`, `complete`, `failed`, and `withdrawn`; an event-level analysis opt-out, if needed later, must be a separate owner-approved policy.

Camera owns the submission and consent receipts. Required terms/privacy consent, optional marketing opt-in, permission to analyze for the event/report, and any future model-training purpose are distinct purposes and records. The optional marketing selection must never block capture or be treated as AI-analysis/model-training permission. Fanmass reads only the minimum eligible source projection and approved photo through Atlas; it does not receive guest contact or social-login identity. Messmass gets per-photo analysis results and derived event report values, not attendee contact data.

### 3.4 Rights, reports and link-based clickers

The access models are useful but are not interchangeable:

- Messmass authenticated roles are guest, user, admin, superadmin and api; the API role is read-only in the role table. “Editor” and “clicker” access is primarily an event-editor capability, not a global SSO role.
- A Messmass event report’s view slug is a read-only share link and can be public by design. An event edit slug is a separate write-capability link: the holder can change the permitted event-editor fields, including stats/clicker counters, subject to the current page-access/password rules. A password-protected editor grant is distinct from a public report URL.
- A capability URL is a bearer credential: anyone who receives or copies it can exercise the link’s permitted rights until the capability is invalidated. It identifies possession of a link, not a verified staff member or an authenticated person.
- Camera has global roles and partner-scoped Events access. The event vetting route currently accepts a partner Events manager; there is no reviewer-only assignment in the authorization matrix reviewed.
- Fanmass has its own local operator and API-key boundary. A Fanmass API key is not a Messmass/Camera human role and does not express a named event reviewer.

Keep public report sharing and low-friction clickers as valid product features. Do not reuse their slugs, passwords or page-access cookies for service-to-service API access. For staff operations, use the authenticated partner/event assignment. For a clicker link, retain the narrow editor field allowlist and add explicit link revocation/expiry expectations, access logging that does not record the secret itself, and a way to rotate a compromised link. For a vetter, grant only review and annotation actions on assigned events. These distinctions should appear in the admin UI and onboarding language so a shared link is never mistaken for staff identity.

## 4. Baseline findings and updated disposition

The findings below were recorded against the 2026-10-18 HTTP-feed baseline. The owner replaced that design on 2026-10-20 with Fanmass-owned Atlas discovery. Treat old feed/cursor findings as historical unless the disposition says they remain open; the current implementation contract is [Fanmass's Atlas queue contract](https://github.com/moldovancsaba/fanmass/blob/main/docs/CAMERA_ATLAS_QUEUE_CONTRACT.md).

### P0 — Timestamp feed could lose media — retired

Fanmass advances its cursor to the largest timestamp it successfully fetched. If an earlier media download fails but a later one succeeds in the same poll, the cursor can move beyond the failed image. The next poll will not request that earlier timestamp again. The comment in the code says the failed item will retry, but that is not true in that case.

There is a second cursor risk: Camera filters with a strict “availableAt greater than since” comparison and sorts only by availableAt. If more records share the cursor timestamp than fit in a response, advancing to that timestamp can skip the rest. The response does not contain a stable tie-breaker or a continuation token.

**Disposition (2026-10-20):** the HTTP cursor design is retired. Fanmass discovers source records directly, keys work by Camera submission Mongo `_id`, and uses a durable one-photo queue with retries and reconciliation. See the current Fanmass contract; the obsolete cursor is not part of the production workflow.

### P0 — Pre-vetting image access — rejected by the owner

The former feed exposed storage URLs for eligible records and withheld waiting/rejected photos. That HTTP feed is retired.

**Disposition (2026-10-20):** no pre-vetting image path is used. Camera records consent, identity and the human publication decision first; Fanmass reads only eligible records through Atlas. Contact details are excluded from the source projection.

### P0 — Per-photo analysis result — delivered; correction loop remains open

The original integration exported batch/event summaries. It did not provide a per-photo result record.

**Disposition (2026-10-20):** one-photo results are stored in Messmass under the exact Messmass event ID and Camera partner/event/photo IDs. Results include summary, structured analysis, boxes, source revision and generation. Event reports are mechanically derived from photo rows. Camera callbacks remain absent. A shared human-correction protocol and correction UI remain future work; they must not make Camera an analysis-queue owner.

### P0 — Human annotation authority across apps — still open for future correction UX

Camera’s human labels and Fanmass’s AI output are separate datasets. Messmass now stores the returned per-photo result and derives event reports from it. There is still no human-correction editor or shared correction-revision protocol; do not treat aggregate reporting as a correction workflow.

**Disposition:** Camera owns human publication decisions; Fanmass owns AI output. No correction callback or shared annotation editor is part of the current Atlas discovery contract. If human AI corrections are later added in another app, persist the authoritative correction through a separately designed Camera-owned record/contract, not through an analysis callback.

### P1 — Role permissions are broader or differently shaped than the workflow needs

- Camera event-level Vetting currently requires a partner-scoped Events manager or a global administrator. That role can create and update within the Events scope; it is broader than a vetting-only assignment.
- Messmass’s authenticated account roles are not equivalent to Camera partner roles. Messmass also has public report URLs and link/password-based editor capabilities.
- A public report view slug is read-only. An event editor link can act as a write capability, limited to editor fields; it should be handled like a bearer credential, not described as an authenticated named user.
- Current service integrations use shared secrets/API tokens. These establish that a caller knows a secret, but do not by themselves express per-event, per-action scopes or an operator identity.

**Required fix:** publish a permission matrix across all apps. Add a Camera reviewer/vetter grant scoped to partner/event with only photo review and annotation permissions. Keep edit, event configuration, delete, report administration and user management separate. Service identities should have route/action and event scopes. Treat report links and clicker/editor links as separate capability credentials with explicit scope, revocation and optional expiry.

### P1 — Fanmass feedback is not the same as model retraining

Fanmass stores user feedback and persists confirmed visual teaching templates. The current review workflow can reanalyse images using those templates. This is a meaningful feedback loop, but it is not evidence that model weights are automatically fine-tuned. The persistent global memory currently allows sports jersey, fashion brand, poster face and crowd face memories (plus negative examples); search labels matches as global memory and the shown lookup path does not filter by partner/event. This can transfer one client’s confirmed teaching into another client’s analysis, including face crops/embeddings. The code does not by itself establish whether those face templates represent attendees, public figures on posters or another category, so define and enforce that boundary before connecting the live Camera queue.

**Required fix:** start with scoped learning: event-local, then partner-local if explicitly enabled. Make cross-partner reuse opt-in and limited to curated public entities such as a sponsor logo or team mark. Never put attendee faces, face embeddings, names, ages, apparent gender or emotion into a shared global memory. No identity matching across user submissions. Do not train model weights directly from one click; first version feedback, retain provenance, run holdout evaluation and require an explicit promotion decision with rollback.

### P1 — Consent, purpose and image retention must be validated before production Atlas discovery

Camera’s data inventory says waiting/rejected images remain in the private pending store, while approved originals are copied to ImgBB and become publicly addressable. It also says the planned 90-day ImgBB deletion is not yet automated. The AI-training-purpose document remains a draft and says no labeled-photo training export should occur until legal confirms that the accepted terms cover it. Camera’s inventory says annotations are not exported or used to train anything.

Event analysis and model training are separate purposes. An image being available to Fanmass after Camera has approved it does not establish permission to retain it for future model training.

**Release gate:** before production Atlas discovery, confirm controller/processor roles, event-analysis purpose, guest notice, retention/deletion, subprocessors, data location and withdrawal handling. Legal/DPO review must separately decide whether future training reuse is permitted. The queue does not enable model training. A deletion or withdrawal must propagate to Camera, Fanmass source image, derived crops, embeddings/templates, cached files and queued jobs as applicable. Do not assume deletion of trained weights is possible; describe the actual training policy honestly.

### P1 — Photo analytics and subject attributes need clear limits

Fanmass and Camera work with photos of real attendees, including children. Current labels can include apparent age group, gender, expression/emotion, clothing and brand. These are model/reviewer interpretations of a photo, not verified facts about a person.

**Required fix:** label outputs as estimates, retain “unknown/unsure” and abstention states, never use inferred attributes to identify a guest, determine eligibility, rank individuals or make consequential decisions. Keep person-level data out of Messmass by default. Review whether “emotion” is necessary at all; if retained, make it low-stakes, optional, visibly uncertain and human-correctable, and assess EU AI Act transparency/application with counsel. GDPR treats photos as personal data; photos are not automatically special-category biometric data, but biometric data is covered when processed with specific technical means for unique identification. A DPIA may be required if the planned processing is likely to create high risk.

### P1 — Code comments and documentation drift

The audit found concrete documentation mismatches:

| Location | Mismatch | Disposition |
| Fanmass legacy services/camera_client.py and Camera media feed | Described the former HTTP feed and public URL transport. | Retired; Fanmass discovers eligible photos through Atlas. |
| Camera media route | Former image feed exposed storage URLs to Fanmass. | Not used for this flow; Fanmass reads the eligible source projection from Atlas. |
| Fanmass legacy timestamp cursor | Could skip failed or same-timestamp photos. | Replaced by one queue record per source Mongo `_id`, durable retries, change streams and bounded reconciliation. |
| Fanmass Atlas queue and result | Queue/result records and lease behavior need a stable, versioned contract. | Implemented in Fanmass main and documented in `docs/CAMERA_ATLAS_QUEUE_CONTRACT.md`; Messmass has stored per-photo results. |
| Camera AI training draft and privacy inventory | Training draft describes a future possible labeled-photo use; privacy inventory currently says no export/training and the draft is unapproved. | Keep these statements synchronized; no training export until approval and the workflow is implemented. |
| Messmass integration delivery plan | Describes the original Messmass–Fanmass MVP and says it is delivered. | Keep it as historical baseline; link this new plan as follow-up work instead of reopening old MVP issues. |
| Fleet architecture audit | Contains dated operational notes that Fanmass was paused and a Fanmass key was unset. | Re-verify runtime facts before rollout and stamp each cross-app edge with current source SHAs after implementation. |

All current integration comments should state data ownership, direction, authorization, PII/image scope, idempotency/retry semantics and contract version. Retired HTTP-feed findings above are historical; they must not be restated as current implementation gaps.

## 5. Current transport and future contract extensions

The API/event recommendations in the original 2026-10-18 draft assumed a Camera-produced work API. The owner rejected that boundary on 2026-10-20. The current transport is the Atlas contract below; proposed Camera claim/fetch/ack APIs are not implementation tasks.

### 5.1 Current transport

Camera writes source event/submission records and owns consent, identity, retention and human vetting. It does not call Fanmass or create analysis work. Fanmass reads a minimal Camera Atlas projection using a read-only source role; Atlas computes an identity boolean so contact fields do not cross the boundary. Fanmass writes queue, lease, retry, result and privacy-cleanup state only into its separate pipeline database. Change streams accelerate discovery; bounded scans and reconciliation provide recovery. A global Atlas lease permits one source photo at a time. Fanmass delivers one photo result or tombstone to Messmass through the authenticated per-photo endpoint.

The Fanmass operator contract is authenticated `GET /api/integrations/camera/atlas-queue` and per-photo `POST /api/integrations/camera/atlas-queue/retry/{queueKey}`. Neither route accepts images from Camera. Fanmass's result endpoint delivers one photo result to Messmass; see the API reference for the exact route and schema.

### 5.2 Future per-photo correction, if approved

Any future correction record should include contract version, stable photo/event IDs, analysis and review revisions, idempotency/correlation metadata, schema/taxonomy/model provenance and normalized findings. It must not include guest identity or raw consent text. It must not turn Camera into Fanmass's queue producer or result callback receiver.

### 5.3 Resilience and authorization requirements

- Stable photo identity, durable queue state, one global lease, source-revision fences, bounded retries and visible terminal failures are implemented in Fanmass's merged Atlas contract. Change-stream resume tokens are backed by periodic bounded scans.
- Idempotency applies per source submission and source revision; event associations do not create extra queue jobs.
- Fanmass rechecks source eligibility before download and result persistence; operator replay reloads the source and revalidates it.
- Atlas permissions must be database-scoped: read-only on Camera and read/write on the Fanmass pipeline database. No Camera image or queue API is exposed for Fanmass.
- Camera→Fanmass photo access is governed by a least-privilege Atlas database role, not an HTTP service credential: read Camera source collections only; write Fanmass pipeline collections only.
- Keep Camera↔Messmass provisioning credentials and Fanmass→Messmass reporting credentials distinct, independently rotated, and unavailable to browsers or image hosts. Treat them as machine credentials, not human authentication.
- The Fanmass fetcher enforces allowed storage hosts, response limits, supported image types and timeouts; it does not accept arbitrary URLs from a client. The global lease and one-item local worker provide backpressure.
- Redact tokens, signed URLs, emails, image bytes, face coordinates and raw model prompts from logs. Record event ID, submission ID where permitted, service identity, contract version, action, status, duration, retry count and correlation ID.

## 6. AI quality, learning and human review policy

### 6.1 Output semantics

Keep model output distinct from human truth:

- Store AI proposals separately from the reviewer’s final confirmed labels.
- Store per-field confidence/uncertainty rather than one misleading photo confidence.
- Use “unknown / not visible / not sure / not assessed” as distinct states where relevant.
- Include model version, prompt/version, taxonomy version, processing time, image dimensions/quality indicators and the run ID.
- Never convert a low confidence into a negative finding. “No brand detected” must be distinguishable from “brand module failed” and “brand not checked.”
- Show the reviewer why an item is flagged, what the model saw, confidence and whether the item is missing or uncertain. The reviewer can override everything with an auditable reason.
- Store corrections as review revisions. Preserve prior model output and human correction history; do not make “latest” erase the source evidence.

### 6.2 Human authority

- Human review decides publish/reject. AI contributes suggestions and risk flags only.
- AI risk flags should call out uncertain or potentially inconsistent evidence, not label a guest as a bad actor.
- A reviewer must be able to approve, reject, correct, mark no person, and leave analysis pending if Fanmass is offline.
- Review must remain usable if analysis is slow or unavailable. Capture and moderation never wait on the local AI worker.
- The UI must distinguish “AI suggestion,” “human confirmed,” and “not assessed,” and show the reviewer, timestamp and revision.

### 6.3 Learning safely

Use “aggressive learning” to mean promptly capture reviewer corrections, re-run affected analyses and improve measured quality—not automatic global training from every interaction.

Stages:

1. Save human corrections with source, reviewer role, event/partner scope, taxonomy/model version and correction time.
2. Re-run the same image to measure whether the correction improves the output.
3. Reuse confirmed visual examples only in the same event or partner by default.
4. Create a curated, consent-eligible training/evaluation set only after documented purpose approval, retention, withdrawal and child-photo rules.
5. Evaluate a candidate model on a versioned holdout set. Compare per-label precision, recall, false-positive/false-negative rates, abstention, calibration, subgroup/conditions and human agreement.
6. Promote only after thresholds are approved and the owner can roll back to a prior model/taxonomy version.
7. Keep an audit of what examples, schemas, settings and code created each model version. Provide a deletion/withdrawal procedure for source examples, derived crops/memories and eligible training records.

### 6.4 Evaluation for live photo conditions

Build a reviewed gold set that is event/venue diverse and split by event, not random near-duplicate photos, to prevent leakage. Measure independently for:

- people count and face/person detection;
- brand/team/club/jersey/logo recall and false detections;
- age-band and apparent-expression labels, if retained;
- moderation flags and structured rejection reason suggestions;
- incomplete/partial/failed/low-quality images and abstention;
- dark/light conditions, distance, occlusion, crowd density, camera angle, motion blur and phone/crop differences.

Report precision/recall and confidence calibration per label. Include the human reviewer's correction rate and time saved, not only model accuracy. NIST’s demographic findings are for face-recognition tasks; they do not measure Fanmass’s classifiers, but reinforce the need to test the actual model and task under representative image conditions rather than generalize from one aggregate score.

## 7. Research and standards applied

These standards and guidance inform the plan; they do not certify the apps or replace legal review.

| Source | Application to this project |
|---|---|
| [GDPR, especially Articles 5, 25, 32 and 35](https://eur-lex.europa.eu/eli/reg/2016/679/oj) | Purpose limitation, minimisation, accuracy, privacy by design/default, security, and DPIA when processing is likely to create high risk. GDPR recital 51 says ordinary photographs are not automatically special-category biometric data; Article 4(14) ties biometric data to specific technical processing enabling unique identification. |
| [EU AI Act Article 50](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-50) | Assess transparency duties if the system qualifies as emotion recognition or biometric categorisation. Counsel must classify the intended system and its audience before launch. |
| [EU AI Act Article 5](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-5) and [Recital 44](https://ai-act-service-desk.ec.europa.eu/en/ai-act/recital-44) | Article 5 includes a prohibition on emotion inference in workplace and educational settings, with limited exceptions; the official recital also highlights scientific-basis, reliability, generalisability and rights concerns. Do not infer a blanket ban on fan-event imagery; assess staff/volunteer use and product purpose carefully. |
| [NIST AI RMF Core](https://airc.nist.gov/airmf-resources/airmf/5-sec-core/) | Structure governance, mapping, measurement and management continuously across the AI lifecycle. It is a voluntary risk framework, not a certification. |
| [ISO/IEC 42001:2023](https://committee.iso.org/cms/live/live/en/sites/isoorg/contents/data/standard/08/12/81230.html) | Reference for an organization-wide AI management system: accountability, lifecycle process, risk review and continual improvement. |
| [NIST FRTE demographic evaluation](https://pages.nist.gov/frvt/html/frvt_demographics.html) | Evidence that face-recognition performance can differ by algorithm, data and image conditions. This is not a direct benchmark for Fanmass, so the correct action is to evaluate Fanmass on its actual tasks and images. |
| [OWASP API Security Top 10](https://api-security.owasp.org/editions/2023/en/0x11-t10/) | Prioritize broken object-level and function-level authorization, property-level exposure, unsafe API consumption, resource abuse and API inventory. Every event and submission ID must be checked against the caller’s scope. |
| [IETF RFC 9700, OAuth 2.0 Security BCP](https://datatracker.ietf.org/doc/html/rfc9700) | Reference for modern OAuth security when replacing or hardening shared static integration credentials. |
| [OpenAPI 3.1.2](https://spec.openapis.org/oas/v3.1) | Machine-readable API schemas, request/response/error descriptions and contract validation to reduce guesswork across TypeScript and Python clients. |
| [CloudEvents](https://cloudevents.io/) | Standard event envelope for portable event metadata and correlation across systems. It does not provide queue delivery or retries by itself; the durable lease/ack mechanism remains an application responsibility. |

## 8. Issue-ready delivery breakdown

The IDs below are **plan identifiers**, not GitHub issue numbers. The old Messmass–Fanmass MVP issues (Messmass #78–83 and Fanmass #48–53) remain closed historical work and should not be reopened. Recommended ownership follows the existing boards: Messmass Project #8, Camera Project #24, Fanmass Project #27. Every issue should link back to this document and its cross-repository dependencies.

### CF-01 — Define cross-app authority, data purpose and versioned contracts

**Lead:** Messmass; contributors: Camera, Fanmass
**Priority:** P0, blocks production Atlas discovery
**Scope:** Record the accepted ownership, eligibility and status contracts across repositories, including source photo identity, Atlas projections/permissions, lease and retry semantics, result schema, aggregate mapping, privacy cleanup and operational failure states. Keep code, docs and generated API inventories aligned.

**Acceptance criteria**

- The contracts define event/submission/partner/Messmass mapping IDs, analysis revision, source/model/taxonomy versions, timestamps, idempotency, correlation and bounded failure states.
- Camera review status, AI status and purpose/retention status are separate.
- Event policy has an independent `vettingRequired` publication gate. Camera publication state determines Fanmass eligibility; Fanmass analysis timing is queue-owned and is not an event setting controlled by Camera. “No vetting” publishes without moderation, subject to consent, identity and deletion rules.
- Required privacy/terms acceptance, optional marketing opt-in, event-analysis permission and any future training permission are distinct. Marketing opt-in is never a gate for the capture flow and is not reused as AI/training consent.
- The exact fields prohibited from Fanmass/Messmass (guest email, social identity, session token, full consent text, raw IP/device fingerprint) are documented.
- Data controller/processor assumptions, allowed purpose, notice, transfer, retention, deletion and child-photo rules are reviewed by the owner’s legal/DPO contact.
- A permission matrix separates human reviewer, event editor, event manager, admin and service identities.
- Current Atlas and aggregate API shapes are recorded as compatibility contracts; retired Camera image-feed APIs are not reinstated.

### CF-02 — Camera source privacy and eligibility contract

**Lead:** Camera  
**Priority:** P0  
**Depends on:** CF-01  
**Scope:** On a submission, persist identity, consent, retention and publication state consistently. Camera must not create Fanmass analysis jobs or expose a feed. Preserve Camera's separate typed-contact and approval/rejection email outbox: store the address before accepting the submission, never use `anonymous@event` as a recipient, and track actual provider outcomes.

**Acceptance criteria**

- A submission creates no Fanmass job and makes no outbound Fanmass request.
- A capture without identity is excluded from vetting/publication/AI and is erased on the configured 24-hour policy; races and cleanup retries are covered.
- Fanmass Atlas projection exposes no guest contact or social identity; Atlas role scope is documented and verified before production enablement.
- A typed email remains Camera-owned and survives capture, social-login differences, vetting, and admin display without being copied into Fanmass or Messmass.

### CF-03 — Fanmass-owned Atlas discovery and one-photo queue

**Lead:** Fanmass  
**Priority:** P0  
**Depends on:** CF-01, CF-02  
**Scope:** Fanmass independently discovers eligible Camera records through Atlas; Camera does not produce or acknowledge queue work. Use change streams for speed and repeatable bounded census/reconciliation for recovery. Persist one job per source Mongo `_id` in the separate Fanmass pipeline database.

**Acceptance criteria**

- A unique queue record exists per source submission `_id`, independent of event associations.
- One Fanmass-owned global Atlas lease permits at most one Camera-source photo to be active at a time; a second claim cannot start until the first analysis is durably saved or cancelled.
- A failure of one photo cannot advance past or hide it; retryable and permanent failures remain visible and distinguishable.
- Expired leases recover after worker failure, while generation/token fences prevent stale workers from publishing.
- Bounded source, queue, event and result reconciliation resumes after restart and accounts for each eligible source as queued, active, complete, failed, excluded or privacy-cleaned.
- Bootstrap scope, queue age, discovery health and terminal failures are visible to operators. Event links never create duplicate analysis jobs.

### CF-04 — Fanmass per-photo analysis result and provenance contract

**Lead:** Fanmass  
**Priority:** P0  
**Depends on:** CF-01, CF-03  
**Scope:** Persist one complete, versioned per-photo analysis result in Fanmass-owned Atlas, including people count, normalized people/face regions, approved attribute modules, quality signals and provenance. Keep batch/event analytics as derived aggregates. Do not add a Camera result callback.

**Acceptance criteria**

- Every output maps to Camera submission ID and includes Fanmass batch/image/run IDs.
- Every analyzed module has status: complete, partial, not assessed, unavailable or failed; absence is not silently treated as a negative.
- Findings preserve model-vs-human source, per-field confidence, abstention and taxonomy version.
- Image parsing, file size and MIME checks are enforced; arbitrary URLs cannot be fetched.
- Results are idempotent per analysis revision; old results cannot replace newer results.
- A replay of the same submission and same model/config revision produces an auditable result without duplicate rows.

### CF-05 — Future Fanmass analysis review UI, if approved

**Lead:** Fanmass
**Priority:** P1
**Depends on:** CF-03, CF-04, CF-09
**Scope:** If later approved, build an authorized review surface for Fanmass-owned output. Camera remains responsible for human publication decisions and is not an AI queue, result, or correction owner. Show people count, regions, person/brand/item findings, uncertainty and provenance using the original source image, never a generated frame.

**Acceptance criteria**

- The UI clearly labels AI suggestions and human-confirmed values; it shows model/revision and timestamp.
- Reviewers can correct, add, remove or mark unsure without losing the original AI output or earlier human revisions.
- Camera approve/reject remains independent while analysis is pending/failed; the AI never changes publication status.
- A stale suggestion cannot overwrite a later reviewer edit.
- The page works on mobile and desktop, supports keyboard/accessibility, and displays degraded/offline states without blocking vetting.
- The reviewer can see why something was flagged and can leave a correction reason where operationally useful.
- The Fanmass Analyse worklist includes only Camera-published, consented, identified, otherwise eligible photos; it does not create a hidden moderation gate.
- Analyzed-photo cards show the analyzed people count and analysis completion/provenance. Analysis opens the original without a frame overlay; missing/unknown analysis is explicit, not shown as zero people.

### CF-06 — Future Fanmass analysis corrections and review revisions, if approved

**Lead:** Fanmass
**Priority:** P1  
**Depends on:** CF-01, CF-05  
**Scope:** Keep Fanmass AI output immutable and store human analysis corrections as append-only Fanmass-owned revisions. This future review workflow must not send work/results through Camera or let AI corrections change Camera publication decisions. Consent withdrawal and deletion continue to be detected from Camera Atlas and handled through Fanmass privacy cleanup.

**Acceptance criteria**

- Each save records reviewer identity/role, time, schema version, prior revision and current revision.
- Each correction records reviewer identity/role, time, schema/model/taxonomy version, prior revision, current revision and reason.
- Corrections never mutate Camera’s publication decision.
- The original AI result and every human revision remain inspectable; a later model run cannot overwrite a human revision.
- Deletion/withdrawal invalidates queued correction work and removes Fanmass-owned derivatives through the privacy-cleanup process.

### CF-07 — Fanmass scoped learning, correction application and quality gates

**Lead:** Fanmass  
**Priority:** P1  
**Depends on:** CF-01, CF-06  
**Scope:** Ingest corrections, distinguish per-image review corrections from reusable teaching, scope memory by event/partner, add provenance/retention and establish an evaluation/promotion loop.

**Acceptance criteria**

- No attendee face/person representation is searched across unrelated events or partners by default.
- Partner/event scope is enforced in memory lookup and persisted templates; global memory is disabled for personal attributes and attendee identity.
- Human corrections can trigger targeted reanalysis and update event-local suggestions without training model weights.
- Weight/model changes require a separately versioned candidate, holdout evaluation, explicit promotion and rollback.
- Evaluations report per-task precision/recall, error and abstention measures, uncertainty/calibration and condition/subgroup slices where lawful and statistically supportable.
- Source records, crops, embeddings and training/evaluation copies have documented deletion/withdrawal paths and audit history.

### CF-08 — Messmass event mapping, aggregate/report read model and sync health

**Lead:** Messmass  
**Priority:** P1  
**Depends on:** CF-01, CF-04  
**Scope:** Keep the existing Camera and Fanmass namespaces separate. Add the limited operational/aggregate fields needed for reports and event overview without importing photo-level PII or treating AI suggestions as human outcomes.

**Acceptance criteria**

- Camera review counts, Fanmass analyzed-photo counts, AI people/brand estimates and human-confirmed counts remain separately named and source-attributed.
- Full lifecycle totals retain approved, rejected, automatically deleted (for example, no login by the configured deadline) and manually deleted counts even when the image bytes are gone. Rejection-reason percentages use a visible denominator and reason mapping; deleted photos are not silently dropped from historical analytics.
- Event analytics define approved/rejected totals, rejection reasons, average capture-flow duration, CTA clicks, Google/Facebook/Pseudo login mix, and new-versus-returning users with explicit denominators, identity rules, time windows and privacy-safe aggregation.
- Sync health includes last success, queue/backlog age, failed/dead-letter count, last error class and contract version.
- Report formulas can choose measured vs projected and AI vs human-confirmed values explicitly.
- Manual/clicker metrics remain untouched.
- Event mapping is explicit and reports do not silently fall back to a different event ID if the link is missing.

### CF-09 — Cross-app access and service identity hardening

**Lead:** Messmass; implementation in each app  
**Priority:** P1  
**Depends on:** CF-01  
**Scope:** Map SSO users and partner grants to least-privilege Camera reviewer/admin actions and service-to-service event scopes. Review link-based report and clicker/editor capabilities as separate controls.

**Acceptance criteria**

- A vetter can review/annotate assigned event photos without gaining event editing, delete, frame, user-management or partner-admin rights.
- Every API call checks both function and event/submission object access.
- Machine identities are distinct per app pair and call direction, and do not reuse guest, clicker or human SSO credentials.
- Credentials have owners, rotation/revocation steps, environment inventory and redacted logs.
- Public report view links are read-only; editor/clicker write links are treated as bearer credentials with narrow fields, revocation, expiry policy and clear UI wording.

### CF-10 — Data inventory, retention, observability and runbooks

**Lead:** Camera for photo lifecycle; Messmass for canonical fleet map; Fanmass for local worker and learning data  
**Priority:** P1  
**Depends on:** CF-01 through CF-09  
**Scope:** Update each app’s privacy/data inventory, integration docs, comments, incident and support runbooks, API reference, contract references and deployment/rollback instructions.

**Acceptance criteria**

- Every copy of an image or derived crop/embedding has a storage owner, purpose, access class, retention rule and deletion mechanism.
- Logs contain no image bytes, bearer credentials, raw email, signed image URL or unnecessary face/annotation content.
- Dashboards show intake lag, analysis latency, lease expiry/retries, per-event failures, mismatch counts, corrections/overrides and last aggregate sync.
- Alerting thresholds and a safe manual replay/reconciliation procedure are documented.
- All code comments describe actual behavior; docs are updated in the same PR as each contract/API change.
- Fleet map names current source SHAs and explicitly marks which production facts remain unverified.

### CF-12 — Exclusive local inference slot and graceful handoff

**Lead:** Fanmass local-runtime owner; contributors: Image.direct owner and Messmass operations
**Priority:** P1, blocks automated alternation and production scheduling
**Depends on:** CF-01, CF-09, Gate 0
**Scope:** Add a loopback-only host coordinator/lease for local inference. Make Fanmass's supervisor honor the lease and put Image.direct's currently manual service under a documented launchd lifecycle. Preserve durable Camera work while Fanmass does not own the local model slot.

**Acceptance criteria**

- At most one owner (`fanmass` or `image.direct`) holds the inference lease; simultaneous requests are serialized atomically and logged with a lease/correlation ID.
- Handoff stops new work, drains or checkpoints active inference, unloads the model, verifies process/listener/model release, checks memory pressure and disk reserve, then starts and health-checks the next owner.
- The coordinator never kills a process based only on a port/name match and never preempts an in-flight generation. Crash recovery verifies the prior owner is actually stopped before granting another lease.
- Fanmass can keep safe web/database functions alive while its analysis worker is paused for Image.direct; its supervisor does not respawn/reload the worker against an unheld lease.
- Requests wait in a visible FIFO queue with a bounded event-window priority policy; Camera submissions remain durable and show queue age while Fanmass is paused.
- Unknown memory-pressure telemetry, stale lease state, low disk reserve or failed model unload blocks the next start and provides a clear operator action.
- Operators have local authenticated status/start/stop/handoff/recover controls, health checks, alarms and a tested manual fallback. No coordinator endpoint is public.

### CF-11 — Shadow run, pilot and rollout

**Lead:** Cross-repository release owners  
**Priority:** P1, final gate  
**Depends on:** CF-01 through CF-10 and CF-12  
**Scope:** Run a limited event pilot with AI suggestions hidden or visibly advisory, compare against human decisions, then enable event-by-event.

**Acceptance criteria**

- Pilot is opt-in by event and has an owner, event window, fallback and rollback switch.
- No AI auto-moderation; Camera capture/vetting works during Fanmass outage.
- Reconciliation proves each eligible Camera submission is either pending, analyzed, intentionally excluded, deleted or in a visible error state.
- The owner reviews latency, queue reliability, privacy, reviewer overrides, classification quality and event report totals before expanding.
- A rollback returns to the current Camera-only vetting path without loss of review history or photo links.
- The retired Camera HTTP feed stays removed. Atlas census, durable queue state, and reconciliation prove source-to-result accounting before rollout expands.

## 9. Implementation tracking — reconciled 2026-10-20

| Work package | State | Evidence / remaining gate |
|---|---|---|
| Exact Messmass↔Camera event identity | **Done** | Camera PR #711 prevents cross-partner/reassignment races. Production reconciliation: 438/438 unique links, zero missing, duplicate, dangling, event-ID, or partner mismatches. |
| CF-01 — ownership and data contract | **Done** | Camera owns capture/vetting/identity/consent/retention; Fanmass owns Atlas discovery, one-photo queue and AI output; Messmass stores per-photo results and derives event reports. Current contract guide is linked above. |
| CF-02 — Camera eligibility and privacy boundary | **Implemented in the contract** | Ineligible/no-login photos are excluded; Fanmass does not receive guest identity or contact values. Continue to validate actual retention/deletion operations under Camera's own release controls. |
| CF-03 — Fanmass discovery and one-photo queue | **Merged** | Fanmass PR #121 keeps the Camera workflow photo-scoped: independent Atlas discovery, durable per-photo queue, one global active-photo lease, retry/reconciliation and privacy cleanup. Live queue latency/heartbeat is an operational check, not inferred from Messmass analytics. |
| CF-04 — per-photo result and boxes | **Merged and stored** | Messmass PR #495 accepts and validates one result per image with exact IDs, source revision, generation, summary, analysis and box arrays. Production cleanup retained 90 valid result records; all had routing IDs and boxes. |
| Messmass AI Analytics and report projections | **Deployed and reconciled** | Messmass PRs #495/#496 replaced misleading event-wide indicators with photo-derived results; 88 canonical definitions and 397 canonical materialized report fields remain. Seven event summaries were rebuilt from 90 retained results. |
| Obsolete analytics data | **Removed from active collections** | Archived 221 old summaries, 261 snapshots and 220 project-stat snapshots; replaced 90 legacy variable definitions. No obsolete event-link/rescan rows or legacy metric fields remain active. Recoverable archive copies remain. |
| CF-05/06 — analysis review/correction UX | **Open future work** | The current cards provide inspection evidence, not an edit/review or correction workflow. Camera publication/vetting remains separate; there is no shared correction callback. |
| CF-07 — scoped learning/evaluation | **Open future work** | No automatic training from reviewer activity or cross-partner personal recognition is enabled. Define consent, retention, evaluation and promotion before implementation. |
| CF-08 — report read model | **Photo-derived reporting done; operations extensions open** | Messmass reports from canonical per-photo records. Event completion/coverage is intentionally not inferred without an eligible-photo denominator. Queue-health/latency observability is separate from report data. |
| CF-09/10 — access, privacy, operations/docs | **Partly delivered** | The current contract, API reference and release records are updated. Keep service credential rotation, production role audit, deletion verification, worker alerts and operational runbooks current. |
| CF-12 — exclusive local inference slot | **Open** | The documented manual Fanmass/Image.direct handoff remains; an automated host-level mutual-exclusion coordinator is separate from this analytics contract. |
| CF-11 — pilot and operational acceptance | **Partly verified** | Production contains valid per-photo results and event/report mappings reconcile. Continue monitoring live queue discovery, single-photo serialization, retries and tombstones; do not infer those from event-report counts. |

## 10. Delivery order and remaining work

1. **Completed — event identity:** verify and enforce the exact one-to-one Messmass event ↔ Camera event relationship. The production audit found 438 valid unique links and no mismatch.
2. **Completed — one-photo boundary:** merge Fanmass's Atlas-owned discovery/queue and the versioned per-photo result contract. Fanmass processes a single eligible source photo at a time; Camera does not schedule, transfer, or call Fanmass.
3. **Completed — Messmass result store and reports:** validate the four routing IDs, persist each photo result and its boxes, then derive event summaries and report variables from active photo records.
4. **Completed — AI Analytics cleanup:** remove misleading coverage/progress/freshness/projection fields and obsolete active snapshots; retain valid photo results; rebuild the seven current summaries. A recoverable archive remains separate from active analytics.
5. **Next — live worker operations:** monitor Fanmass discovery heartbeat, one-photo lease, queue age, retries, failure states, source rechecks and tombstone delivery. Do not use Messmass report totals as a proxy for queue completion.
6. **Future — correction and learning:** decide and implement a separate human correction UI/revision protocol, then an evaluated and consent-governed learning loop. No AI result can change Camera's approve/reject decision.
7. **Future — host coordination:** implement the local Fanmass/Image.direct lease coordinator before automated switching or concurrent scheduling.

## 11. Operational checks and quality measures

The following are sustained-operation and future-quality checks. They do not mean that the merged one-photo result/report contract is still waiting to be built:

- Gate 0 passes on the designated local host, including health, worker heartbeat, disk reserve, backfill scope, the required outbound/inbound authentication checks and recovery checks;
- only one local inference owner holds the lease, and graceful handoff, crash recovery, low-disk/memory blocking and queue persistence have been demonstrated;
- event/submission eligibility is independently rechecked by Fanmass, and the Atlas role boundary is verified;
- Fanmass Atlas read access is verified to expose only the minimum source projection, and its write role cannot mutate Camera collections;
- the agreed purpose, guest notice, processor terms, retention and child-photo rules are approved;
- every job/result can be replayed without loss or duplicate analysis;
- deletion and withdrawal propagate to Fanmass derivatives;
- human vetting remains available during worker downtime;
- role-based reviewer access is narrower than event management;
- baseline AI evaluation and fallback thresholds are agreed.

Track these operational and quality measures by event and analysis revision:

- submission-to-discovery and submission-to-analysis-completion median/p95 latency;
- percentage of eligible photos accounted for in a terminal or visible queue state;
- queue age, retries, dead letters, missing-image fetches, duplicate jobs and reconciliation mismatches;
- reviewer override/correction rate by field and by confidence band;
- human/model agreement and adjudicated precision/recall per field;
- abstention, unavailable/failed modules and analysis staleness;
- time taken to vet, time taken to analyze, and reviewer throughput;
- deletion/withdrawal propagation time and residual-copy verification;
- aggregate sync freshness and difference between Camera counts, Fanmass records and Messmass report totals.

Do not use one composite “AI accuracy” number as the go-live decision.

## 12. Remaining product and legal decisions

The ownership and eligibility boundary was resolved by the owner on 2026-10-20: Camera does not send images or jobs to Fanmass. With vetting required, Fanmass discovers a photo only after Camera approves it. With vetting disabled, analysis still requires identity, consent, retention and publication eligibility. Waiting/rejected/private and no-identity photos are excluded. Remaining decisions are:

1. Are age, apparent gender and expression necessary for each event’s business purpose? Which fields are optional or removed?
2. Is reuse of human corrections limited to one event, one partner or a curated shared catalog? Recommendation: event/partner only by default; curated shared public entities require explicit promotion.
3. What is the retention period for Camera originals, Fanmass downloads, crops/embeddings, analysis outputs and training/evaluation data? The current Camera privacy inventory states that the planned ImgBB 90-day deletion is not automated.
4. Which identity provider/grant should secure the remaining Fanmass→Messmass reporting API, and who owns credential rotation/emergency revocation? Camera→Fanmass uses the database-scoped Atlas role.
5. Messmass currently stores per-photo results and boxes, then derives event report values. A permission-checked deep link from a Messmass result to the Camera original remains a separate product decision; do not copy guest email, login identity, or raw contact data into Messmass.

## 13. References

- Camera integration and data map: docs/MESSMASS_FANMASS_INTEGRATION.md, docs/PRIVACY_DATA.md, docs/ANALYTICS_DATA_DICTIONARY.md, docs/AI_TRAINING_PURPOSE_AND_CONSENT_DRAFT.md, docs/AUTHORIZATION.md.
- Messmass–Fanmass baseline: docs/operations/messmass-fanmass-integration-delivery-plan-2026-06-25.md; docs/_audit/fleet-architecture.md; lib/fanmassIntegration.ts; lib/cameraPhotoStats.ts.
- Fanmass processing and feedback: docs/current-implementation.md, docs/analytics-workflow.md, docs/RUNBOOK.md, docs/CAMERA_ATLAS_QUEUE_CONTRACT.md, services/camera_sync.py, services/camera_atlas.py, services/batch_review.py, services/memory_store.py.
- Legal/standards links are listed in Section 7. This plan is not legal advice or a claim of regulatory compliance.
