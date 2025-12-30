# PR Instructions — Initial Workflow Run

**Created:** 2025-01-XX  
**Purpose:** Trigger GitHub Actions workflows so status checks appear in branch protection settings

---

## ⚠️ Current Situation

Branch protection is already partially configured, which is blocking direct pushes. This is actually good (protection is working!), but creates a chicken-and-egg problem: we need workflows to run so status checks appear, but we can't push because status checks are required.

---

## Solution Options

### Option 1: Create Branch & PR via GitHub UI (Recommended)

**Steps:**
1. Go to: https://github.com/moldovancsaba/messmass
2. Click "Add file" → "Create new file"
3. Name: `docs/WORKFLOW_TEST.md`
4. Content:
   ```markdown
   # Workflow Test
   
   This file is created to trigger initial workflow runs.
   ```
5. Commit directly to a new branch: `test/workflow-initial-run`
6. Click "Create pull request"
7. Fill PR template
8. Wait for workflows to run

**Advantages:**
- ✅ Bypasses branch protection (GitHub UI allows this)
- ✅ No token scope issues
- ✅ Simple and fast

---

### Option 2: Temporarily Disable Branch Protection

**Steps:**
1. Go to: Repository Settings → Branches → Branch protection rules
2. Temporarily disable protection for `main` branch
3. Push the local branch:
   ```bash
   git push -u origin test/workflow-initial-run
   ```
4. Create PR via GitHub UI
5. Wait for workflows to run
6. Re-enable branch protection with the new status checks

**Advantages:**
- ✅ Can use local branch
- ⚠️ Requires temporarily disabling protection

---

### Option 3: Fix Token Permissions

**If using Personal Access Token:**

1. Go to: GitHub Settings → Developer settings → Personal access tokens
2. Edit your token
3. Ensure `workflow` scope is checked
4. Save
5. Try pushing again:
   ```bash
   git push -u origin test/workflow-initial-run
   ```

**Advantages:**
- ✅ Permanent fix
- ⚠️ Still blocked by branch protection rules

---

## Local Branch Status

**Branch:** `test/workflow-initial-run`  
**Commits:**
- `8471217` - docs: Trigger initial workflow run for status checks
- `9a3e6fb` - docs: Add PR instructions for initial workflow run

**Files Changed:**
- `docs/GITHUB_SETUP_CHECKLIST.md` (minor update)
- `docs/PR_INSTRUCTIONS.md` (new file)

---

## After PR is Created

### 1. Wait for Workflows to Run

After creating the PR:
1. Wait 1-2 minutes for workflows to start
2. Check the "Checks" tab on the PR
3. Verify these workflows run:
   - ✅ `layout-grammar-guardrail`
   - ✅ `dependency-guardrail`
   - ✅ `build` (if configured)

### 2. Verify Status Checks Appear

Once workflows complete:
1. Go to: Repository Settings → Branches → Branch protection rules
2. Edit rule for `main` branch
3. Scroll to "Require status checks to pass before merging"
4. Verify these checks appear in the list:
   - `layout-grammar-guardrail`
   - `dependency-guardrail`
   - `build` (if configured)
5. Check the boxes for all checks
6. Save changes

### 3. Update Branch Protection

**Important:** The current branch protection requires a status check called "CI Status Check" which doesn't exist yet. After workflows run:

1. Remove "CI Status Check" requirement (or rename it)
2. Add the actual workflow checks:
   - `layout-grammar-guardrail`
   - `dependency-guardrail`
   - `build`

### 4. After Branch Protection is Configured

Once branch protection is properly configured:
- This PR can be merged (it's just documentation)
- Or it can be closed (workflows have run, status checks are now available)

---

## Expected Results

✅ Both guardrail workflows should run successfully  
✅ Status checks should appear in branch protection settings  
✅ PR should show all checks passing (green)  
✅ Branch protection can be fully configured with correct status checks  

---

## Current Blockers

1. **Branch Protection Active:** Requires status checks that don't exist yet
2. **Token Scope:** Personal Access Token needs `workflow` scope (if using custom token)
3. **Chicken-and-Egg:** Need workflows to run to get status checks, but can't push because status checks are required

**Solution:** Use GitHub UI to create branch/PR (Option 1) or temporarily disable protection (Option 2)

---

**Created By:** Cursora  
**Purpose:** Enable branch protection configuration  
**Status:** ⚠️ Action required - branch protection blocking push
