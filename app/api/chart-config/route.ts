// app/api/chart-config/route.ts - Chart Configuration Management API
// RESTful endpoints for CRUD operations on chart configurations
// Uses shared MongoDB connection pattern and admin authentication

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { getAdminUser } from '@/lib/auth';
import { ChartConfiguration, DEFAULT_CHART_CONFIGURATIONS } from '@/lib/chartConfigTypes';

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
 * Validates chart configuration data before saving
 * Ensures required fields are present and constraints are met
 */
function validateChartConfiguration(config: Partial<ChartConfiguration>): { isValid: boolean; error?: string } {
  // Required fields validation
  if (!config.chartId || !config.title || !config.type) {
    return { isValid: false, error: 'Missing required fields: chartId, title, or type' };
  }
  
  // Chart type validation
  if (!['pie', 'bar', 'kpi'].includes(config.type)) {
    return { isValid: false, error: 'Chart type must be "pie", "bar", or "kpi"' };
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
  
  // Order validation
  if (typeof config.order !== 'number' || config.order < 1) {
    return { isValid: false, error: 'Order must be a positive number' };
  }
  
  return { isValid: true };
}

/**
 * GET /api/chart-config - Fetch all chart configurations
 * Returns all active and inactive chart configurations sorted by order
 * Admin authentication required
 */
export async function GET() {
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
    
    const client = await connectToDatabase();
    const db = client.db(MONGODB_DB);
    const collection = db.collection('chartConfigurations');

    // Get collection stats for debugging
    const stats = await collection.estimatedDocumentCount();
    console.log(`📈 Chart configurations collection has ${stats} documents`);

    // Note: Removed automatic initialization - admin has full control over chart configurations

    const configurations = await collection
      .find({})
      .sort({ order: 1, createdAt: -1 })
      .toArray();

    console.log(`✅ Found ${configurations.length} chart configurations`);

    const formattedConfigurations = configurations.map(config => ({
      _id: config._id.toString(),
      chartId: config.chartId,
      title: config.title,
      type: config.type,
      order: config.order,
      isActive: config.isActive,
      elements: config.elements,
      emoji: config.emoji,
      subtitle: config.subtitle,
      showTotal: config.showTotal,
      totalLabel: config.totalLabel,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
      createdBy: config.createdBy,
      lastModifiedBy: config.lastModifiedBy
    }));

    return NextResponse.json({
      success: true,
      configurations: formattedConfigurations,
      debug: {
        databaseName: MONGODB_DB,
        collectionCount: stats,
        configurationsFound: configurations.length
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
    const { chartId, title, type, order, isActive, elements, emoji, subtitle, showTotal, totalLabel } = body;

    // Validate required fields
    const validation = validateChartConfiguration(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    console.log('💾 Creating new chart configuration:', chartId);

    const client = await connectToDatabase();
    const db = client.db(MONGODB_DB);
    const collection = db.collection('chartConfigurations');

    // Check if chartId already exists
    const existingConfig = await collection.findOne({ chartId });
    if (existingConfig) {
      return NextResponse.json(
        { success: false, error: 'Chart ID already exists' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const configuration: Omit<ChartConfiguration, '_id'> = {
      chartId,
      title,
      type,
      order,
      isActive: isActive ?? true,
      elements,
      emoji,
      subtitle,
      showTotal,
      totalLabel,
      createdAt: now,
      updatedAt: now,
      createdBy: user.id
    };

    const result = await collection.insertOne(configuration);
    console.log('✅ Chart configuration created with ID:', result.insertedId);

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

    if (!configurationId || !ObjectId.isValid(configurationId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid configuration ID' },
        { status: 400 }
      );
    }

    console.log('🔄 Updating chart configuration:', configurationId);

    const client = await connectToDatabase();
    const db = client.db(MONGODB_DB);
    const collection = db.collection('chartConfigurations');

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
      
      const mergedConfig = { ...currentConfig, ...updateData };
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
    const collection = db.collection('chartConfigurations');

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
