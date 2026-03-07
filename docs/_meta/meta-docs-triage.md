# Docs Triage
Status: Active
Last Updated: 2026-03-06T11:50:05Z
Canonical: Yes
Owner: Documentation

This report highlights actionable doc-cleanup work: missing metadata, suspicious titles, and potential near-duplicates in the ACTIVE docs tree.

## Counts
- Active Markdown files: 87
- Archived Markdown files: 34
- Active files missing header metadata fields: 10
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
| docs/HANDOVER.md | {messmass} Developer Handover | status, last_updated, canonical, owner | 214 |
| docs/NEXT_AGENT_PROMPT.md | Next Agent Prompt (Handover) | status, last_updated, canonical, owner | 53 |
| docs/PROJECT_MANAGEMENT.md | Project Management & SSOT Guidelines | status, last_updated, canonical, owner | 79 |
| docs/audits/system-audit-plan-2026.md |  | status, last_updated, canonical, owner | 117 |
| docs/landing-main-page-ui-refactor-plan.md | Landing / Main Page UI Refactor Plan | status, last_updated, canonical, owner | 171 |
| docs/landing-overhaul-plan.md | Landing Page Visual + Content Overhaul — Implementation Plan | status, last_updated, canonical, owner | 192 |
| docs/plan-builder-mode-variable-inputs.md | Plan: Builder Mode — Variable Inputs from Report Layout | status, last_updated, canonical, owner | 169 |
| docs/release-notes-11.57.0.md | Release Notes — v11.57.0 | status, last_updated, canonical, owner | 42 |
| docs/release-notes-11.58.0.md | Release Notes — v11.58.0 | status, last_updated, canonical, owner | 59 |
| docs/release-notes-11.59.0.md | Release Notes — v11.59.0 | status, last_updated, canonical, owner | 57 |

## Active Files With Suspicious Titles
| Path | Title |
|---|---|

## Near-Duplicate Candidates (Active Tree)
These pairs are likely mergeable or at least should cross-link clearly.

| Score | A | B |
|---:|---|---|

