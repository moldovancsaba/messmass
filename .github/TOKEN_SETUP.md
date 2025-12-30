# GitHub Token Setup for Workflow Scope

**Issue:** Push blocked because token needs `workflow` scope  
**Solution:** Configure git to use a token with `workflow` scope

---

## Your Available Tokens

✅ **warp.dev** - Has `workflow` scope (last used 7 months ago)  
✅ **Kiro** - Has `workflow` scope (but EXPIRED on Dec 25, 2025)  
❌ **doneisbetter-dev** - No `workflow` scope  
❌ **fanfie-deploy** - Has `workflow` scope (but might not have repo write)  
❌ **Prototype-PAT** - No `workflow` scope

---

## Solution Options

### Option 1: Use Existing 'warp.dev' Token

**Steps:**
1. Copy the `warp.dev` token value (from GitHub settings)
2. Update git credential:
   ```bash
   git config --global credential.helper store
   ```
3. When pushing, use token as password:
   ```bash
   git push origin test/ci-guardrail-test
   # Username: your-github-username
   # Password: [paste warp.dev token]
   ```

### Option 2: Create New Token with Workflow Scope

**Steps:**
1. Go to: https://github.com/settings/tokens/new
2. **Note:** `messmass-workflow-token`
3. **Expiration:** 90 days (or no expiration)
4. **Scopes:** Check:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `workflow` (Update GitHub Action workflows)
5. Click "Generate token"
6. Copy token immediately (you won't see it again)
7. Use it for git push:
   ```bash
   git push origin test/ci-guardrail-test
   # Username: your-github-username
   # Password: [paste new token]
   ```

### Option 3: Use GitHub CLI (if installed)

**Steps:**
1. Install GitHub CLI: `brew install gh` (if not installed)
2. Authenticate: `gh auth login`
3. Select: GitHub.com → HTTPS → Login with web browser
4. Grant permissions (including workflow)
5. Push: `git push origin test/ci-guardrail-test`

---

## Quick Test

After configuring token, test with:
```bash
git push origin test/ci-guardrail-test
```

**Expected:**
- ✅ If token has `workflow` scope: Push succeeds
- ❌ If token missing `workflow` scope: Still blocked

---

## Recommended Approach

**Use Option 2 (Create New Token):**
- Clean, dedicated token for this project
- Full control over scopes
- Can be revoked easily if needed

---

**Created By:** Cursora  
**Status:** Action required - configure token with workflow scope

