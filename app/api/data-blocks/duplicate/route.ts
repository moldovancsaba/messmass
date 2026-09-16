// app/api/data-blocks/duplicate/route.ts
// WHAT: Duplicate an existing data block, recording which block it came from.
// WHY: messmass#230 (Activation Template Library) audit found the reusable
//     content unit already exists (`data_blocks`, several already named after
//     sponsor activation formats — "Hostess activity", "Commercial
//     Opportunities") but duplication happens by hand with no tracked lineage:
//     the whole system had exactly one literal "Copy of X" template. Without
//     lineage, "compare results across template runs" (the issue's own
//     acceptance check) has nothing to group by.
// HOW: Mirrors createReportVariant's pattern in lib/reportVariants.ts exactly
//     -- `createdFromVariantId` there, `sourceBlockId` here -- because that
//     pattern is proven, shipped, and delivering real lineage today. Additive
//     only: existing blocks are untouched, the field is optional, and nothing
//     currently reads it, so this cannot change any existing report's
//     behaviour. It is Phase A infrastructure, not the full template-library
//     feature -- naming, brand-placeholder substitution, and cross-instance
//     comparison are still open product decisions (see the issue).

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { requireAdmin } from '@/lib/apiGuards';
import clientPromise from '@/lib/mongodb';
import { error as logError } from '@/lib/logger';
import config from '@/lib/config';

const MONGODB_DB = config.dbName;

export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const body = await request.json();
    const sourceBlockId = typeof body?.sourceBlockId === 'string' ? body.sourceBlockId : '';
    const name = typeof body?.name === 'string' ? body.name.trim() : '';

    if (!sourceBlockId || !ObjectId.isValid(sourceBlockId)) {
      return NextResponse.json(
        { success: false, error: 'A valid sourceBlockId is required.' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(MONGODB_DB);
    const collection = db.collection('data_blocks');

    const source = await collection.findOne({ _id: new ObjectId(sourceBlockId) });
    if (!source) {
      return NextResponse.json(
        { success: false, error: 'Source block not found.' },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();
    const { _id: _sourceId, createdAt: _sourceCreatedAt, updatedAt: _sourceUpdatedAt, ...rest } = source;
    const duplicate = {
      ...rest,
      name: name || `${source.name} (copy)`,
      // The lineage this issue was missing. Optional and additive: nothing
      // reads it yet, so no existing block or report changes behaviour.
      sourceBlockId: source.sourceBlockId ? String(source.sourceBlockId) : String(source._id),
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(duplicate);

    return NextResponse.json({
      success: true,
      blockId: result.insertedId.toString(),
      block: { _id: result.insertedId.toString(), ...duplicate },
    });
  } catch (error) {
    logError(
      'Failed to duplicate data block',
      { context: 'data-blocks-duplicate' },
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { success: false, error: 'Failed to duplicate data block' },
      { status: 500 }
    );
  }
}
