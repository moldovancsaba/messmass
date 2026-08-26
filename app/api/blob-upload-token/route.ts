// app/api/blob-upload-token/route.ts
// WHAT: Mints short-lived Vercel Blob client-upload tokens
// WHY: Browser uploads go straight to Blob (skips Vercel's 4.5MB serverless body
//      cap, the same reason lib/imgbbClientUpload.ts went straight to imgbb) but
//      the browser must never see BLOB_READ_WRITE_TOKEN itself -- that token has
//      full read/write/delete on the whole store. This route runs handleUpload()
//      server-side to issue a token scoped to one upload.

import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/apiGuards';

const ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const MAX_UPLOAD_BYTES = 32 * 1024 * 1024;

export async function POST(request: Request): Promise<NextResponse> {
  const denied = await requireSession();
  if (denied) return denied;

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ALLOWED_CONTENT_TYPES,
        maximumSizeInBytes: MAX_UPLOAD_BYTES,
        addRandomSuffix: true,
      }),
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate upload token' },
      { status: 400 }
    );
  }
}
