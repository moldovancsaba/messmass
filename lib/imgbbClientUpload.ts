// lib/imgbbClientUpload.ts
// WHAT: Upload an image file straight from the browser to Cloudflare R2 (fleet CDN standard) + ImgBB (best-effort mirror)
// WHY: ImgBB has high failure rates and deletes images silently; Cloudflare R2 is the fleet standard CDN storage.
//      Keeps the `uploadImageToImgbb` export and `ImgBBClientUploadResult` signature for drop-in backward compatibility across all editor components.

import { ensureCsrfToken } from '@/lib/apiClient';

const MEDIA_UPLOAD_ROUTE = '/api/media/upload';

export interface ImgBBClientUploadResult {
  success: boolean;
  url?: string;
  thumbnail?: string;
  deleteUrl?: string;
  mirrorUrl?: string;
  error?: string;
}

export async function uploadImageToImgbb(file: File): Promise<ImgBBClientUploadResult> {
  try {
    const csrfToken = await ensureCsrfToken();

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'reports');

    const headers: Record<string, string> = {};
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    const response = await fetch(MEDIA_UPLOAD_ROUTE, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || `Upload failed with status ${response.status}`);
    }

    return {
      success: true,
      url: data.url,
      thumbnail: data.thumbnail || data.url,
      deleteUrl: data.deleteUrl,
      mirrorUrl: data.mirrorUrl,
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to upload image' };
  }
}
