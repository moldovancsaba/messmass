import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const club = searchParams.get('club') || '';
    const partnerId = searchParams.get('partnerId') || '';
    const partnerSlug = searchParams.get('partnerSlug') || '';
    const fanGroup = searchParams.get('fanGroup') || '';
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '40', 10)));

    if (!club && !partnerId && !partnerSlug) {
      return NextResponse.json(
        { success: false, error: 'club, partnerId, or partnerSlug parameter is required' },
        { status: 400 }
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
        $or: [
          { name: { $regex: club.trim(), $options: 'i' } },
          { 'sportsDb.strTeam': { $regex: club.trim(), $options: 'i' } },
        ],
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
      conditions.push({ partnerNames: { $regex: partnerDoc.name, $options: 'i' } });
      conditions.push({ clubs: { $regex: partnerDoc.name, $options: 'i' } });
    }
    if (club) {
      conditions.push({ clubs: { $regex: club.trim(), $options: 'i' } });
      conditions.push({ partnerNames: { $regex: club.trim(), $options: 'i' } });
    }

    let query: any = conditions.length > 0 ? { $or: conditions } : {};
    if (fanGroup) {
      query = {
        $and: [
          query,
          {
            $or: [
              { fanGroups: { $regex: fanGroup.trim(), $options: 'i' } },
              { scene: { $regex: fanGroup.trim(), $options: 'i' } },
              { clubs: { $regex: fanGroup.trim(), $options: 'i' } },
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
      totalPeople += doc.peopleCount || 1;
      maleCount += doc.genders?.male || 0;
      femaleCount += doc.genders?.female || 0;
      ageGroups.children += doc.ageGroups?.children || 0;
      ageGroups.teens += doc.ageGroups?.teens || 0;
      ageGroups.adults += doc.ageGroups?.adults || 0;
      ageGroups.seniors += doc.ageGroups?.seniors || 0;

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

    const totalG = maleCount + femaleCount;
    const malePct = totalG > 0 ? Math.round((maleCount / totalG) * 100) : 50;
    const femalePct = totalG > 0 ? 100 - malePct : 50;

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
      peopleCount: d.peopleCount || 1,
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
