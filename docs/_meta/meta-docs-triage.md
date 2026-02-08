# Docs Triage
Status: Active
Last Updated: 2026-02-08T11:27:00Z
Canonical: Yes
Owner: Documentation

This report highlights actionable doc-cleanup work: missing metadata, suspicious titles, and potential near-duplicates in the ACTIVE docs tree.

## Counts
- Active Markdown files: 67
- Archived Markdown files: 34
- Active files missing header metadata fields: 0
- Active files with suspicious titles: 0
- Near-duplicate candidate pairs (Jaccard >= 0.35): 0

## Action List (Fixed Order)
1. Fix header blocks (Status/Last Updated/Canonical/Owner) for active files that are missing them.
2. Fix any broken titles (titles that look like filenames or paths).
3. Review near-duplicate candidates and merge where appropriate; leave an archived pointer if history must remain.
4. Re-run `scripts/docs_inventory.py` and `scripts/docs_triage.py` until the counts stabilize.

## Active Files Missing Metadata
| Path | Title | Missing | Lines |
|---|---|---|---:|

## Active Files With Suspicious Titles
| Path | Title |
|---|---|

## Near-Duplicate Candidates (Active Tree)
These pairs are likely mergeable or at least should cross-link clearly.

| Score | A | B |
|---:|---|---|

