# Preview Verification Policy

**Version:** 1.0.0  
**Created:** 2026-01-02  
**Owner:** Chappie (Architect)  
**Status:** Active (Effective Immediately)

---

## Core Rule

**No Preview verification = not fixed.**

This applies to all P0 user-facing regressions.

---

## P0 User-Facing Regression Requirements

### Mandatory Evidence

**Every P0 user-facing regression fix MUST include:**
1. **Preview evidence** (screenshot + request status) in PR description
2. **Preview evidence** in tracker entry
3. **Screenshots** showing fix working on Preview

**Without Preview evidence, the fix is incomplete.**

---

## Diagnostic Signal Protocol

### Sultan's Role

**Sultan provides ONE diagnostic signal, not a checklist.**

**Single Action (2 minutes):**
1. Open Vercel Preview report page where issue occurs
2. Open DevTools → Network tab
3. Filter for relevant request (e.g., "chart" or report-data)
4. Click the failing request
5. Provide:
   - **Status code** (e.g., 401/403/500)
   - **Request URL host** (is it your domain? external API? internal /api?)
   - **First line of response body** (error message)

**That's it. One signal. No long verification chores.**

### Execution Agent's Role

**After receiving diagnostic signal:**
1. **Root-cause** based on signal (auth/CORS/env/data-shape/render/CSP)
2. **Apply minimal boundary fix**
3. **Verify on Preview** (screenshots required)
4. **Close tracker item** (do not assign to Sultan)

**Execution agent owns verify+close. Not Sultan.**

---

## What This Prevents

- ❌ Hypotheses marked as fixes
- ❌ "Code complete, verification pending" status
- ❌ Long verification checklists assigned to Sultan
- ❌ Bouncing verification back to Sultan

---

## What This Enables

- ✅ Hard evidence before marking fixed
- ✅ Clear diagnostic signal (one piece of data)
- ✅ Execution agent owns verification
- ✅ Screenshots prove fix works

---

## Examples

### ✅ CORRECT: Hypothesis Applied, Awaiting Signal

```
- **Status:** ⚠️ HYPOTHESIS (not proven fix) / 🔴 AWAITING DIAGNOSTIC SIGNAL
- **Commit:** `abc123` - Enhanced error handling
- **Next Action:** Awaiting Sultan's diagnostic signal (status code, URL host, response)
- **After Signal:** Tribeca will root-cause, fix, verify on Preview, and close
```

### ✅ CORRECT: Fix Proven with Preview Evidence

```
- **Status:** ✅ COMPLETE (verified on Preview)
- **Commit:** `abc123` - Fixed CORS issue
- **Preview Evidence:**
  - Screenshot: [link]
  - Request status: 200 OK
  - Charts visible on /report/test-slug
- **Verification:** Tribeca verified on Preview (2026-01-02T22:00:00+01:00)
```

### ❌ WRONG: Hypothesis Marked as Fix

```
- **Status:** ✅ COMPLETE (code) / ⚠️ PREVIEW VERIFICATION PENDING
- **Commit:** `abc123` - Enhanced error handling
- **Verification:** ⚠️ Preview verification required
```

**This is wrong. Without Preview evidence, it's not fixed.**

---

## Related Documents

- `/agentic/operating-rules/execution-playbook.md` - Execution loop
- `/agentic/operating-rules/delivery-loop.md` - Delivery workflow

---

**Last Updated:** 2026-01-02  
**Maintained By:** Chappie  
**Version Control:** Git

