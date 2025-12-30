# Fix Token and Push - Step by Step

**Current Issue:** Token in remote URL doesn't have `workflow` scope

---

## Step 1: Create New Token with Workflow Scope

1. Go to: https://github.com/settings/tokens/new
2. **Note:** `messmass-workflow-push`
3. **Expiration:** 90 days (or no expiration)
4. **Scopes:** Check:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `workflow` (Update GitHub Action workflows)
5. Click **"Generate token"**
6. **Copy the token immediately** (starts with `ghp_`)

---

## Step 2: Update Remote URL with New Token

**Option A: Update via command (replace TOKEN with your new token):**
```bash
git remote set-url origin https://TOKEN@github.com/moldovancsaba/messmass.git
```

**Option B: Update manually:**
1. Edit `.git/config` in your repo
2. Find `[remote "origin"]`
3. Update `url` line with new token:
   ```
   url = https://YOUR_NEW_TOKEN@github.com/moldovancsaba/messmass.git
   ```

---

## Step 3: Also Check Repository Rules

The error also mentions "4 of 4 required status checks are expected."

**Check Repository Rules:**
1. Go to: https://github.com/moldovancsaba/messmass/settings/rules
2. Look for rules that require status checks
3. Temporarily disable them for this test branch
4. Or add exception for `test/*` branches

---

## Step 4: Push

After updating token and checking rules:
```bash
git push origin test/ci-guardrail-test
```

---

## Alternative: Use GitHub CLI

If GitHub CLI has workflow scope:
```bash
gh auth refresh --scopes workflow
git push origin test/ci-guardrail-test
```

---

**Created By:** Cursora  
**Status:** Action required - create token and update remote

