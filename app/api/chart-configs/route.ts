import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

import config from '@/lib/config';
const MONGODB_DB = config.dbName;

// GET /api/chart-configs - Get all chart configurations
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(MONGODB_DB);
    const collection = db.collection('chartConfigurations');

    const configs = await collection.find({}).sort({ order: 1 }).toArray();

    return NextResponse.json({
      success: true,
      configs: configs.map(config => ({
        chartId: config.chartId,
        title: config.title,
        type: config.type,
        order: config.order,
        isActive: config.isActive,
        emoji: config.emoji
      }))
    });

  } catch (error) {
    console.error('❌ Failed to fetch chart configurations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch chart configurations' },
      { status: 500 }
    );
  }
}
