/**
 * Create Draft Project from SportsDB Fixture
 *
 * POST /api/sports-db/fixtures/draft
 * BODY: { eventId: string }
 *
 * WHAT: Creates a draft project linked to a cached TheSportsDB fixture
 * WHY: Enable one-click creation from Suggested Fixtures UI
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/auth';
import { createDraftProjectFromSportsDbFixture } from '@/lib/sportsdbFixtureImporter';

export async function POST(request: NextRequest) {
  try {
    const user = await getAdminUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => null);
    const eventId = body?.eventId as string | undefined;
    if (!eventId) {
      return NextResponse.json({ success: false, error: 'Missing eventId' }, { status: 400 });
    }

    const res = await createDraftProjectFromSportsDbFixture(eventId);
    if (!res.created) {
      const reason = (res as any).reason || 'unknown_error';
      return NextResponse.json({ success: false, error: reason }, { status: 400 });
    }

    return NextResponse.json({ success: true, projectId: res.projectId });
  } catch (error) {
    console.error('[SportsDB Draft From Fixture API] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create draft project' }, { status: 500 });
  }
}