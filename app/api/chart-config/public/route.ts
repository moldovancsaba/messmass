// app/api/chart-config/public/route.ts - Public Chart Configuration API
// Provides read-only access to active chart configurations for the stats page
// No authentication required - only returns active, public-facing configurations

import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

import config from '@/lib/config';
const MONGODB_DB = config.dbName;

/**
 * Database connection function - reuses the shared MongoDB client
 */
async function connectToDatabase() {
  try {
    console.log('🔗 Connecting to MongoDB Atlas for public chart configurations...');
    
    const client = await clientPromise;
    await client.db(MONGODB_DB).admin().ping();
    console.log('✅ MongoDB Atlas connected successfully for public chart configs');
    
    return client;
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB Atlas:', error);
    throw error;
  }
}

/**
 * GET /api/chart-config/public - Fetch active chart configurations (public endpoint)
 * Returns only active chart configurations sorted by order
 * No authentication required - designed for public stats pages
 */
export async function GET() {
  try {
    console.log('📊 Fetching public chart configurations from database...');
    
    const client = await connectToDatabase();
    const db = client.db(MONGODB_DB);
    const collection = db.collection('chart_configurations');

    // Get collection stats for debugging
    const stats = await collection.estimatedDocumentCount();
    console.log(`📈 Chart configurations collection has ${stats} documents`);

    // Note: Removed automatic initialization - admin has full control over chart configurations

    // Fetch only active configurations, sorted by order
    const configurations = await collection
      .find({ isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .toArray();

    console.log(`✅ Found ${configurations.length} active chart configurations`);

    // Format configurations for public consumption (remove sensitive fields)
    const publicConfigurations = configurations.map(config => ({
      _id: config._id.toString(),
      chartId: config.chartId,
      title: config.title,
      type: config.type,
      order: config.order,
      isActive: config.isActive, // WHAT: Include isActive field for frontend filtering
      elements: config.elements,
      icon: config.icon, // v10.4.0: Material Icon name
      iconVariant: config.iconVariant, // v10.4.0: Icon variant (outlined/rounded)
      emoji: config.emoji, // DEPRECATED: Legacy field for backward compatibility
      subtitle: config.subtitle,
      showTotal: config.showTotal,
      totalLabel: config.totalLabel,
      aspectRatio: config.aspectRatio, // v9.3.0: Image aspect ratio for grid width calculation
      showTitle: config.showTitle, // WHAT: Chart-level title visibility control
      // Exclude sensitive fields like createdBy, lastModifiedBy, etc.
    }));

    return NextResponse.json({
      success: true,
      configurations: publicConfigurations,
      meta: {
        total: configurations.length,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Failed to fetch public chart configurations:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch chart configurations',
      meta: {
        errorType: error instanceof Error ? error.constructor.name : 'Unknown',
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}
