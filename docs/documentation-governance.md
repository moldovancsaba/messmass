# Documentation Governance
Status: Active
Last Updated: 2026-02-05T21:07:42.000Z
Canonical: Yes
Owner: Documentation

## Purpose
Keep documentation consistent, up-to-date, and safe to rely on by enforcing:
- one canonical doc per topic (source of truth),
- explicit deprecation/archival rules,
- repeatable checks (inventory/triage/link check).

## Status Taxonomy (Required)
Every `docs/**/*.md` file must include:
- `Status: ...`
- `Last Updated: ...`
- `Canonical: Yes|No`
- `Owner: ...`

Recommended `Status` values:
- `Active`: current and maintained.
- `Reference`: accurate but not the primary entrypoint; may be narrower in scope.
- `Planning`: forward-looking plan; may not reflect current implementation.
- `Archived`: historical; do not treat as source of truth.

## Canonical Policy (Single Source of Truth)
- Each topic must have exactly one canonical doc (or one canonical entrypoint that links to canonical sub-docs).
- Non-canonical docs must either:
  - be `Status: Reference` (if still useful), or
  - be moved into `docs/archive/_archive/` or `docs/archive/`.

## Merge Rule (No Duplication)
When we **merge** a file into another document, the new document includes all important and relevant information. **Delete the old file**—do not keep an archived copy or a redirect stub. Keeping it would create duplication and inconsistency; we do not keep obsolete or irrelevant files. Use **archive** only when superseded *without* merge. **Merge → delete.**

## Deprecation Strategy (Prevent "Wrong Source" Usage)
When a doc is superseded **without** merging its content into another:
1. Move the old doc to `docs/archive/_archive/...` (preferred) and set `Status: Archived`.
2. Do not keep redirect stubs at old paths (avoid trap entrypoints that look authoritative).
3. Update all in-repo references to point to the canonical location.
4. Rely on `docs/_meta/meta-canonical-map.md` (regenerated) + `docs/index.md` to resolve historical references without leaving misleading files behind.

## Folder Rules (Where Things Live)
- `docs/index.md`: curated canonical entrypoint (humans start here).
- `docs/messmass-codex-brain-dump.md`: short repo knowledge refresher (keep updated as refactors happen).
- `docs/_meta/*`: generated reports (do not hand-edit).
- `docs/archive/_archive/*`: deprecated/legacy material kept for traceability (do not edit unless explicitly reviving).
- `docs/archive/*`: long-term archives (historical audits and refactor logs).

## File Naming Rules
- Use **lowercase kebab-case** for all documentation filenames: `kebab-case.md`.
- Avoid spaces, underscores, and mixed casing in filenames.
- Prefer grouping by **folder structure**. Do not add redundant filename prefixes when the folder already scopes the domain.
- Exceptions:
  - `docs/index.md` stays as the canonical entrypoint filename.
  - Generated reports under `docs/_meta/` follow the script-defined names; do not rename manually.

## Enforcement (Repeatable Checks)
After any doc move/merge/rename, run:
```bash
python3 scripts/docs_inventory.py
python3 scripts/docs_triage.py
python3 scripts/docs_link_check.py
python3 scripts/docs_canonical_map.py
```

Expected steady-state:
- `docs/_meta/meta-docs-link-check.md`: Broken links found: 0
- `docs/_meta/meta-docs-triage.md`: missing metadata = 0; suspicious titles = 0
