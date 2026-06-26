# Messmass <> Fanmass Integration Delivery Plan

Date: 2026-06-25

Canonical issue standard: https://github.com/sovereignsquad/general-design-system/issues/81

## Scope

Connect Messmass events, organizations, partners, and report analytics to Fanmass image intelligence. Fanmass analyzes event images for people, brand, merchandise, and reach signals, then returns normalized analytics to Messmass without overwriting existing clicker/manual metrics.

## Repositories And Boards

- Messmass repo: https://github.com/moldovancsaba/messmass
- Messmass board: https://github.com/users/moldovancsaba/projects/8
- Fanmass repo: https://github.com/moldovancsaba/fanmass
- Fanmass board: https://github.com/users/moldovancsaba/projects/27

## Execution Order

1. https://github.com/moldovancsaba/messmass/issues/78 - MF-101 Messmass event context API for Fanmass
2. https://github.com/moldovancsaba/fanmass/issues/48 - MF-102 Fanmass external batch link contract for Messmass events
3. https://github.com/moldovancsaba/messmass/issues/79 - MF-103 Messmass Fanmass link registry and sync state
4. https://github.com/moldovancsaba/fanmass/issues/49 - MF-104 Fanmass Messmass context importer and taxonomy seed
5. https://github.com/moldovancsaba/fanmass/issues/50 - MF-105 Fanmass image intake and analysis orchestration for Messmass-linked batches
6. https://github.com/moldovancsaba/fanmass/issues/51 - MF-106 Fanmass normalized analytics export for Messmass reports
7. https://github.com/moldovancsaba/messmass/issues/80 - MF-107 Messmass Fanmass analytics ingestion and stats namespace
8. https://github.com/moldovancsaba/messmass/issues/81 - MF-108 Messmass report variables and analytics mapping for Fanmass metrics
9. https://github.com/moldovancsaba/fanmass/issues/52 - MF-110 Fanmass integration callbacks and operational status for Messmass sync
10. https://github.com/moldovancsaba/messmass/issues/82 - MF-109 Messmass GDS admin UX for Fanmass sync controls and states
11. https://github.com/moldovancsaba/messmass/issues/83 - MF-111 Messmass cross-project release gate for Fanmass integration MVP
12. https://github.com/moldovancsaba/fanmass/issues/53 - MF-112 Fanmass cross-project release gate for Messmass integration MVP

## Board State

- Initial sequencing is preserved above for historical traceability.
- MF-101 through MF-112 have been delivered and the corresponding GitHub issues were closed.
- Future Messmass <> Fanmass work should create new follow-up issues instead of reopening this initial MVP sequence.
- Both project board readmes should continue to reference this delivery pack as the MVP baseline, not as the current Todo queue.

## Implemented Messmass Runtime Surface

Environment:

```bash
FANMASS_BASE_URL=http://127.0.0.1:8787
FANMASS_API_KEY=shared-fanmass-api-key
FANMASS_INTEGRATION_TOKEN=shared-messmass-fanmass-token
```

Routes:

- `GET /api/integrations/fanmass/events/{eventId}/context`
- `GET /api/integrations/fanmass/events/{eventId}/link`
- `POST /api/integrations/fanmass/events/{eventId}/link`
- `GET /api/integrations/fanmass/events/{eventId}/sync`
- `POST /api/integrations/fanmass/events/{eventId}/sync`
- `POST /api/integrations/fanmass/callbacks`

Persistence:

- `fanmass_event_links` collection stores `eventId`, `fanmassBatchId`, status, retry/error state, sync snapshots, and audit entries.
- `projects.stats.fanmass` stores canonical Fanmass analytics. Existing clicker/manual stats are not overwritten.
- `projects.stats.fanmass*` flat mirrors expose report-friendly variables, including `fanmassPeopleCount`, `fanmassProjectedReach`, `fanmassImageCount`, `fanmassTopBrandName`, `fanmassTopBrandCount`, `fanmassTopClubName`, and sync metadata.
- The Events admin action rail exposes `Fanmass Sync`, backed by `GET|POST /api/admin/fanmass/events/{eventId}`. This route requires an authenticated admin session and executes link, dry-run, and sync actions server-side.
- Report formulas support nested Fanmass tokens such as `[fanmass.peopleCount]` and `[fanmass.brands]` plus the flat mirrors above.

Contracts:

- Event context: `messmass.fanmass.event-context.v1`
- Fanmass analytics summary: `fanmass.messmass.analytics-summary.v1`

## Architecture Direction

- Messmass remains the source of truth for organizations, partners, events, report templates, and report consumption.
- Fanmass remains the source of truth for image intake, image analysis, people research, brand/entity extraction, and normalized analysis export.
- Fanmass must consume Messmass through versioned APIs, not direct Messmass database access.
- Messmass must ingest Fanmass analytics into a canonical `fanmass` stats namespace and may mirror selected primitives into `fanmass*` flat report variables.
- Existing clicker/manual stats must not be overwritten.
- UI/frontend work must exclusively use https://github.com/sovereignsquad/general-design-system.
- Accessibility, mobile portrait action visibility, tests, observability, rollback, and documentation are release blockers.

## Verification Evidence - 2026-06-26

Messmass:

- `npm test -- --runInBand tests/fanmass-report-variables.test.ts --forceExit`
- `npm run test:fanmass`
- `npm run type-check`
- `npm run lint`
- `npm run build`

Fanmass:

- `.venv/bin/python scripts/smoke_messmass_integration.py`
- `.venv/bin/python -m py_compile app.py config.py services/messmass_integration.py services/database.py`
- `cd frontend && npm run build`

Known local-test note:

- Running the focused Jest test without `--forceExit` passes assertions but leaves a MongoDB connection open because importing `lib/fanmassIntegration.ts` imports the shared MongoDB module. Use the forced focused test command above unless the Mongo client lifecycle is mocked in the test.

## Continuation Checklist

- Start implementation verification with MF-101 and MF-102, then execute the rest of the chain in order.
- Keep contract versions explicit in every API and payload.
- Update this document if endpoint paths, schema names, or ordering change.
- Link every PR back to its issue.
- Do not merge release gates until E2E evidence exists in both repos.
