import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/apiGuards';
import { getDb, handleRouteError } from '@/lib/fanmassIntegration';
import { FANMASS_EVIDENCE_COLLECTION } from '@/lib/fanmassEvidence';
import { SPORT_FRANCHISES_DIRECTORY } from '@/lib/brandEntityClustering';

export const dynamic = 'force-dynamic';

export interface EvidenceCandidate {
  name: string;
  kind: 'brand' | 'club';
}

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const db = await getDb();
    const [partners, brandAssets, evidenceNames] = await Promise.all([
      db.collection('partners').find({}, { projection: { name: 1 } }).toArray(),
      db.collection('brand_assets').find({}, { projection: { name: 1 } }).toArray(),
      db
        .collection(FANMASS_EVIDENCE_COLLECTION)
        .aggregate<{ _id: { name?: string; kind?: string } }>([
          { $match: { name: { $type: 'string', $ne: '' } } },
          { $group: { _id: { name: '$name', kind: '$entityKind' } } },
          { $limit: 1000 },
        ])
        .toArray(),
    ]);

    const seen = new Map<string, EvidenceCandidate>();
    const add = (rawName: unknown, kind: 'brand' | 'club') => {
      const name = typeof rawName === 'string' ? rawName.trim() : '';
      if (!name) return;
      const key = `${kind}|${name.toLowerCase()}`;
      if (!seen.has(key)) seen.set(key, { name, kind });
    };

    for (const p of partners as Array<{ name?: string }>) add(p.name, 'club');
    for (const b of brandAssets as Array<{ name?: string }>) add(b.name, 'brand');
    for (const row of evidenceNames) {
      const kind = row._id?.kind === 'club' ? 'club' : 'brand';
      add(row._id?.name, kind);
    }
    for (const f of Object.values(SPORT_FRANCHISES_DIRECTORY)) {
      add(f.name, 'club');
    }

    const candidates = [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
    return NextResponse.json({ success: true, candidates });
  } catch (err) {
    return handleRouteError(err);
  }
}
