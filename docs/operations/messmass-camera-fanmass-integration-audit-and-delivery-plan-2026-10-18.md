# Messmass, Camera and Fanmass integration audit and delivery plan

**Date:** 2026-10-18
**Status:** Accepted for delivery on 2026-10-19; implementation is in review on paired Camera/Fanmass feature branches, with the cross-app audit and delivery order tracked in this document. These branches are not merged or deployed. Local runtime operations were completed 2026-10-18; no production configuration or data has been changed.
**Purpose:** Establish a reliable, privacy-aware integration for photo capture, human vetting, AI-assisted analysis, correction, learning and reporting.

## 1. Executive recommendation

Keep the three apps and make their boundaries explicit:

| System | Owns |
|---|---|
| **Messmass** | Organizations, partners, events, report templates, report access, report composition and cross-event reporting |
| **Camera** | Guest capture, contact details and consent receipts, original photo lifecycle, publication visibility, human vetting decision, human annotation and reviewer audit trail |
| **Fanmass** | AI analysis runs, model and prompt versions, confidence/uncertainty, analysis output, evaluation, and governed use of human corrections |

Use a versioned API as the only integration boundary. Do not connect the apps to each other’s databases. For the first reliable version, use a **durable Camera work queue that Fanmass claims by outbound API calls**. Fanmass is currently documented as a local, loopback-bound service, so a Camera webhook cannot reliably call it. Fanmass should poll/claim queued jobs frequently, lease them, fetch photos through a private, authorized Camera endpoint, and post versioned results back to Camera. This keeps Fanmass offline-friendly and makes retries explicit.

The target flow is:

1. A guest submits a photo to Camera. Camera records the consent version, photo, event and capture ID. A typed email is saved in one canonical contact field, separate from social-login identity and legacy display placeholders; `anonymous@event` is never treated as a real recipient. Approval/rejection notification status stays in Camera and uses the actual user-provided address when present.
2. If the documented purpose and eligibility rules permit analysis, Camera writes a durable analysis-work item. Otherwise it records an explicit ineligible/excluded state. This happens independently of the human publication decision and does not delay capture or vetting.
3. Fanmass claims the work item, privately fetches the original image, analyzes it locally, and returns suggestions, confidence, warnings and model provenance.
4. Camera shows those suggestions beside the original to the reviewer. **AI never approves or rejects a photo.** The reviewer remains responsible for the publication decision and can correct, remove or add labels.
5. Camera records the final human decision and every label correction as an append-only, attributable revision. Fanmass receives only the corrected analysis payload needed for its governed learning workflow.
6. Fanmass applies corrections first within the correct event/partner scope. Cross-partner learning or model-weight training requires a separately approved promotion and evaluation step.
7. Messmass receives versioned event aggregates and integration-health state. It remains the reporting destination; it does not receive guest contact details or individual photo labels by default.

This is not one “approved” flag. Keep three separate state machines:

| State | Example values | Owner | Meaning |
|---|---|---|---|
| Publication review | waiting, approved, rejected, deleted | Camera | Whether the photo may be published and who decided |
| AI analysis | not eligible, queued, running, partial, complete, failed, stale, withdrawn | Fanmass, mirrored by Camera | Whether a particular version of analysis exists and whether policy permits it |
| Permission and retention | permitted purpose/version, restricted, withdrawn, expired | Camera | Whether a given processing purpose remains allowed and how long its data may remain |
| Decision notification | not applicable, pending, sent, failed, bounced | Camera | Whether the approval/rejection email was sent to the real typed contact; never infer success from a moderation status |

## 2. Scope and evidence limits

This is a source/documentation audit plus the explicitly requested local runtime operation: Fanmass's historical Drive backfill flag was turned off, the Image.direct inference listener was gracefully stopped, and Fanmass was started and health-checked. No production database or deployment was changed; secret values were not read or displayed. Production processing regions, actual storage copies, email delivery and current retention execution have not been independently verified. Confirm those operational facts before enabling pre-vetting image transfer.

The source baseline checked was the repository remote-main refs available on 2026-10-18:

| Repository | Source baseline |
|---|---|
| Messmass | 181e49d5 |
| Camera | 2e6c1eb8 |
| Fanmass | 7032843 |

These remote-main refs were fetched again on 2026-10-19 before implementation. Implementation branches start from these refs.

The shared local checkouts were behind those refs (Messmass 28 commits; Fanmass 5; Camera’s local feature branch was 8 commits behind and 1 commit ahead of origin/main at the time of review). Source findings below therefore refer to the fetched remote-main refs, not the stale local source files. The local-runtime status below was refreshed after the requested restart on 2026-10-18. It describes this Mac only and does not establish production status elsewhere.

### 2.1 Local Fanmass runtime prerequisite — refreshed 2026-10-18 after restart

**Decision: Fanmass is running locally as requested, with Image.direct's inference listener stopped and Google Drive historical backfill disabled. This proves the current checkout can start, but does not qualify the Mac for unattended production integration.** Fanmass remains local-only: Camera and Messmass must not call a public Fanmass endpoint; Fanmass should initiate outbound polling/claims and private image retrieval from this machine.

| Check | Observed after the requested operation | Readiness |
|---|---|---|
| Hardware and OS | Apple Silicon ARM64 Mac, 10 CPU cores, 16 GiB RAM | Compatible with the current service; representative event throughput and peak unified-memory pressure still need measurement. |
| Python runtime and model assets | Fanmass Python 3.11 environment, MongoDB 8.2.6, Ollama, YOLO11n weights and cached `qwen2.5vl:3b` are present. | Runtime started. `ollama ps` showed no model loaded at the snapshot; do not infer low total memory use from per-process RSS alone. |
| Exclusive local inference slot | The Image.direct process owning `127.0.0.1:8001` received SIGTERM and exited; the listener is closed. Fanmass now owns the local analysis workload. | Pass for this handoff. There is no automated mutual exclusion yet; implement the coordinator in Section 2.4 before scheduled switching or production use. |
| Supervisor and services | `com.fanmass.supervisor` is enabled and running in the current user's launchd domain. Fanmass `/api/health` returned HTTP 200 with `status=ok`, database connected, and vision, semantic, full and analytics capabilities ready. MongoDB, Ollama, web and worker listeners/processes are present. Supervisor state is fresh (`running`, web healthy, worker heartbeat about 13 seconds old). | Pass for this local restart. The LaunchAgent still depends on the logged-in user's GUI session. |
| API access | No Fanmass API key is configured. Camera/Messmass credential fields exist; secret values and live authentication were not inspected. | Local health is public and working, but protected dashboard/API access and cross-app credentials remain unverified. No key was generated as part of restart. |
| Disk headroom | Free space was about 12 GiB before start, fell to 9.9 GiB during startup, then read about 15 GiB at the final recheck; volume usage fluctuated between 97% and 98%. Existing Fanmass uploads, MongoDB data/logs and model caches remain intact. | **Production blocker.** The changing, low reserve needs investigation and a defined stop threshold, retention and log rotation. No cleanup or data deletion was performed. |
| Drive backfill | `.config/settings.json` now has `gdriveBackfill=false`; `cameraBackfill=false`; no `GDRIVE_BACKFILL` override exists in the checked process environment, `.env`, or LaunchAgent. | Historical Drive backfill is paused. The ordinary incremental Drive poll remains enabled by the current configuration and is separate from full-history backfill. |
| Repository age | Local Fanmass checkout remains 5 commits behind the fetched `origin/main` baseline from the audit; it was not pulled or changed during restart. | Agree the release and reconcile the checkout before production integration. |

Fanmass's public health endpoint and worker heartbeat are healthy, but this is not a production canary: no Camera/Messmass credential was exercised and no new processing purpose or event scope was enabled. The current-user LaunchAgent needs the user GUI session; if the service must survive logout or user-session failure, move it to a managed always-on local host/service account. The worker is active and the free disk reserve is low, so watch queue activity and disk growth.

**Gate 0 — local runtime readiness, before merging/enabling CF-02/CF-03 for a production pilot:**

1. Confirm this Mac (or an explicitly designated always-on local host) is the supported Fanmass worker; reconcile its five-commit drift to the approved release and verify outbound Camera/Messmass access.
2. Resolve disk capacity, retention and log rotation. Define a minimum free-space stop threshold before unattended image ingestion.
3. Keep `gdriveBackfill=false`; separately decide whether ordinary incremental Drive polling should continue. Confirm event/partner scope. Provision a scoped Fanmass API key if operators need protected dashboard/API routes; validate outbound credentials without exposing values.
4. Keep Fanmass and Image.direct under one local inference lease coordinator (Section 2.4) before any automated switching. For a manual handoff, stop/unload the current model first, verify it released the listener/model and check memory pressure before starting the next.
5. Verify launchd state, `/api/health`, dependencies, fresh worker heartbeat, protected API access if required, and a non-mutating Camera/Messmass canary. Confirm restart and network-recovery behavior without enabling historical backfill.
6. Agree on worker availability and queue-age targets. Camera's current 15-minute poll is not on-the-fly; implement frequent lease polling or a durable event queue before promising immediate suggestions.

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

1. Set `gdriveBackfill=false` in Fanmass settings before starting it. No overriding `GDRIVE_BACKFILL` value was found in the checked environment, `.env`, or LaunchAgent. `cameraBackfill` remains false.
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

## 3. Current architecture and what it already does well

### 3.1 Existing connections

- Messmass provisions organizations, partners and events into Camera through internal HTTP routes. Camera also has inbound service routes for frame context, link statistics, photo statistics and shared-session workflows.
- Camera provides Fanmass with an internal event list and a per-event media feed. Fanmass is the caller and keeps a per-event cursor.
- Messmass and Fanmass already use versioned event-context and analytics-summary contracts. Messmass stores Fanmass sync state and the Fanmass aggregate in its own event/report data.
- Camera photo statistics have a distinct Camera namespace in Messmass. Camera sends event-level totals rather than per-photo names, emails, reviewer identities or people labels. The photo-stat feature is off by default.
- Fanmass processes image work in asynchronous, resumable chunks, persists results, tracks runs and exposes progress separately from its dashboard.
- Fanmass has human review feedback, region labels and teaching templates. Human corrections can affect future analyses; that is a real foundation for learning from review.
- Camera has human review history, structured rejection reasons, consent receipts, annotation vocabulary versions, and event-level analytic totals.
- The apps use separate databases and HTTP boundaries. Preserve this.

### 3.1.1 Source surfaces reviewed

| Repository | Main code/doc surfaces |
|---|---|
| Camera | app/api/internal/messmass/*; app/api/internal/fanmass/events/*; lib/fanmass/internal.ts; lib/fanmass/media-feed.ts; app/api/admin/submissions/[submissionId]/review/route.ts; app/admin/events/[id]/vetting/review/page.tsx; app/admin/events/[id]/analysis/review/page.tsx; docs/MESSMASS_FANMASS_INTEGRATION.md; docs/AUTHORIZATION.md; docs/PRIVACY_DATA.md; docs/ANALYTICS_DATA_DICTIONARY.md; docs/AI_TRAINING_PURPOSE_AND_CONSENT_DRAFT.md. |
| Messmass | lib/cameraClient.ts; lib/cameraPhotoStats.ts; lib/fanmassIntegration.ts; lib/fanmassCommands.ts; lib/roles.ts; lib/pageAccess.ts; docs/operations/messmass-fanmass-integration-delivery-plan-2026-06-25.md; docs/_audit/fleet-architecture.md. |
| Fanmass | config.py; services/camera_client.py; services/camera_sync.py; services/messmass_integration.py; services/batch_review.py; services/region_feedback.py; services/memory_store.py; services/visual_memory.py; docs/current-implementation.md; docs/analytics-workflow.md; docs/RUNBOOK.md. |

This list identifies the source paths behind the findings; it is not a complete route-by-route security test or a live deployment inspection.

### 3.2 Current selfie-to-analysis path

The implemented Camera-to-Fanmass media route is an incremental feed, not a real-time job interface:

1. Fanmass polls for active events and media. The default poll interval is 15 minutes.
2. Camera returns original fan photos that became available since the cursor. If vetting is required, waiting and rejected photos are omitted; the photo enters the feed after approval.
3. Camera returns a public image URL for the approved photo. Current Camera storage may serve a Vercel Blob URL or a legacy ImgBB URL; Fanmass fetches the URL without the integration secret.
4. Fanmass downloads the photo and stages it into an event-linked batch. A separate worker then analyzes it in chunks.
5. Fanmass publishes aggregate analytics to Messmass. Messmass also has an analysis command queue and can request work in Fanmass.

This design is useful for post-event reporting but cannot provide the requested live vetting assistance: waiting photos are deliberately withheld, the poll can be 15 minutes late, analysis runs asynchronously, and no per-photo result is returned to Camera.

### 3.3 What the current three human/AI surfaces mean

The source contains distinct annotation stores:

- Camera’s reviewer data is stored on the submission, including people, people-review metadata and rejection reasons.
- Fanmass’s per-image analysis and user feedback are stored in its batch/image records.
- Messmass imports Fanmass summaries and provides event/report integrations. Its existing integration is centered on aggregates, batch links and run/entity commands, not a canonical per-photo review record shared with Camera.

Therefore “the same image can be analysed in Camera, Messmass and Fanmass” is not yet a safe shared workflow. There is no single per-image analysis revision with one owner, a shared correction protocol, or a rule for resolving disagreements. The integration must not silently overwrite Camera annotations with Fanmass output or vice versa.

### 3.3.1 Required event workflow: vetting and analysis are independent

Model event policy with two independent concerns: **whether human vetting gates publication** and **when the required analysis work is done**. Do not use one combined “vetting/analysis enabled” switch.

| Event mode | Human publication rule | Analysis workflow |
|---|---|---|
| Vetting required; real-time assistance | Photo stays private until a human approves it. | Camera queues an eligible submission immediately; Fanmass returns advisory suggestions while the vetter works. Human decision always wins; slow or unavailable Fanmass never blocks Camera vetting. |
| Vetting required; deferred analysis | Photo stays private until a human approves it. | Vetting proceeds without waiting for analysis. A separate Analyse worklist later handles eligible vetted photos; rejected/private photos remain excluded unless the event purpose explicitly permits their processing. |
| Vetting not required; deferred analysis | “No vetting” means no human moderation is required before publication; apply consent, deletion and other configured publication rules normally. | Every eligible, non-deleted submission is queued for post-event analysis and appears in the Analyse worklist. There is no hidden moderation step. |

Analysis remains an expected event deliverable in all three modes. The event setting controls whether suggestions must be available during vetting or can be completed later; it must not silently disable analysis. Represent this explicitly (for example, `vettingRequired` plus `analysisTiming=live|deferred`) and expose per-photo states `not_eligible`, `queued`, `running`, `complete`, `failed`, and `withdrawn`. If product later needs an event to skip analysis entirely, add a separately named, owner-approved policy instead of overloading either control.

Camera owns the submission and consent receipts. Required terms/privacy consent, optional marketing opt-in, permission to analyze for the event/report, and any future model-training purpose are distinct purposes and records. The optional marketing selection must never block capture and must not be treated as permission for AI analysis or model training. Fanmass receives only the minimum eligibility/purpose token and photo needed for the approved analysis; it does not receive the guest's typed email or social-login identity. Messmass gets event aggregates and sync status, not attendee contact data.

### 3.4 Rights, reports and link-based clickers

The access models are useful but are not interchangeable:

- Messmass authenticated roles are guest, user, admin, superadmin and api; the API role is read-only in the role table. “Editor” and “clicker” access is primarily an event-editor capability, not a global SSO role.
- A Messmass event report’s view slug is a read-only share link and can be public by design. An event edit slug is a separate write-capability link: the holder can change the permitted event-editor fields, including stats/clicker counters, subject to the current page-access/password rules. A password-protected editor grant is distinct from a public report URL.
- A capability URL is a bearer credential: anyone who receives or copies it can exercise the link’s permitted rights until the capability is invalidated. It identifies possession of a link, not a verified staff member or an authenticated person.
- Camera has global roles and partner-scoped Events access. The event vetting route currently accepts a partner Events manager; there is no reviewer-only assignment in the authorization matrix reviewed.
- Fanmass has its own local operator and API-key boundary. A Fanmass API key is not a Messmass/Camera human role and does not express a named event reviewer.

Keep public report sharing and low-friction clickers as valid product features. Do not reuse their slugs, passwords or page-access cookies for service-to-service API access. For staff operations, use the authenticated partner/event assignment. For a clicker link, retain the narrow editor field allowlist and add explicit link revocation/expiry expectations, access logging that does not record the secret itself, and a way to rotate a compromised link. For a vetter, grant only review and annotation actions on assigned events. These distinctions should appear in the admin UI and onboarding language so a shared link is never mistaken for staff identity.

## 4. Findings and issues to address

### P0 — Current pull can lose media

Fanmass advances its cursor to the largest timestamp it successfully fetched. If an earlier media download fails but a later one succeeds in the same poll, the cursor can move beyond the failed image. The next poll will not request that earlier timestamp again. The comment in the code says the failed item will retry, but that is not true in that case.

There is a second cursor risk: Camera filters with a strict “availableAt greater than since” comparison and sorts only by availableAt. If more records share the cursor timestamp than fit in a response, advancing to that timestamp can skip the rest. The response does not contain a stable tie-breaker or a continuation token.

**Required fix:** replace the timestamp-only checkpoint with a stable, ordered cursor (availableAt plus submission ID, or an opaque continuation token), and persist an independent per-submission state. A failed image must remain retryable regardless of later successful images. Acknowledge an item only after Fanmass has durably staged it.

### P0 — Existing media cannot drive on-the-fly vetting

The current feed only returns photos already approved for publication. It cannot provide suggestions to the reviewer while a photo is waiting. Also, the normal feed exposes a fetchable image address. Do not expand that public feed to include unapproved images.

**Required fix:** add a separate private pre-vetting retrieval path authorized to Fanmass, returning only the original asset and the minimum event context. Use the existing private pending-photo copy or a controlled private storage path; do not create a public URL for waiting or rejected images. Never include contact email, social identity, session tokens, consent text or reviewer identity in the Fanmass payload.

### P0 — No per-photo result or correction loop

Fanmass currently exports batch/event summaries to Messmass. There is no corresponding versioned per-photo result delivery to Camera, and no common record connecting Camera submission ID, Fanmass image ID, batch ID, run ID, model version and the human correction revision.

**Required fix:** make Camera’s submission ID the cross-system photo key. Store Fanmass IDs as source references, not competing canonical identities. Version analysis separately from review status. Use idempotency and revision numbers so late or duplicate AI results cannot overwrite later reviewer corrections.

### P0 — Human analysis appears in multiple apps without a declared authority

Camera’s human labels and Fanmass’s user feedback are separate datasets. The current Messmass integration is aggregate-oriented. If a vetter changes the same photo in two places, no explicit precedence or reconciliation policy is apparent in the contracts reviewed.

**Required fix:** make Camera’s per-photo review and annotation revision authoritative for the user-facing Camera workflow. Fanmass owns machine output and model provenance. A human correction entered through any approved UI must be submitted as a Camera-owned correction event, even if the UI is hosted in another app. The UI can link or embed Fanmass tools, but it must not create a second master annotation.

### P1 — Role permissions are broader or differently shaped than the workflow needs

- Camera event-level Vetting currently requires a partner-scoped Events manager or a global administrator. That role can create and update within the Events scope; it is broader than a vetting-only assignment.
- Messmass’s authenticated account roles are not equivalent to Camera partner roles. Messmass also has public report URLs and link/password-based editor capabilities.
- A public report view slug is read-only. An event editor link can act as a write capability, limited to editor fields; it should be handled like a bearer credential, not described as an authenticated named user.
- Current service integrations use shared secrets/API tokens. These establish that a caller knows a secret, but do not by themselves express per-event, per-action scopes or an operator identity.

**Required fix:** publish a permission matrix across all apps. Add a Camera reviewer/vetter grant scoped to partner/event with only photo review and annotation permissions. Keep edit, event configuration, delete, report administration and user management separate. Service identities should have route/action and event scopes. Treat report links and clicker/editor links as separate capability credentials with explicit scope, revocation and optional expiry.

### P1 — Fanmass feedback is not the same as model retraining

Fanmass stores user feedback and persists confirmed visual teaching templates. The current review workflow can reanalyse images using those templates. This is a meaningful feedback loop, but it is not evidence that model weights are automatically fine-tuned. The persistent global memory currently allows sports jersey, fashion brand, poster face and crowd face memories (plus negative examples); search labels matches as global memory and the shown lookup path does not filter by partner/event. This can transfer one client’s confirmed teaching into another client’s analysis, including face crops/embeddings. The code does not by itself establish whether those face templates represent attendees, public figures on posters or another category, so define and enforce that boundary before connecting the live Camera queue.

**Required fix:** start with scoped learning: event-local, then partner-local if explicitly enabled. Make cross-partner reuse opt-in and limited to curated public entities such as a sponsor logo or team mark. Never put attendee faces, face embeddings, names, ages, apparent gender or emotion into a shared global memory. No identity matching across user submissions. Do not train model weights directly from one click; first version feedback, retain provenance, run holdout evaluation and require an explicit promotion decision with rollback.

### P1 — Consent, purpose and image retention need to be resolved before pre-vetting analysis

Camera’s data inventory says waiting/rejected images remain in the private pending store, while approved originals are copied to ImgBB and become publicly addressable. It also says the planned 90-day ImgBB deletion is not yet automated. The AI-training-purpose document remains a draft and says no labeled-photo training export should occur until legal confirms that the accepted terms cover it. Camera’s inventory says annotations are not exported or used to train anything.

Real-time analysis and model training are separate purposes. An approved image being available to Fanmass after vetting does not establish that sending a waiting image to Fanmass before vetting is already disclosed or authorized. Likewise, permission to analyze an image for an event report does not automatically establish permission to retain image/labels for future model training.

**Required fix:** before enabling the pre-vetting queue, document controller/processor roles, the exact purpose and lawful basis, notice shown to guests, retention/deletion, subprocessors and data location, and handling of withdrawals. Legal/DPO review must decide whether the current notice covers event-local AI analysis and whether any separate optional permission is needed for training reuse. A deletion or withdrawal must propagate to Camera, Fanmass source image, derived crops, embeddings/templates, cached files and queued jobs as applicable. Do not assume deletion of trained weights is possible; describe the actual training policy honestly.

### P1 — Photo analytics and subject attributes need clear limits

Fanmass and Camera work with photos of real attendees, including children. Current labels can include apparent age group, gender, expression/emotion, clothing and brand. These are model/reviewer interpretations of a photo, not verified facts about a person.

**Required fix:** label outputs as estimates, retain “unknown/unsure” and abstention states, never use inferred attributes to identify a guest, determine eligibility, rank individuals or make consequential decisions. Keep person-level data out of Messmass by default. Review whether “emotion” is necessary at all; if retained, make it low-stakes, optional, visibly uncertain and human-correctable, and assess EU AI Act transparency/application with counsel. GDPR treats photos as personal data; photos are not automatically special-category biometric data, but biometric data is covered when processed with specific technical means for unique identification. A DPIA may be required if the planned processing is likely to create high risk.

### P1 — Code comments and documentation drift

The audit found concrete documentation mismatches:

| Location | Mismatch | Action |
|---|---|---|
| Fanmass services/camera_client.py | Describes media URLs as public ImgBB only; Camera’s current feed can return Vercel Blob or legacy ImgBB URLs. | Correct comment and document supported host/storage behavior. |
| Camera media route comment | Says ImgBB URLs are publicly fetchable, while the deployed source can also return public Blob URLs. | Replace the storage-specific statement with the actual response contract and an explicit warning that this feed is only for already-eligible photos. |
| Fanmass services/camera_sync.py | Says a broken URL remains behind the cursor and retries, but a later successful image can advance the cursor past it. | Fix behavior and comment together; document retry/ack semantics. |
| Camera media-feed.ts and Fanmass cursor docs | Describe an ISO timestamp cursor as sufficient, while the route uses strict timestamp comparison and does not tie-break equal availableAt values. | Define the stable pagination contract before implementation. |
| Camera AI training draft and privacy inventory | Training draft describes a future possible labeled-photo use; privacy inventory currently says no export/training and the draft is unapproved. | Keep these statements synchronized; no training export until approval and the workflow is implemented. |
| Messmass integration delivery plan | Describes the original Messmass–Fanmass MVP and says it is delivered. | Keep it as historical baseline; link this new plan as follow-up work instead of reopening old MVP issues. |
| Fleet architecture audit | Contains dated operational notes that Fanmass was paused and a Fanmass key was unset. | Re-verify runtime facts before rollout and stamp each cross-app edge with current source SHAs after implementation. |

All integration comments should state: owner of the data, direction of the call, authorization used, whether data can include photos or PII, idempotency/retry semantics, and the linked contract/version. Delete comments that claim an operation is safe or retried unless the code enforces it.

## 5. Recommended API and event design

### 5.1 Transport shape

Use an API boundary with three complementary parts:

1. **OpenAPI description** for request/response endpoints, error codes, auth schemes, scopes and versioning.
2. **CloudEvents-style envelope** for asynchronous work and state-change records, or an equivalent documented envelope. Keep the domain payload separate from event metadata.
3. **Durable polling/lease endpoints** for the current Fanmass deployment. Do not depend on webhook delivery to a local-only Fanmass host. A future hosted Fanmass worker can use signed webhook notification as an acceleration, while the queue remains the source of truth.

Every work item/result/correction should include:

- contract version and event type;
- stable Camera submission ID, Camera event ID, Messmass event ID, partner ID;
- analysis/review revision, idempotency key, correlation ID and event time;
- consent/purpose eligibility reference and schema/taxonomy version, but not the full consent text or guest identity;
- Fanmass batch ID, image ID, run ID, model/provider version, prompt/config version, and analysis status;
- normalized findings with label source (model or human), confidence where meaningful, evidence/reference and an explicit unknown/abstain state.

### 5.2 Proposed API families

Names are illustrative. Agree exact paths in the contract issue before implementation.

**Camera → Fanmass work discovery**

- List/claim eligible submissions for analysis; claim creates a short lease and increments attempt count.
- Extend lease for long analysis.
- Fetch original image through a private Camera route with service authorization and event/submission-level checks.
- Acknowledge the result or mark a retryable/permanent failure.

**Fanmass → Camera**

- Submit a versioned AI suggestion for one submission and analysis revision.
- Report progress/partial results and bounded failure codes.
- Receive the canonical current review revision so Fanmass can detect stale work.

**Fanmass → Camera human correction discovery**

- Fanmass claims the complete corrected annotation snapshot or a versioned correction event with a monotonic revision from Camera. Prefer snapshot plus source metadata so Fanmass can recover after missed incremental events. This remains an outbound pull from Fanmass while its worker is local-only.
- Provide correction acceptance/rejection status, not a mutation of Fanmass model weights.

**Fanmass → Messmass**

- Keep the current aggregate summary contract and Camera counters separate.
- Add per-event sync health/readiness and new metric families only through explicit versioned mapping. Messmass must never combine Camera’s review totals with Fanmass’s AI prediction totals under an ambiguous name.

### 5.3 Resilience and authorization requirements

- Stable cursor or queue lease with retryable state; no destructive timestamp-only checkpoint.
- Idempotency on each submission and analysis revision; duplicate delivery returns the same result without creating duplicate images or labels.
- Bounded retries with exponential backoff and a visible dead-letter/error state; operator replay must be safe.
- Route-level, event-level and action-level authorization; object-level checks on every submission/event ID; strict request and response schemas.
- Separate service credentials for Camera↔Fanmass, Camera↔Messmass, and Fanmass↔Messmass. Rotate independently. Never expose credentials to the browser or send them to image hosts.
- Separate credentials by caller/direction as well as app pair; the current Messmass↔Camera shared provisioning token is reused for calls in both directions, which increases the impact of a leak.
- Start with short-lived service credentials and explicit event/action scopes. If the existing SSO platform supports a suitable client-credentials grant and scopes, use it; otherwise use a separately rotated machine identity with key ID, expiry/rotation procedure, replay controls and least-privilege endpoint checks. Do not imply that a shared API key is user authentication.
- Rate/size limits, MIME verification, image byte and pixel limits, safe URL/host validation, timeouts, backpressure and audit of job claims/results. Avoid arbitrary URL fetching; the retrieval route should bind a requested submission to an authorized event and issue only the Camera-controlled source.
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
**Priority:** P0, blocks pre-vetting transfer  
**Scope:** Agree data ownership, status machines, IDs, consent/purpose eligibility, event envelope, per-photo payload, correction contract, errors, idempotency, cursor/lease semantics, sync/deletion events and roles. Add the canonical OpenAPI and event schemas in the agreed shared location; copy pointers and contract version references into all three repos.

**Acceptance criteria**

- The schema defines event/submission/partner/Messmass mapping IDs, analysis revision, source/model/taxonomy versions, timestamps, idempotency, correlation and bounded failure states.
- Camera review status, AI status and purpose/retention status are separate.
- Event policy has an independent `vettingRequired` publication gate and analysis timing (`live` or `deferred`); deferred means the Analyse queue still completes eligible work. “No vetting” publishes without moderation, subject to consent and deletion rules.
- Required privacy/terms acceptance, optional marketing opt-in, event-analysis permission and any future training permission are distinct. Marketing opt-in is never a gate for the capture flow and is not reused as AI/training consent.
- The exact fields prohibited from Fanmass/Messmass (guest email, social identity, session token, full consent text, raw IP/device fingerprint) are documented.
- Data controller/processor assumptions, allowed purpose, notice, transfer, retention, deletion and child-photo rules are reviewed by the owner’s legal/DPO contact.
- A permission matrix separates human reviewer, event editor, event manager, admin and service identities.
- Current API shapes are recorded as compatibility contracts; migration and deprecation rules are approved.

### CF-02 — Camera durable analysis outbox and private image retrieval

**Lead:** Camera  
**Priority:** P0  
**Depends on:** CF-01  
**Scope:** On a new eligible submission, create durable idempotent analysis work without delaying capture. Add claimable job records, lease/attempt state and a Fanmass-authorized private way to retrieve the original image while it remains in quarantine. Preserve Camera's separate typed-contact and approval/rejection email outbox: store the address before accepting the submission, never use `anonymous@event` as a recipient, and track actual provider outcomes. Do not widen the existing approved-photo public feed.

**Acceptance criteria**

- A submission creates at most one logical analysis job per requested analysis revision.
- Fanmass can only claim jobs for authorized, enabled events and fetch that submission’s original image; no public media URL is returned for waiting/rejected photos.
- Response includes only minimum event context and stable identifiers; no guest contact or identity.
- A typed email survives capture, social-login differences, vetting, analysis and admin display in Camera's canonical contact field; placeholder/legacy identity fields cannot overwrite it. Approval/rejection email retries are idempotent and distinguish sent, failed and bounced outcomes without leaking the address into Fanmass or Messmass.
- Analysis failure, consent ineligibility, deletion, expiry and cancellation have explicit job states and do not change publication review.
- Job records are recoverable after a server restart and visible in Camera operations/admin state.

### CF-03 — Fanmass reliable Camera intake and cursor migration

**Lead:** Fanmass  
**Priority:** P0  
**Depends on:** CF-01, CF-02  
**Scope:** Replace the timestamp-only incremental media poll as the live workflow with claim/lease/ack intake. Preserve a safe transition path for the existing approved-only backfill. Fix failed-fetch and same-timestamp loss.

**Acceptance criteria**

- A failed item remains pending/retryable even when later items succeed.
- Duplicate claim/delivery cannot create duplicate intake records or analyses.
- A job is acknowledged only once the image and provenance are durably staged.
- Expired leases are reclaimed; retryable and permanent failures are distinguishable and operators can safely replay a job.
- Cursor migration can resume from a known checkpoint and reconcile every Camera submission against a Fanmass intake record.
- Existing backfill remains available without implicitly importing all old images when an event is first linked.

### CF-04 — Fanmass per-photo analysis result and provenance contract

**Lead:** Fanmass  
**Priority:** P0  
**Depends on:** CF-01, CF-03  
**Scope:** Return a per-submission analysis record as a versioned artifact. Normalize people count, person regions/attributes, brands/teams, item categories, emotion/apparent expression if approved, quality signals and moderation suggestions. Keep batch analytics as a derived aggregate.

**Acceptance criteria**

- Every output maps to Camera submission ID and includes Fanmass batch/image/run IDs.
- Every analyzed module has status: complete, partial, not assessed, unavailable or failed; absence is not silently treated as a negative.
- Findings preserve model-vs-human source, per-field confidence, abstention and taxonomy version.
- Image parsing, file size and MIME checks are enforced; arbitrary URLs cannot be fetched.
- Results are idempotent per analysis revision; old results cannot replace newer results.
- A replay of the same submission and same model/config revision produces an auditable result without duplicate rows.

### CF-05 — Camera reviewer UI for Fanmass suggestions

**Lead:** Camera  
**Priority:** P0  
**Depends on:** CF-02, CF-04, CF-09  
**Scope:** Show AI output in the existing vetting workflow beside the correct original image. Keep the human approve/reject action separate. Provide image count, people regions, person/brand/item suggestions, flags, uncertainty and analysis status. Add a separate Analyse worklist for deferred eligible photos. Analysis cards show the number of analyzed people; the analysis image is the original photo with annotation regions, never a generated frame composited over it.

**Acceptance criteria**

- The UI clearly labels AI suggestions and human-confirmed values; it shows model/revision and timestamp.
- Reviewers can correct, add, remove or mark unsure without losing the original AI output or earlier human revisions.
- Approve/reject remains possible while analysis is pending/failed; the AI never changes publication status.
- A stale suggestion cannot overwrite a later reviewer edit.
- The page works on mobile and desktop, supports keyboard/accessibility, and displays degraded/offline states without blocking vetting.
- The reviewer can see why something was flagged and can leave a correction reason where operationally useful.
- The Analyse worklist includes approved/vetted photos when vetting is required, and all eligible non-deleted submissions when vetting is not required; it does not create a hidden moderation gate.
- Analyzed-photo cards show the analyzed people count and analysis completion/provenance. Analysis opens the original without a frame overlay; missing/unknown analysis is explicit, not shown as zero people.

### CF-06 — Camera annotation revisions and correction delivery

**Lead:** Camera  
**Priority:** P1  
**Depends on:** CF-01, CF-05  
**Scope:** Make Camera the authoritative human annotation store for the connected per-photo workflow. Keep append-only revision history and enqueue correction snapshots for Fanmass.

**Acceptance criteria**

- Each save records reviewer identity/role, time, schema version, prior revision and current revision.
- The complete current annotation snapshot can be resent after missed messages.
- Corrections never mutate the publication decision unless the reviewer separately changes it.
- Human changes made through any approved surface are written through the same Camera authority API.
- Deletion/withdrawal invalidates queued correction work and sends an auditable deletion instruction to Fanmass.

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
- Old polling feed is retired only after reconciliation, backfill and compatibility evidence meet the agreed threshold.

## 9. Implementation tracking (2026-10-19)

The owner accepted this plan for implementation. Work is being delivered as separate repository pull requests from fetched `origin/main` branches; the original local checkouts and their uncommitted audit notes are preserved. No change is deployed by this work.

| Work package | State | Evidence / remaining gate |
|---|---|---|
| CF-01 — cross-app authority and contract | In progress | Accepted ownership boundaries and event-mode defaults are recorded here; API schemas and least-privilege credentials remain to be delivered before image exchange expands. |
| CF-02 — Camera durable work queue/private media | In progress | Paired draft PRs add versioned, per-event submission leases, a private lease-bound image route, idempotent stage/retry acknowledgements, event-active checks, and published-photo eligibility. Leases expire after ten minutes. Unsupported/oversized files can be marked terminally failed. Deletion/withdrawal propagation remains a pilot blocker. |
| CF-03 — reliable Fanmass intake | In progress | Fanmass consumes the versioned durable claim path, acknowledges only after durable analysis-job staging, and retains the compound-cursor fallback for older Camera builds. Stable intake job IDs use source, batch, analysis depth, and sorted capture filenames; Camera tracks each event separately for multi-event submissions. Permanent media rejection is not retried forever. The default poll is one minute, so suggestions are not immediate or guaranteed before review. |
| CF-04 — per-photo AI result/provenance | Not started | Existing Fanmass batch summaries do not yet provide the complete Camera per-submission revision contract. |
| CF-05/06 — Camera suggestions, analysis worklist, human revisions | Partly present in Camera | Human vetting and the separate photo-analysis worklist exist; AI suggestions and append-only human correction delivery are still open. |
| CF-07 — scoped learning/evaluation | Not started | No cross-partner personal recognition or automatic model-weight training is enabled by this plan. |
| CF-08 — Messmass aggregates/health | Partly present | Camera photo counters and Fanmass aggregate routes exist; full lifecycle and sync-health read model remain open. |
| CF-09/10 — access, privacy, operations/docs | In progress | The new media fetch requires the existing distinct Fanmass service secret plus a per-photo, per-event lease and allows only ImgBB/Vercel Blob sources. Terminal media failures are recorded, but an operator recovery surface, scoped credential rotation, deletion propagation, operational alerts and runbooks remain open. |
| CF-12 — exclusive local inference slot | Not started | Fanmass is running locally and Image.direct is stopped, but the host still has only the documented manual handoff. |
| CF-11 — shadow/pilot/rollout | Blocked on prerequisites | Do not enable pre-vetting photo analysis or automate inference alternation until legal purpose, retention, host capacity and recovery gates pass. |

## 10. Recommended delivery order

1. **CF-01:** agree authority, data purpose, the independent vetting/analysis modes, status/state contract, permission matrix and versioned API schemas. Resolve lawful purpose, guest notice and retention before enabling live photo transfer.
2. **CF-09 in parallel with contract work:** settle human and service identities before opening any new photo route.
3. **Gate 0:** qualify the designated local Fanmass runtime: approved release, disk/retention reserve, backfill scope, API credentials, supervisor/dependencies, fresh health/heartbeat and network reachability. The requested local restart is complete, but the 9.9 GiB free-space headroom, five-commit source drift and unverified cross-app credentials mean production Gate 0 is still open.
4. **CF-12 before automated model switching or pilot:** deliver the exclusive host inference lease and graceful Fanmass/Image.direct handoff; until then keep the current manual one-at-a-time procedure.
5. **CF-02 and CF-03:** complete review and release of Camera's private durable queue and Fanmass's leased consumer. The current implementation is on paired draft PRs; do not treat the one-minute poll as immediate suggestions. Keep Camera capture/vetting available during Fanmass downtime.
6. **CF-04:** return per-photo suggestions with model/taxonomy provenance, confidence, uncertainty, partial/failure states and idempotent revisions.
7. **CF-05:** show advisory AI findings on Camera vetting; add a separate Analyse worklist for deferred images. Keep human vetting and analysis decisions separate.
8. **CF-06 then CF-07:** capture attributable correction revisions first; then apply event/partner-scoped feedback and quality evaluation. Do not train shared weights directly from clicks.
9. **CF-08:** send source-attributed event aggregates, report inputs and integration/sync health to Messmass; preserve distinct human-vetting, AI-analysis, deleted and retention counts.
10. **CF-10:** continuously update comments, inventories, runbooks, deletion/withdrawal behavior, dashboards, alerts and capacity controls with each implementation PR.
11. **CF-11:** shadow, reconcile, then pilot event by event with a fallback and rollback. Retire legacy polling only after parity and recovery are proven.

## 11. Release gates and measures

No pre-vetting Fanmass access should launch until:

- Gate 0 passes on the designated local host, including health, worker heartbeat, disk reserve, backfill scope, the required outbound/inbound authentication checks and recovery checks;
- only one local inference owner holds the lease, and graceful handoff, crash recovery, low-disk/memory blocking and queue persistence have been demonstrated;
- event and submission access checks are verified across all three services;
- private image retrieval is proven not to produce public links or leak credentials;
- the agreed purpose, guest notice, processor terms, retention and child-photo rules are approved;
- every job/result can be replayed without loss or duplicate analysis;
- deletion and withdrawal propagate to Fanmass derivatives;
- human vetting remains available during worker downtime;
- role-based reviewer access is narrower than event management;
- baseline AI evaluation and fallback thresholds are agreed.

Track these operational and quality measures by event and analysis revision:

- submission-to-first-suggestion median and p95 latency;
- percentage of photos with suggestions before the vetter first opens them;
- queue age, retries, dead letters, missing-image fetches, duplicate jobs and reconciliation mismatches;
- reviewer override/correction rate by field and by confidence band;
- human/model agreement and adjudicated precision/recall per field;
- abstention, unavailable/failed modules and analysis staleness;
- time taken to vet, time taken to analyze, and reviewer throughput;
- deletion/withdrawal propagation time and residual-copy verification;
- aggregate sync freshness and difference between Camera counts, Fanmass records and Messmass report totals.

Do not use one composite “AI accuracy” number as the go-live decision.

## 12. Decisions required before implementation

These are product/legal choices to resolve inside CF-01, not open questions that block this audit:

1. Confirm the analysis eligibility boundary in CF-01. Recommendation: in vetting mode, live analysis of waiting photos requires an explicitly approved purpose; deferred analysis defaults to vetted/approved photos; when vetting is off, analyze all eligible, non-deleted submissions. Keep rejected/private images excluded unless their processing purpose is separately approved.
2. Are age, apparent gender and expression necessary for each event’s business purpose? Which fields are optional or removed?
3. Is reuse of human corrections limited to one event, one partner or a curated shared catalog? Recommendation: event/partner only by default; curated shared public entities require explicit promotion.
4. What is the retention period for Camera originals, Fanmass downloads, crops/embeddings, analysis outputs and training/evaluation data? The current Camera privacy inventory states that the planned ImgBB 90-day deletion is not automated.
5. Which identity provider/grant can issue machine credentials with event/action scopes, and who owns rotation and emergency revocation?
6. Should Messmass display only event aggregates, or also per-photo links back to Camera? Recommendation: aggregates plus a permission-checked Camera deep link; never copy guest email/photo/face labels into Messmass by default.

## 13. References

- Camera integration and data map: docs/MESSMASS_FANMASS_INTEGRATION.md, docs/PRIVACY_DATA.md, docs/ANALYTICS_DATA_DICTIONARY.md, docs/AI_TRAINING_PURPOSE_AND_CONSENT_DRAFT.md, docs/AUTHORIZATION.md.
- Messmass–Fanmass baseline: docs/operations/messmass-fanmass-integration-delivery-plan-2026-06-25.md; docs/_audit/fleet-architecture.md; lib/fanmassIntegration.ts; lib/cameraPhotoStats.ts.
- Fanmass processing and feedback: docs/current-implementation.md, docs/analytics-workflow.md, docs/RUNBOOK.md, services/camera_sync.py, services/camera_client.py, services/batch_review.py, services/memory_store.py.
- Legal/standards links are listed in Section 7. This plan is not legal advice or a claim of regulatory compliance.
