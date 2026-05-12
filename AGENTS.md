# AGENTS

Use this file as the tracked quick-start for repo-specific agent workflows. For canonical project status and handoff context, start with:

- [`/Users/moldovancsaba/Projects/messmass/docs/PROJECT_MANAGEMENT.md`](/Users/moldovancsaba/Projects/messmass/docs/PROJECT_MANAGEMENT.md)
- [`/Users/moldovancsaba/Projects/messmass/docs/HANDOVER.md`](/Users/moldovancsaba/Projects/messmass/docs/HANDOVER.md)
- [`/Users/moldovancsaba/Projects/messmass/README.md`](/Users/moldovancsaba/Projects/messmass/README.md)

## Local App

- Required Node.js version: `24` (see `.nvmrc`; `package.json` requires `>=24.0.0 <25.0.0`)
- Install: `npm install`
- Run the app: `npm run dev`
- Default local URL: `http://localhost:3001`
- First-run variable seed: `npm run seed:variables`
- Optional realtime server: `cd server && npm start`

## Core Validation

- Test suite: `npm test`
- Type check: `npm run type-check`
- Lint: `npm run lint`
- Production build: `npm run build`
- Version check: `npm run version:verify`
- Design token/style guardrails: `npm run style:check`
- Style audit report: `npm run style:audit`
- If `npm run type-check` fails on missing `.next/types`, run `npm run build` first and rerun the type check.

## Organization Workflow

- Organization admin UI: `/admin/organizations`
- Related partner UI: `/admin/partners`
- Organization report UI: `/organization-report/[id]`
- Organization content editor: `/organization-edit/[id]`

Current organization management behavior verified in code:

- `app/admin/organizations/page.tsx` loads organizations from `/api/admin/organizations`
- Member assignment uses `/api/admin/organizations/[id]/members`
- Both organization admin APIs are superadmin-only
- Membership updates support both legacy collections (`organizations` / `partners`) and V3 models (`V3Organization` / `V3Entity`)
- Shared admin entity contract reference: `docs/admin/admin-entity-system.md` and `lib/adminEntitySystem.ts`

## Organization Diagnostics

- Bootstrap the V3 master organization: `npx tsx scripts/v3/bootstrap-org.ts`
- Verify V3 organization RBAC logic: `npx tsx scripts/v3/test-permissions.ts`
- Verify the V3 middleware checklist: `npx tsx scripts/verify-v3-middleware.ts`

## Report And Data Diagnostics

- Diagnose report-template warnings: `npm run diagnose:reports`
- Variable inventory snapshot/diff: `npm run variables:inventory`
- Data quality audit/fix: `npm run data:audit` / `npm run data:fix`
- Database audit: `npm run audit:database`
- Database backup/restore: `npm run db:backup` / `npm run db:restore -- --backup=<backup-id>`
- Google Sheets integration validation: `npm run test:google-sheets`
- Google Sheets schema check: `npm run check:google-sheets-schema`
- Verify production flag safety: `npm run security:verify-production-flags`

## Notes

- Many data and migration scripts expect `.env.local`; prefer the existing `npm run ...` aliases when available because they already wire `dotenv` consistently.
- If you add a repeated direct `tsx` workflow, prefer promoting it into `package.json` rather than documenting multiple one-off command variants.
