// app/api/audience-packs/[key]/route.ts
// WHAT: Read one pack, or set which blocks it includes.
// WHY: messmass#236.

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/apiGuards';
import { getAudiencePack, setAudiencePackBlocks, AUDIENCE_PACK_KEYS } from '@/lib/audiencePacks';

export async function GET(request: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { key } = await params;
  const pack = await getAudiencePack(key);
  if (!pack) {
    return NextResponse.json({ success: false, error: `Unknown pack. Must be one of: ${AUDIENCE_PACK_KEYS.join(', ')}` }, { status: 404 });
  }
  return NextResponse.json({ success: true, pack: { ...pack, _id: pack._id.toString() } });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { key } = await params;
  try {
    const body = await request.json();
    const allowedBlockIds = body?.allowedBlockIds;
    if (!Array.isArray(allowedBlockIds) || allowedBlockIds.some((v) => typeof v !== 'string')) {
      return NextResponse.json({ success: false, error: 'allowedBlockIds must be an array of strings.' }, { status: 400 });
    }
    const pack = await setAudiencePackBlocks(key, allowedBlockIds);
    if (!pack) {
      return NextResponse.json({ success: false, error: `Unknown pack. Must be one of: ${AUDIENCE_PACK_KEYS.join(', ')}` }, { status: 404 });
    }
    return NextResponse.json({ success: true, pack: { ...pack, _id: pack._id.toString() } });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to update audience pack.' }, { status: 500 });
  }
}
