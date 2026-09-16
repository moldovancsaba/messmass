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

## 3. Account lockout policy (not applicable — no local password login)

- **Goal:** After 5 failed login attempts (per identifier), lock for 15 minutes; do not reveal whether the account exists.
- **Status (2026-09-16):** There is nothing here to lock out. `POST /api/admin/login` returns **410 Gone**; authentication is SSO-only, so brute-forcing a local password is not a reachable attack against this app. Rate limiting still applies to every route via `middleware.ts`.
- **What this section used to claim:** an implementation in `lib/authLockout.ts` with a MongoDB `auth_lockout` collection, and a login route that "checks lock first". That module had zero importers for its entire life — the lockout was never wired to any login path, and the collection was never created. It was deleted on 2026-09-16 (F-008, messmass#388) rather than left as dead code implying a control that did not exist.
- **If local login ever returns,** lockout comes back with it, and the control belongs at the SSO service in the meantime — see `sso.doneisbetter.com`, not this repo.

## 4. Role naming standardization (done)

- **Goal:** Single canonical enum/source for roles; migrate all usages to that source.
- **Done:** Canonical type is `UserRole` in `lib/roles.ts` (it lived in `lib/users.ts` until 2026-09-16; moved so that knowing the role names no longer costs a mongodb client at module load) including `'api'`; exported `USER_ROLES` array for validation. `lib/sessionTokens`, `lib/auth`, `lib/permissions`, login route, and role API use `UserRole`. UI (RoleDropdown, unauthorized page) and permissions (ROLE_HIERARCHY, getRoleDisplayName, getRoleBadgeColor) include `api`.

## 5. Audit logging for auth-sensitive events (done)

- **Current:** `lib/logger` exposes `logAuthSuccess`, `logAuthFailure`, and `logAuthLockout`. Admin login route logs success, failure (invalid password), and lockout (rejected due to lock). Lock is cleared on success (no separate “unlock” event; success implies unlock). No user-existence leak in responses.
