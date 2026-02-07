# Admin UI Audits Pack
Status: Archived
Last Updated: 2026-02-05T21:00:17.000Z
Canonical: No
Owner: Audit

This pack consolidates Admin UI audit artifacts for traceability.
Canonical Admin workflows live under `docs/admin/` and execution state under `docs/operations/operations-action-plan.md`.

## Table Of Contents
- [A-UI-00-admin-ui-technical-audit](#a-ui-00-admin-ui-technical-audit) (source: `docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#a-ui-00-admin-ui-technical-audit`)
- [ADMIN_UI_ALGORITHMS_MODEL](#admin-ui-algorithms-model) (source: `docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-algorithms-model`)
- [ADMIN_UI_BITLY_FLOWS](#admin-ui-bitly-flows) (source: `docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-bitly-flows`)
- [ADMIN_UI_BITLY_MODEL](#admin-ui-bitly-model) (source: `docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-bitly-model`)
- [ADMIN_UI_CAPABILITY_MAP](#admin-ui-capability-map) (source: `docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map`)
- [ADMIN_UI_CONSOLIDATION_PLAN](#admin-ui-consolidation-plan) (source: `docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-consolidation-plan`)
- [ADMIN_UI_EXECUTION_READINESS](#admin-ui-execution-readiness) (source: `docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-execution-readiness`)
- [ADMIN_UI_FINAL_IA](#admin-ui-final-ia) (source: `docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-final-ia`)
- [ADMIN_UI_GLOSSARY](#admin-ui-glossary) (source: `docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-glossary`)
- [ADMIN_UI_INSIGHTS_MODEL](#admin-ui-insights-model) (source: `docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-insights-model`)
- [ADMIN_UI_KYC_MODEL](#admin-ui-kyc-model) (source: `docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-kyc-model`)
- [ADMIN_UI_OWNERSHIP_MODEL](#admin-ui-ownership-model) (source: `docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-ownership-model`)
- [ADMIN_UI_REPORTING_CONTRACT](#admin-ui-reporting-contract) (source: `docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-reporting-contract`)
- [ADMIN_UI_ROLES_PERMISSIONS](#admin-ui-roles-permissions) (source: `docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-roles-permissions`)

## A-UI-00-admin-ui-technical-audit
<a id="a-ui-00-admin-ui-technical-audit"></a>

- Source: `docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#a-ui-00-admin-ui-technical-audit`

```markdown
# A-UI-00: Admin UI Technical Audit
Status: Active
Last Updated: 2026-02-05T00:00:00.000Z
Canonical: No
Owner: Audit


**Date:** 2026-01-12T10:20:00.000Z  
**Status:** Investigation Complete  
**Investigator:** Tribeca  
**Reference:** `ACTION_PLAN.md` ADMIN UI REFACTOR PROGRAM (canonical roadmap)

---

## Objective

Produce a code-grounded Admin UI route + component inventory, identify fragmentation and hardcoding sources, define UI Primitives target set, and create an actionable remediation queue.

---

## 1. Admin UI Route + Component Inventory

### 1.1 Routes Under `app/admin/**`

**Total Routes:** 38 pages (including nested routes)

#### Core Routes (Content Management)
- `/admin` - Main admin page (`app/admin/page.tsx`)
- `/admin/partners` - Partners management (`app/admin/partners/page.tsx`)
- `/admin/partners/[id]` - Partner detail (`app/admin/partners/[id]/page.tsx`)
- `/admin/partners/[id]/analytics` - Partner analytics (`app/admin/partners/[id]/analytics/page.tsx`)
- `/admin/partners/[id]/kyc-data` - Partner KYC data (`app/admin/partners/[id]/kyc-data/page.tsx`)
- `/admin/events` - Events management (`app/admin/events/page.tsx`)
- `/admin/events/[id]/kyc-data` - Event KYC data (`app/admin/events/[id]/kyc-data/page.tsx`)
- `/admin/filter` - Filter management (`app/admin/filter/page.tsx`)

#### Management Routes (Configuration)
- `/admin/users` - User management (`app/admin/users/page.tsx`)
- `/admin/insights` - Insights management (`app/admin/insights/page.tsx`)
- `/admin/kyc` - KYC variables (`app/admin/kyc/page.tsx`)
- `/admin/charts` - Algorithms/Chart configuration (`app/admin/charts/page.tsx`)
- `/admin/clicker-manager` - Clicker Manager (`app/admin/clicker-manager/page.tsx`)
- `/admin/bitly` - Bitly Manager (`app/admin/bitly/page.tsx`)
- `/admin/hashtags` - Hashtag Manager (`app/admin/hashtags/page.tsx`)
- `/admin/categories` - Category Manager (`app/admin/categories/page.tsx`)

#### System Routes (Reporting & Configuration)
- `/admin/visualization` - Reporting/Visualization (`app/admin/visualization/page.tsx`)
- `/admin/styles` - Style Editor list (`app/admin/styles/page.tsx`)
- `/admin/styles/[id]` - Style Editor detail (`app/admin/styles/[id]/page.tsx`)
- `/admin/cache` - Cache Management (`app/admin/cache/page.tsx`)

#### Analytics Routes
- `/admin/analytics/executive` - Executive Dashboard (`app/admin/analytics/executive/page.tsx`)
- `/admin/analytics/insights` - Analytics Insights (`app/admin/analytics/insights/page.tsx`)

#### Utility Routes
- `/admin/content-library` - Content Library (`app/admin/content-library/page.tsx`)
- `/admin/projects` - Projects management (`app/admin/projects/page.tsx`)
- `/admin/project-partners` - Project Partners (`app/admin/project-partners/page.tsx`)
- `/admin/quick-add` - Quick Add (`app/admin/quick-add/page.tsx`)
- `/admin/api-football-enrich` - API Football Enrichment (`app/admin/api-football-enrich/page.tsx`)
- `/admin/design` - Design settings (`app/admin/design/page.tsx`)
- `/admin/dashboard` - Dashboard (`app/admin/dashboard/page.tsx`)
- `/admin/help` - User Guide (`app/admin/help/page.tsx`)

#### Auth Routes
- `/admin/login` - Login (`app/admin/login/page.tsx`)
- `/admin/register` - Registration (`app/admin/register/page.tsx`)
- `/admin/unauthorized` - Unauthorized (`app/admin/unauthorized/page.tsx`)

#### Debug/Test Routes
- `/admin/clear-session` - Clear Session (`app/admin/clear-session/page.tsx`)
- `/admin/cookie-test` - Cookie Test (`app/admin/cookie-test/page.tsx`)

### 1.2 Primary Components Per Route

#### Unified Pattern (Using UnifiedAdminPage)
- **Categories** (`/admin/categories`): `UnifiedAdminPage`, `FormModal`, `categoriesAdapter`
- **Users** (`/admin/users`): `UnifiedAdminPage`, `FormModal`, `ConfirmDialog`, `usersAdapter`
- **Partners** (`/admin/partners`): `UnifiedAdminPage`, `FormModal`, `SharePopup`, `partnersAdapter`
- **Events** (`/admin/events`): `UnifiedAdminPage`, `FormModal`, `SharePopup`, `projectsAdapter`

#### Fragmented Pattern (Hardcoded Tables/Forms)
- **Bitly** (`/admin/bitly`): `UnifiedAdminHeroWithSearch`, hardcoded `<table>`, `FormModal`
- **KYC** (`/admin/kyc`): `UnifiedAdminHeroWithSearch`, `ColoredCard` grid, `FormModal`
- **Analytics Executive** (`/admin/analytics/executive`): Custom dashboard, hardcoded `<table>`, no unified components
- **Clicker Manager** (`/admin/clicker-manager`): Custom form layout, no unified components
- **Content Library** (`/admin/content-library`): Custom card grid, no unified components
- **Visualization** (`/admin/visualization`): Custom editor interface, no unified components
- **Styles** (`/admin/styles`): Custom card grid, `FormModal`
- **Styles Editor** (`/admin/styles/[id]`): Custom split-panel layout, inline forms

### 1.3 Shared UI Primitives Currently Used

#### Modal System (Unified)
- **FormModal** (`components/modals/FormModal.tsx`): Used by 13+ pages
- **BaseModal** (`components/modals/BaseModal.tsx`): Used by FormModal
- **ConfirmDialog** (`components/modals/ConfirmDialog.tsx`): Used by 5+ pages

#### Table/List System (Partially Unified)
- **UnifiedListView** (`components/UnifiedListView.tsx`): Used by UnifiedAdminPage (4 pages)
- **UnifiedCardView** (`components/UnifiedCardView.tsx`): Used by UnifiedAdminPage (4 pages)
- **UnifiedAdminPage** (`components/UnifiedAdminPage.tsx`): Orchestrates list/card views (4 pages)
- **Hardcoded `<table>` elements**: Used by 8+ pages (bitly, kyc, analytics/executive, etc.)

#### Hero/Header System (Fragmented)
- **UnifiedAdminHeroWithSearch** (`components/UnifiedAdminHeroWithSearch.tsx`): Used by 5+ pages
- **UnifiedAdminHero** (`components/UnifiedAdminHero.tsx`): Used by 2+ pages
- **AdminHero** (`components/AdminHero.tsx`): Used by 3+ pages
- **AdminPageHero** (`components/AdminPageHero.tsx`): Used by 1 page
- **UnifiedPageHero** (`components/UnifiedPageHero.tsx`): Used by 1 page

#### Form Components (Partially Unified)
- **UnifiedHashtagInput** (`components/UnifiedHashtagInput.tsx`): Used by 5+ pages
- **UnifiedTextInput** (`components/UnifiedTextInput.tsx`): Used by 2+ pages
- **UnifiedNumberInput** (`components/UnifiedNumberInput.tsx`): Used by 1+ page
- **Hardcoded form fields**: Used by 10+ pages (inline `<input>`, `<textarea>`, etc.)

#### Navigation/Layout (Unified)
- **AdminLayout** (`components/AdminLayout.tsx`): Used by all admin pages via `app/admin/layout.tsx`
- **Sidebar** (`components/Sidebar.tsx`): Used by AdminLayout
- **TopHeader** (`components/TopHeader.tsx`): Used by AdminLayout

#### Toast/Message System (Fragmented)
- **SharePopup** (`components/SharePopup.tsx`): Used by 3+ pages
- **StandardState** (`components/StandardState.tsx`): Used by 1 page
- **Inline success/error messages**: Used by 15+ pages (state-based, no unified component)

#### Empty State System (Partially Unified)
- **UnifiedListView empty state**: Built into UnifiedListView
- **UnifiedCardView empty state**: Built into UnifiedCardView
- **Custom empty states**: Used by 5+ pages (hardcoded JSX)

#### Loading State System (Fragmented)
- **UnifiedListView loading skeleton**: Built into UnifiedListView
- **UnifiedCardView loading skeleton**: Built into UnifiedCardView
- **Custom loading states**: Used by 10+ pages (hardcoded JSX, spinners, etc.)

---

## 2. Fragmentation and Hardcoding Sources

### 2.1 Duplicated Modal Patterns

**Evidence:**
- **File:** `app/admin/bitly/page.tsx` lines 200-300
  - Custom modal structure with inline form fields
  - Duplicates FormModal pattern but without FormModal component
- **File:** `app/admin/clicker-manager/page.tsx` lines 150-400
  - Custom modal-like overlay with form fields
  - No modal component used, custom implementation
- **File:** `app/admin/styles/[id]/page.tsx` lines 180-280
  - Custom split-panel layout (not a modal, but similar pattern)
  - Inline form fields, no unified form components

**Impact:** 3+ pages have custom modal implementations instead of using FormModal/BaseModal.

### 2.2 Duplicated Table Implementations

**Evidence:**
- **File:** `app/admin/bitly/page.tsx` lines 400-600
  - Hardcoded `<table>` with `<thead>`, `<tbody>`, `<tr>`, `<td>` elements
  - Custom sorting logic, inline styles
  - Pattern: `styles.table`, `styles.tableRow`, `styles.tableCell`
- **File:** `app/admin/analytics/executive/page.tsx` lines 200-300
  - Hardcoded `<table>` for "Top 5 Events"
  - Custom styling via `ExecutiveDashboard.module.css`
- **File:** `app/admin/kyc/page.tsx` lines 200-400
  - `ColoredCard` grid instead of table (different pattern)
  - No unified list view component used

**Impact:** 8+ pages have hardcoded table implementations instead of using UnifiedListView.

### 2.3 Duplicated Form Validation Patterns

**Evidence:**
- **File:** `app/admin/partners/page.tsx` lines 200-400
  - Custom validation logic: `if (!newPartnerData.name.trim()) { setError('Name required'); return; }`
- **File:** `app/admin/events/page.tsx` lines 200-400
  - Similar validation: `if (!newProjectData.eventName.trim()) { setError('Event name required'); return; }`
- **File:** `app/admin/bitly/page.tsx` lines 200-300
  - Duplicate validation: `if (!newBitlink.trim()) { setError('Bitlink required'); return; }`

**Impact:** 10+ pages have duplicate validation logic instead of shared validation utilities.

### 2.4 Ad-Hoc Styling

**Evidence:**
- **File:** `app/admin/design/page.tsx` line 63
  - Inline style: `style={{ padding: '1rem' }}`
  - Comment: "Temporary component, no need for CSS module"
- **File:** `app/admin/bitly/page.module.css`
  - Page-specific CSS module with custom table styles
  - Not using design tokens consistently
- **File:** `app/admin/styles/[id]/editor.module.css`
  - Custom split-panel layout styles
  - Some design tokens used, but mixed with hardcoded values

**Impact:** 15+ pages have ad-hoc styling (inline styles, page-specific CSS modules) instead of using design tokens consistently.

### 2.5 Inconsistent Layout Shells

**Evidence:**
- **Unified Pattern:** Pages using `UnifiedAdminPage` have consistent hero + search + view toggle
- **Fragmented Pattern:** 
  - `app/admin/bitly/page.tsx`: Uses `UnifiedAdminHeroWithSearch` but custom table
  - `app/admin/kyc/page.tsx`: Uses `UnifiedAdminHeroWithSearch` but custom card grid
  - `app/admin/analytics/executive/page.tsx`: Custom dashboard layout, no hero component
  - `app/admin/visualization/page.tsx`: Custom editor layout, no hero component

**Impact:** 10+ pages have inconsistent layout shells (some use UnifiedAdminHeroWithSearch, some use custom layouts).

### 2.6 Inconsistent Toast/Message Patterns

**Evidence:**
- **File:** `app/admin/partners/page.tsx` lines 100-150
  - State-based: `const [successMessage, setSuccessMessage] = useState('');`
  - Rendered inline: `{successMessage && <div className={styles.success}>{successMessage}</div>}`
- **File:** `app/admin/events/page.tsx` lines 100-150
  - Similar pattern: `const [error, setError] = useState('');`
  - Rendered inline: `{error && <div className={styles.error}>{error}</div>}`
- **File:** `app/admin/bitly/page.tsx` lines 100-150
  - Duplicate pattern: `const [successMessage, setSuccessMessage] = useState('');`

**Impact:** 15+ pages have duplicate toast/message state management instead of unified Toast component.

---

## 3. Admin UI "UI Primitives" Target Set

### 3.1 Minimum Set of Reusable Components/Patterns

#### Modal System (✅ Exists, needs adoption)
- **FormModal** - ✅ Exists (`components/modals/FormModal.tsx`)
- **BaseModal** - ✅ Exists (`components/modals/BaseModal.tsx`)
- **ConfirmDialog** - ✅ Exists (`components/modals/ConfirmDialog.tsx`)
- **Status:** 3/3 components exist, but 3+ pages still use custom modals

#### Table System (⚠️ Partially exists, needs completion)
- **UnifiedListView** - ✅ Exists (`components/UnifiedListView.tsx`)
- **UnifiedAdminPage** - ✅ Exists (`components/UnifiedAdminPage.tsx`)
- **Status:** 2/2 components exist, but 8+ pages still use hardcoded tables

#### Form System (⚠️ Partially exists, needs completion)
- **UnifiedHashtagInput** - ✅ Exists (`components/UnifiedHashtagInput.tsx`)
- **UnifiedTextInput** - ✅ Exists (`components/UnifiedTextInput.tsx`)
- **UnifiedNumberInput** - ✅ Exists (`components/UnifiedNumberInput.tsx`)
- **FormField** - ❌ Missing (wrapper for label + input + error)
- **FormValidation** - ❌ Missing (shared validation utilities)
- **Status:** 3/5 components exist, form field wrapper and validation utilities needed

#### Drawer/Sidebar System (✅ Exists)
- **Sidebar** - ✅ Exists (`components/Sidebar.tsx`)
- **Status:** 1/1 component exists and is used consistently

#### PageHeader System (⚠️ Fragmented, needs unification)
- **UnifiedAdminHeroWithSearch** - ✅ Exists (`components/UnifiedAdminHeroWithSearch.tsx`)
- **UnifiedAdminHero** - ✅ Exists (`components/UnifiedAdminHero.tsx`)
- **AdminHero** - ⚠️ Legacy (`components/AdminHero.tsx`)
- **AdminPageHero** - ⚠️ Legacy (`components/AdminPageHero.tsx`)
- **UnifiedPageHero** - ⚠️ Legacy (`components/UnifiedPageHero.tsx`)
- **Status:** 5 components exist, but 3 are legacy and should be consolidated to UnifiedAdminHeroWithSearch

#### Toast/Message System (❌ Missing)
- **Toast** - ❌ Missing (unified toast notification component)
- **ToastProvider** - ❌ Missing (context provider for toast management)
- **Status:** 0/2 components exist, all pages use inline state-based messages

#### EmptyState System (⚠️ Partially exists)
- **UnifiedListView empty state** - ✅ Exists (built into UnifiedListView)
- **UnifiedCardView empty state** - ✅ Exists (built into UnifiedCardView)
- **EmptyState** - ❌ Missing (standalone component for non-unified pages)
- **Status:** 2/3 components exist, standalone EmptyState component needed

#### Loading System (⚠️ Partially exists)
- **UnifiedListView loading skeleton** - ✅ Exists (built into UnifiedListView)
- **UnifiedCardView loading skeleton** - ✅ Exists (built into UnifiedCardView)
- **LoadingSpinner** - ❌ Missing (standalone component for non-unified pages)
- **LoadingSkeleton** - ❌ Missing (generic skeleton component)
- **Status:** 2/4 components exist, standalone loading components needed

---

## 4. Actionable Remediation Queue

### 4.1 Modal System Unification

#### R-01: Migrate Bitly Page to FormModal
**What:** Replace custom modal structure in `app/admin/bitly/page.tsx` with FormModal
**Where:** `app/admin/bitly/page.tsx` lines 200-300
**Why:** Eliminates duplicate modal pattern, uses unified component
**Done Criteria:** Bitly page uses FormModal for add/edit link modals, no custom modal JSX
**Risk Notes:** Low risk - FormModal already supports all required features

#### R-02: Migrate Clicker Manager to FormModal
**What:** Replace custom overlay form in `app/admin/clicker-manager/page.tsx` with FormModal
**Where:** `app/admin/clicker-manager/page.tsx` lines 150-400
**Why:** Eliminates duplicate modal pattern, improves consistency
**Done Criteria:** Clicker Manager uses FormModal for variable group editing, no custom overlay
**Risk Notes:** Medium risk - Clicker Manager has complex form structure, may need FormModal customization

#### R-03: Audit All Pages for Custom Modals
**What:** Identify all pages with custom modal implementations and migrate to FormModal/BaseModal
**Where:** All `app/admin/**/*.tsx` files
**Why:** Complete modal system unification
**Done Criteria:** All admin pages use FormModal, BaseModal, or ConfirmDialog (no custom modals)
**Risk Notes:** Low risk - systematic migration, can be done incrementally

### 4.2 Table System Unification

#### R-04: Migrate Bitly Page to UnifiedListView
**What:** Replace hardcoded `<table>` in `app/admin/bitly/page.tsx` with UnifiedListView via UnifiedAdminPage
**Where:** `app/admin/bitly/page.tsx` lines 400-600
**Why:** Eliminates duplicate table implementation, uses unified component
**Done Criteria:** Bitly page uses UnifiedAdminPage with bitlyAdapter, no hardcoded table JSX
**Risk Notes:** Medium risk - Bitly table has complex inline actions (ProjectSelector, PartnerSelector per row), may need adapter customization

#### R-05: Migrate Analytics Executive Dashboard Table
**What:** Replace hardcoded "Top 5 Events" table in `app/admin/analytics/executive/page.tsx` with UnifiedListView
**Where:** `app/admin/analytics/executive/page.tsx` lines 200-300
**Why:** Eliminates duplicate table implementation
**Done Criteria:** Executive dashboard uses UnifiedListView for top events table, no hardcoded table JSX
**Risk Notes:** Low risk - Simple table, easy migration

#### R-06: Create Adapter for KYC Variables
**What:** Create `kycAdapter` and migrate KYC page from ColoredCard grid to UnifiedAdminPage
**Where:** `app/admin/kyc/page.tsx`, create `lib/adapters/kycAdapter.tsx`
**Why:** Unifies KYC page with other admin pages, enables card/list toggle
**Done Criteria:** KYC page uses UnifiedAdminPage with kycAdapter, supports card/list view toggle
**Risk Notes:** Medium risk - KYC page has complex filtering (source filter, flag filter, category filter), may need adapter customization

#### R-07: Audit All Pages for Hardcoded Tables
**What:** Identify all pages with hardcoded `<table>` elements and migrate to UnifiedListView
**Where:** All `app/admin/**/*.tsx` files
**Why:** Complete table system unification
**Done Criteria:** All admin pages use UnifiedListView or UnifiedCardView (no hardcoded tables)
**Risk Notes:** Low risk - systematic migration, can be done incrementally

### 4.3 Form System Completion

#### R-08: Create FormField Component
**What:** Create reusable FormField component (label + input + error message wrapper)
**Where:** Create `components/FormField.tsx`
**Why:** Eliminates duplicate form field structure across 10+ pages
**Done Criteria:** FormField component exists, used by 5+ pages, reduces form boilerplate
**Risk Notes:** Low risk - standard pattern, easy to implement

#### R-09: Create FormValidation Utilities
**What:** Create shared validation utilities (required, email, minLength, etc.)
**Where:** Create `lib/formValidation.ts`
**Why:** Eliminates duplicate validation logic across 10+ pages
**Done Criteria:** FormValidation utilities exist, used by 5+ pages, reduces validation boilerplate
**Risk Notes:** Low risk - standard validation patterns, easy to implement

#### R-10: Migrate Pages to Unified Form Components
**What:** Replace hardcoded form fields with UnifiedTextInput, UnifiedNumberInput, FormField
**Where:** All `app/admin/**/*.tsx` files with forms
**Why:** Unifies form field rendering across all pages
**Done Criteria:** All admin pages use unified form components (no hardcoded `<input>`, `<textarea>`)
**Risk Notes:** Medium risk - many pages to migrate, can be done incrementally

### 4.4 PageHeader System Unification

#### R-11: Consolidate Hero Components
**What:** Deprecate AdminHero, AdminPageHero, UnifiedPageHero, standardize on UnifiedAdminHeroWithSearch
**Where:** `components/AdminHero.tsx`, `components/AdminPageHero.tsx`, `components/UnifiedPageHero.tsx`
**Why:** Eliminates 3 legacy hero components, reduces maintenance burden
**Done Criteria:** All pages use UnifiedAdminHeroWithSearch, legacy components removed
**Risk Notes:** Low risk - UnifiedAdminHeroWithSearch supports all required features

#### R-12: Migrate Pages to UnifiedAdminHeroWithSearch
**What:** Replace custom hero components with UnifiedAdminHeroWithSearch
**Where:** Pages using AdminHero, AdminPageHero, UnifiedPageHero
**Why:** Unifies page header pattern across all admin pages
**Done Criteria:** All admin pages use UnifiedAdminHeroWithSearch (no legacy hero components)
**Risk Notes:** Low risk - straightforward migration

### 4.5 Toast/Message System Implementation

#### R-13: Create Toast Component
**What:** Create unified Toast notification component (success, error, info, warning variants)
**Where:** Create `components/Toast.tsx`, `components/Toast.module.css`
**Why:** Eliminates duplicate toast/message state management across 15+ pages
**Done Criteria:** Toast component exists, supports all variants (success, error, info, warning)
**Risk Notes:** Low risk - standard toast pattern, easy to implement

#### R-14: Create ToastProvider Context
**What:** Create ToastProvider context for global toast management
**Where:** Create `contexts/ToastContext.tsx`
**Why:** Enables toast notifications from anywhere in admin UI without prop drilling
**Done Criteria:** ToastProvider exists, provides `showToast()` function, used by AdminLayout
**Risk Notes:** Low risk - standard React context pattern

#### R-15: Migrate Pages to Toast System
**What:** Replace inline success/error message state with Toast system
**Where:** All `app/admin/**/*.tsx` files with message state
**Why:** Unifies message display across all admin pages
**Done Criteria:** All admin pages use Toast system (no inline message state)
**Risk Notes:** Low risk - straightforward migration, can be done incrementally

### 4.6 EmptyState System Completion

#### R-16: Create Standalone EmptyState Component
**What:** Create reusable EmptyState component for non-unified pages
**Where:** Create `components/EmptyState.tsx`, `components/EmptyState.module.css`
**Why:** Eliminates duplicate empty state JSX across 5+ pages
**Done Criteria:** EmptyState component exists, used by 3+ non-unified pages
**Risk Notes:** Low risk - simple component, easy to implement

#### R-17: Migrate Pages to EmptyState Component
**What:** Replace hardcoded empty state JSX with EmptyState component
**Where:** Pages with custom empty states (bitly, kyc, analytics, etc.)
**Why:** Unifies empty state display across all admin pages
**Done Criteria:** All admin pages use EmptyState component (no hardcoded empty state JSX)
**Risk Notes:** Low risk - straightforward migration

### 4.7 Loading System Completion

#### R-18: Create LoadingSpinner Component
**What:** Create reusable LoadingSpinner component
**Where:** Create `components/LoadingSpinner.tsx`, `components/LoadingSpinner.module.css`
**Why:** Eliminates duplicate spinner implementations across 10+ pages
**Done Criteria:** LoadingSpinner component exists, used by 5+ pages
**Risk Notes:** Low risk - simple component, easy to implement

#### R-19: Create LoadingSkeleton Component
**What:** Create generic LoadingSkeleton component for table/card loading states
**Where:** Create `components/LoadingSkeleton.tsx`, `components/LoadingSkeleton.module.css`
**Why:** Eliminates duplicate skeleton implementations across 5+ pages
**Done Criteria:** LoadingSkeleton component exists, used by 3+ pages
**Risk Notes:** Low risk - standard skeleton pattern, easy to implement

#### R-20: Migrate Pages to Loading Components
**What:** Replace hardcoded loading states with LoadingSpinner/LoadingSkeleton
**Where:** Pages with custom loading states
**Why:** Unifies loading display across all admin pages
**Done Criteria:** All admin pages use LoadingSpinner or LoadingSkeleton (no hardcoded loading JSX)
**Risk Notes:** Low risk - straightforward migration

### 4.8 Styling Unification

#### R-21: Remove Inline Styles
**What:** Replace all inline `style={{}}` props with CSS modules or design tokens
**Where:** All `app/admin/**/*.tsx` files
**Why:** Eliminates ad-hoc styling, enforces design system usage
**Done Criteria:** No inline styles in admin pages (all styles via CSS modules or design tokens)
**Risk Notes:** Low risk - systematic cleanup, can be done incrementally

#### R-22: Standardize CSS Module Usage
**What:** Ensure all page-specific CSS modules use design tokens consistently
**Where:** All `app/admin/**/*.module.css` files
**Why:** Enforces design system consistency, reduces maintenance burden
**Done Criteria:** All CSS modules use design tokens (no hardcoded colors, spacing, etc.)
**Risk Notes:** Medium risk - many CSS files to audit, can be done incrementally

### 4.9 Layout Shell Unification

#### R-23: Migrate Pages to UnifiedAdminPage
**What:** Migrate remaining pages to use UnifiedAdminPage (bitly, kyc, content-library, etc.)
**Where:** Pages not using UnifiedAdminPage
**Why:** Unifies layout shell across all admin pages
**Done Criteria:** All list/card-based admin pages use UnifiedAdminPage (no custom layout shells)
**Risk Notes:** Medium risk - some pages have unique requirements, may need adapter customization

#### R-24: Create Adapters for Remaining Pages
**What:** Create adapters for pages not yet using UnifiedAdminPage (bitly, kyc, content-library, etc.)
**Where:** Create `lib/adapters/bitlyAdapter.tsx`, `lib/adapters/kycAdapter.tsx`, etc.
**Why:** Enables UnifiedAdminPage migration for remaining pages
**Done Criteria:** Adapters exist for all list/card-based admin pages
**Risk Notes:** Medium risk - some pages have complex requirements, adapters may need customization

### 4.10 Documentation and Standards

#### R-25: Create Admin UI Component Usage Guide
**What:** Document when to use each UI primitive component
**Where:** Create `docs/components/ADMIN_UI_COMPONENTS.md`
**Why:** Provides clear guidance for future development, prevents fragmentation
**Done Criteria:** Usage guide exists, documents all UI primitives with examples
**Risk Notes:** Low risk - documentation only

---

## 5. Summary Statistics

### Current State
- **Total Admin Routes:** 38 pages
- **Pages Using UnifiedAdminPage:** 4 (categories, users, partners, events)
- **Pages Using FormModal:** 13+
- **Pages Using Hardcoded Tables:** 8+
- **Pages Using Custom Modals:** 3+
- **Pages Using Inline Message State:** 15+
- **Pages Using Ad-Hoc Styling:** 15+

### Target State
- **All list/card pages use UnifiedAdminPage:** 15+ pages
- **All pages use FormModal/BaseModal:** 38 pages
- **All pages use UnifiedListView/UnifiedCardView:** 15+ pages
- **All pages use Toast system:** 38 pages
- **All pages use EmptyState component:** 15+ pages
- **All pages use Loading components:** 38 pages
- **No inline styles:** 0 pages
- **All CSS uses design tokens:** 38 pages

---

## 6. Priority Ordering

### High Priority (Foundation)
1. R-13, R-14: Toast system (affects 15+ pages)
2. R-08, R-09: Form system completion (affects 10+ pages)
3. R-16: EmptyState component (affects 5+ pages)
4. R-18, R-19: Loading components (affects 10+ pages)

### Medium Priority (Unification)
5. R-01, R-02, R-03: Modal system unification (affects 3+ pages)
6. R-04, R-05, R-06, R-07: Table system unification (affects 8+ pages)
7. R-11, R-12: PageHeader unification (affects 3+ pages)
8. R-15, R-17, R-20: Migrate pages to unified systems (affects 20+ pages)

### Low Priority (Polish)
9. R-21, R-22: Styling unification (affects 15+ pages)
10. R-23, R-24: Layout shell unification (affects 10+ pages)
11. R-25: Documentation (affects 0 pages, but important for maintenance)

---

## 7. Files Modified (Reference Only)

This section lists files that will be modified during remediation (for reference, not to be modified in this audit phase).

### Files to Create
- `components/FormField.tsx`
- `components/Toast.tsx`
- `components/Toast.module.css`
- `contexts/ToastContext.tsx`
- `components/EmptyState.tsx`
- `components/EmptyState.module.css`
- `components/LoadingSpinner.tsx`
- `components/LoadingSpinner.module.css`
- `components/LoadingSkeleton.tsx`
- `components/LoadingSkeleton.module.css`
- `lib/formValidation.ts`
- `lib/adapters/kycAdapter.tsx`
- `lib/adapters/bitlyAdapter.tsx`
- `docs/components/ADMIN_UI_COMPONENTS.md`

### Files to Modify (During Remediation)
- `app/admin/bitly/page.tsx`
- `app/admin/clicker-manager/page.tsx`
- `app/admin/kyc/page.tsx`
- `app/admin/analytics/executive/page.tsx`
- `app/admin/content-library/page.tsx`
- `app/admin/styles/page.tsx`
- `app/admin/styles/[id]/page.tsx`
- `app/admin/visualization/page.tsx`
- (And 20+ other admin pages during migration)

### Files to Deprecate (During Remediation)
- `components/AdminHero.tsx`
- `components/AdminPageHero.tsx`
- `components/UnifiedPageHero.tsx`

---

## 8. Status

✅ **INVESTIGATION COMPLETE** - Route inventory, fragmentation analysis, UI primitives target set, and remediation queue documented.

---

## 9. Notes

- This audit is code-grounded and repo-traceable (all claims reference specific file paths and line numbers)
- No feature work, visual redesign, or documentation rewriting was performed
- All remediation items are actionable with clear "what", "where", "why", and "done criteria"
- Priority ordering is based on impact (number of pages affected) and foundation dependencies
- Estimated remediation effort: 25 items, can be done incrementally over multiple phases
```

## ADMIN_UI_ALGORITHMS_MODEL
<a id="admin-ui-algorithms-model"></a>

- Source: `docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-algorithms-model`

```markdown
# Admin UI Algorithms (Chart Creator) Model
Status: Complete
Last Updated: 2026-01-13T18:30:00.000Z
Canonical: No
Owner: Audit

1 Purpose
- [x] Define the Chart Algorithm configuration model and Admin create/edit flow.
- [x] Map dependencies on KYC variables and report templates.
- [x] Document access rules and validation requirements.

2 Source of Truth and Storage
- [x] Chart configurations are stored in MongoDB `chart_configurations` and managed via `/api/chart-config` CRUD. Evidence: [app/api/chart-config/route.ts](app/api/chart-config/route.ts).

3 Chart Configuration Model (ChartConfiguration)
| Field | Definition | Evidence |
| --- | --- | --- |
| [x] chartId | Unique chart identifier (e.g., "gender-distribution"). | [lib/chartConfigTypes.ts](lib/chartConfigTypes.ts), [app/api/chart-config/route.ts](app/api/chart-config/route.ts) |
| [x] title | Human-readable chart title. | [lib/chartConfigTypes.ts](lib/chartConfigTypes.ts) |
| [x] type | Chart type: pie, bar, kpi, text, image, table. | [lib/chartConfigTypes.ts](lib/chartConfigTypes.ts), [app/api/chart-config/route.ts](app/api/chart-config/route.ts) |
| [x] order | Display order (positive number). | [lib/chartConfigTypes.ts](lib/chartConfigTypes.ts), [app/api/chart-config/route.ts](app/api/chart-config/route.ts) |
| [x] isActive | Visibility flag for template/rendering. | [lib/chartConfigTypes.ts](lib/chartConfigTypes.ts), [app/api/chart-config/public/route.ts](app/api/chart-config/public/route.ts) |
| [x] elements | Chart elements array (see Element Model). | [lib/chartConfigTypes.ts](lib/chartConfigTypes.ts) |
| [x] icon/iconVariant | Material icon name + variant. | [lib/chartConfigTypes.ts](lib/chartConfigTypes.ts), [app/api/chart-config/route.ts](app/api/chart-config/route.ts) |
| [x] emoji | Legacy emoji (deprecated). | [lib/chartConfigTypes.ts](lib/chartConfigTypes.ts) |
| [x] subtitle | Optional subtitle/description. | [lib/chartConfigTypes.ts](lib/chartConfigTypes.ts) |
| [x] showTotal/totalLabel | Totals display options (bar charts). | [lib/chartConfigTypes.ts](lib/chartConfigTypes.ts) |
| [x] aspectRatio | Image/text chart aspect ratio. | [lib/chartConfigTypes.ts](lib/chartConfigTypes.ts) |
| [x] heroSettings | HERO block visibility settings. | [lib/chartConfigTypes.ts](lib/chartConfigTypes.ts), [app/api/chart-config/route.ts](app/api/chart-config/route.ts) |
| [x] alignmentSettings | Block alignment settings (titles/descriptions/charts). | [lib/chartConfigTypes.ts](lib/chartConfigTypes.ts), [app/api/chart-config/route.ts](app/api/chart-config/route.ts) |
| [x] showTitle | Chart-level title visibility. | [lib/chartConfigTypes.ts](lib/chartConfigTypes.ts), [app/api/chart-config/route.ts](app/api/chart-config/route.ts) |
| [x] showPercentages | Pie chart percentage visibility. | [lib/chartConfigTypes.ts](lib/chartConfigTypes.ts), [app/api/chart-config/route.ts](app/api/chart-config/route.ts) |
| [x] createdAt/updatedAt/createdBy/lastModifiedBy | Audit fields written by API. | [app/api/chart-config/route.ts](app/api/chart-config/route.ts) |

4 Chart Type Rules (Element Counts)
- [x] pie requires exactly 2 elements. Evidence: [app/api/chart-config/route.ts](app/api/chart-config/route.ts).
- [x] bar requires exactly 5 elements. Evidence: [app/api/chart-config/route.ts](app/api/chart-config/route.ts).
- [x] kpi requires exactly 1 element. Evidence: [app/api/chart-config/route.ts](app/api/chart-config/route.ts).
- [x] text/image/table require exactly 1 element. Evidence: [app/api/chart-config/route.ts](app/api/chart-config/route.ts).

5 Element Model and Formatting
| Field | Definition | Evidence |
| --- | --- | --- |
| [x] id | Unique element id. | [lib/chartConfigTypes.ts](lib/chartConfigTypes.ts) |
| [x] label | Label for legend/row display. | [lib/chartConfigTypes.ts](lib/chartConfigTypes.ts) |
| [x] formula | Formula with KYC variables in `[var]` tokens. | [lib/chartConfigTypes.ts](lib/chartConfigTypes.ts), [lib/formulaEngine.ts](lib/formulaEngine.ts) |
| [x] color | Hex color for series. | [lib/chartConfigTypes.ts](lib/chartConfigTypes.ts) |
| [x] formatting | Optional { rounded, prefix, suffix }. | [lib/chartConfigTypes.ts](lib/chartConfigTypes.ts), [app/api/chart-config/route.ts](app/api/chart-config/route.ts) |
| [x] parameters | Optional [PARAM:key] values for formulas. | [lib/chartConfigTypes.ts](lib/chartConfigTypes.ts), [lib/chartCalculator.ts](lib/chartCalculator.ts) |
| [x] manualData | Optional [MANUAL:key] values for formulas. | [lib/chartConfigTypes.ts](lib/chartConfigTypes.ts), [lib/chartCalculator.ts](lib/chartCalculator.ts) |

6 Admin Surfaces and API Inventory
| Surface | API | Notes | Evidence |
| --- | --- | --- | --- |
| [x] /admin/charts | /api/chart-config | Chart Algorithm Manager UI (CRUD + search/sort/pagination). | [app/admin/charts/page.tsx](app/admin/charts/page.tsx), [components/ChartAlgorithmManager.tsx](components/ChartAlgorithmManager.tsx) |
| [x] /api/chart-config | GET/POST/PUT/DELETE | Admin CRUD with auth + validation. | [app/api/chart-config/route.ts](app/api/chart-config/route.ts) |
| [x] /api/chart-configs | GET | Active charts for visualization manager dropdown. | [app/api/chart-configs/route.ts](app/api/chart-configs/route.ts), [app/admin/visualization/page.tsx](app/admin/visualization/page.tsx) |
| [x] /api/chart-config/public | GET | Active charts for report rendering (public). | [app/api/chart-config/public/route.ts](app/api/chart-config/public/route.ts) |

7 Create/Edit/Delete Flow
- [x] Variables load from `/api/variables-config` for formula picker. Evidence: [components/ChartAlgorithmManager.tsx](components/ChartAlgorithmManager.tsx), [app/api/variables-config/route.ts](app/api/variables-config/route.ts).
- [x] Create/update uses `/api/chart-config` POST/PUT with CSRF-aware apiClient. Evidence: [components/ChartAlgorithmManager.tsx](components/ChartAlgorithmManager.tsx), [app/api/chart-config/route.ts](app/api/chart-config/route.ts), [lib/apiClient.ts](lib/apiClient.ts).
- [x] Delete uses `/api/chart-config?configurationId=` DELETE with confirmation prompt. Evidence: [components/ChartAlgorithmManager.tsx](components/ChartAlgorithmManager.tsx), [app/api/chart-config/route.ts](app/api/chart-config/route.ts).
- [x] Search/sort/pagination handled via `/api/chart-config` query params (search, offset, limit, sortField, sortOrder). Evidence: [components/ChartAlgorithmManager.tsx](components/ChartAlgorithmManager.tsx), [app/api/chart-config/route.ts](app/api/chart-config/route.ts).
- [x] Toggle isActive and ordering via PUT updates. Evidence: [components/ChartAlgorithmManager.tsx](components/ChartAlgorithmManager.tsx), [app/api/chart-config/route.ts](app/api/chart-config/route.ts).

8 Validation Rules (UI + API)
- [x] API validates required fields, element counts, formatting object shape, hero/alignment settings, and order > 0. Evidence: [app/api/chart-config/route.ts](app/api/chart-config/route.ts).
- [x] API rejects duplicate chartId values on create/update. Evidence: [app/api/chart-config/route.ts](app/api/chart-config/route.ts).
- [x] UI validates formula syntax via formulaEngine before save. Evidence: [components/ChartAlgorithmManager.tsx](components/ChartAlgorithmManager.tsx), [lib/formulaEngine.ts](lib/formulaEngine.ts).

9 Dependencies (KYC + Report Templates)
- [x] KYC variables are the source for formula tokens (global-only), fetched from `/api/variables-config`. Evidence: [components/ChartAlgorithmManager.tsx](components/ChartAlgorithmManager.tsx), [lib/formulaEngine.ts](lib/formulaEngine.ts), [app/api/variables-config/route.ts](app/api/variables-config/route.ts).
- [x] Report templates depend on active chart configurations via `/api/chart-configs` (template picker) and `/api/chart-config/public` (rendering). Evidence: [app/admin/visualization/page.tsx](app/admin/visualization/page.tsx), [app/api/chart-configs/route.ts](app/api/chart-configs/route.ts), [app/api/chart-config/public/route.ts](app/api/chart-config/public/route.ts), [lib/chartCalculator.ts](lib/chartCalculator.ts).

10 Permissions and Access
- [x] /admin/charts requires admin/superadmin (client-side /api/auth/check), and route protection sets /admin/charts to admin. Evidence: [app/admin/charts/page.tsx](app/admin/charts/page.tsx), [app/api/auth/check/route.ts](app/api/auth/check/route.ts), [lib/routeProtection.ts](lib/routeProtection.ts).
- [x] /api/chart-config POST/PUT/DELETE requires getAdminUser. Evidence: [app/api/chart-config/route.ts](app/api/chart-config/route.ts), [lib/auth.ts](lib/auth.ts).
- [x] /api/chart-config/public and /api/chart-configs are public read-only endpoints. Evidence: [app/api/chart-config/public/route.ts](app/api/chart-config/public/route.ts), [app/api/chart-configs/route.ts](app/api/chart-configs/route.ts).

11 Risks and Gaps
- [x] Auth model split: /admin/charts uses /api/auth/check while routeProtection uses its own role map. Evidence: [app/admin/charts/page.tsx](app/admin/charts/page.tsx), [lib/routeProtection.ts](lib/routeProtection.ts).
- [x] API validates structure but does not validate formula correctness; invalid formulas can be persisted if UI validation is bypassed. Evidence: [app/api/chart-config/route.ts](app/api/chart-config/route.ts), [components/ChartAlgorithmManager.tsx](components/ChartAlgorithmManager.tsx).
- [x] Multiple read endpoints (/api/chart-configs, /api/chart-config/public) increase drift risk if filters diverge. Evidence: [app/api/chart-configs/route.ts](app/api/chart-configs/route.ts), [app/api/chart-config/public/route.ts](app/api/chart-config/public/route.ts).

12 Admin Constraints (Do This / Do Not Do This)
- [x] Do: Treat chart configurations as global; no partner/event overrides.
- [x] Do: Keep KYC variables current before editing formulas.
- [x] Do: Use Chart Algorithm Manager for edits; keep /api/chart-config as the single admin write API.
- [x] Do not: Persist charts with invalid formulas or missing required elements.
- [x] Do not: Use public endpoints for admin editing workflows.
```

## ADMIN_UI_BITLY_FLOWS
<a id="admin-ui-bitly-flows"></a>

- Source: `docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-bitly-flows`

```markdown
# Admin UI Bitly Flows
Status: Complete
Last Updated: 2026-01-13T18:30:00.000Z
Canonical: No
Owner: Audit

1 Purpose
- [x] Map Admin Bitly association flows for partners and events.
- [x] Identify duplicate entry points (C-08) and declare canonical flow.
- [x] Provide execution-ready steps for association, sync, and removal.

2 Canonical Flow Declaration (C-08)
- [x] Canonical association surface: /admin/bitly for link-to-project and link-to-partner management. Evidence: [app/admin/bitly/page.tsx](app/admin/bitly/page.tsx), [operations/ACTION_PLAN.md](../../operations/ACTION_PLAN.md).
- [x] /admin/partners Bitly selector is a duplicate entry point and should be treated as read-only for association changes. Evidence: [app/admin/partners/page.tsx](app/admin/partners/page.tsx), [operations/ACTION_PLAN.md](../../operations/ACTION_PLAN.md).

3 Flow: Import Links from Bitly (Global)
- [x] Admin triggers "Get Links from Bitly" in /admin/bitly. Evidence: [app/admin/bitly/page.tsx](app/admin/bitly/page.tsx).
- [x] UI calls POST /api/bitly/pull (limit=100). Evidence: [app/admin/bitly/page.tsx](app/admin/bitly/page.tsx), [app/api/bitly/pull/route.ts](app/api/bitly/pull/route.ts).
- [x] New bitly_links are inserted with projectId null (unassigned). Evidence: [app/api/bitly/pull/route.ts](app/api/bitly/pull/route.ts), [app/api/bitly/links/route.ts](app/api/bitly/links/route.ts).

4 Flow: Associate Link to Event (Project) in /admin/bitly
- [x] Admin uses "Add Link" or "Add to Project" in /admin/bitly. Evidence: [app/admin/bitly/page.tsx](app/admin/bitly/page.tsx).
- [x] POST /api/bitly/links with { projectId, bitlinkOrLongUrl } creates or reuses bitly_links and writes bitly_project_links association. Evidence: [app/api/bitly/links/route.ts](app/api/bitly/links/route.ts), [lib/bitly-junction.types.ts](lib/bitly-junction.types.ts).
- [x] Association metadata (startDate/endDate/autoCalculated/cachedMetrics) is stored in bitly_project_links. Evidence: [lib/bitly-junction.types.ts](lib/bitly-junction.types.ts), [app/api/bitly/project-metrics/[projectId]/route.ts](app/api/bitly/project-metrics/[projectId]/route.ts).

5 Flow: Associate/Remove Link to Event inside /admin/events
- [x] Event edit modal displays BitlyLinksEditor component. Evidence: [app/admin/events/page.tsx](app/admin/events/page.tsx), [components/BitlyLinksEditor.tsx](components/BitlyLinksEditor.tsx).
- [x] Add link uses POST /api/bitly/links (projectId + bitlink). Evidence: [components/BitlyLinksEditor.tsx](components/BitlyLinksEditor.tsx), [app/api/bitly/links/route.ts](app/api/bitly/links/route.ts).
- [x] Remove link uses DELETE /api/bitly/associations (junction delete). Evidence: [components/BitlyLinksEditor.tsx](components/BitlyLinksEditor.tsx), [app/api/bitly/associations/route.ts](app/api/bitly/associations/route.ts).

6 Flow: Associate Link to Partner in /admin/bitly
- [x] Admin selects partner association from /admin/bitly row controls. Evidence: [app/admin/bitly/page.tsx](app/admin/bitly/page.tsx).
- [x] POST /api/bitly/partners/associate adds link id to partners.bitlyLinkIds. Evidence: [app/api/bitly/partners/associate/route.ts](app/api/bitly/partners/associate/route.ts).
- [x] DELETE /api/bitly/partners/associate removes link id from partners.bitlyLinkIds. Evidence: [app/api/bitly/partners/associate/route.ts](app/api/bitly/partners/associate/route.ts).

7 Flow: Partner Link Selection in /admin/partners (Duplicate Entry Point)
- [x] Partner create/edit form includes BitlyLinksSelector. Evidence: [app/admin/partners/page.tsx](app/admin/partners/page.tsx), [components/BitlyLinksSelector.tsx](components/BitlyLinksSelector.tsx).
- [x] Selector reads links via GET /api/bitly/links. Evidence: [components/BitlyLinksSelector.tsx](components/BitlyLinksSelector.tsx), [app/api/bitly/links/route.ts](app/api/bitly/links/route.ts).
- [x] Partner save uses /api/partners (bitlyLinkIds not handled). Evidence: [app/admin/partners/page.tsx](app/admin/partners/page.tsx), [app/api/partners/route.ts](app/api/partners/route.ts).

8 Flow: Sync and Metrics Refresh
- [x] "Sync Now" triggers POST /api/bitly/sync to refresh bitly_links analytics. Evidence: [app/admin/bitly/page.tsx](app/admin/bitly/page.tsx), [app/api/bitly/sync/route.ts](app/api/bitly/sync/route.ts).
- [x] "Refresh Metrics" triggers POST /api/bitly/recalculate to update cached metrics in bitly_project_links. Evidence: [app/admin/bitly/page.tsx](app/admin/bitly/page.tsx), [app/api/bitly/recalculate/route.ts](app/api/bitly/recalculate/route.ts).

9 Flow: Remove or Archive Link
- [x] Delete association uses DELETE /api/bitly/associations (junction only). Evidence: [app/admin/bitly/page.tsx](app/admin/bitly/page.tsx), [app/api/bitly/associations/route.ts](app/api/bitly/associations/route.ts).
- [x] Archive link uses DELETE /api/bitly/links/[linkId] (soft delete). Evidence: [app/admin/bitly/page.tsx](app/admin/bitly/page.tsx), [app/api/bitly/links/[linkId]/route.ts](app/api/bitly/links/[linkId]/route.ts).

10 Visibility Rules
- [x] /admin/bitly shows all links (assigned + unassigned) with project and partner associations. Evidence: [app/admin/bitly/page.tsx](app/admin/bitly/page.tsx), [app/api/bitly/links/route.ts](app/api/bitly/links/route.ts).
- [x] /admin/events Bitly editor shows only links associated to the selected project. Evidence: [components/BitlyLinksEditor.tsx](components/BitlyLinksEditor.tsx), [app/api/bitly/project-metrics/[projectId]/route.ts](app/api/bitly/project-metrics/[projectId]/route.ts).
- [x] /admin/partners Bitly selector is for browsing/selection only until bitlyLinkIds persistence is aligned. Evidence: [app/admin/partners/page.tsx](app/admin/partners/page.tsx), [app/api/partners/route.ts](app/api/partners/route.ts).
```

## ADMIN_UI_BITLY_MODEL
<a id="admin-ui-bitly-model"></a>

- Source: `docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-bitly-model`

```markdown
# Admin UI Bitly Model
Status: Complete
Last Updated: 2026-01-13T18:30:00.000Z
Canonical: No
Owner: Audit

1 Purpose
- [x] Define the Bitly link data model and ownership boundaries.
- [x] Document the Admin-managed collections used for Bitly analytics.
- [x] Capture known inconsistencies and duplication points (C-08).

2 Ownership Scope and Permissions
| Entity | Ownership scope | Admin surface | Permissions | Evidence |
| --- | --- | --- | --- | --- |
| [x] bitly_links | Global | /admin/bitly | Admin (getAdminUser) | [app/admin/bitly/page.tsx](app/admin/bitly/page.tsx), [app/api/bitly/links/route.ts](app/api/bitly/links/route.ts) |
| [x] bitly_project_links | Event | /admin/bitly, /admin/events | Admin (getAdminUser for mutations) | [app/admin/bitly/page.tsx](app/admin/bitly/page.tsx), [components/BitlyLinksEditor.tsx](components/BitlyLinksEditor.tsx), [app/api/bitly/associations/route.ts](app/api/bitly/associations/route.ts) |
| [x] partners.bitlyLinkIds | Partner | /admin/bitly, /admin/partners | Admin (getAdminUser) | [app/api/bitly/partners/associate/route.ts](app/api/bitly/partners/associate/route.ts), [app/admin/partners/page.tsx](app/admin/partners/page.tsx), [lib/partner.types.ts](lib/partner.types.ts) |

3 Bitly Link Document (bitly_links)
| Field | Required | Description | Evidence |
| --- | --- | --- | --- |
| [x] bitlink | Yes | Normalized short link (e.g., bit.ly/abc123). | [app/api/bitly/links/route.ts](app/api/bitly/links/route.ts), [lib/bitly-db.types.ts](lib/bitly-db.types.ts) |
| [x] long_url | Yes | Destination URL for the short link. | [lib/bitly-db.types.ts](lib/bitly-db.types.ts), [app/api/bitly/links/route.ts](app/api/bitly/links/route.ts) |
| [x] title | Yes | Display title (Bitly or custom). | [lib/bitly-db.types.ts](lib/bitly-db.types.ts), [app/api/bitly/links/route.ts](app/api/bitly/links/route.ts) |
| [x] tags | No | Optional tags synced from Bitly or provided by Admin. | [lib/bitly-db.types.ts](lib/bitly-db.types.ts), [app/api/bitly/links/route.ts](app/api/bitly/links/route.ts) |
| [x] click_summary | Yes | Snapshot metrics (total, unique, updatedAt). | [lib/bitly-db.types.ts](lib/bitly-db.types.ts), [app/api/bitly/sync/route.ts](app/api/bitly/sync/route.ts) |
| [x] clicks_timeseries | Yes | Daily click series (last 365 days). | [lib/bitly-db.types.ts](lib/bitly-db.types.ts), [app/api/bitly/sync/route.ts](app/api/bitly/sync/route.ts) |
| [x] geo.countries | Yes | Country click distribution. | [lib/bitly-db.types.ts](lib/bitly-db.types.ts), [app/api/bitly/sync/route.ts](app/api/bitly/sync/route.ts) |
| [x] referrers | Yes | Top referrers by clicks. | [lib/bitly-db.types.ts](lib/bitly-db.types.ts), [app/api/bitly/sync/route.ts](app/api/bitly/sync/route.ts) |
| [x] referring_domains | Yes | Referring domains by clicks. | [lib/bitly-db.types.ts](lib/bitly-db.types.ts), [app/api/bitly/sync/route.ts](app/api/bitly/sync/route.ts) |
| [x] lastSyncAt | Yes | Last Bitly sync timestamp. | [lib/bitly-db.types.ts](lib/bitly-db.types.ts), [app/api/bitly/sync/route.ts](app/api/bitly/sync/route.ts) |
| [x] favorite | No | Admin favorite flag. | [app/api/bitly/links/[linkId]/route.ts](app/api/bitly/links/[linkId]/route.ts), [app/admin/bitly/page.tsx](app/admin/bitly/page.tsx) |
| [x] archived | No | Soft delete flag (hidden from active lists). | [app/api/bitly/links/[linkId]/route.ts](app/api/bitly/links/[linkId]/route.ts) |
| [x] createdAt/updatedAt | Yes | Audit timestamps (ISO 8601). | [lib/bitly-db.types.ts](lib/bitly-db.types.ts), [app/api/bitly/links/route.ts](app/api/bitly/links/route.ts) |

4 Bitly Project Link Junction (bitly_project_links)
| Field | Required | Description | Evidence |
| --- | --- | --- | --- |
| [x] bitlyLinkId | Yes | Reference to bitly_links._id. | [lib/bitly-junction.types.ts](lib/bitly-junction.types.ts), [app/api/bitly/associations/route.ts](app/api/bitly/associations/route.ts) |
| [x] projectId | Yes | Reference to projects._id. | [lib/bitly-junction.types.ts](lib/bitly-junction.types.ts), [app/api/bitly/associations/route.ts](app/api/bitly/associations/route.ts) |
| [x] startDate/endDate | No | Date range boundaries for attribution (nullable). | [lib/bitly-junction.types.ts](lib/bitly-junction.types.ts), [app/api/bitly/project-metrics/[projectId]/route.ts](app/api/bitly/project-metrics/[projectId]/route.ts) |
| [x] autoCalculated | Yes | True when date ranges are computed automatically. | [lib/bitly-junction.types.ts](lib/bitly-junction.types.ts) |
| [x] cachedMetrics | Yes | Aggregated metrics for the project-link period. | [lib/bitly-junction.types.ts](lib/bitly-junction.types.ts), [app/api/bitly/project-metrics/[projectId]/route.ts](app/api/bitly/project-metrics/[projectId]/route.ts) |
| [x] lastSyncedAt | No | Timestamp when cached metrics were refreshed. | [lib/bitly-junction.types.ts](lib/bitly-junction.types.ts), [app/api/bitly/recalculate/route.ts](app/api/bitly/recalculate/route.ts) |

5 Partner Bitly Association (partners.bitlyLinkIds)
- [x] Partners store Bitly link associations as bitlyLinkIds (ObjectId[]). Evidence: [lib/partner.types.ts](lib/partner.types.ts).
- [x] Bitly page writes partner associations through /api/bitly/partners/associate. Evidence: [app/api/bitly/partners/associate/route.ts](app/api/bitly/partners/associate/route.ts), [app/admin/bitly/page.tsx](app/admin/bitly/page.tsx).

6 Inputs and Sync Sources
- [x] Bulk import from Bitly group via /api/bitly/pull. Evidence: [app/api/bitly/pull/route.ts](app/api/bitly/pull/route.ts), [app/admin/bitly/page.tsx](app/admin/bitly/page.tsx).
- [x] Daily/manual analytics sync via /api/bitly/sync (cron + admin button). Evidence: [app/api/bitly/sync/route.ts](app/api/bitly/sync/route.ts), [app/admin/bitly/page.tsx](app/admin/bitly/page.tsx).
- [x] Cached metric refresh for associations via /api/bitly/recalculate. Evidence: [app/api/bitly/recalculate/route.ts](app/api/bitly/recalculate/route.ts), [app/admin/bitly/page.tsx](app/admin/bitly/page.tsx).

7 Outputs and Downstream Dependencies
- [x] Project-level Bitly metrics are exposed via /api/bitly/project-metrics/[projectId]. Evidence: [app/api/bitly/project-metrics/[projectId]/route.ts](app/api/bitly/project-metrics/[projectId]/route.ts), [components/BitlyLinksEditor.tsx](components/BitlyLinksEditor.tsx).
- [x] Bitly stats enrich project.stats fields used by KYC variables. Evidence: [lib/bitlyStatsEnricher.ts](lib/bitlyStatsEnricher.ts), [docs/conventions/conventions-variable-dictionary.md](docs/conventions/conventions-variable-dictionary.md).

8 Known Inconsistencies and Gaps
- [x] Legacy projectId field exists on bitly_links, but current association flow uses bitly_project_links. Evidence: [lib/bitly-db.types.ts](lib/bitly-db.types.ts), [app/api/bitly/links/route.ts](app/api/bitly/links/route.ts).
- [x] bitly-db.types.ts describes many-to-one, but code uses many-to-many junction table. Evidence: [lib/bitly-db.types.ts](lib/bitly-db.types.ts), [lib/bitly-junction.types.ts](lib/bitly-junction.types.ts).
- [x] /admin/partners UI allows Bitly selection, but partners API does not accept bitlyLinkIds in create/update payloads. Evidence: [app/admin/partners/page.tsx](app/admin/partners/page.tsx), [app/api/partners/route.ts](app/api/partners/route.ts).
- [x] /api/bitly/project-metrics has no admin auth guard. Evidence: [app/api/bitly/project-metrics/[projectId]/route.ts](app/api/bitly/project-metrics/[projectId]/route.ts).

9 Duplicate Association Flows (C-08)
- [x] Partner association is exposed in both /admin/bitly and /admin/partners. Evidence: [app/admin/bitly/page.tsx](app/admin/bitly/page.tsx), [app/admin/partners/page.tsx](app/admin/partners/page.tsx), [operations/ACTION_PLAN.md](../../operations/ACTION_PLAN.md).

10 Connected Dependencies
- [x] Bitly variables are categorized under KYC Variable Dictionary (Bitly metrics). Evidence: [docs/conventions/conventions-variable-dictionary.md](docs/conventions/conventions-variable-dictionary.md).
- [x] Route protection requires admin for /admin/bitly. Evidence: [lib/routeProtection.ts](lib/routeProtection.ts).
```

## ADMIN_UI_CAPABILITY_MAP
<a id="admin-ui-capability-map"></a>

- Source: `docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map`

```markdown
# Admin UI Capability Map
Status: Complete
Last Updated: 2026-01-13T18:30:00.000Z
Canonical: No
Owner: Audit

1 Purpose
- [x] Map Admin UI capabilities for A-UI-00 and capture ownership, inputs, outputs, and duplication using code references.
- [x] Inventory includes all verified admin routes under app/admin.

2 Admin Areas (A-UI-00)

2.1 Partners (A-UI-01)
- [x] Route: /admin/partners
- [x] Code references: [app/admin/partners/page.tsx](app/admin/partners/page.tsx), [lib/adapters/partnersAdapter.tsx](lib/adapters/partnersAdapter.tsx), [components/UnifiedAdminPage.tsx](components/UnifiedAdminPage.tsx)
- [x] Purpose: Manage partner records and partner-level reporting configuration, hashtags, and link associations.
- [x] Entities: Partner, reportTemplateId, styleId, bitlyLinkIds, hashtags, categorizedHashtags, sportsDb, GoogleSheetConfig.
- [x] Inputs: name, emoji, hashtags/categorizedHashtags, report template selection, report style selection, bitly link selection, logo upload, Google Sheets setup, SportsDB lookup.
- [x] Outputs: partner records, share links, report template/style assignment, bitly associations, Google Sheets sync state.
- [x] Ownership scope: Partner.
- [x] Permissions: Authenticated admin session via /api/admin/auth (useAdminAuth); no explicit role gating in page.
- [x] Known inconsistencies: None noted beyond duplication register.
- [x] Duplicate flows: Template/style assignment duplicates Events; bitly link association overlaps Bitly Manager; hashtag tagging overlaps Hashtag Manager and Category Manager; Google Sheets controls also appear in /admin/partners/[id].
- [x] Connected report/insight dependencies: reportTemplateId/styleId feed report rendering; SharePopup generates report links for partners.

2.1.1 A-UI-01 Documentation Target: Partners
- [x] Concrete page routes: /admin/partners, /admin/partners/[id], /admin/partners/[id]/analytics, /admin/partners/[id]/kyc-data
- [x] Main components: UnifiedAdminPage, FormModal, SharePopup, UnifiedHashtagInput, BitlyLinksSelector, EmojiSelector, TheSportsDBSearch, GoogleSheetsConnectModal, GoogleSheetsSyncButtons.
- [x] Report connections: reportTemplateId/styleId assignments drive partner report rendering; SharePopup uses viewSlug for report links; partner KYC data uses global variables-config for report data.

2.2 Events (A-UI-02)
- [x] Route: /admin/events
- [x] Code references: [app/admin/events/page.tsx](app/admin/events/page.tsx), [lib/adapters/projectsAdapter.tsx](lib/adapters/projectsAdapter.tsx), [components/SharePopup.tsx](components/SharePopup.tsx)
- [x] Purpose: Manage event (project) records, partner associations, and reporting configuration.
- [x] Entities: Project (Event), partner1Id/partner2Id, reportTemplateId, styleId, hashtags, categorizedHashtags, viewSlug.
- [x] Inputs: event name/date, partner selection, hashtags/categorizedHashtags, report template/style selection.
- [x] Outputs: event records, share links, report template/style assignment for reports.
- [x] Ownership scope: Event.
- [x] Permissions: Authenticated admin session via /api/admin/auth (useAdminAuth); no explicit role gating in page.
- [x] Known inconsistencies: None noted beyond duplication register.
- [x] Duplicate flows: Template/style assignment duplicates Partners; bitly associations handled in Bitly Manager; hashtag management overlaps Hashtag Manager; partner assignments overlap /admin/project-partners; event KYC detail exists at /admin/events/[id]/kyc-data.
- [x] Connected report/insight dependencies: reportTemplateId/styleId feed report rendering; SharePopup generates event report links; event stats feed analytics insights.

2.2.1 A-UI-02 Documentation Target: Events
- [x] Concrete page routes: /admin/events, /admin/events/[id]/kyc-data, /admin/project-partners, /admin/quick-add, /admin/projects (redirect)
- [x] Main components: UnifiedAdminPage, FormModal, SharePopup, UnifiedHashtagInput, BitlyLinksEditor.
- [x] Report connections: event report template/style assignments feed report rendering; SharePopup uses viewSlug for report links; event KYC data table ties to report variables.

2.3 Filters (A-UI-03)
- [x] Route: /admin/filter
- [x] Code references: [app/admin/filter/page.tsx](app/admin/filter/page.tsx), [components/HashtagMultiSelect.tsx](components/HashtagMultiSelect.tsx), [components/SharePopup.tsx](components/SharePopup.tsx)
- [x] Purpose: Filter project statistics by hashtags and present aggregated results.
- [x] Entities: Hashtag, ProjectStats, report style, filter slug.
- [x] Inputs: selected hashtags, report style selection.
- [x] Outputs: aggregated stats/project list and shareable filter slug.
- [x] Ownership scope: Event (cross-event filter view).
- [x] Permissions: No explicit auth check in page; relies on admin layout and API access.
- [x] Known inconsistencies: None noted beyond duplication register.
- [x] Duplicate flows: Hashtag search/pagination duplicates Hashtag Manager; style selection duplicates Styles; filtering overlaps dashboard filter tab.
- [x] Connected report/insight dependencies: Uses report style library; share slug ties to report/share views; filtered stats feed report-like dashboards.

2.3.1 A-UI-03 Documentation Target: Filters
- [x] Concrete page routes: /admin/filter
- [x] Main components: HashtagMultiSelect, SharePopup, UnifiedAdminHeroWithSearch, ColoredCard, ColoredHashtagBubble.
- [x] Report connections: uses /api/report-styles for style selection and persists filter styles for shareable report views.

2.4 Users (A-UI-04)
- [x] Route: /admin/users
- [x] Code references: [app/admin/users/page.tsx](app/admin/users/page.tsx), [lib/auth.ts](lib/auth.ts)
- [x] Purpose: Manage admin users, roles, and API access.
- [x] Entities: AdminUser, role, API access.
- [x] Inputs: create user (email, name, role), regenerate password, toggle API access, change role.
- [x] Outputs: admin accounts, role assignments, API access state.
- [x] Ownership scope: User.
- [x] Permissions: Authenticated admin session via /api/admin/auth; role enforcement handled by backend endpoints.
- [x] Known inconsistencies: None observed in code references.
- [x] Duplicate flows: None observed.
- [x] Connected report/insight dependencies: Roles gate access to report and insight administration; no direct report data dependencies.

2.4.1 A-UI-04 Documentation Target: Users
- [x] Concrete page routes: /admin/users
- [x] Main components: UnifiedAdminPage, FormModal, PasswordModal, RoleDropdown, ConfirmDialog.
- [x] Report connections: no direct report data; role permissions control access to report and insight admin areas.

2.5 Insights (A-UI-05)
- [x] Route: /admin/insights
- [x] Code references: [app/admin/insights/page.tsx](app/admin/insights/page.tsx)
- [x] Purpose: View analytics insights with filtering controls.
- [x] Entities: Insight, InsightsMetadata.
- [x] Inputs: type filter, severity filter, limit.
- [x] Outputs: insight list and metadata for analytics monitoring.
- [x] Ownership scope: Global.
- [x] Permissions: No explicit auth check in page; relies on admin layout and API access.
- [x] Known inconsistencies: Overlaps /admin/analytics/insights (separate dashboard and endpoints).
- [x] Duplicate flows: Insights are duplicated between /admin/insights and /admin/analytics/insights.
- [x] Connected report/insight dependencies: Consumes /api/analytics/insights; insights derived from analytics data used in executive analytics.

2.5.1 A-UI-05 Documentation Target: Insights
- [x] Concrete page routes: /admin/insights, /admin/analytics/insights
- [x] Main components: AdminHero, InsightCard, ColoredCard.
- [x] Report connections: analytics insights feed executive analytics and dashboard KPIs; no report template configuration.

2.6 KYC (A-UI-06)
- [x] Route: /admin/kyc
- [x] Code references: [app/admin/kyc/page.tsx](app/admin/kyc/page.tsx)
- [x] Purpose: Manage variables catalog used by analytics and clicker.
- [x] Entities: Variable, variable flags, categories.
- [x] Inputs: variable create/edit, source filters, flags, category tags.
- [x] Outputs: variables configuration for clicker and analytics.
- [x] Ownership scope: Global.
- [x] Permissions: No explicit auth check in page; relies on admin layout and API access.
- [x] Known inconsistencies: Partner and event KYC data pages present scoped datasets while variable definitions remain global in /admin/kyc.
- [x] Duplicate flows: Variable definitions are edited here and referenced in ChartAlgorithmManager and Clicker Manager.
- [x] Connected report/insight dependencies: variables-config drives chart algorithms and report templates; KYC data tables surface variables used in reports and analytics.

2.6.1 A-UI-06 Documentation Target: KYC
- [x] Concrete page routes: /admin/kyc, /admin/partners/[id]/kyc-data, /admin/events/[id]/kyc-data
- [x] Main components: UnifiedAdminHeroWithSearch, FormModal, MaterialIcon, ColoredCard.
- [x] Report connections: variables-config feeds chart algorithms and report templates; partner/event KYC data reflects report variables.
- [x] KYC to Algorithms mapping: variables-config consumed by ChartAlgorithmManager for formulas and field definitions. Evidence: [components/ChartAlgorithmManager.tsx](components/ChartAlgorithmManager.tsx), [app/admin/charts/page.tsx](app/admin/charts/page.tsx)
- [x] KYC to Report templates mapping: report templates reference chart configs that rely on variables-config. Evidence: [app/admin/visualization/page.tsx](app/admin/visualization/page.tsx), [lib/chartConfigTypes.ts](lib/chartConfigTypes.ts)
- [x] Partner vs global conflict notes: Partner/event KYC data pages present scoped datasets while variable definitions remain global; no partner-specific variables-config observed.

2.7 Algorithms
- [x] Route: /admin/charts
- [x] Code references: [app/admin/charts/page.tsx](app/admin/charts/page.tsx), [components/ChartAlgorithmManager.tsx](components/ChartAlgorithmManager.tsx)
- [x] Purpose: Manage chart algorithm configurations and formatting defaults.
- [x] Entities: chart config, chart formatting defaults, variables.
- [x] Inputs: chart configuration fields and formulas.
- [x] Outputs: chart configuration used in report rendering and validation.
- [x] Ownership scope: Global.
- [x] Permissions: Client-side role gate uses /api/auth/check for admin or superadmin.
- [x] Known inconsistencies: None noted beyond duplication register.
- [x] Duplicate flows: Depends on variables-config managed in KYC; overlap in variable management surfaces.
- [x] Connected report/insight dependencies: chart configs are referenced by report templates and rendering.

2.8 Clicker Manager
- [x] Route: /admin/clicker-manager
- [x] Code references: [app/admin/clicker-manager/page.tsx](app/admin/clicker-manager/page.tsx)
- [x] Purpose: Configure variable groups, ordering, and visibility for clicker UI.
- [x] Entities: VariableGroup, Variable.
- [x] Inputs: group order, variable selection, visibility toggles, seed defaults.
- [x] Outputs: clicker layout configuration for editor UI.
- [x] Ownership scope: Global.
- [x] Permissions: Authenticated admin session via /api/admin/auth (useAdminAuth); no explicit role gating in page.
- [x] Known inconsistencies: None noted beyond duplication register.
- [x] Duplicate flows: Variable definitions are managed in KYC; clicker groups depend on shared variables.
- [x] Connected report/insight dependencies: clicker variables drive data capture for reports and analytics.

2.9 Bitly Manager
- [x] Route: /admin/bitly
- [x] Code references: [app/admin/bitly/page.tsx](app/admin/bitly/page.tsx), [components/ProjectSelector.tsx](components/ProjectSelector.tsx), [components/PartnerSelector.tsx](components/PartnerSelector.tsx)
- [x] Purpose: Manage Bitly links and their associations to projects and partners.
- [x] Entities: BitlyLink, Project, Partner.
- [x] Inputs: link creation, partner/project associations, favorites, sync and analytics actions.
- [x] Outputs: link associations and analytics metadata.
- [x] Ownership scope: Global with partner/event associations.
- [x] Permissions: Authenticated admin session via /api/admin/auth (useAdminAuth).
- [x] Known inconsistencies: None noted beyond duplication register.
- [x] Duplicate flows: Partner link association also managed in Partners.
- [x] Connected report/insight dependencies: Bitly links used for report/share URLs and link analytics.

2.10 Hashtag Manager
- [x] Route: /admin/hashtags
- [x] Code references: [app/admin/hashtags/page.tsx](app/admin/hashtags/page.tsx), [components/HashtagEditor.tsx](components/HashtagEditor.tsx)
- [x] Purpose: Manage hashtag colors and browse hashtag usage.
- [x] Entities: Hashtag, HashtagColor.
- [x] Inputs: search term, color updates, cascade actions.
- [x] Outputs: hashtag color metadata for display and filtering.
- [x] Ownership scope: Global.
- [x] Permissions: Client-side role gate uses /api/auth/check for admin or superadmin.
- [x] Known inconsistencies: None noted beyond duplication register.
- [x] Duplicate flows: Hashtag categories are managed separately in Category Manager.
- [x] Connected report/insight dependencies: hashtags drive report filtering and analytics grouping.

2.11 Category Manager
- [x] Route: /admin/categories
- [x] Code references: [app/admin/categories/page.tsx](app/admin/categories/page.tsx), [lib/hashtagCategoryTypes.ts](lib/hashtagCategoryTypes.ts)
- [x] Purpose: Manage hashtag categories, ordering, and color metadata.
- [x] Entities: HashtagCategory.
- [x] Inputs: category name, color, order.
- [x] Outputs: categories used for hashtag tagging and filtering.
- [x] Ownership scope: Global.
- [x] Permissions: No explicit auth check in page; relies on admin layout and API access.
- [x] Known inconsistencies: None noted beyond duplication register.
- [x] Duplicate flows: Hashtag color editing lives in Hashtag Manager, splitting hashtag metadata across pages.
- [x] Connected report/insight dependencies: hashtag categories influence report filtering and analytics groupings.

2.12 Reporting
- [x] Route: /admin/visualization
- [x] Code references: [app/admin/visualization/page.tsx](app/admin/visualization/page.tsx), [lib/reportTemplateTypes.ts](lib/reportTemplateTypes.ts), [lib/chartConfigTypes.ts](lib/chartConfigTypes.ts)
- [x] Purpose: Manage report templates, data blocks, and chart assignments.
- [x] Entities: ReportTemplate, DataVisualizationBlock, chart config, user preferences.
- [x] Inputs: template creation, block composition, chart selection, grid settings.
- [x] Outputs: report templates used by partners and events.
- [x] Ownership scope: Global.
- [x] Permissions: No explicit auth check in page; relies on admin layout and API access.
- [x] Known inconsistencies: Template selection also exists in Partners and Events; default rules must be aligned.
- [x] Duplicate flows: Template assignment overlaps Partners and Events configuration.
- [x] Connected report/insight dependencies: report templates are core to report rendering and chart selection.

2.13 Style Library
- [x] Route: /admin/styles
- [x] Code references: [app/admin/styles/page.tsx](app/admin/styles/page.tsx), [lib/reportStyleTypes.ts](lib/reportStyleTypes.ts)
- [x] Purpose: Manage report style library for reports.
- [x] Entities: ReportStyle.
- [x] Inputs: create/edit/delete style records; navigation to editor.
- [x] Outputs: styles list and updated style records.
- [x] Ownership scope: Global.
- [x] Permissions: No explicit auth check in page; relies on admin layout and API access.
- [x] Known inconsistencies: None noted beyond duplication register.
- [x] Duplicate flows: Style selection occurs in Partners, Events, and Filters; editor lives at /admin/styles/[id].
- [x] Connected report/insight dependencies: report styles drive report rendering and filter styling.

2.14 Cache Management
- [x] Route: /admin/cache
- [x] Code references: [app/admin/cache/page.tsx](app/admin/cache/page.tsx)
- [x] Purpose: Clear server and browser caches.
- [x] Entities: cache types (build, routes, browser, all).
- [x] Inputs: cache clear actions.
- [x] Outputs: cache invalidation results.
- [x] Ownership scope: Global.
- [x] Permissions: Authenticated admin session via /api/admin/auth (useAdminAuth).
- [x] Known inconsistencies: None observed.
- [x] Duplicate flows: None observed.
- [x] Connected report/insight dependencies: cache actions affect report and analytics freshness; no direct data dependency.

2.15 User Guide
- [x] Route: /admin/help
- [x] Code references: [app/admin/help/page.tsx](app/admin/help/page.tsx)
- [x] Purpose: Display admin user guide content with role-based messages.
- [x] Entities: user role, guide sections.
- [x] Inputs: none (read-only page).
- [x] Outputs: help and onboarding content.
- [x] Ownership scope: Global.
- [x] Permissions: Uses /api/admin/auth for greeting; page includes guest guidance.
- [x] Known inconsistencies: Comment references END_USER_GUIDE.md which is not present; guide content is embedded in page.
- [x] Duplicate flows: None observed.
- [x] Connected report/insight dependencies: None observed.

2.16 Admin Dashboard (Root)
- [x] Route: /admin
- [x] Code references: [app/admin/page.tsx](app/admin/page.tsx), [components/AdminDashboard.tsx](components/AdminDashboard.tsx), [hooks/useAdminAuth.ts](hooks/useAdminAuth.ts)
- [x] Purpose: Entry dashboard with navigation cards to admin areas.
- [x] Entities: AdminUser, permissions.
- [x] Inputs: none (read-only dashboard).
- [x] Outputs: navigation to admin sections.
- [x] Ownership scope: Global.
- [x] Permissions: Authenticated admin session via /api/admin/auth (useAdminAuth).
- [x] Known inconsistencies: Overlaps /admin/dashboard dashboard view.
- [x] Duplicate flows: Dashboard content overlaps /admin/dashboard.
- [x] Connected report/insight dependencies: Navigation to report and analytics surfaces; no direct report data dependency.

2.17 Dashboard (Legacy)
- [x] Route: /admin/dashboard
- [x] Code references: [app/admin/dashboard/page.tsx](app/admin/dashboard/page.tsx)
- [x] Purpose: Aggregated dashboard with overview, success metrics, stats, and multi-hashtag filtering.
- [x] Entities: Project, ProjectStats, hashtag slugs.
- [x] Inputs: tab selection, hashtag filter.
- [x] Outputs: aggregated stats and filtered project list.
- [x] Ownership scope: Global.
- [x] Permissions: Reads admin_token/admin_user cookies; no /api/admin/auth check in page.
- [x] Known inconsistencies: Auth guard differs from /api/admin/auth usage in other admin pages.
- [x] Duplicate flows: Overlaps /admin root dashboard and /admin/filter filtering.
- [x] Connected report/insight dependencies: Aggregated stats overlap with insights and report analytics.

2.18 Projects Redirect
- [x] Route: /admin/projects
- [x] Code references: [app/admin/projects/page.tsx](app/admin/projects/page.tsx)
- [x] Purpose: Redirect legacy /admin/projects route to /admin/events.
- [x] Entities: none.
- [x] Inputs: none.
- [x] Outputs: client-side redirect to /admin/events.
- [x] Ownership scope: Global.
- [x] Permissions: No explicit auth check in page.
- [x] Known inconsistencies: Legacy route kept for backward compatibility.
- [x] Duplicate flows: Duplicate entrypoint to /admin/events.
- [x] Connected report/insight dependencies: None observed.

2.19 Project-Partner Relationships
- [x] Route: /admin/project-partners
- [x] Code references: [app/admin/project-partners/page.tsx](app/admin/project-partners/page.tsx)
- [x] Purpose: Manage partner1/partner2 assignments for projects and auto-suggest partners.
- [x] Entities: Project, Partner.
- [x] Inputs: partner selection, auto-suggest action, filter (all/missing/assigned).
- [x] Outputs: updated partner assignments for projects.
- [x] Ownership scope: Event.
- [x] Permissions: No explicit auth check in page.
- [x] Known inconsistencies: None noted beyond duplication register.
- [x] Duplicate flows: Partner assignment overlaps /admin/events edit flow.
- [x] Connected report/insight dependencies: Partner assignment affects report ownership and analytics grouping.

2.20 Partner Detail
- [x] Route: /admin/partners/[id]
- [x] Code references: [app/admin/partners/[id]/page.tsx](app/admin/partners/[id]/page.tsx), [components/GoogleSheetsConnectModal.tsx](components/GoogleSheetsConnectModal.tsx), [components/GoogleSheetsSyncButtons.tsx](components/GoogleSheetsSyncButtons.tsx)
- [x] Purpose: Partner detail view with Google Sheets integration controls.
- [x] Entities: Partner, GoogleSheetConfig.
- [x] Inputs: connect/disconnect sheet, pull/push sync.
- [x] Outputs: Google Sheets sync status and partner metadata.
- [x] Ownership scope: Partner.
- [x] Permissions: Authenticated admin session via /api/admin/auth (useAdminAuth).
- [x] Known inconsistencies: None noted beyond duplication register.
- [x] Duplicate flows: Google Sheets controls also appear in /admin/partners list page.
- [x] Connected report/insight dependencies: Google Sheets sync affects partner data used in reports.

2.21 Partner Analytics
- [x] Route: /admin/partners/[id]/analytics
- [x] Code references: [app/admin/partners/[id]/analytics/page.tsx](app/admin/partners/[id]/analytics/page.tsx)
- [x] Purpose: Partner analytics dashboard with summary, trends, and comparisons.
- [x] Entities: PartnerAnalyticsData, event summaries.
- [x] Inputs: tab selection.
- [x] Outputs: analytics views and tables for partner.
- [x] Ownership scope: Partner.
- [x] Permissions: Authenticated admin session via /api/admin/auth (useAdminAuth).
- [x] Known inconsistencies: Analytics dashboards also exist at /admin/insights and /admin/analytics/*.
- [x] Duplicate flows: Analytics/insight dashboards overlap across partner analytics and global insights.
- [x] Connected report/insight dependencies: Uses analytics datasets that also feed insights and executive analytics.

2.22 Partner KYC Data
- [x] Route: /admin/partners/[id]/kyc-data
- [x] Code references: [app/admin/partners/[id]/kyc-data/page.tsx](app/admin/partners/[id]/kyc-data/page.tsx)
- [x] Purpose: Aggregated KYC data across all events for a partner.
- [x] Entities: Partner, VariableMetadata, aggregated stats.
- [x] Inputs: search, category filter.
- [x] Outputs: aggregated KYC table for partner.
- [x] Ownership scope: Partner.
- [x] Permissions: Authenticated admin session via /api/admin/auth (useAdminAuth).
- [x] Known inconsistencies: None noted beyond duplication register.
- [x] Duplicate flows: Similar KYC view exists for events.
- [x] Connected report/insight dependencies: KYC data derived from variables-config used in reports and analytics.

2.23 Event KYC Data
- [x] Route: /admin/events/[id]/kyc-data
- [x] Code references: [app/admin/events/[id]/kyc-data/page.tsx](app/admin/events/[id]/kyc-data/page.tsx)
- [x] Purpose: Event-specific KYC data table view.
- [x] Entities: Project, VariableMetadata.
- [x] Inputs: search, category filter.
- [x] Outputs: KYC table for a single event.
- [x] Ownership scope: Event.
- [x] Permissions: Authenticated admin session via /api/admin/auth (useAdminAuth).
- [x] Known inconsistencies: None noted beyond duplication register.
- [x] Duplicate flows: Similar KYC view exists for partners.
- [x] Connected report/insight dependencies: KYC data derived from variables-config used in reports and analytics.

2.24 Quick Add
- [x] Route: /admin/quick-add
- [x] Code references: [app/admin/quick-add/page.tsx](app/admin/quick-add/page.tsx)
- [x] Purpose: Bulk event creation from sheet data and partner selections.
- [x] Entities: Project, Partner, fixtures.
- [x] Inputs: raw sheet row data, partner selections, match date, fixture selection.
- [x] Outputs: new projects/events and drafted fixtures.
- [x] Ownership scope: Event.
- [x] Permissions: No explicit auth check in page.
- [x] Known inconsistencies: None noted beyond duplication register.
- [x] Duplicate flows: Event creation overlaps /admin/events.
- [x] Connected report/insight dependencies: Newly created events drive report generation and analytics.

2.25 Content Library
- [x] Route: /admin/content-library
- [x] Code references: [app/admin/content-library/page.tsx](app/admin/content-library/page.tsx), [lib/contentAssetTypes.ts](lib/contentAssetTypes.ts)
- [x] Purpose: Manage image/text content assets for chart formulas.
- [x] Entities: ContentAsset, ChartReference.
- [x] Inputs: upload/edit/delete assets, search, filters.
- [x] Outputs: content asset records and usage status.
- [x] Ownership scope: Global.
- [x] Permissions: No explicit auth check in page.
- [x] Known inconsistencies: None observed.
- [x] Duplicate flows: None observed.
- [x] Connected report/insight dependencies: Content assets referenced in chart formulas and report templates.

2.26 Admin Design
- [x] Route: /admin/design
- [x] Code references: [app/admin/design/page.tsx](app/admin/design/page.tsx), [hooks/useAvailableFonts.ts](hooks/useAvailableFonts.ts)
- [x] Purpose: Manage admin UI typography settings (global font).
- [x] Entities: UI settings, AvailableFont.
- [x] Inputs: font selection.
- [x] Outputs: updated UI settings via /api/admin/ui-settings.
- [x] Ownership scope: Global.
- [x] Permissions: No explicit auth check in page.
- [x] Known inconsistencies: None observed.
- [x] Duplicate flows: Report style editor is separate at /admin/styles.
- [x] Connected report/insight dependencies: Admin UI typography only; no report template dependency.

2.27 API-Football Enrichment
- [x] Route: /admin/api-football-enrich
- [x] Code references: [app/admin/api-football-enrich/page.tsx](app/admin/api-football-enrich/page.tsx)
- [x] Purpose: Manually trigger partner enrichment via API-Football.
- [x] Entities: EnrichmentStatus.
- [x] Inputs: manual trigger action.
- [x] Outputs: enrichment status and processed count.
- [x] Ownership scope: Global.
- [x] Permissions: No explicit auth check in page.
- [x] Known inconsistencies: None observed.
- [x] Duplicate flows: None observed.
- [x] Connected report/insight dependencies: Enrichment updates data used in reports and analytics.

2.28 Analytics Insights (Phase 3)
- [x] Route: /admin/analytics/insights
- [x] Code references: [app/admin/analytics/insights/page.tsx](app/admin/analytics/insights/page.tsx)
- [x] Purpose: Insights dashboard with filtering, prioritization, and action tracking.
- [x] Entities: Insight, filters, action state.
- [x] Inputs: filters, search, action/dismiss.
- [x] Outputs: filtered insight list.
- [x] Ownership scope: Global.
- [x] Permissions: No explicit auth check in page.
- [x] Known inconsistencies: Overlaps /admin/insights (different API endpoint and UX).
- [x] Duplicate flows: Analytics insights duplicated across /admin/insights and /admin/analytics/insights.
- [x] Connected report/insight dependencies: Consumes analytics insights data; informs executive analytics and report KPIs.

2.29 Executive Analytics
- [x] Route: /admin/analytics/executive
- [x] Code references: [app/admin/analytics/executive/page.tsx](app/admin/analytics/executive/page.tsx)
- [x] Purpose: Executive dashboard for aggregated KPIs, trends, and critical insights.
- [x] Entities: ExecutiveMetrics, TrendData, Insight.
- [x] Inputs: period selection.
- [x] Outputs: KPI cards, trend charts, top events, insights.
- [x] Ownership scope: Global.
- [x] Permissions: No explicit auth check in page.
- [x] Known inconsistencies: Overlaps /admin/dashboard aggregated stats.
- [x] Duplicate flows: Executive analytics overlaps legacy dashboard KPIs.
- [x] Connected report/insight dependencies: Uses analytics data and insights; no report template dependency.

2.30 Admin Login
- [x] Route: /admin/login
- [x] Code references: [app/admin/login/page.tsx](app/admin/login/page.tsx)
- [x] Purpose: Admin login using email/password.
- [x] Entities: Admin session.
- [x] Inputs: email, password.
- [x] Outputs: session cookie and redirect to /admin.
- [x] Ownership scope: User.
- [x] Permissions: Public (pre-auth).
- [x] Known inconsistencies: None observed.
- [x] Duplicate flows: None observed.
- [x] Connected report/insight dependencies: None observed.

2.31 Admin Register
- [x] Route: /admin/register
- [x] Code references: [app/admin/register/page.tsx](app/admin/register/page.tsx)
- [x] Purpose: Guest registration flow with auto-login.
- [x] Entities: AdminUser (guest).
- [x] Inputs: name, email, password.
- [x] Outputs: guest session and redirect to /admin/help.
- [x] Ownership scope: User.
- [x] Permissions: Public (pre-auth).
- [x] Known inconsistencies: None observed.
- [x] Duplicate flows: None observed.
- [x] Connected report/insight dependencies: None observed.

2.32 Clear Session
- [x] Route: /admin/clear-session
- [x] Code references: [app/admin/clear-session/page.tsx](app/admin/clear-session/page.tsx)
- [x] Purpose: Clear admin session cookies for login recovery.
- [x] Entities: session cookies.
- [x] Inputs: clear action.
- [x] Outputs: cleared cookies and redirect to /admin/login.
- [x] Ownership scope: User.
- [x] Permissions: Public (no auth check).
- [x] Known inconsistencies: None observed.
- [x] Duplicate flows: None observed.
- [x] Connected report/insight dependencies: None observed.

2.33 Cookie Test
- [x] Route: /admin/cookie-test
- [x] Code references: [app/admin/cookie-test/page.tsx](app/admin/cookie-test/page.tsx)
- [x] Purpose: Debug auth cookies and /api/admin/auth response.
- [x] Entities: auth status.
- [x] Inputs: none.
- [x] Outputs: auth/cookie diagnostics.
- [x] Ownership scope: User.
- [x] Permissions: Public; calls /api/admin/auth.
- [x] Known inconsistencies: None observed.
- [x] Duplicate flows: Debug-only route.
- [x] Connected report/insight dependencies: None observed.

2.34 Unauthorized
- [x] Route: /admin/unauthorized
- [x] Code references: [app/admin/unauthorized/page.tsx](app/admin/unauthorized/page.tsx)
- [x] Purpose: Access denied screen with role context and routing help.
- [x] Entities: UserRole.
- [x] Inputs: query param path and auth lookup.
- [x] Outputs: denial message and navigation options.
- [x] Ownership scope: User.
- [x] Permissions: Calls /api/admin/auth for role.
- [x] Known inconsistencies: None observed.
- [x] Duplicate flows: None observed.
- [x] Connected report/insight dependencies: None observed.

2.35 Style Editor
- [x] Route: /admin/styles/[id]
- [x] Code references: [app/admin/styles/[id]/page.tsx](app/admin/styles/[id]/page.tsx), [lib/reportStyleTypes.ts](lib/reportStyleTypes.ts)
- [x] Purpose: Edit or create report styles with live preview.
- [x] Entities: ReportStyle.
- [x] Inputs: color fields, name, font settings.
- [x] Outputs: saved report style records.
- [x] Ownership scope: Global.
- [x] Permissions: No explicit auth check in page.
- [x] Known inconsistencies: None noted beyond duplication register.
- [x] Duplicate flows: Style assignment occurs in Partners, Events, and Filters.
- [x] Connected report/insight dependencies: report styles used by report rendering and filter views.

3 Duplication and Noise Register (A-UI-00)

3.1 Partner and Event configuration overlap
- [x] Page routes: /admin/partners, /admin/events
- [x] What duplicates what: reportTemplateId/styleId selection, hashtags/categorizedHashtags assignment, SharePopup usage.
- [x] Recommended merge/remove direction: Partner assignment as default; Event assignment as override.
- [x] Evidence: [app/admin/partners/page.tsx](app/admin/partners/page.tsx), [app/admin/events/page.tsx](app/admin/events/page.tsx)

3.2 Hashtag search and pagination duplication
- [x] Page routes: /admin/filter, /admin/hashtags
- [x] What duplicates what: /api/hashtags pagination and search handling.
- [x] Recommended merge/remove direction: Single shared search/pagination surface.
- [x] Evidence: [app/admin/filter/page.tsx](app/admin/filter/page.tsx), [components/HashtagEditor.tsx](components/HashtagEditor.tsx)

3.3 Variable management surface duplication
- [x] Page routes: /admin/kyc, /admin/charts, /admin/clicker-manager
- [x] What duplicates what: variables-config edited in KYC and referenced in algorithms and clicker grouping.
- [x] Recommended merge/remove direction: KYC as primary edit surface; other surfaces read-only for variable definitions.
- [x] Evidence: [app/admin/kyc/page.tsx](app/admin/kyc/page.tsx), [components/ChartAlgorithmManager.tsx](components/ChartAlgorithmManager.tsx), [app/admin/clicker-manager/page.tsx](app/admin/clicker-manager/page.tsx)

3.4 Bitly link association duplication
- [x] Page routes: /admin/bitly, /admin/partners
- [x] What duplicates what: partner link association appears in both Bitly Manager and Partners.
- [x] Recommended merge/remove direction: Centralize link association in Bitly Manager.
- [x] Evidence: [app/admin/bitly/page.tsx](app/admin/bitly/page.tsx), [app/admin/partners/page.tsx](app/admin/partners/page.tsx)

3.5 Hashtag metadata split across pages
- [x] Page routes: /admin/hashtags, /admin/categories
- [x] What duplicates what: hashtag color editing vs category management for hashtags.
- [x] Recommended merge/remove direction: Single hashtag metadata surface (color and categories).
- [x] Evidence: [app/admin/hashtags/page.tsx](app/admin/hashtags/page.tsx), [app/admin/categories/page.tsx](app/admin/categories/page.tsx)

3.6 Report style assignment duplication
- [x] Page routes: /admin/styles, /admin/partners, /admin/events, /admin/filter
- [x] What duplicates what: style selection occurs in multiple pages.
- [x] Recommended merge/remove direction: Single assignment rule set; keep style editing in /admin/styles.
- [x] Evidence: [app/admin/styles/page.tsx](app/admin/styles/page.tsx), [app/admin/partners/page.tsx](app/admin/partners/page.tsx), [app/admin/events/page.tsx](app/admin/events/page.tsx), [app/admin/filter/page.tsx](app/admin/filter/page.tsx)

3.7 Report template assignment duplication
- [x] Page routes: /admin/visualization, /admin/partners, /admin/events
- [x] What duplicates what: template editing vs template assignment across pages.
- [x] Recommended merge/remove direction: Single assignment rule set; keep template editing in /admin/visualization.
- [x] Evidence: [app/admin/visualization/page.tsx](app/admin/visualization/page.tsx), [app/admin/partners/page.tsx](app/admin/partners/page.tsx), [app/admin/events/page.tsx](app/admin/events/page.tsx)

4 Blockers and Missing Artifacts (A-UI-00)
- [x] Missing artifact: END_USER_GUIDE.md
- [x] Reference location: [app/admin/help/page.tsx:9](app/admin/help/page.tsx)
- [x] Impact: User guide references external file; content currently embedded in page.

5 Coverage Check

5.1 Confirmed present in codebase (page.tsx exists)
- [x] /admin -> app/admin/page.tsx
- [x] /admin/dashboard -> app/admin/dashboard/page.tsx
- [x] /admin/analytics/executive -> app/admin/analytics/executive/page.tsx
- [x] /admin/analytics/insights -> app/admin/analytics/insights/page.tsx
- [x] /admin/insights -> app/admin/insights/page.tsx
- [x] /admin/events -> app/admin/events/page.tsx
- [x] /admin/events/[id]/kyc-data -> app/admin/events/[id]/kyc-data/page.tsx
- [x] /admin/partners -> app/admin/partners/page.tsx
- [x] /admin/partners/[id] -> app/admin/partners/[id]/page.tsx
- [x] /admin/partners/[id]/analytics -> app/admin/partners/[id]/analytics/page.tsx
- [x] /admin/partners/[id]/kyc-data -> app/admin/partners/[id]/kyc-data/page.tsx
- [x] /admin/projects -> app/admin/projects/page.tsx
- [x] /admin/project-partners -> app/admin/project-partners/page.tsx
- [x] /admin/quick-add -> app/admin/quick-add/page.tsx
- [x] /admin/filter -> app/admin/filter/page.tsx
- [x] /admin/users -> app/admin/users/page.tsx
- [x] /admin/kyc -> app/admin/kyc/page.tsx
- [x] /admin/charts -> app/admin/charts/page.tsx
- [x] /admin/clicker-manager -> app/admin/clicker-manager/page.tsx
- [x] /admin/bitly -> app/admin/bitly/page.tsx
- [x] /admin/hashtags -> app/admin/hashtags/page.tsx
- [x] /admin/categories -> app/admin/categories/page.tsx
- [x] /admin/visualization -> app/admin/visualization/page.tsx
- [x] /admin/styles -> app/admin/styles/page.tsx
- [x] /admin/styles/[id] -> app/admin/styles/[id]/page.tsx
- [x] /admin/cache -> app/admin/cache/page.tsx
- [x] /admin/content-library -> app/admin/content-library/page.tsx
- [x] /admin/design -> app/admin/design/page.tsx
- [x] /admin/api-football-enrich -> app/admin/api-football-enrich/page.tsx
- [x] /admin/help -> app/admin/help/page.tsx
- [x] /admin/login -> app/admin/login/page.tsx
- [x] /admin/register -> app/admin/register/page.tsx
- [x] /admin/clear-session -> app/admin/clear-session/page.tsx
- [x] /admin/cookie-test -> app/admin/cookie-test/page.tsx
- [x] /admin/unauthorized -> app/admin/unauthorized/page.tsx

5.2 Suspected or unknown
- [x] None identified in app/admin route scan.
```

## ADMIN_UI_CONSOLIDATION_PLAN
<a id="admin-ui-consolidation-plan"></a>

- Source: `docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-consolidation-plan`

```markdown
# Admin UI Consolidation Plan
Status: Draft (Inputs updated through A-UI-09; A-UI-01 + A-UI-10-15 pending)
Last Updated: 2026-01-13T18:30:00.000Z
Canonical: No
Owner: Audit

1 Purpose
- [ ] Convert A-UI-01 through A-UI-15 outputs into explicit merge, remove, or freeze decisions for Admin UI consolidation.
- [ ] Provide execution-ready direction without introducing new features or redesign.

2 Inputs
- [x] Capability inventory and duplication register: [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map)
- [x] Ownership rules and scopes: [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-ownership-model](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-ownership-model)
- [x] Terminology alignment: [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-glossary](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-glossary)

2.1 Traceability to A-UI-01 → A-UI-15 Outputs
| Task ID | Output reference | Notes |
| --- | --- | --- |
| [ ] A-UI-01 Partners | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) | [ ] Partners routes and duplication references. |
| [x] A-UI-02 Events | [x] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) | [x] Events routes, overrides, and duplication references. |
| [x] A-UI-03 Filters | [x] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) | [x] Filter routes and report-style dependencies. |
| [x] A-UI-04 Users | [x] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) | [x] User management ownership scope. |
| [x] A-UI-05 Insights | [x] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) | [x] Insights routes overlap with analytics insights. |
| [x] A-UI-06 KYC | [x] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) | [x] KYC variables, algorithms, and clicker dependencies. |
| [x] A-UI-07 Algorithms | [x] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) | [x] Chart algorithms scope and dependencies. |
| [x] A-UI-08 Admin -> Reporting Contract | [x] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-reporting-contract](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-reporting-contract) | [x] Contract boundary documented; non-IA consolidation dependency. |
| [x] A-UI-09 Bitly Manager | [x] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) | [x] Bitly link ownership and associations. |
| [ ] A-UI-10 Hashtag Manager | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) | [ ] Hashtag editing and duplication with categories. |
| [ ] A-UI-11 Category Manager | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) | [ ] Category ownership and duplication with hashtags. |
| [ ] A-UI-12 Reporting | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) | [ ] Report template ownership and assignments. |
| [ ] A-UI-13 Style Library | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) | [ ] Report style ownership and assignments. |
| [ ] A-UI-14 Cache Management | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) | [ ] Cache control scope. |
| [ ] A-UI-15 User Guide | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) | [ ] Guide scope and missing artifact blocker. |

3 Consolidation & Removal Plan
| Item | Action | Current location | Target location | Rationale | Risk | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| [ ] Legacy dashboard | [ ] MERGE | [ ] /admin/dashboard | [ ] /admin | [ ] Duplicate dashboard metrics and entrypoint. | [ ] Existing bookmarks and workflows. | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) |
| [ ] Insights dashboard duplication | [ ] MERGE | [ ] /admin/insights | [ ] /admin/analytics/insights | [ ] Single insights surface reduces drift. | [ ] Users relying on /admin/insights. | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) |
| [ ] Projects legacy route | [ ] REMOVE | [ ] /admin/projects | [ ] /admin/events | [ ] Legacy redirect route; not part of final IA. | [ ] External links if redirect removed. | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) |
| [ ] Partner/Event assignment controls (templates, styles, hashtags) | [ ] MERGE | [ ] /admin/partners + /admin/events | [ ] Shared assignment component used by both pages | [ ] Reduce duplicated assignment flows. | [ ] Incorrect override behavior if unified incorrectly. | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) |
| [ ] Hashtag search and pagination | [ ] MERGE | [ ] /admin/filter + /admin/hashtags | [ ] Shared hashtag search component/hook | [ ] Single search behavior across admin views. | [ ] Regressions in filter UX. | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) |
| [ ] Variable definitions (KYC) | [ ] MERGE | [ ] /admin/kyc + /admin/charts + /admin/clicker-manager | [ ] /admin/kyc as sole edit surface; other pages read-only for variables | [ ] Enforce global single source of truth. | [ ] Algorithm editing may require variable updates. | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-ownership-model](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-ownership-model) |
| [ ] Bitly association controls | [ ] MERGE | [ ] /admin/partners (bitly assignments) | [ ] /admin/bitly | [ ] Centralize link association ownership. | [ ] Partner workflow disruption. | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) |
| [ ] Hashtag metadata management | [ ] MERGE | [ ] /admin/hashtags + /admin/categories | [ ] /admin/hashtags | [ ] Single hashtag metadata surface. | [ ] Category-only workflows may be affected. | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) |
| [ ] Report style assignment controls | [ ] MERGE | [ ] /admin/partners + /admin/events + /admin/filter | [ ] Shared style assignment component used by all relevant pages | [ ] Ensure consistent override rules. | [ ] Incorrect style inheritance. | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-ownership-model](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-ownership-model) |
| [ ] Report template assignment controls | [ ] MERGE | [ ] /admin/partners + /admin/events | [ ] Shared template assignment component used by both pages | [ ] Ensure consistent override rules. | [ ] Incorrect template inheritance. | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-ownership-model](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-ownership-model) |
| [ ] Filter analytics duplication | [ ] REMOVE | [ ] /admin/dashboard (filter tab) | [ ] /admin/filter | [ ] Single filter surface reduces drift. | [ ] Legacy dashboard dependency. | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) |
| [ ] KYC variables library | [ ] FREEZE | [ ] /admin/kyc | [ ] /admin/kyc | [ ] Canonical global variable definitions. | [ ] None if ownership model enforced. | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-ownership-model](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-ownership-model) |
| [ ] Report templates library | [ ] FREEZE | [ ] /admin/visualization | [ ] /admin/visualization | [ ] Canonical report template definitions. | [ ] None if assignment controls consolidated. | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-ownership-model](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-ownership-model) |
| [ ] Report styles library | [ ] FREEZE | [ ] /admin/styles | [ ] /admin/styles | [ ] Canonical report style definitions. | [ ] None if assignment controls consolidated. | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-ownership-model](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-ownership-model) |
```

## ADMIN_UI_EXECUTION_READINESS
<a id="admin-ui-execution-readiness"></a>

- Source: `docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-execution-readiness`

```markdown
# Admin UI Execution Readiness
Status: Draft (Inputs updated through A-UI-09; A-UI-01 + A-UI-10-15 pending)
Last Updated: 2026-01-13T18:30:00.000Z
Canonical: No
Owner: Audit

1 Purpose
- [ ] Define preconditions and dependency checks required to begin Admin UI consolidation refactor.
- [ ] Provide clear can-start / cannot-start flags per Admin area.

2 Inputs
- [x] Consolidation plan: [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-consolidation-plan](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-consolidation-plan)
- [x] Final IA: [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-final-ia](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-final-ia)
- [x] Capability map and duplication register: [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map)
- [x] Ownership rules: [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-ownership-model](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-ownership-model)
- [x] Glossary alignment: [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-glossary](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-glossary)

2.1 Traceability to A-UI-01 → A-UI-15 Outputs
| Task ID | Output reference | Notes |
| --- | --- | --- |
| [ ] A-UI-01 Partners | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) | [ ] Partner scope and assignments. |
| [x] A-UI-02 Events | [x] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) | [x] Event scope and overrides. |
| [x] A-UI-03 Filters | [x] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) | [x] Filter dependencies on styles. |
| [x] A-UI-04 Users | [x] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) | [x] User/role scope. |
| [x] A-UI-05 Insights | [x] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) | [x] Insights consolidation target. |
| [x] A-UI-06 KYC | [x] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) | [x] KYC + clicker dependency on algorithms and reports. |
| [x] A-UI-07 Algorithms | [x] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) | [x] Algorithms dependency on KYC. |
| [x] A-UI-08 Admin -> Reporting Contract | [x] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-reporting-contract](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-reporting-contract) | [x] Contract boundary; non-UI dependency for refactor readiness. |
| [x] A-UI-09 Bitly Manager | [x] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) | [x] Bitly association consolidation. |
| [ ] A-UI-10 Hashtag Manager | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) | [ ] Hashtag metadata consolidation. |
| [ ] A-UI-11 Category Manager | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) | [ ] Category merge into hashtags. |
| [ ] A-UI-12 Reporting | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) | [ ] Report templates ownership. |
| [ ] A-UI-13 Style Library | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) | [ ] Style ownership and assignments. |
| [ ] A-UI-14 Cache Management | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) | [ ] Cache scope unaffected. |
| [ ] A-UI-15 User Guide | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) | [ ] Guide blocker noted (missing END_USER_GUIDE.md). |

3 Preconditions (Must Be Verified Before Refactor)
- [ ] Consolidation plan approved and locked: [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-consolidation-plan](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-consolidation-plan)
- [ ] Final IA approved and locked: [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-final-ia](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-final-ia)
- [ ] Ownership model verified with stakeholders: [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-ownership-model](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-ownership-model)
- [ ] Duplication register validated: [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map)
- [ ] Blocker logged and accepted (END_USER_GUIDE.md missing): [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map)
- [ ] Navigation changes agreed with Admin stakeholders: [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-final-ia](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-final-ia)

4 Dependency Map (KYC, Algorithms, Reporting, Styles)
| Dependency | From | To | Type | Notes | Evidence |
| --- | --- | --- | --- | --- | --- |
| [ ] Variables config dependency | [ ] /admin/kyc | [ ] /admin/charts | [ ] Data definition | [ ] Algorithms consume KYC variables-config. | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) |
| [ ] Variables config dependency | [ ] /admin/kyc | [ ] /admin/visualization | [ ] Data definition | [ ] Report templates rely on chart configs using variables-config. | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) |
| [ ] Chart configs dependency | [ ] /admin/charts | [ ] /admin/visualization | [ ] Library reference | [ ] Templates reference chart configs. | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) |
| [ ] Styles dependency | [ ] /admin/styles | [ ] /admin/partners + /admin/events + /admin/filter | [ ] Assignment | [ ] Styles assigned at partner/event/filter scopes. | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-ownership-model](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-ownership-model) |
| [ ] Template dependency | [ ] /admin/visualization | [ ] /admin/partners + /admin/events | [ ] Assignment | [ ] Templates assigned at partner/event scopes. | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-ownership-model](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-ownership-model) |

5 Execution Readiness Flags
| Area | Can start | Cannot start | Blocking reason | Evidence |
| --- | --- | --- | --- | --- |
| [ ] Partners | [ ] Yes | [ ] No | [ ] Pending consolidation approval. | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-consolidation-plan](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-consolidation-plan) |
| [ ] Events | [ ] Yes | [ ] No | [ ] Pending consolidation approval. | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-consolidation-plan](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-consolidation-plan) |
| [ ] Filters | [ ] Yes | [ ] No | [ ] Pending IA approval. | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-final-ia](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-final-ia) |
| [ ] Insights (Analytics) | [ ] Yes | [ ] No | [ ] Pending merge decision approval. | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-consolidation-plan](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-consolidation-plan) |
| [ ] KYC Variables | [ ] Yes | [ ] No | [ ] Ownership model sign-off required. | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-ownership-model](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-ownership-model) |
| [ ] Algorithms | [ ] Yes | [ ] No | [ ] KYC dependency confirmation required. | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) |
| [ ] Reporting Templates | [ ] Yes | [ ] No | [ ] Template assignment consolidation approval required. | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-consolidation-plan](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-consolidation-plan) |
| [ ] Styles | [ ] Yes | [ ] No | [ ] Style assignment consolidation approval required. | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-consolidation-plan](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-consolidation-plan) |
| [ ] Hashtags & Categories | [ ] Yes | [ ] No | [ ] Merge decision approval required. | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-consolidation-plan](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-consolidation-plan) |
| [ ] Bitly Manager | [ ] Yes | [ ] No | [ ] Association consolidation approval required. | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-consolidation-plan](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-consolidation-plan) |
| [ ] Users & Roles | [ ] Yes | [ ] No | [ ] No dependency conflicts noted. | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) |
| [ ] Cache Management | [ ] Yes | [ ] No | [ ] No dependency conflicts noted. | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) |
| [ ] User Guide | [ ] Yes | [ ] No | [ ] Missing END_USER_GUIDE.md logged as blocker. | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) |
```

## ADMIN_UI_FINAL_IA
<a id="admin-ui-final-ia"></a>

- Source: `docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-final-ia`

```markdown
# Admin UI Final IA
Status: Draft (Inputs updated through A-UI-09; A-UI-01 + A-UI-10-15 pending)
Last Updated: 2026-01-13T18:30:00.000Z
Canonical: No
Owner: Audit

1 Purpose
- [ ] Provide a minimal, ownership-aligned Admin navigation structure based on A-UI-01 through A-UI-15 outputs.
- [ ] Highlight merged and removed sections without introducing new features.

2 Inputs
- [x] Consolidation decisions: [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-consolidation-plan](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-consolidation-plan)
- [x] Capability inventory: [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map)
- [x] Ownership model: [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-ownership-model](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-ownership-model)
- [x] Terminology: [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-glossary](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-glossary)

2.1 Traceability to A-UI-01 → A-UI-15 Outputs
| Task ID | Output reference | Notes |
| --- | --- | --- |
| [ ] A-UI-01 Partners | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) | [ ] Partners navigation placement. |
| [x] A-UI-02 Events | [x] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) | [x] Events navigation placement. |
| [x] A-UI-03 Filters | [x] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) | [x] Filter navigation placement. |
| [x] A-UI-04 Users | [x] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) | [x] Users navigation placement. |
| [x] A-UI-05 Insights | [x] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) | [x] Insights merged into analytics insights. |
| [x] A-UI-06 KYC | [x] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) | [x] KYC + clicker navigation placement. |
| [x] A-UI-07 Algorithms | [x] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) | [x] Algorithms navigation placement. |
| [x] A-UI-08 Admin -> Reporting Contract | [x] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-reporting-contract](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-reporting-contract) | [x] Contract boundary; non-navigation artifact. |
| [x] A-UI-09 Bitly Manager | [x] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) | [x] Bitly Manager placement. |
| [ ] A-UI-10 Hashtag Manager | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) | [ ] Hashtag Manager placement. |
| [ ] A-UI-11 Category Manager | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) | [ ] Categories merged into Hashtags. |
| [ ] A-UI-12 Reporting | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) | [ ] Reporting placement. |
| [ ] A-UI-13 Style Library | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) | [ ] Styles placement. |
| [ ] A-UI-14 Cache Management | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) | [ ] Cache placement. |
| [ ] A-UI-15 User Guide | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) | [ ] Help placement. |

3 Final Admin Navigation (Proposed)
| Group | Item | Route | Ownership scope | Action | Source reference |
| --- | --- | --- | --- | --- | --- |
| [ ] Partner & Event Ops | [ ] Partners | [ ] /admin/partners | [ ] Partner | [ ] KEEP | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) |
| [ ] Partner & Event Ops | [ ] Events | [ ] /admin/events | [ ] Event | [ ] KEEP | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) |
| [ ] Partner & Event Ops | [ ] Project-Partners | [ ] /admin/project-partners | [ ] Event | [ ] KEEP | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) |
| [ ] Partner & Event Ops | [ ] Quick Add | [ ] /admin/quick-add | [ ] Event | [ ] KEEP | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) |
| [ ] Analytics & Insights | [ ] Executive Analytics | [ ] /admin/analytics/executive | [ ] Global | [ ] KEEP | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) |
| [ ] Analytics & Insights | [ ] Insights | [ ] /admin/analytics/insights | [ ] Global | [ ] KEEP | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) |
| [ ] Analytics & Insights | [ ] Filter | [ ] /admin/filter | [ ] Event | [ ] KEEP | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) |
| [ ] Global Libraries | [ ] KYC Variables | [ ] /admin/kyc | [ ] Global | [ ] KEEP | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-ownership-model](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-ownership-model) |
| [ ] Global Libraries | [ ] Clicker Manager | [ ] /admin/clicker-manager | [ ] Global | [ ] KEEP | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) |
| [ ] Global Libraries | [ ] Algorithms | [ ] /admin/charts | [ ] Global | [ ] KEEP | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-ownership-model](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-ownership-model) |
| [ ] Global Libraries | [ ] Reporting Templates | [ ] /admin/visualization | [ ] Global | [ ] KEEP | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-ownership-model](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-ownership-model) |
| [ ] Global Libraries | [ ] Styles | [ ] /admin/styles | [ ] Global | [ ] KEEP | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-ownership-model](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-ownership-model) |
| [ ] Global Libraries | [ ] Content Library | [ ] /admin/content-library | [ ] Global | [ ] KEEP | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) |
| [ ] Link & Tag Management | [ ] Bitly Manager | [ ] /admin/bitly | [ ] Global | [ ] KEEP | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) |
| [ ] Link & Tag Management | [ ] Hashtags | [ ] /admin/hashtags | [ ] Global | [ ] KEEP | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) |
| [ ] System & Access | [ ] Admin Users | [ ] /admin/users | [ ] User | [ ] KEEP | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) |
| [ ] System & Access | [ ] Cache Management | [ ] /admin/cache | [ ] Global | [ ] KEEP | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) |
| [ ] System & Access | [ ] Admin Design | [ ] /admin/design | [ ] Global | [ ] KEEP | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) |
| [ ] System & Access | [ ] Help / User Guide | [ ] /admin/help | [ ] Global | [ ] KEEP | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) |

4 Removed or Merged From Navigation
| Item | Route | Action | Target | Evidence |
| --- | --- | --- | --- | --- |
| [ ] Legacy Dashboard | [ ] /admin/dashboard | [ ] MERGED | [ ] /admin | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-consolidation-plan](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-consolidation-plan) |
| [ ] Insights (legacy) | [ ] /admin/insights | [ ] MERGED | [ ] /admin/analytics/insights | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-consolidation-plan](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-consolidation-plan) |
| [ ] Categories | [ ] /admin/categories | [ ] MERGED | [ ] /admin/hashtags | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-consolidation-plan](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-consolidation-plan) |
| [ ] Projects (legacy) | [ ] /admin/projects | [ ] REMOVED | [ ] /admin/events | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-consolidation-plan](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-consolidation-plan) |

5 System and Legacy Routes (Not in Navigation)
| Item | Route | Reason | Evidence |
| --- | --- | --- | --- |
| [ ] Admin Login | [ ] /admin/login | [ ] Pre-auth route. | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) |
| [ ] Admin Register | [ ] /admin/register | [ ] Pre-auth route. | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) |
| [ ] Clear Session | [ ] /admin/clear-session | [ ] Support route for auth recovery. | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) |
| [ ] Cookie Test | [ ] /admin/cookie-test | [ ] Debug route; keep out of IA. | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) |
| [ ] Unauthorized | [ ] /admin/unauthorized | [ ] Error route. | [ ] [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map) |
```

## ADMIN_UI_GLOSSARY
<a id="admin-ui-glossary"></a>

- Source: `docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-glossary`

```markdown
# Admin UI Glossary
Status: Complete
Last Updated: 2026-01-13T18:30:00.000Z
Canonical: No
Owner: Audit

1 Terms

1.1 Admin Session
- [x] Definition: Cookie-backed admin session used to authorize access to /admin pages and APIs.
- [x] Code references: [lib/auth.ts](lib/auth.ts), [hooks/useAdminAuth.ts](hooks/useAdminAuth.ts)

1.2 Admin User
- [x] Definition: Admin account with role and permissions for managing system data.
- [x] Code references: [app/admin/users/page.tsx](app/admin/users/page.tsx), [lib/auth.ts](lib/auth.ts)

1.3 Admin Role
- [x] Definition: Role assigned to an admin user (admin, superadmin, api) used for permission checks.
- [x] Code references: [lib/auth.ts](lib/auth.ts), [lib/users.ts](lib/users.ts)

1.4 Superadmin
- [x] Definition: Highest admin role with full permissions.
- [x] Code references: [lib/auth.ts](lib/auth.ts), [app/admin/charts/page.tsx](app/admin/charts/page.tsx)

1.5 Global Scope
- [x] Definition: System-wide configuration applied when no partner or event overrides exist.
- [x] Code references: [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-ownership-model](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-ownership-model)

1.6 Partner Scope
- [x] Definition: Partner-specific data or overrides used as defaults for that partner.
- [x] Code references: [app/admin/partners/page.tsx](app/admin/partners/page.tsx)

1.7 Event Scope
- [x] Definition: Event-specific (project-specific) data or overrides that supersede partner defaults.
- [x] Code references: [app/admin/events/page.tsx](app/admin/events/page.tsx)

1.8 User/Role Scope
- [x] Definition: Data or permissions scoped to an individual admin user or role.
- [x] Code references: [app/admin/users/page.tsx](app/admin/users/page.tsx), [lib/auth.ts](lib/auth.ts)

1.9 Partner
- [x] Definition: Business entity configured with hashtags, styles, and report templates.
- [x] Code references: [lib/partner.types.ts](lib/partner.types.ts), [app/admin/partners/page.tsx](app/admin/partners/page.tsx)

1.10 Event (Project)
- [x] Definition: Event record used for reporting and analytics.
- [x] Code references: [app/admin/events/page.tsx](app/admin/events/page.tsx), [lib/types/api.ts](lib/types/api.ts)

1.11 Report
- [x] Definition: Generated output for events or partners using templates, styles, and chart configurations.
- [x] Code references: [app/admin/visualization/page.tsx](app/admin/visualization/page.tsx)

1.12 Report Template
- [x] Definition: Template definition for report layout and data blocks.
- [x] Code references: [lib/reportTemplateTypes.ts](lib/reportTemplateTypes.ts), [app/admin/visualization/page.tsx](app/admin/visualization/page.tsx)

1.13 Data Block
- [x] Definition: Reusable block of charts used inside report templates.
- [x] Code references: [app/admin/visualization/page.tsx](app/admin/visualization/page.tsx)

1.14 Chart Configuration
- [x] Definition: Algorithm and formatting configuration used to render charts.
- [x] Code references: [components/ChartAlgorithmManager.tsx](components/ChartAlgorithmManager.tsx), [lib/chartConfigTypes.ts](lib/chartConfigTypes.ts)

1.15 Chart Algorithm
- [x] Definition: Formula logic and rules that power chart calculations within chart configurations.
- [x] Code references: [components/ChartAlgorithmManager.tsx](components/ChartAlgorithmManager.tsx)

1.16 Report Style
- [x] Definition: Visual style theme applied to report pages.
- [x] Code references: [lib/reportStyleTypes.ts](lib/reportStyleTypes.ts), [app/admin/styles/page.tsx](app/admin/styles/page.tsx)

1.17 Report Template Assignment
- [x] Definition: Selection of reportTemplateId at partner or event scope to control report generation.
- [x] Code references: [app/admin/partners/page.tsx](app/admin/partners/page.tsx), [app/admin/events/page.tsx](app/admin/events/page.tsx)

1.18 Report Style Assignment
- [x] Definition: Selection of styleId at partner, event, or filter scope to control report styling.
- [x] Code references: [app/admin/partners/page.tsx](app/admin/partners/page.tsx), [app/admin/events/page.tsx](app/admin/events/page.tsx), [app/admin/filter/page.tsx](app/admin/filter/page.tsx)

1.19 Hashtag
- [x] Definition: Tag assigned to partners or events for filtering and categorization.
- [x] Code references: [components/HashtagEditor.tsx](components/HashtagEditor.tsx), [lib/types/hashtags.ts](lib/types/hashtags.ts)

1.20 Hashtag Category
- [x] Definition: Category used to group hashtags and enforce categorizedHashtags structure.
- [x] Code references: [lib/hashtagCategoryTypes.ts](lib/hashtagCategoryTypes.ts), [app/admin/categories/page.tsx](app/admin/categories/page.tsx)

1.21 Filter (Hashtag Filter)
- [x] Definition: Hashtag-based filter view that aggregates project statistics and shareable results.
- [x] Code references: [app/admin/filter/page.tsx](app/admin/filter/page.tsx)

1.22 Share Slug (View Slug)
- [x] Definition: Slug used by SharePopup to generate shareable report or filter links.
- [x] Code references: [components/SharePopup.tsx](components/SharePopup.tsx), [app/admin/events/page.tsx](app/admin/events/page.tsx), [app/admin/filter/page.tsx](app/admin/filter/page.tsx)

1.23 KYC Variable
- [x] Definition: Variable definition used by analytics and clicker workflows.
- [x] Code references: [app/admin/kyc/page.tsx](app/admin/kyc/page.tsx)

1.24 Variables Config
- [x] Definition: Canonical variables catalog exposed by /api/variables-config.
- [x] Code references: [app/admin/kyc/page.tsx](app/admin/kyc/page.tsx)

1.25 Variable Group
- [x] Definition: Clicker grouping and ordering of variables.
- [x] Code references: [app/admin/clicker-manager/page.tsx](app/admin/clicker-manager/page.tsx)

1.26 KYC Data
- [x] Definition: Aggregated event or partner stats keyed to KYC variables.
- [x] Code references: [app/admin/partners/[id]/kyc-data/page.tsx](app/admin/partners/[id]/kyc-data/page.tsx), [app/admin/events/[id]/kyc-data/page.tsx](app/admin/events/[id]/kyc-data/page.tsx)

1.27 Clicker
- [x] Definition: Editor UI mode for data entry during events.
- [x] Code references: [app/admin/clicker-manager/page.tsx](app/admin/clicker-manager/page.tsx), [app/admin/help/page.tsx](app/admin/help/page.tsx)

1.28 Clicker Manager
- [x] Definition: Admin page for configuring variable groups, ordering, and visibility for clicker UI.
- [x] Code references: [app/admin/clicker-manager/page.tsx](app/admin/clicker-manager/page.tsx)

1.29 Bitly Link
- [x] Definition: Short link record with analytics and associations to partners or events.
- [x] Code references: [app/admin/bitly/page.tsx](app/admin/bitly/page.tsx)

1.30 Insight
- [x] Definition: Analytics output item (anomaly, trend, benchmark, prediction, recommendation).
- [x] Code references: [app/admin/insights/page.tsx](app/admin/insights/page.tsx)

1.31 Analytics Insights
- [x] Definition: Admin insights dashboards for monitoring and filtering analytics insights.
- [x] Code references: [app/admin/insights/page.tsx](app/admin/insights/page.tsx), [app/admin/analytics/insights/page.tsx](app/admin/analytics/insights/page.tsx)

1.32 Executive Analytics
- [x] Definition: Executive dashboard for KPIs, trends, and critical insights.
- [x] Code references: [app/admin/analytics/executive/page.tsx](app/admin/analytics/executive/page.tsx)

1.33 Content Asset
- [x] Definition: Image or text asset referenced by chart formulas or report templates.
- [x] Code references: [app/admin/content-library/page.tsx](app/admin/content-library/page.tsx), [lib/contentAssetTypes.ts](lib/contentAssetTypes.ts)

1.34 Cache Management
- [x] Definition: Admin controls for clearing server and browser caches.
- [x] Code references: [app/admin/cache/page.tsx](app/admin/cache/page.tsx)

1.35 User Guide
- [x] Definition: Admin help content providing guidance and onboarding.
- [x] Code references: [app/admin/help/page.tsx](app/admin/help/page.tsx)

1.36 Admin Dashboard
- [x] Definition: Root admin landing page with navigation to admin areas.
- [x] Code references: [app/admin/page.tsx](app/admin/page.tsx), [components/AdminDashboard.tsx](components/AdminDashboard.tsx)

1.37 Legacy Dashboard
- [x] Definition: Older aggregated dashboard with stats and filtering at /admin/dashboard.
- [x] Code references: [app/admin/dashboard/page.tsx](app/admin/dashboard/page.tsx)
```

## ADMIN_UI_INSIGHTS_MODEL
<a id="admin-ui-insights-model"></a>

- Source: `docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-insights-model`

```markdown
# Admin UI Insights Model
Status: Complete
Last Updated: 2026-01-13T18:30:00.000Z
Canonical: No
Owner: Audit

1 Purpose
- [x] Define what an Admin Insight is and how it is generated.
- [x] Inventory Insights endpoints and Admin surfaces.
- [x] Resolve duplication C-02 with a single canonical Insights surface.
- [x] Map dependencies on event inputs, KYC variables, and clicker groups.
- [x] Identify downstream consumers (Admin vs reporting).

2 Insight Definition (Computed, Not Stored)
- [x] Insights are computed on request from event stats and analytics aggregates; they are not persisted as a separate collection. Evidence: [lib/analytics-insights.ts](lib/analytics-insights.ts), [lib/insightsEngine.ts](lib/insightsEngine.ts).
- [x] There are two Insight schemas in code today:
  - [x] analytics-insights (type + severity) used by `/api/analytics/insights`. Evidence: [lib/analytics-insights.ts](lib/analytics-insights.ts), [app/api/analytics/insights/route.ts](app/api/analytics/insights/route.ts).
  - [x] insightsEngine (category + priority) used by event/executive endpoints. Evidence: [lib/insightsEngine.ts](lib/insightsEngine.ts), [app/api/analytics/insights/[projectId]/route.ts](app/api/analytics/insights/[projectId]/route.ts), [app/api/analytics/executive/insights/route.ts](app/api/analytics/executive/insights/route.ts).

3 Data Inputs and Generation Engines
| Engine | Inputs | Output scope | Evidence |
| --- | --- | --- | --- |
| [x] analytics-insights | projects collection + event stats; anomaly/trend/benchmark/prediction modules | Global or partner insights (computed) | [lib/analytics-insights.ts](lib/analytics-insights.ts), [app/api/analytics/insights/route.ts](app/api/analytics/insights/route.ts), [app/api/analytics/insights/partners/[partnerId]/route.ts](app/api/analytics/insights/partners/[partnerId]/route.ts) |
| [x] insightsEngine | analytics_aggregates + partner context + historical aggregates | Event and executive insights (computed) | [lib/insightsEngine.ts](lib/insightsEngine.ts), [app/api/analytics/insights/[projectId]/route.ts](app/api/analytics/insights/[projectId]/route.ts), [app/api/analytics/executive/insights/route.ts](app/api/analytics/executive/insights/route.ts) |

4 Dependencies (Events, KYC, Clicker)
- [x] Events: analytics-insights reads `projects` event stats; insightsEngine reads `analytics_aggregates` for event metrics. Evidence: [lib/analytics-insights.ts](lib/analytics-insights.ts), [lib/insightsEngine.ts](lib/insightsEngine.ts), [app/api/analytics/insights/route.ts](app/api/analytics/insights/route.ts), [app/api/analytics/insights/[projectId]/route.ts](app/api/analytics/insights/[projectId]/route.ts).
- [x] KYC variables: No direct references to `/api/variables-config` or KYC metadata in insights engines or Admin insights pages; dependencies are indirect via event stats. Evidence: [lib/analytics-insights.ts](lib/analytics-insights.ts), [lib/insightsEngine.ts](lib/insightsEngine.ts), [app/admin/insights/page.tsx](app/admin/insights/page.tsx), [app/admin/analytics/insights/page.tsx](app/admin/analytics/insights/page.tsx).
- [x] Clicker groups: No direct references in insights engines; clicker configuration does not feed insights generation. Evidence: [lib/analytics-insights.ts](lib/analytics-insights.ts), [lib/insightsEngine.ts](lib/insightsEngine.ts).

5 Admin Surfaces and API Inventory
| Surface | API endpoint | Engine | Scope | Notes | Evidence |
| --- | --- | --- | --- | --- | --- |
| [x] /admin/insights | /api/analytics/insights | analytics-insights | Global (recent events) | Uses type + severity filters. | [app/admin/insights/page.tsx](app/admin/insights/page.tsx), [app/api/analytics/insights/route.ts](app/api/analytics/insights/route.ts) |
| [x] /admin/analytics/insights | /api/analytics/insights/all?limit=100 | insightsEngine (expected) | Global | API route `/api/analytics/insights/all` not found; response shape mismatch. | [app/admin/analytics/insights/page.tsx](app/admin/analytics/insights/page.tsx) |
| [x] /admin/analytics/executive | /api/analytics/executive/insights | insightsEngine | Global (critical/high) | Executive insights feed. | [app/admin/analytics/executive/page.tsx](app/admin/analytics/executive/page.tsx), [app/api/analytics/executive/insights/route.ts](app/api/analytics/executive/insights/route.ts) |
| [x] Event insights (API only) | /api/analytics/insights/[projectId] | insightsEngine | Event | Per-event insights report. | [app/api/analytics/insights/[projectId]/route.ts](app/api/analytics/insights/[projectId]/route.ts) |
| [x] Partner insights (API only) | /api/analytics/insights/partners/[partnerId] | analytics-insights | Partner | Partner-level insights across events. | [app/api/analytics/insights/partners/[partnerId]/route.ts](app/api/analytics/insights/partners/[partnerId]/route.ts) |

6 Ownership and Scope
- [x] Ownership is global; insights are derived from event data and analytics aggregates, not edited manually. Evidence: [app/api/analytics/insights/route.ts](app/api/analytics/insights/route.ts), [app/api/analytics/insights/[projectId]/route.ts](app/api/analytics/insights/[projectId]/route.ts).
- [x] Partner and event scopes are derived views only (no overrides). Evidence: [app/api/analytics/insights/partners/[partnerId]/route.ts](app/api/analytics/insights/partners/[partnerId]/route.ts), [app/api/analytics/insights/[projectId]/route.ts](app/api/analytics/insights/[projectId]/route.ts).

7 Duplication Resolution (C-02)
- [x] Canonical Insights surface: `/admin/analytics/insights` (Phase 3 dashboard).
- [x] Deprecate or redirect `/admin/insights` to `/admin/analytics/insights` per consolidation plan. Evidence: [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-consolidation-plan](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-consolidation-plan).
- [x] Align the canonical surface to a single API and schema (choose analytics-insights or insightsEngine; do not mix). Evidence: [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-consolidation-plan](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-consolidation-plan), [app/admin/analytics/insights/page.tsx](app/admin/analytics/insights/page.tsx).

8 Downstream Consumers
- [x] Admin analytics dashboards consume insights directly (/admin/insights, /admin/analytics/insights, /admin/analytics/executive). Evidence: [app/admin/insights/page.tsx](app/admin/insights/page.tsx), [app/admin/analytics/insights/page.tsx](app/admin/analytics/insights/page.tsx), [app/admin/analytics/executive/page.tsx](app/admin/analytics/executive/page.tsx).
- [x] Reporting consumption not observed in report UI code; insights appear Admin-only at present. Evidence: [app/report/[slug]/page.module.OLD.css](app/report/[slug]/page.module.OLD.css).

9 Risks and Gaps
- [x] `/api/analytics/insights/all` endpoint is referenced but not present; /admin/analytics/insights expects `data.insights` payload. Evidence: [app/admin/analytics/insights/page.tsx](app/admin/analytics/insights/page.tsx).
- [x] Schema mismatch: analytics-insights uses severity/type; insightsEngine uses priority/category. Evidence: [lib/analytics-insights.ts](lib/analytics-insights.ts), [lib/insightsEngine.ts](lib/insightsEngine.ts).
- [x] Role gating mismatch: `/admin/insights` is superadmin-only in route protection; `/admin/analytics/insights` is not. Evidence: [lib/routeProtection.ts](lib/routeProtection.ts), [middleware.ts](/middleware.ts).
- [x] Action tracking is UI-only TODO; no backend persistence for action/dismiss. Evidence: [app/admin/analytics/insights/page.tsx](app/admin/analytics/insights/page.tsx).

10 Admin Constraints (Do This / Do Not Do This)
- [x] Do: Treat insights as computed outputs from analytics data; do not edit manually.
- [x] Do: Use one canonical Insights surface and one schema.
- [x] Do not: Introduce partner/event overrides for insights definitions.
- [x] Do not: Ship a UI that depends on missing endpoints or mismatched response shapes.
```

## ADMIN_UI_KYC_MODEL
<a id="admin-ui-kyc-model"></a>

- Source: `docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-kyc-model`

```markdown
# Admin UI KYC Model
Status: Complete
Last Updated: 2026-01-13T18:30:00.000Z
Canonical: No
Owner: Audit

1 Purpose
- [x] Define the KYC variable model as the single source of truth for Admin, Algorithms, Clicker, and Reporting.
- [x] Document ownership rules, dependencies, and guardrails for Admin execution.

2 Source of Truth
- [x] Canonical source is `/api/variables-config`, backed by MongoDB `variables_metadata` collection. Evidence: [app/api/variables-config/route.ts](app/api/variables-config/route.ts).
- [x] Admin UI editor is `/admin/kyc` and is the only intended edit surface. Evidence: [app/admin/kyc/page.tsx](app/admin/kyc/page.tsx).

3 Variable Model (Current)
| Field | Definition | Evidence |
| --- | --- | --- |
| [x] name | Variable identifier (camelCase, no `stats.` prefix). | [app/api/variables-config/route.ts](app/api/variables-config/route.ts) |
| [x] label | Display label; falls back to alias or humanized name. | [app/api/variables-config/route.ts](app/api/variables-config/route.ts) |
| [x] type | Data type (count, numeric, currency, percentage, text, boolean, date, etc.). | [app/admin/kyc/page.tsx](app/admin/kyc/page.tsx) |
| [x] category | Grouping label used for filters and tags. | [app/admin/kyc/page.tsx](app/admin/kyc/page.tsx) |
| [x] description | Optional explanation or derived formula description. | [app/admin/kyc/page.tsx](app/admin/kyc/page.tsx) |
| [x] derived + formula | Derived variable definition and formula logic. | [app/admin/kyc/page.tsx](app/admin/kyc/page.tsx) |
| [x] flags.visibleInClicker | Controls inclusion in clicker UI. | [app/admin/kyc/page.tsx](app/admin/kyc/page.tsx) |
| [x] flags.editableInManual | Controls manual edit capability. | [app/admin/kyc/page.tsx](app/admin/kyc/page.tsx) |
| [x] isSystem | System variable guard (cannot delete). | [app/api/variables-config/route.ts](app/api/variables-config/route.ts) |
| [x] order | Category ordering for UI. | [app/api/variables-config/route.ts](app/api/variables-config/route.ts) |

4 Variable Definition Lifecycle
- [x] Create/Edit: `/admin/kyc` calls `/api/variables-config` (POST) with camelCase names and metadata. Evidence: [app/admin/kyc/page.tsx](app/admin/kyc/page.tsx), [app/api/variables-config/route.ts](app/api/variables-config/route.ts).
- [x] Delete: `/admin/kyc` calls `/api/variables-config` (DELETE); blocked for `isSystem` variables. Evidence: [app/admin/kyc/page.tsx](app/admin/kyc/page.tsx), [app/api/variables-config/route.ts](app/api/variables-config/route.ts).
- [x] Cache: 5-minute in-memory cache; invalidate after create/update/delete. Evidence: [app/api/variables-config/route.ts](app/api/variables-config/route.ts), [app/admin/kyc/page.tsx](app/admin/kyc/page.tsx), [app/admin/clicker-manager/page.tsx](app/admin/clicker-manager/page.tsx).

5 Ownership Rules and Overrides
- [x] Ownership is global-only; there are no partner or event overrides for variable definitions. Evidence: [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-ownership-model](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-ownership-model).
- [x] Partner/event KYC pages are read-only data views, not definition editors. Evidence: [app/admin/partners/[id]/kyc-data/page.tsx](app/admin/partners/[id]/kyc-data/page.tsx), [app/admin/events/[id]/kyc-data/page.tsx](app/admin/events/[id]/kyc-data/page.tsx).
- [x] Override paths: None identified in code; all variable definitions resolve from `/api/variables-config`. Evidence: [app/admin/kyc/page.tsx](app/admin/kyc/page.tsx), [components/ChartAlgorithmManager.tsx](components/ChartAlgorithmManager.tsx), [app/admin/clicker-manager/page.tsx](app/admin/clicker-manager/page.tsx).

6 Dependency Map (Algorithms, Clicker, Reporting)
| Area | Dependency on KYC | What is consumed | Evidence |
| --- | --- | --- | --- |
| [x] Algorithms | ChartAlgorithmManager loads variables from `/api/variables-config` for formulas. | Variable list for formula validation and chart configs. | [components/ChartAlgorithmManager.tsx](components/ChartAlgorithmManager.tsx), [lib/formulaEngine.ts](lib/formulaEngine.ts) |
| [x] Clicker | Clicker Manager loads variables from `/api/variables-config` to build variable groups. | Variable names, flags, and categories. | [app/admin/clicker-manager/page.tsx](app/admin/clicker-manager/page.tsx) |
| [x] Reporting | Report templates reference chart configs that use KYC variables and formulas. | Variables referenced by chart configs and formula engine. | [app/admin/visualization/page.tsx](app/admin/visualization/page.tsx), [lib/chartConfigTypes.ts](lib/chartConfigTypes.ts), [lib/formulaEngine.ts](lib/formulaEngine.ts) |
| [x] KYC data views | Partner/event KYC pages load variables for display context. | Variable metadata for table headers and filters. | [app/admin/partners/[id]/kyc-data/page.tsx](app/admin/partners/[id]/kyc-data/page.tsx), [app/admin/events/[id]/kyc-data/page.tsx](app/admin/events/[id]/kyc-data/page.tsx) |

7 What Breaks If KYC Is Wrong
- [x] Formula evaluation fails when variable names do not match stats fields. Evidence: [lib/formulaEngine.ts](lib/formulaEngine.ts).
- [x] Charts render incorrectly if variable types or derived formulas are invalid. Evidence: [components/ChartAlgorithmManager.tsx](components/ChartAlgorithmManager.tsx), [lib/chartConfigTypes.ts](lib/chartConfigTypes.ts).
- [x] Clicker groups lose variables if names are removed or cache is stale. Evidence: [app/admin/clicker-manager/page.tsx](app/admin/clicker-manager/page.tsx).
- [x] Reporting templates cannot resolve chart configs if variables are missing. Evidence: [app/admin/visualization/page.tsx](app/admin/visualization/page.tsx), [lib/formulaEngine.ts](lib/formulaEngine.ts).

8 Duplication Candidates
- [x] C-10: Partner and event KYC data views are parallel read-only surfaces; no overrides permitted. Evidence: [operations/ACTION_PLAN.md](../../operations/ACTION_PLAN.md), [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map).

9 Admin Constraints (Do This / Do Not Do This)
- [x] Do: Edit variables only in `/admin/kyc` and via `/api/variables-config`.
- [x] Do: Use camelCase variable names without `stats.` prefix.
- [x] Do: Invalidate variables cache after create/update/delete.
- [x] Do not: Introduce partner- or event-scoped variable edits.
- [x] Do not: Delete or rename `isSystem` variables.

10 Phase 2 (Proposal Only, No Execution)
- [ ] Add admin authentication checks to `/api/variables-config` POST/PUT/DELETE to enforce global-only edits by Admin roles.
- [ ] Standardize auth checks to `/api/admin/auth` for Admin UI pages that currently use `/api/auth/check`.
- [ ] Document and implement a single permission gate for KYC edits (admin/superadmin).
```

## ADMIN_UI_OWNERSHIP_MODEL
<a id="admin-ui-ownership-model"></a>

- Source: `docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-ownership-model`

```markdown
# Admin UI Ownership Model
Status: Complete
Last Updated: 2026-01-13T18:30:00.000Z
Canonical: No
Owner: Audit

1 Purpose
- [x] Define ownership scope for Admin UI assets and enforce single source of truth and override rules.
- [x] Provide a single ownership table covering Global only, Partner overrides, Event-scoped, and User/role-scoped assets.

2 Ownership Model Table
| Domain or Asset | Global only | Partner override allowed | Event-scoped | User/role-scoped | Override rules or single source of truth | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| Variables config (KYC) | [x] Yes | [x] No | [x] No | [x] No | [x] Only /api/variables-config is canonical; no partner or event variants. | [app/admin/kyc/page.tsx](app/admin/kyc/page.tsx), [components/ChartAlgorithmManager.tsx](components/ChartAlgorithmManager.tsx), [app/admin/clicker-manager/page.tsx](app/admin/clicker-manager/page.tsx) |
| Chart algorithms/configs | [x] Yes | [x] No | [x] No | [x] No | [x] Chart-config is global; templates reference configs; no partner-specific definitions. | [components/ChartAlgorithmManager.tsx](components/ChartAlgorithmManager.tsx), [app/admin/visualization/page.tsx](app/admin/visualization/page.tsx) |
| Clicker variable groups | [x] Yes | [x] No | [x] No | [x] No | [x] Groups live in /api/variables-groups; no partner or event overrides. | [app/admin/clicker-manager/page.tsx](app/admin/clicker-manager/page.tsx) |
| Report templates | [x] No | [x] Yes | [x] Yes | [x] No | [x] Event overrides partner; partner overrides global default. | [app/admin/visualization/page.tsx](app/admin/visualization/page.tsx), [app/admin/partners/page.tsx](app/admin/partners/page.tsx), [app/admin/events/page.tsx](app/admin/events/page.tsx) |
| Report styles | [x] No | [x] Yes | [x] Yes | [x] No | [x] Event overrides partner; partner overrides global default; filter uses explicit styleId. | [app/admin/styles/page.tsx](app/admin/styles/page.tsx), [app/admin/styles/[id]/page.tsx](app/admin/styles/[id]/page.tsx), [app/admin/partners/page.tsx](app/admin/partners/page.tsx), [app/admin/events/page.tsx](app/admin/events/page.tsx), [app/admin/filter/page.tsx](app/admin/filter/page.tsx) |
| Hashtags | [x] Yes | [x] No | [x] No | [x] No | [x] Global hashtag dictionary; partner/event store usage only. | [components/HashtagEditor.tsx](components/HashtagEditor.tsx), [app/admin/partners/page.tsx](app/admin/partners/page.tsx), [app/admin/events/page.tsx](app/admin/events/page.tsx) |
| Hashtag categories | [x] Yes | [x] No | [x] No | [x] No | [x] Global categories used by categorizedHashtags. | [app/admin/categories/page.tsx](app/admin/categories/page.tsx), [lib/hashtagCategoryTypes.ts](lib/hashtagCategoryTypes.ts) |
| Bitly links | [x] Yes | [x] No | [x] No | [x] No | [x] Link definitions are global; associations are many-to-many with partners/events. | [app/admin/bitly/page.tsx](app/admin/bitly/page.tsx), [app/admin/partners/page.tsx](app/admin/partners/page.tsx) |
| Partners | [x] No | [x] No | [x] No | [x] No | [x] Partner is canonical owner of partner metadata (partner-scoped). | [app/admin/partners/page.tsx](app/admin/partners/page.tsx), [app/admin/events/page.tsx](app/admin/events/page.tsx) |
| Events (Projects) | [x] No | [x] No | [x] Yes | [x] No | [x] Event is canonical owner of event metadata. | [app/admin/events/page.tsx](app/admin/events/page.tsx), [lib/types/api.ts](lib/types/api.ts) |
| Insights | [x] Yes | [x] No | [x] No | [x] No | [x] Insights derived from analytics; no partner/event overrides. | [app/admin/insights/page.tsx](app/admin/insights/page.tsx) |
| Admin users and roles | [x] No | [x] No | [x] No | [x] Yes | [x] Role model is global; permissions enforced by auth system. | [app/admin/users/page.tsx](app/admin/users/page.tsx), [lib/auth.ts](lib/auth.ts) |
| Cache control | [x] Yes | [x] No | [x] No | [x] No | [x] Cache actions apply globally. | [app/admin/cache/page.tsx](app/admin/cache/page.tsx) |
| User guide content | [x] Yes | [x] No | [x] No | [x] No | [x] Single guide surface for all admin roles. | [app/admin/help/page.tsx](app/admin/help/page.tsx) |
```

## ADMIN_UI_REPORTING_CONTRACT
<a id="admin-ui-reporting-contract"></a>

- Source: `docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-reporting-contract`

```markdown
# Admin UI to Reporting Contract
Status: Complete
Last Updated: 2026-01-13T18:30:00.000Z
Canonical: No
Owner: Audit

1 Purpose
- [x] Define the Admin-owned configuration contract that Reporting consumes.
- [x] Declare required vs optional fields per entity.
- [x] Set compatibility and breaking-change rules for Admin updates.

2 Contract Boundary (Admin -> Reporting)
- [x] Admin is the single writer for configuration entities (templates, chart configs, variables).
- [x] Reporting is read-only and must consume Admin outputs via documented APIs.
- [x] Any Reporting reliance outside this contract is out of scope and must be surfaced.

3 Contract Entities Summary
| Entity | Admin source | Reporting consumer | Notes | Evidence |
| --- | --- | --- | --- | --- |
| [x] Events / Projects | Admin data entry + ingestion | /api/projects/stats, /api/report-config | Reporting uses event stats + template resolution. | [app/api/projects/stats/[slug]/route.ts](app/api/projects/stats/[slug]/route.ts), [app/api/report-config/[identifier]/route.ts](app/api/report-config/[identifier]/route.ts), [app/report/[slug]/page.tsx](app/report/[slug]/page.tsx) |
| [x] KYC Variables | /admin/kyc -> /api/variables-config | Formula tokens in charts | Variable names must match stats fields. | [app/api/variables-config/route.ts](app/api/variables-config/route.ts), [lib/formulaEngine.ts](lib/formulaEngine.ts) |
| [x] Algorithms (Chart Configs) | /admin/charts -> /api/chart-config | /api/chart-config/public | Charts render from Admin configs. | [app/admin/charts/page.tsx](app/admin/charts/page.tsx), [app/api/chart-config/public/route.ts](app/api/chart-config/public/route.ts), [lib/report-calculator.ts](lib/report-calculator.ts) |
| [x] Report Templates + Blocks | /admin/visualization -> /api/report-templates + /api/data-blocks | /api/report-config | Templates select charts and layout. | [app/admin/visualization/page.tsx](app/admin/visualization/page.tsx), [app/api/report-templates/route.ts](app/api/report-templates/route.ts), [app/api/report-config/[identifier]/route.ts](app/api/report-config/[identifier]/route.ts) |
| [x] Insights | /admin/insights (Admin only) | None observed | Not part of Reporting contract. | [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-insights-model](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-insights-model), [app/report/[slug]/page.tsx](app/report/[slug]/page.tsx) |

4 Events / Projects Contract
- [x] Required identifiers: project _id and viewSlug (report URL). Evidence: [app/api/projects/stats/[slug]/route.ts](app/api/projects/stats/[slug]/route.ts), [app/report/[slug]/page.tsx](app/report/[slug]/page.tsx).
- [x] Required fields for Reporting:
  - [x] eventName, eventDate. Evidence: [app/api/projects/stats/[slug]/route.ts](app/api/projects/stats/[slug]/route.ts), [hooks/useReportData.ts](hooks/useReportData.ts).
  - [x] stats object with fields referenced by chart formulas. Evidence: [app/api/projects/stats/[slug]/route.ts](app/api/projects/stats/[slug]/route.ts), [lib/formulaEngine.ts](lib/formulaEngine.ts).
  - [x] partner1 (and partner2 if present) with name/emoji/logoUrl for hero. Evidence: [app/api/projects/stats/[slug]/route.ts](app/api/projects/stats/[slug]/route.ts), [app/report/[slug]/page.tsx](app/report/[slug]/page.tsx).
  - [x] reportTemplateId (optional override) and styleIdEnhanced (optional override). Evidence: [app/api/projects/stats/[slug]/route.ts](app/api/projects/stats/[slug]/route.ts), [app/api/report-config/[identifier]/route.ts](app/api/report-config/[identifier]/route.ts).
- [x] Optional fields consumed by Reporting:
  - [x] hashtags and categorizedHashtags. Evidence: [app/api/projects/stats/[slug]/route.ts](app/api/projects/stats/[slug]/route.ts), [hooks/useReportData.ts](hooks/useReportData.ts).
  - [x] createdAt/updatedAt for export metadata. Evidence: [app/api/projects/stats/[slug]/route.ts](app/api/projects/stats/[slug]/route.ts), [app/report/[slug]/page.tsx](app/report/[slug]/page.tsx).

5 KYC Variables Contract
- [x] Source of truth is /api/variables-config (variables_metadata). Evidence: [app/api/variables-config/route.ts](app/api/variables-config/route.ts), [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-kyc-model](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-kyc-model).
- [x] Required variable fields (Admin-owned metadata):
  - [x] name (maps directly to stats field, no stats. prefix). Evidence: [app/api/variables-config/route.ts](app/api/variables-config/route.ts), [lib/formulaEngine.ts](lib/formulaEngine.ts).
  - [x] type, category, label/alias for Admin visibility. Evidence: [app/api/variables-config/route.ts](app/api/variables-config/route.ts).
- [x] Reporting-compatible formula tokens:
  - [x] [fieldName] maps to stats[fieldName] directly. Evidence: [lib/formulaEngine.ts](lib/formulaEngine.ts).
  - [x] [PARAM:key], [MANUAL:key] for admin-defined parameters/manual data. Evidence: [lib/formulaEngine.ts](lib/formulaEngine.ts), [lib/chartCalculator.ts](lib/chartCalculator.ts).
  - [x] [MEDIA:slug], [TEXT:slug] for content assets used in text/image charts. Evidence: [lib/formulaEngine.ts](lib/formulaEngine.ts).
- [x] Derived fields are computed at render time and are safe to reference: allImages, remoteFans, totalFans. Evidence: [lib/dataValidator.ts](lib/dataValidator.ts), [app/report/[slug]/page.tsx](app/report/[slug]/page.tsx).

6 Algorithms (Chart Configurations) Contract
- [x] Admin write API: /api/chart-config (chart_configurations). Evidence: [app/api/chart-config/route.ts](app/api/chart-config/route.ts).
- [x] Reporting read API: /api/chart-config/public (active charts only). Evidence: [app/api/chart-config/public/route.ts](app/api/chart-config/public/route.ts), [app/report/[slug]/page.tsx](app/report/[slug]/page.tsx).
- [x] Required fields for Reporting:
  - [x] chartId (stable identifier). Evidence: [lib/chartConfigTypes.ts](lib/chartConfigTypes.ts), [app/api/chart-config/public/route.ts](app/api/chart-config/public/route.ts).
  - [x] type (kpi/pie/bar/text/image/table). Evidence: [lib/chartConfigTypes.ts](lib/chartConfigTypes.ts), [lib/report-calculator.ts](lib/report-calculator.ts).
  - [x] isActive, order, elements (formula + label + color). Evidence: [app/api/chart-config/public/route.ts](app/api/chart-config/public/route.ts), [lib/report-calculator.ts](lib/report-calculator.ts).
  - [x] formatting (optional) for numeric output. Evidence: [lib/chartConfigTypes.ts](lib/chartConfigTypes.ts), [lib/report-calculator.ts](lib/report-calculator.ts).
- [x] Legacy /api/charts exists (charts collection) and should not diverge from chart_configurations. Evidence: [app/api/charts/route.ts](app/api/charts/route.ts).

7 Report Templates and Blocks Contract
- [x] Report templates stored in report_templates. Evidence: [app/api/report-templates/route.ts](app/api/report-templates/route.ts), [lib/reportTemplateTypes.ts](lib/reportTemplateTypes.ts).
- [x] Required template fields:
  - [x] name, type (event/partner/global), isDefault. Evidence: [lib/reportTemplateTypes.ts](lib/reportTemplateTypes.ts).
  - [x] dataBlocks array with blockId + order. Evidence: [lib/reportTemplateTypes.ts](lib/reportTemplateTypes.ts), [app/api/report-config/[identifier]/route.ts](app/api/report-config/[identifier]/route.ts).
  - [x] gridSettings (desktop/tablet/mobile units). Evidence: [lib/reportTemplateTypes.ts](lib/reportTemplateTypes.ts), [hooks/useReportLayout.ts](hooks/useReportLayout.ts).
- [x] Optional template fields used by Reporting:
  - [x] styleId (report styles). Evidence: [lib/reportTemplateTypes.ts](lib/reportTemplateTypes.ts), [hooks/useReportStyle.ts](hooks/useReportStyle.ts).
  - [x] heroSettings and alignmentSettings. Evidence: [lib/reportTemplateTypes.ts](lib/reportTemplateTypes.ts), [hooks/useReportLayout.ts](hooks/useReportLayout.ts), [app/report/[slug]/page.tsx](app/report/[slug]/page.tsx).
- [x] Data blocks stored in data_blocks and must include charts with chartId/width/order. Evidence: [app/api/data-blocks/route.ts](app/api/data-blocks/route.ts), [app/api/report-config/[identifier]/route.ts](app/api/report-config/[identifier]/route.ts), [hooks/useReportLayout.ts](hooks/useReportLayout.ts).
- [x] Template resolution hierarchy is project -> partner -> default -> hardcoded. Evidence: [app/api/report-config/[identifier]/route.ts](app/api/report-config/[identifier]/route.ts), [lib/reportTemplateTypes.ts](lib/reportTemplateTypes.ts).

8 Insights Contract
- [x] Insights are Admin-only; Reporting does not fetch insights in report rendering. Evidence: [docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-insights-model](docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-insights-model), [app/report/[slug]/page.tsx](app/report/[slug]/page.tsx).

9 Compatibility Expectations (No Version Field)
- [x] No explicit versioning exists; compatibility is enforced by stable identifiers and field presence. Evidence: [lib/reportTemplateTypes.ts](lib/reportTemplateTypes.ts), [lib/chartConfigTypes.ts](lib/chartConfigTypes.ts).
- [x] Admin UI version labels follow package.json (currently 11.55.1) and are informational only; the contract remains ID-based. Evidence: [package.json](/package.json), [app/admin/help/page.tsx](app/admin/help/page.tsx).
- [x] Template compatibility validator flags missing charts/variables. Evidence: [lib/templateCompatibilityValidator.ts](lib/templateCompatibilityValidator.ts).
- [x] Admin changes must keep chartId and variable names stable across templates. Evidence: [lib/formulaEngine.ts](lib/formulaEngine.ts), [app/api/chart-config/route.ts](app/api/chart-config/route.ts).

10 Breaking-Change Rules
- [x] Breaking: renaming/removing chartId referenced by templates. Mitigation: create new chartId, migrate templates, keep old chartId until cutover. Evidence: [lib/reportTemplateTypes.ts](lib/reportTemplateTypes.ts), [app/api/report-config/[identifier]/route.ts](app/api/report-config/[identifier]/route.ts).
- [x] Breaking: renaming/removing KYC variable names used in formulas. Mitigation: add alias variable + migration, run compatibility validation. Evidence: [lib/formulaEngine.ts](lib/formulaEngine.ts), [lib/templateCompatibilityValidator.ts](lib/templateCompatibilityValidator.ts).
- [x] Breaking: changing chart type or element count without updating templates. Mitigation: update chart config + template references together. Evidence: [app/api/chart-config/route.ts](app/api/chart-config/route.ts).
- [x] Breaking: deleting report templates or data blocks referenced by projects/partners. Mitigation: reassign reportTemplateId before deletion. Evidence: [app/api/report-templates/route.ts](app/api/report-templates/route.ts), [app/api/report-config/[identifier]/route.ts](app/api/report-config/[identifier]/route.ts).

11 Execution Checklist (Contract Enforcement)
- [x] Before Admin changes: run template compatibility checks for affected templates. Evidence: [lib/templateCompatibilityValidator.ts](lib/templateCompatibilityValidator.ts).
- [x] After Admin changes: verify /api/report-config resolves and /api/chart-config/public returns required charts. Evidence: [app/api/report-config/[identifier]/route.ts](app/api/report-config/[identifier]/route.ts), [app/api/chart-config/public/route.ts](app/api/chart-config/public/route.ts).
- [x] Record change in ACTION_PLAN.md with evidence links for traceability. Evidence: [operations/ACTION_PLAN.md](../../operations/ACTION_PLAN.md).
```

## ADMIN_UI_ROLES_PERMISSIONS
<a id="admin-ui-roles-permissions"></a>

- Source: `docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-roles-permissions`

```markdown
# Admin UI Roles and Permissions
Status: Complete
Last Updated: 2026-01-13T18:30:00.000Z
Canonical: No
Owner: Audit

1 Purpose
- [x] Document Admin roles, permissions, and enforcement points for A-UI-04.
- [x] Provide a role-by-capability matrix and enforcement plan for execution.

2 Role Definitions and Sources
| Role | Source of truth | Summary | Evidence |
| --- | --- | --- | --- |
| guest | lib/users.ts | Default role for self-registration; intended for documentation access only. | [lib/users.ts](lib/users.ts), [app/api/admin/register/route.ts](app/api/admin/register/route.ts) |
| user | lib/users.ts | Basic authenticated user role (no explicit capability gates documented in UI). | [lib/users.ts](lib/users.ts) |
| admin | lib/users.ts, lib/auth.ts | Admin role used for Admin UI access; role-gated on charts and hashtags pages. | [lib/users.ts](lib/users.ts), [lib/auth.ts](lib/auth.ts), [app/admin/charts/page.tsx](app/admin/charts/page.tsx), [app/admin/hashtags/page.tsx](app/admin/hashtags/page.tsx) |
| superadmin | lib/users.ts, lib/auth.ts | Highest admin role; required for user password regeneration and deletion. | [lib/users.ts](lib/users.ts), [lib/auth.ts](lib/auth.ts), [app/api/admin/local-users/[id]/route.ts](app/api/admin/local-users/[id]/route.ts) |
| api | lib/auth.ts | Legacy API-only role present in AdminUser type; not present in UserRole union. | [lib/auth.ts](lib/auth.ts), [lib/users.ts](lib/users.ts) |

3 Permissions Model (Current)
- [x] AdminUser.permissions exists but is the same basePermissions list for all roles (read/write/delete/manage-users). Evidence: [lib/auth.ts](lib/auth.ts).
- [x] hasPermission helper exists but is not used by app or API routes. Evidence: [lib/auth.ts](lib/auth.ts).
- [x] Role list mismatch: AdminUser includes api role; UserRole union excludes api. Evidence: [lib/auth.ts](lib/auth.ts), [lib/users.ts](lib/users.ts).

4 Current Enforcement Points
| Layer | Entry point | Check type | Role enforcement | Evidence |
| --- | --- | --- | --- | --- |
| UI | useAdminAuth hook | Session check via /api/admin/auth | Authenticated only (no role gating) | [hooks/useAdminAuth.ts](hooks/useAdminAuth.ts), [app/api/admin/auth/route.ts](app/api/admin/auth/route.ts) |
| UI | /admin/charts | Client-side /api/auth/check | admin or superadmin only | [app/admin/charts/page.tsx](app/admin/charts/page.tsx), [app/api/auth/check/route.ts](app/api/auth/check/route.ts) |
| UI | /admin/hashtags | Client-side /api/auth/check | admin or superadmin only | [app/admin/hashtags/page.tsx](app/admin/hashtags/page.tsx), [app/api/auth/check/route.ts](app/api/auth/check/route.ts) |
| API | /api/admin/auth | getAdminUser | Authenticated only | [app/api/admin/auth/route.ts](app/api/admin/auth/route.ts), [lib/auth.ts](lib/auth.ts) |
| API | /api/admin/local-users (GET/POST) | getAdminUser | Authenticated only | [app/api/admin/local-users/route.ts](app/api/admin/local-users/route.ts) |
| API | /api/admin/local-users/[id] (PUT/DELETE) | getAdminUser + role check | superadmin only | [app/api/admin/local-users/[id]/route.ts](app/api/admin/local-users/[id]/route.ts) |
| API | /api/admin/local-users/[id]/api-access (PUT) | getAdminUser | Authenticated only | [app/api/admin/local-users/[id]/api-access/route.ts](app/api/admin/local-users/[id]/api-access/route.ts) |

5 Role-by-Capability Matrix (Current, Documented)
| Capability | guest | user | admin | superadmin | api | Notes | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Admin login/register/help | Yes (register/help) | Yes | Yes | Yes | No | Guest role created via registration; help route is public after login. | [app/admin/register/page.tsx](app/admin/register/page.tsx), [app/admin/help/page.tsx](app/admin/help/page.tsx) |
| Admin dashboard and navigation | Implicit | Implicit | Implicit | Implicit | No | Most admin pages use useAdminAuth only. | [hooks/useAdminAuth.ts](hooks/useAdminAuth.ts), [app/admin/page.tsx](app/admin/page.tsx) |
| Events and Partners management | Implicit | Implicit | Implicit | Implicit | No | No role gate on /admin/events or /admin/partners. | [app/admin/events/page.tsx](app/admin/events/page.tsx), [app/admin/partners/page.tsx](app/admin/partners/page.tsx) |
| Filters | Implicit | Implicit | Implicit | Implicit | No | /admin/filter relies on admin layout/session. | [app/admin/filter/page.tsx](app/admin/filter/page.tsx) |
| Reporting templates and styles | Implicit | Implicit | Implicit | Implicit | No | No role gates on /admin/visualization or /admin/styles. | [app/admin/visualization/page.tsx](app/admin/visualization/page.tsx), [app/admin/styles/page.tsx](app/admin/styles/page.tsx) |
| KYC variables | Implicit | Implicit | Implicit | Implicit | No | No role gate on /admin/kyc. | [app/admin/kyc/page.tsx](app/admin/kyc/page.tsx) |
| Algorithms (chart configs) | No | No | Yes | Yes | No | Explicit role gate in /admin/charts. | [app/admin/charts/page.tsx](app/admin/charts/page.tsx) |
| Hashtags | No | No | Yes | Yes | No | Explicit role gate in /admin/hashtags. | [app/admin/hashtags/page.tsx](app/admin/hashtags/page.tsx) |
| Admin users management | Implicit | Implicit | Implicit | Superadmin for regen/delete | No | API enforces superadmin for password regen/delete; list/create are auth-only. | [app/admin/users/page.tsx](app/admin/users/page.tsx), [app/api/admin/local-users/route.ts](app/api/admin/local-users/route.ts), [app/api/admin/local-users/[id]/route.ts](app/api/admin/local-users/[id]/route.ts) |

6 Missing or Implicit Permission Rules (Gaps)
- [x] Partner Admin / Operator roles requested by product are not defined in code; current roles are guest/user/admin/superadmin/api only.
- [x] Permissions array is not role-differentiated and hasPermission is unused in app routes.
- [x] Most Admin UI pages enforce authentication only; role-based access is limited to charts and hashtags.
- [x] User management endpoints allow any authenticated admin to list/create users; only regenerate/delete is superadmin-gated.
- [x] api role exists in AdminUser but not in UserRole union, indicating schema mismatch.

7 Execution-Ready Enforcement Plan (Where and How)
- [x] Use /api/admin/auth (getAdminUser) as the canonical auth source for Admin UI pages; align any /api/auth/check usage to the same role source.
- [x] Apply role checks in API routes for sensitive actions (users, role changes, destructive actions) using getAdminUser and role comparisons.
- [x] For charts and hashtags, keep admin/superadmin gates and document role rules in one place (this doc).
- [x] Document intended access for each capability in the matrix before refactor changes.
- [x] Resolve role mismatch (api role) in the role model before enforcing permissions more broadly.
```

