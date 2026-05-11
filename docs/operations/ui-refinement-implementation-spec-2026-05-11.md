# UI Refinement Implementation Spec ({messmass})
Status: Proposed
Last Updated: 2026-05-11
Canonical: No
Owner: Product

## Objective

Turn the May 11, 2026 UI audit into an execution-ready delivery program that reduces workflow friction, removes duplicate entry points, standardizes naming and actions, and makes `{messmass}` easier to operate across admin, event, partner, reporting, and analytics workflows.

## Why This Exists

The current product contains real capability depth, but the capability map is hard to understand because:

- the admin dashboard and sidebar do not describe the same product
- the same intent appears under different labels across routes
- create/edit surfaces are overloaded with too many unrelated decisions
- reporting setup is split across too many specialist pages
- analytics has multiple competing "home" surfaces
- old and new admin paradigms coexist

The result is unnecessary navigation, low operator confidence, and higher training cost.

## UX Program Principles

1. One intent should have one primary home.
2. One object type should use one action grammar.
3. One domain should use one vocabulary.
4. Setup flows should stage decisions instead of stacking everything into one modal.
5. Navigation should mirror user jobs, not internal implementation layers.

## Target Information Architecture

### 1. Home

- Today's work
- recent items
- unresolved delivery gaps
- quick actions

### 2. Operations

- Events
- Partner Activation
- Quick Add
- Messages

### 3. Entities

- Partners
- Organizations
- Project-Partner relationships

### 4. Reports

- Templates
- Themes
- Blocks
- Builder
- Content
- Exports

### 5. Data

- KYC Variables
- Clicker Sets
- Bitly
- Google Sheets and sync plumbing

### 6. Analytics

- Sponsorship Hub
- Executive
- Marketing
- Operations
- Insights
- Portfolio

### 7. System

- Users
- Cache
- Help
- Main Page settings

## Standard Action Grammar

All entity-heavy admin surfaces should converge on:

- `Open`
- `Edit`
- `Share`
- `Analytics`
- `More`

`Report`, `Edit Stats`, `KYC Data`, and similar secondary actions should be nested or relabeled under this grammar instead of defining a different action language per page.

## Execution Order

This program should be delivered in strict sequence:

1. Navigation, vocabulary, and route ownership foundation
2. Admin home and analytics entry-point consolidation
3. Entity action grammar normalization
4. Reporting-system information architecture consolidation
5. Event and partner setup workflow simplification
6. Legacy surface retirement, redirects, and help/guidance alignment

## GitHub Breakdown

### Program Epic

- `UI Refinement Program: IA, workflow simplification, and admin consistency`

### Child Issues

1. `UI Refinement 1/6: Canonical navigation, labels, and route ownership map`
   - No internal dependency
   - Produces the naming and IA contract the rest of the work must follow

2. `UI Refinement 2/6: Admin home and analytics entry-point consolidation`
   - Depends on `1/6`
   - Removes duplicate "home" and "dashboard" surfaces

3. `UI Refinement 3/6: Unified entity action grammar across events, partners, and organizations`
   - Depends on `1/6`
   - Makes row/card/action behavior consistent across the main admin entities

4. `UI Refinement 4/6: Reporting setup IA consolidation`
   - Depends on `1/6`
   - Reorganizes styles, visualization, charts, builder, and content around one reporting mental model

5. `UI Refinement 5/6: Event and partner setup flow simplification`
   - Depends on `3/6` and `4/6`
   - Breaks overloaded modals into staged setup flows

6. `UI Refinement 6/6: Legacy route deprecation, redirect cleanup, and help-system rewrite`
   - Depends on `2/6`, `3/6`, `4/6`, and `5/6`
   - Removes obsolete parallel surfaces and aligns in-product guidance with the shipped IA

## Delivery Constraints

- Do not merge route and label changes piecemeal without updating both dashboard and sidebar navigation together.
- Do not redesign reporting IA before the ownership map is defined.
- Do not simplify partner/event setup modals before the reporting and action models are stabilized.
- Do not remove legacy admin routes until redirects, links, and help copy are updated.

## Acceptance Standard

This program is successful only when:

- the top-level admin IA is coherent and non-duplicative
- core workflows require fewer decisions and less route-hunting
- action names are predictable across entity types
- reporting configuration reads as one system instead of several unrelated tools
- help and guidance match the shipped IA
