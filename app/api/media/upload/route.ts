// app/api/media/upload/route.ts
// WHAT: API endpoint for uploading images and media directly to Cloudflare R2 bucket.
// WHY: ImgBB has reliability issues and drops images; Cloudflare R2 is the fleet standard CDN storage.
// HOW: Accepts multipart/form-data or JSON (base64). Validates session, processes with Sharp, stores in R2 under SHA-256 hash.

import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/apiGuards';
import { storeMedia, isMediaStorageConfigured } from '@/lib/mediaStorage';

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MB

async function uploadToImgbbMirror(buffer: Buffer, name?: string): Promise<{ url: string; deleteUrl?: string } | null> {
  const apiKey = process.env.IMGBB_API_KEY || process.env.NEXT_PUBLIC_IMGBB_API_KEY;
  if (!apiKey) return null;
  try {
    const formData = new URLSearchParams();
    formData.append('key', apiKey);
    formData.append('image', buffer.toString('base64'));
    if (name) formData.append('name', name);

    const res = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      signal: AbortSignal.timeout(5000), // Strict 5s timeout so ImgBB never blocks R2
    });
    const data = await res.json().catch(() => null);
    if (!data?.success || !data.data?.url) return null;
    return { url: data.data.url, deleteUrl: data.data.delete_url };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const denied = await requireSession();
  if (denied) return denied;

  if (!isMediaStorageConfigured()) {
    return NextResponse.json(
      { success: false, error: 'Media storage is not configured (MESSMASS_R2_* environment variables missing)' },
      { status: 500 }
    );
  }

  try {
    const contentType = request.headers.get('content-type') || '';
    let buffer: Buffer;
    let fileName: string = 'upload';
    let folder: string = 'reports';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = (formData.get('file') || formData.get('image')) as File | null;
      if (!file) {
        return NextResponse.json({ success: false, error: 'No file provided in form data' }, { status: 400 });
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        return NextResponse.json({ success: false, error: `File exceeds maximum allowed size (${MAX_UPLOAD_BYTES / 1024 / 1024} MB)` }, { status: 413 });
      }
      fileName = file.name || 'upload';
      const customFolder = formData.get('folder');
      if (typeof customFolder === 'string' && customFolder.trim()) {
        folder = customFolder.trim().replace(/[^a-zA-Z0-9_-]/g, '');
      }
      buffer = Buffer.from(await file.arrayBuffer());
    } else if (contentType.includes('application/json')) {
      const body = await request.json();
      const { data, name, folder: customFolder } = body;
      if (!data || typeof data !== 'string') {
        return NextResponse.json({ success: false, error: 'Missing image data in request body' }, { status: 400 });
      }
      if (typeof customFolder === 'string' && customFolder.trim()) {
        folder = customFolder.trim().replace(/[^a-zA-Z0-9_-]/g, '');
      }
      if (typeof name === 'string' && name.trim()) {
        fileName = name.trim();
      }
      const base64Data = data.includes('base64,') ? data.split('base64,')[1] : data;
      buffer = Buffer.from(base64Data, 'base64');
      if (buffer.length > MAX_UPLOAD_BYTES) {
        return NextResponse.json({ success: false, error: `File exceeds maximum allowed size (${MAX_UPLOAD_BYTES / 1024 / 1024} MB)` }, { status: 413 });
      }
    } else {
      return NextResponse.json({ success: false, error: 'Unsupported Content-Type (must be multipart/form-data or application/json)' }, { status: 400 });
    }

    if (buffer.length === 0) {
      return NextResponse.json({ success: false, error: 'Uploaded file is empty' }, { status: 400 });
    }

    // Upload to primary Cloudflare R2 storage + concurrent best-effort mirror to ImgBB
    const [stored, mirror] = await Promise.all([
      storeMedia(buffer, { folder }),
      uploadToImgbbMirror(buffer, fileName),
    ]);

    if (!stored) {
      return NextResponse.json({ success: false, error: 'Failed to process and store media in R2' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      url: stored.url,
      thumbnail: stored.url,
      key: stored.key,
      sha256: stored.sha256,
      mirrorUrl: mirror?.url,
      deleteUrl: mirror?.deleteUrl,
    });
  } catch (error) {
    console.error('❌ Media upload error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
