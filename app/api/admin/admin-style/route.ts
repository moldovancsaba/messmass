import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

/**
 * Admin Page Style Configuration API
 * Stores a styleId in the 'settings' collection under _id: 'adminStyle'.
 * This lets admin pages adopt a different style than the global default if desired.
 */

interface AdminStyleSetting {
  _id: 'adminStyle';
  styleId: string | null;
  updatedAt: string;
}

// Settings collection document type (string _id)
interface SettingsDoc {
  _id: string;
  styleId: string | null;
  updatedAt: string;
}

// GET /api/admin/admin-style - Retrieve current admin page style configuration
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(MONGODB_DB);
    const settings = db.collection<SettingsDoc>('settings');
    const pageStyles = db.collection('pageStyles');

    const setting = await settings.findOne({ _id: 'adminStyle' });

    let adminStyle: any = null;
    if (setting?.styleId) {
      try {
        adminStyle = await pageStyles.findOne({ _id: new ObjectId(setting.styleId) });
        if (adminStyle) adminStyle._id = adminStyle._id.toString();
      } catch {
        adminStyle = null;
      }
    }

    return NextResponse.json({ success: true, adminStyle, hasAdminStyle: !!adminStyle, lastUpdated: setting?.updatedAt });
  } catch (error) {
    console.error('❌ Failed to fetch admin style configuration:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch admin style configuration' }, { status: 500 });
  }
}

// POST /api/admin/admin-style - Set/update admin page style configuration
export async function POST(request: NextRequest) {
  try {
    const { styleId } = await request.json();

    const client = await clientPromise;
    const db = client.db(MONGODB_DB);
    const settings = db.collection<SettingsDoc>('settings');
    const pageStyles = db.collection('pageStyles');

    // validate if provided
    if (styleId && styleId !== 'null') {
      if (!ObjectId.isValid(styleId)) {
        return NextResponse.json({ success: false, error: 'Invalid styleId' }, { status: 400 });
      }
      const exists = await pageStyles.findOne({ _id: new ObjectId(styleId) });
      if (!exists) {
        return NextResponse.json({ success: false, error: 'Style not found' }, { status: 404 });
      }
    }

    const now = new Date().toISOString();
    const doc: AdminStyleSetting = {
      _id: 'adminStyle',
      styleId: styleId && styleId !== 'null' ? styleId : null,
      updatedAt: now,
    };

    await settings.replaceOne({ _id: 'adminStyle' }, doc, { upsert: true });

    let adminStyle: any = null;
    if (doc.styleId) {
      adminStyle = await pageStyles.findOne({ _id: new ObjectId(doc.styleId) });
      if (adminStyle) adminStyle._id = adminStyle._id.toString();
    }

    return NextResponse.json({ success: true, adminStyle, hasAdminStyle: !!adminStyle });
  } catch (error) {
    console.error('❌ Failed to set admin style configuration:', error);
    return NextResponse.json({ success: false, error: 'Failed to set admin style configuration' }, { status: 500 });
  }
}

