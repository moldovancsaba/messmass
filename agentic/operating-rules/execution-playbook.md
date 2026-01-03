# Execution Playbook

**Version:** 1.0.0  
**Created:** 2026-01-02  
**Owner:** Tribeca (Execution Agent)  
**Status:** Active

---

## Mandatory Execution Loop (Non-Negotiable)

**For ALL tasks:**
```
Investigate → Fix → Verify → Document → Report
```

**Rules:**
- No fixing without investigation notes
- No completion without verification evidence
- No PR without tracker update
- No skipping steps

---

## Phase A — Investigation (REQUIRED)

**Before any fix, you MUST investigate.**

### Steps

1. **Identify exact scope**
   - Files, modules, environments affected
   - Whether it is code, config, infra, or data

2. **Classify issue**
   - Code defect
   - Type drift
   - Environment mismatch
   - CSP / security
   - Missing guardrail
   - Documentation gap

3. **Reproduce using Sultan's delivery loop**
   ```bash
   npm install
   npm run build
   npm run dev
   ```

4. **Capture root cause in 3–5 bullets**
   - What failed
   - Why it failed
   - Why it was not caught earlier

### Output

**Investigation note** (paste into PR + tracker):
- Scope identified
- Issue classified
- Root cause captured
- Reproduction steps documented

---

## Phase B — Fix (MINIMAL, CORRECT BOUNDARY)

### Rules

- **Minimal fix at correct boundary**
- **Prefer adapters / normalization**
- **Do NOT widen core types**
- **Do NOT duplicate enums / constants**
- **Do NOT hardcode values**
- **Reuse existing components/utilities**
- **No workflow/CI changes unless explicitly approved**

### Output

**Focused commit(s)** with:
- Minimal changes
- Correct boundary (adapter layer if needed)
- No duplication
- Reused existing code

---

## Phase C — Verification (MANDATORY)

### Local Verification

```bash
npm run build
npm run dev  # Visual smoke test
```

### Preview Verification

- Manual verification on Vercel preview
- Explicitly list:
  - Pages tested
  - Flows tested
  - Edge cases (if applicable)

### Output

**Verification checklist in PR:**
- ✅ Build passes
- ✅ Type check passes
- ✅ Dev server starts
- ✅ Preview tested (list pages/flows)
- ✅ Edge cases handled

---

## Phase D — Documentation (SAME PR)

### Required Updates

1. **Update relevant tracker**
   - Mark checkbox `[x]`
   - Add commit hash
   - Add verification note

2. **Update docs if behavior changed**
   - No history, no storytelling — facts only
   - ISO 8601 timestamps
   - Signed notes

### Output

**Documentation updated in same PR:**
- Tracker updated
- Commit hash recorded
- Verification noted
- Behavior changes documented (if any)

---

## Phase E — Reporting

### Status Message Format

**Single status message with:**
- What was fixed
- What was verified
- What is unblocked
- What remains (if anything)

### Output

**Concise status update:**
- Facts only
- No decision trees
- Clear next action (if any)

---

## Phased Execution Playbook (For Bugs / Features / Audit Items)

### Phase A — Investigation (REQUIRED)

**Output:** Investigation note (goes into PR + tracker)

**3–5 bullets:**
- What failed
- Why it failed
- Why it was not caught earlier

### Phase B — Fix (MINIMAL, CORRECT BOUNDARY)

**Output:** Focused commit(s)

**Rules:**
- Minimal fix at correct boundary
- Prefer adapters / normalization
- Do NOT widen core types
- Do NOT duplicate enums / constants
- Do NOT hardcode values
- Reuse existing components/utilities

### Phase C — Verification (MANDATORY)

**Output:** Verification checklist in PR

**Local:**
- `npm run build`
- `npm run dev` (visual smoke test)

**Preview:**
- Manual verification on Vercel preview
- Explicitly list pages/flows tested

### Phase D — Documentation (SAME PR)

**Output:** Tracker updated

- Mark checkbox `[x]`
- Add commit hash
- Add verification note
- No history, no storytelling — facts only

### Phase E — Reporting

**Output:** Single status message

- What was fixed
- What was verified
- What is unblocked
- What remains (if anything)

---

## Communication Rules

- **No decision trees** - Provide one clear next action
- **No multi-option suggestions** unless explicitly asked
- **No "waiting" language** - If blocked, state what and why
- **All status updates are concise and factual**

---

## Naming & Signature

- **Sign all messages, commits, tracker notes as:** `— Tribeca`

---

## Related Documents

- `/agentic/operating-rules/delivery-loop.md` - Sultan's delivery loop
- `/agentic/charters/tribeca.md` - Tribeca's charter (when created)

---

**Last Updated:** 2026-01-02  
**Maintained By:** Tribeca  
**Version Control:** Git

