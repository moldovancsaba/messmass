# GitHub Setup Checklist — Action Required

**Created:** 2025-01-XX  
**Status:** ⚠️ **ACTION REQUIRED**  
**Assigned To:** Sultan

---

## ✅ Completed (Automated by Cursora)

1. **PR Template Created**
   - ✅ `.github/pull_request_template.md`
   - Enforces compliance reporting in every PR

2. **CODEOWNERS Created**
   - ✅ `.github/CODEOWNERS`
   - Protects policy surfaces (tracker, docs, guardrails, workflows)
   - Requires Sultan review for policy changes

3. **Workflow Permissions Updated**
   - ✅ `.github/workflows/layout-grammar-guardrail.yml` (permissions added)
   - ✅ `.github/workflows/dependency-guardrail.yml` (permissions added)
   - Permissions: `contents: read`, `pull-requests: read`

4. **Documentation Created**
   - ✅ `docs/GITHUB_SETUP.md` (complete setup guide)
   - ✅ `docs/GITHUB_SETUP_CHECKLIST.md` (this file)

5. **Stack Contradiction Resolved**
   - ✅ Program Standards locked: `ws` (WebSocket) + native MongoDB driver
   - ✅ Explicitly prohibited: Socket.io library, Mongoose
   - ✅ Decision date and rationale documented

6. **Tracker Reconciled**
   - ✅ Progress numbers verified: Phase 0 = 7/8 tasks (87.5%), Overall = 7/28 tasks (25.0%)
   - ✅ Heartbeat note template added
   - ✅ Session notes updated

---

## ⚠️ Action Required (Manual GitHub UI Configuration)

### 1. Branch Protection Rules

**Location:** Repository Settings → Branches → Branch protection rules

**Steps:**
1. Click "Add rule" or edit existing rule for `main` branch
2. Enable "Require pull request reviews before merging"
   - Required approvals: `1-2`
3. Enable "Require status checks to pass before merging"
   - Add required checks:
     - `layout-grammar-guardrail`
     - `dependency-guardrail`
     - `build`
4. Enable "Require branches to be up to date before merging"
5. Enable "Do not allow bypassing the above settings"
6. Enable "Restrict who can push to matching branches" (only via PRs)
7. Save changes

**Verification:**
- Try to push directly to `main` → Should be blocked
- Create a test PR → Should require checks to pass

---

### 2. GitHub Actions Permissions

**Location:** Repository Settings → Actions → General → Workflow permissions

**Steps:**
1. Select "Read and write permissions" (or "Read repository contents and packages permissions" if read-only is sufficient)
2. Enable "Allow GitHub Actions to create and approve pull requests" (if needed)
3. Enable "Allow workflows to run on pull requests"
4. Save changes

**Verification:**
- Create a test PR → Workflows should run automatically

---

### 3. Verify Status Checks

**After workflows run at least once:**

**Location:** Repository Settings → Branches → Branch protection rules → Edit rule for `main`

**Steps:**
1. Scroll to "Require status checks to pass before merging"
2. Verify these checks appear in the list:
   - `layout-grammar-guardrail`
   - `dependency-guardrail`
   - `build`
3. Check the boxes for all three
4. Save changes

**Note:** Status checks only appear after the workflow has run at least once. You may need to:
1. Create a test PR
2. Wait for workflows to run
3. Then configure branch protection

---

### 4. Test CI Enforcement

**Create a test PR with intentional violation:**

1. Create a new branch: `test/ci-enforcement`
2. Add a forbidden pattern to a CSS file (e.g., `overflow: auto;`)
3. Commit and push
4. Create PR to `main`
5. Verify:
   - ✅ PR template is populated
   - ✅ CI checks run
   - ✅ `layout-grammar-guardrail` fails
   - ✅ PR cannot be merged (blocked by branch protection)
6. Remove violation
7. Verify:
   - ✅ CI checks pass
   - ✅ PR becomes mergeable

---

## 📋 Quick Reference

### Required Status Checks
- `layout-grammar-guardrail` (Task 0.7)
- `dependency-guardrail` (Task 0.8)
- `build`

### Protected Files (via CODEOWNERS)
- `LAYOUT_GRAMMAR_PROGRESS_TRACKER.md`
- `docs/design/*`
- `scripts/check-*.ts`
- `.github/workflows/*`

### Monitoring
- **Daily:** Check if PRs are mergeable (all checks passing)
- **Weekly:** Review guardrail effectiveness
- **Monthly:** Review branch protection rules

---

## 🎯 Success Criteria

Setup is complete when:
- ✅ Branch protection rules configured
- ✅ All required status checks passing
- ✅ Test PR with violation is blocked
- ✅ Test PR without violation is mergeable
- ✅ CODEOWNERS reviews required for policy files

---

**Last Updated:** 2025-01-XX  
**Created By:** Cursora  
**Action Required By:** Sultan

