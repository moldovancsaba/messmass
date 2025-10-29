// WHAT: Countries API - List all countries with optional region filtering
// WHY: Support frontend dropdowns, filters, and geographic analytics
// HOW: Query countries collection with caching

import { NextRequest, NextResponse } from 'next/server';
import { getAllCountries } from '@/lib/countryService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/countries
 * 
 * Query params:
 * - region?: string (e.g., "Europe", "Asia", "Americas", "Africa", "Oceania")
 * 
 * Response:
 * {
 *   "countries": [
 *     { "_id", "code", "name", "flag", "region", "subregion" }
 *   ]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region') || undefined;
    
    const countries = await getAllCountries(region);
    
    return NextResponse.json({
      countries: countries.map(c => ({
        _id: c._id.toString(),
        code: c.code,
        name: c.name,
        flag: c.flag,
        region: c.region,
        subregion: c.subregion
      }))
    });
    
  } catch (error) {
    console.error('[API] Error fetching countries:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch countries' },
      { status: 500 }
    );
  }
}
