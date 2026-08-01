# CLAUDE.md — Standing Operating Rules

These are STANDING rules for any AI coding agent working in this repo. They apply to
every task regardless of who asks or how it's phrased. When a task conflicts with
them, the rules win — say so explicitly rather than silently overriding one.

For command references (dev server, migrations, diagnostics), see `AGENTS.md`. This
file is about *how to work*, not *what commands exist*.

## 0. Read first, never guess

Before stating a fact about this repo's structure, auth flow, data model, or
behavior: read the actual file or run the actual command. Do not answer from
memory on anything structural. Cite the file(s) you relied on when it matters.

Report only what a tool actually returned (build output, test results, a CI check's
actual status). Never fabricate or extrapolate a result you didn't observe — if you
can't verify something, say so plainly instead of guessing.

## 1. AI-assistant branding ban (non-negotiable)

The agent doing the work is internal tooling, not a feature, co-author, or brand.
Never surface it anywhere the codebase or its history is visible.

- **Commits:** no `Co-Authored-By: <assistant>` trailer, no session-link trailer, no
  model name in the subject or body. Describe the change and its reasoning only.
- **Branches:** never create/push a branch prefixed with the assistant's name (e.g.
  `claude/...`). Use plain names: `feature/...`, `fix/...`, `chore/...`.
  Known limitation: some harnesses assign a branded starting branch automatically —
  that can't be renamed after the fact. Mitigation: don't build further commits on
  it; start a fresh plainly-named branch for the actual work instead.
- **PRs / docs / code / UI copy / API responses:** neutral terms only. Never a
  specific product or model name.
- **Retroactive:** if AI branding turns up in tracked files or reachable history
  during unrelated work, fix it as part of that work, or flag it if genuinely out
  of scope.
- **The one exception:** honest self-disclosure when a human directly asks "are you
  an AI" / "which model is this." Where something can't be changed from inside the
  repo (e.g. a git identity baked into the environment's committer config), say so
  plainly rather than pretending it's fully solved.

## 2. Zero-tolerance quality gate before anything reaches `main`

CI (`.github/workflows/ci.yml`, job `Verify`) runs, in order: `type-check` → `lint`
(`eslint . --max-warnings 0`, zero warnings allowed) → `test` → `style:check` →
`version:verify` → `docs:audit` → dependency guardrail → layout-grammar guardrail →
`build`. Nothing merges with any of these red.

Run the relevant subset locally before every push — at minimum `npm run type-check`
and `npm run lint`, and `npm run build` for anything touching routing, config, or
provider setup. Fix failures at the source; never suppress a lint rule, skip a test,
or silence a warning to get green. If a clean run genuinely isn't achievable, stop
and say so rather than pushing anyway.

## 3. Git workflow actually used in this repo

- A merged PR is finished. Never stack new commits on an already-merged branch —
  start a fresh branch from the current `main` for follow-up work, even if it
  reuses the same name.
- Before any push, self-check: `type-check` + `lint` + (when relevant) `build`
  clean, no scratch/debug files staged, no AI branding per §1.
- Open a PR, verify CI is green (poll `pull_request_read` / watch webhook events —
  don't guess at status), then merge directly. Don't leave a green PR sitting
  unmerged waiting for a human unless explicitly told to.
- Clean up local test infrastructure (dev servers, throwaway databases, scratch
  scripts) before considering a task done.

## 4. This repo's role in the shared SSO ecosystem

messmass, camera, fanmass, and launchmass all authenticate against a single OIDC
provider at `sso.doneisbetter.com`. Tribal knowledge worth knowing before touching
any auth code here:

- **Login is SSO-only.** No local password login, no self-registration
  (`app/api/admin/login` POST and `app/api/admin/register` POST both return `410`).
  The only login surface is `/admin/login`, which auto-redirects straight to
  `/api/auth/sso/login` → SSO's hosted login page. It only renders anything itself
  when there's an error to explain or SSO isn't configured — by design, so this
  app's pre-SSO screen can never visually diverge from any other app's.
- **SSO has no RP-Initiated Logout / `end_session_endpoint`.** Confirmed against
  `https://sso.doneisbetter.com/.well-known/openid-configuration` — only
  `authorize`, `token`, `userinfo`, `revoke`, `introspect`, `jwks_uri` are exposed.
  "Logging out" therefore means: revoke this app's own access+refresh tokens
  (`lib/auth/ssoOAuth.ts` `revokeToken()`, called from the `DELETE` handler in
  `app/api/admin/login/route.ts`), and pass `prompt=login` on the next SSO
  authorize request so SSO shows its real login screen instead of silently
  re-approving an still-live SSO browser session. The `post-logout` cookie
  (2-minute TTL, set at logout, consumed by `/api/auth/sso/login`) makes that
  `prompt=login` hint apply no matter which path leads back into SSO next —
  don't remove it in favor of only checking an explicit `?from_logout=true` query
  param; most real navigation paths (dashboard links, bookmarks) never carry one.
- **Cookie domain scoping is deliberate and asymmetric.** `admin-session` /
  `auth-source` are domain-scoped to `.messmass.com` in production (shared across
  subdomains, part of how one SSO login covers this app too). `sso-tokens` (raw
  OAuth credentials) is always host-only — never give it the shared domain, or a
  sibling app's server ends up receiving this app's SSO tokens on every request.
- **`revokeToken()` bounds its own fetch to a 3s timeout.** It runs inline in the
  logout request; an unresponsive SSO must not be able to hang logout indefinitely.
- **Rate limiting is per-path, not one shared bucket.** `middleware.ts`'s
  `rateLimitMiddleware()` keys every request as `${identifier}:${pathname}`
  (`lib/rateLimit.ts`) — `/api/auth/sso/config`, `/api/auth/sso/login`, and
  `/api/auth/sso/callback` each get their own independent 5-requests/15-minutes
  allowance (`RATE_LIMITS.AUTH`, applied to any path under `/api/auth/*` or
  `/api/admin/login` except `DELETE` — see `getRateLimitConfig`). The
  `/api/auth/sso/login` route handler *also* does its own separate manual check
  (`checkRateLimit(\`sso-login:${identifier}\`, ...)`) layered on top of the
  middleware's per-path one, so a single hit there decrements two counters at
  once. It's in-memory and per-process, so a local dev server restart clears all
  of it. Practical consequence when testing locally: a real login round-trip
  touches several independent counters and rarely runs dry — but a page that
  fetches the *same* endpoint on every load (e.g. `/admin/login` calling
  `/api/auth/sso/config` via `checkAuth()` on mount) will exhaust *that one
  path's* budget fast under repeated automated testing, and a 429 there can
  masquerade as "SSO not configured" if the caller silently swallows a failed
  fetch. If you hit unexplained auth failures while testing locally, check for a
  429 on the specific path before assuming a code bug.
- **`@sovereignsquad/gds-core` / `@sovereignsquad/gds-theme`** are already approved
  dependencies (`package.json`), and this app's Mantine theme
  (`lib/ui/mantineTheme.ts`) already spreads `gdsTheme` as its base. Prefer the
  shared `AuthShell` (`@sovereignsquad/gds-core/client`) for any future auth-adjacent
  UI over hand-rolled components — that's what keeps this app visually consistent
  with camera's equivalent screens, which already use it.
- **`AuthShell`'s `footer`/`error` slots wrap their content in `<Text>`/`<p>`
  internally.** Passing block-level Mantine content (`<Stack>`, another `<Text>`)
  into those slots produces invalid HTML nesting and a real React hydration error
  — pass plain strings/`ReactNode` leaves only.

## 5. Local dev-server gotchas (verified this session)

- A `next dev` process left running across a long session (many hot-reloads, a
  container restart) can end up serving stale `_next/static` chunk references —
  symptom: client-side JS silently never hydrates (no console error, `useEffect`s
  never run). Fix: `rm -rf .next` and restart the dev server.
- Reaching an *external* host from Playwright's Chromium (anything not
  `localhost`/`127.0.0.1`) needs the proxy passed explicitly —
  `chromium.launch({ proxy: { server: process.env.HTTPS_PROXY } })` — `curl`
  picks up `HTTPS_PROXY` automatically but Chromium does not.
- Vercel preview deployments sit behind Vercel's own deployment-protection SSO
  gate by default (`vercel.com/sso-api` redirect) — a `net::ERR_CONNECTION_RESET`
  or a `302` to `vercel.com/sso-api` when hitting a preview URL is that gate, not
  an app bug. Don't spend time debugging it as one.

## 6. Documentation

Update `AGENTS.md` (command reference) and this file (`CLAUDE.md`, operating rules)
in the same change set whenever the behavior or workflow they describe changes.
