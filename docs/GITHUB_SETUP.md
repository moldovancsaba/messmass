# GitHub Repository Setup & Branch Protection

**Version:** 1.0.0  
**Created:** 2025-01-XX  
**Last Updated:** 2025-01-XX  
**Status:** Active

**Maintained By:** Sultan  
**Reviewed By:** Cursora

---

## Overview

This document describes the required GitHub repository configuration to enforce Layout Grammar policies and ensure CI/CD compliance.

---

## 1. Branch Protection Rules

### Protect `main` Branch

**Location:** Repository Settings → Branches → Branch protection rules

**Required Settings:**

1. **Require pull request reviews before merging**
   - ✅ Enable
   - Required approvals: `1-2` (Sultan mandatory for policy files via CODEOWNERS)

2. **Require status checks to pass before merging**
   - ✅ Enable
   - **Required checks:**
     - `layout-grammar-guardrail` (Task 0.7)
     - `dependency-guardrail` (Task 0.8)
     - `build` (Next.js build)
     - Any existing test/lint checks

3. **Require branches to be up to date before merging**
   - ✅ Enable

4. **Do not allow bypassing the above settings**
   - ✅ Enable (for administrators)

5. **Restrict who can push to matching branches**
   - ✅ Enable (only via PRs)

**Result:** No direct pushes to `main`. All changes must go through PRs with passing CI checks.

---

## 2. GitHub Actions Permissions

### Workflow Permissions

**Location:** Repository Settings → Actions → General → Workflow permissions

**Required Settings:**

1. **Workflow permissions**
   - ✅ Read and write permissions (or Read repository contents and packages permissions if read-only is sufficient)

2. **Allow GitHub Actions to create and approve pull requests**
   - ✅ Enable (if workflows need to create/approve PRs)

3. **Allow workflows to run on pull requests**
   - ✅ Enable

### Token Scopes

**If using custom tokens (not recommended):**
- Ensure token has `workflow` scope
- Ensure token has `repo` scope (for PR checks)

**Recommended:** Use default `GITHUB_TOKEN` (automatically provided by GitHub Actions)

---

## 3. Required Status Checks

### Status Check Names

The following status checks must be configured in branch protection:

1. **`layout-grammar-guardrail`**
   - Workflow: `.github/workflows/layout-grammar-guardrail.yml`
   - Job: `check-layout-grammar`
   - Purpose: Enforces no scroll/truncation/clipping policy

2. **`dependency-guardrail`**
   - Workflow: `.github/workflows/dependency-guardrail.yml`
   - Job: `check-dependencies`
   - Purpose: Enforces approved stack policy

3. **`build`**
   - Workflow: Default Next.js build (or custom workflow)
   - Purpose: Ensures code compiles and type-checks

### Verification

To verify status checks are working:
1. Create a test PR with an intentional violation
2. Confirm CI fails
3. Confirm PR cannot be merged until fixed

---

## 4. PR Template

**Location:** `.github/pull_request_template.md`

**Purpose:** Forces compliance reporting in every PR

**Required Fields:**
- What changed
- Which tracker tasks were updated
- Which docs were updated
- CI status checks (paste)
- "No scroll / no truncation" confirmation
- Commit hash
- Signature line

**Usage:** Automatically populated when creating a PR via GitHub UI.

---

## 5. CODEOWNERS

**Location:** `.github/CODEOWNERS`

**Purpose:** Forces review on policy surfaces

**Protected Files:**
- `LAYOUT_GRAMMAR_PROGRESS_TRACKER.md`
- `docs/design/*`
- `scripts/check-*.ts`
- `.github/workflows/*`

**Owner:** `@moldovancsaba` (Sultan)

**Result:** PRs touching policy files require Sultan's approval.

---

## 6. Monitoring

### Daily Monitoring

**What to check:**
1. Are there any open PRs?
2. Are PRs mergeable? (all checks passing)
3. Are PRs using the template?
4. Are policy files being changed? (should require review)

### Weekly Monitoring

**What to check:**
1. Are guardrails catching violations?
2. Are there any bypassed checks?
3. Are CODEOWNERS reviews happening?

### Monthly Monitoring

**What to check:**
1. Review branch protection rule effectiveness
2. Review workflow permissions
3. Review CODEOWNERS coverage

---

## 7. Troubleshooting

### CI Checks Not Appearing

**Problem:** Status checks don't show up in branch protection settings

**Solution:**
1. Ensure workflows are in `.github/workflows/` directory
2. Ensure workflows run on `pull_request` event
3. Push a commit that triggers the workflow
4. Wait for workflow to run at least once
5. Check branch protection settings again

### Workflow Permissions Denied

**Problem:** Workflows fail with permission errors

**Solution:**
1. Check repository Actions settings
2. Ensure "Workflow permissions" is set correctly
3. If using custom token, verify scopes
4. Consider using default `GITHUB_TOKEN`

### CODEOWNERS Not Working

**Problem:** PRs don't require review from CODEOWNERS

**Solution:**
1. Verify `.github/CODEOWNERS` file exists
2. Verify syntax is correct
3. Verify owner username is correct
4. Ensure CODEOWNERS is in default branch (`main`)

---

## 8. Setup Checklist

- [ ] Branch protection rules configured for `main`
- [ ] Required status checks added:
  - [ ] `layout-grammar-guardrail`
  - [ ] `dependency-guardrail`
  - [ ] `build`
- [ ] GitHub Actions permissions configured
- [ ] PR template created (`.github/pull_request_template.md`)
- [ ] CODEOWNERS file created (`.github/CODEOWNERS`)
- [ ] Test PR created to verify all checks work
- [ ] Documentation updated

---

**Last Updated:** 2025-01-XX  
**Updated By:** Sultan  
**Next Review:** After initial setup verification

