# Session Handover — Multi-Repo Fleet (camera / messmass / fanmass / launchmass)

Written urgently ahead of a possible session/system crash. Everything below
reflects real, verified state as of the timestamps and commit SHAs quoted —
not assumptions. If you're picking this up cold: read "Active thread" first,
it's the thing in flight right now and needs a human action, not more code.

---

## 0. All repositories in scope this session

| Repo (GitHub) | Local path | What it is | Merge policy |
|---|---|---|---|
| `moldovancsaba/camera` | `/home/user/camera` | Photo-capture app; uploads to ImgBB; admin gallery-upload for manual/non-camera photos. Deployed on Vercel, domain `camera.messmass.com`. | Direct-merge-once-green (established this session) |
| `moldovancsaba/messmass` | `/home/user/messmass` | The core event-analytics dashboard — "the umbrella" of the fleet. Owns the `projects`/event data model, admin UI, and now the Drive-folder-linking self-service UI (section 1). Next.js App Router. Domain `messmass.com`. | Direct-merge-once-green (established this session) |
| `moldovancsaba/fanmass` | `/home/user/fanmass` | Single-operator local AI analysis tool. Runs on the **user's own hardware**, not cloud-deployed — this session never has direct access to the live running instance, only to the git repo/code. Local Ollama vision model + MediaPipe. FastAPI/Python. No public domain. | **Requires explicit human go-ahead before merging** — no direct-merge precedent for this repo |
| `moldovancsaba/launchmass` | `/home/user/launchmass` | Card/link board app, multi-tenant, org-scoped roles, SEYU branding. Next.js Pages Router, plain JS (no TypeScript). Domain `launchmass.doneisbetter.com` (candidate for migration to a `messmass.com` subdomain per "The Fleet Map" artifact, not yet started). | **Requires explicit human go-ahead before merging** — its own AGENTS.md §5 mandates this |
| `moldovancsaba/sso` | `/workspace/sso` (note: different mount point than the other four, which are under `/home/user/`) | The shared OIDC/OAuth2 identity provider all four apps above authenticate against, at `sso.doneisbetter.com`. Also serves at least two unrelated products (`cardmass`, `playmass`) outside this fleet. **Explicitly out of scope for changes** — the user said "SSO is not part of the deal." Accessible for reads only; do not modify without a fresh, explicit instruction to do so. | N/A — do not merge anything here absent explicit instruction |

All four fleet apps (not SSO) share the same OIDC provider and, where
configured, a shared session-cookie domain scoping strategy. See
`SSO_EMAIL_UNIFICATION_PLAN.md` at `/home/user/` (outside any single repo)
for the earlier SSO/email-unification planning doc if relevant — not
touched this session beyond being read for context.

---

## 1. ACTIVE THREAD — Google Drive photo ingestion (in flight, needs YOU)

**What it is:** A new pipeline so admins can link Google Drive folders of
event photos (not shot with the camera app) to a messmass event. fanmass
pulls the photos, runs its existing local AI stack on them (Ollama vision
model + MediaPipe crowd/face counting), and pushes derived stats back into
the messmass event automatically — no ImgBB, no camera app involvement, no
manual UUID-pasting. All code for this is written and merged. **What's not
done is deploying/configuring the real fanmass instance — that's on you.**

**Current real state, right now:**
- A real production event, **"UEFA Super Cup Fan Festival"**, has 2 Drive
  folders linked via messmass's admin UI. Both currently show **⏳ Pending**
  status (confirmed via a screenshot from the user, not by me querying the
  DB — this sandbox cannot reach the production MongoDB Atlas cluster over
  the network, confirmed by repeated timeout).
- Both folders are shared as **"Anyone with the link"** (the user's chosen
  method, deliberately, not explicit service-account sharing).
- messmass side: **fully merged, live in production**, `main` @
  `7064515a57d3e285c86d6d7cc35b280e6938a655`.
- fanmass side: **code fully merged to `main`**, but the ACTUAL RUNNING
  fanmass instance is on the user's own hardware (not this session, not
  cloud-deployed) and has **not yet** pulled this code or been restarted.

**What YOU (the user) still need to do, on the actual fanmass machine:**
1. `git pull` (or equivalent) to get fanmass's `main` up to date — it now
   has `services/gdrive_client.py`, `services/gdrive_sync.py`, and the
   `GDRIVE_*` config wiring.
2. **Restart both the web server and worker.** fanmass's own README is
   explicit: code changes aren't live until this happens
   (`./scripts/hard_restart.sh` per the README, or however you normally
   restart it).
3. **Configure real Google Cloud service-account credentials** — set either
   `GDRIVE_SERVICE_ACCOUNT_KEY_PATH=/path/to/key.json` or
   `GDRIVE_SERVICE_ACCOUNT_KEY_JSON={...}` (inline). Without one of these
   set, the Drive poller silently no-ops (by design, not an error) — nothing
   will ever happen until a real key is configured.
4. Wait up to `GDRIVE_POLL_MINUTES` (default 30 min) for the next scheduled
   poll, or lower that env var temporarily to iterate faster. There is
   deliberately no manual-trigger endpoint (matches the camera path's
   existing precedent) — flagged as a possible future add if this cadence
   turns out to be too slow to debug against.

**How to check if it worked:** open the event in messmass's admin panel
(Edit Project → Reporting tab → "Drive Folders" section). Badge tells you
everything:
- **⏳ Pending** → fanmass hasn't successfully polled it yet.
- **✓ Verified** → it worked, analysis is running, stats will land in the
  event automatically.
- **⚠ Error** (with a reason shown) → fanmass tried and failed. **The single
  most likely failure mode**: "Anyone with the link" sharing might not be
  honored by the service account's API calls (this was never confirmed —
  Google's own docs don't state it either way, and it couldn't be tested
  without live credentials). If you see this, the fix is: also explicitly
  share both folders with the service account's `client_email` (found in
  the same key JSON) — the two sharing methods can coexist.

**Nothing else is required from me for this to work.** The code path is:
messmass stores the link → fanmass's `GET /api/integrations/fanmass/drive-
folders` bulk-discovers it on its next poll → auto-provisions its own batch
for the event (no manual link needed, this was a specific design
requirement) → pulls new files → runs existing Ollama+MediaPipe analysis →
pushes stats back via `POST .../events/{id}/stats` → reports folder status
back via `POST .../drive-folders/status`.

---

## 2. Full repo state snapshot (verified via `git log -1` just now)

| Repo | Branch | HEAD commit | Last real change |
|---|---|---|---|
| camera | `main` | `0565bf5` | GDS 6.0.0 bump merged (#114) |
| messmass | `main` | `7064515` | Drive-folder feature + security fix merged (#320) |
| fanmass | `docs/gdrive-sharing-method` (local checkout only — `main` on GitHub is at `544f0bb`, includes this) | `cdc64a4` | Drive ingestion adapter + sharing docs merged (#75, #76) |
| launchmass | `main` | `f0a8296` | EPIC #6 fully closed (16 issues + 2 extra, all merged) |

All four repos share SSO auth at `sso.doneisbetter.com` (a fifth, separate
repo — explicitly **out of scope**, the user said "SSO is not part of the
deal"). All four are aligned on vendored GDS 6.0.0 as of this session
(camera, launchmass, fanmass, and finally messmass via PR #318).

---

## 3. Everything completed this session (reverse chronological, condensed)

### Drive-folder ingestion feature (today, the big one)
- Researched (parallel background agents) how camera/messmass/fanmass
  actually store/move images, and public best practices for Drive
  ingestion, before designing anything.
- Recommended: fanmass does the analysis (user confirmed explicitly), Drive
  linking happens self-service in messmass's admin UI (user's explicit
  requirement — "not and never manually"), no ImgBB involved.
- Entered plan mode, produced a detailed file-by-file plan (still at
  `/root/.claude/plans/scalable-launching-papert.md` if useful for
  reference — describes the full design: `drive_folder_links` Mongo
  collection, `isAdmin()`-gated REST endpoints, `DriveFoldersEditor.tsx`,
  the bulk-discovery endpoint, `gdrive_client.py`/`gdrive_sync.py`, the
  `ingest_gdrive_images` refactor, cursor/dedup design, etc.)
- Dispatched two background implementation agents (messmass, fanmass).
  **Both hit the same failure mode as an earlier GDS-bump agent this
  session: they misunderstand their own execution model and report
  "waiting for a notification" instead of actually finishing.** I ended up
  verifying and driving both to completion myself directly every time —
  do not trust a background agent's self-report without independently
  checking gates/PR state, on this session's evidence.
- messmass PR #319 merged, then a real P1 bug surfaced by automated review
  (Codex bot, installed on both repos) **after** merge: the new endpoints
  checked for *any* authenticated session, not specifically an admin role.
  Fixed immediately as PR #320 (also fixed 2 real form-nesting UI bugs the
  same review caught). I re-verified type-check/lint/build myself directly
  against merged `main`, not just trusting CI.
- fanmass PR #75 (the adapter itself) — deliberately left unmerged
  initially per the user's instruction ("no merge without asking" for this
  repo specifically, unlike messmass/camera which have an established
  direct-merge-once-green precedent). One real bug from that review (cursor
  could skip past a failed download, status wrongly reported "verified" on
  partial failure) — fixed with a regression test before merging. User then
  authorized merging both #75 and the docs follow-up #76.
- Two Artifacts published for reference (both private, session-owned):
  - **The Fleet Map** — domain/session-architecture recommendation
    (umbrella-domain question, why SSO shouldn't move, versioning
    independence). URL: `https://claude.ai/code/artifact/305d5c45-4ef5-46b3-ba28-63540dbe8743`
  - **Drive-to-Dashboard** — the ingestion pipeline recommendation this
    feature was built from. URL:
    `https://claude.ai/code/artifact/dfdd2a45-a0db-48a1-b0c8-8738353540ed`

### Earlier this session (all done, all merged, not active threads)
- **launchmass EPIC #6**: all 16 security/correctness/maintainability
  sub-issues (#7–#22) plus 2 more (#36, #37) — implemented, verified with
  real browser/DB testing, merged. Covers: removed hardcoded credentials,
  org-scoped authorization fixes, pagination, ESLint+typecheck gates,
  consent-gated analytics, GDS-based UI components, README rewrite.
- **GDS 6.0.0 alignment across the whole fleet**: camera, launchmass,
  fanmass, and finally messmass (today, PR #318) all vendored up from
  various older versions to 6.0.0. Fleet is now fully aligned.
- **camera**: closed 2 stale audit-trail issues that were already fixed.
- **fanmass local clone**: re-synced from a stale branch to `main`.
- **Cross-repo alignment audit** (user request: "check out all our repos")
  — surfaced the GDS gap (now closed) and the fanmass stale-branch issue
  (now fixed).

---

## 4. Explicitly NOT done / declined / blocked (don't assume these are issues)

- **Phase 4 (shared session domain)** — still optional/blocked. Needs DNS +
  SSO OAuth client redirect-URI registration + Vercel domain config
  (launchmass side), and confirmation of fanmass's actual production domain
  (user was going to check Vercel, no update received). Not urgent per the
  domain-architecture recommendation in "The Fleet Map" artifact — the one
  concretely recommended piece (moving launchmass onto a messmass.com
  subdomain) is still open but not started.
- **The cross-repo backfill PR** (camera #88 / messmass #299 / fanmass
  #69) — explicitly declined by the user ("No detour").
- **messmass PR #312** (a CLAUDE.md addition) — never touched, not part of
  any explicit instruction.
- **SSO repo** — explicitly out of scope per the user ("SSO is not part of
  the deal"). One real finding from earlier research, in case it ever
  becomes relevant: SSO's own `pages/logout.js` hardcodes a
  `.doneisbetter.com`-suffix check for post-logout redirect validation that
  would need a small fix if any app ever needs to redirect to a
  `messmass.com` host after logout. Not acted on, not urgent.
- **Live end-to-end Drive test** — can't be done from this session at all;
  needs the user's real GCP credentials and real fanmass deployment. This
  is section 1 above.

---

## 5. Standing conventions established this session (useful for continuity)

- **Merge policy is per-repo, not uniform**: camera and messmass have an
  established direct-merge-once-green precedent (no separate "merge #N"
  needed once gates pass). launchmass and fanmass do NOT — explicit
  human go-ahead required before merging either.
- **AI-branding ban** is standing policy in every repo (own CLAUDE.md/
  AGENTS.md in each): no `Co-Authored-By`, no session links, no assistant
  names in commits/PRs/code. `create_pull_request` and
  `add_reply_to_pull_request_comment` both auto-append a footer
  server-side regardless — always strip via `update_pull_request`
  immediately after creating, verify with a fresh read.
- **Codex bot review discipline**: an automated `chatgpt-codex-connector`
  GitHub App is installed on at least messmass and fanmass repos (not
  something set up this session — pre-existing repo config) and
  auto-reviews every PR. Its findings are a mix — verify every claim
  against actual code before accepting OR refuting. This session caught
  both real bugs (the admin-role gap, the cursor bug) and false positives
  (misattributed commit-footer claims, checked and refuted with `git log`
  each time).
- **Background agents cannot be trusted to self-report completion
  accurately** in this session/environment — three separate agents
  (a GDS-bump one, and both Drive-feature ones) all stalled with "waiting
  for a notification" instead of finishing, despite the actual underlying
  work usually being fine. Always independently verify gates/PR/merge
  state rather than accept an agent's own summary at face value.
- **messmass's real quality gate** (more rigorous than the other three):
  `npm test` (real Jest suite, 309 tests), `type-check`, `lint`, `build`,
  `version:verify`, `style:check`, plus `docs:audit` and two guardrail
  scripts that aren't documented in its own AGENTS.md but are real CI
  requirements (`.github/workflows/ci.yml` is the source of truth, not the
  docs).
- **fanmass has no CI at all** — verification is manual `scripts/smoke_*.py`
  self-checks run by hand, no pytest, no GitHub Actions.

---

## 6. If you're a fresh agent/session picking this up

Read this file first, then:
- For the Drive feature: check messmass's admin UI for the two folders'
  current status badge before doing anything else — that tells you
  immediately whether the user has completed their deployment steps yet.
- Don't re-open or re-create PRs #75, #76, #319, #320 — all four are
  already merged.
- The full implementation plan (file-by-file, design rationale) is still on
  disk at `/root/.claude/plans/scalable-launching-papert.md` if you need
  the detailed "why" behind any design decision in the merged code.
- Don't touch the SSO repo or attempt Phase 4 domain work unless the user
  explicitly asks — both are deliberately parked, not forgotten.
