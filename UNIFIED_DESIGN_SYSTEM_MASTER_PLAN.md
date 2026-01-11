# Unified Design System & Layout Grammar Master Plan
Status: Active
Last Updated: 2026-01-11T22:28:38.000Z
Canonical: No
Owner: Architecture

**Version:** 1.0.1  
**Created:** 2025-01-XX  
**Status:** Ready for Execution  
**Last Updated: 2026-01-11T22:28:38.000Z

**⚠️ FINAL AUTHORITY - NO EXCEPTIONS**

**The MessMass Structural Fit & Typography Enforcement Policy (Section 0) is the absolute, final authority for all layout decisions. It supersedes all other rules, guidelines, and patterns in this document. No scrolling, truncation, or overflow is permitted. Content must fit through structural change or height increase only.**

---

## Document Purpose

This is the **master plan** that combines:
- **DESIGN_SYSTEM_PLAN.md** - The "WHAT" and "WHY" (design system specification)
- **LAYOUT_GRAMMAR_IMPLEMENTATION_PLAN.md** - The "HOW" and "WHEN" (implementation roadmap)

**Structure:**
- **Part 1:** Design System Specification (what we're building)
- **Part 2:** Implementation Plan (how we're building it)
- **Part 3:** Priority Matrix (what to do first)
- **Part 4:** Integration Guide (how they connect)

---

## Table of Contents

### Part 1: Design System Specification
0. [Structural Fit & Typography Enforcement Policy](#0-structural-fit--typography-enforcement-policy) ⚠️ **FINAL AUTHORITY**
1. [Core Principles](#1-core-principles)
2. [Chart Layout System](#2-chart-layout-system)
3. [Typography System](#3-typography-system)
4. [Spacing & Alignment](#4-spacing--alignment)
5. [Responsive Behavior](#5-responsive-behavior)

### Part 2: Implementation Plan
6. [Current State & Audit Findings](#6-current-state--audit-findings)
7. [Security Requirements](#7-security-requirements) ⚠️ **CRITICAL**
8. [Implementation Phases](#8-implementation-phases)
9. [Testing & Validation](#9-testing--validation)
10. [Rollout Strategy](#10-rollout-strategy)

### Part 3: Priority Matrix
11. [Priority Matrix](#11-priority-matrix) ⚠️ **START HERE**

### Part 4: Integration Guide
12. [How Design System & Implementation Connect](#12-how-design-system--implementation-connect)

---

# Part 1: Design System Specification

## 0. Structural Fit & Typography Enforcement Policy

**⚠️ FINAL AUTHORITY – NO EXCEPTIONS**

This policy section locks everything together. It supersedes all earlier overflow, truncation, and scroll-related ambiguity.

### Absolute Rule (P0)

**Scrolling is prohibited. Truncation is prohibited. Content must always fit by structural change or height increase.**

If content cannot fit:
- We increase height
- Or we split structure
- Or we block publishing

**Nothing else is allowed.**

---

### 1. Canonical Fit Doctrine

#### 1.1 Allowed Fit Mechanisms (Exhaustive List)

When content does not fit inside a Cell at the resolved Block height, the system may only do the following, **in this order**:

1. **Increase Block Height**
2. **Reflow internal layout** (e.g. legend position, chart orientation)
3. **Reduce semantic density** (Top-N, aggregation — **never data loss**)
4. **Split into additional Blocks**
5. **Fail validation** (publish blocked)

**⚠️ CRITICAL:** The order is mandatory. The system must attempt each mechanism in sequence before proceeding to the next.

#### Explicitly Forbidden

- ❌ Vertical scroll
- ❌ Horizontal scroll
- ❌ Line clamping
- ❌ Ellipsis
- ❌ Hidden overflow
- ❌ "Looks OK on desktop"

**If any of these appear in code, the implementation is wrong.**

---

### 2. Block Height Is Elastic (Now Fully Explicit)

#### 2.1 Block Height Is Not Fixed by Design

**Blocks are elastic containers.**

They may:
- Grow vertically to preserve readability
- Override aesthetic ratios when content demands it

**Aspect ratios are preferences, not laws.**

---

### 3. Height Resolution Algorithm (Final)

Block height is resolved deterministically using the following priority chain:

#### Priority 1 — Intrinsic Media Authority (Unstoppable Bullet)

**If any Cell contains:**
- Image Element
- Mode = SET / Intrinsic

**Then:**
- Block height is resolved from that image's aspect ratio
- All other Cells stretch to match
- Typography scales within that height
- If typography reaches minimums and still doesn't fit → Block height increases further

**Intrinsic media never causes truncation.**

---

#### Priority 2 — Block Aspect Ratio (Soft Constraint)

**If:**
- No intrinsic media exists
- A Block aspect ratio is defined

**Then:**
- Initial Block height = width × ratio
- This height may increase if text, charts, or tables require more space

**Aspect ratios never override readability.**

---

#### Priority 3 — Readability Enforcement (Hard Constraint)

**If any Element:**
- Reaches minimum font size
- Still cannot fit vertically

**Then:**
- Block height must increase
- Units and layout remain intact
- All Cells re-align to new height

**This guarantees typographic integrity.**

---

#### Priority 4 — Structural Failure

**If Block height increase would:**
- Break a template constraint
- Violate report maximum height rules

**Then:**
- Editor must split the Block
- If split is not possible → publishing is blocked

**Silent failure is forbidden.**

---

### 4. Unified Typography (Final Scope Locked)

#### 4.1 Block Typography Contract

Each Block computes exactly one value: `--block-base-font-size`

This value applies to:
- Text Elements (base)
- Markdown headings (H1/H2/H3 via em multipliers)
- Chart labels
- Chart legends
- Table headers and cells
- Descriptions / captions

#### 4.2 Explicit Exemption

- **KPI value only** (KPI label + description still participate unless you later exempt them)

This ensures:
- Visual rhythm
- Horizontal alignment
- No typographic "noise"

---

### 5. Element-Specific Enforcement (No Scroll Edition)

#### 5.1 Text Element (Markdown)

**Rules:**
- Text must fully fit
- Font size scales down only to minimum
- If still not fitting → Block height increases
- If Block height increase violates constraints → Block split

**There is no truncation mode. There is no "summary text" shortcut. Text either fits or the structure adapts.**

**⚠️ CRITICAL:** Markdown rendering must preserve all content. No content may be hidden, truncated, or summarized. The structure must adapt to accommodate all content.

---

#### 5.2 KPI Element

- **KPI value scales independently** (explicit exemption from unified typography)
- **KPI label participates in block typography** (uses `--block-base-font-size`)
- **Description participates in block typography** (uses `--block-base-font-size`)
- Description is optional but must still fit

**If a KPI cannot fit at minimum sizes → validation failure**

**⚠️ CRITICAL:** KPIs are designed to be concise. If a KPI cannot fit at minimum font sizes, the configuration is invalid, not the layout system.

---

#### 5.3 Pie Element

- Pie radius has a minimum
- Legends must fit without scroll
- **Allowed actions (in order):**
  1. Reflow legend position
  2. Reduce legend count via aggregation (Top-N + Other) — **never data loss**
  3. Increase Block height

**If still not fitting → Block height increase**

**If height cannot increase → Block split**

**⚠️ CRITICAL:** Aggregation must preserve data integrity. "Other" category must represent the sum of excluded items, not data loss.

---

#### 5.4 Bar Element

- Orientation may change (vertical ↔ horizontal)
- Label density may reduce
- Block height may increase

**Bars never scroll. Bars never truncate values.**

---

#### 5.5 Table Element (Critical Clarification)

A Table Element is not a full data dump.

**Rules:**
- Table must fit fully inside its Cell
- Row count is bounded by available height
- If required rows don't fit:
  - Block height increases
  - Or Block splits
  - If neither is allowed → publish blocked

**If someone wants "all rows", that is:**
- An export
- A modal
- A separate page

**Not a report element.**

---

#### 5.6 Image Element

- `cover` → Cell governs
- `setIntrinsic` → Image governs Block height
- No cropping in setIntrinsic
- No scroll in any mode

---

### 6. Editor Obligations (Now Mandatory)

#### 6.1 Prevent Invalid States

- Disallow saving Blocks that cannot resolve height
- Surface clear errors:
  - "Text exceeds readable bounds"
  - "Table cannot fit without split"
  - "Conflicting intrinsic media"

#### 6.2 Provide Deterministic Controls

- Block aspect ratio (optional)
- Cell image mode (cover / setIntrinsic)
- Maximum Block height constraints (if any)
- Preview that shows actual resolved height, not optimistic layout

**If the editor allows invalid layouts, the design system is not enforced.**

---

### 7. Why This Is Now Rock Solid

With:
- No scroll
- No truncation
- Unified typography
- Explicit height precedence
- Structural change as the only escape hatch

You now have:
- Predictable layouts
- Honest reports (no hidden data)
- A system AI agents can reason about
- Zero "but it worked on my screen" arguments

**This is how newspapers, financial terminals, and serious reporting tools think — not dashboards that cheat.**

---

### Final CXO Statement

At this point:
- The naming is closed
- The hierarchy is closed
- The conflict resolution rules are closed

**This is no longer a UI system.**

**It's a layout grammar.**

---

## 1. Core Principles

### 1.1 Consistency First
- All charts of the same type must behave identically
- Visual hierarchy must be consistent across all chart types
- Spacing, alignment, and sizing must follow unified rules

### 1.2 Vertical and Horizontal Alignment
- **CRITICAL RULE:** All chart elements must be vertically and horizontally centered in their allocated space
- Title, content, legends, descriptions must align to the middle vertically
- Same-type elements (titles to titles, icons to icons) must align horizontally across same charts in the same block

### 1.3 Responsive Scaling
- Font sizes must scale proportionally to available space
- Charts must maintain aspect ratios and readability at all sizes
- Container queries are the primary mechanism for responsive scaling
- **CRITICAL:** Scaling down has minimum limits - if content doesn't fit at minimum, Block height must increase (see Section 0)

### 1.4 Content-First Design
- Content determines layout, not arbitrary rules
- Text should fill available space while maintaining readability
- Charts should adapt to content, not force content into fixed sizes

### 1.5 Unified Font Sizing
- **CRITICAL:** Each Block computes exactly one `--block-base-font-size` value
- This applies to: Text Elements, Markdown headings, Chart labels, Chart legends, Table headers/cells, Descriptions
- **Exemption:** KPI values scale independently (KPI labels/descriptions still participate)
- Font-size is calculated to fit the largest content
- If content doesn't fit at minimum font-size → Block height increases (see Section 0)

---

## 2. Chart Layout System

### 2.1 Universal Chart Structure

All charts follow this structure:
```
┌─────────────────────────────────┐
│ Title (centered, max 2 lines)   │ ← Title Zone (30% height)
├─────────────────────────────────┤
│ Subtitle (centered, max 2 lines)│ ← Subtitle Zone (optional)
├─────────────────────────────────┤
│                                 │
│      Chart Content              │ ← Body Zone (70% height)
│                                 │
└─────────────────────────────────┘
```

### 2.2 Layout Rules

- **Title Zone:** Fixed height (30% of cell), vertically centered, max 2 lines with ellipsis
- **Subtitle Zone:** Optional, fixed height, vertically centered, max 2 lines
- **Body Zone:** Remaining space (70% of cell), content fills and scales

### 2.3 Chart-Specific Rules

**PIE Chart:**
- Chart and legends in body zone
- Legends below chart (vertical stack)
- Both scale proportionally

**BAR Chart:**
- Chart and legends side-by-side (horizontal)
- Orientation may change (vertical ↔ horizontal) if needed

**KPI Chart:**
- Icon + value + description (stacked vertically)
- Value scales independently
- Label and description use block typography

**TEXT Chart:**
- Markdown content fills body zone
- Scales to fit available space
- Uses unified block typography

**TABLE Chart:**
- Table fills body zone
- Row count bounded by height
- No scrolling allowed

**IMAGE Chart:**
- Image fills body zone
- Aspect ratio preserved
- `setIntrinsic` mode governs block height

---

## 3. Typography System

### 3.1 Block Typography Contract

**Each Block computes exactly one value: `--block-base-font-size`**

**Applies to:**
- Text Elements (base)
- Markdown headings (H1/H2/H3 via em multipliers)
- Chart labels
- Chart legends
- Table headers and cells
- Descriptions / captions

**Exemption:**
- KPI values scale independently

### 3.2 Font Size Calculation

1. For each cell in block:
   - Calculate optimal font-size for each element type
   - Text: Use unified text font-size logic
   - Labels: Calculate based on label length and container
   - Legends: Calculate based on legend items and container
   - Tables: Calculate based on cell content and container

2. Find minimum of all optimal sizes

3. Apply as `--block-base-font-size`

### 3.3 Font Size Limits

- **Minimum:** `0.75rem` (12px) - readability threshold
- **Maximum:** `2.5rem` (40px) - visual balance
- **Default:** `1rem` (16px) - standard reading size

**If content doesn't fit at minimum → Block height increases**

---

## 4. Spacing & Alignment

### 4.1 Vertical Alignment

- **CRITICAL:** All chart elements must be vertically centered in their allocated space
- Title, content, legends, descriptions must align to the middle vertically
- Use flexbox `align-items: center` or CSS Grid alignment

### 4.2 Horizontal Alignment

- Same-type elements (titles to titles, icons to icons) must align horizontally across same charts in the same block
- Use CSS Grid or flexbox for consistent alignment

### 4.3 Spacing

- Use design tokens (`--mm-space-*`) exclusively
- No hardcoded spacing values
- Consistent spacing across all chart types

---

## 5. Responsive Behavior

### 5.1 Container Queries

- Primary mechanism for responsive scaling
- Use `cqh` (container query height) and `cqw` (container query width)
- Font sizes scale with container size

### 5.2 Mobile Considerations

- Charts must maintain readability on mobile
- Minimum font sizes enforced
- Block height increases if needed
- No scrolling or truncation

### 5.3 Breakpoints

- Use design tokens for breakpoints
- Consistent behavior across all chart types
- Test on multiple viewport sizes

---

# Part 2: Implementation Plan

## 6. Current State & Audit Findings

### 6.1 Existing Systems to Preserve

1. **Report Layout Spec v2.0** (`docs/design/LAYOUT_SYSTEM.md`)
   - Block-based layout system
   - Cell width model (1-unit, 2-unit)
   - Cell structure (Title/Subtitle/Body zones)
   - Height calculation (`blockHeightCalculator.ts`)

2. **Font Sync Calculator** (`lib/fontSyncCalculator.ts`)
   - Synchronized title/subtitle font sizes
   - Binary search for optimal sizes

3. **Unified Text Font Size** (`hooks/useUnifiedTextFontSize.ts`)
   - Block-level font-size calculation for text charts
   - Container measurement and optimization

4. **Chart Rendering** (`app/report/[slug]/ReportChart.tsx`)
   - Type-specific chart components
   - CellWrapper integration

### 6.2 Issues to Fix

#### Layout Grammar Issues
- Scrolling/Truncation Violations
- No explicit height resolution priority chain
- No unified `--block-base-font-size`
- No editor validation

#### Security Issues (From Audits) ⚠️ **CRITICAL**
- 6 instances of `dangerouslySetInnerHTML` (XSS vulnerability)
- 2 instances of `Function()` constructor (code injection risk)
- Zero input sanitization in multiple routes
- No Content Security Policy (CSP) headers

#### Architectural Issues (From Audits)
- 87+ files with inline styles (design system bypassed)
- 200+ files with hardcoded values (design tokens ignored)
- DynamicChart.tsx still imported in 3+ files (deprecated code)
- 56+ TypeScript `any` types (type safety bypassed)

#### Testing & Quality Issues
- Zero test coverage
- No end-to-end testing
- ESLint disabled during builds
- Console.log statements in production code

---

## 7. Security Requirements

### 7.1 Mandatory Security Controls

1. **Input Validation:**
   - All block configurations validated
   - All height calculations validated
   - All typography inputs validated
   - All element content validated

2. **XSS Prevention:**
   - All markdown rendering sanitized
   - All HTML rendering uses DOMPurify
   - Content Security Policy (CSP) headers
   - No `dangerouslySetInnerHTML` without sanitization

3. **Type Safety:**
   - No `any` types in layout grammar code
   - Proper TypeScript interfaces
   - Runtime type validation where needed

4. **Code Injection Prevention:**
   - No `Function()` constructor
   - Safe formula evaluation
   - Validated calculations only

5. **Design Token Enforcement:**
   - No inline styles
   - No hardcoded values
   - All styling via CSS custom properties

---

## 8. Implementation Phases

### Phase Overview

```
Phase 0: Security Hardening Prerequisites (Week 0-1) ⚠️ MUST COMPLETE FIRST
  ↓
Phase 1: Foundation & Core Infrastructure (Week 1-2)
  ↓
Phase 2: Height Resolution System (Week 2-3)
  ↓
Phase 3: Unified Typography System (Week 3-4)
  ↓
Phase 4: Element-Specific Enforcement (Week 4-5)
  ↓
Phase 5: Editor Integration (Week 5-6)
  ↓
Phase 6: Migration & Validation (Week 6-7)
```

**Total Timeline:** 7-8 weeks  
**Critical Path:** Phase 0 → Phases 1 → 2 → 3 (must be sequential)

---

### Phase 0: Security Hardening Prerequisites ⚠️ **MUST COMPLETE FIRST**

**Duration:** 1 week  
**Dependencies:** None  
**Priority:** 🔴 **CRITICAL**

**Goal:** Secure the foundation before building layout grammar

**Tasks:**
1. Secure markdown rendering (XSS prevention)
2. Input validation framework
3. Remove deprecated code (DynamicChart.tsx)
4. Design token migration foundation
5. Type safety foundation
6. Testing infrastructure

**See:** [LAYOUT_GRAMMAR_IMPLEMENTATION_PLAN.md - Phase 0](#) for detailed tasks

---

### Phase 1: Foundation & Core Infrastructure

**Duration:** 1-2 weeks  
**Dependencies:** Phase 0 complete

**Goal:** Create core infrastructure for layout grammar

**Tasks:**
1. Create layout grammar core module (types, interfaces)
2. Create height resolution engine (4-priority algorithm)
3. Create element fit validator
4. Remove all scrolling/truncation code

**See:** [LAYOUT_GRAMMAR_IMPLEMENTATION_PLAN.md - Phase 1](#) for detailed tasks

---

### Phase 2: Height Resolution System

**Duration:** 1 week  
**Dependencies:** Phase 1 complete

**Goal:** Implement deterministic block height resolution

**Tasks:**
1. Integrate height resolution into block calculator
2. Update ReportContent to use new resolution
3. Implement intrinsic media authority

**See:** [LAYOUT_GRAMMAR_IMPLEMENTATION_PLAN.md - Phase 2](#) for detailed tasks

---

### Phase 3: Unified Typography System

**Duration:** 1 week  
**Dependencies:** Phase 2 complete

**Goal:** Implement `--block-base-font-size` for all elements except KPI values

**Tasks:**
1. Create block typography calculator
2. Apply unified typography via CSS custom property
3. Update CSS to use unified typography

**See:** [LAYOUT_GRAMMAR_IMPLEMENTATION_PLAN.md - Phase 3](#) for detailed tasks

---

### Phase 4: Element-Specific Enforcement

**Duration:** 1 week  
**Dependencies:** Phase 3 complete

**Goal:** Ensure each element type fits without scrolling/truncation

**Tasks:**
1. Text element enforcement
2. Table element enforcement
3. Pie element enforcement
4. Bar element enforcement

**See:** [LAYOUT_GRAMMAR_IMPLEMENTATION_PLAN.md - Phase 4](#) for detailed tasks

---

### Phase 5: Editor Integration

**Duration:** 1 week  
**Dependencies:** Phase 4 complete

**Goal:** Editor validates and enforces layout grammar

**Tasks:**
1. Create editor validation API
2. Integrate validation into chart builder
3. Add block configuration controls

**See:** [LAYOUT_GRAMMAR_IMPLEMENTATION_PLAN.md - Phase 5](#) for detailed tasks

---

### Phase 6: Migration & Validation

**Duration:** 1 week  
**Dependencies:** All phases complete

**Goal:** Migrate existing reports and validate system

**Tasks:**
1. Create migration script
2. Create validation test suite
3. Update documentation

**See:** [LAYOUT_GRAMMAR_IMPLEMENTATION_PLAN.md - Phase 6](#) for detailed tasks

---

## 9. Testing & Validation

### 9.1 Unit Tests

**Coverage Required:**
- Height resolution engine: 100%
- Element fit validator: 100%
- Block typography calculator: 100%
- Editor validation: 100%
- Security validation: 100%

### 9.2 Security Tests

**Test Coverage:**
- XSS prevention in markdown rendering
- Input validation for all inputs
- Type safety (no `any` types)
- CSP compliance
- Code injection prevention

### 9.3 Integration Tests

**Test Scenarios:**
1. Block with intrinsic image
2. Block with aspect ratio
3. Block with text that doesn't fit
4. Block with table that doesn't fit
5. Block with pie chart and legend
6. Block with multiple chart types
7. Editor validation flow
8. Height increase flow
9. Block split flow

### 9.4 Visual Regression Tests

**Tools:**
- Playwright or Cypress
- Screenshot comparison

**Test Cases:**
- All chart types render correctly
- Heights resolve correctly
- Typography is unified
- No scrolling/truncation
- Mobile responsiveness

---

## 10. Rollout Strategy

### Stage 1: Internal Testing (Week 7)
- Deploy to staging environment
- Test with sample reports
- Fix any issues
- Validate all test cases pass

### Stage 2: Beta Testing (Week 8)
- Enable for select users
- Monitor for issues
- Collect feedback
- Iterate on fixes

### Stage 3: Gradual Rollout (Week 9-10)
- 10% of reports → 50% → 100%
- Monitor error rates
- Monitor performance
- Rollback plan ready

### Stage 4: Full Production (Week 11)
- All reports migrated
- All features enabled
- Documentation complete
- Team trained

---

# Part 3: Priority Matrix

## 11. Priority Matrix

### 🔴 P0 - CRITICAL (Must Do First)

**These are blockers - nothing else can proceed until these are done:**

1. **Phase 0: Security Hardening Prerequisites**
   - Secure markdown rendering (XSS prevention)
   - Input validation framework
   - Remove deprecated code
   - Type safety foundation
   - Testing infrastructure

**Why:** Security vulnerabilities must be fixed before building new features. Cannot build on insecure foundation.

---

### 🟠 P1 - HIGH (Do Next)

**These enable the core functionality:**

2. **Phase 1: Foundation & Core Infrastructure**
   - Layout grammar core module
   - Height resolution engine
   - Element fit validator
   - Remove scrolling/truncation code

**Why:** Core infrastructure must be in place before implementing features.

3. **Phase 2: Height Resolution System**
   - Integrate height resolution
   - Implement intrinsic media authority

**Why:** Height resolution is the foundation of the layout grammar. Everything depends on this.

---

### 🟡 P2 - MEDIUM (Do After P1)

**These implement the design system:**

4. **Phase 3: Unified Typography System**
   - Block typography calculator
   - Apply unified typography
   - Update CSS

**Why:** Typography is a core design system requirement. Must be implemented after height resolution.

5. **Phase 4: Element-Specific Enforcement**
   - Text element enforcement
   - Table element enforcement
   - Pie element enforcement
   - Bar element enforcement

**Why:** Element-specific rules enforce the design system. Must be implemented after typography.

---

### 🟢 P3 - LOW (Do Last)

**These polish and validate:**

6. **Phase 5: Editor Integration**
   - Editor validation API
   - Integrate into chart builder
   - Block configuration controls

**Why:** Editor features are nice-to-have but not required for core functionality.

7. **Phase 6: Migration & Validation**
   - Migration script
   - Validation test suite
   - Documentation updates

**Why:** Migration and validation can happen in parallel with production use.

---

## Priority Decision Tree

```
START
  ↓
Is Phase 0 complete? → NO → Do Phase 0 (Security Hardening)
  ↓ YES
Is Phase 1 complete? → NO → Do Phase 1 (Foundation)
  ↓ YES
Is Phase 2 complete? → NO → Do Phase 2 (Height Resolution)
  ↓ YES
Is Phase 3 complete? → NO → Do Phase 3 (Typography)
  ↓ YES
Is Phase 4 complete? → NO → Do Phase 4 (Element Enforcement)
  ↓ YES
Is Phase 5 complete? → NO → Do Phase 5 (Editor Integration)
  ↓ YES
Is Phase 6 complete? → NO → Do Phase 6 (Migration)
  ↓ YES
DONE
```

---

# Part 4: Integration Guide

## 12. How Design System & Implementation Connect

### 12.1 Design System → Implementation Mapping

| Design System Requirement | Implementation Task | Phase |
|---------------------------|---------------------|-------|
| **Section 0: Structural Fit Policy** | Phase 1 Task 1.4: Remove scrolling/truncation | Phase 1 |
| **Section 0: Height Resolution Algorithm** | Phase 2: Height Resolution System | Phase 2 |
| **Section 0: Unified Typography** | Phase 3: Unified Typography System | Phase 3 |
| **Section 0: Element-Specific Enforcement** | Phase 4: Element-Specific Enforcement | Phase 4 |
| **Section 0: Editor Obligations** | Phase 5: Editor Integration | Phase 5 |
| **Section 1: Core Principles** | Phase 1-4: All phases | All |
| **Section 2: Chart Layout System** | Phase 4: Element-Specific Enforcement | Phase 4 |
| **Section 3: Typography System** | Phase 3: Unified Typography System | Phase 3 |
| **Section 4: Spacing & Alignment** | Phase 1: Foundation (CSS updates) | Phase 1 |
| **Section 5: Responsive Behavior** | Phase 1: Foundation (CSS updates) | Phase 1 |

---

### 12.2 Implementation → Design System Validation

**For each implementation task, validate against design system:**

1. **Does it comply with Section 0 (Structural Fit Policy)?**
   - No scrolling? ✅
   - No truncation? ✅
   - Height increases when needed? ✅
   - Block splits when needed? ✅

2. **Does it follow Core Principles?**
   - Consistency? ✅
   - Vertical alignment? ✅
   - Responsive scaling? ✅
   - Content-first design? ✅
   - Unified font sizing? ✅

3. **Does it use Design Tokens?**
   - No inline styles? ✅
   - No hardcoded values? ✅
   - All styling via CSS custom properties? ✅

4. **Is it Secure?**
   - Input validation? ✅
   - XSS prevention? ✅
   - Type safety? ✅
   - CSP compliance? ✅

---

### 12.3 Cross-Reference Guide

**When implementing a feature:**

1. **Check Design System Plan:**
   - What are the requirements? (Section 0-5)
   - What are the rules? (Core Principles)
   - What are the constraints? (Structural Fit Policy)

2. **Check Implementation Plan:**
   - What phase does this belong to? (Phase 0-6)
   - What tasks are required? (Task X.X)
   - What are the acceptance criteria? (Task X.X)

3. **Validate:**
   - Does implementation match design system? ✅
   - Are all requirements met? ✅
   - Are all constraints followed? ✅

---

## Success Criteria

### Functional (Layout Grammar Compliance)
- [ ] No scrolling in any chart type (vertical or horizontal)
- [ ] No truncation in any chart type
- [ ] No line clamping (except title max 2 lines)
- [ ] No ellipsis (except title max 2 lines)
- [ ] No hidden overflow
- [ ] Block height resolves deterministically (4-priority algorithm)
- [ ] Unified typography works correctly (`--block-base-font-size`)
- [ ] KPI values scale independently (explicit exemption)
- [ ] All elements fit without violations
- [ ] Editor validates correctly
- [ ] Height increases when content doesn't fit
- [ ] Block splits when height cannot increase
- [ ] Publishing blocked when split not possible
- [ ] Allowed fit mechanisms work in correct order (1-5)
- [ ] Reflow works (legend position, chart orientation)
- [ ] Semantic density reduction works (Top-N, aggregation — no data loss)
- [ ] Intrinsic media authority works (Priority 1)
- [ ] Block aspect ratio works (Priority 2)
- [ ] Readability enforcement works (Priority 3)
- [ ] Structural failure handled correctly (Priority 4)
- [ ] All element-specific rules enforced (Text, KPI, Pie, Bar, Table, Image)
- [ ] Editor prevents invalid states
- [ ] Editor provides deterministic controls
- [ ] Preview shows actual resolved height (not optimistic)

### Security ⚠️ **CRITICAL**
- [ ] All markdown rendering sanitized
- [ ] All inputs validated
- [ ] No XSS vulnerabilities
- [ ] No code injection risks
- [ ] CSP headers configured
- [ ] No `any` types in layout grammar code
- [ ] All security tests pass

### Quality
- [ ] Test coverage > 80%
- [ ] Security test coverage > 90%
- [ ] No TypeScript errors (strict mode)
- [ ] No linting errors
- [ ] ESLint enabled in builds
- [ ] No console.log statements
- [ ] Design tokens used exclusively
- [ ] No inline styles
- [ ] No hardcoded values

---

## Next Steps

1. **Review and Approve Plan**
   - Stakeholder review
   - Technical review
   - Timeline confirmation

2. **Set Up Development Environment**
   - Create feature branch
   - Set up test infrastructure
   - Prepare migration scripts

3. **Begin Phase 0**
   - Start with Task 0.1 (Secure Markdown Rendering)
   - Set up CI/CD for tests
   - Daily standups to track progress

---

**Document Maintained By:** Development Team  
**Last Updated:** 2025-01-XX  
**Next Review:** Weekly during implementation  
**Security Review:** Before each phase gate

**Related Documents:**
- `DESIGN_SYSTEM_PLAN.md` - Detailed design system specification
- `LAYOUT_GRAMMAR_IMPLEMENTATION_PLAN.md` - Detailed implementation tasks
- `COMPREHENSIVE_CRITICAL_AUDIT.md` - Security audit findings
- `CTO_REMEDIATION_PLAN.md` - Zero-downtime migration strategy

