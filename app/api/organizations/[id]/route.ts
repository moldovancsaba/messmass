import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/db';
import { requireSession, requireAdmin } from '@/lib/apiGuards';
import { rehostLogo } from '@/lib/logoStorage';
import {
  loadCentralizedClubRegistry,
  slugifyClub,
  syncClubAssetAcrossEntities,
} from '@/lib/clubLogoResolver';
import { getStoredOrDerivedTotalFans } from '@/lib/totalFans';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const denied = await requireSession();
  if (denied) return denied;

  try {
    const { id } = await context.params;
    const db = await getDb();

    const query = ObjectId.isValid(id)
      ? { _id: new ObjectId(id) }
      : { slug: id };

    const [organization, clubRegistry] = await Promise.all([
      db.collection('organizations').findOne(query),
      loadCentralizedClubRegistry(db),
    ]);

    if (!organization) {
      return NextResponse.json({ success: false, error: 'Organization not found' }, { status: 404 });
    }

    const orgObjId = organization._id as ObjectId;
    const orgIdStr = orgObjId.toString();

    const [memberDocs, matchDocs] = await Promise.all([
      db
        .collection('partners')
        .find({
          status: { $nin: ['merged', 'archived'] },
          $or: [{ organizationId: orgObjId }, { organizationId: orgIdStr }],
        })
        .sort({ name: 1 })
        .toArray(),
      db
        .collection('projects')
        .find({
          $or: [
            { organizationId: orgObjId },
            { organizationId: orgIdStr },
            { organizationIds: orgObjId },
            { organizationIds: orgIdStr },
          ],
        })
        .sort({ eventDate: -1, createdAt: -1 })
        .limit(200)
        .toArray(),
    ]);

    const resolvedLogo =
      clubRegistry.resolveLogo({
        organizationId: orgObjId,
        slug: organization.slug,
        name: organization.name,
        fallbackUrl:
          organization.logoUrl ||
          (typeof organization.metadata?.logoUrl === 'string' ? organization.metadata.logoUrl : null),
      }) ||
      organization.logoUrl ||
      null;

    const memberClubs = memberDocs.map((club) => ({
      _id: club._id.toString(),
      name: club.name,
      emoji: club.emoji || '🏟️',
      showEmoji: club.showEmoji ?? true,
      viewSlug: club.viewSlug || '',
      logoUrl:
        clubRegistry.resolveLogo({
          partnerId: club._id,
          name: club.name,
          fallbackUrl: club.logoUrl || null,
        }) ||
        club.logoUrl ||
        null,
    }));

    let totalFansSum = 0;
    let totalPhotosSum = 0;
    const sanctionedMatches = matchDocs.map((project) => {
      const stats = project.stats || {};
      const fans = getStoredOrDerivedTotalFans(stats);
      const photos = Number(stats.images ?? stats.allImages ?? stats.photoResultsReceived ?? 0) || 0;
      totalFansSum += fans;
      totalPhotosSum += photos;
      return {
        _id: project._id.toString(),
        eventName: project.eventName || 'Untitled Match',
        eventDate: project.eventDate || null,
        viewSlug: project.viewSlug || project._id.toString(),
        editSlug: project.editSlug || project._id.toString(),
        competition: project.competition || null,
        competitionType: project.competitionType || null,
        totalFans: fans,
        totalPhotos: photos,
      };
    });

    return NextResponse.json({
      success: true,
      organization: {
        _id: orgIdStr,
        name: organization.name,
        slug: organization.slug,
        logoUrl: resolvedLogo,
        status: organization.status || 'active',
        orgType: organization.orgType || (organization.metadata?.orgType as string) || 'federation',
        defaultSport: (organization.metadata?.defaultSport as string) || '',
        defaultSeason: (organization.metadata?.defaultSeason as string) || '',
        metadata: organization.metadata || {},
        createdAt: organization.createdAt || null,
        updatedAt: organization.updatedAt || null,
      },
      memberClubs,
      sanctionedMatches,
      stats: {
        memberClubsCount: memberClubs.length,
        sanctionedMatchesCount: sanctionedMatches.length,
        totalFans: totalFansSum,
        totalPhotos: totalPhotosSum,
      },
    });
  } catch (error) {
    console.error('Failed to fetch organization hub:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch organization' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const { id } = await context.params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid organization ID' }, { status: 400 });
    }

    const orgObjId = new ObjectId(id);
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
    }

    const db = await getDb();
    const collection = db.collection('organizations');
    const existing = await collection.findOne({ _id: orgObjId });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Organization not found' }, { status: 404 });
    }

    const nowIso = new Date().toISOString();
    const setFields: Record<string, unknown> = { updatedAt: nowIso };
    const nextMetadata: Record<string, unknown> = {
      ...(existing.metadata && typeof existing.metadata === 'object' ? existing.metadata : {}),
    };

    if (typeof body.name === 'string' && body.name.trim()) {
      setFields.name = body.name.trim();
    }
    if (typeof body.slug === 'string' && body.slug.trim()) {
      setFields.slug = body.slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-');
    }
    if (body.status === 'active' || body.status === 'inactive') {
      setFields.status = body.status;
    }
    if (typeof body.orgType === 'string' && body.orgType.trim()) {
      setFields.orgType = body.orgType.trim();
      nextMetadata.orgType = body.orgType.trim();
    }
    if (typeof body.defaultSport === 'string') {
      nextMetadata.defaultSport = body.defaultSport.trim();
    }
    if (typeof body.defaultSeason === 'string') {
      nextMetadata.defaultSeason = body.defaultSeason.trim();
    }

    let hostedLogoUrl: string | undefined;
    if (typeof body.logoUrl === 'string') {
      const trimmed = body.logoUrl.trim();
      hostedLogoUrl = trimmed ? (await rehostLogo(trimmed)) || trimmed : '';
      setFields.logoUrl = hostedLogoUrl;
      nextMetadata.logoUrl = hostedLogoUrl;
    }

    setFields.metadata = nextMetadata;
    await collection.updateOne({ _id: orgObjId }, { $set: setFields });

    if (Array.isArray(body.memberPartnerIds)) {
      const memberIds = body.memberPartnerIds
        .filter((pid: unknown): pid is string => typeof pid === 'string' && ObjectId.isValid(pid))
        .map((pid: string) => new ObjectId(pid));

      await db.collection('partners').updateMany(
        { organizationId: orgObjId, _id: { $nin: memberIds } },
        { $unset: { organizationId: '' } }
      );
      if (memberIds.length > 0) {
        await db.collection('partners').updateMany(
          { _id: { $in: memberIds } },
          { $set: { organizationId: orgObjId, updatedAt: nowIso } }
        );
      }
    }

    const finalName = (setFields.name as string) || existing.name;
    const finalSlug = (setFields.slug as string) || existing.slug;
    if (hostedLogoUrl) {
      const canonicalSlug = slugifyClub(finalSlug || finalName);
      await db.collection('club_assets').updateOne(
        { canonicalSlug },
        {
          $set: {
            name: finalName,
            canonicalSlug,
            logoUrl: hostedLogoUrl,
            organizationId: orgObjId,
            entityKind: 'federation',
            updatedAt: nowIso,
          },
          $addToSet: { aliases: { $each: [finalName.toLowerCase(), finalSlug.toLowerCase()] } },
          $setOnInsert: { createdAt: nowIso },
        },
        { upsert: true }
      );
      await syncClubAssetAcrossEntities(db, {
        name: finalName,
        canonicalSlug,
        logoUrl: hostedLogoUrl,
        aliases: [finalName, finalSlug],
        organizationId: orgObjId,
      });
    }

    const updated = await collection.findOne({ _id: orgObjId });
    return NextResponse.json({
      success: true,
      organization: updated
        ? {
            ...updated,
            _id: updated._id.toString(),
          }
        : null,
    });
  } catch (error) {
    console.error('Failed to update organization:', error);
    return NextResponse.json({ success: false, error: 'Failed to update organization' }, { status: 500 });
  }
}
