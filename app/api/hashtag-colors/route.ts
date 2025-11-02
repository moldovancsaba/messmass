export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import getDb from '@/lib/db';

interface HashtagColor {
  _id?: ObjectId;
  uuid: string;
  name: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

// GET /api/hashtag-colors - Fetch all hashtag colors
export async function GET() {
  try {
    const db = await getDb();
    const hashtagColors = await db
      .collection('hashtag_colors')
      .find({})
      .sort({ name: 1 })
      .toArray();

    return NextResponse.json({
      success: true,
      hashtagColors: hashtagColors.map(color => ({
        _id: color._id.toString(),
        uuid: color.uuid,
        name: color.name,
        color: color.color,
        createdAt: color.createdAt,
        updatedAt: color.updatedAt
      }))
    });
  } catch (error) {
    console.error('Failed to fetch hashtag colors:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch hashtag colors' },
      { status: 500 }
    );
  }
}

// POST /api/hashtag-colors - Create new hashtag color
export async function POST(request: NextRequest) {
  try {
    const { name, color } = await request.json();

    if (!name || !color) {
      return NextResponse.json(
        { success: false, error: 'Name and color are required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    
    // Check if hashtag name already exists
    const existingHashtag = await db
      .collection('hashtag_colors')
      .findOne({ name: name.toLowerCase() });

    if (existingHashtag) {
      return NextResponse.json(
        { success: false, error: 'Hashtag with this name already exists' },
        { status: 409 }
      );
    }

    const newHashtagColor: HashtagColor = {
      uuid: uuidv4(),
      name: name.toLowerCase(),
      color,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db
      .collection('hashtag_colors')
      .insertOne(newHashtagColor);

    return NextResponse.json({
      success: true,
      hashtagColor: {
        _id: result.insertedId.toString(),
        uuid: newHashtagColor.uuid,
        name: newHashtagColor.name,
        color: newHashtagColor.color,
        createdAt: newHashtagColor.createdAt,
        updatedAt: newHashtagColor.updatedAt
      }
    });
  } catch (error) {
    console.error('Failed to create hashtag color:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create hashtag color' },
      { status: 500 }
    );
  }
}

// PUT /api/hashtag-colors - Update hashtag color
export async function PUT(request: NextRequest) {
  try {
    const { _id, name, color } = await request.json();

    const db = await getDb();
    
    // Handle two cases: update by _id (traditional) or by name (for editor)
    let filter;
    let updateOperation;
    
    if (_id) {
      // Traditional update by _id
      if (!name || !color) {
        return NextResponse.json(
          { success: false, error: 'ID, name and color are required' },
          { status: 400 }
        );
      }
      
      // Check if another hashtag with the same name exists (excluding current one)
      const existingHashtag = await db
        .collection('hashtag_colors')
        .findOne({ 
          name: name.toLowerCase(),
          _id: { $ne: new ObjectId(_id) }
        });

      if (existingHashtag) {
        return NextResponse.json(
          { success: false, error: 'Another hashtag with this name already exists' },
          { status: 409 }
        );
      }
      
      filter = { _id: new ObjectId(_id) };
      updateOperation = {
        $set: {
          name: name.toLowerCase(),
          color,
          updatedAt: new Date()
        }
      };
    } else if (name && color) {
      // Update by name (for hashtag editor)
      filter = { name: name.toLowerCase() };
      updateOperation = {
        $set: {
          color,
          updatedAt: new Date()
        }
      };
    } else {
      return NextResponse.json(
        { success: false, error: 'Either _id or name is required along with color' },
        { status: 400 }
      );
    }

    const result = await db
      .collection('hashtag_colors')
      .updateOne(filter, updateOperation);

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Hashtag color not found' },
        { status: 404 }
      );
    }

    // Fetch updated document
    const updatedHashtag = await db
      .collection('hashtag_colors')
      .findOne(filter);

    return NextResponse.json({
      success: true,
      hashtagColor: {
        _id: updatedHashtag!._id.toString(),
        uuid: updatedHashtag!.uuid,
        name: updatedHashtag!.name,
        color: updatedHashtag!.color,
        createdAt: updatedHashtag!.createdAt,
        updatedAt: updatedHashtag!.updatedAt
      }
    });
  } catch (error) {
    console.error('Failed to update hashtag color:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update hashtag color' },
      { status: 500 }
    );
  }
}

// DELETE /api/hashtag-colors - Delete hashtag color
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Hashtag color ID is required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    
    const result = await db
      .collection('hashtag_colors')
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Hashtag color not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Hashtag color deleted successfully'
    });
  } catch (error) {
    console.error('Failed to delete hashtag color:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete hashtag color' },
      { status: 500 }
    );
  }
}
