# OPS-SEC-03: Operational hardening

Status: Done (lockout, audit, role naming implemented)
Last Updated: 2026-02-06
Canonical: Yes
Owner: Operations / Security

## 1. Console log removal and guardrail

- **Guardrail (done):** ESLint `no-console` set to `warn` with `allow: ["warn", "error"]` so `console.log` triggers a warning. New code should use `lib/logger` (info, warn, error, debug).
- **Removal:** Legacy `console.log` usage remains across app and scripts; migrate to `lib/logger` or remove over time. Scripts may keep console for CLI output if desired; prefer logger in app/api and lib.

## 2. CORS lockdown

- **Current:** `lib/cors.ts` uses an explicit allowlist via `ALLOWED_ORIGINS` (comma-separated). When unset, only `localhost` / `127.0.0.1` is allowed.
- **Prod/preview:** Set `ALLOWED_ORIGINS` to the exact origins that may access the API (e.g. `https://messmass.com,https://preview.messmass.com`). No wildcards; one origin per entry.
- **Credentials:** `Access-Control-Allow-Credentials: true` is set only when the request Origin is in the allowlist.

## 3. Account lockout policy (done)

- **Goal:** After 5 failed login attempts (per identifier), lock for 15 minutes; do not reveal whether the account exists.
- **Implementation:** `lib/authLockout.ts` — MongoDB collection `auth_lockout` keyed by email; `isLockedOut`, `recordFailedAttempt`, `clearLockout`. Login route checks lock first (same 401 “Invalid credentials”), records failure on invalid password, clears on success. Policy: 5 attempts → 15 min lock.

## 4. Role naming standardization (done)

- **Goal:** Single canonical enum/source for roles; migrate all usages to that source.
- **Done:** Canonical type is `UserRole` in `lib/users.ts` including `'api'`; exported `USER_ROLES` array for validation. `lib/sessionTokens`, `lib/auth`, `lib/permissions`, login route, and role API use `UserRole`. UI (RoleDropdown, unauthorized page) and permissions (ROLE_HIERARCHY, getRoleDisplayName, getRoleBadgeColor) include `api`.

## 5. Audit logging for auth-sensitive events (done)

- **Current:** `lib/logger` exposes `logAuthSuccess`, `logAuthFailure`, and `logAuthLockout`. Admin login route logs success, failure (invalid password), and lockout (rejected due to lock). Lock is cleared on success (no separate “unlock” event; success implies unlock). No user-existence leak in responses.
