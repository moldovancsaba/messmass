/**
 * SportsDB Fixtures API
 *
 * WHAT: Query cached TheSportsDB fixtures stored in MongoDB (sportsdb_fixtures)
 * WHY: Power Suggested Fixtures in Quick Add and admin browsing without hitting external API
 */

import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';
import type { Db, Collection, Filter, WithId } from 'mongodb';
import { getAdminUser } from '@/lib/auth';

interface SportsDbFixtureDoc {
  eventId: string;
  leagueId?: string | null;
  leagueName?: string | null;
  season?: string | null;
  date: string;              // YYYY-MM-DD
  time?: string | null;      // HH:mm:ss
  timestamp?: string | null; // ISO timestamp
  status?: string | null;    // Not Started / Finished
  venueId?: string | null;
  venue?: string | null;
  homeTeam: { id?: string | null; name?: string | null };
  awayTeam: { id?: string | null; name?: string | null };
  homePartnerId?: string;    // ObjectId string
  awayPartnerId?: string;    // ObjectId string
  projectId?: string;        // ObjectId string
  createdAt: string;
  updatedAt: string;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAdminUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const partnerId = url.searchParams.get('partnerId'); // filter by either home or away partner
    const homeOnly = url.searchParams.get('homeOnly') === 'true';
    const teamId = url.searchParams.get('teamId'); // TheSportsDB team id
    const dateFrom = url.searchParams.get('dateFrom');
    const dateTo = url.searchParams.get('dateTo');
    const status = url.searchParams.get('status'); // e.g., Not Started
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 100);
    const offset = Math.max(parseInt(url.searchParams.get('offset') || '0', 10), 0);

    const client = await clientPromise;
    const db: Db = client.db(config.dbName);
    const fixtures: Collection<SportsDbFixtureDoc> = db.collection('sportsdb_fixtures');

    const query: Filter<SportsDbFixtureDoc> = {} as any;

    if (status) (query as any).status = status;
    if (dateFrom || dateTo) {
      (query as any).date = {} as any;
      if (dateFrom) (query as any).date.$gte = dateFrom;
      if (dateTo) (query as any).date.$lte = dateTo;
    }

    if (teamId) {
      (query as any).$or = [
        { 'homeTeam.id': teamId },
        { 'awayTeam.id': teamId },
      ];
    }

    if (partnerId) {
      if (homeOnly) {
        (query as any).homePartnerId = partnerId;
      } else {
        (query as any).$or = [
          { homePartnerId: partnerId },
          { awayPartnerId: partnerId },
          ...(Array.isArray((query as any).$or) ? (query as any).$or : []),
        ];
      }
    }

    const cursor = fixtures
      .find(query)
      .sort({ date: 1, _id: 1 })
      .skip(offset)
      .limit(limit);

    const [items, total] = await Promise.all([
      cursor.toArray(),
      fixtures.countDocuments(query as any),
    ]);

    return NextResponse.json({
      success: true,
      fixtures: items,
      pagination: {
        total,
        limit,
        offset,
        nextOffset: offset + items.length < total ? offset + items.length : null,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[SportsDB Fixtures API] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch fixtures' }, { status: 500 });
  }
}