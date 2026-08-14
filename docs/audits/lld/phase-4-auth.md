# Phase 4 — Authentication, Authorisation & Trust Boundaries (LLD draft)

Status: Active
Last Updated: 2026-08-15T01:30:00.000Z
Canonical: Yes (phase record)
Owner: Architecture

**Version:** 12.1.61

Phase 4 of `docs/audits/lld-audit-plan-2026-08-14.md`, written to the section
template approved in `phase-1-viewpoints.md` §6. Phase 9 assembles these drafts
into `docs/low-level-design.md`.

**Status: complete for the four flows in scope.** Admin sessions, page passwords,
machine tokens and CSRF are documented below. One finding (F-011) is recorded but
not remediated, because remediation would take live integrations down and nobody
has authorised that.

---

## Scope note: the ledger's domain column under-serves this phase

The `domain` column assigned only 9 units to `auth`. That is correct but useless
here: auth primitives are reached from every domain, so the graph classifies them
`shared`. `lib/apiAuth.ts` landed in `public`, `lib/authLockout.ts` in
`unreached`.

Phase 4 is therefore delimited **by function**, not by the domain column — the
2,366 lines below — and the ledger rows are dispositioned against that list. This
is a limitation of the instrument, recorded so later phases do not trust the
column beyond what it can carry.

| Module | Lines | Role |
|---|---:|---|
| `lib/users.ts` | 348 | User records, role type, `findUserById` |
| `lib/pagePassword.ts` | 388 | Page-password storage and verification |
| `lib/apiAuth.ts` | 374 | Bearer-token API auth |
| `lib/csrf.ts` | 197 | CSRF token issue and verification |
| `lib/sessionTokens.ts` | 182 | Session token mint/validate, dual format |
| `lib/auth/ssoOAuth.ts` | 249 | SSO OAuth exchange |
| `lib/auth/mintSession.ts` | 147 | Session cookie minting |
| `lib/permissions.ts` | 139 | Role hierarchy, menu permissions |
| `lib/auth.ts` | 115 | `getAdminUser` — the session read path |
| `lib/authLockout.ts` | 81 | Dead (F-008) |
| `lib/auth/oauthPendingCookie.ts` | 55 | OAuth state cookie |
| `lib/auth/ssoPermissions.ts` | 54 | SSO permission mapping |
| `lib/auth/orgGuard.ts` | 37 | Organisation guard |

---

## Flow 4.1 — Admin session validation

### 1. Purpose & trigger

Establishes who is making a request. Triggered on every request to `/admin/**`,
`/dashboard/**` and any API route that calls `getAdminUser()` — **61 of 182 API
routes**. Boundary: browser cookie → server identity.

Sessions are minted only through SSO. Local credential login is
`410 Gone` (`app/api/admin/login/route.ts:23`).

### 2. Contract

**Input:** `admin-session` cookie (HttpOnly, `secure` in production, `SameSite=Lax`,
7-day `maxAge`, domain `.messmass.com` in production —
`lib/auth/mintSession.ts:98-108`). Two companion cookies are set **non-HttpOnly**:
`auth-source` and, when JWT is enabled, `session-format`.

**Output:** `AdminUser | null` — `id`, `name`, `email`, `role`, `permissions`,
`apiKeyEnabled`, `apiUsageCount`, `lastAPICallAt`, `organizationIds`.

**Failure mode:** every failure returns `null`. There is no distinction between
"no cookie", "invalid token", "expired token" and "user no longer exists" — all
four collapse to unauthenticated. Adequate for callers; poor for diagnostics.

`permissions` is not a real capability set — see F-005.

### 3. Data touched

`users` collection, read-only on this path: `findUserById` (`lib/users.ts:82-86`)
does `findOne({_id})` after an `ObjectId.isValid` shape check. No status or
activity filter is applied, because `UserDoc` has no such field — there is no
account-deactivation feature, so no revocation path is being bypassed.

No session collection exists. **Sessions are stateless**, which is the root
enabler of F-002: there is nothing server-side to revoke against or compare to.

### 4. Runtime sequence

1. `middleware.ts:24` — for `/admin/**`, redirect to login if the cookie is
   *absent*. Presence only; the value is never validated here (F-003).
2. `middleware.ts:37` — for `/admin/dashboard**`, when `SSO_BASE_URL` is set,
   require `auth-source === 'sso'`. This cookie is **not HttpOnly**
   (`mintSession.ts:120`), so it is client-writable; it is a routing hint, not a
   control.
3. Route/page calls `getAdminUser()` (`lib/auth.ts:30`).
4. `validateSessionToken(value, format)` (`lib/sessionTokens.ts:158`) — the
   `session-format` hint comes from a client-writable cookie, and when absent the
   format is inferred from the token's shape.
5. JWT path: `jwt.verify` with HS256 — signature and expiry enforced.
   Legacy path: Base64 decode, field presence, `expiresAt > now`. **No signature.**
6. `findUserById(tokenData.userId)` — the id comes from the token.
7. Map to `AdminUser`; role is taken from the **database record**, not the token.

Failure path: any step returning null yields an unauthenticated caller. The
role-from-database step is what prevents the forged `role` field in F-002 from
escalating privilege directly.

### 5. Trust boundary

**Yes — this is the primary authentication boundary.**

| Control | State |
|---|---|
| Authentication | SSO only; local login 410 |
| Token integrity | **Absent on the legacy path** (F-002) |
| Token confidentiality | HttpOnly, `secure` in production |
| Expiry | Enforced, but client-editable on the legacy path (F-002) |
| Revocation | **None** — stateless sessions, no server-side store |
| Authorisation | Not performed here; role is returned for callers to check |
| Brute-force | Not applicable — SSO owns credentials |

**STRIDE:**

- **Spoofing** — realised. Unsigned legacy tokens permit identity forgery given a
  valid ObjectId (F-002).
- **Tampering** — realised. Any field in a legacy token is editable, including
  `expiresAt` (F-002).
- **Repudiation** — `logAuthSuccess` records login (`mintSession.ts:116`), but a
  forged session produces no login event at all, so impersonation is unlogged.
- **Information disclosure** — cookie is HttpOnly and `secure` in production.
- **Denial of service** — rate limiting applies via middleware.
- **Elevation of privilege** — blocked on this path because role is re-read from
  the database. F-005 is the latent counter-case.

**ASVS 4.0 gaps:** V3.2.1 (session tokens must be generated with approved
cryptography — the legacy path fails), V3.3.1 (logout/expiry must invalidate
server-side — no server-side state exists to invalidate).

### 6. Algorithm

Not applicable — no non-obvious computation.

### 7. State model

Not applicable — a session is valid or not; there are only two states and no
lifecycle transitions beyond expiry.

### 8. Failure & recovery

The path is read-only, so it cannot leave partial state. Recovery from a bad
session is to clear the cookie: `app/api/admin/clear-cookies/route.ts` and
`app/api/admin/login/route.ts:67` both blank `admin-session`.

**There is no way to revoke a session that has already been issued.** Rotating
`JWT_SECRET` would invalidate JWT sessions, but not legacy ones, since legacy
validation involves no secret.

### 9. Verification

Executed 2026-08-14 against the pure functions, no production contact:

```
forged unsigned token, no secret:
  detected format: legacy
  validateSessionToken(forged) -> {"userId":"000000000000000000000001","role":"superadmin",…}
  ACCEPTED WITHOUT SIGNATURE: true

expiry handling:
  expired token rejected:                       true
  same token with expiresAt edited -> accepted: true
  JWT with tampered payload rejected:           true
```

Read-only production queries confirmed `page_passwords` = 699 documents and the
single-tenant state of the v3 collections quoted in F-004.

### 10. Open findings

F-002 (Critical), F-003 (High), F-005 (Medium), F-006 (Medium), F-008 (Low).

---

## Flow 4.2 — Page-password protection

**Status: traced, section incomplete.** The security conclusion is established and
recorded as F-001 (Critical, demonstrated); the full contract and the complete
list of affected routes are Phase 6 work.

What is established:

- Client state lives in `sessionStorage` (`components/PagePasswordLogin.tsx:140`),
  not in a cookie and not on the server.
- `lib/pagePassword.ts` is imported only by the two routes that *manage*
  passwords. No content-serving route verifies one.
- Demonstrated: `GET /api/hashtags/filter-by-slug/{slug}` returns HTTP 200 with
  186 projects and 108 aggregated stat keys, unauthenticated, for a slug that has
  a password configured.
- 699 passwords exist across six page types. **`edit` (304) is the largest and
  gates mutation; it has not yet been tested and must be.**

## Flow 4.3 — Machine-token integration auth

### 1. Purpose & trigger

Authenticates non-browser callers. Two separate mechanisms, deliberately distinct:
the fleet integration token used by fanmass and camera across 16 routes under
`app/api/integrations/**`, and the public API's per-user Bearer token serving
`/api/public/**`.

### 2. Contract

**Fleet token** (`requireFanmassIntegrationAuth`, `lib/fanmassIntegration.ts:74`):
accepted as either `Authorization: Bearer <token>` or `X-API-Key: <token>`, both
compared against one configured value. Returns `503
FANMASS_INTEGRATION_NOT_CONFIGURED` when unset and `401 INVALID_INTEGRATION_TOKEN`
when wrong.

**Public API** (`requireAPIAuth`, `lib/apiAuth.ts`): Bearer only — cookies are
explicitly rejected with `401` and a `WWW-Authenticate: Bearer` challenge. The
token resolves to a user, who must additionally have `apiKeyEnabled`; write
operations require `apiWriteEnabled` as well.

### 3. Data touched

Fleet token: none — a config comparison. Public API: reads `users`, and writes
usage counters (`apiUsageCount`, `lastAPICallAt`) asynchronously so tracking never
blocks the response.

### 4. Runtime sequence

Guard runs first in each handler, before any body parsing or database work, so an
unauthenticated caller cannot trigger work. `/api/integrations/**` is exempt from
CSRF (`lib/csrf.ts:179`) — correctly, since CSRF defends cookie-borne authority and
these callers present a bearer credential.

### 5. Trust boundary

**Yes.** Fails closed when unconfigured, which is the right default: a missing
token disables the integration rather than opening it.

Two weaknesses:

- **Token comparison is `!==`**, not constant-time (`lib/fanmassIntegration.ts:83`).
  Remote timing attacks against a high-entropy token are impractical, and
  `lib/csrf.ts` already contains a `timingSafeEqual` helper that could be reused.
  Low severity, recorded rather than fixed.
- **The public API's key is the user's plaintext password** — F-011, High.

**STRIDE.** Spoofing needs the token; the shared fleet token means fanmass and
camera are mutually indistinguishable, so a compromise of either is a compromise of
both. Repudiation: the public API records per-user usage, the fleet token records
nothing attributable. Elevation: bounded by `apiKeyEnabled` / `apiWriteEnabled`.

### 6–8. Algorithm / State / Failure

Not applicable — stateless comparison, no computation, no partial state.

### 9. Verification

`/api/public/partners` rejects unauthenticated callers
(`app/api/public/partners/route.ts:51`, confirmed by reading and by the earlier
F-001 sweep, where it was the one route that correctly refused). Production
credential state for F-011 verified read-only.

### 10. Open findings

F-011 (High). Non-constant-time fleet token comparison (Low, recorded here).

---

## Flow 4.4 — CSRF

### 1. Purpose & trigger

Protects cookie-authenticated state-changing requests from cross-site forgery.
Runs in `middleware.ts:82` on every request before any handler.

### 2. Contract

Double-submit cookie: a token is issued at `GET /api/csrf-token` and set as a
cookie; the client echoes it in `x-csrf-token`. A mismatch is `403
CSRF_TOKEN_INVALID`.

### 3. Data touched

None — the token is self-contained in cookie and header.

### 4. Runtime sequence

Exempt: `GET`, `HEAD`, `OPTIONS` (`lib/csrf.ts:164`), and `/api/integrations/**`
(`:179`). Enforced for everything else under `/api/`. `lib/apiClient.ts`'s
`ensureCsrfToken` fetches the token automatically, which is why application code
does not handle it explicitly.

### 5. Trust boundary

Supporting control, not an authentication boundary — a distinction that matters
here, because F-009 showed CSRF standing alone in front of an unauthenticated
`DELETE`, and a CSRF token is obtainable by anyone.

**Comparison is constant-time** (`timingSafeEqual`, `lib/csrf.ts:32`, with a
length check first). Correctly implemented.

One operational note: `ENABLE_CSRF_PROTECTION` disables the whole control when set
to the string `'false'` (`lib/csrf.ts:95`). Default-on, which is the right
polarity, but it is a single environment variable away from off.

### 6–8. Algorithm / State / Failure

Not applicable.

### 9. Verification

Exercised repeatedly during this phase: state-changing requests without a token
return `403 CSRF_TOKEN_INVALID`; with a token fetched from `/api/csrf-token` and a
matching cookie they proceed. That behaviour is what made the F-009 demonstration
possible and is confirmed working.

### 10. Open findings

None specific to CSRF. Its role is bounded correctly; the failure in F-009 was
relying on it for a job it does not do.

---

## Phase 4 exit checklist

- [x] Auth surface delimited by function (§ scope note)
- [x] Admin session flow documented to template
- [x] Trust boundary assessed against ASVS and STRIDE
- [x] Claims verified by execution, not reading (§9)
- [x] Findings registered with severity and evidence
- [x] Page-password flow completed — `edit` type verified end to end
- [x] Machine-token flow documented
- [x] CSRF flow documented
- [ ] Ledger rows dispositioned for all 13 modules (Phase 9)
