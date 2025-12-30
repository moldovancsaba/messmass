# PR: CI Guardrail Test

**Branch:** `test/ci-guardrail-test`  
**Purpose:** Verify CI guardrail correctly fails on violations and passes when fixed

---

## Test Plan

### Commit 1: Add Violation (CI Should Fail)
- **File:** `app/report/[slug]/ReportChart.module.css`
- **Change:** Added `overflow: auto;` (forbidden pattern)
- **Expected:** CI should fail with layout-grammar-guardrail error
- **Commit:** `[commit-hash-1]` - test: Add forbidden CSS violation to test CI guardrail

### Commit 2: Remove Violation (CI Should Pass)
- **File:** `app/report/[slug]/ReportChart.module.css`
- **Change:** Removed `overflow: auto;`
- **Expected:** CI should pass
- **Commit:** `[commit-hash-2]` - test: Remove forbidden CSS violation - CI should pass

---

## Expected CI Behavior

### After Commit 1 (Violation Added)
```
❌ layout-grammar-guardrail: FAILED
   Found violation: overflow: auto
   File: app/report/[slug]/ReportChart.module.css
```

### After Commit 2 (Violation Removed)
```
✅ layout-grammar-guardrail: PASSED
✅ dependency-guardrail: PASSED
✅ build: PASSED
```

---

## PR Template Fill-Out

**What Changed:**
- Added then removed `overflow: auto;` in ReportChart.module.css to test CI guardrail

**Tracker Tasks Updated:**
- None (CI testing only)

**Documentation Updated:**
- `.github/PR_CI_TEST.md` (this file)

**CI Status Checks:**
- Commit 1: ❌ `layout-grammar-guardrail` should fail
- Commit 2: ✅ `layout-grammar-guardrail` should pass
- ✅ `dependency-guardrail` should pass throughout
- ✅ `build` should pass throughout

**Layout Grammar Compliance:**
- Commit 1: ❌ Violation intentionally added for testing
- Commit 2: ✅ No violations

**Commit Hash:**
- `[commit-hash-1]` - Add violation
- `[commit-hash-2]` - Remove violation

**Signed:** — Cursora

---

## Verification Steps

1. Create PR from `test/ci-guardrail-test` branch
2. Check CI status after PR creation
3. Verify `layout-grammar-guardrail` fails (due to commit 1)
4. Wait for commit 2 to be processed
5. Verify `layout-grammar-guardrail` passes (after commit 2)
6. Confirm PR shows both states in commit history

---

**Created By:** Cursora  
**Status:** Ready for PR creation

