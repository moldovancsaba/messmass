// app/api/content-assets/route.ts
// WHAT: REST API for Content Management System (images & text blocks)
// WHY: Centralized CRUD operations for media assets referenced in charts via [MEDIA:slug] and [TEXT:slug] tokens
// HOW: MongoDB operations with validation, slug generation, and usage tracking

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';
import {
  type ContentAsset,
  type ContentAssetQuery,
  type ContentAssetFormData,
  type ContentAssetResponse,
  generateSlug,
  isValidSlug
} from '@/lib/contentAssetTypes';

const MONGODB_DB = config.dbName;

/**
 * GET /api/content-assets
 * WHAT: Retrieve all content assets with optional filtering and sorting
 * WHY: Support admin UI search, filter, and pagination
 * QUERY PARAMS:
 * - type: 'image' | 'text' (filter by asset type)
 * - category: string (filter by category)
 * - tags: string (comma-separated tags, OR operation)
 * - search: string (full-text search on title, description, tags)
 * - sortBy: 'title' | 'createdAt' | 'usageCount' (default: createdAt)
 * - sortOrder: 'asc' | 'desc' (default: desc)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const type = searchParams.get('type') as 'image' | 'text' | null;
    const category = searchParams.get('category');
    const tagsParam = searchParams.get('tags');
    const search = searchParams.get('search');
    const sortBy = (searchParams.get('sortBy') || 'createdAt') as 'title' | 'createdAt' | 'usageCount';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
    
    const client = await clientPromise;
    const db = client.db(MONGODB_DB);
    const collection = db.collection<ContentAsset>('content_assets');
    
    // Build MongoDB query
    const query: any = {};
    
    // WHAT: Filter by asset type (image or text)
    // WHY: UI has separate tabs/filters for each type
    if (type) {
      query.type = type;
    }
    
    // WHAT: Filter by category
    // WHY: Organize assets by purpose (Partners, Sponsors, Event Assets)
    if (category) {
      query.category = category;
    }
    
    // WHAT: Filter by tags (OR operation)
    // WHY: Multi-tag filtering for flexible organization
    if (tagsParam) {
      const tags = tagsParam.split(',').map(t => t.trim()).filter(Boolean);
      if (tags.length > 0) {
        query.tags = { $in: tags };
      }
    }
    
    // WHAT: Full-text search (MongoDB text index)
    // WHY: Fast search across title, description, and tags
    if (search) {
      query.$text = { $search: search };
    }
    
    // WHAT: Build sort criteria
    // WHY: Support multiple sort strategies (newest, alphabetical, most used)
    const sortCriteria: any = {};
    if (search) {
      // WHAT: If searching, sort by text score first (relevance)
      // WHY: Most relevant results should appear first
      sortCriteria.score = { $meta: 'textScore' };
    }
    sortCriteria[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    // Execute query
    const assets = await collection
      .find(query, search ? { projection: { score: { $meta: 'textScore' } } } : {})
      .sort(sortCriteria)
      .toArray();
    
    // WHAT: Convert ObjectId to string for JSON serialization
    // WHY: ObjectId is not JSON-serializable, client expects string
    const assetsWithStringId = assets.map(asset => ({
      ...asset,
      _id: asset._id?.toString()
    }));
    
    return NextResponse.json({
      success: true,
      assets: assetsWithStringId,
      total: assetsWithStringId.length
    } as ContentAssetResponse);
    
  } catch (error) {
    console.error('❌ GET /api/content-assets error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch content assets'
      } as ContentAssetResponse,
      { status: 500 }
    );
  }
}

/**
 * POST /api/content-assets
 * WHAT: Create new content asset (image or text)
 * WHY: Enable admin UI to upload images and create text blocks
 * BODY: ContentAssetFormData (title, type, content, category, tags, optional slug)
 * VALIDATION:
 * - Required fields: title, type, content (url for images, text for text blocks)
 * - Slug: auto-generated from title if not provided, validated for uniqueness
 * - Type-specific content validation (url for images, text for text blocks)
 */
export async function POST(request: NextRequest) {
  try {
    const body: ContentAssetFormData = await request.json();
    
    // WHAT: Validate required fields
    // WHY: Prevent invalid assets from being created
    if (!body.title || !body.type) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: title, type'
        } as ContentAssetResponse,
        { status: 400 }
      );
    }
    
    // WHAT: Validate type-specific content (only for Global Assets)
    // WHY: Global Assets need content, Variable Definitions don't (filled per-project)
    const isVariable = body.isVariable === true;
    
    if (!isVariable) {
      // WHAT: Global Asset mode - content is required
      if (body.type === 'image') {
        if (!body.content?.url) {
          return NextResponse.json(
            {
              success: false,
              error: 'Global image assets require content.url (ImgBB URL)'
            } as ContentAssetResponse,
            { status: 400 }
          );
        }
      } else if (body.type === 'text') {
        if (!body.content?.text) {
          return NextResponse.json(
            {
              success: false,
              error: 'Global text assets require content.text'
            } as ContentAssetResponse,
            { status: 400 }
          );
        }
      }
    }
    // WHAT: Variable Definition mode - content is optional (will be filled per-project in Manual Edit)
    
    // WHAT: Generate or validate slug
    // WHY: Slug is the unique identifier for asset references in formulas
    let slug = body.slug;
    if (!slug) {
      // Auto-generate slug from title
      slug = generateSlug(body.title);
    }
    
    // WHAT: Validate slug format (lowercase alphanumeric with hyphens)
    // WHY: Slugs must be URL-safe and consistent
    if (!isValidSlug(slug)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid slug format: "${slug}". Must be lowercase alphanumeric with hyphens only.`
        } as ContentAssetResponse,
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db(MONGODB_DB);
    const collection = db.collection<ContentAsset>('content_assets');
    
    // WHAT: Check slug uniqueness
    // WHY: Duplicate slugs would break asset references
    const existing = await collection.findOne({ slug });
    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: `Slug "${slug}" already exists. Please choose a different title or slug.`
        } as ContentAssetResponse,
        { status: 409 }
      );
    }
    
    // WHAT: Build asset document with ISO 8601 timestamps
    // WHY: MongoDB document creation with standardized metadata
    const now = new Date().toISOString(); // ISO 8601 with milliseconds
    const newAsset: Omit<ContentAsset, '_id'> = {
      slug,
      title: body.title,
      description: body.description,
      type: body.type,
      content: body.content,
      category: body.category || 'Uncategorized',
      tags: body.tags || [],
      isVariable: body.isVariable || false, // WHAT: Flag for Variable Definition vs Global Asset
      uploadedBy: undefined, // TODO: Add user session tracking
      usageCount: 0, // Initially zero, updated by usage tracking system
      createdAt: now,
      updatedAt: now
    };
    
    // Insert into database
    const result = await collection.insertOne(newAsset as any);
    
    console.log(`✅ Created content asset: ${slug} (${body.type})`);
    
    return NextResponse.json({
      success: true,
      asset: {
        _id: result.insertedId.toString(),
        ...newAsset
      },
      message: `Content asset "${body.title}" created successfully`
    } as ContentAssetResponse);
    
  } catch (error) {
    console.error('❌ POST /api/content-assets error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create content asset'
      } as ContentAssetResponse,
      { status: 500 }
    );
  }
}

/**
 * PUT /api/content-assets
 * WHAT: Update existing content asset
 * WHY: Allow editing asset metadata (title, description, tags, content)
 * BODY: ContentAssetFormData with _id or slug
 * VALIDATION:
 * - Identify by _id (preferred) or slug (backward compatibility)
 * - If slug changes, validate uniqueness and show warning (breaks references)
 * - Update updatedAt timestamp
 */
export async function PUT(request: NextRequest) {
  try {
    const body: ContentAssetFormData = await request.json();
    
    // WHAT: Identify asset by _id or slug
    // WHY: Support both ObjectId and slug-based updates
    if (!body._id && !body.slug) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing identifier: _id or slug required'
        } as ContentAssetResponse,
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db(MONGODB_DB);
    const collection = db.collection<ContentAsset>('content_assets');
    
    // Build find query
    const findQuery: any = body._id
      ? { _id: new ObjectId(body._id) }
      : { slug: body.slug };
    
    // WHAT: Check if asset exists
    // WHY: 404 if trying to update non-existent asset
    const existingAsset = await collection.findOne(findQuery);
    if (!existingAsset) {
      return NextResponse.json(
        {
          success: false,
          error: 'Content asset not found'
        } as ContentAssetResponse,
        { status: 404 }
      );
    }
    
    // WHAT: If slug is changing, validate uniqueness
    // WHY: Prevent duplicate slugs and warn about breaking references
    if (body.slug && body.slug !== existingAsset.slug) {
      if (!isValidSlug(body.slug)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid slug format: "${body.slug}". Must be lowercase alphanumeric with hyphens only.`
          } as ContentAssetResponse,
          { status: 400 }
        );
      }
      
      const duplicateSlug = await collection.findOne({
        slug: body.slug,
        _id: { $ne: existingAsset._id }
      });
      
      if (duplicateSlug) {
        return NextResponse.json(
          {
            success: false,
            error: `Slug "${body.slug}" already exists. Choose a different slug.`
          } as ContentAssetResponse,
          { status: 409 }
        );
      }
    }
    
    // WHAT: Build update document
    // WHY: Update only provided fields, maintain existing data
    const updateDoc: Partial<ContentAsset> = {
      title: body.title,
      description: body.description,
      type: body.type,
      content: body.content,
      category: body.category,
      tags: body.tags,
      updatedAt: new Date().toISOString() // ISO 8601 with milliseconds
    };
    
    // WHAT: Include slug only if changed (WARNING: breaks references)
    // WHY: Slug changes should be rare and intentional
    if (body.slug && body.slug !== existingAsset.slug) {
      updateDoc.slug = body.slug;
      console.warn(`⚠️ Slug changed: ${existingAsset.slug} → ${body.slug} (may break chart references)`);
    }
    
    // Update in database
    await collection.updateOne(findQuery, { $set: updateDoc });
    
    // Fetch updated asset
    const updatedAsset = await collection.findOne(findQuery);
    
    console.log(`✅ Updated content asset: ${body.slug || existingAsset.slug}`);
    
    return NextResponse.json({
      success: true,
      asset: updatedAsset ? {
        ...updatedAsset,
        _id: updatedAsset._id?.toString()
      } : undefined,
      message: `Content asset "${body.title}" updated successfully`
    } as ContentAssetResponse);
    
  } catch (error) {
    console.error('❌ PUT /api/content-assets error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update content asset'
      } as ContentAssetResponse,
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/content-assets
 * WHAT: Delete content asset
 * WHY: Remove unused assets from library
 * QUERY: id (ObjectId) or slug
 * VALIDATION:
 * - Check usageCount > 0 before deletion
 * - Return warning if referenced by active charts (require force flag)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const slug = searchParams.get('slug');
    const force = searchParams.get('force') === 'true';
    
    if (!id && !slug) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing identifier: id or slug required'
        } as ContentAssetResponse,
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db(MONGODB_DB);
    const collection = db.collection<ContentAsset>('content_assets');
    
    // Build find query
    const findQuery: any = id
      ? { _id: new ObjectId(id) }
      : { slug };
    
    // WHAT: Check if asset exists
    // WHY: 404 if trying to delete non-existent asset
    const asset = await collection.findOne(findQuery);
    if (!asset) {
      return NextResponse.json(
        {
          success: false,
          error: 'Content asset not found'
        } as ContentAssetResponse,
        { status: 404 }
      );
    }
    
    // WHAT: Check usage count (safety check)
    // WHY: Prevent deletion of assets referenced by active charts
    if (asset.usageCount > 0 && !force) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete asset "${asset.title}": currently used in ${asset.usageCount} chart(s). Use force=true to delete anyway.`
        } as ContentAssetResponse,
        { status: 409 }
      );
    }
    
    // Delete from database
    await collection.deleteOne(findQuery);
    
    console.log(`✅ Deleted content asset: ${asset.slug} (force: ${force})`);
    
    return NextResponse.json({
      success: true,
      message: `Content asset "${asset.title}" deleted successfully`
    } as ContentAssetResponse);
    
  } catch (error) {
    console.error('❌ DELETE /api/content-assets error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete content asset'
      } as ContentAssetResponse,
      { status: 500 }
    );
  }
}
