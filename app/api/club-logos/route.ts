// app/api/club-logos/route.ts
// WHAT: Centralized Club, National Team & Federation Logo Management API for {messmass}.
// WHY: Single source of truth (`club_assets`) synced automatically to `partners`, `organizations`,
//      `v3_organizations`, `v3_entities`, Events, Project Partners, AI Reports, and Classic Reports.

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';
import { requireSession } from '@/lib/apiGuards';
import { downloadLogo, isStoredLogoUrl, storeLogo } from '@/lib/logoStorage';
import {
  canonicalizeClub,
  isGenericVisionDescription,
  mergeClubVariants,
  SPORT_FRANCHISES_DIRECTORY,
} from '@/lib/brandEntityClustering';
import {
  slugifyClub,
  syncClubAssetAcrossEntities,
  type ClubEntityKind,
} from '@/lib/clubLogoResolver';
import { notifyCameraPartnerChanged } from '@/lib/cameraThemeNotify';

export const dynamic = 'force-dynamic';

function isSvgUrl(url: string): boolean {
  const low = String(url || '').toLowerCase();
  return low.endsWith('.svg') || low.startsWith('data:image/svg+xml');
}

export async function GET() {
  const authError = await requireSession();
  if (authError) return authError;

  try {
    const client = await clientPromise;
    const db = client.db(config.dbName);

    const [assetsRaw, partners, orgs, mappings, summaries, visionDoc] = await Promise.all([
      db.collection('club_assets').find({}).sort({ name: 1 }).toArray(),
      db
        .collection('partners')
        .find({}, { projection: { _id: 1, name: 1, logoUrl: 1, emoji: 1, viewSlug: 1, partnerKind: 1, sportsDb: 1 } })
        .sort({ name: 1 })
        .toArray(),
      db
        .collection('organizations')
        .find({}, { projection: { _id: 1, name: 1, slug: 1, logoUrl: 1, 'metadata.logoUrl': 1 } })
        .sort({ name: 1 })
        .toArray(),
      db.collection('club_canonical_mappings').find({}).toArray(),
      db.collection('ai_analysis_summaries').find({}, { projection: { clubMentions: 1, 'summary.clubMentions': 1 } }).toArray(),
      db.collection('szrt_vision_progress').findOne({ _id: 'szrt_progress' as any }),
    ]);

    const aliasMap = new Map<string, string[]>();
    const mappedSources = new Set<string>();
    for (const m of mappings) {
      const alias = String(m.alias || '').trim();
      const target = String(m.targetClub || '').trim();
      if (!alias || !target) continue;
      mappedSources.add(alias.toLowerCase());
      const tSlug = slugifyClub(target);
      const list = aliasMap.get(tSlug) || [];
      if (!list.includes(alias.toLowerCase())) list.push(alias.toLowerCase());
      aliasMap.set(tSlug, list);
    }

    // Sightings count across AI reports
    const sightingsBySlug = new Map<string, number>();
    const addSighting = (rawName: string, cnt: number) => {
      if (!rawName || isGenericVisionDescription(rawName)) return;
      const canon = canonicalizeClub(rawName)?.canonicalName || rawName.trim();
      const sl = slugifyClub(canon);
      if (sl) sightingsBySlug.set(sl, (sightingsBySlug.get(sl) || 0) + (Number(cnt) || 1));
    };
    for (const s of summaries) {
      const list = s.clubMentions || s.summary?.clubMentions || [];
      for (const item of list) {
        addSighting(item.name || item.club || '', item.count || 1);
      }
    }
    for (const item of visionDoc?.aggregates?.topClubs || []) {
      addSighting(item.name || item.club || item.brand || '', item.count || 1);
    }

    const bySlug = new Map<string, any>();
    for (const a of assetsRaw) {
      const cSlug = String(a.canonicalSlug || slugifyClub(a.name || ''));
      if (!cSlug) continue;
      const extraAliases = aliasMap.get(cSlug) || [];
      const mergedAliases = Array.from(new Set([...(a.aliases || []).map((x: any) => String(x).toLowerCase()), ...extraAliases]));
      bySlug.set(cSlug, {
        _id: String(a._id),
        name: a.name,
        canonicalSlug: cSlug,
        aliases: mergedAliases,
        logoUrl: a.logoUrl || '',
        darkLogoUrl: a.darkLogoUrl || '',
        isVectorSvg: isSvgUrl(a.logoUrl || ''),
        entityKind: (a.entityKind as ClubEntityKind) || 'club',
        sport: a.sport || null,
        country: a.country || null,
        emoji: a.emoji || '🏟️',
        partnerId: a.partnerId ? String(a.partnerId) : null,
        organizationId: a.organizationId ? String(a.organizationId) : null,
        sightings: sightingsBySlug.get(cSlug) || 0,
        updatedAt: a.updatedAt,
      });
    }

    // Include any Organizations or Partners not yet in `club_assets`
    for (const o of orgs) {
      const cSlug = String(o.slug || slugifyClub(o.name || ''));
      if (!cSlug) continue;
      const logo = o.logoUrl || o.metadata?.logoUrl || '';
      const existing = bySlug.get(cSlug);
      if (existing) {
        if (!existing.organizationId) existing.organizationId = String(o._id);
        if (!existing.logoUrl && logo) {
          existing.logoUrl = logo;
          existing.isVectorSvg = isSvgUrl(logo);
        }
      } else {
        bySlug.set(cSlug, {
          name: o.name,
          canonicalSlug: cSlug,
          aliases: [o.name.toLowerCase(), cSlug],
          logoUrl: logo,
          darkLogoUrl: '',
          isVectorSvg: isSvgUrl(logo),
          entityKind: 'federation',
          sport: null,
          country: null,
          emoji: '🏆',
          partnerId: null,
          organizationId: String(o._id),
          sightings: sightingsBySlug.get(cSlug) || 0,
        });
      }
    }

    // Include any SPORT_FRANCHISES_DIRECTORY canonical entries that were sighted in AI reports
    for (const info of Object.values(SPORT_FRANCHISES_DIRECTORY)) {
      const cSlug = slugifyClub(info.name);
      if (!cSlug || bySlug.has(cSlug) || mappedSources.has(info.name.toLowerCase())) continue;
      if ((sightingsBySlug.get(cSlug) || 0) > 0) {
        bySlug.set(cSlug, {
          name: info.name,
          canonicalSlug: cSlug,
          aliases: [info.name.toLowerCase()],
          logoUrl: '',
          darkLogoUrl: '',
          isVectorSvg: false,
          entityKind: info.origin === 'National Team' ? 'national_team' : 'club',
          sport: info.sport,
          country: null,
          emoji: info.origin === 'National Team' ? '🏳️' : '🏟️',
          partnerId: null,
          organizationId: null,
          sightings: sightingsBySlug.get(cSlug) || 0,
          isDiscovered: true,
        });
      }
    }

    const allItems = Array.from(bySlug.values()).sort((a, b) => a.name.localeCompare(b.name));
    const configured = allItems.filter((item) => Boolean(item.logoUrl));
    const unconfigured = allItems.filter((item) => !item.logoUrl);

    return NextResponse.json({
      success: true,
      assets: configured,
      unconfigured,
      allClubs: allItems,
      partnersCount: partners.length,
      organizationsCount: orgs.length,
      svgCount: configured.filter((x) => x.isVectorSvg).length,
    });
  } catch (err: any) {
    console.error('Failed to fetch club logos:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authError = await requireSession();
  if (authError) return authError;

  try {
    const client = await clientPromise;
    const db = client.db(config.dbName);
    const now = new Date().toISOString();
    const contentType = request.headers.get('content-type') || '';

    // Branch A: JSON actions (`merge` or `move_to_brand` or metadata/URL upsert)
    if (contentType.includes('application/json')) {
      const body = await request.json();

      if (body.action === 'merge') {
        const sourceClubs: string[] = Array.isArray(body.sourceClubs)
          ? body.sourceClubs.map((s: unknown) => String(s || '').trim()).filter(Boolean)
          : [];
        const targetClub = String(body.targetClub || '').trim();
        if (!targetClub || sourceClubs.length === 0) {
          return NextResponse.json({ success: false, error: 'sourceClubs and targetClub are required' }, { status: 400 });
        }

        const targetSlug = slugifyClub(targetClub);
        const targetAsset = await db.collection('club_assets').findOne({ canonicalSlug: targetSlug });

        const ops = sourceClubs.map((src) => ({
          updateOne: {
            filter: { aliasLower: src.toLowerCase() },
            update: {
              $set: {
                alias: src,
                aliasLower: src.toLowerCase(),
                targetClub,
                ...(targetAsset?.partnerId ? { partnerId: targetAsset.partnerId } : {}),
                updatedAt: now,
              },
              $setOnInsert: { createdAt: now },
            },
            upsert: true,
          },
        }));
        await db.collection('club_canonical_mappings').bulkWrite(ops, { ordered: false });

        // Fold aliases into target club_assets and snapshot + remove redundant source club_assets
        const sourceSlugs = sourceClubs.map(slugifyClub).filter((s) => s && s !== targetSlug);
        if (sourceSlugs.length > 0) {
          const sourceDocs = await db.collection('club_assets').find({ canonicalSlug: { $in: sourceSlugs } }).toArray();
          if (sourceDocs.length > 0) {
            await db.collection('club_assets_backup').insertMany(
              sourceDocs.map((d) => ({ ...d, _id: new ObjectId(), originalId: d._id, reason: 'merge', backedUpAt: now }))
            );
          }
          const inheritedLogo = !targetAsset?.logoUrl ? sourceDocs.find((d) => d.logoUrl)?.logoUrl : undefined;
          const newAliases = Array.from(
            new Set([
              targetClub.toLowerCase(),
              ...(targetAsset?.aliases || []),
              ...sourceClubs.map((s) => s.toLowerCase()),
              ...sourceDocs.flatMap((d) => d.aliases || []),
            ])
          );
          await db.collection('club_assets').updateOne(
            { canonicalSlug: targetSlug },
            {
              $set: {
                name: targetAsset?.name || targetClub,
                canonicalSlug: targetSlug,
                aliases: newAliases,
                ...(inheritedLogo ? { logoUrl: inheritedLogo } : {}),
                updatedAt: now,
              },
              $setOnInsert: {
                 ...(inheritedLogo ? {} : { logoUrl: '' }),
                entityKind: 'club',
                emoji: '🏟️',
                createdAt: now,
              },
            },
            { upsert: true }
          );
          await db.collection('club_assets').deleteMany({ canonicalSlug: { $in: sourceSlugs } });
        }

        // Fold SZRT vision aggregates if present
        const visionDoc = await db.collection('szrt_vision_progress').findOne({ _id: 'szrt_progress' as any });
        if (Array.isArray(visionDoc?.aggregates?.topClubs)) {
          const aMap: Record<string, string> = {};
          for (const s of sourceClubs) aMap[s.toLowerCase()] = targetClub;
          const folded = mergeClubVariants(
            visionDoc.aggregates.topClubs.map((c: any) => ({ ...c, name: String(c.name || c.brand || '') })),
            aMap
          );
          await db.collection('szrt_vision_progress').updateOne(
            { _id: 'szrt_progress' as any },
            { $set: { 'aggregates.topClubs': folded, updatedAt: now } }
          );
        }
        await db.collection('report_snapshots').deleteMany({}).catch(() => null);
        return NextResponse.json({ success: true, mergedCount: sourceClubs.length, targetClub });
      }

      if (body.action === 'move_to_brand') {
        const clubName = String(body.clubName || '').trim();
        const targetBrandName = String(body.targetBrandName || clubName).trim();
        if (!clubName) {
          return NextResponse.json({ success: false, error: 'clubName is required' }, { status: 400 });
        }
        const sourceSlug = slugifyClub(clubName);
        const brandSlug = slugifyClub(targetBrandName);
        const sourceAsset = await db.collection('club_assets').findOne({ canonicalSlug: sourceSlug });
        if (sourceAsset) {
          await db.collection('club_assets_backup').insertOne({
            ...sourceAsset,
            _id: new ObjectId(),
            originalId: sourceAsset._id,
            reason: 'move_to_brand',
            backedUpAt: now,
          });
        }
        const existingBrand = await db.collection('brand_assets').findOne({ canonicalSlug: brandSlug });
        const mergedAliases = Array.from(
          new Set([targetBrandName.toLowerCase(), clubName.toLowerCase(), ...(existingBrand?.aliases || [])])
        );
        const carryLogo = !existingBrand?.logoUrl && sourceAsset?.logoUrl ? sourceAsset.logoUrl : undefined;
        await db.collection('brand_assets').updateOne(
          { canonicalSlug: brandSlug },
          {
            $set: {
              name: existingBrand?.name || targetBrandName,
              canonicalSlug: brandSlug,
              aliases: mergedAliases,
              ...(carryLogo ? { logoUrl: carryLogo } : {}),
              updatedAt: now,
            },
            $setOnInsert: {
              ...(carryLogo ? {} : { logoUrl: '' }),
              category: 'Sponsor',
              createdAt: now,
            },
          },
          { upsert: true }
        );
        if (sourceAsset) {
          await db.collection('club_assets').deleteOne({ _id: sourceAsset._id });
        }
        await db.collection('report_snapshots').deleteMany({}).catch(() => null);
        return NextResponse.json({ success: true, movedToBrand: targetBrandName });
      }
    }

    // Branch B: Create or Update Club Asset (Multipart File Upload OR Form/JSON URL)
    let name = '';
    let canonicalSlugInput = '';
    let logoUrl = '';
    let darkLogoUrl = '';
    let entityKind: ClubEntityKind = 'club';
    let sport = '';
    let country = '';
    let emoji = '🏟️';
    let partnerIdRaw = '';
    let organizationIdRaw = '';
    let aliases: string[] = [];

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      name = String(form.get('name') || '').trim();
      canonicalSlugInput = String(form.get('canonicalSlug') || '').trim();
      logoUrl = String(form.get('logoUrl') || '').trim();
      darkLogoUrl = String(form.get('darkLogoUrl') || '').trim();
      entityKind = (String(form.get('entityKind') || 'club').trim() as ClubEntityKind) || 'club';
      sport = String(form.get('sport') || '').trim();
      country = String(form.get('country') || '').trim();
      emoji = String(form.get('emoji') || '🏟️').trim() || '🏟️';
      partnerIdRaw = String(form.get('partnerId') || '').trim();
      organizationIdRaw = String(form.get('organizationId') || '').trim();
      const aliasesStr = String(form.get('aliases') || '').trim();
      if (aliasesStr) {
        aliases = aliasesStr.split(',').map((a) => a.trim().toLowerCase()).filter(Boolean);
      }

      const file = form.get('file') as File | null;
      if (file && file.size > 0) {
        const bytes = Buffer.from(await file.arrayBuffer());
        const stored = await storeLogo(bytes);
        if (stored?.url) {
          logoUrl = stored.url;
        } else {
          // Fallback to data URI only if R2 is unconfigured in local dev
          const mime = file.type || (file.name.toLowerCase().endsWith('.svg') ? 'image/svg+xml' : 'image/png');
          logoUrl = `data:${mime};base64,${bytes.toString('base64')}`;
        }
      } else if (logoUrl && logoUrl.startsWith('https://') && !isStoredLogoUrl(logoUrl)) {
        const dl = await downloadLogo(logoUrl);
        if (dl) {
          const stored = await storeLogo(dl);
          if (stored?.url) logoUrl = stored.url;
        }
      }
    } else {
      const body = await request.json();
      name = String(body.name || '').trim();
      canonicalSlugInput = String(body.canonicalSlug || '').trim();
      logoUrl = String(body.logoUrl || '').trim();
      darkLogoUrl = String(body.darkLogoUrl || '').trim();
      entityKind = (body.entityKind as ClubEntityKind) || 'club';
      sport = String(body.sport || '').trim();
      country = String(body.country || '').trim();
      emoji = String(body.emoji || '🏟️').trim() || '🏟️';
      partnerIdRaw = String(body.partnerId || '').trim();
      organizationIdRaw = String(body.organizationId || '').trim();
      if (Array.isArray(body.aliases)) {
        aliases = body.aliases.map((a: unknown) => String(a || '').trim().toLowerCase()).filter(Boolean);
      }
      if (logoUrl && logoUrl.startsWith('https://') && !isStoredLogoUrl(logoUrl)) {
        const dl = await downloadLogo(logoUrl);
        if (dl) {
          const stored = await storeLogo(dl);
          if (stored?.url) logoUrl = stored.url;
        }
      }
    }

    if (!name) {
      return NextResponse.json({ success: false, error: 'Club / Team name is required' }, { status: 400 });
    }

    const canonicalSlug = slugifyClub(canonicalSlugInput || name);
    const existing = await db.collection('club_assets').findOne({ canonicalSlug });

    // Pre-mutation backup snapshot (`preflight-data-safety` law)
    if (existing) {
      await db.collection('club_assets_backup').insertOne({
        ...existing,
        _id: new ObjectId(),
        originalId: existing._id,
        reason: 'update',
        backedUpAt: now,
      });
    }

    const finalLogoUrl = logoUrl || existing?.logoUrl || '';
    const mergedAliases = Array.from(
      new Set([name.toLowerCase(), ...aliases, ...(existing?.aliases || []).map((a: any) => String(a).toLowerCase())])
    ).filter(Boolean);

    const partnerObjId =
      partnerIdRaw && ObjectId.isValid(partnerIdRaw)
        ? new ObjectId(partnerIdRaw)
        : existing?.partnerId || null;
    const orgObjId =
      organizationIdRaw && ObjectId.isValid(organizationIdRaw)
        ? new ObjectId(organizationIdRaw)
        : existing?.organizationId || null;

    const setFields: Record<string, unknown> = {
      name,
      canonicalSlug,
      aliases: mergedAliases,
      entityKind,
      sport: sport || existing?.sport || null,
      country: country || existing?.country || null,
      emoji: emoji || existing?.emoji || '🏟️',
      partnerId: partnerObjId,
      organizationId: orgObjId,
      updatedAt: now,
    };
    if (finalLogoUrl) setFields.logoUrl = finalLogoUrl;
    if (darkLogoUrl) setFields.darkLogoUrl = darkLogoUrl;

    await db.collection('club_assets').updateOne(
      { canonicalSlug },
      {
        $set: setFields,
        $setOnInsert: {
          ...(finalLogoUrl ? {} : { logoUrl: '' }),
          createdAt: now,
        },
      },
      { upsert: true }
    );

    // Propagate logo across Partners, Organizations, V3 Entities, and Camera
    const syncResult = finalLogoUrl
      ? await syncClubAssetAcrossEntities(db, {
          name,
          canonicalSlug,
          logoUrl: finalLogoUrl,
          aliases: mergedAliases,
          partnerId: partnerObjId,
          organizationId: orgObjId,
        })
      : { updatedPartnerIds: [], updatedOrgIds: [] };

    for (const pid of syncResult.updatedPartnerIds) {
      void notifyCameraPartnerChanged(db, pid, { logoUrl: finalLogoUrl });
    }

    const saved = await db.collection('club_assets').findOne({ canonicalSlug });
    return NextResponse.json({
      success: true,
      asset: saved ? { ...saved, _id: String(saved._id) } : null,
      syncedPartners: syncResult.updatedPartnerIds.length,
      syncedOrganizations: syncResult.updatedOrgIds.length,
    });
  } catch (err: any) {
    console.error('Failed to save club logo:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
