import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';

const SETS_COLLECTION = 'clickerSets';
const GROUPS_COLLECTION = 'variablesGroups';
const PARTNERS_COLLECTION = 'partners';

type ClickerSetDoc = {
  _id?: ObjectId;
  name: string;
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
  notes?: string;
};

async function ensureDefaultSet(db: any): Promise<ClickerSetDoc> {
  const existing = await db.collection(SETS_COLLECTION).findOne({ isDefault: true });
  if (existing) return existing;
  const now = new Date().toISOString();
  const doc: ClickerSetDoc = { name: 'Default Clicker', isDefault: true, createdAt: now, updatedAt: now };
  const result = await db.collection(SETS_COLLECTION).insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

async function getUsageCount(db: any, clickerSetId: ObjectId) {
  const partnerCount = await db.collection(PARTNERS_COLLECTION).countDocuments({
    $or: [{ clickerSetId }, { clickerSetId: clickerSetId.toString() }],
  });
  return { partnerCount };
}

export async function GET() {
  try {
    const db = await getDb();
    await ensureDefaultSet(db);
    const sets = await db.collection<ClickerSetDoc>(SETS_COLLECTION).find({}).sort({ isDefault: -1, name: 1 }).toArray();
    const usageMap = new Map<string, { partnerCount: number }>();
    for (const set of sets) {
      const usage = await getUsageCount(db, set._id as ObjectId);
      usageMap.set((set._id as ObjectId).toString(), usage);
    }
    const response = sets.map((s) => ({
      ...s,
      _id: s._id?.toString(),
      usage: usageMap.get((s._id as ObjectId).toString()) || { partnerCount: 0 },
    }));
    return NextResponse.json({ success: true, sets: response });
  } catch (e) {
    console.error('❌ clicker-sets GET failed', e);
    return NextResponse.json({ success: false, error: 'Failed to fetch clicker sets' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = await getDb();
    const body = await req.json();
    const { name, cloneFromId } = body || {};
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const doc: ClickerSetDoc = { name, isDefault: false, createdAt: now, updatedAt: now };
    const insertResult = await db.collection(SETS_COLLECTION).insertOne(doc);
    const newId = insertResult.insertedId;

    // Optional clone of variable groups
    if (cloneFromId && ObjectId.isValid(cloneFromId)) {
      const sourceId = new ObjectId(cloneFromId);
      const groups = await db.collection(GROUPS_COLLECTION).find({
        $or: [{ clickerSetId: sourceId }, { clickerSetId: sourceId.toString() }],
      }).toArray();
      if (groups.length > 0) {
        const cloned = groups.map((g: any) => ({
          ...g,
          _id: undefined,
          clickerSetId: newId.toString(),
          createdAt: now,
          updatedAt: now,
        }));
        if (cloned.length > 0) await db.collection(GROUPS_COLLECTION).insertMany(cloned);
      }
    }

    const saved = await db.collection(SETS_COLLECTION).findOne({ _id: newId });
    return NextResponse.json({ success: true, set: { ...saved, _id: newId.toString() } });
  } catch (e) {
    console.error('❌ clicker-sets POST failed', e);
    return NextResponse.json({ success: false, error: 'Failed to create clicker set' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const db = await getDb();
    const body = await req.json();
    const { clickerSetId, name, isDefault } = body || {};
    if (!clickerSetId || !ObjectId.isValid(clickerSetId)) {
      return NextResponse.json({ success: false, error: 'clickerSetId is required' }, { status: 400 });
    }
    const id = new ObjectId(clickerSetId);
    const update: any = { updatedAt: new Date().toISOString() };
    if (name !== undefined) update.name = name;
    if (isDefault === true) {
      await db.collection(SETS_COLLECTION).updateMany({}, { $set: { isDefault: false } });
      update.isDefault = true;
    }

    await db.collection(SETS_COLLECTION).updateOne({ _id: id }, { $set: update });
    const saved = await db.collection(SETS_COLLECTION).findOne({ _id: id });
    return NextResponse.json({ success: true, set: { ...saved, _id: clickerSetId } });
  } catch (e) {
    console.error('❌ clicker-sets PUT failed', e);
    return NextResponse.json({ success: false, error: 'Failed to update clicker set' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(req.url);
    const clickerSetId = searchParams.get('clickerSetId');
    if (!clickerSetId || !ObjectId.isValid(clickerSetId)) {
      return NextResponse.json({ success: false, error: 'clickerSetId is required' }, { status: 400 });
    }
    const id = new ObjectId(clickerSetId);
    const set = await db.collection(SETS_COLLECTION).findOne({ _id: id });
    if (!set) return NextResponse.json({ success: false, error: 'Set not found' }, { status: 404 });
    if (set.isDefault) {
      return NextResponse.json({ success: false, error: 'Cannot delete the default clicker set' }, { status: 400 });
    }
    const usage = await getUsageCount(db, id);
    if (usage.partnerCount > 0) {
      return NextResponse.json({ success: false, error: 'Cannot delete a clicker set in use by partners' }, { status: 400 });
    }
    await db.collection(SETS_COLLECTION).deleteOne({ _id: id });
    // Optionally also delete groups for this set
    await db.collection(GROUPS_COLLECTION).deleteMany({
      $or: [{ clickerSetId: id }, { clickerSetId: clickerSetId }],
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('❌ clicker-sets DELETE failed', e);
    return NextResponse.json({ success: false, error: 'Failed to delete clicker set' }, { status: 500 });
  }
}
