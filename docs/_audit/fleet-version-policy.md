# Fleet version policy — one version, in lockstep

Decision 2026-08-20 (fleet remediation): all four SEYU apps carry a single
shared version and bump together from here. This is the "same version from now
on" foundation.

## The unified version
`12.2.0` — adopted by messmass, camera, fanmass, and try-on simultaneously.

Rationale: messmass was already the furthest ahead (12.1.95) and its
`version:verify` gate enforces a monotonic-forward guarantee, so the only
semver-safe direction is highest-wins — the other three rise to 12.2.0 rather
than messmass moving backward. The minor bump (…1.95 → 2.0) marks the
unification milestone.

## Where the version lives per app
- **messmass**: `package.json` (source of truth) + `npm run version:update` +
  release-notes entry + 7 doc headers + `version:verify` gate.
- **camera**: `package.json` + its release-notes file.
- **fanmass**: `frontend/package.json` + `app = FastAPI(version=...)`.
- **try-on**: `package.json` + the app-server/worker version banners.

## Rule from here
Any release bumps ALL FOUR to the same new version in the same coordinated
change, even if an app has no functional change that cycle (a version-only
commit is acceptable). The fleet map's edge SHAs and this file are updated in
the same PR. Enforced by the Wave 4 anti-rot checks (messmass#354/#355).
