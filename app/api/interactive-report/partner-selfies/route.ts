import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';
import { ObjectId } from 'mongodb';
import { SZRT_ORGANIZATION_ID } from '@/lib/interactiveReportAggregator';

export const dynamic = 'force-dynamic';

// This endpoint no longer serves any analysed selfie. It used to read `szrt_vision_analysis`, the per-image
// documents of the retired SZRT vision worker: brand and club lists the model recalled from its own prompt, and
// free-text scene descriptions, served to anyone with no publication check. That data is not shown anywhere.
// The deep rerun sends Messmass only counts and proof crops (`/api/interactive-report/brand-evidence`), never a
// per-image description, so there is nothing per selfie to serve. The partner details below are the partner
// record's own data and stay.
const MAX_FILTER_LENGTH = 100;

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Case-insensitive "contains" matcher for user-supplied text (never a raw pattern). */
function containsText(text: string) {
  return { $regex: escapeRegex(text.trim()), $options: 'i' };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const club = (searchParams.get('club') || '').trim().slice(0, MAX_FILTER_LENGTH);
    const partnerId = searchParams.get('partnerId') || '';
    const partnerSlug = searchParams.get('partnerSlug') || '';
    const organizationId = searchParams.get('organizationId') || '';

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

    // Resolve the partner record, if there is one
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
      // No analysed selfie is served: nothing measured per picture is available here
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
  } catch (err: any) {
    console.error('Partner selfies API error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
