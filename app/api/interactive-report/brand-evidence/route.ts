import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';
import { SZRT_ORGANIZATION_ID, isVisionPublishable } from '@/lib/interactiveReportAggregator';
import { listBrandEvidence, type EvidenceDb, type EvidenceKind } from '@/lib/fanmassEvidence';

export const dynamic = 'force-dynamic';

const MAX_NAME_LENGTH = 100;

/**
 * Proof samples for one brand or club in the SZRT report: crops of the pictures where its name was read,
 * with the box and how it was identified. Same tenant and publication rules as the rest of the SZRT vision data.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const kind = searchParams.get('kind') === 'club' ? 'club' : searchParams.get('kind') === 'brand' ? 'brand' : null;
  const name = (searchParams.get('name') || '').trim().slice(0, MAX_NAME_LENGTH);
  const organizationId = searchParams.get('organizationId') || '';
  if (!kind || !name) {
    return NextResponse.json({ success: false, error: 'kind (brand or club) and name are required' }, { status: 400 });
  }
  if (organizationId && organizationId !== SZRT_ORGANIZATION_ID) {
    return NextResponse.json({ success: false, error: 'No evidence is accessible in this tenant partition' }, { status: 403 });
  }
  try {
    const db = (await clientPromise).db(config.dbName);
    const visionDoc = await db.collection('szrt_vision_progress').findOne({ _id: 'szrt_progress' as never });
    if (!isVisionPublishable(visionDoc)) {
      return NextResponse.json({ success: true, published: false, kind, name, provenPhotos: 0, modelIdentifiedPhotos: 0, samples: [] });
    }
    const listing = await listBrandEvidence(db as unknown as EvidenceDb, { kind: kind as EvidenceKind, name, origin: 'szrt' });
    return NextResponse.json({ success: true, published: true, ...listing });
  } catch (err) {
    console.error('Brand evidence API error:', err);
    return NextResponse.json({ success: false, error: 'Could not load the evidence' }, { status: 500 });
  }
}
