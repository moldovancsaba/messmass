/**
 * SportsDB Sync API
 *
 * WHAT: Sync upcoming events for all partners with sportsDb.teamId, then partner-match fixtures
 * WHY: Populate local cache for Suggested Fixtures and future automation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/auth';
import { syncSportsDbForAllPartners, matchSportsDbFixturesToPartners } from '@/lib/sportsdbFixtureImporter';

export async function POST() {
  try {
    const user = await getAdminUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const syncRes = await syncSportsDbForAllPartners();
    const matchRes = await matchSportsDbFixturesToPartners();

    return NextResponse.json({ success: true, sync: syncRes, matched: matchRes.matched, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('[SportsDB Sync API] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to sync SportsDB fixtures' }, { status: 500 });
  }
}