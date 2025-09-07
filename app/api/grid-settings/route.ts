// app/api/grid-settings/route.ts
// WHAT: API to get/update grid settings (Desktop/Tablet/Mobile unit counts)
// WHY: Admin-configurable unit-based layout across all pages.

import { NextRequest, NextResponse } from 'next/server';
import { getGridSettingsFromDb, computePercentages, DEFAULT_GRID_SETTINGS } from '@/lib/gridSettings';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';

const MONGODB_DB = config.dbName;

export async function GET() {
  try {
    const settings = await getGridSettingsFromDb();
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    return NextResponse.json({ success: true, settings: DEFAULT_GRID_SETTINGS });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Optional: require admin auth later
    const body = await request.json();
    const nextSettings = computePercentages({
      desktopUnits: body?.desktopUnits ?? DEFAULT_GRID_SETTINGS.desktopUnits,
      tabletUnits: body?.tabletUnits ?? DEFAULT_GRID_SETTINGS.tabletUnits,
      mobileUnits: body?.mobileUnits ?? DEFAULT_GRID_SETTINGS.mobileUnits,
    });

    const client = await clientPromise;
    const db = client.db(MONGODB_DB);
    const settingsColl = db.collection('settings');
    await settingsColl.updateOne(
      { _id: 'gridSettings' } as any,
      {
        $set: {
          desktopUnits: nextSettings.desktopUnits,
          tabletUnits: nextSettings.tabletUnits,
          mobileUnits: nextSettings.mobileUnits,
          unitPercentages: nextSettings.unitPercentages,
          updatedAt: nextSettings.updatedAt,
        },
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true, settings: nextSettings });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to update grid settings' }, { status: 500 });
  }
}

