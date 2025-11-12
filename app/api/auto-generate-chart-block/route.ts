// app/api/auto-generate-chart-block/route.ts
// WHAT: Auto-generate chart algorithm blocks for reportImageN and reportTextN variables
// WHY: Streamline workflow - upload in Clicker → immediately usable in Visualization editor
// HOW: Create chart_algorithms document with proper structure (IMAGE or TEXT type, single element)

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { ChartConfiguration } from '@/lib/chartConfigTypes';

import config from '@/lib/config';
const MONGODB_DB = config.dbName;

// WHAT: POST /api/auto-generate-chart-block - Create or update chart block for report content
// WHY: Automatically create chart algorithms when users upload images or add texts
// HOW: Detect if block exists (chartId = report-image-N or report-text-N), create or update
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, index, value } = body;

    // WHAT: Validate request payload
    // WHY: Ensure we have all required fields
    if (!type || !index || !value) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: type, index, value' },
        { status: 400 }
      );
    }

    if (!['image', 'text'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Type must be "image" or "text"' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(MONGODB_DB);
    const chartsCollection = db.collection('chart_algorithms');
    const blocksCollection = db.collection('data_blocks');

    // WHAT: Generate chart configuration for this slot
    // WHY: Each reportImage/Text slot gets a corresponding chart block
    const chartId = type === 'image' 
      ? `report-image-${index}` 
      : `report-text-${index}`;
    
    const chartTitle = type === 'image'
      ? `Report Image ${index}`
      : `Report Text ${index}`;
    
    const variableName = type === 'image'
      ? `reportImage${index}`
      : `reportText${index}`;

    const now = new Date().toISOString();

    // WHAT: Define chart configuration based on type
    // WHY: IMAGE charts display URLs, TEXT charts display text content
    const chartConfig: Omit<ChartConfiguration, '_id'> = {
      chartId,
      title: chartTitle,
      type: type === 'image' ? 'image' : 'text',
      order: 9000 + index, // WHAT: High order numbers to appear at end of chart list
      isActive: true,
      elements: [{
        id: `${type}-element-${index}`,
        label: chartTitle,
        formula: `stats.${variableName}`, // WHAT: Reference the stats variable
        color: '#3b82f6', // Blue accent color (not visible for image/text charts)
        type: 'number' // Placeholder type (not used for image/text)
      }],
      // WHAT: For IMAGE charts, detect aspect ratio from value (URL query param or default)
      // WHY: Proper grid width calculation in report templates
      ...(type === 'image' && {
        aspectRatio: detectAspectRatio(value)
      }),
      icon: type === 'image' ? 'image' : 'article', // Material Icons
      iconVariant: 'outlined',
      createdAt: now,
      updatedAt: now
    };

    // WHAT: Check if chart algorithm already exists
    // WHY: Update existing blocks instead of creating duplicates
    const existingChart = await chartsCollection.findOne({ chartId });

    if (existingChart) {
      // WHAT: Update existing chart (e.g., when replacing image or editing text)
      // WHY: Keep chart blocks in sync with current content
      await chartsCollection.updateOne(
        { chartId },
        { 
          $set: { 
            ...chartConfig,
            createdAt: existingChart.createdAt, // Preserve original creation time
            updatedAt: now 
          } 
        }
      );

      console.log(`✅ Updated chart algorithm: ${chartId}`);

      return NextResponse.json({
        success: true,
        action: 'updated',
        chartId,
        message: `Chart block "${chartTitle}" updated successfully`
      });
    } else {
      // WHAT: Create new chart algorithm
      // WHY: First time this slot is used
      const chartResult = await chartsCollection.insertOne(chartConfig);

      console.log(`✅ Created chart algorithm: ${chartId}`);

      // WHAT: Also create data_block wrapper for visualization editor
      // WHY: Visualization editor uses data_blocks as container, which references chart_algorithms
      const dataBlockName = `${chartTitle} Block`;
      const dataBlock = {
        name: dataBlockName,
        charts: [{
          chartId,
          width: type === 'image' ? detectGridWidth(value) : 2, // WHAT: Images use aspect ratio, texts use 2 units
          conditions: [] as any[] // WHAT: Always visible (no display conditions)
        }],
        order: 9000 + index, // WHAT: High order to appear at end of block list
        isActive: true,
        showTitle: false, // WHAT: Don't show block title for auto-generated content blocks
        createdAt: now,
        updatedAt: now
      };

      // WHAT: Check if data block wrapper already exists
      // WHY: Avoid duplicates if chart existed but block didn't
      const existingBlock = await blocksCollection.findOne({ 
        'charts.chartId': chartId 
      });

      if (!existingBlock) {
        const blockResult = await blocksCollection.insertOne(dataBlock);
        console.log(`✅ Created data block wrapper: ${dataBlockName}`);
      }

      return NextResponse.json({
        success: true,
        action: 'created',
        chartId,
        blockId: chartResult.insertedId.toString(),
        message: `Chart block "${chartTitle}" created successfully`
      });
    }

  } catch (error) {
    console.error('❌ Failed to auto-generate chart block:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to auto-generate chart block' },
      { status: 500 }
    );
  }
}

// WHAT: Helper to detect aspect ratio from image URL or default to 16:9
// WHY: IMAGE charts need aspect ratio for proper grid width calculation
// HOW: Check URL query params or metadata (future enhancement), default landscape
function detectAspectRatio(imageUrl: string): '16:9' | '9:16' | '1:1' {
  // WHAT: Future enhancement - parse aspect ratio from ImgBB metadata or URL params
  // WHY: Automatically set correct grid width based on image orientation
  // FOR NOW: Default to landscape (most common for event photos)
  
  // Example future implementation:
  // if (imageUrl.includes('aspect=9:16')) return '9:16';
  // if (imageUrl.includes('aspect=1:1')) return '1:1';
  
  return '16:9'; // Default: landscape
}

// WHAT: Helper to calculate grid width from aspect ratio or type
// WHY: data_blocks need width value for proper grid layout
// HOW: Match aspect ratio grid widths: portrait=1, square=2, landscape=3, text=2
function detectGridWidth(value: string): number {
  const aspectRatio = detectAspectRatio(value);
  
  // WHAT: Map aspect ratios to grid units (from calculateImageWidth in lib/imageLayoutUtils.ts)
  // WHY: Consistent with existing IMAGE chart width calculation
  switch (aspectRatio) {
    case '9:16': return 1; // Portrait
    case '1:1': return 2;  // Square
    case '16:9': return 3; // Landscape
    default: return 2;     // Fallback
  }
}
