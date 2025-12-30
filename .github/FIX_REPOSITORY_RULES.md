# Fix Repository Rules - Status Check Requirement

**Issue:** Push blocked by repository rules requiring "4 of 4 required status checks"

**Location:** Repository Settings → Rules (not Branch Protection)

---

## Step 1: Access Repository Rules

Go to: https://github.com/moldovancsaba/messmass/settings/rules

---

## Step 2: Find Status Check Rule

Look for rules that:
- Require status checks to pass
- Block pushes without status checks
- Have "4 of 4 required status checks" requirement

---

## Step 3: Fix Options

### Option A: Temporarily Disable Rule

1. Find the rule requiring status checks
2. Click "Edit" or disable it temporarily
3. Save changes
4. Push: `git push origin test/ci-guardrail-test`
5. Re-enable rule after PR is created and workflows run

### Option B: Add Exception for Test Branches

1. Edit the rule
2. Add branch name pattern exception: `test/*`
3. Save changes
4. Push: `git push origin test/ci-guardrail-test`

### Option C: Remove Status Check Requirement

1. Edit the rule
2. Remove or uncheck "Require status checks" option
3. Save changes
4. Push: `git push origin test/ci-guardrail-test`

---

## Step 4: Verify Push Works

After fixing repository rules:
```bash
git push origin test/ci-guardrail-test
```

**Expected:** Push succeeds ✅

---

## After Push Succeeds

1. Go to: https://github.com/moldovancsaba/messmass/pulls
2. Create PR from `test/ci-guardrail-test` to `main`
3. Watch workflows run:
   - ❌ Commit 1 (130385d): `layout-grammar-guardrail` should FAIL
   - ✅ Commit 2 (4a5e3e4): `layout-grammar-guardrail` should PASS
4. Status checks will appear in branch protection settings
5. Re-enable repository rules if you disabled them

---

**Created By:** Cursora  
**Status:** Action required - fix repository rules

