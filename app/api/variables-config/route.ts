// app/api/variables-config/route.ts
// WHAT: Variables configuration API to control per-variable visibility in the clicker UI and editability in manual mode,
//       and to allow creation of custom variables beyond the built-in registry.
// WHY: The Editor (clicker/manual) must respect admin-driven configuration for which variables appear where. Persisting
//      these flags and optional custom variable definitions in MongoDB enables system-wide control without code changes.

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getAllVariableDefinitions, VariableDefinition } from '@/lib/variablesRegistry'

export const runtime = 'nodejs'

// Collection name centralization for easier maintenance
const COLLECTION = 'variablesConfig'

// Flags type carried alongside variables
type Flags = {
  visibleInClicker: boolean
  editableInManual: boolean
}

// DB document shape. For registry variables we may only store flags; for custom variables we also store metadata.
interface VariableConfigDoc {
  _id: string // equals name for easy upsert/lookups
  name: string
  // Optional custom meta (present when isCustom === true)
  label?: string
  type?: VariableDefinition['type']
  category?: string
  description?: string
  derived?: boolean
  formula?: string
  isCustom?: boolean
  // Flags and ordering
  flags: Flags
  clickerOrder?: number
  manualOrder?: number
  createdAt?: string
  updatedAt?: string
}

// Determine default flags by variable meta (registry or custom)
function defaultFlagsForVariable(v: VariableDefinition): Flags {
  // Strategy (Why):
  // - Core count metrics used during live capture should be available in Clicker and Manual by default for speed.
  // - Success/engagement/event style metrics are typically edited post-event → Manual only by default.
  // - Derived and text variables are not user-editable → disabled in both contexts.
  if (v.derived) return { visibleInClicker: false, editableInManual: false }
  if (v.type === 'text') return { visibleInClicker: false, editableInManual: false }

  // Category-based defaults (matches registry categories)
  const cat = (v.category || '').toLowerCase()
  if (['images', 'fans', 'demographics', 'merchandise'].includes(cat)) {
    return { visibleInClicker: true, editableInManual: true }
  }
  if (['moderation', 'visits', 'event'].includes(cat)) {
    return { visibleInClicker: false, editableInManual: true }
  }

  // Fallback: be conservative (manual only) for unknown categories
  return { visibleInClicker: false, editableInManual: true }
}

// GET /api/variables-config
// - Merges registry variables with DB overrides
// - Adds custom variables stored in DB
export async function GET() {
  try {
    const db = await getDb()

    // Load hashtag categories to build text variables via registry helper.
    const categories = await db
      .collection('hashtagCategories')
      .find({}, { projection: { name: 1 } })
      .toArray()
    const simplified = categories.map((c: any) => ({ name: c.name }))

    const registry = getAllVariableDefinitions(simplified)
    const registryByName = new Map(registry.map(v => [v.name, v]))

    // Build a default order by registry position
    const defaultOrderByName = new Map<string, number>()
    registry.forEach((v, idx) => defaultOrderByName.set(v.name, idx))

    const configDocs: VariableConfigDoc[] = await db
      .collection<VariableConfigDoc>(COLLECTION)
      .find({})
      .toArray()
    const flagsByName = new Map<string, Flags>()
    const orderByName = new Map<string, number>()
    const manualOrderByName = new Map<string, number>()
    const customDefs: VariableDefinition[] = []
    const metaOverrideByName = new Map<string, Partial<VariableDefinition>>()

    for (const doc of configDocs) {
      if (doc.flags) flagsByName.set(doc.name, doc.flags)
      if (typeof doc.clickerOrder === 'number') orderByName.set(doc.name, doc.clickerOrder)
      if (typeof doc.manualOrder === 'number') manualOrderByName.set(doc.name, doc.manualOrder)
      if (doc.isCustom && doc.label && doc.type && doc.category) {
        customDefs.push({
          name: doc.name,
          label: doc.label,
          type: doc.type,
          category: doc.category,
          description: doc.description,
          derived: !!doc.derived,
          formula: doc.formula,
        })
      } else {
        // Allow overriding registry meta via config doc even if not custom
        const override: Partial<VariableDefinition> = {}
        if (doc.label) override.label = doc.label
        if (doc.type) override.type = doc.type
        if (doc.category) override.category = doc.category
        if (doc.description) override.description = doc.description
        if (typeof doc.derived === 'boolean') override.derived = doc.derived
        if (doc.formula) override.formula = doc.formula
        if (Object.keys(override).length > 0) metaOverrideByName.set(doc.name, override)
      }
    }

    // Merge registry + custom (custom can shadow by unique name if not colliding)
    type MergedVar = VariableDefinition & { flags: Flags; isCustom?: boolean; clickerOrder?: number; manualOrder?: number }
    const merged: MergedVar[] = []

    // 1) Add all registry variables with flags/overrides
    for (const v of registry) {
      const flags = flagsByName.get(v.name) || defaultFlagsForVariable(v)
      const order = orderByName.get(v.name) ?? defaultOrderByName.get(v.name)
      const manualOrder = manualOrderByName.get(v.name)
      const meta = metaOverrideByName.get(v.name)
      const withMeta = meta ? { ...v, ...meta } : v
      merged.push({ ...withMeta, flags, clickerOrder: order, manualOrder })
    }

    // 2) Add custom variables not present in registry
    for (const c of customDefs) {
      if (!registryByName.has(c.name)) {
        // Custom defaults follow same policy
        const flags = flagsByName.get(c.name) || defaultFlagsForVariable(c)
        const order = orderByName.get(c.name) ?? defaultOrderByName.get(c.name) ?? Number.MAX_SAFE_INTEGER
        merged.push({ ...c, flags, isCustom: true, clickerOrder: order })
      }
    }

    // Sort deterministically: category asc, then label asc
    merged.sort((a, b) => a.category.localeCompare(b.category) || a.label.localeCompare(b.label))

    return NextResponse.json({ success: true, variables: merged })
  } catch (error) {
    console.error('❌ Failed to fetch variables-config:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch variables-config' }, { status: 500 })
  }
}

// POST /api/variables-config
// Upsert flags for a registry variable OR create/update a custom variable definition with flags.
// Body examples:
// 1) Flags only (registry var): { name: 'remoteImages', flags: { visibleInClicker: true, editableInManual: false } }
// 2) Custom variable: { name, label, type, category, description?, derived?, formula?, flags? }
export async function POST(request: NextRequest) {
  try {
    const db = await getDb()
    const body = await request.json()

    // Prepare registry lookup (for isCustom inference)
    const dbForRegistry = await getDb()
    const categoriesForRegistry = await dbForRegistry
      .collection('hashtagCategories')
      .find({}, { projection: { name: 1 } })
      .toArray()
    const simplifiedForRegistry = categoriesForRegistry.map((c: any) => ({ name: c.name }))
    const registryForPost = getAllVariableDefinitions(simplifiedForRegistry)
    const registryNameSet = new Set(registryForPost.map(v => v.name))

    const now = new Date().toISOString() // ISO 8601 with milliseconds (UTC)

    const name: string | undefined = body?.name
    const incomingOrder: number | undefined = typeof body?.clickerOrder === 'number' ? body.clickerOrder : undefined
    const incomingManualOrder: number | undefined = typeof body?.manualOrder === 'number' ? body.manualOrder : undefined
    if (!name || typeof name !== 'string' || name.length < 2) {
      return NextResponse.json({ success: false, error: 'Invalid name' }, { status: 400 })
    }

    // Determine intent: flags-only vs custom definition
    const hasMeta = !!(body.label && body.type && body.category)

    // Validation for custom variable names to avoid collisions and weird chars.
    if (hasMeta) {
      // Allow camelCase and underscores; disallow spaces and special chars to keep stats keys JSON-safe.
      if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(name)) {
        return NextResponse.json({ success: false, error: 'Invalid custom variable name format' }, { status: 400 })
      }
    }

    const col = db.collection<VariableConfigDoc>(COLLECTION)

    // Load existing to preserve fields on partial updates
    const existing = await col.findOne({ _id: name })

    // Build doc pieces
    const flags: Flags | undefined = body.flags
    let setDoc: Partial<VariableConfigDoc> = {
      name,
      updatedAt: now,
    }
    if (typeof incomingOrder === 'number') {
      setDoc.clickerOrder = incomingOrder
    }
    if (typeof incomingManualOrder === 'number') {
      setDoc.manualOrder = incomingManualOrder
    }

    if (hasMeta) {
      setDoc = {
        ...setDoc,
        label: String(body.label),
        type: body.type,
        category: String(body.category),
        description: body.description ? String(body.description) : undefined,
        derived: !!body.derived,
        formula: body.formula ? String(body.formula) : undefined,
        // Only mark as custom if the name is not a known registry variable
        isCustom: !registryNameSet.has(name),
      }
    }

    // If flags not provided, compute defaults based on meta (from registry for known names or from provided meta)
    let effectiveFlags: Flags | undefined = flags
    if (!effectiveFlags) {
      // Preserve existing flags when not provided
      if (existing?.flags) {
        effectiveFlags = existing.flags
      } else {
        // Find meta source for default flags
        let meta: VariableDefinition | undefined
        if (hasMeta) {
          meta = {
            name,
            label: setDoc.label!,
            type: setDoc.type!,
            category: setDoc.category!,
            description: setDoc.description,
            derived: !!setDoc.derived,
            formula: setDoc.formula,
          }
        } else {
          // Try to resolve from registry to compute defaults
          const categories = await db
            .collection('hashtagCategories')
            .find({}, { projection: { name: 1 } })
            .toArray()
          const simplified = categories.map((c: any) => ({ name: c.name }))
          const registry = getAllVariableDefinitions(simplified)
          meta = registry.find(v => v.name === name)
        }
        if (meta) effectiveFlags = defaultFlagsForVariable(meta)
      }
    }

    if (effectiveFlags) {
      setDoc.flags = effectiveFlags
    }
    // Ensure flags present even if not provided
    if (!setDoc.flags) {
      setDoc.flags = { visibleInClicker: false, editableInManual: false }
    }

    const result = await col.updateOne(
      { _id: name },
      {
        $set: setDoc,
        $setOnInsert: {
          _id: name,
          createdAt: now,
        },
      },
      { upsert: true }
    )

    const saved = await col.findOne({ _id: name })

    return NextResponse.json({ success: true, variable: saved })
  } catch (error) {
    console.error('❌ Failed to upsert variables-config:', error)
    return NextResponse.json({ success: false, error: 'Failed to upsert variables-config' }, { status: 500 })
  }
}
