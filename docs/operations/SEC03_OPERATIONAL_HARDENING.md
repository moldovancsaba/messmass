# OPS-SEC-03: Operational hardening

**Status:** In progress  
**Last updated:** 2026-02-06  
**Owner:** Operations / Security

## 1. Console log removal and guardrail

- **Guardrail (done):** ESLint `no-console` set to `warn` with `allow: ["warn", "error"]` so `console.log` triggers a warning. New code should use `lib/logger` (info, warn, error, debug).
- **Removal:** Legacy `console.log` usage remains across app and scripts; migrate to `lib/logger` or remove over time. Scripts may keep console for CLI output if desired; prefer logger in app/api and lib.

## 2. CORS lockdown

- **Current:** `lib/cors.ts` uses an explicit allowlist via `ALLOWED_ORIGINS` (comma-separated). When unset, only `localhost` / `127.0.0.1` is allowed.
- **Prod/preview:** Set `ALLOWED_ORIGINS` to the exact origins that may access the API (e.g. `https://messmass.com,https://preview.messmass.com`). No wildcards; one origin per entry.
- **Credentials:** `Access-Control-Allow-Credentials: true` is set only when the request Origin is in the allowlist.

## 3. Account lockout policy (planned)

- **Goal:** After 5 failed login attempts (per identifier), lock for 15 minutes; do not reveal whether the account exists.
- **Implementation:** Track failed attempts (e.g. by email or IP) in memory or Redis; return same generic “Invalid credentials” and 401 for both invalid password and locked account; log lockout events for audit.
- **Status:** Not yet implemented; login route has brute-force delay (800 ms) and audit logging (logAuthFailure) only.

## 4. Role naming standardization

- **Goal:** Single canonical enum/source for roles; migrate all usages to that source.
- **Current:** Roles appear as strings (`guest`, `user`, `admin`, `superadmin`, `api`) in `lib/users`, login route, and UI. Define a single type/enum (e.g. in `lib/users` or `lib/permissions`) and use it everywhere; then migrate DB and code.

## 5. Audit logging for auth-sensitive events

- **Current:** `lib/logger` exposes `logAuthSuccess` and `logAuthFailure`; admin login route (`app/api/admin/login/route.ts`) calls them on success and on invalid credentials. No PII in logs; IP can be included.
- **Planned:** Add explicit audit events for lockout (when implemented), unlock, and optionally password change / token revocation; ensure no user-existence leak in responses.
