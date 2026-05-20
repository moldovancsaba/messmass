# Developer Conduct & Product Owner Mandate

Status: Active  
Last Updated: 2026-02-21  
Canonical: Yes  
Owner: Product

This document defines the non-negotiable conduct and context rules for the AI developer (and any developer) working on this project. The Product Owner is the authority; the developer delivers with full ownership, accuracy, and accountability.

---

## 1. AI Developer Conduct & Context Management

The developer has full and explicit permission to:

- Search, modify, create, edit, or delete any file, folder, or library in the project.
- Operate with **autonomous execution** — but **never with autonomous assumptions**.

Deliverables must be:

- **Error-free and production-grade**
- **Fully documented, traceable, and maintainable**
- **Secure, future-proof, and dependency-safe**
- **Commented in plain, clear, unambiguous English**

---

## 2. Absolute Mandate – Documentation = Code

Documentation is maintained with the same rigor and rules as code. This is non-negotiable.

**Prohibited:**

- Never use placeholders, filler text, or "TBD".
- Never paste unverified or unrelated content.
- Never delay documentation updates after code or logic changes.

**Required:**

- Every document must reflect the true, current state of the system.
- Every logic, file, or feature update must trigger an immediate documentation review and refresh.
- Code and documentation must always match — line by line where relevant.

**Rule:** *"If it's not documented, it's not done."*

---

## 3. Memory & Context Refresh

Because context is not persistent, the developer must regularly:

1. Re-read all relevant documentation before making changes.
2. Scan the entire codebase when needed, not only cached or random parts.
3. Synchronize the mental model of architecture, logic, flow, and rules.
4. Update documents immediately after any code change.
5. **If anything is not 100% clear, ask the Product Owner. Never assume. Never proceed on uncertainty.**

---

## 4. Stack & Dependency Discipline

The project maintains a **strict, minimal tech stack**. No deviations are allowed without explicit approval.

**Allowed:**

- Only install packages that are explicitly permitted by the Product Owner.
- Use long-term supported (LTS) versions only.
- Dependencies must be security-audited (0 known vulnerabilities where feasible).
- Dependencies must have no post-install warnings.
- Stack must fit the approved architecture: Next.js App Router, Vercel, MongoDB, Tailwind, Mongoose, Socket.io (or as documented in `docs/architecture.md`).

**Prohibited:**

- No deprecated libraries, forks, or abandoned packages.
- No unnecessary utilities, "helper" modules, or redundant code.
- No framework experiments or replacements without approval.

**Rule:** If in doubt, do not install — ask first.

---

## 5. Build & Delivery Quality

All builds must be:

- **Warning-free**
- **Error-free**
- **Deprecated-free**
- **Minimised dependency** (no redundant or unused dependencies)

The developer’s task is not only to make the product run, but to ensure it is **reliable, auditable, and ready for handover** to any professional developer.

---

## References

- [documentation-governance.md](documentation-governance.md) — Canonical docs, deprecation, and metadata rules.
- [coding-standards.md](coding-standards.md) — Code style and documentation expectations.
- [architecture.md](architecture.md) — Platform architecture and approved stack.
- `agentic/operating-rules/execution-playbook.md` — historical reference path only. If that local playbook is absent in the current checkout, follow the canonical repo process docs instead: [documentation-governance.md](documentation-governance.md), [PROJECT_MANAGEMENT.md](PROJECT_MANAGEMENT.md), and [HANDOVER.md](HANDOVER.md).
