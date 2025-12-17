// app/api/chart-config/route.ts - Chart Configuration Management API
// RESTful endpoints for CRUD operations on chart configurations
// Uses shared MongoDB connection pattern and admin authentication

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { getAdminUser } from '@/lib/auth';
import { ChartConfiguration } from '@/lib/chartConfigTypes';

import config from '@/lib/config';
const MONGODB_DB = config.dbName;

/**
 * Enhanced database connection function that reuses the shared MongoDB client
 * Follows the established pattern from existing API routes
 */
async function connectToDatabase() {
  try {
    console.log('🔗 Connecting to MongoDB Atlas for chart configurations...');
    
    // Use the shared MongoDB client from lib/mongodb.ts
    const client = await clientPromise;
    
    // Test the connection with a ping
    await client.db(MONGODB_DB).admin().ping();
    console.log('✅ MongoDB Atlas connected successfully for chart configs');
    
    return client;
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB Atlas:', error);
    throw error;
  }
}

/**
 * WHAT: Helper function to validate formatting object structure
 * WHY: Ensure formatting configs have correct types when present
 * HOW: Check rounded is boolean, prefix/suffix are strings or undefined
 * FIXED: Formatting is now optional - validation passes if undefined or partial
 */
function validateFormatting(formatting: any): boolean {
  // WHAT: Allow undefined or null formatting (optional field)
  // WHY: Not all charts need formatting, and simple updates (showTitle toggle) shouldn't require it
  if (!formatting || formatting === undefined || formatting === null) return true;
  
  // WHAT: Allow empty formatting object
  // WHY: User may toggle formatting on/off, resulting in empty object
  if (typeof formatting === 'object' && Object.keys(formatting).length === 0) return true;
  
  // WHAT: If formatting exists and has properties, validate its structure
  // WHY: Prevent invalid formatting objects from breaking chart rendering
  // NOTE: All fields are optional - validate only what's present
  if (typeof formatting !== 'object') return false;
  
  // WHAT: Validate each property IF it exists
  if ('rounded' in formatting && typeof formatting.rounded !== 'boolean') return false;
  if ('prefix' in formatting && formatting.prefix !== '' && typeof formatting.prefix !== 'string') return false;
  if ('suffix' in formatting && formatting.suffix !== '' && typeof formatting.suffix !== 'string') return false;
  
  return true;
}

/**
 * WHAT: Helper function to validate HERO block settings structure
 * WHY: Ensure HERO settings have correct boolean types
 * HOW: Check all HERO visibility flags are boolean values
 * FIXED: More lenient validation - allows partial settings
 */
function validateHeroSettings(heroSettings: any): boolean {
  if (!heroSettings || heroSettings === null || heroSettings === undefined) return true; // Optional field
  
  // WHAT: Allow empty heroSettings object
  if (typeof heroSettings === 'object' && Object.keys(heroSettings).length === 0) return true;
  
  if (typeof heroSettings !== 'object') return false;
  
  // WHAT: Validate each property IF it exists
  if ('showEmoji' in heroSettings && typeof heroSettings.showEmoji !== 'boolean') return false;
  if ('showDateInfo' in heroSettings && typeof heroSettings.showDateInfo !== 'boolean') return false;
  if ('showExportOptions' in heroSettings && typeof heroSettings.showExportOptions !== 'boolean') return false;
  
  return true;
}

/**
 * WHAT: Helper function to validate block alignment settings structure
 * WHY: Ensure alignment settings have correct types
 * HOW: Check alignment flags are boolean, minElementHeight is number or undefined
 * FIXED: More lenient validation - allows partial settings
 */
function validateAlignmentSettings(alignmentSettings: any): boolean {
  if (!alignmentSettings || alignmentSettings === null || alignmentSettings === undefined) return true; // Optional field
  
  // WHAT: Allow empty alignmentSettings object
  if (typeof alignmentSettings === 'object' && Object.keys(alignmentSettings).length === 0) return true;
  
  if (typeof alignmentSettings !== 'object') return false;
  
  // WHAT: Validate each property IF it exists
  if ('alignTitles' in alignmentSettings && typeof alignmentSettings.alignTitles !== 'boolean') return false;
  if ('alignDescriptions' in alignmentSettings && typeof alignmentSettings.alignDescriptions !== 'boolean') return false;
  if ('alignCharts' in alignmentSettings && typeof alignmentSettings.alignCharts !== 'boolean') return false;
  if ('minElementHeight' in alignmentSettings && typeof alignmentSettings.minElementHeight !== 'number') return false;
  
  return true;
}

/**
 * Validates chart configuration data before saving
 * Ensures required fields are present and constraints are met
 */
function validateChartConfiguration(config: Partial<ChartConfiguration>): { isValid: boolean; error?: string } {
  // Normalize order to a number for validation (accept numeric strings)
  const orderNum = typeof config.order === 'number'
    ? config.order
    : typeof (config as any).order === 'string'
      ? parseInt((config as any).order as unknown as string, 10)
      : NaN;
  
  // Required fields validation
  if (!config.chartId || !config.title || !config.type) {
    return { isValid: false, error: 'Missing required fields: chartId, title, or type' };
  }
  
  // WHAT: Chart type validation including text/image
  // WHY: Support new chart types for reportText*, reportImage*
  if (!['pie', 'bar', 'kpi', 'text', 'image'].includes(config.type)) {
    return { isValid: false, error: 'Chart type must be "pie", "bar", "kpi", "text", or "image"' };
  }
  
  // Elements validation
  if (!config.elements || !Array.isArray(config.elements)) {
    return { isValid: false, error: 'Elements must be an array' };
  }
  
  // Element count validation based on chart type
  if (config.type === 'pie' && config.elements.length !== 2) {
    return { isValid: false, error: 'Pie charts must have exactly 2 elements' };
  }
  
  if (config.type === 'bar' && config.elements.length !== 5) {
    return { isValid: false, error: 'Bar charts must have exactly 5 elements' };
  }
  
  if (config.type === 'kpi' && config.elements.length !== 1) {
    return { isValid: false, error: 'KPI charts must have exactly 1 element' };
  }
  
  // WHAT: Validate text and image charts require exactly 1 element
  // WHY: Text displays one text variable, image displays one image URL
  if (config.type === 'text' && config.elements.length !== 1) {
    return { isValid: false, error: 'Text charts must have exactly 1 element' };
  }
  
  if (config.type === 'image' && config.elements.length !== 1) {
    return { isValid: false, error: 'Image charts must have exactly 1 element' };
  }
  
  // WHAT: Validate element-level formatting if present
  // WHY: Ensure formatting objects have correct structure
  // FIXED: Check if element.formatting exists before validating, allow undefined
  if (config.elements) {
    for (let i = 0; i < config.elements.length; i++) {
      const element = config.elements[i];
      // WHAT: Only validate formatting if it exists (not undefined)
      // WHY: formatting is optional - charts without formatting should pass validation
      if (element.formatting !== undefined && !validateFormatting(element.formatting)) {
        console.error('❌ Formatting validation failed for element', i + 1, ':', JSON.stringify(element.formatting));
        return { isValid: false, error: `Invalid formatting in element ${i + 1}: formatting must be an object with optional rounded (boolean), prefix (string), suffix (string)` };
      }
    }
  }
  
  // WHAT: Validate HERO block settings if present
  // WHY: Ensure HERO visibility flags are boolean values
  if (config.heroSettings && !validateHeroSettings(config.heroSettings)) {
    console.error('❌ HERO settings validation failed:', JSON.stringify(config.heroSettings));
    return { isValid: false, error: 'Invalid HERO settings: showEmoji, showDateInfo, and showExportOptions must be boolean values if present' };
  }
  
  // WHAT: Validate block alignment settings if present
  // WHY: Ensure alignment flags are boolean and minElementHeight is number
  if (config.alignmentSettings && !validateAlignmentSettings(config.alignmentSettings)) {
    console.error('❌ Alignment settings validation failed:', JSON.stringify(config.alignmentSettings));
    return { isValid: false, error: 'Invalid alignment settings: alignTitles, alignDescriptions, alignCharts must be boolean if present, minElementHeight must be number if present' };
  }
  
  // Order validation (after normalization)
  if (!Number.isFinite(orderNum) || orderNum < 1) {
    return { isValid: false, error: 'Order must be a positive number' };
  }
  
  return { isValid: true };
}

/**
 * GET /api/chart-config - Fetch chart configurations with pagination and search
 * 
 * Query Parameters:
 * - search: Search term to filter by title, chartId, or type (case-insensitive)
 * - offset: Starting position for pagination (default: 0)
 * - limit: Maximum number of items to return (default: 20, max: 100)
 * - sortField: Field to sort by (title, type, order, createdAt)
 * - sortOrder: Sort direction (asc, desc)
 * 
 * Response Format:
 * {
 *   success: true,
 *   configurations: ChartConfiguration[],
 *   pagination: {
 *     mode: 'paginated',
 *     limit: 20,
 *     offset: 0,
 *     nextOffset: 20 | null,
 *     totalMatched: number
 *   }
 * }
 * 
 * Admin authentication required
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📊 Fetching chart configurations from database...');
    
    // Check admin authentication
    const user = await getAdminUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Admin authentication required' },
        { status: 401 }
      );
    }
    
    // WHAT: Parse pagination and search parameters from query string
    // WHY: Consistent pattern with /api/hashtag-categories and /api/projects
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');
    const sortFieldParam = searchParams.get('sortField') || 'order';
    const sortOrderParam = searchParams.get('sortOrder') || 'asc';
    
    // WHAT: Validate and constrain limit (1-100), default 20
    // WHY: Prevents excessive database loads and ensures consistent page sizes
    const limit = Math.min(Math.max(Number(limitParam) || 20, 1), 100);
    const offset = Math.max(Number(offsetParam) || 0, 0);
    
    const client = await connectToDatabase();
    const db = client.db(MONGODB_DB);
    const collection = db.collection('chart_configurations');

    // WHAT: Build search filter for title, chartId, or type (case-insensitive)
    // WHY: Allow flexible search across key chart fields
    const searchFilter = search
      ? {
          $or: [
            { title: { $regex: new RegExp(search, 'i') } },
            { chartId: { $regex: new RegExp(search, 'i') } },
            { type: { $regex: new RegExp(search, 'i') } }
          ]
        }
      : {};

    // WHAT: Count total matching documents for pagination metadata
    // WHY: Client needs totalMatched to show "X of Y" and know when last page is reached
    const totalMatched = await collection.countDocuments(searchFilter);

    // WHAT: Build sort object based on parameters
    // WHY: Allow flexible sorting on title, type, order, createdAt
    const sortField = ['title', 'type', 'order', 'createdAt'].includes(sortFieldParam) 
      ? sortFieldParam 
      : 'order';
    const sortOrder = sortOrderParam === 'desc' ? -1 : 1;
    const sortObj: any = { [sortField]: sortOrder };
    
    // WHAT: Add secondary sort by createdAt for consistent ordering
    // WHY: When primary field has duplicates, createdAt ensures stable sort
    if (sortField !== 'createdAt') {
      sortObj.createdAt = -1;
    }

    // WHAT: Fetch paginated configurations
    // WHY: Skip/limit implement pagination efficiently
    const configurations = await collection
      .find(searchFilter)
      .sort(sortObj)
      .skip(offset)
      .limit(limit)
      .toArray();

    console.log(`✅ Retrieved ${configurations.length} of ${totalMatched} chart configurations (offset: ${offset}, search: "${search}")`);

    const formattedConfigurations = configurations.map(config => ({
      _id: config._id.toString(),
      chartId: config.chartId,
      title: config.title,
      type: config.type,
      order: config.order,
      isActive: config.isActive,
      elements: config.elements,
      icon: config.icon, // v10.4.0: Material Icon name
      iconVariant: config.iconVariant, // v10.4.0: Icon variant (outlined/rounded)
      emoji: config.emoji, // DEPRECATED: Legacy field
      subtitle: config.subtitle,
      showTotal: config.showTotal,
      totalLabel: config.totalLabel,
      aspectRatio: config.aspectRatio, // v9.3.0: Image aspect ratio
      heroSettings: config.heroSettings, // HERO block visibility settings
      alignmentSettings: config.alignmentSettings, // Block alignment settings
      showTitle: config.showTitle, // WHAT: Chart-level title visibility control
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
      createdBy: config.createdBy,
      lastModifiedBy: config.lastModifiedBy
    }));

    // WHAT: Calculate nextOffset for "Load More" button
    // WHY: null indicates last page, number indicates more items available
    const hasMore = offset + configurations.length < totalMatched;
    const nextOffset = hasMore ? offset + limit : null;

    return NextResponse.json({
      success: true,
      configurations: formattedConfigurations,
      pagination: {
        mode: 'paginated' as const,
        limit,
        offset,
        nextOffset,
        totalMatched
      }
    });

  } catch (error) {
    console.error('❌ Failed to fetch chart configurations:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch chart configurations',
      debug: {
        databaseName: MONGODB_DB,
        errorType: error instanceof Error ? error.constructor.name : 'Unknown',
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}

/**
 * POST /api/chart-config - Create new chart configuration
 * Creates a new chart configuration with validation
 * Admin authentication required
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const user = await getAdminUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Admin authentication required' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { chartId, title, type, order, isActive, elements, icon, iconVariant, emoji, subtitle, showTotal, totalLabel, aspectRatio, heroSettings, alignmentSettings, showTitle } = body;

    // WHAT: Log received data to debug persistence
    console.log('📥 POST RECEIVED - chartId:', chartId);
    console.log('📥 POST RECEIVED - order:', order, 'typeof:', typeof order);
    console.log('📥 POST RECEIVED - elements[0].formatting:', elements[0]?.formatting);

    // Validate required fields
    const validation = validateChartConfiguration({ ...body, order: typeof order === 'string' ? parseInt(order, 10) : order });
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    console.log('💾 Creating new chart configuration:', chartId);

    const client = await connectToDatabase();
    const db = client.db(MONGODB_DB);
    const collection = db.collection('chart_configurations');

    // Check if chartId already exists
    const existingConfig = await collection.findOne({ chartId });
    if (existingConfig) {
      return NextResponse.json(
        { success: false, error: 'Chart ID already exists' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    
    // WHAT: Include all configuration fields including HERO settings and showTitle
    // WHY: element.formatting, aspectRatio, icon, heroSettings, alignmentSettings, and showTitle must be persisted to database
    // Normalize order with safe fallback
    let normalizedOrder = typeof order === 'string' ? parseInt(order, 10) : order;
    if (!Number.isFinite(normalizedOrder) || (normalizedOrder as number) < 1) normalizedOrder = 1;

    const configuration: Omit<ChartConfiguration, '_id'> = {
      chartId,
      title,
      type,
      order: normalizedOrder as number,
      isActive: isActive ?? true,
      elements,
      icon, // v10.4.0: Material Icon name
      iconVariant, // v10.4.0: Icon variant (outlined/rounded)
      emoji, // DEPRECATED: Legacy field
      subtitle,
      showTotal,
      totalLabel,
      aspectRatio, // v9.3.0: Image aspect ratio (9:16, 1:1, 16:9)
      heroSettings, // HERO block visibility settings
      alignmentSettings, // Block alignment settings
      showTitle, // WHAT: Chart-level title visibility control
      createdAt: now,
      updatedAt: now,
      createdBy: user.id
    };

    const result = await collection.insertOne(configuration);
    console.log('✅ Chart configuration created with ID:', result.insertedId);
    console.log('💾 SAVED TO DB - elements[0].formatting:', configuration.elements[0]?.formatting);

    return NextResponse.json({
      success: true,
      configurationId: result.insertedId.toString(),
      configuration: {
        _id: result.insertedId.toString(),
        ...configuration
      }
    });

  } catch (error) {
    console.error('❌ Failed to create chart configuration:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create chart configuration' 
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/chart-config - Update existing chart configuration
 * Updates a chart configuration by ID with validation
 * Admin authentication required
 */
export async function PUT(request: NextRequest) {
  try {
    // Check admin authentication
    const user = await getAdminUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Admin authentication required' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { configurationId, _id, createdAt, createdBy, ...updateData } = body;

    // Coerce order to number if present (accept numeric strings); drop invalid
    if (updateData && 'order' in updateData) {
      const ord = (updateData as any).order;
      console.log('📥 PUT RECEIVED - raw order:', ord, 'typeof:', typeof ord);
      let coerced = ord;
      if (typeof ord === 'string') coerced = parseInt(ord, 10);
      if (!Number.isFinite(coerced) || coerced < 1) {
        console.log('⚠️ PUT: invalid order provided, ignoring this field (will keep existing order)');
        delete (updateData as any).order;
      } else {
        (updateData as any).order = coerced;
      }
    }

    // WHAT: Log received update data
    console.log('📥 PUT RECEIVED - configurationId:', configurationId);
    console.log('📥 PUT RECEIVED - elements[0].formatting:', updateData.elements?.[0]?.formatting);

    if (!configurationId || !ObjectId.isValid(configurationId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid configuration ID' },
        { status: 400 }
      );
    }

    console.log('🔄 Updating chart configuration:', configurationId);

    const client = await connectToDatabase();
    const db = client.db(MONGODB_DB);
    const collection = db.collection('chart_configurations');

    // For updates, we only validate if essential fields are being updated
    // Skip validation for simple field updates like isActive, order
    if (updateData.chartId || updateData.title || updateData.type || updateData.elements) {
      // Get current configuration to merge with update data for validation
      const currentConfig = await collection.findOne({ _id: new ObjectId(configurationId) });
      if (!currentConfig) {
        return NextResponse.json(
          { success: false, error: 'Chart configuration not found' },
          { status: 404 }
        );
      }
      
      // Ensure order in current config is valid during validation
      const currentOrder = typeof currentConfig.order === 'number' ? currentConfig.order : parseInt(String(currentConfig.order ?? ''), 10);
      const safeCurrentOrder = Number.isFinite(currentOrder) && currentOrder >= 1 ? currentOrder : 1;
      const mergedConfig = { ...currentConfig, order: safeCurrentOrder, ...updateData }; // order already coerced or dropped above
      const validation = validateChartConfiguration(mergedConfig);
      if (!validation.isValid) {
        return NextResponse.json(
          { success: false, error: validation.error },
          { status: 400 }
        );
      }
    }

    // Check if chartId conflict exists (if updating chartId)
    if (updateData.chartId) {
      const existingConfig = await collection.findOne({ 
        chartId: updateData.chartId, 
        _id: { $ne: new ObjectId(configurationId) }
      });
      
      if (existingConfig) {
        return NextResponse.json(
          { success: false, error: 'Chart ID already exists' },
          { status: 400 }
        );
      }
    }

    // WHAT: Spread updateData to include all fields including formatting
    // WHY: element.formatting is in updateData and must persist
    const updateFields = {
      ...updateData,
      updatedAt: new Date().toISOString(),
      lastModifiedBy: user.id
    };

    const result = await collection.updateOne(
      { _id: new ObjectId(configurationId) },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Chart configuration not found' },
        { status: 404 }
      );
    }

    console.log('✅ Chart configuration updated successfully');

    // Fetch the updated configuration
    const updatedConfig = await collection.findOne({ _id: new ObjectId(configurationId) });

    return NextResponse.json({
      success: true,
      modified: result.modifiedCount > 0,
      configuration: updatedConfig ? {
        ...updatedConfig,
        _id: updatedConfig._id.toString()
      } : null
    });

  } catch (error) {
    console.error('❌ Failed to update chart configuration:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update chart configuration' 
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/chart-config - Delete chart configuration
 * Removes a chart configuration by ID
 * Admin authentication required
 */
export async function DELETE(request: NextRequest) {
  try {
    // Check admin authentication
    const user = await getAdminUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Admin authentication required' },
        { status: 401 }
      );
    }
    
    const url = new URL(request.url);
    const configurationId = url.searchParams.get('configurationId');

    if (!configurationId || !ObjectId.isValid(configurationId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid configuration ID' },
        { status: 400 }
      );
    }

    console.log('🗑️ Deleting chart configuration:', configurationId);

    const client = await connectToDatabase();
    const db = client.db(MONGODB_DB);
    const collection = db.collection('chart_configurations');

    // Get configuration details before deletion for logging
    const configuration = await collection.findOne({ _id: new ObjectId(configurationId) });
    
    if (!configuration) {
      return NextResponse.json(
        { success: false, error: 'Chart configuration not found' },
        { status: 404 }
      );
    }

    const result = await collection.deleteOne({ _id: new ObjectId(configurationId) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Chart configuration not found' },
        { status: 404 }
      );
    }

    console.log('✅ Chart configuration deleted successfully:', configuration.title);

    return NextResponse.json({ 
      success: true,
      deletedConfiguration: {
        id: configurationId,
        title: configuration.title,
        chartId: configuration.chartId,
        deletedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Failed to delete chart configuration:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete chart configuration' 
      },
      { status: 500 }
    );
  }
}
