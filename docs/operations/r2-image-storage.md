# Image and Media Storage (Cloudflare R2)

Status: Active  
Last Updated: 2026-11-06  
Canonical: Yes  
Owner: Operations  

All images, partner logos, and report media in `messmass` live in the Cloudflare R2 bucket `messmass-logos` served via its public CDN endpoint, retiring ImgBB as the primary store.

## Background & Architecture

ImgBB was retired due to severe reliability and retention issues:
- Images expired or were silently deleted, returning HTTP 404 with a 1031-byte placeholder.
- Missing images or cold-storage timeouts caused edge servers to hang for >90 seconds, freezing client report loading.
- ImgBB is now restricted to an optional, background backup mirror with a 5-second non-blocking timeout.

Cloudflare R2 is the fleet CDN standard across `camera` and `messmass`:
- Objects are addressed by SHA-256 hash (`reports/<sha256>.<ext>` or `logos/<sha256>.<ext>`).
- Caching is immutable: `Cache-Control: public, max-age=31536000, immutable`.
- Stored under a single hash, eliminating duplicates and preventing broken links.

## Upload Flow (Future Report Editing)

1. **Browser Uploads:**
   - User selects an image in [`components/ImageUploader.tsx`](file:///Users/Shared/Projects/messmass/components/ImageUploader.tsx), [`components/ImageUploadField.tsx`](file:///Users/Shared/Projects/messmass/components/ImageUploadField.tsx), or [`components/ReportContentManager.tsx`](file:///Users/Shared/Projects/messmass/components/ReportContentManager.tsx).
   - Component calls [`lib/imgbbClientUpload.ts`](file:///Users/Shared/Projects/messmass/lib/imgbbClientUpload.ts) (`uploadImageToImgbb`).
   - The file is sent via `POST /api/media/upload` with CSRF protection.
   - The route handler validates the session, processes the image with `sharp`, content-hashes (SHA-256), and writes to R2 bucket `messmass-logos` via the Cloudflare R2 REST API.
   - If `IMGBB_API_KEY` is present, a background mirror is triggered concurrently with a 5-second timeout; failures in ImgBB never block or fail the R2 response.
   - The public R2 URL (`https://pub-b52ac4e9cc2b4199acd3a3b997ffdb0f.r2.dev/reports/...`) is returned and saved into the database.

2. **Server-Side URL Ingestion & Partner Logos:**
   - [`lib/mediaStorage.ts`](file:///Users/Shared/Projects/messmass/lib/mediaStorage.ts) (`storeMedia`, `rehostMedia`) and [`lib/imgbbApi.ts`](file:///Users/Shared/Projects/messmass/lib/imgbbApi.ts) (`uploadImageFromUrl`, `uploadPartnerBadge`) rehost external images directly into R2.
   - [`app/admin/partners/page.tsx`](file:///Users/Shared/Projects/messmass/app/admin/partners/page.tsx) checks `isR2HostedUrl(url)` (`https://pub-b52ac4e9cc2b4199acd3a3b997ffdb0f.r2.dev`) so any external logo URL (including `ibb.co`) is rehosted to R2 on save.
   - [`app/report/[slug]/ReportContent.tsx`](file:///Users/Shared/Projects/messmass/app/report/[slug]/ReportContent.tsx) and [`app/report/[slug]/ReportChart.tsx`](file:///Users/Shared/Projects/messmass/app/report/[slug]/ReportChart.tsx) treat empty or `/assets/placeholders/image-missing.svg` values as absent so unpopulated image slots are cleanly omitted instead of rendering placeholder icons.

## Historical Migration, Cold-Storage Recovery & Rollback

- **Inventory Audit:** `scripts/scan-images.mjs` mapped 3,540 image references across 71 MongoDB collections.
- **Initial Migration (2026-11-04):** `scripts/migrate-all-images-to-r2.mjs` migrated 518 live image occurrences to R2.
- **Complete Cold-Storage Recovery (2026-11-06):**
  - Recovered all **224** cold-storage `i.ibb.co` URLs that had timed out during the initial pass into Cloudflare R2 (`/reports/<sha256>.<ext>`), and mapped the **7** legacy 404 partner badge URLs (`sportsDb.badge` / `partner1.sportsDb.badge`) to their authoritative R2 partner logos (`/logos/<sha256>.<ext>`).
  - Updated all **511** remaining fields across **172** MongoDB documents (`projects`: 171, `v3_activities`: 194, `v3_entities`: 90, `partners`: 48, `report_variants`: 7, `bitly_links`: 1) to `https://pub-b52ac4e9cc2b4199acd3a3b997ffdb0f.r2.dev/...`.
  - Fixed `scripts/remediate-dead-images.mjs` so it only targets confirmed dead URLs (`scripts/r2-dead-images.json`) and never overwrites cached R2 URLs.
  - Verified **0** remaining `ibb.co` / `imgbb.com` URLs and **0** remaining `/assets/placeholders/image-missing.svg` references across all 71 MongoDB collections.
- **Rollback Tool:** `scripts/image-migration-rollback.json` preserves the historical URL mapping:
  ```bash
  node scripts/rollback-images-from-r2.mjs --apply
  ```

## Environment Configuration

| Variable | Description |
|---|---|
| `MESSMASS_R2_ACCOUNT_ID` | Cloudflare account ID (`66ce3adbb96f6715f8cc2b04991c30e4`) |
| `MESSMASS_R2_API_TOKEN` | Cloudflare R2 API Token with Object Read & Write |
| `MESSMASS_R2_LOGOS_BUCKET` | `messmass-logos` |
| `MESSMASS_R2_LOGOS_PUBLIC_BASE_URL` | `https://pub-b52ac4e9cc2b4199acd3a3b997ffdb0f.r2.dev` |
| `NEXT_PUBLIC_IMGBB_API_KEY` / `IMGBB_API_KEY` | Optional: Best-effort backup mirror only |
