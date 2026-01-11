# Security Migration Guide
Status: Active
Last Updated: 2026-01-11T23:51:17.000Z
Canonical: Yes
Owner: Security

## Preconditions and Checklist
- Confirm `middleware.ts`, `lib/rateLimit.ts`, `lib/csrf.ts`, `lib/logger.ts`, and `lib/apiClient.ts` are present.
- Confirm `/api/csrf-token` is available and returns a valid token.
- Identify all state-changing API calls (POST/PUT/PATCH/DELETE).
- Identify any endpoints that should be excluded from rate limiting.

## Step-by-Step Code Changes
1) Client-side requests
- Replace direct `fetch()` calls with `apiGet`, `apiPost`, `apiPut`, `apiDelete`, or `apiRequest` from `lib/apiClient.ts`.
- Ensure error handling covers CSRF and rate limit responses.

2) Server-side routes
- Verify state-changing API routes enforce CSRF validation in middleware.
- Add logging hooks using `logRequestStart`, `logRequestEnd`, and `logRequestError` in `lib/logger.ts` where appropriate.

3) Rate limiting
- Map endpoints to auth/write/read/public classes in `lib/rateLimit.ts`.
- Validate that response headers for rate limits are returned consistently.

## Configuration and Rollout Sequencing
- Deploy to staging first and validate CSRF and rate limiting behavior.
- Roll out to production with a low-traffic window and monitor logs.
- If multi-instance, plan for a shared rate limit store before high traffic.

## Validation and Regression Tests
- State-changing requests without a CSRF token are rejected.
- Requests using `apiClient` include CSRF tokens and succeed.
- Rate limit headers appear on protected routes.
- Security events (CSRF violations, rate limit exceeded) are logged with redaction.

## Rollback Guidance
- Revert to the prior release if CSRF or rate limiting blocks valid traffic.
- Restore direct `fetch()` usage only if `apiClient` is the failure source.
- Roll back middleware changes as a last resort for production recovery.

## Related Documents
- [IMPLEMENTATION_COMPLETE.md](../IMPLEMENTATION_COMPLETE.md)
- [SECURITY_ENHANCEMENTS.md](SECURITY_ENHANCEMENTS.md)
