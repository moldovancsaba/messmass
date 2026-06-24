import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminUser } from '@/lib/auth';
import {
  createReportVariant,
  listReportVariants,
  type ReportVariantOwnerType,
} from '@/lib/reportVariants';
import type { ReportCustomDateRange, ReportPeriodPreset } from '@/lib/reportPeriods';
import { ReportPeriodValidationError } from '@/lib/reportPeriodValidation';

const ALLOWED_OWNER_TYPES: ReportVariantOwnerType[] = ['organization', 'partner', 'hashtag', 'filter'];

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Admin authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const ownerType = searchParams.get('ownerType') as ReportVariantOwnerType | null;
    const ownerId = searchParams.get('ownerId');

    if (!ownerType || !ALLOWED_OWNER_TYPES.includes(ownerType)) {
      return NextResponse.json({ success: false, error: 'Valid ownerType is required' }, { status: 400 });
    }

    if (!ownerId) {
      return NextResponse.json({ success: false, error: 'ownerId is required' }, { status: 400 });
    }

    const db = await getDb();
    const { baseSource, variants } = await listReportVariants(db, ownerType, ownerId);

    return NextResponse.json({
      success: true,
      owner: baseSource,
      variants,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load report variants',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Admin authentication required' }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as {
      ownerType?: ReportVariantOwnerType;
      ownerId?: string;
      name?: string;
      periodPreset?: ReportPeriodPreset;
      customDateRange?: ReportCustomDateRange | null;
      timezone?: string;
    } | null;

    if (!body?.ownerType || !ALLOWED_OWNER_TYPES.includes(body.ownerType)) {
      return NextResponse.json({ success: false, error: 'Valid ownerType is required' }, { status: 400 });
    }

    if (!body.ownerId || !body.name?.trim()) {
      return NextResponse.json({ success: false, error: 'ownerId and name are required' }, { status: 400 });
    }

    const db = await getDb();
    const variant = await createReportVariant(db, {
      ownerType: body.ownerType,
      ownerId: body.ownerId,
      name: body.name,
      periodPreset: body.periodPreset,
      customDateRange: body.customDateRange,
      timezone: body.timezone,
    });

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
        error: error instanceof Error ? error.message : 'Failed to create report variant',
      },
      { status: 500 }
    );
  }
}
