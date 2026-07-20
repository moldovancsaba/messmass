# Tutorial: Organisations
Status: Active
Last Updated: 2026-07-20T00:00:00.000Z
Canonical: Yes
Owner: Documentation

> Audience: Superadmins · Prerequisites: Superadmin role, at least one Partner to assign · Related: [Getting started](guides-tutorial-getting-started.md) · [Partners](guides-tutorial-partners.md) · [Camera app](guides-tutorial-camera-app.md)

## What it is & why it matters

An **organisation** is the top-level grouping in messmass. It sits above partners and provides org-scoped tenancy: a named container that groups the **Partners** who actually own events and reports.

You use organisations to:

- Group related partners under one parent (a league, federation, or holding brand).
- Produce an **organisation report** that aggregates every member partner's stats and events into one aggregate view.
- Keep reporting multi-tenant — non-superadmin users can be scoped to specific organisation IDs.

Organisations do not own events directly. They group **Partners**, and the partners own the activity. Membership is the link between them.

> Note: Organisation management is **superadmin-only**. The **Add Organization** button and the create/edit/delete/member APIs all require the superadmin role. If you are an admin or user, you will not see this surface.

## Before you start

- **Be a superadmin.** Everything on `/admin/organizations` is gated to superadmin.
- **Have partners ready.** An organisation is only useful once partners are assigned to it. Create partners first via [Partners](guides-tutorial-partners.md).
- **Know the one-org rule.** A partner belongs to exactly **one** organisation at a time. Assigning it here moves it out of any previous organisation.

## Step by step

### 1. Open the organisation workspace

Go to `/admin/organizations` (Entities group in the admin workspace). The page is titled **Organization Management** with the subtitle "Create organizations, assign partner members, and open report/editor tools."

### 2. Create an organisation

1. Click **Add Organization** (top-right; visible to superadmins only).
2. Enter the organisation **Name** (for example, `Champions Hockey League`).
3. Submit. The organisation is created immediately.

What happens on save:

- A URL-safe **slug** is generated automatically from the name (lowercased, non-alphanumerics collapsed to `-`, de-duplicated so no two organisations collide).
- **Status** defaults to `active`.
- **Metadata** starts empty and is filled in later through the editor (see below).

> Note: The reused administrator reference lists Name, Slug, Status, and Metadata as organisation fields. In the current create modal you supply the **Name**; slug, status, and metadata are set automatically and then managed through **Edit** and the organisation editor.

### 3. Edit an organisation

From the organisation list, use the row's **Edit** action to update:

- **Name**
- **Status** (`active` / `inactive`)

Edits preserve existing metadata keys unless you change them explicitly.

### 4. Manage members (assign partners)

1. On the organisation row, click **Manage Members**.
2. Use the predictive-search selector to find partners by name or current organisation.
3. Add or remove partners from the selected set.
4. Click **Save Assignments**.

Behaviour to keep in mind:

- Changes are **staged in the modal** and only applied when you click **Save Assignments**.
- A partner can belong to only **one** organisation. Adding it here removes it from wherever it was.
- Removing a partner from the selected set unassigns it from this organisation.

### 5. Open the organisation report and editor

Each organisation row exposes:

- **Report** → opens the protected share dialog for `/organization-report/[id]`.
- **Edit Stats** → the organisation content editor at `/organization-edit/[id]`.
- **Edit** → inline admin editing of name and status.
- **Manage Members** → the predictive-search membership assignment above.

The organisation report aggregates organisation-level metadata stats, member-partner stats, and the related projects/events of the assigned partners.

The organisation editor manages report configuration through `metadata`, with the same parity fields as partner and event reports:

- **Report Visual Style** (`metadata.styleId`)
- **Report Template** (`metadata.reportTemplateId`, with legacy mirror `metadata.reportId`)
- **Clicker Set** (`metadata.clickerSetId`)
- **Organization Logo URL** (`metadata.logoUrl`)
- **Organization Emoji / visibility** (`metadata.emoji`, `metadata.showEmoji`)

Template resolution on the organisation report page follows: `metadata.reportTemplateId` → `metadata.reportId` (backward compatibility) → the default partner report template.

## Managing it

### Worked example: standing up a league

1. As a superadmin, open `/admin/organizations` and click **Add Organization**. Name it `Champions Hockey League`. The slug `champions-hockey-league` is generated for you.
2. If the member clubs do not exist yet, create them first in [Partners](guides-tutorial-partners.md).
3. Back on the organisation row, click **Manage Members**, search for each club, add them to the selection, and click **Save Assignments**.
4. Open the organisation editor (**Edit Stats** → `/organization-edit/[id]`) and set the report template, style, clicker set, logo, and emoji via the `metadata` fields.
5. Click **Report** on the organisation row to open the aggregate `/organization-report/[id]` and confirm the member stats roll up as expected.

### Everyday maintenance

- **Reassigning partners:** re-open **Manage Members**, adjust the selection, and save. There is no separate "move" action — membership is just the selected set.
- **Deactivating vs deleting:** set status to `inactive` when you want to retire an organisation without removing it. Delete only when it should be gone permanently.
- **Deleting an organisation:** use the row's delete action and confirm the prompt. An organisation **cannot be deleted while partners are still assigned** — this guard prevents accidental data loss. Reassign or remove every member first, then delete.
- **Scoping report access:** organisation reports and editors use page-specific passwords through the protected share dialog; an authenticated admin session bypasses the prompt. See [Sharing & access](guides-tutorial-sharing-access.md).

## Gotchas & good practice

- **Delete is guarded, not silent.** If a delete "fails," check whether partners are still assigned — that is the guard doing its job, not an error.
- **Membership is exclusive.** Moving a partner into a new organisation quietly removes it from the old one. Communicate the move if two teams share partners.
- **Name drives the slug once.** The slug is generated at creation; renaming the organisation later does not necessarily regenerate the slug, so pick a clean name up front.
- **Superadmin gate is total.** Admins cannot see this page at all — route org work through a superadmin.

> Note: Creating an organisation may be mirrored into the **Camera app** as a shared identity. This mirror is created lazily — the first time one of the organisation's partners or events is provisioned into Camera, messmass ensures a matching Camera organisation and stamps the Camera organisation ID back onto the record. It is not triggered by clicking **Add Organization** on its own. See [Camera app](guides-tutorial-camera-app.md).

## How it connects

- **Partners** are the members of an organisation and the entities that own events — see [Partners](guides-tutorial-partners.md).
- The organisation report reuses the same **themes**, **templates**, and **clicker sets** as partner and event reports — see [Report themes](guides-tutorial-report-themes.md) and [Reports](guides-tutorial-reports.md).
- Camera provisioning ties organisation identity across apps — see [Camera app](guides-tutorial-camera-app.md).
- A fuller administrator reference lives at [admin: Organization Management](admin/organizations.md).

## Screenshots
_Screenshots to be added._

## Related tutorials

- [Tutorials index](guides-tutorials-index.md)
- [Getting started](guides-tutorial-getting-started.md)
- [Partners](guides-tutorial-partners.md)
- [Reports](guides-tutorial-reports.md)
- [Report themes](guides-tutorial-report-themes.md)
- [Sharing & access](guides-tutorial-sharing-access.md)
- [Camera app](guides-tutorial-camera-app.md)
