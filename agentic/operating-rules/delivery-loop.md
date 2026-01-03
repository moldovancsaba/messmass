# Delivery Loop

**Version:** 1.0.0  
**Created:** 2026-01-02  
**Owner:** Sultan (Product Owner)  
**Status:** Locked (immutable)

---

## Sultan's Delivery Loop (MANDATORY)

**This is the canonical delivery workflow. No exceptions.**

---

## Step 1: Dev/Fix

**Rules:**
- No local DB required
- No uncommitted code allowed (enforce via pre-commit/pre-push + CI)

---

## Step 2: Local Gate (MANDATORY)

**Before any push, you MUST pass:**

```bash
npm install
npm run build    # Must pass
npm run dev      # Smoke test
```

**If any error → fix until clean**

**No exceptions. No "it works on my machine".**

---

## Step 3: Document Every Change

**Rules:**
- Update tracker/docs in the same PR
- No code changes without documentation updates
- All changes must be traceable

---

## Step 4: Push ONLY to Non-Protected Branches

**Allowed:**
- `feat/*`
- `fix/*`
- `phase6/*`
- Any non-protected branch

**Forbidden:**
- `main` (PR-only)
- `phase5/*` (PR-only)
- `release/*` (PR-only)

---

## Step 5: Preview Deploy

**Purpose:**
- Manual testing only
- Vercel checks are NOT required for merge

**Note:** Preview is for validation, not gate-keeping.

---

## Step 6: Merge via PR Only

**Rules:**
- After required GitHub Actions checks pass
- Auto-merge enabled when all checks green
- No direct pushes to protected branches

**Required Status Checks (ALL must pass):**
1. Build - Next.js build succeeds
2. Type Check - TypeScript compilation passes (strict mode)
3. Lint - ESLint passes (no warnings/errors)
4. Layout Grammar Guardrail - No forbidden CSS patterns
5. Dependency Guardrail - No unapproved dependencies
6. Date Placeholder Guardrail - No placeholder dates
7. Layout Grammar Test Suite - All tests pass
8. Phase 6 Validation Test Suite - All validation tests pass

---

## Step 7: Promote to Production

**Rules:**
- Manual Vercel deploy after merge to main
- No automatic production deploys
- Verify production after deploy

---

## Workflow Files Frozen

**Rule:**
- No changes to `.github/workflows/*` unless explicitly approved as "delivery-infra work"
- Current workflow configuration is locked

---

## Branch Protection

**Protected Branches:**
- `main`
- `phase5/*`
- `release/*`

**All required status checks must pass before merge.**

---

## Continuous Audit Policy

**Three-Layer System:**
1. **Hard Fail (CI Guardrails)** - Always blocking
2. **Deterministic Validation Suite (CI tests)** - Blocking once stable
3. **Light Human Audit** - Non-blocking, periodic

**Golden Ratio Principle:**
> "If an audit creates noise, we fix the audit (or narrow scope). We do not ignore failures."

---

## Date Hygiene Guardrail

**CI blocks:**
- Placeholder dates
- Non-ISO date fields

**See:** `scripts/check-date-placeholders.ts` and `.github/workflows/date-placeholder-guardrail.yml`

---

## Delivery Gates (Task-Based, Not Phase-Based)

**Before ANY layout-grammar refactor work (Phase 1+ tasks), the following MUST be complete:**
- Task 0.1 (Secure Markdown Rendering)
- Task 0.2 (Input Validation Framework)
- Task 0.7 (CI Guardrail)
- Task 0.8 (Dependency Guardrail)

**Tasks 0.4–0.6 are foundational quality work and may run in parallel, but MUST be complete before:**
- Phase 2 integration work begins (Task 2.1+), and
- any production cutover to "2.0" behaviour.

**Strict order enforcement (minimum):**
- Guardrails first (0.7, 0.8) → remove violations (1.4) → core engine (1.1, 1.2, 1.3) → integration (2.x)

---

## Communication

**Sultan-Friendly Execution Rule:**
- Sultan will not perform complex technical workflows
- When Sultan must do something (typically GitHub UI actions), agents must provide conversational guidance with one small step at a time
- Avoid long task lists

**Single-Step Delivery:**
- When asking Sultan to act, provide the next single action only
- Wait for confirmation/result, then provide the next step
- If the action is better done by an agent, do not offload it to Sultan

---

## Related Documents

- `/agentic/operating-rules/execution-playbook.md` - Execution agent playbook
- `LAYOUT_GRAMMAR_PROGRESS_TRACKER.md` - Layout Grammar delivery order
- `docs/audits/AUDIT_REMEDIATION_STATUS.md` - Audit remediation delivery loop

---

**Last Updated:** 2026-01-02  
**Maintained By:** Sultan (locked - immutable)  
**Version Control:** Git

