# Documentation Consistency Audit

Date: 2026-06-26

Scope:

- Messmass repository: `/Users/Shared/Projects/messmass`
- Fanmass repository: `/Users/Shared/Projects/fanmass`
- Evidence sources: tracked Markdown/MDX files, package versions, active route files, scripts, selected implementation comments, and generated docs link-check output.

## Executive Summary

The documentation set is not currently reliable enough to use as an implementation contract without cross-checking the code. Markdown links under `docs/` pass the existing link checker, but higher-value consistency checks fail: active docs describe missing API routes, stale component files, missing npm scripts, obsolete governance paths, stale board state, and mismatched version numbers.

The most important issue is not broken Markdown linking. It is semantic drift between active documentation and the implemented runtime surface.

## Inventory

Messmass:

- Tracked Markdown/MDX files audited: 153
- Tracked implementation/config/docs files scanned: 953
- Package version: `12.1.16`
- README version: `12.1.16`
- Generated docs link check: 292 links checked, 0 broken links

Fanmass:

- Tracked Markdown/MDX files audited: 15
- Tracked implementation/config/docs files scanned: 114
- Frontend package version: `0.2.1`
- README version: `0.2.1`

## P0 Findings

### 1. Public API documentation describes a missing stats write endpoint

Evidence:

- `app/api-docs/page.tsx` documents `POST /api/public/events/[id]/stats`
- `app/api/public/events/[id]/stats/route.ts` does not exist
- `app/api/public/events/[id]/route.ts` implements `GET` and `OPTIONS`, not stats writes

Impact:

- External API consumers may implement against an endpoint that returns 404.
- API docs overstate current write capability and can cause integration failure.

Required remediation:

- Either implement `POST /api/public/events/[id]/stats` with contract tests, auth/rate-limit behavior, observability, rollback behavior, and error semantics, or remove the endpoint from the API docs.
- Update examples and response schemas to match the implemented route.

### 2. Google Sheets documentation references missing project-level sync routes

Evidence:

- `docs/features/features-google-sheets-integration.md` documents `POST /api/projects/[id]/google-sheet/pull`
- `docs/features/features-google-sheets-integration.md` documents `POST /api/projects/[id]/google-sheet/push`
- Missing routes:
  - `app/api/projects/[id]/google-sheet/pull/route.ts`
  - `app/api/projects/[id]/google-sheet/push/route.ts`
- Existing sync routes are under partner scope, for example `app/api/partners/[id]/google-sheet/pull/route.ts`

Impact:

- The docs teach the wrong API boundary: project-level paths instead of partner-level paths.
- Future implementation may duplicate an integration surface that already exists elsewhere.

Required remediation:

- Rewrite the Google Sheets docs around the actual partner-scoped contract or deliberately introduce project-scoped routes with migration notes.
- Add route-reference validation to documentation checks.

### 3. Hashtag category API docs do not match the implemented route contract

Evidence:

- `docs/api/api-reference.md`, `docs/architecture.md`, and `docs/operations/ops-warp.md` document `/api/admin/hashtag-categories/[id]`
- `app/api/admin/hashtag-categories/[id]/route.ts` does not exist
- Actual route is `app/api/hashtag-categories/route.ts`
- Actual update/delete contract uses request body/query parameters, not `[id]` path parameters

Impact:

- Admin API documentation is misleading for implementers.
- Test coverage can be written against nonexistent paths.

Required remediation:

- Update API docs to the actual `GET`, `POST`, `PUT`, and `DELETE` contracts under `/api/hashtag-categories`.
- If admin-scoped paths are desired, create the routes and deprecate the current path explicitly.

### 4. Active docs reference a deleted `DynamicChart` component

Evidence:

- `components/DynamicChart.tsx` does not exist
- Active docs still reference it:
  - `docs/architecture.md`
  - `docs/components/components-reusable-components-inventory.md`
  - `docs/operations/ops-warp.md`
- Active code has stale comments referring to `DynamicChart`, for example `lib/chartCalculator.ts`

Impact:

- Component inventory and architecture docs are not trustworthy for UI work.
- Engineers may search for or recreate removed abstractions instead of using the current chart stack.

Required remediation:

- Replace `DynamicChart` references with the actual chart architecture and current component names.
- Add an archive note only if the historical migration context is still useful.

### 5. Developer governance docs reference missing canonical files

Evidence:

- `READMEDEV.md` references missing files such as:
  - `docs/NEXT_PHASES.md`
  - `TASKLIST.md`
  - `ROADMAP.md`
  - `RELEASE_NOTES.md`
  - `docs/operations/WARP.md`
  - `CODING_STANDARDS.md`
- Actual nearby files use different paths, for example:
  - `docs/operations/operations-action-plan.md`
  - `docs/operations/operations-roadmap.md`
  - `docs/operations/operations-release-notes.md`
  - `docs/operations/ops-warp.md`
  - `docs/coding-standards.md`

Impact:

- The onboarding and execution model points contributors to nonexistent governance artifacts.
- Version/status placeholders in `READMEDEV.md` make it look unfinished.

Required remediation:

- Rewrite `READMEDEV.md` to reference only current canonical governance files.
- Remove empty placeholders or populate them from package metadata and current operations docs.

### 6. Security/auth comments overclaim runtime behavior

Evidence:

- `app/api/hashtag-categories/route.ts` comments describe admin-only modification, while the current validation checks for an `admin-session` cookie.
- `app/api/admin/local-users/route.ts` contains historical password-generation wording that conflicts with the current bcrypt migration direction in user utilities and migration scripts.

Impact:

- Security-sensitive comments can mislead reviewers and future implementers.
- Docs and comments may imply stronger controls than the runtime actually enforces.

Required remediation:

- Rewrite security comments to state exactly what the code enforces today.
- Move intended future hardening into tracked issues, not implementation comments.

## P1 Findings

### 7. Active version numbers are inconsistent

Evidence:

- `package.json` and README report Messmass `12.1.16`
- `app/api-docs/page.tsx` footer reports `12.1.10`
- `docs/api/api-reference.md` reports `12.1.12`
- `docs/api/api-public.md` reports `12.1.12`
- Active implementation comments contain many historical version stamps, for example `3.0.0`, `6.x`, `10.4.0`, and `12.2.0`

Impact:

- Release status cannot be trusted from docs alone.
- Version-stamped comments create false precision and drift quickly.

Required remediation:

- Keep the canonical product version in package metadata and render/import it where needed.
- Remove version stamps from implementation comments unless they refer to an external protocol version.

### 8. Design-system documentation is stale relative to current GDS usage

Evidence:

- Active design docs still include historical TailAdmin and removed-class language.
- Current product constraints require UI/UX/frontend work to exclusively use `https://github.com/sovereignsquad/general-design-system`.
- Current implementation uses GDS/Mantine packages and local wrappers in multiple areas.

Impact:

- Frontend contributors may follow obsolete styling guidance.
- Accessibility and mobile layout fixes can diverge from the canonical design system.

Required remediation:

- Rewrite `docs/design/design-system.md` as the canonical GDS adapter guide for Messmass.
- Explicitly document allowed wrappers, forbidden local patterns, responsive behavior, accessibility states, and migration rules.

### 9. Active docs reference missing npm scripts

Evidence:

- `npm run ts-node ...` is documented, but no `ts-node` script exists.
- `npm run build:` appears in release notes as a malformed command.
- `npm run validate:chart-kyc` is referenced as a future command but is not present.

Impact:

- Operational docs contain commands that cannot be executed.
- Release validation instructions are unreliable.

Required remediation:

- Replace incorrect command references with actual scripts or add the missing scripts.
- Add a documentation audit check that validates `npm run` references against `package.json`.

### 10. Comment style is inconsistent and too historical

Evidence:

- Active code mixes `WHAT`, `WHY`, and `HOW` comment blocks with version stamps and release-history notes.
- Several active client files contain debug console logs with emoji/status wording.
- TODO comments often lack issue references or execution ownership.

Impact:

- Code comments add noise instead of clarifying non-obvious behavior.
- Historical comments can conflict with current runtime behavior.

Required remediation:

- Adopt a comment standard: comments explain current non-obvious intent only.
- Remove release-history comments, migrate durable decisions into docs, and link TODOs to GitHub issues.
- Replace production debug logs with structured observability where needed.

## P2 Findings

### 11. Archive and operations docs need clearer canonical status

Evidence:

- Historical release notes, operations learnings, archive docs, and migration notes include stale commands and removed paths.
- Many are valid history, but they are not clearly separated from current execution instructions.

Impact:

- Search results can surface outdated instructions as if they are current.

Required remediation:

- Add a standard banner to archived/historical docs.
- Maintain a short canonical index for current docs and mark older docs as reference-only.

### 12. Fanmass integration plan board state is stale

Evidence:

- `fanmass/docs/messmass-integration-delivery-plan-2026-06-25.md` says MF-101 and MF-102 are in `Todo (NEXT)` and downstream items are in `Backlog (SOONER)`.
- The integration implementation has since been delivered and the MF issues were closed.

Impact:

- Cross-repo delivery status is misleading.
- Future continuation work may start from an obsolete board-state assumption.

Required remediation:

- Update the Fanmass integration delivery plan to separate historical initial sequencing from current delivered state.
- Add a current-state section with delivered issue links and remaining follow-up work.

## Recommended Remediation Plan

### Phase 1: Fix contract-breaking docs

Execution order:

1. Correct or implement `POST /api/public/events/[id]/stats`.
2. Correct Google Sheets API paths or intentionally introduce project-scoped routes.
3. Correct hashtag category API docs to match the actual route contract.
4. Fix `READMEDEV.md` missing governance paths and empty status placeholders.
5. Remove active `DynamicChart` references or replace them with the current chart component architecture.

Acceptance criteria:

- No active API doc references a missing route.
- No active onboarding/governance doc references a missing file.
- Component inventory reflects only existing components or clearly marked historical entries.

### Phase 2: Rebuild canonical architecture and design-system docs

Execution order:

1. Rewrite active architecture docs around current runtime surfaces.
2. Rewrite design-system docs around the General Design System requirement.
3. Update component inventory and UX state documentation.
4. Update API docs version displays from canonical package metadata.

Acceptance criteria:

- The docs define one canonical frontend implementation path.
- Accessibility, mobile responsiveness, GDS usage, and UI states are documented as release blockers.
- Product version appears from a single source of truth.

### Phase 3: Normalize code comments

Execution order:

1. Remove or rewrite misleading security/auth comments.
2. Remove implementation comment version stamps.
3. Replace historical component references in comments.
4. Convert production debug logs into structured logging or remove them.
5. Convert TODO comments into issue-linked work items.

Acceptance criteria:

- Comments describe current behavior or non-obvious intent.
- Security-sensitive comments match runtime enforcement.
- TODOs are traceable to executable issues.

### Phase 4: Add automated documentation consistency checks

Execution order:

1. Add a docs audit script that validates Markdown links, `npm run` references, referenced local files, route references, and version drift.
2. Add `npm run docs:audit`.
3. Run the audit in CI.
4. Generate a machine-readable report under `docs/_meta/`.

Acceptance criteria:

- New doc drift is caught before merge.
- Broken route/script/file references fail CI unless explicitly marked archived.

## Suggested Issue Pack

Create these as independent production-grade issues if the board needs explicit execution tracking:

1. Documentation contract audit automation and CI gate.
2. Public API docs/runtime contract reconciliation.
3. Google Sheets docs/runtime contract reconciliation.
4. Hashtag category API docs/runtime contract reconciliation.
5. Developer governance docs canonicalization.
6. DynamicChart removal from active docs and comments.
7. GDS-first design-system documentation rewrite.
8. Comment hygiene and security-comment correction pass.
9. Archive banner and canonical docs index.
10. Fanmass integration delivery plan current-state update.

## Commands Run

Representative commands used during this audit:

```bash
git ls-files '*.md' '*.mdx' 'package.json' '*.ts' '*.tsx' '*.py'
rg -n "Version|Current release version|npm run|DynamicChart|hashtag-categories|google-sheet|/api/public/events"
python3 scripts/docs_link_check.py
test -e components/DynamicChart.tsx
test -e app/api/public/events/[id]/stats/route.ts
test -e app/api/projects/[id]/google-sheet/pull/route.ts
test -e app/api/admin/hashtag-categories/[id]/route.ts
```

## Audit Conclusion

The documentation problem is structural: current docs, historical docs, and implementation comments are not clearly separated. The next high-value step is to fix P0 contract drift first, then add automated checks so this class of documentation decay does not return.
