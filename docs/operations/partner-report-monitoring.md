# Partner Report Monitoring

## Purpose

This document is the local source of truth for `{messmass}` partner-report operational monitoring after the June 30, 2026 partner-link hardening and cleanup work.

## Active Vercel Alert Rules

- Team default rule: `ar_default`
  - Coverage: Vercel default 5xx error anomaly notifications
  - Scope: team-wide
  - Delivery: autosubscribes team owners and project admins
- Project rule: `ar_019f1a91-4e1b-7218-ac09-5e1fad414d1b`
  - Name: `messmass partner report 4xx anomaly`
  - Coverage: project-scoped 4xx error anomaly notifications for `messmass`
  - Delivery: autosubscribes team owners and project admins

## Why There Are Two Layers

- Vercel native alerts are good at project-level anomaly detection and escalation.
- Partner-report incidents still need a route-specific verification path because the Vercel rule is project-scoped, not `/partner-report/*` scoped.
- The repo-owned query script closes that gap by checking `partner-report` traffic directly.

## Checked-In Alert Rule Body

Rule manifest:

- [messmass-partner-report-4xx-anomaly.json](./alerts/messmass-partner-report-4xx-anomaly.json)

Recreate the rule if it is ever deleted:

```bash
cd <repo-root>
npx vercel alerts rules add --project messmass --body docs/operations/alerts/messmass-partner-report-4xx-anomaly.json
```

Inspect the live rule:

```bash
cd <repo-root>
npx vercel alerts rules inspect ar_019f1a91-4e1b-7218-ac09-5e1fad414d1b
```

List all rules in scope:

```bash
cd <repo-root>
npx vercel alerts rules ls
```

## Route-Specific Runtime Audit

Primary command:

```bash
cd <repo-root>
npm run ops:partner-report:logs
```

Failing health-gate variant:

```bash
cd <repo-root>
npm run ops:partner-report:logs:fail
```

Direct JSON output:

```bash
cd <repo-root>
node scripts/auditPartnerReportLogs.mjs --json
```

## Query Contract

The audit script:

- queries Vercel production runtime logs for `partner-report`
- summarizes sampled status, domain, source, and level counts
- performs explicit `4xx` and `5xx` filtered scans
- exits non-zero when `--fail-on-errors` is used and any partner-report `4xx` or `5xx` entries are found

## Expected Healthy State

- partner-report `4xx count = 0`
- partner-report `5xx count = 0`
- `307` responses may exist for legacy slug or ObjectId redirects into canonical UUID partner routes
- `200` responses should dominate normal report-open traffic

## Known Constraint

The Vercel rule catches anomaly conditions at project scope. The local audit script remains necessary for precise `/partner-report/*` verification and for incident follow-up after a user reports a broken partner report.
