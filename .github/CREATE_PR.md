# Quick PR Creation Guide

**Branch:** `test/workflow-run-1767055782`  
**Purpose:** Trigger workflows so status checks appear

---

## ⚡ Fastest Method: GitHub UI

### Step 1: Create File via GitHub UI

1. Go to: https://github.com/moldovancsaba/messmass
2. Click **"Add file"** → **"Create new file"**
3. Path: `.github/WORKFLOW_TEST.md`
4. Content:
   ```markdown
   # Workflow Test
   Created to trigger initial workflow runs.
   ```
5. **Important:** At the bottom, select **"Create a new branch for this commit and start a pull request"**
6. Branch name: `test/workflow-run-1767055782`
7. Click **"Commit new file"**

### Step 2: Create Pull Request

After committing, GitHub will show:
- **"Create pull request"** button → Click it
- Or go to: https://github.com/moldovancsaba/messmass/pulls

### Step 3: Fill PR Template

The template will auto-populate. Fill:
- **What Changed:** Test file to trigger workflows
- **Tracker Tasks:** None (workflow setup)
- **Docs Updated:** `.github/WORKFLOW_TEST.md`
- **CI Status:** Will populate after workflows run
- **Compliance:** ✅ No violations (test file only)
- **Commit Hash:** `aa3c829`
- **Signed:** — Cursora

### Step 4: Wait for Workflows

- Wait 1-2 minutes
- Check "Checks" tab
- Verify workflows run:
  - ✅ `layout-grammar-guardrail`
  - ✅ `dependency-guardrail`

---

## Direct PR Link (After Creating Branch)

Once branch exists via GitHub UI:
https://github.com/moldovancsaba/messmass/compare/main...test/workflow-run-1767055782

---

## Alternative: Use Existing Local Branch

If you want to use the local branch content:

1. Create branch via GitHub UI (Step 1 above)
2. The file `.github/WORKFLOW_TEST.md` already exists locally
3. You can copy its content when creating the file

---

**Created By:** Cursora  
**Status:** Ready for GitHub UI creation

