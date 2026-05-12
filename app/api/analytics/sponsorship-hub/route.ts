import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/auth';
import {
  getSponsorshipHubData,
  type SponsorshipHubRangePreset,
  type SponsorshipHubScopeType,
} from '@/lib/sponsorshipHub';

const ALLOWED_SCOPE_TYPES: SponsorshipHubScopeType[] = ['portfolio', 'partner', 'organization', 'project'];
const ALLOWED_RANGE_PRESETS: SponsorshipHubRangePreset[] = ['all', '30d', '90d', '365d'];

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Admin authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const scopeTypeParam = searchParams.get('scopeType') || 'portfolio';
    const scopeId = searchParams.get('scopeId');
    const rangePresetParam = searchParams.get('rangePreset') || 'all';
    const scopeType = ALLOWED_SCOPE_TYPES.includes(scopeTypeParam as SponsorshipHubScopeType)
      ? (scopeTypeParam as SponsorshipHubScopeType)
      : 'portfolio';
    const rangePreset = ALLOWED_RANGE_PRESETS.includes(rangePresetParam as SponsorshipHubRangePreset)
      ? (rangePresetParam as SponsorshipHubRangePreset)
      : 'all';

    if (scopeType !== 'portfolio' && !scopeId) {
      return NextResponse.json(
        { success: false, error: 'scopeId is required for this scope type' },
        { status: 400 }
      );
    }

    const data = await getSponsorshipHubData({
      scopeType,
      scopeId,
      rangePreset,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load sponsorship hub',
      },
      { status: 500 }
    );
  }
}
