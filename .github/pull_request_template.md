# Pull Request
Status: Active
Last Updated: 2026-01-11T22:28:38.000Z
Canonical: No
Owner: Architecture

## DoD Profile
- [ ] **Report Rendering & Dashboards** (STRICT)
- [ ] **Infrastructure & Operations** (CRITICAL)
- [ ] **Editor & Builder** (STRICT)
- [ ] **Security & Validation** (CRITICAL)
- [ ] **Documentation** (STANDARD)

## Required Status Checks (ALL must pass before merge)

**CI Gate (Auto-merge enabled):**
- [ ] **Build** - Next.js build succeeds
- [ ] **Type Check** - TypeScript compilation passes (strict mode)
- [ ] **Lint** - ESLint passes (no warnings/errors)
- [ ] **Layout Grammar Guardrail** - No forbidden CSS patterns (`overflow`, `text-overflow`, `line-clamp`)
- [ ] **Dependency Guardrail** - No unapproved dependencies, no vulnerabilities
- [ ] **Date Placeholder Guardrail** - No placeholder dates in tracker/docs
- [ ] **Layout Grammar Test Suite** - All Layout Grammar unit tests pass
- [ ] **Phase 6 Validation Test Suite** - All validation tests pass (if Phase 6+ work)

**Note:** GitHub Auto-merge is enabled. Once all required checks pass, the PR will merge automatically. No manual merge required.

## Context

**Branch:** `[branch-name]`  
**Base:** `[base-branch]`  
**Related Issue/Phase:** [Link or reference]

**Phase 5 File Touches (if any):**
- [ ] No Phase 5 files touched
- [ ] Phase 5 files touched (justified below)

If Phase 5 files were touched, explain why this is required by Task 6.x:

```
[Explanation]
```

## Changes

**What changed:**
- [List files/components changed]

**Why:**
- [Rationale for changes]

**How:**
- [Implementation approach]

## Verification

**Tests:**
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Layout Grammar validation tests pass
- [ ] All existing tests pass

**Manual Testing:**
- [ ] Tested locally
- [ ] Verified in preview deployment
- [ ] No console errors
- [ ] No visual regressions

**CI Status:**
- [ ] All required checks passing
- [ ] Build succeeds
- [ ] Type check passes
- [ ] Lint passes
- [ ] Guardrails pass

## Impact

**Breaking Changes:**
- [ ] No breaking changes
- [ ] Breaking changes (documented below)

**Performance:**
- [ ] No performance impact
- [ ] Performance impact (documented below)

**Security:**
- [ ] No security implications
- [ ] Security review required (documented below)

## Documentation

- [ ] Code comments updated
- [ ] README updated (if needed)
- [ ] Tracker updated (if Phase 6+ work)
- [ ] API documentation updated (if needed)

## Checklist

- [ ] Code follows project standards
- [ ] No `console.log` statements (except in tests)
- [ ] No `any` types (except where explicitly allowed)
- [ ] Design tokens used (no hardcoded values)
- [ ] No inline styles
- [ ] TypeScript strict mode passes
- [ ] ESLint passes
- [ ] All tests pass
- [ ] PR description is complete
- [ ] Ready for review

---

**Auto-merge:** Enabled  
**Reviewers:** [Auto-assigned based on CODEOWNERS]  
**Labels:** [Auto-assigned based on changed files]

