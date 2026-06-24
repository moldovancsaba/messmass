import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/db';
import { getAdminUser } from '@/lib/auth';
import { updateReportVariant } from '@/lib/reportVariants';
import { ReportPeriodValidationError } from '@/lib/reportPeriodValidation';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Admin authentication required' }, { status: 401 });
    }

    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid report variant id' }, { status: 400 });
    }

    const db = await getDb();
    const variant = await db.collection('report_variants').findOne({ _id: new ObjectId(id) });
    if (!variant) {
      return NextResponse.json({ success: false, error: 'Report variant not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      variant: {
        ...variant,
        _id: variant._id.toString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load report variant',
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Admin authentication required' }, { status: 401 });
    }

    const { id } = await params;
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) {
      return NextResponse.json({ success: false, error: 'Body is required' }, { status: 400 });
    }

    const db = await getDb();
    const variant = await updateReportVariant(db, id, body as any);

    return NextResponse.json({
      success: true,
      variant,
    });
  } catch (error) {
    if (error instanceof ReportPeriodValidationError) {
      return NextResponse.json(
        { success: false, error: error.message, code: error.code },
        { status: error.status }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update report variant',
      },
      { status: 500 }
    );
  }
}
