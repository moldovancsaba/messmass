import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { DataVisualizationBlock } from '@/lib/pageStyleTypes';

import config from '@/lib/config';
const MONGODB_DB = config.dbName;

// GET /api/data-blocks - Get all data visualization blocks
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(MONGODB_DB);
    const collection = db.collection('dataBlocks');

    const blocks = await collection.find({}).sort({ order: 1 }).toArray();

    return NextResponse.json({
      success: true,
      blocks: blocks.map(block => ({
        ...block,
        _id: block._id.toString()
      }))
    });

  } catch (error) {
    console.error('❌ Failed to fetch data blocks:', error);
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
    const collection = db.collection('dataBlocks');

    const now = new Date().toISOString();
    const dataBlock: Omit<DataVisualizationBlock, '_id'> = {
      name,
      charts: charts || [],
      order: order || 0,
      isActive: isActive !== false, // Default to true
      showTitle: showTitle !== false, // NEW: Default to true
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
    console.error('❌ Failed to create data block:', error);
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
    const collection = db.collection('dataBlocks');

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
    console.error('❌ Failed to update data block:', error);
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
    const collection = db.collection('dataBlocks');

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
    console.error('❌ Failed to delete data block:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete data block' },
      { status: 500 }
    );
  }
}
