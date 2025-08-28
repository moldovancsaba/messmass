import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { PageStyle, DataVisualizationBlock, DEFAULT_PAGE_STYLE } from '@/lib/pageStyleTypes';

const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

// GET /api/page-config - Get page configuration for stat pages
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(MONGODB_DB);

    // Get page style (use first one or create default)
    const pageStylesCollection = db.collection('pageStyles');
    let pageStyle = await pageStylesCollection.findOne({});
    
    if (!pageStyle) {
      // Create default page style
      const defaultStyle = {
        ...DEFAULT_PAGE_STYLE,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const result = await pageStylesCollection.insertOne(defaultStyle);
      pageStyle = { ...defaultStyle, _id: result.insertedId };
    }

    // Get all active data visualization blocks
    const dataBlocksCollection = db.collection('dataBlocks');
    const dataBlocks = await dataBlocksCollection
      .find({ isActive: true })
      .sort({ order: 1 })
      .toArray();

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
        pageStyle: {
          ...pageStyle,
          _id: pageStyle._id.toString()
        },
        dataBlocks: dataBlocks.map(block => ({
          ...block,
          _id: block._id.toString()
        }))
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
