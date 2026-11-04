# Image and Media Storage (Cloudflare R2)

Status: Active  
Last Updated: 2026-11-04  
Canonical: Yes  
Owner: Operations  

All images, partner logos, and report media in `messmass` live in the Cloudflare R2 bucket `messmass-logos` served via its public CDN endpoint, retiring ImgBB as the primary store.

## Background & Architecture

ImgBB was retired due to severe reliability and retention issues:
- Images expired or were silently deleted, returning HTTP 404 with a 1031-byte placeholder.
- Missing images caused edge servers to hang for >90 seconds, freezing client report loading.
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

2. **Server-Side URL Ingestion:**
   - [`lib/mediaStorage.ts`](file:///Users/Shared/Projects/messmass/lib/mediaStorage.ts) (`storeMedia`, `rehostMedia`) and [`lib/imgbbApi.ts`](file:///Users/Shared/Projects/messmass/lib/imgbbApi.ts) (`uploadImageFromUrl`, `uploadPartnerBadge`) rehost external images directly into R2.

## Historical Migration & Rollback

- **Inventory Audit:** `scripts/scan-images.mjs` mapped 3,540 image references across 71 MongoDB collections.
- **Migration Execution:** `scripts/migrate-all-images-to-r2.mjs` migrated all live image assets to R2 and cataloged dead/404 ImgBB URLs in `scripts/r2-dead-images.json`.
- **Database Updates:** 518 document occurrences across `v3_entities`, `projects`, `partners`, `v3_activities`, `report_variants`, and `settings` were updated to R2 URLs in MongoDB Atlas.
- **Rollback Tool:** `scripts/image-migration-rollback.json` preserves the complete previous URL mapping. Any update can be reversed cleanly with:
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
