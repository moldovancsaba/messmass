# Security Overview
Status: Active
Last Updated: 2026-02-05T00:00:00.000Z
Canonical: Yes
Owner: Security

This is the **single starting point** for security in this repo.

## What Is Canonical (Use These)
- `docs/security/security-enhancements.md` — current API protection & observability design (rate limiting, CSRF, logging, middleware).
- `docs/security/security-migration-guide.md` — how to migrate codepaths to the security stack safely.

## Where The Historical Material Lives (Do Not Treat As Source Of Truth)
- Historical audits, phase completion notes, and reviews: `docs/archive/_archive/security/archive-security-archive-pack.md`

## Operating Rule
If a security behavior described in an archived document conflicts with the codebase, **the code + canonical docs above win**. If the canonical docs conflict with code, update the docs immediately.
