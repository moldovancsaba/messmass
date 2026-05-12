# Administrator Guide: Organization Management

## Overview
Organizations in `{messmass}` provide a high-level grouping mechanism for **Partners**. This allows superadmins to create named groups, assign partner memberships, open organization-level reports, and maintain organization-specific report content.

## 1. Creating Organizations
1. Role required: **Superadmin**.
2. Path: `/admin/organizations`.
3. Action: Click **"Add Organization"**.
4. Fields:
   - **Name**: Canonical name of the organization (for example: `Champions Hockey League`).
   - **Slug**: URL-safe identifier (auto-generated when not explicitly set).
   - **Status**: `active` or `inactive`.
   - **Metadata**: Optional report/editor details such as emoji, style, and report content references.

## 2. Editing Organizations
From the organization list, click **Edit** to update:
- Organization name
- Organization status
- Metadata-backed report/editor settings through the linked editor surfaces

Edits preserve existing metadata keys unless explicitly changed.

## 3. Managing Members
Organizations do not own activities directly; they group **Partners** that already own activities and reports.
1. In the Organization list, find your organization and click **"Manage Members"**.
2. Use the predictive-search selector to find Partners by name or current organization.
3. Add or remove Partners from the selected chip list.
4. Click **Save Assignments** to persist changes.

Important behavior:
- Membership changes are staged in the modal and only applied when you save.
- A Partner can belong to only **one** organization at a time.
- Removing a Partner from the selected set unassigns it from that organization.

## 4. Organization Reports and Editor
Each organization row exposes:
- **Report** → opens the protected share dialog for `/organization-report/[id]`
- **Edit Stats** → `/organization-edit/[id]`
- **Edit** → inline admin metadata editing for name and status
- **Manage Members** → predictive-search membership assignment

The report aggregates:
- Organization-level metadata stats
- Member partner stats
- Related projects/events for assigned partners

The editor persists organization report metadata through the public organization edit API, while admin CRUD remains on the admin organization API.

Organization editor report configuration parity fields:
- **Report Visual Style** (`metadata.styleId`)
- **Report Template** (`metadata.reportTemplateId`, with legacy mirror `metadata.reportId`)
- **Clicker Set** (`metadata.clickerSetId`)
- **Organization Logo URL** (`metadata.logoUrl`)
- **Organization Emoji / visibility** (`metadata.emoji`, `metadata.showEmoji`)

Template resolution on organization report pages:
1. `metadata.reportTemplateId`
2. `metadata.reportId` (backward compatibility)
3. default partner report template

## 5. Deleting Organizations
- Deletion is available from the organization row action menu.
- An organization **cannot** be deleted while Partners are still assigned.
- Reassign or remove all members first, then delete the organization.

This delete guard prevents accidental data loss.

## 6. Technical Notes
- Primary admin data source: `organizations` collection
- Membership source: `partners.organizationId`
- Legacy V3 fallback remains available for older organization records, but new admin operations should use the live organization flow

## 7. Security & Isolation
- CRUD and member management require **superadmin** access.
- Organization reports use protected share links backed by page-specific passwords.
- Organization editors use page-specific passwords, while authenticated admin sessions bypass the prompt.
- Organization reports and editors use the same organization identifier shown in `/admin/organizations`.
