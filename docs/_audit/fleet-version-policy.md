# Fleet version policy — one version, in lockstep

Decision 2026-08-20 (fleet remediation): all five SEYU apps carry a single
shared version and bump together from here. This is the "same version from now
on" foundation.

## The unified version
`12.3.39` — fleet release 2026-09-30 (messmass, camera, fanmass, try-on,
savetheworld).

History: `12.2.0` was adopted by all four on 2026-08-20, but the apps then
bumped independently (messmass reached 12.3.27, camera 12.2.24, fanmass and
try-on 12.2.3) because the rule below was documented, not enforced. On
2026-09-08 the three siblings rose to messmass's next number, 12.3.28, in one
coordinated change (a2e6cb39). Highest-wins again: messmass's `version:verify`
gate only moves forward. savetheworld joined the fleet at 12.3.31. The rule
slipped once more: 12.3.36 (2026-09-14/15) reached messmass, camera and
savetheworld but not fanmass or try-on, which stayed on 12.3.35 until 12.3.37.
12.3.38 (2026-09-29) was a camera-only security release (dependency
advisories reachable in production); the other four went from 12.3.37 straight
to 12.3.39, the next fleet release.

Rationale: messmass was already the furthest ahead (12.1.95) and its
`version:verify` gate enforces a monotonic-forward guarantee, so the only
semver-safe direction is highest-wins — the other three rise to 12.2.0 rather
than messmass moving backward. The minor bump (…1.95 → 2.0) marks the
unification milestone.

## Where the version lives per app
- **messmass**: `package.json` (source of truth) + `npm run version:update`
  (lockfile + every current doc's `Version:` stamp) + release-notes entry +
  `version:verify` gate.
- **camera**: `package.json` + its release-notes file.
- **fanmass**: `frontend/package.json` + `app = FastAPI(version=...)`.
- **try-on**: `app = FastAPI(version=...)` in `app.py` only (`package.json`
  has no version field; `PIPELINE_VERSION` 1.1.0 in the queue worker is a
  separate pipeline contract, not the fleet version).
- **savetheworld**: `package.json` + its release-notes file under `docs/`.

## Rule from here
Any release bumps ALL FIVE to the same new version in the same coordinated
change, even if an app has no functional change that cycle (a version-only
commit is acceptable). The fleet map's edge SHAs and this file are updated in
the same PR. Enforced by the Wave 4 anti-rot checks (messmass#354/#355).

Bumps are made with each repo's own version tooling, never by find-and-replace
of the old version string across docs (that re-dated past fixes before
12.3.37). In messmass: set `package.json`, then `npm run version:update`, which
syncs the lockfile and the `Version:` stamp lines of current docs and nothing
else (`scripts/update-version.js`).
