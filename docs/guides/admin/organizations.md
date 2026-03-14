# Administrator Guide: Organization Management

## Overview
Organizations in {messmass} provide a high-level grouping mechanism for **Entities** (Partners). This allows for multi-tenant reporting, cross-team performance analysis, and centralized administrative control.

## 1. Creating Organizations
1. Level: **Superadmin** (Restricted to platform-level administrators).
2. Path: `/admin/organizations`.
3. Action: Click **"Create Organization"**.
4. Fields:
   - **Name**: Canonical name of the organization (e.g., "UEFA", "Global Marketing Group").
   - **Slug**: URL-safe identifier.
   - **Description**: Internal context for the organization.

## 2. Managing Members (Entities)
Organizations do not own activities directly; they group **Partners** who own them.
1. In the Organization list, find your organization and click **"Members"**.
2. Select one or more **Partners** from the dropdown.
3. Save the assignments.
4. All activities associated with these Partners will now automatically roll up into the Organization's reports.

## 3. Organization Reports
Organization reports aggregate metrics across deep hierarchies.
1. Path: `/admin/organizations`.
2. Action: Click the **"Report"** icon (Bar Chart).
3. **Sections**:
   - **Metrics Summary**: Aggregated KPI sums across all member entities.
   - **Member Entities**: List of all Partners associated with this organization.
   - **Aggregated Activities**: A combined timeline of matches, events, or campaigns from all member partners.

## 4. Technical Integration (Sync Engine)
The V3 Sync Engine automatically maps legacy V2 events to the new V3 hierarchy:
- If a V2 Event is associated with a Partner that has an `organizationId`, the resulting V3 Activity inherits that organization context.
- Manual member assignments at the Organization level take precedence.

## 5. Security & Isolation
- **Visibility**: Organization managers can only see data for entities within their assigned organization.
- **Reporting Persistence**: Changes to organization membership are reflected immediately in new report resolutions.
