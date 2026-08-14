# Docs Triage
Status: Active
Last Updated: 2026-08-14T19:54:08Z
Canonical: Yes
Owner: Documentation

This report highlights actionable doc-cleanup work: missing metadata, suspicious titles, and potential near-duplicates in the ACTIVE docs tree.

## Counts
- Active Markdown files: 154
- Archived Markdown files: 31
- Active files missing header metadata fields: 38
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
| docs/2026-03-09_AUDIT_CORE_VS_PARTNER_FUNCTIONS.md | Audit Plan: Separating Core vs Partner-Level Functions | status, last_updated, canonical, owner | 367 |
| docs/HANDOVER.md | {messmass} Developer Handover | status, last_updated, canonical, owner | 1557 |
| docs/NEXT_AGENT_PROMPT.md | Next Agent Prompt (Historical Note) | status, last_updated, canonical, owner | 37 |
| docs/PROJECT_MANAGEMENT.md | Project Management & SSOT Guidelines | status, last_updated, canonical, owner | 79 |
| docs/V3/messmass_v3_api_specification.md | {messmass} v3 -- API Specification (Operational) | status, last_updated, canonical, owner | 100 |
| docs/V3/messmass_v3_architecture.md | {messmass} v3 -- Activity Intelligence Platform | status, last_updated, canonical, owner | 473 |
| docs/V3/messmass_v3_architecture_diagrams.md | {messmass} v3 Architecture Diagrams | status, last_updated, canonical, owner | 76 |
| docs/V3/messmass_v3_configuration_management.md | {messmass} v3 -- Configuration Management | status, last_updated, canonical, owner | 41 |
| docs/V3/messmass_v3_data_governance.md | {messmass} v3 -- Data Governance & Data Modeling Rules | status, last_updated, canonical, owner | 127 |
| docs/V3/messmass_v3_github_project_structure.md | {messmass} v3 GitHub Project Structure | status, last_updated, canonical, owner | 108 |
| docs/V3/messmass_v3_migration_playbook.md | {messmass} v3 Migration Playbook | status, last_updated, canonical, owner | 82 |
| docs/V3/messmass_v3_mongodb_mongoose_schema.md | {messmass} v3 -- MongoDB & Mongoose Schema Specification | status, last_updated, canonical, owner | 341 |
| docs/V3/messmass_v3_observability_monitoring.md | {messmass} v3 -- Observability & Monitoring | status, last_updated, canonical, owner | 51 |
| docs/V3/messmass_v3_quickstart_guide.md | {messmass} V3: Quickstart Guide (Admin) | status, last_updated, canonical, owner | 56 |
| docs/V3/messmass_v3_release_runbook.md | {messmass} v3 -- Release & Rollback Runbook | status, last_updated, canonical, owner | 50 |
| docs/V3/messmass_v3_reporting_engine_design.md | {messmass} v3 -- Reporting Engine Architecture | status, last_updated, canonical, owner | 113 |
| docs/V3/messmass_v3_sample_data_models.md | {messmass} v3 -- Example Data Models | status, last_updated, canonical, owner | 68 |
| docs/V3/messmass_v3_security_model.md | {messmass} v3 -- Security Model | status, last_updated, canonical, owner | 52 |
| docs/V3/messmass_v3_testing_strategy.md | {messmass} v3 -- Testing & QA Strategy | status, last_updated, canonical, owner | 74 |
| docs/V3/messmass_v3_ui_configuration.md | {messmass} v3 -- UI Configuration & Industry Templates | status, last_updated, canonical, owner | 88 |
| docs/audits/deep-document-audit-2026-06-26.md | Deep Documentation Audit | status, last_updated, canonical, owner | 174 |
| docs/audits/design-system-audit-2026-05-22.md | Design System Audit — 2026-05-22 | status, last_updated, canonical, owner | 237 |
| docs/audits/documentation-consistency-audit-2026-06-26.md | Documentation Consistency Audit | status, last_updated, canonical, owner | 380 |
| docs/audits/system-audit-plan-2026.md |  | status, last_updated, canonical, owner | 117 |
| docs/guides/admin/organizations.md | Administrator Guide: Organization Management | status, last_updated, canonical, owner | 79 |
| docs/landing-main-page-ui-refactor-plan.md | Landing / Main Page UI Refactor Plan | status, last_updated, canonical, owner | 171 |
| docs/landing-overhaul-plan.md | Landing Page Visual + Content Overhaul — Implementation Plan | status, last_updated, canonical, owner | 192 |
| docs/operations/analytics-chart-ux-benchmark-plan-2026-05-23.md | Analytics Chart UX Benchmark Plan | last_updated, canonical | 159 |
| docs/operations/design-system-remediation-spec-2026-05-22.md | Design System Remediation Spec — 2026-05-22 | status, last_updated, canonical, owner | 167 |
| docs/operations/ideabank-industry-benchmark-2026-05-10.md | Industry Benchmark Ideabank — 2026-05-10 | last_updated | 190 |
| docs/operations/messmass-fanmass-integration-delivery-plan-2026-06-25.md | Messmass <> Fanmass Integration Delivery Plan | status, last_updated, canonical, owner | 109 |
| docs/operations/messmass-mantine-implementation-plan-2026-05-23.md | Messmass Mantine Implementation Plan | last_updated | 389 |
| docs/operations/partner-report-monitoring.md | Partner Report Monitoring | status, last_updated, canonical, owner | 93 |
| docs/operations/report-variants-time-period-spec-2026-05-22.md | Report Variants And Time-Period Selection Spec | last_updated, canonical | 332 |
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

