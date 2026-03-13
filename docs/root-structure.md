# Root Structure
Status: Active
Last Updated: 2026-03-07T00:00:00.000Z
Canonical: Yes
Owner: Engineering

## Purpose

Define the canonical top-level repository structure for `{messmass}` so the project root stays aligned with runtime, build, test, deployment, and documentation needs.

## Root-Level Rule

Only keep files or directories at the project root when they are required for one of these categories:

- application runtime or framework bootstrapping
- package management and dependency locking
- TypeScript, lint, test, or deployment configuration
- canonical documentation entrypoints
- primary source directories

Everything else should be:

- moved under the proper source directory (`scripts/`, `docs/`, `tests/`, `public/`)
- generated on demand and gitignored
- kept local-only and not tracked

## Canonical Root Files

These root files are expected and valid:

- `README.md`
- `READMEDEV.md` when intentionally kept local-only and untracked
- `.gitignore`
- `.env.example`
- `.npmrc`
- `.nvmrc`
- `.eslintignore`
- `.eslintrc.js`
- `.stylelintrc.json`
- `next.config.js`
- `next-env.d.ts`
- `middleware.ts`
- `tsconfig.json`
- `jest.config.js`
- `jest.setup.js`
- `package.json`
- `package-lock.json`
- `vercel.json`

## Canonical Root Directories

These top-level directories are valid:

- `app/`
- `components/`
- `contexts/`
- `docs/`
- `hooks/`
- `lib/`
- `public/`
- `scripts/`
- `server/`
- `tests/`
- `.github/`

## Local-Only / Generated Root Artifacts

These must not be tracked at root:

- `.ai-plan.json`
- `.dev-pid`
- `kyc-audit-report.json`
- `package-lock`
- one-off root debug scripts such as `test-partner-emoji-visibility.js`
- one-off root debug scripts such as `test-title-overflow-fix.js`
- stray static entrypoints like root `index.html` in this Next.js app
- duplicate or alternate framework configs such as root `config.js` when the real config already lives elsewhere

## Audit Decisions (2026-03-07)

- Removed root `config.js` because the active app config is `next.config.js`, while script config already lives in `scripts/config.js`.
- Removed root `index.html` because this is a Next.js application and the file was a stray static hello-world artifact with inline styles.
- Removed root `package-lock` because `package-lock.json` is the only canonical npm lockfile.
- Removed root `kyc-audit-report.json` because it is generated output from `scripts/audit-kyc-data-completeness.ts`.
- Removed root debug scripts `test-partner-emoji-visibility.js` and `test-title-overflow-fix.js` because they were one-off manual verification scripts, not part of the shared test runner.
- Ignored `.ai-plan.json` and `.dev-pid` as local process state.

## Validation Impact

This structure change must preserve:

- `npm run build`
- `npm run type-check`
- `npm run lint`
- `npm run version:verify`

If a root cleanup changes any of those, the cleanup is incomplete.
