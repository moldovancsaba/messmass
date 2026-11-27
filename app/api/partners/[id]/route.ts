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
import { syncPartnerToV3Entity } from '@/lib/v3/syncEngine';
import { notifyCameraPartnerChanged } from '@/lib/cameraThemeNotify';
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
      : { $or: [{ viewSlug: id }, { slug: id }] };

    const [partner, clubRegistry] = await Promise.all([
      db.collection('partners').findOne(query),
      loadCentralizedClubRegistry(db),
    ]);

    if (!partner) {
      return NextResponse.json({ success: false, error: 'Partner not found' }, { status: 404 });
    }

    const partnerObjId = partner._id as ObjectId;
    const partnerIdStr = partnerObjId.toString();

    const [organization, rawProjects, stylesList, templatesList] = await Promise.all([
      partner.organizationId && ObjectId.isValid(String(partner.organizationId))
        ? db
            .collection('organizations')
            .findOne(
              { _id: new ObjectId(String(partner.organizationId)) },
              { projection: { name: 1, slug: 1, logoUrl: 1, status: 1 } }
            )
        : Promise.resolve(null),
      db
        .collection('projects')
        .find({
          $or: [
            { partner1Id: partnerObjId },
            { partner2Id: partnerObjId },
            { partner1: partnerObjId },
            { partner2: partnerObjId },
            { partner1Id: partnerIdStr },
            { partner2Id: partnerIdStr },
          ],
        })
        .sort({ eventDate: -1, createdAt: -1 })
        .limit(200)
        .toArray(),
      partner.styleId && ObjectId.isValid(String(partner.styleId))
        ? db.collection('report_styles').findOne({ _id: new ObjectId(String(partner.styleId)) }, { projection: { name: 1 } })
        : Promise.resolve(null),
      partner.reportTemplateId && ObjectId.isValid(String(partner.reportTemplateId))
        ? db.collection('report_templates').findOne({ _id: new ObjectId(String(partner.reportTemplateId)) }, { projection: { name: 1 } })
        : Promise.resolve(null),
    ]);

    const resolvedLogo =
      clubRegistry.resolveLogo({
        partnerId: partnerObjId,
        name: partner.name,
        fallbackUrl: partner.logoUrl || null,
      }) ||
      partner.logoUrl ||
      null;

    let totalFansSum = 0;
    let totalPhotosSum = 0;
    const events = rawProjects.map((project) => {
      const stats = project.stats || {};
      const fans = getStoredOrDerivedTotalFans(stats);
      const photos = Number(stats.images ?? stats.allImages ?? stats.photoResultsReceived ?? 0) || 0;
      totalFansSum += fans;
      totalPhotosSum += photos;
      const isHome =
        String(project.partner1Id || project.partner1?._id || project.partner1 || '') === partnerIdStr;
      return {
        _id: project._id.toString(),
        eventName: project.eventName || 'Untitled Event',
        eventDate: project.eventDate || null,
        viewSlug: project.viewSlug || project._id.toString(),
        editSlug: project.editSlug || project._id.toString(),
        role: isHome ? 'Home' : 'Away',
        competition: project.competition || null,
        totalFans: fans,
        totalPhotos: photos,
      };
    });

    return NextResponse.json({
      success: true,
      partner: {
        _id: partnerIdStr,
        name: partner.name,
        emoji: partner.emoji || '🏟️',
        showEmoji: partner.showEmoji ?? true,
        viewSlug: partner.viewSlug || '',
        logoUrl: resolvedLogo,
        status: partner.status || 'active',
        organizationId: partner.organizationId ? String(partner.organizationId) : null,
        organization: organization
          ? {
              _id: organization._id.toString(),
              name: organization.name,
              slug: organization.slug,
              logoUrl:
                clubRegistry.resolveLogo({
                  organizationId: organization._id,
                  slug: organization.slug,
                  name: organization.name,
                  fallbackUrl: organization.logoUrl || null,
                }) ||
                organization.logoUrl ||
                null,
            }
          : null,
        styleId: partner.styleId ? String(partner.styleId) : '',
        styleName: stylesList?.name || null,
        reportTemplateId: partner.reportTemplateId ? String(partner.reportTemplateId) : '',
        reportTemplateName: templatesList?.name || null,
        clickerSetId: partner.clickerSetId ? String(partner.clickerSetId) : '',
        hashtags: Array.isArray(partner.hashtags) ? partner.hashtags : [],
        categorizedHashtags: partner.categorizedHashtags || {},
        sportsDb: partner.sportsDb || null,
        googleSheetConfig: partner.googleSheetConfig || null,
        googleSheetsUrl: partner.googleSheetsUrl || '',
        showEventsList: partner.showEventsList ?? true,
        showOnlyTeam1Events: partner.showOnlyTeam1Events ?? false,
        contactName: partner.contactName || '',
        contactEmail: partner.contactEmail || '',
        websiteUrl: partner.websiteUrl || '',
        createdAt: partner.createdAt || null,
        updatedAt: partner.updatedAt || null,
      },
      events,
      stats: {
        totalEvents: events.length,
        activeEvents: events.length,
        totalFans: totalFansSum,
        totalPhotos: totalPhotosSum,
      },
    });
  } catch (error) {
    console.error('Failed to fetch single partner:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch partner' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const { id } = await context.params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid partner ID' }, { status: 400 });
    }

    const partnerObjId = new ObjectId(id);
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
    }

    const db = await getDb();
    const existing = await db.collection('partners').findOne({ _id: partnerObjId });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Partner not found' }, { status: 404 });
    }

    const nowIso = new Date().toISOString();
    const setFields: Record<string, unknown> = { updatedAt: nowIso };
    const unsetFields: Record<string, unknown> = {};

    if (typeof body.name === 'string' && body.name.trim()) {
      setFields.name = body.name.trim();
    }
    if (typeof body.emoji === 'string') {
      setFields.emoji = body.emoji.trim() || '🏟️';
    }
    if (typeof body.showEmoji === 'boolean') {
      setFields.showEmoji = body.showEmoji;
    }
    if (typeof body.viewSlug === 'string' && body.viewSlug.trim()) {
      setFields.viewSlug = body.viewSlug.trim();
    }
    if (body.status === 'active' || body.status === 'inactive') {
      setFields.status = body.status;
    }
    if (typeof body.showEventsList === 'boolean') {
      setFields.showEventsList = body.showEventsList;
    }
    if (typeof body.showOnlyTeam1Events === 'boolean') {
      setFields.showOnlyTeam1Events = body.showOnlyTeam1Events;
    }
    if (typeof body.googleSheetsUrl === 'string') {
      setFields.googleSheetsUrl = body.googleSheetsUrl.trim();
    }
    if (typeof body.contactName === 'string') {
      setFields.contactName = body.contactName.trim();
    }
    if (typeof body.contactEmail === 'string') {
      setFields.contactEmail = body.contactEmail.trim();
    }
    if (typeof body.websiteUrl === 'string') {
      setFields.websiteUrl = body.websiteUrl.trim();
    }
    if (Array.isArray(body.hashtags)) {
      setFields.hashtags = body.hashtags.filter((t: unknown) => typeof t === 'string' && t.trim());
    }
    if (body.categorizedHashtags && typeof body.categorizedHashtags === 'object' && !Array.isArray(body.categorizedHashtags)) {
      setFields.categorizedHashtags = body.categorizedHashtags;
    }

    const handleOptionalObjectId = (key: string, val: unknown) => {
      if (val === undefined) return;
      if (val === null || val === '' || val === 'none') {
        unsetFields[key] = '';
      } else if (ObjectId.isValid(String(val))) {
        setFields[key] = new ObjectId(String(val));
      }
    };

    handleOptionalObjectId('organizationId', body.organizationId);
    handleOptionalObjectId('styleId', body.styleId);
    handleOptionalObjectId('reportTemplateId', body.reportTemplateId);
    handleOptionalObjectId('clickerSetId', body.clickerSetId);

    let hostedLogoUrl: string | undefined;
    if (typeof body.logoUrl === 'string') {
      const trimmed = body.logoUrl.trim();
      hostedLogoUrl = trimmed ? (await rehostLogo(trimmed)) || trimmed : '';
      setFields.logoUrl = hostedLogoUrl;
    }

    const updateDoc: Record<string, unknown> = { $set: setFields };
    if (Object.keys(unsetFields).length > 0) {
      updateDoc.$unset = unsetFields;
    }

    await db.collection('partners').updateOne({ _id: partnerObjId }, updateDoc);

    const finalName = (setFields.name as string) || existing.name;
    if (hostedLogoUrl) {
      const canonicalSlug = slugifyClub(finalName);
      await db.collection('club_assets').updateOne(
        { canonicalSlug },
        {
          $set: {
            name: finalName,
            canonicalSlug,
            logoUrl: hostedLogoUrl,
            partnerId: partnerObjId,
            entityKind: 'club',
            updatedAt: nowIso,
          },
          $addToSet: { aliases: finalName.toLowerCase() },
          $setOnInsert: { createdAt: nowIso },
        },
        { upsert: true }
      );
      await syncClubAssetAcrossEntities(db, {
        name: finalName,
        canonicalSlug,
        logoUrl: hostedLogoUrl,
        aliases: [finalName],
        partnerId: partnerObjId,
      });
    }

    const updated = await db.collection('partners').findOne({ _id: partnerObjId });
    if (updated) {
      try {
        await syncPartnerToV3Entity(updated);
      } catch (v3Err) {
        console.error('V3 sync warning on partner PUT:', v3Err);
      }
      void notifyCameraPartnerChanged(db, id, setFields);
    }

    return NextResponse.json({
      success: true,
      partner: updated
        ? {
            ...updated,
            _id: updated._id.toString(),
            organizationId: updated.organizationId ? String(updated.organizationId) : null,
            styleId: updated.styleId ? String(updated.styleId) : '',
            reportTemplateId: updated.reportTemplateId ? String(updated.reportTemplateId) : '',
            clickerSetId: updated.clickerSetId ? String(updated.clickerSetId) : '',
          }
        : null,
    });
  } catch (error) {
    console.error('Failed to update partner:', error);
    return NextResponse.json({ success: false, error: 'Failed to update partner' }, { status: 500 });
  }
}
