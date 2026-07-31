// app/api/admin/fix-mojibake-text/route.ts
// WHAT: Scans partners.name, organizations.name, and projects.eventName for
//     Windows-1252-decoded-as-UTF-8 mojibake (e.g. "VÃ¡ci" -> "Váci") and,
//     when explicitly confirmed, repairs it in place.
// WHY: This is stored data corruption, not a display bug -- it needs to be
//     fixed once in the database, not worked around per-view.
// HOW: Defaults to a dry run (reports what WOULD change, writes nothing).
//     Pass ?apply=1 to actually write the fixes. lib/textRepair.ts's
//     repairMojibake() never guesses -- it only returns a value for text
//     that's PROVABLY one layer of this specific corruption, so it's safe
//     to run repeatedly and safe on text in any other language/script.

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getAdminUser } from '@/lib/auth';
import getDb from '@/lib/db';
import { repairMojibake } from '@/lib/textRepair';

const CAP_PER_COLLECTION = 5000;

interface Candidate {
  id: string;
  before: string;
  after: string;
}

async function scanCollection(
  db: Awaited<ReturnType<typeof getDb>>,
  collection: string,
  field: string
): Promise<{ candidates: Candidate[]; scanned: number }> {
  const cursor = db.collection(collection).find(
    { [field]: { $type: 'string' } },
    { projection: { [field]: 1 } }
  ).limit(CAP_PER_COLLECTION);
  const docs = await cursor.toArray();
  const candidates: Candidate[] = [];
  for (const doc of docs) {
    const before = doc[field] as string;
    const after = repairMojibake(before);
    if (after !== null) {
      candidates.push({ id: String(doc._id), before, after });
    }
  }
  return { candidates, scanned: docs.length };
}

const TARGETS: Array<{ collection: string; field: string }> = [
  { collection: 'partners', field: 'name' },
  { collection: 'organizations', field: 'name' },
  { collection: 'projects', field: 'eventName' },
];

export async function GET(request: NextRequest) {
  const admin = await getAdminUser();
  if (!admin || (admin.role !== 'admin' && admin.role !== 'superadmin')) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const apply = request.nextUrl.searchParams.get('apply') === '1';
  const db = await getDb();

  const results: Record<string, { scanned: number; candidateCount: number; sample: Candidate[]; applied?: number }> = {};

  for (const target of TARGETS) {
    const { candidates, scanned } = await scanCollection(db, target.collection, target.field);
    const key = `${target.collection}.${target.field}`;
    results[key] = {
      scanned,
      candidateCount: candidates.length,
      sample: candidates.slice(0, 15),
    };

    if (apply && candidates.length > 0) {
      let applied = 0;
      for (const c of candidates) {
        await db.collection(target.collection).updateOne(
          { _id: new ObjectId(c.id) },
          { $set: { [target.field]: c.after } }
        );
        applied++;
      }
      results[key].applied = applied;
    }
  }

  return NextResponse.json({
    success: true,
    mode: apply ? 'applied' : 'dry_run',
    note: apply
      ? 'Fixes have been written.'
      : 'No changes written. Re-open this same URL with ?apply=1 to actually fix these.',
    results,
  });
}
