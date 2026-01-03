# Agentic Coordination System

**Version:** 1.0.0  
**Created:** 2026-01-02  
**Status:** Active  
**Purpose:** Shared, versioned, structured memory for multi-agent coordination

---

## What This Is

This directory is the **canonical coordination substrate** for all agents working on MessMass. It provides:

- **Concurrent access** - Multiple agents can write without overwriting
- **Append-only by default** - No silent loss of context
- **Auditability** - Who changed what, when, and why
- **Structured memory** - Tasks, status, investigations, decisions
- **Tool-agnostic** - Works for humans, LLMs, CI, scripts
- **Boring and reliable** - No cleverness required

**This is not chat. This is not Google Docs. This is Git as a knowledge ledger.**

---

## Directory Structure

```
/agentic/
  README.md                 # This file - system overview and rules

  /charters/
    chappie.md              # Architect charter (immutable)
    tribeca.md              # Execution agent charter
    sultan.md               # Product owner charter

  /operating-rules/
    delivery-loop.md        # Sultan delivery loop (locked)
    execution-playbook.md   # Investigate → Fix → Verify → Document → Report
    decision-principles.md  # Present / Future / Past rules

  /tasks/
    2026-01-P0-security.md
    2026-01-layout-grammar.md
    2026-01-report-charts.md

  /investigations/
    P0-material-icons.md
    P0-report-charts.md

  /status/
    daily-log.md            # append-only, date-stamped entries
    blockers.md             # current blockers only
    next-actions.md         # what happens next, nothing else

  /decisions/
    ADR-001-layout-grammar.md
    ADR-002-csp-policy.md
```

---

## Rules of Use

### Rule 1 — Ownership

Each document has a clear owner:

- **Tribeca** updates `/tasks`, `/investigations`, `/status`
- **Chappie** updates `/charters`, `/operating-rules`, `/decisions`
- **Sultan** updates `/status/next-actions.md` (priorities only)

**No one edits someone else's charter.**

### Rule 2 — Append-Only Where Possible

- Status logs are append-only
- Investigations are never rewritten, only closed
- Decisions are immutable once accepted

**If something changes → new entry, not rewrite.**

### Rule 3 — PR = Synchronization

All updates go through PRs. PRs are not for debate — they are state transitions.

This provides:
- Conflict resolution
- History
- Auditability
- Deterministic merge order

### Rule 4 — No Overwriting

- Never delete context
- Never rewrite history
- If something is wrong, append a correction
- Use Git history for "what was"

---

## Agent Roles

### Chappie — Architect / CTO / Delegator
- **Owns:** `/charters/`, `/operating-rules/`, `/decisions/`
- **Responsibility:** System design, architectural decisions, delegation
- **Cannot:** Execute code changes directly

### Tribeca — Execution Agent
- **Owns:** `/tasks/`, `/investigations/`, `/status/`
- **Responsibility:** Investigate → Fix → Verify → Document → Report
- **Cannot:** Make architectural decisions

### Sultan — Product Owner / Business Sponsor
- **Owns:** `/status/next-actions.md`
- **Responsibility:** Priorities, business decisions, approval
- **Cannot:** Execute technical work

**No role overlap. No role drift.**

---

## How to Use This System

### Starting Work

1. Read `/agentic/README.md` (this file)
2. Read your charter in `/charters/`
3. Read `/operating-rules/execution-playbook.md`
4. Check `/status/next-actions.md` for priorities
5. Check `/status/blockers.md` for current blockers

### During Work

1. Create investigation in `/investigations/` if needed
2. Update task status in `/tasks/`
3. Append to `/status/daily-log.md` with progress
4. Document decisions in `/decisions/` if architectural

### Completing Work

1. Update task status to complete
2. Append completion note to `/status/daily-log.md`
3. Update relevant tracker (e.g., `AUDIT_REMEDIATION_STATUS.md`)
4. Create PR with all changes
5. Report completion to Sultan

---

## Why This Works

### Git Solves Coordination

- **Deterministic ordering** - Commits have timestamps
- **Conflict resolution** - Merge conflicts are explicit
- **History** - Full audit trail
- **Enforcement** - CI can validate structure
- **Offline** - Works without internet
- **Automation** - Scripts can read/write

### Structure Prevents Chaos

- **Ownership** prevents overwriting
- **Append-only** prevents context loss
- **Purpose-specific** documents prevent sprawl
- **PR workflow** provides synchronization point

### This Is Not New

This pattern is used by:
- Finance systems (regulatory compliance)
- Infrastructure teams (change management)
- Safety-critical software (audit requirements)
- Large open-source projects (coordination at scale)

---

## What This Is NOT

- ❌ **Not chat** - Chat loses context, reorders meaning, has no enforcement
- ❌ **Not Google Docs** - No deterministic ordering, no automation, no CI hooks
- ❌ **Not parallel ad-hoc docs** - Will collapse under scale
- ❌ **Not a secretary agent** - Git already is that secretary

---

## Getting Started

**Minimal viable structure (now):**
- ✅ `agentic/README.md` (this file)
- ✅ `agentic/operating-rules/execution-playbook.md`
- ✅ `agentic/operating-rules/delivery-loop.md`

**Everything else grows naturally as needed.**

---

## Questions?

- **"Where do I put X?"** → Check ownership rules above
- **"Can I edit Y?"** → Check if you own it
- **"What's the status?"** → Check `/status/`
- **"What's next?"** → Check `/status/next-actions.md`

---

**Last Updated:** 2026-01-02  
**Maintained By:** All agents (via Git)  
**Version Control:** Git (this is the point)

