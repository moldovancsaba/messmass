import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { error as logError } from '@/lib/logger';

import config from '@/lib/config';
const MONGODB_DB = config.dbName;

// WHAT: Data visualization block interface
// WHY: Reusable blocks of charts for report templates
interface DataVisualizationBlock {
  _id?: string;
  name: string;
  charts: Array<{
    chartId: string;
    width: number;
    order: number;
    unitSize?: 1 | 2;
    aspectRatio?: '1:1' | '2:1' | '16:9' | '9:16';
  }>;
  order: number;
  isActive: boolean;
  showTitle?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// GET /api/data-blocks - Get all data visualization blocks
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(MONGODB_DB);
    const collection = db.collection('data_blocks');

    const blocks = await collection.find({}).sort({ order: 1 }).toArray();

    return NextResponse.json({
      success: true,
      blocks: blocks.map(block => ({
        ...block,
        _id: block._id.toString()
      }))
    });

  } catch (error) {
    logError('Failed to fetch data blocks', { context: 'data-blocks' }, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { success: false, error: 'Failed to fetch data blocks' },
      { status: 500 }
    );
  }
}


// POST /api/data-blocks - Create new data visualization block
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, charts, order, isActive, showTitle } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(MONGODB_DB);
    const collection = db.collection('data_blocks');

    const now = new Date().toISOString();
    const dataBlock: Omit<DataVisualizationBlock, '_id'> = {
      name,
      charts: charts || [],
      order: order || 0,
      isActive: isActive !== false, // Default to true
      showTitle: showTitle !== false, // Default to true
      createdAt: now,
      updatedAt: now
    };

    const result = await collection.insertOne(dataBlock);

    return NextResponse.json({
      success: true,
      blockId: result.insertedId.toString(),
      block: {
        _id: result.insertedId.toString(),
        ...dataBlock
      }
    });

  } catch (error) {
    logError('Failed to create data block', { context: 'data-blocks' }, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { success: false, error: 'Failed to create data block' },
      { status: 500 }
    );
  }
}

// PUT /api/data-blocks - Update data visualization block
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { _id, name, charts, order, isActive, showTitle } = body;

    if (!_id || !name) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(MONGODB_DB);
    const collection = db.collection('data_blocks');

    const updateData = {
      name,
      charts: charts || [],
      order: order || 0,
      isActive: isActive !== false,
      showTitle: showTitle !== false,
      updatedAt: new Date().toISOString()
    };

    const result = await collection.updateOne(
      { _id: new ObjectId(_id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Data block not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      block: {
        _id,
        ...updateData
      }
    });

  } catch (error) {
    logError('Failed to update data block', { context: 'data-blocks' }, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { success: false, error: 'Failed to update data block' },
      { status: 500 }
    );
  }
}

// DELETE /api/data-blocks - Delete data visualization block
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const blockId = url.searchParams.get('id');

    if (!blockId) {
      return NextResponse.json(
        { success: false, error: 'Block ID is required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(MONGODB_DB);
    const collection = db.collection('data_blocks');

    const result = await collection.deleteOne({ _id: new ObjectId(blockId) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Data block not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Data block deleted successfully'
    });

  } catch (error) {
    logError('Failed to delete data block', { context: 'data-blocks' }, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { success: false, error: 'Failed to delete data block' },
      { status: 500 }
    );
  }
}
