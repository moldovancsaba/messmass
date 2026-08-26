// lib/imgbbClientUpload.ts
// WHAT: Upload an image file straight from the browser to Vercel Blob (required
//       primary) + ImgBB (best-effort mirror)
// WHY: Routing uploads through our own /api/upload-image serverless function
//      hit Vercel's hard 4.5MB request body cap, causing HTTP 413 on
//      ordinary phone photos. Uploading directly from the browser skips that cap
//      for both providers -- Blob via the official client-upload token flow
//      (app/api/blob-upload-token/route.ts mints a short-lived, upload-scoped
//      token; the browser never sees BLOB_READ_WRITE_TOKEN), ImgBB the same way
//      it always worked, using the public NEXT_PUBLIC_IMGBB_API_KEY.

import { upload } from '@vercel/blob/client';
import { clientConfig } from '@/lib/config';
import { ensureCsrfToken } from '@/lib/apiClient';

const IMGBB_UPLOAD_URL = 'https://api.imgbb.com/1/upload';
const BLOB_UPLOAD_TOKEN_ROUTE = '/api/blob-upload-token';

export interface ImgBBClientUploadResult {
  success: boolean;
  url?: string;
  thumbnail?: string;
  deleteUrl?: string;
  mirrorUrl?: string;
  error?: string;
}

function sanitizeFileName(name: string): string {
  const cleaned = name.trim().replace(/[^a-zA-Z0-9_.-]/g, '-').replace(/-+/g, '-');
  return cleaned || 'upload';
}

/**
 * Best-effort mirror upload to imgbb. Never throws -- resolves to null on any
 * failure (missing key, network error, rejected upload) so the primary Blob
 * upload is never blocked by it.
 */
async function uploadToImgbbMirror(file: File): Promise<{ url: string; deleteUrl?: string } | null> {
  const apiKey = clientConfig().imgbbApiKey;
  if (!apiKey) return null;

  try {
    const formData = new FormData();
    formData.append('key', apiKey);
    formData.append('image', file);

    const response = await fetch(IMGBB_UPLOAD_URL, { method: 'POST', body: formData });
    const data = await response.json();
    if (!data.success) return null;

    return { url: data.data.url, deleteUrl: data.data.delete_url };
  } catch {
    return null;
  }
}

export async function uploadImageToImgbb(file: File): Promise<ImgBBClientUploadResult> {
  try {
    const csrfToken = await ensureCsrfToken();

    const [blob, mirror] = await Promise.all([
      upload(sanitizeFileName(file.name), file, {
        access: 'public',
        contentType: file.type || undefined,
        handleUploadUrl: BLOB_UPLOAD_TOKEN_ROUTE,
        headers: csrfToken ? { 'X-CSRF-Token': csrfToken } : undefined,
      }),
      uploadToImgbbMirror(file),
    ]);

    return {
      success: true,
      url: blob.url,
      thumbnail: blob.url,
      deleteUrl: mirror?.deleteUrl,
      mirrorUrl: mirror?.url,
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to upload image' };
  }
}
