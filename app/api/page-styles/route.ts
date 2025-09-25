import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { PageStyle } from '@/lib/pageStyleTypes';

import config from '@/lib/config';
const MONGODB_DB = config.dbName;

// GET /api/page-styles - Get all page styles
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(MONGODB_DB);
    const collection = db.collection('pageStyles');

    const styles = await collection.find({}).sort({ createdAt: -1 }).toArray();

    return NextResponse.json({
      success: true,
      styles: styles.map(style => ({
        ...style,
        _id: style._id.toString()
      }))
    });

  } catch (error) {
    console.error('❌ Failed to fetch page styles:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch page styles' },
      { status: 500 }
    );
  }
}

// DELETE /api/page-styles?id=... - Delete a page style
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid style id' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(MONGODB_DB);
    const collection = db.collection('pageStyles');

    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Style not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Failed to delete page style:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete page style' },
      { status: 500 }
    );
  }
}

// POST /api/page-styles - Create new page style
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, backgroundGradient, headerBackgroundGradient, contentBackgroundColor, titleBubble } = body;

    if (!name || !backgroundGradient || !headerBackgroundGradient || !titleBubble) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(MONGODB_DB);
    const collection = db.collection('pageStyles');

    const now = new Date().toISOString();
    const pageStyle: Omit<PageStyle, '_id'> = {
      name,
      backgroundGradient,
      headerBackgroundGradient,
      contentBackgroundColor: contentBackgroundColor || 'rgba(255, 255, 255, 0.95)',
      titleBubble,
      createdAt: now,
      updatedAt: now
    };

    const result = await collection.insertOne(pageStyle);

    return NextResponse.json({
      success: true,
      styleId: result.insertedId.toString(),
      style: {
        _id: result.insertedId.toString(),
        ...pageStyle
      }
    });

  } catch (error) {
    console.error('❌ Failed to create page style:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create page style' },
      { status: 500 }
    );
  }
}

// PUT /api/page-styles - Update page style
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { _id, name, backgroundGradient, headerBackgroundGradient, contentBackgroundColor, titleBubble } = body;

    if (!_id || !name || !backgroundGradient || !headerBackgroundGradient || !titleBubble) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(MONGODB_DB);
    const collection = db.collection('pageStyles');

    const updateData = {
      name,
      backgroundGradient,
      headerBackgroundGradient,
      contentBackgroundColor: contentBackgroundColor || 'rgba(255, 255, 255, 0.95)',
      titleBubble,
      updatedAt: new Date().toISOString()
    };

  const result = await collection.updateOne(
      { _id: new ObjectId(_id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Page style not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      style: {
        _id,
        ...updateData
      }
    });

  } catch (error) {
    console.error('❌ Failed to update page style:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update page style' },
      { status: 500 }
    );
  }
}
