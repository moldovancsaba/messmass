// WHAT: Charts API Endpoint (v12.0.0)
// WHY: Frontend needs to fetch chart configurations for rendering
// HOW: Query charts collection with filtering and sorting

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import type { Chart } from '@/lib/report-calculator';

/**
 * GET /api/charts
 * 
 * WHAT: Fetch chart configurations from database
 * WHY: Frontend needs chart metadata to render charts
 * 
 * Query Parameters:
 * - chartIds: Comma-separated list of chart IDs (optional)
 * - isActive: Filter by active status (true/false, optional)
 * - type: Filter by chart type (kpi, pie, bar, text, image, value, optional)
 * 
 * Response:
 * {
 *   success: true,
 *   charts: Chart[],
 *   count: number
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chartIdsParam = searchParams.get('chartIds');
    const isActiveParam = searchParams.get('isActive');
    const typeParam = searchParams.get('type');

    const db = await getDb();
    const chartsCollection = db.collection<Chart>('charts');

    // Build query filter
    const filter: Record<string, unknown> = {};

    // Filter by specific chart IDs
    if (chartIdsParam) {
      const chartIds = chartIdsParam.split(',').map(id => id.trim());
      filter.chartId = { $in: chartIds };
    }

    // Filter by active status
    if (isActiveParam !== null) {
      filter.isActive = isActiveParam === 'true';
    }

    // Filter by chart type
    if (typeParam) {
      filter.type = typeParam;
    }

    // Fetch charts sorted by order, then by chartId
    const charts = await chartsCollection
      .find(filter)
      .sort({ order: 1, chartId: 1 })
      .toArray();

    return NextResponse.json({
      success: true,
      charts,
      count: charts.length
    });

  } catch (error) {
    console.error('❌ [/api/charts] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch charts'
    }, { status: 500 });
  }
}

/**
 * POST /api/charts
 * 
 * WHAT: Create or update chart configuration
 * WHY: Admin needs to create/edit chart definitions
 * 
 * Request Body:
 * {
 *   chartId: string,
 *   title: string,
 *   type: 'kpi' | 'pie' | 'bar' | 'text' | 'image' | 'value',
 *   formula: string,
 *   icon: string,
 *   isActive: boolean,
 *   order: number,
 *   elements?: Array<{ label: string; formula: string; color?: string; }>,
 *   formatting?: { prefix?: string; suffix?: string; decimals?: number; },
 *   aspectRatio?: '16:9' | '9:16' | '1:1'
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validation
    if (!body.chartId || !body.title || !body.type || !body.formula) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: chartId, title, type, formula'
      }, { status: 400 });
    }

    const db = await getDb();
    const chartsCollection = db.collection<Chart>('charts');

    const now = new Date().toISOString();

    // Upsert chart (update if exists, insert if new)
    const result = await chartsCollection.updateOne(
      { chartId: body.chartId },
      {
        $set: {
          title: body.title,
          type: body.type,
          formula: body.formula,
          icon: body.icon || 'analytics',
          isActive: body.isActive ?? true,
          order: body.order ?? 0,
          ...(body.elements && { elements: body.elements }),
          ...(body.formatting && { formatting: body.formatting }),
          ...(body.aspectRatio && { aspectRatio: body.aspectRatio }),
          updatedAt: now
        },
        $setOnInsert: {
          createdAt: now
        }
      },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      chartId: body.chartId,
      created: result.upsertedCount > 0,
      updated: result.modifiedCount > 0
    });

  } catch (error) {
    console.error('❌ [/api/charts] POST Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save chart'
    }, { status: 500 });
  }
}

/**
 * DELETE /api/charts
 * 
 * WHAT: Delete chart configuration
 * WHY: Admin needs to remove obsolete chart definitions
 * 
 * Query Parameters:
 * - chartId: Chart ID to delete (required)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chartId = searchParams.get('chartId');

    if (!chartId) {
      return NextResponse.json({
        success: false,
        error: 'chartId is required'
      }, { status: 400 });
    }

    const db = await getDb();
    const chartsCollection = db.collection<Chart>('charts');

    // Delete chart
    const result = await chartsCollection.deleteOne({ chartId });

    if (result.deletedCount === 0) {
      return NextResponse.json({
        success: false,
        error: `Chart not found: ${chartId}`
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      chartId,
      deleted: true
    });

  } catch (error) {
    console.error('❌ [/api/charts] DELETE Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete chart'
    }, { status: 500 });
  }
}
