# Landing / Main Page (messmass.com)
Status: Active
Last Updated: 2026-02-21T00:00:00.000Z (v11.56.1 static snapshot fix)
Canonical: Yes
Owner: Product

## Purpose
- Document how the public main page (messmass.com) is driven by a chosen report and optional static snapshot.
- Describe admin Main page UI, APIs, and integration so the site can serve static content without live DB/report pipeline.

## Overview
- **Public site:** The root page (`/`) fetches `/api/landing-static`. If a static snapshot exists, it renders that; otherwise it renders the live report for the configured `landingReportSlug`.
- **Admin:** **Main page** (nav: Help section, between User Guide and Messages) lets admins choose which event report drives the main page and generate a static snapshot so messmass.com always uses static content until the next update.

## Admin UI
- **Path:** `/admin/mainpage`
- **Permissions:** `admin`, `superadmin` (`lib/permissions.ts`: `MENU_PERMISSIONS['Main page']`).
- **Actions:**
  1. **Report for main page:** Dropdown of projects with `viewSlug`; **Save** persists the selected slug via `PUT /api/admin/landing-settings`. Use **apiPut** (from `lib/apiClient`) so the request includes the CSRF token.
  2. **Update static content:** Button calls `POST /api/admin/landing-static-generate` to build a snapshot from the selected report and save it. Use **apiPost** for CSRF protection. After success, the main site serves this snapshot until the next generate.

## APIs

### Public (no auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/landing-static` | Returns `{ success, staticSnapshot?, generatedAt?, landingReportSlug }`. Used by the main page to decide static vs live and which slug to use. |

### Admin (session + role admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/landing-settings` | Returns `{ success, settings: { landingReportSlug, generatedAt? } }`. |
| PUT | `/api/admin/landing-settings` | Body: `{ landingReportSlug: string }`. Updates the selected report slug. **Requires CSRF token** (use `apiPut` from `lib/apiClient`). |
| POST | `/api/admin/landing-static-generate` | Generates static snapshot from current landing report and saves it. Returns `{ success, generatedAt?, blocksCount? }`. **Requires CSRF token** (use `apiPost`). |
| GET | `/api/admin/landing-projects` | Returns `{ success, projects: [{ _id, eventName, viewSlug, eventDate? }] }` for the report dropdown (only projects with `viewSlug`). |

## Integration

### Settings storage
- **Collection:** `settings`
- **Document ID:** `landingPage` (`lib/landingSettings.ts`).
- **Fields:** `landingReportSlug`, `staticSnapshot` (blocks, chartResults, gridSettings, style, projectStats), `generatedAt`, `updatedAt`.

### Main page component (`components/LandingPage.tsx`)
1. On load: `GET /api/landing-static` (no-store).
2. If `staticSnapshot` is present: render **LandingPageStatic** (hero from snapshot `projectStats`, report section from snapshot blocks/chartResults via `ReportContent` with `charts={null}`, then **PricingAndFooter**).
3. Else: render **LandingPageLive(slug)** with `slug` from API or `LANDING_REPORT_SLUG` default. Live path uses `useReportData`, layout, style, charts, and **ReportContent** with live data, then **PricingAndFooter**.

### CSRF
- All state-changing admin calls (PUT landing-settings, POST landing-static-generate) must use **apiPut** / **apiPost** from `lib/apiClient` so the `X-CSRF-Token` header is sent. Raw `fetch()` will result in "CSRF token invalid or missing".

## Static snapshot generation (v11.56.1)
- Block resolution in landing-static-generate matches report-config: block IDs use `ref.blockId.toString()` and blocks are found with `b._id.toString() === blockId` so both ObjectId and string IDs work.
- Chart results are serialized to plain JSON-safe objects via `serializeChartResult()` so they survive MongoDB and API round-trip; the client always receives valid `type`, `kpiValue`, `elements`, etc.
- If the main page still shows an empty section after generating, regenerate once (Admin → Main page → Update static content) to apply the fix.

## References
- `lib/landingSettings.ts` – types, get/set helpers, default slug
- `app/admin/mainpage/page.tsx` – admin UI (report selector, Save, Update static content)
- `app/api/landing-static/route.ts` – public landing payload
- `app/api/admin/landing-settings/route.ts` – GET/PUT settings
- `app/api/admin/landing-static-generate/route.ts` – POST generate snapshot
- `app/api/admin/landing-projects/route.ts` – GET projects for dropdown
- `components/LandingPage.tsx` – static vs live routing and rendering
