# Tutorial: Authentication, roles & SSO
Status: Active
Last Updated: 2026-07-20T00:00:00.000Z
Canonical: Yes
Owner: Documentation

> Audience: Operators and technical implementers · Prerequisites: Admin sign-in for most tasks; environment access for setup · Related: [Sharing & access](guides-tutorial-sharing-access.md), [Organisations](guides-tutorial-organisations.md), [Bitly integration](guides-tutorial-bitly.md)

## What it is & why it matters

messmass controls who can do what through a small number of cooperating mechanisms. Getting them right is what keeps event data private while still letting employees, partners and integrations do their jobs.

There are three ways to be recognised by messmass:

1. **Admin sign-in** — an email + password checked against the `users` collection. This grants a session and access to the admin console.
2. **Page passwords** — per-page share links that let someone view or edit a single event without any admin account (recapped below; covered fully in [Sharing & access](guides-tutorial-sharing-access.md)).
3. **API keys** — a user's password used as a Bearer token for the public REST API, so external systems can read (and, when permitted, write) data.

On top of admin sign-in, an optional **DoneIsBetter SSO** flow lets an organisation use its own identity provider instead of local passwords.

Why it matters: these layers are the difference between "a partner can see their own event report" and "anyone can edit anyone's data." The role attached to each user, and the flags on their account, decide the blast radius.

## Before you start

- **To manage users or sign in to the console** you need an admin account already present in the `users` collection.
- **To enable SSO or the production security flags** you need access to the deployment environment variables.
- **Never paste secret values anywhere in the app or in documentation.** Everything below refers to environment variables and account fields by name only.

## Step by step

### 1. Sign in to the admin console

Go to **`/admin/login`** and enter your email and password. Emails are matched case-insensitively (they are normalised to lowercase). On success you receive an `admin-session` cookie (HttpOnly, valid for seven days), and the middleware lets you into `/admin/*`. The public admin routes that never require a session are `/admin/login`, `/admin/register` and `/admin/clear-session`; everything else under `/admin` redirects to the login page when you are not authenticated.

### 2. Understand the roles

Users carry one of five roles (`UserRole`): **guest**, **user**, **admin**, **superadmin**, **api**.

- **guest** — the lowest tier, for minimal or no console privileges.
- **user** — an authenticated account intended for day-to-day, non-privileged work.
- **admin** — full access to the admin console and its management screens.
- **superadmin** — the top tier; a superadmin passes every permission check unconditionally.
- **api** — an account intended for programmatic access rather than interactive console use.

Permission checks combine the role with a permission list. A superadmin short-circuits to "allowed" for any permission; other roles are checked against their granted permissions.

| Role | Intended use | Rough capability |
|------|--------------|------------------|
| `guest` | Minimal / no console access | Lowest tier |
| `user` | Everyday authenticated work | Non-privileged account |
| `admin` | Console management | Full admin console |
| `superadmin` | Platform owner | Passes every permission check |
| `api` | Programmatic access | Designated for integrations |

> Note: The role-to-permission mapping is still evolving in the codebase — superadmin is the reliably all-powerful tier, while the finer-grained distinctions between guest/user/admin are applied per screen and per API route rather than by a single global table. Treat superadmin as "everything," admin as "console management," and guest/user/api as increasingly restricted, and verify a specific screen's behaviour if the exact boundary matters.

Permission checks combine the role with a permission list, so a route can demand a specific capability (for example the ability to manage users) rather than a specific role. Superadmin is the escape hatch that always passes.

### 3. Recap: page-password sharing

When you need to give someone access to just one event — a client viewing a stats page, or an operator editing a single event — generate a **page password** instead of an account. Each page (stats, edit or filter) gets its own 32-character token that you share along with the link. Admin sessions bypass page passwords entirely. This is the right tool for external, scoped, temporary access. The full workflow is in [Sharing & access](guides-tutorial-sharing-access.md).

> Note: A page password grants access to one page only; it is not an account and carries no role. Revoke access by regenerating that page's password.

### 4. Optional: enable DoneIsBetter SSO

Set the environment variable **`SSO_BASE_URL`** to your DoneIsBetter instance to turn SSO on. When it is set:

- The login page shows a **"Sign in with DoneIsBetter"** option.
- `/api/auth/sso/login` redirects the user into the SSO provider.
- `/api/auth/sso/callback` validates the returned token against `SSO_BASE_URL/api/validate`, looks the user up **by email**, and — on a match — issues the same `admin-session` cookie plus an `auth-source=sso` marker, then returns the user to `/admin` (or to another safe path that starts with `/admin`).

**SSO does not create accounts.** The email returned by the identity provider must already exist in the `users` collection; if it does not, the callback redirects to the login page with a `no_account` error. Provision the user in messmass first, then let them sign in through SSO.

When SSO is configured, dashboard routes are held to a higher bar: `/admin/dashboard` (and the extended `/dashboard` analytics routes) require an SSO-backed session, while other admin routes still accept a local session as a fallback.

The SSO sign-in flow, end to end:

1. The user clicks "Sign in with DoneIsBetter" on `/admin/login`.
2. `/api/auth/sso/login` redirects them into the SSO provider at `SSO_BASE_URL`.
3. After they authenticate there, the provider redirects back to `/api/auth/sso/callback` with a token.
4. The callback validates the token against `SSO_BASE_URL/api/validate` and reads the user's email.
5. It looks the email up in the `users` collection. **No match → redirect to login with `no_account`.**
6. On a match it issues the `admin-session` cookie plus `auth-source=sso` and returns the user to a safe `/admin` path.

### 5. Optional: use the public REST API

The public API authenticates with a **Bearer token that is the user's password**, and only for users whose account has API access switched on. This keeps integration accountability tied to a real user record: every API call is attributable to the account whose key was used.

- **Read access** requires the account's `apiKeyEnabled` flag to be true. Send `Authorization: Bearer <key>` — and **do not send cookies** (the API rejects cookie-bearing requests; it is Bearer-only).
- **Write access** requires **both** `apiKeyEnabled` **and** `apiWriteEnabled`. Read-enabled keys that try to write get a 403 explaining that write access is not enabled.

Usage is tracked per call (and separately for writes) for auditing. Turn these flags on only for the specific integration accounts that need them.

A minimal read request looks like this (values shown as placeholders — never commit a real key):

```
GET /api/... HTTP/1.1
Host: messmass.com
Authorization: Bearer <the-user-password-acting-as-api-key>
```

The same request with a `Cookie` header would be rejected with `COOKIES_NOT_ALLOWED`. A write request to a create/update endpoint additionally needs the account's write flag; without it the response is a 403 with `WRITE_ACCESS_DISABLED`.

| Scope | Requires | Middleware behaviour |
|-------|----------|----------------------|
| Read | `apiKeyEnabled = true` | Rejects missing/invalid tokens and any cookie-bearing request |
| Write | `apiKeyEnabled = true` **and** `apiWriteEnabled = true` | Read auth first, then a separate write-permission check |

## Managing it

- **Sessions.** The `admin-session` cookie is HttpOnly, SameSite=Lax, Secure in production, and expires after seven days. A `session-format` marker tells messmass whether the token is a signed JWT or the legacy encoding. Logout deletes the cookie.
- **Turn on the production security flags.** In production the app **refuses to start** unless all four security feature flags are enabled. Set each to `true`:
  - `ENABLE_BCRYPT_AUTH` — hash passwords with bcrypt instead of storing them in plaintext.
  - `ENABLE_JWT_SESSIONS` — issue cryptographically signed session tokens instead of unsigned ones.
  - `ENABLE_HTML_SANITIZATION` — sanitise rendered HTML to block XSS.
  - `ENABLE_SAFE_FORMULA_PARSER` — evaluate chart formulas with the safe parser instead of a raw function constructor.
  A startup check lists exactly which flags are missing and how to fix them, so a misconfigured production deploy fails loudly rather than running insecurely.
- **User management** is done from the admin console (create users, regenerate a user's password, toggle API and write access, delete users). Passwords double as API keys, so regenerating a password also rotates that user's API key.
- **Middleware runs on every request.** Before a request reaches a route handler, the middleware enforces admin-route protection, rate limiting, CSRF checks on state-changing methods, and CORS. This is why direct `fetch` POST/PUT/DELETE calls from the browser need the CSRF token that the app's own API client attaches automatically — hand-rolled requests without it are refused.
- **Two audiences, two authenticators.** Interactive console/dashboard users authenticate with the session cookie; integrations authenticate with a Bearer key. Keep them separate: never try to drive the public API with a browser session, and never expect a Bearer key to unlock the console UI.

### Which access method for whom?

| Situation | Use | Why |
|-----------|-----|-----|
| An operator managing events all day | Admin account (optionally via SSO) | Full console access, audited session |
| A client who should only view one report | Page password | Scoped to a single page, no account needed |
| An external system reading data | API key (read scope) | Bearer token, no console access |
| An integration writing stats back | API key (read + write scope) | Requires both API flags, deliberately granted |
| An organisation standardising on its own login | SSO | Central identity, but accounts must exist in messmass first |

## Gotchas & good practice

- **SSO requires pre-provisioned accounts.** The most common SSO surprise is a valid corporate login bouncing with `no_account`. Create the user in messmass (with the exact email) before they try SSO.
- **The API is Bearer-only.** If an API call includes a `Cookie` header it is rejected outright. Integrations must authenticate purely with the Authorization header.
- **Read and write are separate scopes.** Enabling API read does not enable write. Grant `apiWriteEnabled` deliberately, only to accounts that must push data.
- **Passwords are credentials and API keys at once.** Because a user's password is also their API token, treat regeneration as a key rotation and update any integration that depends on it.
- **Production must run with all four security flags on.** Do not disable them to "get a build working" — the flags exist because plaintext passwords, unsigned sessions, unsanitised HTML and an unrestricted formula evaluator are each a serious risk.
- **Prefer page passwords for external viewers.** Do not hand out admin accounts for one-off report viewing; scope access to the single page instead.
- **Secrets stay in the environment.** `SSO_BASE_URL`, the security flags, and any API keys are configured as environment variables and account fields — never embedded in the UI or shared in plain text.

### Quick troubleshooting

| Symptom | Likely cause | What to do |
|---------|--------------|------------|
| SSO login bounces with `no_account` | The email is not in the `users` collection | Create the user in messmass with the exact email, then retry |
| Signed in but redirected away from `/admin/dashboard` | SSO configured but the session is local-only | Sign in through SSO; dashboards require an SSO-backed session |
| Production deploy will not start | A required security flag is off | Set all four `ENABLE_*` flags to `true` and redeploy |
| API call returns `COOKIES_NOT_ALLOWED` | The request sent a cookie | Use only the `Authorization: Bearer` header, no cookies |
| API write returns `WRITE_ACCESS_DISABLED` | Account has read but not write | Enable `apiWriteEnabled` on that account |
| Session drops after login | Cookie domain/secure mismatch | Verify the deploy domain and that HTTPS is in use in production |

### Session and cookie reference

| Property | Value |
|----------|-------|
| Session cookie | `admin-session` (HttpOnly, SameSite=Lax, Secure in production) |
| Lifetime | 7 days |
| Format marker | `session-format` (JWT when `ENABLE_JWT_SESSIONS` is on, otherwise legacy) |
| SSO marker | `auth-source=sso` set on SSO logins |
| Logout | Deletes the `admin-session` cookie |

## How it connects

- **Sharing & access** covers the page-password system in depth — the everyday way to give scoped access without accounts. See [Sharing & access](guides-tutorial-sharing-access.md).
- **Organisations** determine which data a signed-in admin can reach; access is scoped by organisation membership. See [Organisations](guides-tutorial-organisations.md).
- **The integrations** — [Bitly](guides-tutorial-bitly.md), [Sport databases](guides-tutorial-sport-databases.md) and [Google Sheets](guides-tutorial-google-sheets.md) — all sit behind admin authentication, and their scheduled jobs are authorised with the `CRON_SECRET` environment variable.

For the full architecture, endpoint list and security-layer detail, see the feature guide at [../features/features-authentication.md](../features/features-authentication.md).

## Screenshots
_Screenshots to be added._

## Related tutorials

- [Sharing & access](guides-tutorial-sharing-access.md)
- [Organisations](guides-tutorial-organisations.md)
- [Getting started](guides-tutorial-getting-started.md)
- [Bitly integration](guides-tutorial-bitly.md)
- [Google Sheets sync](guides-tutorial-google-sheets.md)
