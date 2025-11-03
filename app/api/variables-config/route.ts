// app/api/variables-config/route.ts
// WHAT: Variables configuration API - fully database-driven variable system
// WHY: ALL variables stored in MongoDB for dynamic configuration without code changes
// HOW: Read from variables_metadata collection (seeded from registry via npm run seed:variables)

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

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
      console.log('✅ Variables cache hit');
      return NextResponse.json({ 
        success: true, 
        variables: variablesCache.data,
        cached: true 
      });
    }

    console.log('📊 Fetching variables from database...');
    const db = await getDb();

    // WHAT: Fetch all variables from database
    // WHY: Single source of truth - no more code registry
    const variables = await db
      .collection<VariableMetadata>(COLLECTION)
      .find({})
      .sort({ category: 1, order: 1, label: 1 })
      .toArray();

    console.log(`✅ Loaded ${variables.length} variables from database`);

    // WHAT: Update cache
    // WHY: Avoid DB query on every request
    variablesCache = {
      data: variables,
      timestamp: Date.now()
    };

    return NextResponse.json({ 
      success: true, 
      variables,
      count: variables.length,
      cached: false 
    });
  } catch (error) {
    console.error('❌ Failed to fetch variables-config:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch variables-config' 
    }, { status: 500 });
  }
}

// POST /api/variables-config
// WHAT: Create or update a variable in variables_metadata
// WHY: Allow dynamic variable creation without code changes
// HOW: Upsert to MongoDB, invalidate cache
// 
// Body examples:
// 1) Update existing: { name: 'female', label: 'Women', flags: { ... } }
// 2) Create custom: { name: 'vipGuests', label: 'VIP Guests', type: 'count', category: 'Event', ... }
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

    // WHAT: Name validation - allow stats.camelCase format
    // WHY: Database stores variables with stats. prefix for Single Reference System
    if (!/^(stats\.)?[a-zA-Z][a-zA-Z0-9]*$/.test(name)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid variable name format. Use camelCase or stats.camelCase (e.g., fanCount or stats.fanCount)' 
      }, { status: 400 });
    }

    const col = db.collection<VariableMetadata>(COLLECTION);
    
    // WHAT: Check if variable exists
    // WHY: Determine if update or create, protect system variables
    const existing = await col.findOne({ name });

    // WHAT: Block name changes for system variables
    // WHY: System variables map to database schema fields
    if (existing?.isSystem && label && existing.name !== name) {
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

    // WHAT: Build update document
    // WHY: Merge new data with existing, preserve system flag
    // NOTE: Don't include 'name' in $set to avoid MongoDB conflict error
    const updateDoc: Partial<VariableMetadata> = {
      updatedAt: now,
    };

    // Update metadata if provided
    if (label) updateDoc.label = label;
    if (type) updateDoc.type = type;
    if (category) updateDoc.category = category;
    if (description !== undefined) updateDoc.description = description;
    if (unit !== undefined) updateDoc.unit = unit;
    if (typeof derived === 'boolean') updateDoc.derived = derived;
    if (formula !== undefined) updateDoc.formula = formula;
    if (flags) updateDoc.flags = flags;
    if (typeof order === 'number') updateDoc.order = order;
    if (alias !== undefined) updateDoc.alias = alias;

    // WHAT: Upsert variable - separate create vs update fields
    // WHY: Avoid MongoDB conflict when same field is in $set and $setOnInsert
    const result = await col.updateOne(
      { name },
      {
        $set: updateDoc,
        $setOnInsert: {
          // WHAT: Fields only set on INSERT (not on update)
          // WHY: Avoid conflict with $set fields
          name,
          isSystem: false, // Custom variables are never system
          createdAt: now,
          // WHAT: Default values if not provided in updateDoc
          ...(!label && { label: name }),
          ...(!type && { type: 'count' }),
          ...(!category && { category: 'Custom' }),
          ...(!derived && { derived: false }),
          ...(!flags && { flags: { visibleInClicker: false, editableInManual: true } }),
          ...(typeof order !== 'number' && { order: 999 }),
        }
      },
      { upsert: true }
    );

    // WHAT: Invalidate cache
    // WHY: Force next GET to fetch fresh data
    invalidateCache();
    console.log('🗑️ Variables cache invalidated');

    const saved = await col.findOne({ name });

    return NextResponse.json({ 
      success: true, 
      variable: saved,
      created: result.upsertedCount > 0 
    });
  } catch (error) {
    console.error('❌ Failed to upsert variable:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to upsert variable' 
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
    console.log(`🗑️ Deleted variable: ${name}`);

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
