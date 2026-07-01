// lib/imgbbClientUpload.ts
// WHAT: Upload an image file straight from the browser to ImgBB
// WHY: Routing uploads through our own /api/upload-image serverless function
//      hit Vercel's hard 4.5MB request body cap, causing HTTP 413 on
//      ordinary phone photos. Uploading directly to ImgBB skips that cap.

import { clientConfig } from '@/lib/config';

const IMGBB_UPLOAD_URL = 'https://api.imgbb.com/1/upload';

export interface ImgBBClientUploadResult {
  success: boolean;
  url?: string;
  thumbnail?: string;
  deleteUrl?: string;
  error?: string;
}

export async function uploadImageToImgbb(file: File): Promise<ImgBBClientUploadResult> {
  const apiKey = clientConfig().imgbbApiKey;
  if (!apiKey) {
    return { success: false, error: 'Image upload not configured' };
  }

  const formData = new FormData();
  formData.append('key', apiKey);
  formData.append('image', file);

  const response = await fetch(IMGBB_UPLOAD_URL, { method: 'POST', body: formData });
  const data = await response.json();

  if (!data.success) {
    return { success: false, error: data.error?.message || 'Failed to upload image' };
  }

  return {
    success: true,
    url: data.data.url,
    thumbnail: data.data.thumb?.url,
    deleteUrl: data.data.delete_url,
  };
}
