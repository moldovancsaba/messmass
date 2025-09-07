import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { PageStyle, DataVisualizationBlock, DEFAULT_PAGE_STYLE } from '@/lib/pageStyleTypes';

import config from '@/lib/config';
const MONGODB_DB = config.dbName;

/**
 * Resolve style based on fallback hierarchy:
 * 1. Project-specific style (if projectId provided)
 * 2. Global default style
 * 3. System default style
 */
async function resolvePageStyle(db: any, projectId?: string, styleId?: string, hashtags?: string[]): Promise<PageStyle> {
  const pageStylesCollection = db.collection('pageStyles');
  const settingsCollection = db.collection('settings');
  const projectsCollection = db.collection('projects');
  const hashtagStylesCollection = db.collection('hashtagStyles');
  
  console.log('🎨 Resolving page style with hierarchy:', { projectId, styleId, hashtags });
  
  // 1. Try to use explicitly provided styleId (highest priority)
  if (styleId) {
    try {
      const explicitStyle = await pageStylesCollection.findOne({ _id: new ObjectId(styleId) });
      if (explicitStyle) {
        console.log('✅ Using explicit style:', explicitStyle.name);
        return { ...explicitStyle, _id: explicitStyle._id.toString() };
      }
    } catch (error) {
      console.log('⚠️ Invalid explicit styleId:', error);
    }
  }
  
  // 2. Try to use project-specific style
  if (projectId) {
    try {
      // Build $or conditions safely: only attempt ObjectId match if valid
      const orConds: any[] = [
        { viewSlug: projectId },
        { editSlug: projectId }
      ];
      if (ObjectId.isValid(projectId)) {
        orConds.push({ _id: new ObjectId(projectId) });
      }

      const project = await projectsCollection.findOne({ $or: orConds });
      
      if (project && project.styleId) {
        // styleId may be stored as string or ObjectId; guard for validity
        let styleDoc: any = null;
        try {
          if (typeof project.styleId === 'string' && ObjectId.isValid(project.styleId)) {
            styleDoc = await pageStylesCollection.findOne({ _id: new ObjectId(project.styleId) });
          } else if (project.styleId && typeof project.styleId === 'object') {
            styleDoc = await pageStylesCollection.findOne({ _id: project.styleId });
          }
        } catch (e) {
          console.log('⚠️ Project style reference invalid format, falling back');
        }
        if (styleDoc) {
          console.log('✅ Using project style:', styleDoc.name);
          return { ...styleDoc, _id: styleDoc._id.toString() };
        } else {
          console.log('⚠️ Project style reference is invalid, falling back');
        }
      }
    } catch (error) {
      console.log('⚠️ Error resolving project style:', error);
    }
  }

  // 3. Try to use hashtag-specific style (for filter or hashtag pages)
  if (hashtags && hashtags.length > 0) {
    try {
      const norm = hashtags.map(h => h.toLowerCase());
      const firstMatch = await hashtagStylesCollection.findOne({ _id: { $in: norm } });
      if (firstMatch?.styleId) {
        const style = await pageStylesCollection.findOne({ _id: new ObjectId(firstMatch.styleId) });
        if (style) {
          console.log('✅ Using hashtag-assigned style:', style.name, 'for', firstMatch._id);
          return { ...style, _id: style._id.toString() };
        }
      }
    } catch (error) {
      console.log('⚠️ Error resolving hashtag style:', error);
    }
  }
  
  // 4. Try to use global default style
  try {
    const globalStyleSetting = await settingsCollection.findOne({ _id: 'globalStyle' });
    if (globalStyleSetting && globalStyleSetting.styleId) {
      const globalStyle = await pageStylesCollection.findOne({ 
        _id: new ObjectId(globalStyleSetting.styleId) 
      });
      if (globalStyle) {
        console.log('✅ Using global default style:', globalStyle.name);
        return { ...globalStyle, _id: globalStyle._id.toString() };
      } else {
        console.log('⚠️ Global style reference is invalid, falling back to system default');
      }
    }
  } catch (error) {
    console.log('⚠️ Error resolving global style:', error);
  }
  
  // 5. Use first available style or create default
  try {
    const anyStyle = await pageStylesCollection.findOne({});
    if (anyStyle) {
      console.log('✅ Using first available style:', anyStyle.name);
      return { ...anyStyle, _id: anyStyle._id.toString() };
    }
  } catch (error) {
    console.log('⚠️ Error finding any style:', error);
  }
  
  // 6. Fall back to system default
  console.log('✅ Using system default style');
  return DEFAULT_PAGE_STYLE;
}

// GET /api/page-config - Get page configuration for stat pages
// Supports query parameters: projectId, styleId for style resolution
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  const styleId = searchParams.get('styleId');
  const hashtagsParam = searchParams.get('hashtags');
  const hashtags = hashtagsParam ? hashtagsParam.split(',').map(s => s.trim()).filter(Boolean) : undefined;
  try {
    const db = await (await import('@/lib/db')).getDb();

    // Resolve page style using hierarchy (explicit → project → hashtag → global → default)
    const pageStyle = await resolvePageStyle(db, projectId || undefined, styleId || undefined, hashtags);

    // Get all active data visualization blocks
    const dataBlocksCollection = db.collection('dataBlocks');
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
      const chartConfigCollection = db.collection('chartConfigurations');
      const existingCharts = await chartConfigCollection.find({ isActive: true }).toArray();
      
      // Create chart entries for the default block
      const charts = existingCharts.map((chart, index) => ({
        chartId: chart._id.toString(),
        width: 1, // Each chart takes 1 grid column by default
        order: index
      }));
      
      const defaultBlock = {
        name: 'Data Visualization',
        gridColumns: 3,
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
          gridColumns: 3,
          charts: [],
          order: 0,
          isActive: true
        }]
      }
    });
  }
}
