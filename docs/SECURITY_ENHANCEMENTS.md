# Security Enhancements
Status: Active
Last Updated: 2026-01-11T23:51:17.000Z
Canonical: Yes
Owner: Security

## Threat Model and Goals
- Protect API endpoints from abuse and resource exhaustion.
- Prevent cross-site request forgery on state-changing requests.
- Provide consistent, centralized request logging and security visibility.
- Ensure client-side requests include required security context.
- Minimize performance impact while preserving protection coverage.

## Implemented Controls
1) Rate limiting
- Module: `lib/rateLimit.ts`
- Approach: Token bucket with per-endpoint limits (auth/write/read/public).
- Output: Standard rate limit headers (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`).

2) CSRF protection
- Module: `lib/csrf.ts`
- Pattern: Double-submit cookie, HttpOnly, SameSite=Lax.
- Enforcement: POST, PUT, DELETE, PATCH.

3) Centralized logging
- Module: `lib/logger.ts`
- Scope: Request lifecycle, security violations, performance metrics.
- Redaction: Tokens, cookies, and secrets are removed from logs.

4) Client API wrapper
- Module: `lib/apiClient.ts`
- Purpose: Automatic CSRF token management and unified error handling.

5) Security middleware
- File: `middleware.ts`
- Order: Rate limit check, CSRF validation, request logging, route execution, response logging.

## Architecture and Integration Points
- `middleware.ts`: Entry point for rate limiting, CSRF validation, and logging.
- `lib/rateLimit.ts`: Shared limiter logic for all protected endpoints.
- `lib/csrf.ts`: Token generation, validation, and cookie handling.
- `lib/apiClient.ts`: Client-side wrapper used by UI and data operations.
- `lib/logger.ts`: Structured logging and security event capture.
- `/api/csrf-token`: Token bootstrap endpoint used by `lib/apiClient.ts`.

## Configuration and Operational Guidance
- Adjust per-endpoint rate limits in `lib/rateLimit.ts` for auth/write/read/public classes.
- Ensure `/api/csrf-token` returns a valid token and sets the CSRF cookie.
- Keep middleware enabled for API and admin routes; exclude static assets only.
- Monitor logs for rate limit violations and CSRF rejections.
- For multi-instance deployments, plan a shared rate limit store (Redis adapter).

## Verification and Constraints
- Evidence is documented in `ARCHITECTURE.md` (Security Enhancements section).
- Recommended validation checks:
  - Rate limit headers present on protected routes.
  - State-changing requests fail without CSRF token and succeed with `apiClient`.
  - Security events appear in logs with redaction applied.
- This document does not include independent runtime testing results.

## Related Documents
- [AUDIT_EVIDENCE_INDEX.md](../audits/AUDIT_EVIDENCE_INDEX.md)
- [SECURITY_MIGRATION_GUIDE.md](SECURITY_MIGRATION_GUIDE.md)
