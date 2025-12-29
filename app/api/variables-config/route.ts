// app/api/variables-config/route.ts
// WHAT: Variables configuration API - fully database-driven variable system
// WHY: ALL variables stored in MongoDB for dynamic configuration without code changes
// HOW: Read from variables_metadata collection (seeded from registry via npm run seed:variables)

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { error as logError, info as logInfo, debug as logDebug } from '@/lib/logger'

export const runtime = 'nodejs'

// WHAT: Collection name for variables metadata
// WHY: Single source of truth for all variables (system + custom)
const COLLECTION = 'variables_metadata'

// WHAT: TypeScript interfaces for variables_metadata collection
// WHY: Type safety for MongoDB documents
type VariableType = 'count' | 'percentage' | 'currency' | 'numeric' | 'text' | 'boolean' | 'date';

interface VariableFlags {
  visibleInClicker: boolean;
  editableInManual: boolean;
}

interface VariableMetadata {
  _id: any; // MongoDB ObjectId
  name: string; // Database field name: "female", "remoteImages" (no stats. prefix)
  label: string; // Display name: "Female", "Remote Images"
  type: VariableType;
  category: string; // "Images", "Demographics", etc.
  description?: string;
  unit?: string; // "€", "%", "clicks"
  derived: boolean;
  formula?: string;
  flags: VariableFlags;
  isSystem: boolean; // true = cannot delete (schema fields)
  order: number; // Sort order within category
  alias?: string; // User-defined display alias
  createdAt: string; // ISO 8601 with milliseconds (UTC)
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

// WHAT: In-memory cache for variables (performance optimization)
// WHY: Variables queried on every page load, expensive to fetch from DB each time
// HOW: Cache for 5 minutes, invalidate on any variable mutation
let variablesCache: {
  data: VariableMetadata[];
  timestamp: number;
} | null = null;

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function isCacheValid(): boolean {
  if (!variablesCache) return false;
  return Date.now() - variablesCache.timestamp < CACHE_TTL_MS;
}

function invalidateCache(): void {
  variablesCache = null;
}

// GET /api/variables-config
// WHAT: Fetch all variables from database with caching
// WHY: Single source of truth - all variables in MongoDB
// HOW: Check cache → fetch from variables_metadata → cache for 5 min
export async function GET() {
  try {
    // WHAT: Check cache first for performance
    // WHY: Variables queried on every page load
    if (isCacheValid() && variablesCache) {
      logDebug('Variables cache hit', { context: 'variables-config' });
      return NextResponse.json({ 
        success: true, 
        variables: variablesCache.data,
        cached: true 
      });
    }

    logDebug('Fetching variables from database', { context: 'variables-config' });
    const db = await getDb();

    // WHAT: Fetch all variables from database
    // WHY: Single source of truth - no more code registry
    const rawVariables = await db
      .collection(COLLECTION)
      .find({})
      .sort({ category: 1, order: 1, label: 1 })
      .toArray();

    logInfo('Loaded variables from database', { context: 'variables-config', count: rawVariables.length });

    // WHAT: Normalize legacy schema → v7 schema
    // WHY: Some databases store flags at root (visibleInClicker/editableInManual) instead of flags object
    // HOW: Build flags object if missing; default derived=false when absent
    const variables = (rawVariables as any[]).map((v) => {
      const hasFlagsObject = v && typeof v === 'object' && v.flags && typeof v.flags === 'object';
      const normalizedFlags = hasFlagsObject
        ? v.flags
        : {
            visibleInClicker: v?.visibleInClicker === true,
            editableInManual: v?.editableInManual !== false,
          };

      // WHAT: Provide a reliable non-empty label for UI
      // WHY: Some records only set `alias` (display label) or have missing/empty `label`
      // HOW: label = v.label || v.alias || Humanize(name)
      const rawName: string = typeof v?.name === 'string' ? v.name : '';
      const stripped = rawName.startsWith('stats.') ? rawName.slice(6) : rawName;
      const humanized = stripped
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/_/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/^\w/, (c) => c.toUpperCase());
      const effectiveLabel = (v?.label && String(v.label).trim().length > 0)
        ? v.label
        : (v?.alias && String(v.alias).trim().length > 0)
          ? v.alias
          : humanized;

      return {
        ...v,
        label: effectiveLabel,
        flags: normalizedFlags,
        derived: typeof v?.derived === 'boolean' ? v.derived : false,
      };
    });

    // WHAT: Update cache
    // WHY: Avoid DB query on every request
    variablesCache = {
      data: variables as any,
      timestamp: Date.now()
    };

    return NextResponse.json({ 
      success: true, 
      variables,
      count: variables.length,
      cached: false 
    });
  } catch (error) {
    logError('Failed to fetch variables-config', { context: 'variables-config' }, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch variables-config' 
    }, { status: 500 });
  }
}

// POST /api/variables-config
// WHAT: Create or update a variable in variables_metadata
// WHY: Allow dynamic variable creation without code changes
// HOW: Professional MongoDB upsert with proper $set / $setOnInsert separation
// 
// ═══════════════════════════════════════════════════════════════════════════════
// MongoDB Upsert Pattern - Comprehensive Guide
// ═══════════════════════════════════════════════════════════════════════════════
// 
// PROBLEM:
// When using upsert: true, MongoDB requires careful separation of:
//   • $set: Fields updated on BOTH insert and update
//   • $setOnInsert: Fields set ONLY on insert (ignored on update)
//   • A field CANNOT appear in both operators (causes conflict error)
// 
// SOLUTION:
// Two distinct patterns based on whether document exists:
// 
// PATTERN 1: NEW DOCUMENT (INSERT)
// • Check: !existing (document doesn't exist yet)
// • Strategy:
//   - $setOnInsert: { name, isSystem, createdAt } (immutable defaults)
//   - $set: { updatedAt, ...explicitlyProvidedFields }
//   - For missing required fields: Add defaults to $setOnInsert (NOT $set)
// • Example:
//   User provides: { name: 'stats.vipGuests', label: 'VIP', type: 'count' }
//   Result:
//     $setOnInsert: { name, isSystem: false, createdAt, category: 'Custom' }
//     $set: { updatedAt, label: 'VIP', type: 'count' }
// 
// PATTERN 2: EXISTING DOCUMENT (UPDATE)
// • Check: existing (document already in database)
// • Strategy:
//   - $set ONLY: { updatedAt, ...explicitlyProvidedFields }
//   - NO $setOnInsert (ignored anyway since doc exists)
// • Example:
//   User updates: { name: 'stats.female', label: 'Women' }
//   Result:
//     $set: { updatedAt, label: 'Women' }
// 
// KEY RULES:
// ✅ DO: Use $setOnInsert for immutable fields (name, createdAt, isSystem)
// ✅ DO: Use $set for updateable fields (label, type, category, flags)
// ✅ DO: Check (!('field' in $set)) before adding to $setOnInsert
// ❌ DON'T: Put same field in both $set and $setOnInsert
// ❌ DON'T: Use $setOnInsert when updating existing docs
// 
// NAMING CONVENTION:
// • Variable names MUST use format: stats.variableName
// • Examples: stats.female, stats.vipGuests, stats.remoteImages
// • See: VARIABLES_DATABASE_SCHEMA.md (line 21)
// 
// ═══════════════════════════════════════════════════════════════════════════════
// 
// Body examples:
// 1) Create new: { name: 'stats.vipGuests', label: 'VIP Guests', type: 'count', category: 'Event' }
// 2) Update existing: { name: 'stats.female', label: 'Women', flags: { visibleInClicker: true } }
export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    const body = await request.json();
    const now = new Date().toISOString();

    // WHAT: Validate required fields
    // WHY: Prevent invalid data in database
    const { name, label, type, category, description, unit, derived, formula, flags, order, alias } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ 
        success: false, 
        error: 'Variable name is required' 
      }, { status: 400 });
    }

    // WHAT: Name validation - Accept plain camelCase (no prefix required)
    // WHY: User wants to use exact same variable name everywhere (KYC, MongoDB, Algorithms)
    // RULE: Variable names MUST follow camelCase format (e.g., fanCount, vipGuests, female)
    // NOTE: System accepts both formats for backward compatibility, but stores as plain camelCase
    const normalizedName = name.startsWith('stats.') ? name.substring(6) : name;
    if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(normalizedName)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid variable name format. Must use camelCase (e.g., fanCount, vipGuests, female)' 
      }, { status: 400 });
    }

    const col = db.collection<VariableMetadata>(COLLECTION);
    
    // WHAT: Normalize variable name (remove stats. prefix if present)
    // WHY: Store variables as plain camelCase for consistency across KYC, MongoDB, and Algorithms
    const finalName = normalizedName;
    
    // WHAT: Check if variable exists (check both formats for backward compatibility)
    // WHY: Determine if update or create, protect system variables
    const existing = await col.findOne({ 
      $or: [
        { name: finalName },
        { name: `stats.${finalName}` }
      ]
    });

    // WHAT: Block name changes for system variables
    // WHY: System variables map to database schema fields
    const existingName = existing?.name || '';
    const existingNameNormalized = existingName.startsWith('stats.') ? existingName.substring(6) : existingName;
    if (existing?.isSystem && label && existingNameNormalized !== finalName) {
      return NextResponse.json({ 
        success: false, 
        error: 'Cannot change name of system variables' 
      }, { status: 403 });
    }

    // WHAT: For new variables, require full metadata
    // WHY: Can't create a variable without knowing its type and category
    if (!existing && (!label || !type || !category)) {
      return NextResponse.json({ 
        success: false, 
        error: 'New variables require: name, label, type, category' 
      }, { status: 400 });
    }

    // WHAT: Professional MongoDB upsert pattern - proper field separation
    // WHY: Prevent path conflicts between $set and $setOnInsert operators
    // PRINCIPLE: $setOnInsert = defaults for INSERT only, $set = updates for both INSERT and UPDATE
    // REFERENCE: MongoDB docs - https://docs.mongodb.com/manual/reference/operator/update/setOnInsert/
    
    const updateOperation: any = {};

    if (!existing) {
      // PATTERN 1: Creating NEW variable (INSERT)
      // STRATEGY: Put DEFAULTS in $setOnInsert, explicit values in $set
      // RATIONALE: $set applies to both insert and update, $setOnInsert only to insert
      
      updateOperation.$setOnInsert = {
        name: finalName,         // Immutable after creation - store as plain camelCase
        isSystem: false,        // Default for custom variables
        createdAt: now,         // Set once at creation
      };

      // WHAT: Build $set document with ONLY provided values
      // WHY: These override defaults and apply at insert time
      updateOperation.$set = {
        updatedAt: now,         // Always update timestamp
      };

      // CRITICAL: Add fields to $set ONLY if explicitly provided
      // This prevents conflicts - a field cannot be in both operators
      if (label) updateOperation.$set.label = label;
      if (type) updateOperation.$set.type = type;
      if (category) updateOperation.$set.category = category;
      if (description !== undefined) updateOperation.$set.description = description;
      if (unit !== undefined) updateOperation.$set.unit = unit;
      if (typeof derived === 'boolean') updateOperation.$set.derived = derived;
      if (formula !== undefined) updateOperation.$set.formula = formula;
      if (flags) updateOperation.$set.flags = flags;
      if (typeof order === 'number') updateOperation.$set.order = order;
      if (alias !== undefined) updateOperation.$set.alias = alias;

      // WHAT: Apply defaults in $setOnInsert for fields NOT in $set
      // WHY: Ensures required fields have values even if not provided
      if (!('label' in updateOperation.$set)) {
        updateOperation.$setOnInsert.label = name; // Fallback to name
      }
      if (!('type' in updateOperation.$set)) {
        updateOperation.$setOnInsert.type = 'count'; // Default type
      }
      if (!('category' in updateOperation.$set)) {
        updateOperation.$setOnInsert.category = 'Custom'; // Default category
      }
      if (!('derived' in updateOperation.$set)) {
        updateOperation.$setOnInsert.derived = false; // Default not derived
      }
      if (!('flags' in updateOperation.$set)) {
        updateOperation.$setOnInsert.flags = { visibleInClicker: false, editableInManual: true };
      }
      if (!('order' in updateOperation.$set)) {
        updateOperation.$setOnInsert.order = 999; // Default to end of list
      }

    } else {
      // PATTERN 2: Updating EXISTING variable (UPDATE)
      // STRATEGY: Use $set ONLY, no $setOnInsert
      // RATIONALE: Document already exists, $setOnInsert is ignored
      
      updateOperation.$set = {
        updatedAt: now,         // Always update timestamp
      };

      // WHAT: Build partial update document
      // WHY: Only update fields that were explicitly provided (partial updates)
      if (label) updateOperation.$set.label = label;
      if (type) updateOperation.$set.type = type;
      if (category) updateOperation.$set.category = category;
      if (description !== undefined) updateOperation.$set.description = description;
      if (unit !== undefined) updateOperation.$set.unit = unit;
      if (typeof derived === 'boolean') updateOperation.$set.derived = derived;
      if (formula !== undefined) updateOperation.$set.formula = formula;
      if (flags) updateOperation.$set.flags = flags;
      if (typeof order === 'number') updateOperation.$set.order = order;
      if (alias !== undefined) updateOperation.$set.alias = alias;
    }

    // WHAT: Use normalized name for query (handle both formats for backward compatibility)
    // WHY: Support existing variables with stats. prefix while storing new ones as plain camelCase
    const queryName = existing?.name || finalName;
    
    const result = await col.updateOne(
      { name: queryName },
      updateOperation,
      { upsert: true }
    );

    // WHAT: If existing variable had stats. prefix, migrate it to plain camelCase
    // WHY: Normalize all variables to plain camelCase format
    if (existing && existing.name.startsWith('stats.') && existing.name !== finalName) {
      await col.updateOne(
        { name: existing.name },
        { $set: { name: finalName, updatedAt: now } }
      );
    }

    // WHAT: Invalidate cache
    // WHY: Force next GET to fetch fresh data
    invalidateCache();
    logDebug('Variables cache invalidated', { context: 'variables-config' });

    const saved = await col.findOne({ name: finalName });

    return NextResponse.json({ 
      success: true, 
      variable: saved,
      created: result.upsertedCount > 0 
    });
  } catch (error) {
    logError('Failed to upsert variable', { context: 'variables-config' }, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to upsert variable' 
    }, { status: 500 });
  }
}

// PUT /api/variables-config?action=invalidateCache
// WHAT: Force invalidate the variables cache
// WHY: Allow immediate refresh when variables are added/updated in KYC
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'invalidateCache') {
      invalidateCache();
      logDebug('Variables cache manually invalidated', { context: 'variables-config' });
      return NextResponse.json({ 
        success: true, 
        message: 'Cache invalidated successfully' 
      });
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Unknown action' 
    }, { status: 400 });
  } catch (error) {
    logError('Failed to invalidate cache', { context: 'variables-config' }, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to invalidate cache' 
    }, { status: 500 });
  }
}

// DELETE /api/variables-config?name=variableName
// WHAT: Delete a custom variable
// WHY: Allow cleanup of unused or test variables
// RESTRICTION: Only custom variables (isSystem=false) can be deleted
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');

    if (!name) {
      return NextResponse.json({ 
        success: false, 
        error: 'Variable name is required' 
      }, { status: 400 });
    }

    const db = await getDb();
    const col = db.collection<VariableMetadata>(COLLECTION);

    // WHAT: Check if variable exists and is deletable
    // WHY: Prevent deletion of system variables
    const existing = await col.findOne({ name });

    if (!existing) {
      return NextResponse.json({ 
        success: false, 
        error: `Variable "${name}" not found` 
      }, { status: 404 });
    }

    if (existing.isSystem) {
      return NextResponse.json({ 
        success: false, 
        error: 'Cannot delete system variables' 
      }, { status: 403 });
    }

    // WHAT: Delete the variable
    const result = await col.deleteOne({ name });

    if (result.deletedCount === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to delete variable' 
      }, { status: 500 });
    }

    // WHAT: Invalidate cache
    invalidateCache();
    logInfo('Deleted variable', { context: 'variables-config', variableName: name });

    return NextResponse.json({ 
      success: true, 
      message: `Variable "${name}" deleted successfully` 
    });
  } catch (error) {
    console.error('❌ Failed to delete variable:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to delete variable' 
    }, { status: 500 });
  }
}
