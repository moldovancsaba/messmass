# Logo storage (Cloudflare R2)

Status: Active
Last Updated: 2026-10-07
Canonical: Yes
Owner: Operations

Partner logos live in one public bucket on Cloudflare R2, `messmass-logos`, not on imgbb. imgbb is a free upload site: a link can answer
slowly, time out, or turn into its "image not found" picture, and then every guest page of camera shows a broken logo (the OTP Bank - PICK
Szeged logo did on 2026-10-07).

## What happens when a logo is saved

`PUT` and `POST /api/partners` (and the TheSportsDB badge upload, `/api/partners/upload-logo`) pass the logo link through
`lib/logoStorage.ts` (`rehostLogo`). If the four `MESSMASS_R2_*` settings exist and the link is not already in the bucket, the file is
downloaded, checked, stored as `logos/<sha256>.<ext>` and the stored link is saved instead. A logo from imgbb, Vercel Blob, TheSportsDB
or any public address ends up in the bucket whichever screen it was entered on. When anything fails the link stays as it was, so a save
never fails because of the logo.

- The download accepts a public `https` name only: no credentials, no IP address, no `localhost`, every address the name resolves to (and
  every redirect, at most three) must be public; at most 5 MB; it must be a PNG, JPEG, WebP, GIF or SVG.
- The key is the SHA-256 of the file: the same file is stored once, a link never changes content, and the object is served with
  `Cache-Control: public, max-age=31536000, immutable`.
- The write uses Cloudflare's R2 REST API (`api.cloudflare.com`, bearer token), not the S3-compatible API, the same way image.direct does.

## Settings

| Variable | Meaning |
|---|---|
| `MESSMASS_R2_ACCOUNT_ID` | Cloudflare account id (32 hex characters). |
| `MESSMASS_R2_API_TOKEN` | R2 token; limit it to "Object Read & Write" on `messmass-logos`. |
| `MESSMASS_R2_LOGOS_BUCKET` | `messmass-logos`. |
| `MESSMASS_R2_LOGOS_PUBLIC_BASE_URL` | Public `r2.dev` address of the bucket, `https`, no trailing path. |

Set them in Vercel (Production and Preview) and in the local, git-ignored env file. Without them logos keep working as before (Vercel Blob
for uploads) and nothing is moved.

## Limits

- `r2.dev` is Cloudflare's managed public address: meant for light public traffic and open to rate limiting. The files are immutable and
  long-cached. A custom domain needs a DNS zone in the Cloudflare account (there is none); the stored links are keyed by hash, so they can
  be rewritten if the address ever changes.
- Camera accepts only this exact address for logos (`LOGO_STORAGE_HOST` in camera `lib/imgbb/url.ts`); change both together.
- Only logos. Report images and fan selfies of events stay where they are.

See also camera `docs/LOGO_STORAGE.md`.
