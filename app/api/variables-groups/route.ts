// app/api/variables-groups/route.ts
// WHAT: Manage Editor variable groups used to render clicker/manual from a single source.
// WHY: Decouple Editor UI from hard-coded categories; allow admin-defined grouping, ordering, and optional KPI headers.

import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDb } from '@/lib/db'

export const runtime = 'nodejs'

interface VariableGroupDoc {
  _id?: string
  groupOrder: number
  chartId?: string
  titleOverride?: string
  variables?: string[] // variable names in order (optional for special groups)
  specialType?: 'report-content' // Special group without variables (controls Report Content block)
  visibleInClicker?: boolean
  visibleInManual?: boolean
  createdAt?: string
  updatedAt?: string
  clickerSetId?: ObjectId // NEW: scope to clicker set
}

const COLLECTION = 'variablesGroups'
const CLICKER_SETS_COLLECTION = 'clickerSets'

async function ensureDefaultClickerSet(db: any) {
  let def = await db.collection(CLICKER_SETS_COLLECTION).findOne({ isDefault: true })
  if (!def) {
    const now = new Date().toISOString()
    const insert = await db.collection(CLICKER_SETS_COLLECTION).insertOne({
      name: 'Default Clicker',
      isDefault: true,
      createdAt: now,
      updatedAt: now,
    })
    def = { _id: insert.insertedId, name: 'Default Clicker', isDefault: true, createdAt: now, updatedAt: now }
  }
  return def
}

export async function GET(req: NextRequest) {
  try {
    const db = await getDb()
    const url = new URL(req.url)
    const clickerSetIdParam = url.searchParams.get('clickerSetId')

    const defaultSet = await ensureDefaultClickerSet(db)
    const hasExplicitSet = clickerSetIdParam && ObjectId.isValid(clickerSetIdParam)
    const clickerSetFilter = hasExplicitSet
      ? new ObjectId(clickerSetIdParam as string)
      : (defaultSet?._id as ObjectId)

    // Backfill legacy groups (no clickerSetId) into default set
    const missingCount = await db.collection(COLLECTION).countDocuments({ clickerSetId: { $exists: false } })
    if (missingCount > 0 && defaultSet?._id) {
      await db.collection(COLLECTION).updateMany(
        { clickerSetId: { $exists: false } },
        { $set: { clickerSetId: defaultSet._id } }
      )
    }

    const groups = await db.collection<VariableGroupDoc>(COLLECTION)
      .find({
        ...(hasExplicitSet
          ? { clickerSetId: clickerSetFilter }
          : {
              $or: [
                { clickerSetId: clickerSetFilter },
                { clickerSetId: { $exists: false } } // only for default
              ]
            })
      })
      .sort({ groupOrder: 1 })
      .toArray()

    return NextResponse.json({ success: true, groups })
  } catch (e) {
    console.error('❌ variables-groups GET failed', e)
    return NextResponse.json({ success: false, error: 'Failed to fetch variable groups' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = await getDb()
    const body = await req.json()
    const now = new Date().toISOString()
    const defaultSet = await ensureDefaultClickerSet(db)
    const clickerSetId: ObjectId = (body?.clickerSetId && ObjectId.isValid(body.clickerSetId))
      ? new ObjectId(body.clickerSetId)
      : (defaultSet._id as ObjectId)

    if (body?.seedDefault) {
      // Seed per your specification
      const existingCount = await db.collection(COLLECTION).countDocuments({})
      if (existingCount === 0) {
        const seed: VariableGroupDoc[] = [
          { groupOrder: 1, chartId: 'all-images-taken', titleOverride: undefined, variables: ['remoteImages','hostessImages','selfies'], visibleInClicker: true, visibleInManual: true, createdAt: now, updatedAt: now, clickerSetId },
          { groupOrder: 2, chartId: undefined, titleOverride: undefined, variables: ['remoteFans','stadium'], visibleInClicker: true, visibleInManual: true, createdAt: now, updatedAt: now, clickerSetId },
          { groupOrder: 3, chartId: undefined, titleOverride: undefined, variables: ['female','male'], visibleInClicker: true, visibleInManual: true, createdAt: now, updatedAt: now, clickerSetId },
          { groupOrder: 4, chartId: undefined, titleOverride: undefined, variables: ['genAlpha','genYZ','genX','boomer'], visibleInClicker: true, visibleInManual: true, createdAt: now, updatedAt: now, clickerSetId },
          { groupOrder: 5, chartId: undefined, titleOverride: undefined, variables: ['merched','jersey','scarf','flags','baseballCap','other'], visibleInClicker: true, visibleInManual: true, createdAt: now, updatedAt: now, clickerSetId },
          { groupOrder: 6, chartId: undefined, titleOverride: undefined, variables: ['approvedImages','rejectedImages'], visibleInClicker: true, visibleInManual: true, createdAt: now, updatedAt: now, clickerSetId },
          { groupOrder: 7, chartId: undefined, titleOverride: undefined, variables: ['visitQrCode','visitShortUrl','socialVisit','visitWeb','eventValuePropositionVisited','eventValuePropositionPurchases'], visibleInClicker: true, visibleInManual: true, createdAt: now, updatedAt: now, clickerSetId },
          { groupOrder: 8, chartId: undefined, titleOverride: undefined, variables: ['eventAttendees','eventResultHome','eventResultVisitor'], visibleInClicker: true, visibleInManual: true, createdAt: now, updatedAt: now, clickerSetId },
        ]
        await db.collection(COLLECTION).insertMany(seed as any)
      }
      const groups = await db.collection(COLLECTION).find({ clickerSetId }).sort({ groupOrder: 1 }).toArray()
      return NextResponse.json({ success: true, groups })
    }

    // Upsert a single group
    const group = body?.group as VariableGroupDoc
    if (!group || typeof group.groupOrder !== 'number') {
      return NextResponse.json({ success: false, error: 'Invalid group payload' }, { status: 400 })
    }

    // Validation: either a special group OR a variables array
    const isSpecial = group.specialType === 'report-content'
    if (!isSpecial && !Array.isArray(group.variables)) {
      return NextResponse.json({ success: false, error: 'Group must include variables[] unless specialType is set' }, { status: 400 })
    }

    const filter = { groupOrder: group.groupOrder, clickerSetId } as any
    const setDoc: Partial<VariableGroupDoc> = {
      groupOrder: group.groupOrder,
      chartId: group.chartId || undefined,
      titleOverride: group.titleOverride || undefined,
      variables: Array.isArray(group.variables) ? group.variables : undefined,
      specialType: group.specialType === 'report-content' ? 'report-content' : undefined,
      visibleInClicker: group.visibleInClicker !== undefined ? group.visibleInClicker : true,
      visibleInManual: group.visibleInManual !== undefined ? group.visibleInManual : true,
      clickerSetId,
      updatedAt: now,
    }
    const result = await db.collection(COLLECTION).updateOne(
      filter,
      { $set: setDoc, $setOnInsert: { createdAt: now } },
      { upsert: true }
    )
    const saved = await db.collection(COLLECTION).findOne(filter)
    return NextResponse.json({ success: true, group: saved })
  } catch (e) {
    console.error('❌ variables-groups POST failed', e)
    return NextResponse.json({ success: false, error: 'Failed to save variable group' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const db = await getDb()
    const url = new URL(req.url)
    const clickerSetIdParam = url.searchParams.get('clickerSetId')
    const groupOrderParam = url.searchParams.get('groupOrder')

    // Delete single group (scoped to clicker set)
    if (groupOrderParam) {
      const groupOrder = parseInt(groupOrderParam, 10)
      if (Number.isNaN(groupOrder)) {
        return NextResponse.json({ success: false, error: 'Invalid groupOrder' }, { status: 400 })
      }
      const defaultSet = await ensureDefaultClickerSet(db)
      const clickerSetId = clickerSetIdParam && ObjectId.isValid(clickerSetIdParam)
        ? new ObjectId(clickerSetIdParam)
        : (defaultSet?._id as ObjectId)
      const result = await db.collection(COLLECTION).deleteOne({ groupOrder, clickerSetId })
      return NextResponse.json({ success: true, deletedCount: result.deletedCount })
    }

    // Delete all groups for a set (or all legacy)
    if (clickerSetIdParam && ObjectId.isValid(clickerSetIdParam)) {
      await db.collection(COLLECTION).deleteMany({ clickerSetId: new ObjectId(clickerSetIdParam) })
    } else {
      await db.collection(COLLECTION).deleteMany({})
    }
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('❌ variables-groups DELETE failed', e)
    return NextResponse.json({ success: false, error: 'Failed to delete variable groups' }, { status: 500 })
  }
}
