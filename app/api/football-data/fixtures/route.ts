/**
 * Football-Data Fixtures API
 *
 * WHAT: Query cached Football-Data.org fixtures stored in MongoDB
 * WHY: Power Sports Match Builder suggestions and admin browsing without hitting external API
 */

import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';
import type { Db, Collection, Filter, WithId } from 'mongodb';
import type { FootballDataFixtureDoc } from '@/lib/footballData.types';
import { getAdminUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Admin-only endpoint to browse cached fixtures
    const user = await getAdminUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const competitionId = url.searchParams.get('competitionId');
    const partnerId = url.searchParams.get('partnerId');
    const status = url.searchParams.get('status');
    const dateFrom = url.searchParams.get('dateFrom');
    const dateTo = url.searchParams.get('dateTo');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
    const offset = Math.max(parseInt(url.searchParams.get('offset') || '0'), 0);

    const client = await clientPromise;
    const db: Db = client.db(config.dbName);
    const fixtures: Collection<FootballDataFixtureDoc> = db.collection('football_data_fixtures');

    const query: Filter<FootballDataFixtureDoc> = {};
    if (competitionId) {
      // competition may be ID (number) or code; we store numeric id
      const cid = Number(competitionId);
      if (!Number.isNaN(cid)) query['competition.id'] = cid as any;
    }
    if (status) {
      query.status = status as any;
    }
    if (dateFrom || dateTo) {
      query.utcDate = {} as any;
      if (dateFrom) (query.utcDate as any).$gte = dateFrom;
      if (dateTo) (query.utcDate as any).$lte = dateTo;
    }
    if (partnerId) {
      // Match if either side involves the partner
      (query as any).$or = [
        { homePartnerId: partnerId },
        { awayPartnerId: partnerId },
      ];
    }

    const cursor = fixtures
      .find(query)
      .sort({ utcDate: 1, _id: 1 })
      .skip(offset)
      .limit(limit);

    const [items, total] = await Promise.all([
      cursor.toArray(),
      fixtures.countDocuments(query),
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
    console.error('football-data fixtures API error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch fixtures' }, { status: 500 });
  }
}
