// app/api/partners/link-football-data/route.ts
// WHAT: Link a partner to a Football-Data.org team and enrich partner metadata
// WHY: Enable fixture matching and KYC enrichment using official team IDs

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';
import { getAdminUser } from '@/lib/auth';
import { fetchTeam, fetchCompetitions, nowIsoMs } from '@/lib/footballDataApi';
import { generateFootballDataHashtags, mergeFootballDataHashtags } from '@/lib/footballDataEnricher';
import type { FootballDataCompetition } from '@/lib/footballData.types';
import { uploadImageFromUrl } from '@/lib/imgbbApi';

export async function POST(request: NextRequest) {
  try {
    const user = await getAdminUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { partnerId, footballDataTeamId } = body as { partnerId: string; footballDataTeamId: number };
    if (!partnerId || !ObjectId.isValid(partnerId) || !footballDataTeamId) {
      return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(config.dbName);
    const partnersCol = db.collection('partners');

    const partner = await partnersCol.findOne({ _id: new ObjectId(partnerId) });
    if (!partner) {
      return NextResponse.json({ success: false, error: 'Partner not found' }, { status: 404 });
    }

    // Fetch team details from Football-Data.org
    const team = await fetchTeam(footballDataTeamId);

    // Optionally fetch competitions (limited set in free plan, we still try)
    let competitions: FootballDataCompetition[] = [];
    try {
      competitions = await fetchCompetitions();
    } catch (_e) {
      // Non-critical; proceed without competitions
      competitions = [];
    }

    // Generate hashtags from Football-Data metadata
    const generatedHashtags = generateFootballDataHashtags(team, competitions);
    const mergedHashtags = mergeFootballDataHashtags(partner.categorizedHashtags, generatedHashtags);

    // Upload crest to ImgBB if available and no logoUrl yet
    let logoUrl: string | undefined = partner.logoUrl;
    if (!logoUrl && team.crest) {
      try {
        const upload = await uploadImageFromUrl(team.crest, `partner-${team.name || team.tla || footballDataTeamId}`);
        if (upload.success && upload.data?.url) {
          logoUrl = upload.data.url;
        }
      } catch (_e) {
        // Non-blocking if crest upload fails
      }
    }

    const now = nowIsoMs();

    // Build footballData enrichment object
    const footballData = {
      teamId: team.id,
      name: team.name,
      shortName: team.shortName || team.name,
      tla: team.tla || '',
      crest: team.crest || '',
      competitions: competitions.map(c => ({ id: c.id, name: c.name, code: c.code, type: c.type, emblem: c.emblem })),
      lastSynced: now,
    };

    await partnersCol.updateOne(
      { _id: new ObjectId(partnerId) },
      {
        $set: {
          footballData,
          categorizedHashtags: mergedHashtags,
          updatedAt: now,
          ...(logoUrl ? { logoUrl } : {}),
        },
      }
    );

    const updated = await partnersCol.findOne({ _id: new ObjectId(partnerId) });

    return NextResponse.json({ success: true, partner: { ...updated, _id: updated?._id?.toString?.() } });
  } catch (error) {
    console.error('[POST /api/partners/link-football-data] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to link partner' }, { status: 500 });
  }
}
