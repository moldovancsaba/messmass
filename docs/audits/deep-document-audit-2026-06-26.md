# Deep Documentation Audit

Date: 2026-06-26

Scope:

- Messmass: `/Users/Shared/Projects/messmass`
- Fanmass: `/Users/Shared/Projects/fanmass`
- Current Messmass version: `12.1.16`
- Fanmass frontend version: `0.2.1`

## Audit Result

The current documentation gate passes after the fixes applied during this audit:

- `npm run docs:audit` passes.
- Markdown link check passes.
- Current Messmass docs scanned by the gate: 108.
- Broken Markdown links under `docs/`: 0.
- Fanmass docs show no critical version or delivery-state drift after the status correction.

## Fixes Applied During This Audit

The audit found and corrected current-doc drift that was not covered by the previous gate:

- `READMEDEV.md` referenced missing docs: `docs/APP_NAVIGATION.md`, `docs/BRAIN_DUMP.md`, and `docs/INGESTION.md`.
- `docs/low-level-design.md` still displayed `Version: 12.1.15`.
- `docs/features/features-hashtag-system.md` still displayed `11.25.1`.
- `docs/design/design-layout-system.md` still displayed `11.55.1`.
- `docs/design/design-layout-grammar-compliance.md` still displayed `11.46.2`.
- `docs/operations/messmass-fanmass-integration-delivery-plan-2026-06-25.md` still described the initial MF sequence as Todo/Backlog after delivery.
- Input-system guides referenced missing `docs/fixes/NUMERIC_INPUT_CONSISTENCY_FIX.md` and moved `LEARNINGS.md`.
- `docs/conventions/conventions-variable-dictionary.md` referenced a not-created variable management guide as if it were a target doc.
- `docs/landing-overhaul-plan.md` referenced `docs/api-reference.md` instead of `docs/api/api-reference.md`.
- Contract-local `Version: 1.x` labels were renamed to `Spec Version` so product-version checks stay meaningful.
- `scripts/docs-consistency-audit.js` now catches the missed `**Version:**`, plain `Version:`, and moved-doc reference patterns.

## Current P0 Findings

None found in current docs after remediation.

Definition used for P0:

- Active docs advertise a missing production route.
- Active docs point contributors to missing canonical files.
- Active docs display a product version that contradicts `package.json`.
- Active docs describe delivered GitHub work as still Todo/Backlog.

## Current P1 Findings

### 1. Architecture docs still mix current architecture and historical release narrative

Evidence:

- `docs/architecture.md` contains many historical version sections and old design-era wording.
- Some historical sections remain useful, but they are mixed into the active architecture document.

Impact:

- Readers can confuse historical implementation notes with current architecture.
- Search results can surface old guidance before current GDS-first guidance.

Recommended remediation:

- Split `docs/architecture.md` into a smaller current architecture document plus archived history.
- Keep current runtime contracts, data models, route maps, and component boundaries in the active document.
- Move old version-history narratives into archive or release notes.

### 2. Meta docs inventory and canonical map appear stale

Evidence:

- `docs/_meta/meta-docs-inventory.md` and `docs/_meta/meta-canonical-map.md` still show older last-updated values and line counts for several docs that were recently modified.

Impact:

- The meta index can mislead contributors about canonicality, freshness, and doc size.

Recommended remediation:

- Add or update a docs inventory generator.
- Include inventory freshness in `npm run docs:audit`.
- Fail the audit when tracked docs change without regenerated inventory metadata.

### 3. Root-level legacy release-note files need final disposition

Evidence:

- `docs/release-notes-11.57.0.md`, `docs/release-notes-11.58.0.md`, and `docs/release-notes-11.59.0.md` remain outside `docs/operations/operations-release-notes.md`.
- Meta docs mark them as reference-style entries, not canonical release history.

Impact:

- Contributors may update old standalone release notes instead of the current operations release notes.

Recommended remediation:

- Either archive these standalone release notes or add a visible reference-only banner at the top of each file.
- Keep `docs/operations/operations-release-notes.md` as the only active release-notes destination.

### 4. Documentation gate should validate file references more precisely

Evidence:

- A broad one-off scan found many apparent missing file references, but many were false positives caused by extension shorthand, `.ts` versus `.tsx`, or code examples.
- The current audit gate blocks known-bad paths, not all missing local file references.

Impact:

- New missing-file references can still be introduced if they are not in the known-bad list.

Recommended remediation:

- Add a smarter local-reference parser that understands Markdown links, inline code, route placeholders, and extension fallbacks.
- Treat archive docs and code examples differently from current implementation references.

## Current P2 Findings

### 1. TODO/deprecated wording is noisy but mostly intentional

Evidence:

- Current docs include many instances of `placeholder`, `deprecated`, and historical version notes.
- Most occurrences are examples, policy statements, or historical explanation rather than actionable stale content.

Recommended remediation:

- Add an audit category for actionable TODO/FIXME only.
- Ignore examples and policy text unless the sentence claims current implementation status.

### 2. Fanmass docs are small and currently low-risk

Evidence:

- Fanmass README and frontend package version both show `0.2.1`.
- The Messmass integration delivery plan now describes the MF issue sequence as delivered MVP baseline.

Recommended remediation:

- Add a Fanmass docs audit script equivalent to Messmass if the doc set grows beyond the current small surface.

## Automation Status

Current Messmass automation:

- `npm run docs:audit`
- `scripts/docs-consistency-audit.js`
- `scripts/docs_link_check.py`
- `docs/_meta/meta-docs-consistency-audit.md`
- `docs/_meta/meta-docs-link-check.md`

Gaps:

- No precise local file-reference audit yet.
- No meta inventory freshness check yet.
- No Fanmass-local docs audit command yet.

## Recommended Next Work

1. Split current architecture from historical architecture narrative.
2. Generate and validate docs inventory/canonical map freshness.
3. Archive or banner standalone legacy release notes.
4. Add precise local-file-reference validation to `npm run docs:audit`.
5. Add a lightweight Fanmass docs audit command when the documentation surface grows.

## Commands Run

```bash
npm run docs:audit
git status --short
rg -n "12\\.1\\.(1[0-5])|11\\.|10\\.|TailAdmin|DynamicChart|/api/admin/hashtag-categories|/api/public/events/\\[id\\]/stats|/api/projects/\\[id\\]/google-sheet|TECH_AUDIT_REPORTING_SYSTEM|CODING_STANDARDS\\.md|RELEASE_NOTES\\.md|ROADMAP\\.md|TASKLIST\\.md" README.md READMEDEV.md docs --glob '!docs/archive/**' --glob '!docs/audits/**'
rg -n "TODO|FIXME|TBD|placeholder|coming soon|not implemented|deprecated|obsolete|Todo|Backlog" README.md docs frontend --glob '!frontend/node_modules/**'
```
