# Agent Coordination & Communication Protocol

**Version:** 1.0.0  
**Created:** 2025-01-XX  
**Last Updated:** 2025-01-XX  
**Status:** Active

---

## Agent Identities

### Cursora
- **Identity:** Primary AI Developer (Cursor-based agent)
- **Responsibilities:** Code implementation, technical execution, security hardening
- **Signature:** All commits and documentation signed as "Cursora"

### Chappie
- **Identity:** Secondary AI Developer (ChatGPT-based agent)
- **Responsibilities:** Planning, documentation, coordination, design system work
- **Signature:** All commits and documentation signed as "Chappie"

### Sultan
- **Identity:** Product Owner / Project Lead
- **Responsibilities:** Final decisions, requirements, approvals
- **Signature:** All requirements and approvals from "Sultan"

---

## Communication Protocol

### Documentation as Source of Truth

**All agents must:**
1. **Read progress tracker first** before starting any work
2. **Update progress tracker** after completing tasks
3. **Sign all commits** with agent name (Cursora or Chappie)
4. **Use documentation** for notes, reminders, and communication
5. **Check for existing work** before starting new tasks

### Progress Tracker Usage

**Location:** `LAYOUT_GRAMMAR_PROGRESS_TRACKER.md`

**Before starting work:**
1. Read the entire progress tracker
2. Check current phase and task status
3. Review completed tasks and notes
4. Check for blockers or issues
5. Verify dependencies are met

**After completing work:**
1. Update task checkboxes `[ ]` → `[x]`
2. Update status indicators
3. Add commit reference
4. Add notes if needed
5. Update overall progress percentage

### Document Signing

**All documentation must be signed:**

```markdown
**Completed By:** Cursora  
**Reviewed By:** Chappie (if applicable)  
**Approved By:** Sultan (if applicable)  
**Date:** YYYY-MM-DD
```

**Commit messages must include agent name:**

```
feat(phase0): Task description - Cursora

or

docs: Update documentation - Chappie
```

---

## Coordination Rules

### 1. Conflict Prevention

- **Check progress tracker** before making changes
- **Read recent commits** to understand current state
- **Check for in-progress tasks** before starting new work
- **Communicate via documentation** if clarification needed

### 2. Task Handoff

When handing off work between agents:

1. **Update progress tracker** with current status
2. **Add detailed notes** about what was done
3. **Document any blockers** or issues
4. **Note any decisions made**
5. **Include commit references**

### 3. Documentation Updates

**When to update documentation:**
- After completing a task
- When making architectural decisions
- When encountering issues or blockers
- When requirements change
- When dependencies change

**Where to document:**
- Progress tracker (task status, notes)
- Implementation plan (detailed changes)
- Design system plan (design decisions)
- LEARNINGS.md (lessons learned)
- RELEASE_NOTES.md (user-facing changes)

---

## Current Work Status

**Check `LAYOUT_GRAMMAR_PROGRESS_TRACKER.md` for:**
- Current phase and task
- Completed tasks
- In-progress tasks
- Blockers
- Decisions made
- Next steps

---

## Agent Responsibilities

### Cursora (Primary Developer)
- Code implementation
- Security hardening
- Testing infrastructure
- CI/CD setup
- Type safety
- Performance optimization

### Chappie (Secondary Developer)
- Documentation
- Design system planning
- Progress tracking
- Coordination
- Requirements analysis
- User-facing documentation

### Sultan (Product Owner)
- Final decisions
- Requirements definition
- Approvals
- Priority setting
- Timeline management

---

## Communication Channels

### Primary: Progress Tracker
- **File:** `LAYOUT_GRAMMAR_PROGRESS_TRACKER.md`
- **Purpose:** Task status, progress, notes, blockers
- **Update Frequency:** After each task completion

### Secondary: Implementation Plan
- **File:** `LAYOUT_GRAMMAR_IMPLEMENTATION_PLAN.md`
- **Purpose:** Detailed task descriptions, acceptance criteria
- **Update Frequency:** When tasks change or new tasks added

### Tertiary: Design System Plan
- **File:** `DESIGN_SYSTEM_PLAN.md` or `UNIFIED_DESIGN_SYSTEM_MASTER_PLAN.md`
- **Purpose:** Design decisions, policy enforcement
- **Update Frequency:** When design decisions are made

### Notes & Reminders
- **File:** `LEARNINGS.md`
- **Purpose:** Lessons learned, gotchas, important notes
- **Update Frequency:** When lessons are learned

---

## Best Practices

### Before Starting Work
1. ✅ Read progress tracker
2. ✅ Check recent commits
3. ✅ Verify dependencies
4. ✅ Understand requirements
5. ✅ Check for blockers

### During Work
1. ✅ Follow coding standards
2. ✅ Maintain security requirements
3. ✅ Update progress as you go
4. ✅ Document decisions
5. ✅ Test thoroughly

### After Completing Work
1. ✅ Update progress tracker
2. ✅ Sign commits with agent name
3. ✅ Update documentation
4. ✅ Add notes if needed
5. ✅ Verify build passes

---

## Sign-Off Protocol

**All completed tasks must include:**

```markdown
**Completed By:** [Cursora|Chappie]
**Date:** YYYY-MM-DD
**Commit:** [commit hash]
**Notes:** [any important notes]
```

**All documentation must include:**

```markdown
**Last Updated:** YYYY-MM-DD
**Updated By:** [Cursora|Chappie]
**Reviewed By:** [other agent if applicable]
**Approved By:** Sultan (if applicable)
```

---

**Document Maintained By:** Cursora & Chappie  
**Last Updated:** 2025-01-XX  
**Next Review:** As needed

