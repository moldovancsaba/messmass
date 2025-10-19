// app/api/football-data/sync/route.ts
// WHAT: Trigger manual sync of Football-Data fixtures for selected competitions
// WHY: Allow admins to refresh cache and drive event creation workflows

import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/auth';
import { importFixtures, matchFixturesToPartners } from '@/lib/fixtureImporter';

export async function POST(request: NextRequest) {
  try {
    const user = await getAdminUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const competitionIds: Array<number | string> = Array.isArray(body?.competitionIds) ? body.competitionIds : [];
    const status: string | undefined = body?.status; // e.g., 'SCHEDULED'
    const dateFrom: string | undefined = body?.dateFrom;
    const dateTo: string | undefined = body?.dateTo;

    const targets = competitionIds.length > 0 ? competitionIds : ['PL', 'PD', 'SA', 'BL1', 'FL1', 'BSA', 'CL'];

    const results = [] as any[];
    for (const c of targets) {
      const res = await importFixtures(c, { status, dateFrom, dateTo });
      results.push({ competition: c, ...res });
    }

    // Attempt fixture-to-partner matching after import
    const matching = await matchFixturesToPartners();

    return NextResponse.json({ success: true, results, matching, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('football-data sync error:', error);
    return NextResponse.json({ success: false, error: 'Sync failed' }, { status: 500 });
  }
}
