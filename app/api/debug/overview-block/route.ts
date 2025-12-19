import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';

const MONGODB_DB = config.dbName;

// GET /api/debug/overview-block - Debug endpoint to show raw OVERVIEW block data
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(MONGODB_DB);
    const collection = db.collection('data_blocks');

    const overviewBlock = await collection.findOne({ name: 'OVERVIEW' });

    return NextResponse.json({
      success: true,
      block: overviewBlock ? {
        ...overviewBlock,
        _id: overviewBlock._id.toString()
      } : null,
      message: overviewBlock ? 'OVERVIEW block found' : 'OVERVIEW block not found'
    });

  } catch (error) {
    console.error('❌ Failed to fetch OVERVIEW block:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
