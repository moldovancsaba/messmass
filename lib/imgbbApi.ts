// lib/imgbbApi.ts
// WHAT: Server-side image upload -- Vercel Blob (required primary) + ImgBB (best-effort mirror)
// WHY: ImgBB was found to delete images within hours under real load (confirmed in the
//      sibling "camera" app's incident, 2026-08) despite its documented 180-day policy.
//      Keeps the `imgbbApi` name/shape since callers and this module's own history are
//      built around it; only the upload strategy inside changed.

import { put } from '@vercel/blob';
import sharp from 'sharp';

const IMGBB_API_URL = 'https://api.imgbb.com/1/upload';

// Read lazily (inside functions, not at module load) so this works regardless of
// when the importing context finishes populating process.env -- Next.js request
// handling is fine either way, but ad-hoc scripts/tests that set env vars after
// their first import are not, and there's no cost to being lazy here.
function getImgbbApiKey(): string | undefined {
  return process.env.IMGBB_API_KEY;
}
function getBlobReadWriteToken(): string | undefined {
  return process.env.BLOB_READ_WRITE_TOKEN;
}

/**
 * WHAT: ImgBB upload response structure
 * WHY: Type safety for API responses. `data.url`/`data.image.url`/`data.display_url`/
 * `data.thumb.url` are all populated from the Blob URL now; `provider`/`mirrorUrl` are
 * new, additive, optional fields -- existing callers that only read `.url` are unaffected.
 */
export interface ImgBBUploadResponse {
  success: boolean;
  data?: {
    id: string;
    title: string;
    url: string;          // Direct image URL (Blob)
    display_url: string;  // Display URL with viewer
    width: number;
    height: number;
    size: number;
    time: number;
    expiration: number;
    image: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    thumb: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    delete_url: string;
    provider: 'blob';
    mirrorUrl?: string;
  };
  error?: {
    message: string;
    code: number;
  };
}

function sanitizeName(name: string): string {
  const cleaned = name.trim().replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-+/g, '-');
  return cleaned.slice(0, 120) || 'upload';
}

async function uploadToBlobPrimary(
  buffer: Buffer,
  name?: string
): Promise<{ url: string; contentType: string; extension: string }> {
  if (!getBlobReadWriteToken()) {
    throw new Error('BLOB_READ_WRITE_TOKEN environment variable is not set');
  }

  const metadata = await sharp(buffer, { failOn: 'none' }).metadata();
  const extension = metadata.format ?? 'bin';
  const contentType = metadata.format ? `image/${metadata.format}` : 'application/octet-stream';
  const fileName = `${sanitizeName(name ?? 'upload')}.${extension}`;

  const blob = await put(fileName, buffer, {
    access: 'public',
    addRandomSuffix: true,
    contentType,
  });

  return { url: blob.url, contentType, extension };
}

/**
 * Best-effort mirror upload to imgbb. Never throws -- returns null on any failure
 * (missing key, network error, rejected upload) so the caller can treat it as
 * purely informational.
 */
async function uploadToImgbbMirror(
  buffer: Buffer,
  name?: string
): Promise<{ url: string; deleteUrl: string } | null> {
  const imgbbApiKey = getImgbbApiKey();
  if (!imgbbApiKey) return null;

  try {
    const base64Image = buffer.toString('base64');
    const formData = new URLSearchParams();
    formData.append('key', imgbbApiKey);
    formData.append('image', base64Image);
    if (name) formData.append('name', name);

    const uploadResponse = await fetch(IMGBB_API_URL, {
      method: 'POST',
      body: formData,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    const result = (await uploadResponse.json()) as ImgBBUploadResponse;
    if (!result.success || !result.data) return null;
    return { url: result.data.url, deleteUrl: result.data.delete_url };
  } catch (error) {
    console.warn('imgbb mirror upload failed (non-fatal, Blob is primary):', error);
    return null;
  }
}

/**
 * WHAT: Upload image to Vercel Blob (primary) + ImgBB (best-effort mirror) from a source URL
 * WHY: Enable uploading partner logos from TheSportsDB URLs, reliably
 * @param imageUrl - URL of the image to upload (e.g., TheSportsDB badge URL)
 * @param name - Optional name for the uploaded image
 * @returns Upload response with a permanent Blob URL
 */
export async function uploadImageFromUrl(
  imageUrl: string,
  name?: string
): Promise<ImgBBUploadResponse> {
  try {
    console.log(`📥 Downloading image from: ${imageUrl}`);
    const imageResponse = await fetch(imageUrl);

    if (!imageResponse.ok) {
      return {
        success: false,
        error: {
          message: `Failed to download image from URL: ${imageResponse.statusText}`,
          code: imageResponse.status,
        },
      };
    }

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    console.log(`📤 Uploading to Vercel Blob...`);
    const [blob, mirror] = await Promise.all([
      uploadToBlobPrimary(imageBuffer, name),
      uploadToImgbbMirror(imageBuffer, name),
    ]);

    console.log(`✅ Image uploaded successfully: ${blob.url}`);
    return {
      success: true,
      data: {
        id: blob.url,
        title: name ?? 'upload',
        url: blob.url,
        display_url: blob.url,
        width: 0,
        height: 0,
        size: imageBuffer.byteLength,
        time: Math.floor(Date.now() / 1000),
        expiration: 0,
        image: { filename: `${name ?? 'upload'}.${blob.extension}`, name: name ?? 'upload', mime: blob.contentType, extension: blob.extension, url: blob.url },
        thumb: { filename: `${name ?? 'upload'}.${blob.extension}`, name: name ?? 'upload', mime: blob.contentType, extension: blob.extension, url: blob.url },
        delete_url: mirror?.deleteUrl ?? '',
        provider: 'blob',
        mirrorUrl: mirror?.url,
      },
    };
  } catch (error) {
    console.error('❌ Error uploading image:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        code: 500,
      },
    };
  }
}

/**
 * WHAT: Upload partner badge from TheSportsDB to permanent storage
 * WHY: Specialized function for partner logo workflow
 * @param badgeUrl - TheSportsDB badge URL
 * @param partnerName - Partner name for image naming
 * @returns Direct image URL or null if failed
 */
export async function uploadPartnerBadge(
  badgeUrl: string,
  partnerName: string
): Promise<string | null> {
  const sanitizedName = partnerName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const imageName = `partner-${sanitizedName}`;

  console.log(`🖼️  Uploading badge for partner: ${partnerName}`);

  const result = await uploadImageFromUrl(badgeUrl, imageName);

  if (result.success && result.data) {
    return result.data.url;
  }

  return null;
}

/**
 * WHAT: Validate Vercel Blob configuration -- the required primary store
 * WHY: Check before attempting uploads; imgbb is optional (best-effort mirror only)
 */
export function isImageStorageConfigured(): boolean {
  const token = getBlobReadWriteToken();
  return !!token && token.length > 0;
}

/**
 * WHAT: Validate ImgBB API key configuration
 * WHY: ImgBB is now an optional mirror; a missing key just disables it
 * @returns true if API key is configured
 */
export function isImgBBConfigured(): boolean {
  const key = getImgbbApiKey();
  return !!key && key.length > 0;
}

/**
 * WHAT: Test ImgBB connectivity and API key validity
 * WHY: Verify configuration before bulk operations
 * @returns true if ImgBB is accessible and API key is valid
 */
export async function testImgBBConnection(): Promise<boolean> {
  if (!isImgBBConfigured()) {
    console.error('❌ ImgBB API key not configured');
    return false;
  }

  try {
    const testImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    const formData = new URLSearchParams();
    formData.append('key', getImgbbApiKey()!);
    formData.append('image', testImage);
    formData.append('name', 'test-connection');

    const response = await fetch(IMGBB_API_URL, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    });

    const result = await response.json() as ImgBBUploadResponse;

    if (result.success) {
      console.log('✅ ImgBB connection test successful');
      return true;
    } else {
      console.error('❌ ImgBB connection test failed:', result.error);
      return false;
    }
  } catch (error) {
    console.error('❌ ImgBB connection test error:', error);
    return false;
  }
}
