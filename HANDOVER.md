# Session Handover — Multi-Repo Fleet (camera / messmass / fanmass / launchmass)

Everything below reflects real, verified state as of the commit SHAs quoted —
not assumptions. If you're picking this up cold: read section 1 first. It is the
only item that needs a human action rather than more code.

Last verified: 2026-08-14.

---

## 0. All repositories in scope

Local paths are `/Users/Shared/Projects/<repo>` on the current machine. (Earlier
revisions of this file quoted `/home/user/...` — that was a different sandbox and
those paths no longer exist.)

| Repo (GitHub) | What it is | Merge policy |
|---|---|---|
| `moldovancsaba/messmass` | The core event-analytics dashboard — the umbrella of the fleet. **Master for organisations, partners and events.** Owns the data model, admin UI, Drive-folder linking, and the AI Analytics surfaces. Next.js 15 App Router. Domain `messmass.com`. | Direct-merge-once-green |
| `moldovancsaba/camera` | Photo-capture app; uploads to ImgBB; admin gallery upload for non-camera photos. Next.js 16. Domain `camera.messmass.com`. | Direct-merge-once-green |
| `moldovancsaba/fanmass` | Single-operator local AI analysis tool. Runs on the **user's own hardware**, not cloud-deployed. FastAPI/Python, local Ollama vision model + MediaPipe + YOLO. No public domain. | **Explicit human go-ahead before merging** |
| `moldovancsaba/launchmass` | Card/link board app, multi-tenant, org-scoped roles. Next.js Pages Router, plain JS. Domain `launchmass.doneisbetter.com`. Not cloned on this machine. | **Explicit human go-ahead before merging** |
| `moldovancsaba/sso` | Shared OIDC/OAuth2 provider at `sso.doneisbetter.com`, also serving products outside this fleet. **Explicitly out of scope** — "SSO is not part of the deal." Reads only. | Do not merge anything absent explicit instruction |

---

## 1. NEEDS A HUMAN — credential rotation (still open)

Four live secrets were exposed in session transcripts and should be rotated.
Nothing is known to have used them, but they were printed in plain text:

- fanmass `.config/settings.json` → `cameraApiKey` and `messmassApiKey`
- the SSO MongoDB Atlas connection URI
- the messmass OAuth client secret

Rotating these is a human action — this is the one item on this list an agent
should not perform on its own.

---

## 2. Repo state snapshot (verified via `git log -1`)

| Repo | Branch | HEAD | Last real change |
|---|---|---|---|
| messmass | `main` | `cd8ab0cb` (v12.1.53) | Hide zero-image events from the AI Analytics default view |
| fanmass | `main` | `34e1799` | Map demographics into the analysis summary |
| camera | `main` | `0565bf5` | GDS 6.0.0 bump merged (#114) |
| launchmass | — | — | Not cloned locally; unchanged since EPIC #6 closed |

Milestones #4, #5 and #6 on the messmass board are closed with zero open issues.

---

## 3. The Drive → analysis → messmass pipeline (working, no longer a thread)

This was the previous handover's active thread. It is **done and verified in
production**, so it is recorded here as architecture, not as work in flight.

**End-to-end flow.** An admin links a Google Drive folder to an event in
messmass → fanmass discovers it on its next poll and auto-provisions its own
batch → pulls new files → runs Ollama + MediaPipe analysis → pushes stats back
via `POST /api/integrations/fanmass/events/{id}/stats` → pushes the structured
summary via `.../analysis-summary` → reports folder status back via
`.../drive-folders/status`.

**Proof it works:** 411 images on the "UEFA Super Cup Fan Festival" event
ingested and analysed in ~100 seconds, with demographics, brand mentions and
club mentions rendering on that event's AI report.

**How Drive access actually resolves.** Not the Google Drive REST API with a
service account, as originally designed — the deployed path uses **Google Drive
for Desktop**, reading the `com.google.drivefs.item-id#S` extended attribute to
map a Drive folder ID to a local path (`services/gdrive_local.py`). Note that
Python's `os.getxattr` is Linux-only, so macOS needs the ctypes libc binding
already in that module. Do not "fix" that back to `os.getxattr`.

**Three defects fixed along the way**, all worth knowing because they were
independent and each alone would have stalled the pipeline:

1. The supervisor killed the worker every 3m18s, stranding claimed jobs — fixed
   with a liveness heartbeat. The issue's own original hypothesis (claim-query
   starvation) was **wrong**; probing `claim_next_job` directly returned the
   stranded job instantly, which is what disproved it.
2. Camera intake had no chunking, so large batches failed wholesale.
3. The scheduler ran on the claim loop, so a slow claim blocked every tick.

---

## 4. AI Analytics (shipped v12.1.47 → v12.1.53)

The surfaces that make AI analysis visible in the product. Full architecture in
`docs/architecture.md` → "AI Analytics & Fanmass Analysis Pipeline"; API in
`docs/api/api-analytics.md`; user-facing walkthrough in
`docs/guides/guides-tutorial-fanmass.md`.

- `/admin/analytics/ai` — coverage, per-event status, variable catalogue with
  fill rates. **Any authenticated role**, deliberately unlike the admin-only
  dashboards.
- `/admin/analytics/ai/[eventId]` — per-event report: brands, clubs/federations,
  merchandise, demographics.
- Fill-rate hints inline in the chart formula picker.

Non-obvious constraints, each of which cost a real debugging cycle:

- **A nav item absent from `MENU_PERMISSIONS` is invisible to everyone** —
  `canAccessMenuItem` returns false for unknown labels. Guarded by
  `tests/nav-menu-permissions.test.ts`.
- **`distinct()` fails** — the Mongo client runs Stable API v1 with
  `strict: true`. Use `$group`.
- **`derived: true` means "the formula engine owns this"**, which makes
  `pushEventStats` silently skip the field. `fanmassStatus` is producer-owned and
  therefore registered `derived: false`.
- **The summary contract stores unknown same-major fields untouched.** This is
  why `emotionProjection` and `smilingPct` reached production with no schema
  change — only rendering needed a release.

---

## 5. Standing conventions

- **Merge policy is per-repo, not uniform.** camera and messmass:
  direct-merge-once-green. launchmass and fanmass: explicit human go-ahead.
- **AI-branding ban is standing policy in every repo.** No `Co-Authored-By`, no
  session links, no assistant names in commits, PRs, code, docs, UI, logs or
  config. GitHub's own PR tooling auto-appends a footer server-side — strip it
  immediately after creating and verify with a fresh read.
- **messmass's real quality gate** is `.github/workflows/ci.yml`, not the docs:
  `type-check`, `lint`, `test` (336 Jest tests), `build`, `version:verify`,
  `style:check`, `docs:audit`, plus the dependency and layout-grammar guardrails.
- **A messmass version bump touches more than `package.json`**: run
  `node scripts/update-version.js` (syncs the lockfile), add a release-notes
  entry, and update the `Version:` header in 7 docs. `version:verify` fails
  otherwise.
- **fanmass has no CI.** Verification is manual `scripts/smoke_*.py` runs.
- **All issues go to the messmass board**, structured to the standard in
  `sovereignsquad/general-design-system#81`. Roadmap issues live on Project 8,
  not in the repo issue list.
- **Codex bot reviews every PR** on messmass and fanmass. Its findings mix real
  bugs with false positives — verify each claim against the actual code before
  either accepting or refuting it.

---

## 6. Hard-won lessons worth not relearning

- **Don't run `npm run build` while the dev server is up.** It wipes `.next` and
  breaks the running preview. This happened three times in one session.
- **Verify UI claims by rendering the page.** A fill-rate denominator bug shipped
  past type-check, lint and tests, and was caught only by looking at the page.
- **BSD `sed` does not support `\s`.** A redaction that relied on it leaked two
  live API keys into a transcript (see section 1).
- **Background agents misreport completion.** Independently verify gate and merge
  state rather than accepting a self-report.
- **An issue's stated hypothesis can be wrong.** Probe the mechanism directly
  before building a fix on top of someone's diagnosis, including your own.
