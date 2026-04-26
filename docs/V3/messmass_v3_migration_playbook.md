# {messmass} v3 Migration Playbook

**Status**: Operational (Phase 1 & 2 Complete)
**Last Updated**: 2026-03-13

Purpose: Safely migrate from the legacy {messmass} model (Partner/Event/KYC) to the new Activity Intelligence architecture without breaking existing client data or reports.

------------------------------------------------------------------------

# 1. Migration Principles

1.  **No destructive database changes**: Legacy collections remain operational.
2.  **Parallel Execution**: New architecture runs in parallel with legacy system.
3.  **Stability First**: All historical reports must remain unchanged.

------------------------------------------------------------------------

# 2. Phase 1 -- Infrastructure & Organization Bootstrap (IMPLEMENTED)

**Goal**: Initialize the V3 hierarchy.

**Execution**:
Run the bootstrap script:
```bash
npx tsx scripts/v3/bootstrap-org.ts
```

**Result**: 
- Master Organization created: `{messmass} Master Org`
- Root Organization ID: `69b322e0cb8e841f95de9aa1`
- Middleware `withOrgContext` enabled across all V3 routes.

------------------------------------------------------------------------

# 3. Phase 2 -- Partner → Entity Migration (IMPLEMENTED)

**Goal**: Map V2 Partners to V3 Entities.

**Execution**:
Run the migration script:
```bash
npx tsx scripts/v3/migrate-v2-v3.ts
```

**Logic**:
-   **Partner → Entity(type="team")**: V2 Partners are mapped to V3 Entities.
-   **Default Activity**: Each entity receives a "project" type Activity for core operations.
-   **Metadata Link**: Legacy `partnerId` is stored in `metadata.originalData` for backward compatibility.

**Status**: 155 Partners migrated successfully.

------------------------------------------------------------------------

# 4. Phase 3 -- UI Alignment & Compatibility Bridge (IMPLEMENTED)

**Goal**: Seamlessly render V3 data using existing V2 components.

**Implementation**:
1.  **Compatibility Adapter**: `lib/v3/compatAdapter.ts` transforms V3 Entity/Activity models into V2 shapes at runtime.
2.  **Native Resolution**: Report pages resolve templates via `/api/v3/reports/resolve` if a V3 ID is provided.
3.  **Fallback Engine**: `useReportData` hook tries V2 Project lookup first, then falls back to V3 Activity lookup.

------------------------------------------------------------------------

# 5. Validation Checklist

-   ✅ All 155 Partners mapped to Entities.
-   ✅ All default Activities created.
-   ✅ Legacy report URLs preserved and functional.
-   ✅ Production build passes with V3 bridge active.

------------------------------------------------------------------------

# 6. Operational State

The platform is now in "V3-Core" mode.
-   **New Entities**: Create via `POST /api/v3/entities`.
-   **New Activities**: Create via `POST /api/v3/activities`.
-   **Metric Recording**: Use `POST /api/v3/metrics/record`.

Legacy collections (`partners`, `projects`) are preserved for historical continuity.
