import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { PageStyle, DataVisualizationBlock, DEFAULT_PAGE_STYLE } from '@/lib/pageStyleTypes';
import { PageStyleEnhanced, getDefaultPageStyle } from '@/lib/pageStyleTypesEnhanced';

import config from '@/lib/config';
const MONGODB_DB = config.dbName;

/**
 * WHAT: Resolve page style using ONLY the new page_styles_enhanced system
 * WHY: Simplified, single source of truth - old pageStyles system completely removed
 * HOW: Check project.styleIdEnhanced → isGlobalDefault → first available → hardcoded default
 * 
 * Fallback hierarchy:
 * 1. Project-specific style (styleIdEnhanced field)
 * 2. Global default style (isGlobalDefault: true)
 * 3. First available style (any style in collection)
 * 4. System hardcoded default (from getDefaultPageStyle)
 */
async function resolvePageStyle(db: any, projectId?: string): Promise<any> {
  const pageStylesCollection = db.collection('page_styles_enhanced');
  const projectsCollection = db.collection('projects');
  
  console.log('🎨 Resolving page style for project:', projectId);
  
  // 1. Try to use project-specific style
  if (projectId) {
    try {
      // Build query: match by _id, viewSlug, or editSlug
      const orConds: any[] = [
        { viewSlug: projectId },
        { editSlug: projectId }
      ];
      if (ObjectId.isValid(projectId)) {
        orConds.push({ _id: new ObjectId(projectId) });
      }

      const project = await projectsCollection.findOne({ $or: orConds });
      
      if (project?.styleIdEnhanced) {
        let styleDoc: any = null;
        try {
          if (typeof project.styleIdEnhanced === 'string' && ObjectId.isValid(project.styleIdEnhanced)) {
            styleDoc = await pageStylesCollection.findOne({ _id: new ObjectId(project.styleIdEnhanced) });
          } else if (project.styleIdEnhanced && typeof project.styleIdEnhanced === 'object') {
            styleDoc = await pageStylesCollection.findOne({ _id: project.styleIdEnhanced });
          }
        } catch (e) {
          console.log('⚠️ Project style reference invalid format');
        }
        if (styleDoc) {
          console.log('✅ Using project-specific style:', styleDoc.name);
          return styleDoc;
        }
      }
    } catch (error) {
      console.log('⚠️ Error resolving project style:', error);
    }
  }
  
  // 2. Try to use global default style
  try {
    const globalStyle = await pageStylesCollection.findOne({ isGlobalDefault: true });
    if (globalStyle) {
      console.log('✅ Using global default style:', globalStyle.name);
      return globalStyle;
    }
  } catch (error) {
    console.log('⚠️ Error resolving global default:', error);
  }
  
  // 3. Use first available style
  try {
    const anyStyle = await pageStylesCollection.findOne({});
    if (anyStyle) {
      console.log('✅ Using first available style:', anyStyle.name);
      return anyStyle;
    }
  } catch (error) {
    console.log('⚠️ Error finding any style:', error);
  }
  
  // 4. Fall back to system hardcoded default
  console.log('✅ Using system hardcoded default (no styles in database)');
  return getDefaultPageStyle();
}

// GET /api/page-config - Get page configuration for stat pages
// Supports query parameter: projectId (for project-specific style lookup)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  
  try {
    const db = await (await import('@/lib/db')).getDb();

    // Resolve page style using simplified hierarchy (project → global → first → default)
    const pageStyle = await resolvePageStyle(db, projectId || undefined);

    // Get all active data visualization blocks
    const dataBlocksCollection = db.collection('data_blocks');
    const dataBlocks = await dataBlocksCollection
      .find({ isActive: true })
      .sort({ order: 1 })
      .toArray();

    // Load grid settings from DB (global units per breakpoint)
    const { getGridSettingsFromDb } = await import('@/lib/gridSettings');
    const gridSettings = await getGridSettingsFromDb();

    // If no data blocks exist, create a default one with existing charts
    if (dataBlocks.length === 0) {
      // Get all existing chart configurations
      const chartConfigCollection = db.collection('chart_configurations');
      const existingCharts = await chartConfigCollection.find({ isActive: true }).toArray();
      
      // Create chart entries for the default block
      const charts = existingCharts.map((chart, index) => ({
        chartId: chart.chartId, // FIXED: Use chartId, not _id
        width: 1, // Each chart takes 1 grid column by default
        order: index
      }));
      
      const defaultBlock = {
        name: 'Data Visualization',
        charts: charts,
        order: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      console.log(`📊 Creating default data block with ${charts.length} charts`);
      const result = await dataBlocksCollection.insertOne(defaultBlock);
      dataBlocks.push({ ...defaultBlock, _id: result.insertedId });
    }

    return NextResponse.json({
      success: true,
      config: {
        pageStyle: pageStyle,
        dataBlocks: dataBlocks.map(block => ({
          ...block,
          _id: block._id.toString()
        })),
        gridSettings
      }
    });

  } catch (error) {
    console.error('❌ Failed to fetch page configuration:', error);
    
    // Return default configuration on error
    return NextResponse.json({
      success: true,
      config: {
        pageStyle: DEFAULT_PAGE_STYLE,
        dataBlocks: [{
          name: 'Data Visualization',
          charts: [],
          order: 0,
          isActive: true
        }]
      }
    });
  }
}
