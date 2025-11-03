// app/api/content-assets/usage/route.ts
// WHAT: Usage tracking API for content assets
// WHY: Show which charts reference an asset before deletion (prevent breaking changes)
// HOW: Scan chartConfigurations.elements[].formula for [MEDIA:slug] and [TEXT:slug] tokens

import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';
import {
  type AssetUsageResponse,
  type ChartReference,
  extractAssetTokens
} from '@/lib/contentAssetTypes';

const MONGODB_DB = config.dbName;

/**
 * GET /api/content-assets/usage?slug=...
 * WHAT: Get all charts that reference a specific content asset
 * WHY: Enable safe deletion (warn if asset is used), show impact of changes
 * QUERY PARAMS:
 * - slug: string (required) - Asset slug to check usage for
 * 
 * RETURNS: {
 *   success: true,
 *   slug: "logo-partner-abc",
 *   usageCount: 3,
 *   charts: [
 *     { chartId: "partner-header", title: "Partner Header", type: "image" },
 *     { chartId: "sponsor-banner", title: "Sponsor Banner", type: "image" },
 *     ...
 *   ]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    
    if (!slug) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameter: slug'
        } as AssetUsageResponse,
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db(MONGODB_DB);
    const chartsCollection = db.collection('chartConfigurations');
    
    // WHAT: Fetch all chart configurations
    // WHY: Need to scan formulas for asset references
    const allCharts = await chartsCollection.find({}).toArray();
    
    const chartReferences: ChartReference[] = [];
    
    // WHAT: Scan each chart's elements for asset token usage
    // WHY: Assets can be referenced in any element's formula
    for (const chart of allCharts) {
      if (!Array.isArray(chart.elements)) continue;
      
      for (let i = 0; i < chart.elements.length; i++) {
        const element = chart.elements[i];
        if (!element.formula) continue;
        
        // WHAT: Extract all asset tokens from formula
        // WHY: Formula might reference multiple assets
        const tokens = extractAssetTokens(element.formula);
        
        // WHAT: Check if this formula references our slug
        // WHY: One chart might use the same asset in multiple elements
        if (tokens.includes(slug)) {
          // Add chart reference (avoid duplicates)
          const alreadyAdded = chartReferences.some(ref => ref.chartId === chart.chartId);
          if (!alreadyAdded) {
            chartReferences.push({
              chartId: chart.chartId,
              title: chart.title || 'Untitled Chart',
              type: chart.type || 'unknown',
              elementIndex: i // Optional: track which element uses it
            });
          }
          
          console.log(`📊 Chart "${chart.title}" uses asset: ${slug} (element ${i})`);
        }
      }
    }
    
    const usageCount = chartReferences.length;
    
    console.log(`✅ Asset usage check: "${slug}" used in ${usageCount} chart(s)`);
    
    return NextResponse.json({
      success: true,
      slug,
      usageCount,
      charts: chartReferences
    } as AssetUsageResponse);
    
  } catch (error) {
    console.error('❌ GET /api/content-assets/usage error:', error);
    return NextResponse.json(
      {
        success: false,
        slug: '',
        usageCount: 0,
        charts: [],
        error: error instanceof Error ? error.message : 'Failed to fetch asset usage'
      } as AssetUsageResponse,
      { status: 500 }
    );
  }
}
