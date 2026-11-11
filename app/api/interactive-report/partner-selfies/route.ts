import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';
import { ObjectId } from 'mongodb';
import { SZRT_ORGANIZATION_ID } from '@/lib/interactiveReportAggregator';

export const dynamic = 'force-dynamic';

// szrt_vision_analysis holds the SZRT campaign's analysed selfies, so this endpoint serves
// that tenant only.
const MAX_FILTER_LENGTH = 100;

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Case-insensitive "contains" matcher for user-supplied text (never a raw pattern). */
function containsText(text: string) {
  return { $regex: escapeRegex(text.trim()), $options: 'i' };
}

function toCount(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const club = (searchParams.get('club') || '').trim().slice(0, MAX_FILTER_LENGTH);
    const partnerId = searchParams.get('partnerId') || '';
    const partnerSlug = searchParams.get('partnerSlug') || '';
    const fanGroup = (searchParams.get('fanGroup') || '').trim().slice(0, MAX_FILTER_LENGTH);
    const organizationId = searchParams.get('organizationId') || '';
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '40', 10) || 40));

    if (!club && !partnerId && !partnerSlug) {
      return NextResponse.json(
        { success: false, error: 'club, partnerId, or partnerSlug parameter is required' },
        { status: 400 }
      );
    }

    if (organizationId && organizationId !== SZRT_ORGANIZATION_ID) {
      return NextResponse.json(
        { success: false, error: 'No selfies are accessible in this tenant partition' },
        { status: 403 }
      );
    }

    const client = await clientPromise;
    const db = client.db(config.dbName);

    // 1. Resolve partner document if available
    let partnerDoc: any = null;
    if (partnerId && ObjectId.isValid(partnerId)) {
      partnerDoc = await db.collection('partners').findOne({ _id: new ObjectId(partnerId) });
    } else if (partnerSlug) {
      partnerDoc = await db.collection('partners').findOne({ viewSlug: partnerSlug });
    } else if (club) {
      partnerDoc = await db.collection('partners').findOne({
        $or: [{ name: containsText(club) }, { 'sportsDb.strTeam': containsText(club) }],
      });
    }

    // 2. Build selfie query
    const conditions: any[] = [];
    if (partnerDoc?._id) {
      conditions.push({ partnerIds: String(partnerDoc._id) });
    }
    if (partnerDoc?.viewSlug) {
      conditions.push({ partnerSlugs: partnerDoc.viewSlug });
    }
    if (partnerDoc?.name) {
      conditions.push({ partnerNames: containsText(String(partnerDoc.name)) });
      conditions.push({ clubs: containsText(String(partnerDoc.name)) });
    }
    if (club) {
      conditions.push({ clubs: containsText(club) });
      conditions.push({ partnerNames: containsText(club) });
    }

    // Never run an unscoped query: without a club or partner to match there is nothing to return.
    if (conditions.length === 0) {
      return NextResponse.json({
        success: true,
        club,
        partner: null,
        totalSelfies: 0,
        totalPeople: 0,
        demographics: {
          malePct: null,
          femalePct: null,
          maleCount: 0,
          femaleCount: 0,
          ageGroups: { children: 0, teens: 0, adults: 0, seniors: 0 },
        },
        topEmotions: [],
        topBrands: [],
        fanGroups: [],
        selfies: [],
      });
    }

    let query: any = { $or: conditions };
    if (fanGroup) {
      query = {
        $and: [
          query,
          {
            $or: [
              { fanGroups: containsText(fanGroup) },
              { scene: containsText(fanGroup) },
              { clubs: containsText(fanGroup) },
            ],
          },
        ],
      };
    }

    // 3. Query szrt_vision_analysis collection
    const selfieDocs = await db
      .collection('szrt_vision_analysis')
      .find(query)
      .sort({ analyzedAt: -1 })
      .limit(limit)
      .toArray();

    const totalCount = await db.collection('szrt_vision_analysis').countDocuments(query);

    // 4. Compute demographic & sentiment metrics on matching selfies
    let totalPeople = 0;
    let maleCount = 0;
    let femaleCount = 0;
    const ageGroups = { children: 0, teens: 0, adults: 0, seniors: 0 };
    const emotionCounts: Record<string, number> = {};
    const brandCounts: Record<string, number> = {};
    const fanGroupCounts: Record<string, number> = {};

    for (const doc of selfieDocs) {
      totalPeople += toCount(doc.peopleCount);
      maleCount += toCount(doc.genders?.male);
      femaleCount += toCount(doc.genders?.female);
      ageGroups.children += toCount(doc.ageGroups?.children);
      ageGroups.teens += toCount(doc.ageGroups?.teens);
      ageGroups.adults += toCount(doc.ageGroups?.adults);
      ageGroups.seniors += toCount(doc.ageGroups?.seniors);

      for (const em of doc.emotions || []) {
        emotionCounts[em] = (emotionCounts[em] || 0) + 1;
      }
      for (const br of doc.brands || []) {
        brandCounts[br] = (brandCounts[br] || 0) + 1;
      }
      for (const fg of doc.fanGroups || []) {
        fanGroupCounts[fg] = (fanGroupCounts[fg] || 0) + 1;
      }
    }

    // Gender shares exist only when the model measured at least one gender
    const totalG = maleCount + femaleCount;
    const malePct = totalG > 0 ? Math.round((maleCount / totalG) * 100) : null;
    const femalePct = malePct !== null ? 100 - malePct : null;

    const topEmotions = Object.entries(emotionCounts)
      .map(([emotion, count]) => ({ emotion, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const topBrands = Object.entries(brandCounts)
      .map(([brand, count]) => ({ brand, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const topFanGroups = Object.entries(fanGroupCounts)
      .map(([group, count]) => ({ group, count }))
      .sort((a, b) => b.count - a.count);

    const selfies = selfieDocs.map((d) => ({
      fileName: d.fileName,
      sport: d.sport,
      filePath: d.filePath,
      peopleCount: toCount(d.peopleCount),
      emotions: d.emotions || [],
      brands: d.brands || [],
      clubs: d.clubs || [],
      fanGroups: d.fanGroups || [],
      scene: d.scene || '',
      analyzedAt: d.analyzedAt,
    }));

    return NextResponse.json({
      success: true,
      club: club || partnerDoc?.name || '',
      partner: partnerDoc
        ? {
            id: String(partnerDoc._id),
            name: partnerDoc.name,
            emoji: partnerDoc.emoji || '🏆',
            logoUrl:
              partnerDoc.logoUrl ||
              partnerDoc.logo ||
              partnerDoc.sportsDb?.strTeamBadge ||
              partnerDoc.sportsDb?.badge ||
              null,
            viewSlug: partnerDoc.viewSlug || null,
            sport:
              partnerDoc.sportsDb?.strSport ||
              partnerDoc.categorizedHashtags?.sport?.[0] ||
              null,
            venue: partnerDoc.sportsDb?.strStadium || null,
            venueCapacity: partnerDoc.sportsDb?.intStadiumCapacity || null,
            website: partnerDoc.sportsDb?.strWebsite || partnerDoc.sportsDb?.website || null,
          }
        : null,
      totalSelfies: totalCount,
      totalPeople,
      demographics: {
        malePct,
        femalePct,
        maleCount,
        femaleCount,
        ageGroups,
      },
      topEmotions,
      topBrands,
      fanGroups: topFanGroups,
      selfies,
    });
  } catch (err: any) {
    console.error('Partner selfies API error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
