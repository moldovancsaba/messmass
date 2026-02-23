# Landing / Main Page (messmass.com)
Status: Active
Last Updated: 2026-02-21T00:00:00.000Z (v11.56.6 footer version + generate hardening)
Canonical: Yes
Owner: Product

## Purpose
- Document how the public main page (messmass.com) is driven by a chosen report and optional static snapshot.
- Describe admin Main page UI, APIs, and integration so the site can serve static content without live DB/report pipeline.

## Overview
- **Public site:** The root page (`/`) loads the static snapshot **on the server** (`app/page.tsx` calls `getLandingSettings()`) and passes it as `initialStaticPayload` to `LandingPage`. No client fetch is required for the static path; if no snapshot exists, the client falls back to live report for `landingReportSlug`.
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
| POST | `/api/admin/landing-static-generate` | Generates static snapshot from current landing report and saves it. Returns `{ success, generatedAt?, blocksCount?, verified?, readBackBlocks? }`. After save, reads back from DB to verify persistence; admin message reflects "verified" or prompts to open main page on same site. **Requires CSRF token** (use `apiPost`). |
| GET | `/api/admin/landing-projects` | Returns `{ success, projects: [{ _id, eventName, viewSlug, eventDate? }] }` for the report dropdown (only projects with `viewSlug`). |

## Integration

### Settings storage
- **Collection:** `settings`
- **Document ID:** `landingPage` (`lib/landingSettings.ts`).
- **Fields:** `landingReportSlug`, `staticSnapshot` (blocks, chartResults, gridSettings, style, projectStats), `generatedAt`, `updatedAt`.

### Main page (v11.56.3 → v11.56.4: server-side snapshot, chartId + allowNA)
- **Server** (`app/page.tsx`): Async page calls `getLandingSettings()`, normalizes snapshot (block ids to strings, `chartResults` array), passes `initialStaticPayload` to `LandingPage`.
- **Client** (`components/LandingPage.tsx`): If `initialStaticPayload` is set, uses it for first paint (no client fetch). Otherwise fetches `GET /api/landing-static` and then renders static or live.
- If `staticSnapshot` is present: **LandingPageStatic** (hero from `projectStats`, report section via **ReportContent** with snapshot blocks/chartResults, `allowNA={true}`, then **PricingAndFooter**). **Block titles** on the main page follow the report setup: each block's `showTitle` and `title` from the snapshot are respected (if checked to show in Admin → Visualization, the title is shown; if unchecked, it is hidden). Same logic as `/report/[slug]`.
- Else: **LandingPageLive(slug)** with live pipeline.

### CSRF
- All state-changing admin calls (PUT landing-settings, POST landing-static-generate) must use **apiPut** / **apiPost** from `lib/apiClient` so the `X-CSRF-Token` header is sent. Raw `fetch()` will result in "CSRF token invalid or missing".

## Static snapshot generation (v11.56.1 → v11.56.4)
- Block resolution in landing-static-generate matches report-config; block IDs saved as **strings** (`b._id.toString()` when needed) so they survive MongoDB round-trip.
- Chart results are serialized via `serializeChartResult()`; snapshot is stored with string block ids.
- **v11.56.2:** Generate API read-back returns `verified` / `readBackBlocks`; admin message clarifies "this site" vs same-origin.
- **v11.56.3:** Snapshot is loaded **on the server** in `app/page.tsx` and passed as `initialStaticPayload`; `normalizeSnapshot()` ensures block ids and `chartResults` are client-safe. ReportContent/ReportBlock: when `allowNA` is true, typography `allCells` includes charts without error so block font size is set.
- **v11.56.4:** Chart lookup and static report section fix: all `chartId` values normalized to strings; ResponsiveRow receives `allowNA` so the three blocks render between hero and pricing.
- **v11.56.5:** Landing report cards follow strict sizing: when `allowNA` (static landing), block base font is capped at 22px and subtitle at 16px so cards match report-page typography and don’t overflow.
- **v11.56.6:** Generate API saves all `chartId` values as strings in blocks and chartResults for reliable client lookup; main page footer shows app version (from `package.json`) next to Privacy Policy and Terms & Conditions.
- **v11.56.7:** Landing report cards: font cap (22px/16px) applied from first paint when using static snapshot (`allowNA`), and block gets overflow containment (`.blockLanding`) so card text cannot overlap adjacent cards.
- **v11.56.9:** Value Chain chart type supported in API and UI; landing KPI sizing fixes (13px/32px forced, shrink-to-fit disabled on landing).
- **v11.56.8:** Stricter landing font cap: wrapper sets `--block-base-font-size: 16px`, `--block-subtitle-font-size: 13px`, `--landing-max-font: 16px`; KPI icon and value use `var(--landing-max-font)` in clamps so container-query scaling cannot exceed cap; block cap lowered to 16px/13px when `allowNA`.

## HTML vs JSON (avoid "Unexpected token '<'" errors)
- Generate API: when calling report-config, only parses response as JSON if `Content-Type` is `application/json`; if the response is HTML (e.g. error page) or fetch fails, falls back to inline template/block resolution from the DB.
- Main page client: when fetching `/api/landing-static`, only parses as JSON when response is `application/json` and catches parse errors; otherwise treats as no snapshot and continues without crashing.

## References
- `lib/landingSettings.ts` – types, get/set helpers, default slug
- `app/admin/mainpage/page.tsx` – admin UI (report selector, Save, Update static content)
- `app/api/landing-static/route.ts` – public landing payload
- `app/api/admin/landing-settings/route.ts` – GET/PUT settings
- `app/api/admin/landing-static-generate/route.ts` – POST generate snapshot
- `app/api/admin/landing-projects/route.ts` – GET projects for dropdown
- `components/LandingPage.tsx` – static vs live routing and rendering
