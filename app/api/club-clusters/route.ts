// app/api/club-clusters/route.ts
// WHAT: Clubs & Teams Clustering and Canonical Deduplication API.
// WHY: Parallel to /api/brand-assets merging, lets admins consolidate duplicate detected
//      club/team names (e.g. "FTC" / "Ferencvárosi TC") into canonical club records and
//      link them to Messmass Partners.

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';
import { requireSession } from '@/lib/apiGuards';
import {
  canonicalizeClub,
  mergeClubVariants,
  suggestClubClusters,
} from '@/lib/brandEntityClustering';

export const dynamic = 'force-dynamic';

export async function GET() {
  const authError = await requireSession();
  if (authError) return authError;

  try {
    const client = await clientPromise;
    const db = client.db(config.dbName);

    const [partners, mappings, reclassified, visionDoc] = await Promise.all([
      db
        .collection('partners')
        .find({}, { projection: { _id: 1, name: 1, emoji: 1, viewSlug: 1, organizationId: 1, 'sportsDb.strSport': 1 } })
        .sort({ name: 1 })
        .toArray(),
      db.collection('club_canonical_mappings').find({}).sort({ targetClub: 1, alias: 1 }).toArray(),
      db.collection('reclassified_clubs').find({}).toArray(),
      db.collection('szrt_vision_progress').findOne({ _id: 'szrt_progress' as any }),
    ]);

    const aliasMap: Record<string, string> = {};
    for (const m of mappings) {
      if (m.alias && m.targetClub) {
        aliasMap[String(m.alias).toLowerCase().trim()] = String(m.targetClub).trim();
      }
    }

    const clubCountMap = new Map<string, number>();
    const topClubs = Array.isArray(visionDoc?.aggregates?.topClubs) ? visionDoc.aggregates.topClubs : [];
    for (const c of topClubs) {
      const name = String(c.name || c.brand || '').trim();
      if (!name) continue;
      clubCountMap.set(name, (clubCountMap.get(name) ?? 0) + (Number(c.count) || 0));
    }
    for (const r of reclassified) {
      const name = String(r.name || '').trim();
      if (name && !clubCountMap.has(name)) {
        clubCountMap.set(name, 1);
      }
    }

    const rawClubs = [...clubCountMap.entries()]
      .map(([name, count]) => ({
        name,
        count,
        canonicalSuggestion: aliasMap[name.toLowerCase()] || canonicalizeClub(name)?.canonicalName || null,
      }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

    const suggestions = suggestClubClusters(rawClubs, aliasMap);
    const mergedClubs = mergeClubVariants(rawClubs, aliasMap);

    return NextResponse.json({
      success: true,
      rawClubs,
      mergedClubs,
      suggestions,
      mappings: mappings.map((m) => ({
        _id: String(m._id),
        alias: m.alias,
        targetClub: m.targetClub,
        partnerId: m.partnerId ? String(m.partnerId) : null,
        updatedAt: m.updatedAt,
      })),
      partners: partners.map((p) => ({
        _id: String(p._id),
        name: p.name,
        emoji: p.emoji || '🏟️',
        viewSlug: p.viewSlug,
        sport: p.sportsDb?.strSport || null,
      })),
    });
  } catch (err: any) {
    console.error('Failed to load club clusters:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authError = await requireSession();
  if (authError) return authError;

  try {
    const body = await request.json();
    const sourceClubs: string[] = Array.isArray(body?.sourceClubs)
      ? body.sourceClubs.map((s: unknown) => String(s || '').trim()).filter(Boolean)
      : [];
    const targetClub = String(body?.targetClub || '').trim();
    const partnerId = body?.partnerId && ObjectId.isValid(String(body.partnerId)) ? new ObjectId(String(body.partnerId)) : null;

    if (!targetClub || sourceClubs.length === 0) {
      return NextResponse.json(
        { success: false, error: 'sourceClubs (non-empty array) and targetClub are required' },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db(config.dbName);
    const now = new Date().toISOString();

    const ops = sourceClubs.map((src) => ({
      updateOne: {
        filter: { aliasLower: src.toLowerCase() },
        update: {
          $set: {
            alias: src,
            aliasLower: src.toLowerCase(),
            targetClub,
            ...(partnerId ? { partnerId } : {}),
            updatedAt: now,
          },
          $setOnInsert: { createdAt: now },
        },
        upsert: true,
      },
    }));
    await db.collection('club_canonical_mappings').bulkWrite(ops, { ordered: false });

    // Fold any matching entries inside szrt_vision_progress.aggregates.topClubs
    const visionDoc = await db.collection('szrt_vision_progress').findOne({ _id: 'szrt_progress' as any });
    if (visionDoc?.aggregates?.topClubs && Array.isArray(visionDoc.aggregates.topClubs)) {
      const aliasMap: Record<string, string> = {};
      for (const s of sourceClubs) {
        aliasMap[s.toLowerCase()] = targetClub;
      }
      const normalized = visionDoc.aggregates.topClubs.map((c: any) => ({
        ...c,
        name: String(c.name || c.brand || ''),
      }));
      const folded = mergeClubVariants(normalized, aliasMap);
      await db.collection('szrt_vision_progress').updateOne(
        { _id: 'szrt_progress' as any },
        { $set: { 'aggregates.topClubs': folded, updatedAt: now } },
      );
    }

    return NextResponse.json({
      success: true,
      mergedCount: sourceClubs.length,
      targetClub,
    });
  } catch (err: any) {
    console.error('Failed to merge club cluster:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
