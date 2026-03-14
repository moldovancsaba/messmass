# {messmass} v3 -- API Specification (Operational)

**Status**: Version 3.1.0 Active
**Last Updated**: 2026-03-13

Purpose: Define the REST API contract for the {messmass} v3 backend.

Base path: `/api/v3`

------------------------------------------------------------------------

# 1. Core Endpoints

## Entity Management
- `GET /api/v3/entities`: List entities within organization context.
- `GET /api/v3/entities/{id}`: Get entity details and children.
- `POST /api/v3/entities`: Create a new entity (team, division, etc).
- `POST /api/admin/organizations/{id}/members`: Bulk assign entities (Partners) to an organization.

## Activity Management
- `GET /api/v3/activities`: List activities.
- `GET /api/v3/activities/{id}`: Get activity details.
- `POST /api/v3/activities`: Create a new activity (match, project).

------------------------------------------------------------------------

# 2. Reporting & Analytics (NEW)

## Report Resolution
`GET /api/v3/reports/resolve`

**Query Params**: 
- `activityId`: Resolve template for a specific activity.
- `entityId`: Resolve template for a specific entity.

**Response**:
```json
{
  "success": true,
  "report": { ...template },
  "resolvedFrom": "activity|entity|default",
  "source": "name"
}
```

## Dashboard Metrics
`GET /api/v3/reporting/dashboard`

**Query Params**:
- `entityId`: Root entity for aggregation.
- `metrics`: Comma-separated keys (e.g., "sales,attendance").
- `startDate`, `endDate`: ISO timestamps.

## Organization Reporting (v12.1.0)
`GET /api/v3/organizations/report/{id}`

**Response**: Aggregated metrics (sums) across all member entities.

`GET /api/v3/organizations/report/{id}/activities`

**Response**: Combined list of activities where organization members are owners or participants.

------------------------------------------------------------------------

# 3. Bulk Metric Ingestion

`POST /api/v3/metrics/record`

**Payload**:
```json
{
  "entityId": "entity-id",
  "activityId": "activity-id",
  "timestamp": "ISO-string",
  "metrics": {
    "attendance": 500,
    "revenue": 12000
  }
}
```

------------------------------------------------------------------------

# 4. Security & Performance

## Rate Limiting
- **Global Policy**: Active via middleware.
- **Bulk Ingestion**: Enforced rate limit on `/api/v3/metrics/record`.

## Multi-tenancy
- Header `x-v3-org-id` is required (injected by middleware for authenticated sessions).
- Root Organization: `69b322e0cb8e841f95de9aa1`.

------------------------------------------------------------------------

# 5. Backwards Compatibility

V2 endpoints (`/api/projects/stats`, `/api/partners/report`) remain active.
The `useReportData` hook automatically bridges V3 Activities into the legacy rendering engine.
