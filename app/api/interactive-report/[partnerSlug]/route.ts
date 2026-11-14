import { NextRequest, NextResponse } from 'next/server';
import { getInteractiveReportData } from '@/lib/interactiveReportAggregator';

// Built from many events on the first request; the host default of 15 seconds is too short for it
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ partnerSlug: string }> }
) {
  try {
    const { partnerSlug } = await params;
    if (!partnerSlug) {
      return NextResponse.json({ success: false, error: 'Slug is required' }, { status: 400 });
    }

    const data = await getInteractiveReportData(partnerSlug);
    if (!data) {
      return NextResponse.json({ success: false, error: 'Partner not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Interactive report API error:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
