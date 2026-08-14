# LLD Audit — Findings Register

Status: Active
Last Updated: 2026-08-14T20:00:00.000Z
Canonical: Yes (findings register)
Owner: Architecture

**Version:** 12.1.56

Findings from the LLD deep audit (`docs/audits/lld-audit-plan-2026-08-14.md`).
Per rule R5 findings are recorded here and **not fixed on the audit branch**; per
R6 they become board issues. Per R1 every finding carries evidence, and where a
claim is structural rather than demonstrated, it says so.

**Severity** reflects impact **and** whether exploitation was demonstrated:

- **Critical** — verified by execution, live impact today
- **High** — verified in code, impact latent or requires a precondition
- **Medium** — defect with limited or no current impact
- **Low** — hygiene

| ID | Severity | Title | Phase |
|---|---|---|---|
| [F-001](#f-001) | **Critical** | Page-password protection is client-side only; data APIs are unauthenticated | 4 |
| [F-002](#f-002) | **Critical** | Unsigned legacy session tokens are accepted, always | 4 |
| [F-003](#f-003) | High | Middleware admin gate checks cookie presence, never validity | 4 |
| [F-004](#f-004) | High | v3 organisation scoping is not enforced | 4 |
| [F-005](#f-005) | Medium | Identical-branch ternary grants every user the same permissions | 4 |
| [F-006](#f-006) | Medium | Two routes read cookie names nothing ever sets | 4 |
| [F-007](#f-007) | Low | 202 orphaned page passwords for a deleted route | 4 |
| [F-008](#f-008) | Low | `lib/authLockout.ts` is dead code | 4 |

---

## F-001

### Page-password protection is client-side only; data APIs are unauthenticated

**Severity: Critical — demonstrated against live data.**

Page passwords gate the *rendering* of a page in the browser, but the APIs that
serve that page's data have no authentication. Anyone with the URL can fetch the
protected data directly.

**Mechanism.** `components/PagePasswordLogin.tsx:140` stores successful auth in
**`sessionStorage`**, and `isAuthenticated()` (`:229`) reads it back. Pages gate
their data fetch on that client-side check — e.g.
`app/hashtag/[hashtag]/page.tsx:122-128` calls `fetchHashtagData()` only when
`isAuthenticated()` returns true. The server is never consulted:
`lib/pagePassword.ts` is imported by exactly two routes, both of which *manage*
passwords (`app/api/page-passwords/route.ts`,
`app/api/admin/local-users/route.ts`). **No content-serving route validates a page
password.**

**Demonstrated.** Two filter slugs that have a password configured in
`page_passwords`, requested with no cookies, no token, no headers:

```
GET /api/hashtags/filter-by-slug/2c316d59-… → HTTP 200 · 57 projects · 97 stat keys
GET /api/hashtags/filter-by-slug/33549f34-… → HTTP 200 · 186 projects · 108 stat keys
```

`app/api/hashtags/filter-by-slug/[slug]/route.ts` contains no reference to
`getAdminUser`, `requireAPIAuth`, a password check, or a 401/403 path.
`GET /api/hashtags/trustphone` behaves identically (HTTP 200, 35 stat keys).

**Scale.** `page_passwords` holds **699** documents across `edit` (304),
`stats` (202), `event-report` (99), `partner-report` (63), `filter` (30),
`organization-report` (1). This is a feature in active use, not a vestige.

**Not affected:** `/api/public/*` correctly requires a Bearer token via
`requireAPIAuth` (`app/api/public/partners/route.ts:51`). The gap is in the
non-`/public` data routes that back password-gated pages.

**Still to determine (Phase 6):** the full list of affected routes. `edit` (304
passwords) is the highest-value type because it gates *mutation*, and it was not
tested here — it must be, urgently.

---

## F-002

### Unsigned legacy session tokens are accepted, always

**Severity: Critical — verified by execution.**

`validateLegacySessionToken` (`lib/sessionTokens.ts:111`) accepts a Base64-encoded
JSON blob with **no signature verification**. It checks only that required fields
exist and that `expiresAt` is in the future.

Crucially, **nothing gates this path**. `FEATURE_FLAGS.USE_JWT_SESSIONS`
(`lib/sessionTokens.ts:176`) controls only *generation*. Validation
(`validateSessionToken`, `:158`) routes on `detectTokenFormat`, which returns
`legacy` for any token without three dot-separated parts. So legacy tokens are
accepted even when JWT sessions are enabled.

**Verified.** A forged token, no secret involved:

```
detected format: legacy
validateSessionToken(forged) -> {"token":"forged","expiresAt":"2099-01-01…",
                                 "userId":"000000000000000000000001","role":"superadmin"}
ACCEPTED WITHOUT SIGNATURE: true
```

**Two distinct impacts:**

1. **Session expiry is unenforceable — no precondition.** The holder of a session
   reads their own cookie (HttpOnly blocks JavaScript, not browser devtools),
   edits `expiresAt`, re-encodes, and sets it back. Verified: the same token is
   rejected when expired and accepted when the expiry field alone is edited. There
   is no server-side session store to check against.
2. **Impersonation of any user whose id is known.** `lib/auth.ts:53` passes the
   token's `userId` straight to `findUserById`. Role is re-read from the database,
   so the forged `role` field does not escalate — but the *identity* does. An
   attacker who learns any user's ObjectId becomes that user.

**Precondition for impact 2:** a valid 24-hex ObjectId. `findUserById`
(`lib/users.ts:84`) validates the shape, so blind brute force is infeasible. No
id-leaking public endpoint was found in the surfaces sampled, but that sampling
was not exhaustive — Phase 6 must complete it.

**The fix direction is verified to work:** a JWT with a tampered payload is
correctly rejected by `validateJWTSessionToken`. The defect is accepting the
legacy format at all, not the JWT implementation.

**Environment note, unverified:** `ENABLE_JWT_SESSIONS` and `JWT_SECRET` are both
absent from `.env.local`, so locally every minted session is unsigned Base64.
Production runs on Vercel and its environment could not be read from here. This
must be checked by someone with access — but note it does not change the finding,
because legacy validation is accepted regardless of the flag.

---

## F-003

### Middleware admin gate checks cookie presence, never validity

**Severity: High.**

`middleware.ts:24-32` guards `/admin/**`. Its comment reads *"Step 1 - Check
authentication (user has valid session)"*, but the implementation is:

```ts
const adminSession = request.cookies.get('admin-session');
if (!adminSession?.value) { redirect('/admin/login') }
```

Any non-empty cookie value passes. The comment at `:19` also claims it prevents
*"unauthorized/insufficient access"* — "insufficient" implies a role check, and
there is none beyond an SSO-source check for `/admin/dashboard` (`:37-42`).

A textbook R2 case: the comment states intent, the code states behaviour, and they
differ.

Real protection therefore rests entirely on each route calling `getAdminUser`.
**61 of 182 API routes reference it.** The remaining 121 are not necessarily
unprotected — many are legitimately public — but that disposition does not exist
anywhere today, and producing it is Phase 6 work.

---

## F-004

### v3 organisation scoping is not enforced

**Severity: High — latent, no live exposure today.**

`lib/middleware/v3/orgContext.ts:24-26`:

```ts
const v3OrgId = user.permissions?.includes('superadmin')
  ? '69b322e0cb8e841f95de9aa1' // Real Master Organization ID
  : '69b322e0cb8e841f95de9aa1'; // Defaulting to Master for MVP phase
```

Three defects in three lines: both branches are identical; the predicate can never
be true (`permissions` is always `['read','write','delete','manage-users']`, and
`superadmin` is a *role*, never a member of that array — see F-005); and
`user.organizationIds`, which exists on `AdminUser` (`lib/auth.ts:77`), is ignored
while the comment at `:22` calls it "future".

Every authenticated user of **any** role receives the Master organisation scope.
The middleware does authenticate (401 when no user) and does overwrite any
client-supplied `x-v3-org-id` via `headers.set`, so the header is **not**
spoofable — that was checked specifically.

**Why not Critical:** verified read-only against production, every document in
`v3_activities` (459), `v3_metric_values` (36,528) and `report_styles` (21)
carries the same single `organizationId` — the hardcoded Master. There is one
tenant in this data, so there is nothing to leak across. But `organizations` holds
**10** documents. The first time a second organisation's data lands in any of
these collections, every authenticated user reads it.

Affects 12 `/api/v3/*` routes plus `app/api/report-styles/route.ts`, which is not
a v3 route but uses this middleware for its scoping.

---

## F-005

### Identical-branch ternary grants every user the same permissions

**Severity: Medium — latent.**

`lib/auth.ts:62-63`:

```ts
const basePermissions = ['read', 'write', 'delete', 'manage-users']
const permissions = user.role === 'superadmin' ? basePermissions : basePermissions
```

Both branches return the same array, so every authenticated user — including role
`user` — is handed `delete` and `manage-users`.

Impact is limited today because the only consumer of `.permissions` is the broken
predicate in F-004. `hasPermission` (`lib/auth.ts:96`), which would make this
directly exploitable, has **no callers**: the `hasPermission` hits elsewhere in the
repo belong to an unrelated `lib/shareables/auth/types.ts`. Likewise `isAuthenticated`
and `logoutAdmin` in this module are unused — the only import from `@/lib/auth`
across 63 call sites is `getAdminUser`.

The danger is a future author reaching for `hasPermission` and reasonably assuming
it works.

---

## F-006

### Two routes read cookie names nothing ever sets

**Severity: Medium — functional, fails closed.**

`app/api/me/route.ts:26,41` and `app/api/images/route.ts:36,37` read
`admin_session` and `page_auth` (underscores). The session cookie is
`admin-session` (hyphen, `lib/auth/mintSession.ts:119`), and `page_auth` is never
set anywhere — page-password state lives in `sessionStorage` (F-001).

Consequences: `GET /api/images` returns **401 to everyone**, including
authenticated admins, because its gate (`:39`) tests two cookies that cannot
exist. `GET /api/me` always reports `authenticated: false`.

Fails closed, so not a security hole — but the images endpoint is unusable, and
`/api/me` is actively misleading to any client that trusts it.

---

## F-007

### 202 orphaned page passwords for a deleted route

**Severity: Low — hygiene.**

`page_passwords` holds 202 documents with `pageType: 'stats'`, but no
`app/stats/[slug]/page.tsx` exists in the tree. Git history shows the file had 37
commits, so it existed and was removed without cleaning up its passwords.

No security impact. Recorded because it distorts any count taken from that
collection, including F-001's scale figure.

---

## F-008

### `lib/authLockout.ts` is dead code

**Severity: Low.**

81 lines implementing brute-force lockout, with zero callers, flagged `unreached`
by the Phase 0 graph.

**This is expected, not a vulnerability.** Local login returns
`410 Gone` (`app/api/admin/login/route.ts:23`) — messmass is SSO-only, so
credential brute-forcing is the identity provider's concern. Recorded for removal,
not remediation. Deliberately not filed as a missing-control finding, because
asserting that would have been wrong.
