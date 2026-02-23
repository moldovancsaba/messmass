# Audit: Developer Conduct Codification & Build/Doc Audit

Status: Active  
Last Updated: 2026-02-21  
Canonical: No (audit report)  
Owner: Product

## Summary

This audit codifies the Product Owner mandate (Developer Conduct), adds it to the docs index and README, fixes the only blocking lint **errors**, and records the current state of build, lint warnings, dependencies, and documentation alignment. The goal is a warning-free, error-free, deprecated-free build with minimal dependencies per [DEVELOPER-CONDUCT.md](../DEVELOPER-CONDUCT.md).

---

## 1. Mandate Codification (Done)

| Item | Status |
|------|--------|
| [docs/DEVELOPER-CONDUCT.md](../DEVELOPER-CONDUCT.md) created | Done |
| Linked from [docs/index.md](../index.md) under Core Resources | Done |
| Linked from [README.md](../../README.md) Documentation Index table | Done |

Content covers: AI developer conduct, documentation = code, memory/context refresh, stack & dependency discipline, build quality. References documentation-governance, coding-standards, architecture, execution-playbook.

---

## 2. Build

| Check | Result |
|-------|--------|
| `npm run build` | Passes (exit 0) |
| TypeScript | Valid |
| Static generation | 105 pages generated |

Build is **error-free**. Lint is not run during `next build` (Next.js skips it by default).

---

## 3. Lint

| Item | Before | After |
|------|--------|--------|
| **Errors** | 3 (inline styles in `app/admin/login/page.tsx`) | **0** (fixed via `app/admin/login/page.module.css`) |
| **Warnings** | Many | Unchanged (see below) |

**Fix applied:** Replaced inline styles on the admin login page (SSO block, button, microcopy) with a new CSS module `app/admin/login/page.module.css` and class names.

**Remaining warnings (for future cleanup):**

- **no-console:** Many files still use `console.log` / `console.warn` / `console.error`. Per coding-standards, these should be replaced with the project logger (`lib/logger.ts`) or removed in production paths.
- **react-hooks/exhaustive-deps:** One occurrence in `app/admin/clicker-manager/page.tsx` (useEffect missing dependencies).
- **next lint deprecated:** The message *"`next lint` is deprecated and will be removed in Next.js 16"* indicates a future migration to ESLint CLI: `npx @next/codemod@canary next-lint-to-eslint-cli .`

**Recommendation:** Tackle warnings in a dedicated pass: (1) Replace console with logger where appropriate, (2) Fix or document the hook deps, (3) Plan migration off `next lint` before Next 16.

---

## 4. Dependencies

**npm outdated (sample):** Many packages have newer versions available. None are marked deprecated in the registry. Current stack is LTS-aligned (Next 15, React 18, Node 24). Major upgrades (e.g. React 19, Next 16, ESLint 10) should be approved by the Product Owner and done in a controlled change.

**npm audit (moderate+):**

- **ajv** (moderate, ReDoS): Fix available via `npm audit fix` (transitive).
- **expr-eval** (high, prototype pollution / unrestricted functions): **No fix available.** Direct dependency; used for formula evaluation. Mitigation: ensure formula inputs are controlled (admin-only chart config); consider replacing with a safer expression evaluator in a future change.
- **fast-xml-parser** (critical, transitive via @aws-sdk/*): Fix available via `npm audit fix`. If the project does not use AWS SES (nodemailer may use it for SMTP), consider pruning or updating transitive deps.

**Recommendation:** Run `npm audit fix` (and review diff); document expr-eval risk and mitigation in security docs; re-run audit after any dependency change.

---

## 5. Documentation vs Code

- **Version:** `package.json` → `11.58.0`; README and docs that display version are aligned.
- **DEVELOPER-CONDUCT:** New file matches current Product Owner mandate; linked from index and README.
- **Doc governance:** [documentation-governance.md](../documentation-governance.md) and [docs/index.md](../index.md) reflect the canonical doc layout and Core Resources.

No TBD or placeholder content was introduced. Full doc vs code alignment (e.g. every feature doc vs implementation) is out of scope for this audit; it should be done as part of regular maintenance per DEVELOPER-CONDUCT.

---

## 6. Checklist vs DEVELOPER-CONDUCT

| Requirement | Status |
|-------------|--------|
| Error-free build | Yes |
| Warning-free build | No (lint warnings remain; build itself does not run lint) |
| Deprecated-free | Next lint is deprecated; no deprecated packages in package.json |
| Minimal dependency | No new dependencies added; audit highlights existing risks |
| Documentation updated | Yes (DEVELOPER-CONDUCT, index, README, this audit) |

---

## 7. Files Touched

- **Added:** `docs/DEVELOPER-CONDUCT.md`, `docs/audits/audit-developer-conduct-and-build-2026-02-21.md`, `app/admin/login/page.module.css`
- **Modified:** `docs/index.md`, `README.md`, `app/admin/login/page.tsx`

---

## 8. Next Steps (Recommendations)

1. **Lint warnings:** Schedule a pass to replace console with logger and fix the one react-hooks warning.
2. **next lint:** Before Next 16, run the codemod to migrate to ESLint CLI.
3. **Security:** Run `npm audit fix`; document expr-eval usage and mitigation; consider replacing expr-eval long-term.
4. **Ongoing:** Per DEVELOPER-CONDUCT, every code/logic change must trigger an immediate documentation review and update.
