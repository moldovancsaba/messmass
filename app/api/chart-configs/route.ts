// app/api/chart-configs/route.ts
// WHAT: Public endpoint for fetching active chart configurations (plural alias for /api/chart-config)
// WHY: Visualization Manager uses /api/chart-configs to populate chart picker dropdown
// HOW: Redirect to main /api/chart-config endpoint

import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';

const MONGODB_DB = config.dbName;

/**
 * WHAT: GET /api/chart-configs - Fetch all active charts for visualization manager
 * WHY: Provides chart list for block assignment dropdown
 * HOW: Queries chartConfigurations collection, returns active charts only
 */
export async function GET() {
  try {
    console.log('📊 Fetching chart configurations for visualization manager...');
    
    const client = await clientPromise;
    const db = client.db(MONGODB_DB);
    const collection = db.collection('chartConfigurations');

    // WHAT: Fetch only active charts (same as public endpoint)
    // WHY: Visualization manager should only show charts that can actually render
    const configurations = await collection
      .find({ isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .toArray();

    console.log(`✅ Found ${configurations.length} active chart configurations`);

    // WHAT: Format response for visualization manager dropdown
    // WHY: Only need chartId, title, type, emoji for picker UI
    const formattedConfigs = configurations.map(config => ({
      chartId: config.chartId,
      title: config.title,
      type: config.type,
      emoji: config.emoji,
      order: config.order,
      isActive: config.isActive
    }));

    return NextResponse.json({
      success: true,
      configs: formattedConfigs,
      count: formattedConfigs.length
    });

  } catch (error) {
    console.error('❌ Failed to fetch chart configurations:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch chart configurations',
      configs: []
    }, { status: 500 });
  }
}
