// WHAT: Country details API - Get country by ISO code
// WHY: Fetch full country information including flag and aliases
// HOW: Use countryService with caching

import { NextRequest, NextResponse } from 'next/server';
import { getCountryByCode } from '@/lib/countryService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/countries/[code]
 * 
 * Path params:
 * - code: ISO 3166-1 alpha-2 code (e.g., "US", "HU")
 * 
 * Response:
 * {
 *   "_id", "code", "name", "flag", "aliases", "region", "subregion"
 * }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    
    if (!code) {
      return NextResponse.json(
        { error: 'Country code is required' },
        { status: 400 }
      );
    }
    
    const country = await getCountryByCode(code);
    
    if (!country) {
      return NextResponse.json(
        { error: 'Country not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      _id: country._id.toString(),
      code: country.code,
      name: country.name,
      flag: country.flag,
      aliases: country.aliases,
      region: country.region,
      subregion: country.subregion
    });
    
  } catch (error) {
    console.error('[API] Error fetching country:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch country' },
      { status: 500 }
    );
  }
}
