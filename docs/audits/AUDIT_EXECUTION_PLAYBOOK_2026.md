# Audit Execution Playbook 2026

**Version:** 1.0.0  
**Created:** 2026-01-03  
**Owner:** Tribeca (Execution Agent)  
**Status:** Active  
**Reference:** `COMPREHENSIVE_SYSTEM_AUDIT_PLAN_2026.md`

---

## Purpose

This playbook provides step-by-step execution guidance for the Comprehensive System Audit 2026. It ensures consistent, thorough, and verifiable audit execution following the mandatory execution loop.

---

## Mandatory Execution Loop (Non-Negotiable)

**For ALL audit tasks:**
```
Investigate → Document → Fix (if needed) → Verify → Report
```

**Rules:**
- No documentation without investigation
- No completion without verification evidence
- No PR without tracker update
- No skipping steps
- All findings must be documented before remediation

---

## Phase A — Investigation (REQUIRED FOR EVERY TASK)

### Step 1: Scope Identification

**Before starting any audit task, identify:**

1. **Files to scan:**
   - List all files/directories in scope
   - Use grep/ripgrep to find patterns
   - Document file count and locations

2. **Patterns to search:**
   - Exact regex patterns
   - CSS property names
   - Variable naming conventions
   - Component usage patterns

3. **Tools to use:**
   - `grep -r` for pattern matching
   - `find` for file discovery
   - Codebase search for semantic analysis
   - ESLint for automated checks

### Step 2: Execute Scan

**Run the audit scan:**

```bash
# Example: Find all overflow violations
grep -r "overflow:\s*\(scroll\|auto\)" app/ components/ \
  --include="*.css" \
  --include="*.module.css" \
  > docs/audits/investigations/P0-layout-grammar-violations-overflow.txt

# Count violations
wc -l docs/audits/investigations/P0-layout-grammar-violations-overflow.txt
```

### Step 3: Classify Findings

**For each finding, classify:**

- **Severity:** P0 (Critical) / P1 (High) / P2 (Medium) / P3 (Low)
- **Type:** 
  - Code violation (hardcoded value, inline style, etc.)
  - Naming inconsistency
  - Documentation gap
  - Missing guardrail
  - Design system violation
- **Impact:**
  - Blocks production? (P0)
  - Affects maintainability? (P1)
  - Code quality issue? (P2)
  - Nice to have? (P3)

### Step 4: Document Findings

**Create investigation document:**

**Location:** `docs/audits/investigations/[TASK-ID]-[SHORT-NAME].md`

**Template:**
```markdown
# [Task ID]: [Task Name] - Investigation Report

**Date:** YYYY-MM-DD  
**Investigator:** Tribeca  
**Task:** [Reference to audit plan task]

## Scope
- Files scanned: [count]
- Patterns searched: [list]
- Tools used: [list]

## Findings Summary
- Total violations: [count]
- P0 (Critical): [count]
- P1 (High): [count]
- P2 (Medium): [count]
- P3 (Low): [count]

## Detailed Findings

### Finding 1: [Title]
- **File:** `path/to/file.tsx:123`
- **Severity:** P0
- **Type:** Code violation
- **Description:** [What was found]
- **Impact:** [Why it matters]
- **Remediation:** [How to fix]

[... repeat for each finding ...]

## Root Cause Analysis
- **What failed:** [Brief description]
- **Why it failed:** [Technical reason]
- **Why not caught:** [Missing guardrail/documentation]

## Recommendations
1. [Priority 1 recommendation]
2. [Priority 2 recommendation]
3. [Priority 3 recommendation]

## Next Steps
- [ ] Create remediation plan
- [ ] Assign owners
- [ ] Set deadlines
```

### Output

**Investigation document** with:
- ✅ Scope clearly defined
- ✅ All findings documented with file paths and line numbers
- ✅ Severity classification
- ✅ Root cause analysis
- ✅ Recommendations

---

## Phase B — Documentation (REQUIRED BEFORE REMEDIATION)

### Step 1: Create Violation Inventory

**For code quality audits, create CSV inventory:**

**Location:** `docs/audits/[TASK-ID]-inventory.csv`

**Columns:**
- `file` - File path
- `line` - Line number
- `severity` - P0/P1/P2/P3
- `type` - Violation type
- `description` - What was found
- `remediation` - How to fix
- `effort` - Estimated hours
- `status` - Open/In Progress/Complete

### Step 2: Update Audit Findings Document

**Location:** `docs/audits/AUDIT_FINDINGS_2026.md`

**Add section for each completed audit task:**

```markdown
## [Task ID]: [Task Name]

**Status:** ✅ Complete  
**Date:** YYYY-MM-DD  
**Investigator:** Tribeca

### Summary
- Total violations found: [count]
- P0: [count]
- P1: [count]
- P2: [count]
- P3: [count]

### Key Findings
1. [Top finding 1]
2. [Top finding 2]
3. [Top finding 3]

### Violation Inventory
See: `docs/audits/[TASK-ID]-inventory.csv`

### Investigation Report
See: `docs/audits/investigations/[TASK-ID]-[SHORT-NAME].md`
```

### Output

**Documentation complete:**
- ✅ Violation inventory (CSV)
- ✅ Investigation report
- ✅ Audit findings updated
- ✅ All findings traceable

---

## Phase C — Remediation Planning (IF VIOLATIONS FOUND)

### Step 1: Prioritize Remediation

**Group violations by priority:**

1. **P0 (Critical) - Immediate Action:**
   - Blocks production
   - Security vulnerabilities
   - Data integrity issues
   - Must fix before next release

2. **P1 (High) - Next Sprint:**
   - Affects maintainability
   - Technical debt
   - User experience issues
   - Fix in current sprint

3. **P2 (Medium) - Backlog:**
   - Code quality improvements
   - Refactoring opportunities
   - Documentation gaps
   - Plan for future sprint

4. **P3 (Low) - Nice to Have:**
   - Minor improvements
   - Code style
   - Non-critical documentation
   - Low priority

### Step 2: Create Remediation Plan

**Location:** `docs/audits/remediation/[TASK-ID]-remediation-plan.md`

**Template:**
```markdown
# [Task ID] Remediation Plan

**Created:** YYYY-MM-DD  
**Status:** Draft/Approved/In Progress/Complete

## Priority Breakdown
- P0: [count] violations - [estimated hours] hours
- P1: [count] violations - [estimated hours] hours
- P2: [count] violations - [estimated hours] hours
- P3: [count] violations - [estimated hours] hours

## Remediation Strategy

### Phase 1: P0 Fixes (Week 1)
- [ ] Fix [violation 1] - [file:line] - [effort]
- [ ] Fix [violation 2] - [file:line] - [effort]

### Phase 2: P1 Fixes (Week 2)
- [ ] Fix [violation 3] - [file:line] - [effort]

### Phase 3: P2 Fixes (Backlog)
- [ ] Fix [violation 4] - [file:line] - [effort]

## Migration Scripts
[If applicable, include migration scripts]

## Testing Strategy
- [ ] Unit tests for fixes
- [ ] Integration tests
- [ ] Visual regression tests
- [ ] Manual verification

## Success Criteria
- [ ] All P0 violations fixed
- [ ] All P1 violations fixed
- [ ] Tests passing
- [ ] Documentation updated
```

### Output

**Remediation plan** with:
- ✅ Prioritized violations
- ✅ Effort estimates
- ✅ Timeline
- ✅ Success criteria

---

## Phase D — Fix (IF REMEDIATION REQUIRED)

### Rules

- **Minimal fix at correct boundary**
- **Prefer adapters / normalization**
- **Do NOT widen core types**
- **Do NOT duplicate enums / constants**
- **Do NOT hardcode values**
- **Reuse existing components/utilities**
- **Follow existing patterns**

### Fix Process

1. **Create feature branch:**
   ```bash
   git checkout -b audit/[TASK-ID]-[SHORT-NAME]
   ```

2. **Apply fixes:**
   - One violation per commit (if possible)
   - Or group related violations
   - Include investigation reference in commit message

3. **Commit message format:**
   ```
   audit: [TASK-ID] Fix [violation type] in [file]
   
   - Fixes: [violation description]
   - File: [path]:[line]
   - Investigation: docs/audits/investigations/[TASK-ID]-[SHORT-NAME].md
   - Severity: P0/P1/P2/P3
   ```

### Output

**Focused commits** with:
- ✅ Minimal changes
- ✅ Correct boundary
- ✅ No duplication
- ✅ Investigation referenced

---

## Phase E — Verification (MANDATORY)

### Local Verification

**Before committing:**

```bash
# Build must pass
npm run build

# Lint must pass
npm run lint

# Type check must pass
npx tsc --noEmit

# Dev server must start
npm run dev  # Visual smoke test
```

### Verification Checklist

**For each fix, verify:**

- [ ] Build passes (`npm run build`)
- [ ] Lint passes (`npm run lint`)
- [ ] Type check passes (`npx tsc --noEmit`)
- [ ] Dev server starts (`npm run dev`)
- [ ] No new violations introduced
- [ ] Existing functionality works
- [ ] Visual regression check (if UI change)

### Preview Verification (For P0 User-Facing Changes)

**If fix affects user-facing functionality:**

- [ ] Deploy to Vercel preview
- [ ] Test affected pages/flows
- [ ] Screenshot evidence included
- [ ] Edge cases tested
- [ ] Performance check (if applicable)

### Output

**Verification evidence:**
- ✅ Build output (success)
- ✅ Lint output (no errors)
- ✅ Type check output (no errors)
- ✅ Preview screenshots (if applicable)
- ✅ Test results (if applicable)

---

## Phase F — Documentation Update (SAME PR)

### Required Updates

1. **Update violation inventory:**
   - Mark fixed violations as "Complete"
   - Add commit hash
   - Add verification note

2. **Update investigation report:**
   - Add remediation section
   - Include commit hashes
   - Document verification

3. **Update audit findings:**
   - Update status
   - Add completion date
   - Include verification evidence

4. **Update tracker (if applicable):**
   - Mark checkbox `[x]`
   - Add commit hash
   - Add verification note

### Output

**Documentation updated:**
- ✅ Violation inventory updated
- ✅ Investigation report updated
- ✅ Audit findings updated
- ✅ Tracker updated (if applicable)
- ✅ Commit hashes recorded

---

## Phase G — Reporting

### Status Message Format

**After completing each task, send status:**

```
PRESENT:
- [Task ID] [Task Name]: ✅ Complete
- Violations found: [count] (P0: [count], P1: [count], P2: [count], P3: [count])
- Fixes applied: [count] (if applicable)
- Verification: ✅ Passed (build/lint/type-check/preview)

FUTURE:
- Next task: [Next Task ID] [Next Task Name]
- Estimated effort: [hours]
- Dependencies: [list]

PAST:
- Investigation: docs/audits/investigations/[TASK-ID]-[SHORT-NAME].md
- Fixes: [commit hashes]
- Verification: [evidence location]
```

### Output

**Status update:**
- ✅ Facts only
- ✅ Clear next action
- ✅ Evidence referenced

---

## Task-Specific Execution Guides

### Layout Grammar Verification Tasks (1.1-1.6)

**Special Instructions:**

1. **Use Layout Grammar spec as reference:**
   - `docs/LAYOUT_GRAMMAR.md`
   - `docs/design/LAYOUT_GRAMMAR_COMPLIANCE.md`

2. **Scan patterns:**
   ```bash
   # No scrolling
   grep -r "overflow:\s*\(scroll\|auto\)" app/ components/ --include="*.css"
   
   # No truncation
   grep -r "text-overflow:\s*ellipsis" app/ components/ --include="*.css"
   grep -r "line-clamp" app/ components/ --include="*.css"
   
   # No clipping
   grep -r "object-fit:\s*cover" app/ components/ --include="*.css"
   ```

3. **Verify implementation:**
   - Check `lib/blockHeightCalculator.ts` for height resolution
   - Check `lib/fontSyncCalculator.ts` for unified typography
   - Check `app/report/[slug]/ReportContent.tsx` for block rendering

### Variable Dictionary & Naming Tasks (2.1-2.3)

**Special Instructions:**

1. **Scan MongoDB collections:**
   - Query `available_fonts` collection
   - Query `kyc_variables` collection
   - Query report templates for variable usage

2. **Scan codebase:**
   ```bash
   # Find stats. prefix violations
   grep -r "stats\." app/ lib/ components/ --include="*.ts" --include="*.tsx"
   
   # Find snake_case violations
   grep -r "_[a-z]" app/ lib/ --include="*.ts" --include="*.tsx"
   ```

3. **Reference existing conventions:**
   - `docs/conventions/NAMING_CONVENTIONS.md` (if exists)
   - `CODING_STANDARDS.md`
   - Existing variable usage patterns

### Code Quality Audit Tasks (3.1-3.4)

**Special Instructions:**

1. **Use automated tools:**
   ```bash
   # Hardcoded colors
   grep -r "#[0-9a-fA-F]\{3,6\}" app/ components/ \
     --include="*.css" --include="*.ts" --include="*.tsx" \
     | grep -v "theme.css" | grep -v "node_modules"
   
   # Hardcoded pixels
   grep -r "[0-9]\+px" app/ components/ --include="*.css" \
     | grep -v "theme.css" | grep -v "/*" | grep -v "*/"
   
   # Inline styles
   grep -r "style={{" app/ components/ --include="*.tsx" --include="*.ts"
   ```

2. **Check design tokens:**
   - Reference `app/styles/theme.css` for available tokens
   - Verify tokens are used correctly
   - Document missing tokens

3. **Verify CSS modules:**
   - Check `app/globals.css` imports
   - Verify no duplicate CSS rules
   - Check cascade order

---

## Daily Execution Checklist

**At start of each day:**

- [ ] Review previous day's progress
- [ ] Check for blockers
- [ ] Update task status
- [ ] Plan day's work (prioritize P0 tasks)

**During execution:**

- [ ] Follow execution loop (Investigate → Document → Fix → Verify → Report)
- [ ] Document all findings immediately
- [ ] Create violation inventory as you find issues
- [ ] Commit frequently with clear messages

**At end of each day:**

- [ ] Update audit findings document
- [ ] Send status update
- [ ] Update tracker (if applicable)
- [ ] Plan next day's work

---

## Weekly Progress Review

**Every Friday:**

1. **Review week's progress:**
   - Tasks completed
   - Violations found
   - Fixes applied
   - Blockers encountered

2. **Update audit plan:**
   - Adjust timelines if needed
   - Reprioritize if needed
   - Update effort estimates

3. **Send weekly summary:**
   - PRESENT: Week's accomplishments
   - FUTURE: Next week's plan
   - PAST: Completed tasks with evidence

---

## Success Criteria

**Audit is complete when:**

- [ ] All 18 tasks completed
- [ ] All violations documented
- [ ] All P0 violations fixed (or remediation plan created)
- [ ] All investigation reports created
- [ ] All violation inventories created
- [ ] Audit findings document complete
- [ ] Executive summary created
- [ ] CI guardrails implemented (Task 8.1)

---

## Troubleshooting

### Issue: Too many violations found

**Solution:**
- Prioritize by severity
- Focus on P0/P1 first
- Create remediation plan for P2/P3
- Don't try to fix everything at once

### Issue: Ambiguous findings

**Solution:**
- Review Layout Grammar spec
- Check existing patterns in codebase
- Consult design system documentation
- Document ambiguity in investigation report

### Issue: Build fails after fixes

**Solution:**
- Revert changes
- Investigate root cause
- Apply minimal fix
- Verify after each change

### Issue: Missing documentation

**Solution:**
- Create placeholder documents
- Document what's missing
- Add to remediation plan
- Prioritize documentation creation

---

**Document Status:** Active  
**Last Updated:** 2026-01-03  
**Next Review:** After Phase 1 completion
