// WHAT: Cities API - List cities with optional country filtering
// WHY: Support location dropdowns and partner filtering
// HOW: Query cities collection with country references

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cities
 * 
 * Query params:
 * - countryId?: string (MongoDB ObjectId of country)
 * 
 * Response:
 * {
 *   "cities": [
 *     { "_id", "name", "countryId", "country": { "name", "flag" } }
 *   ]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const countryIdParam = searchParams.get('countryId');
    
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || 'messmass');
    
    // Build query filter
    const filter: Record<string, unknown> = { active: true };
    if (countryIdParam) {
      filter.countryId = new ObjectId(countryIdParam);
    }
    
    // Fetch cities with country details
    const cities = await db.collection('cities')
      .aggregate([
        { $match: filter },
        {
          $lookup: {
            from: 'countries',
            localField: 'countryId',
            foreignField: '_id',
            as: 'country'
          }
        },
        { $unwind: '$country' },
        { $sort: { name: 1 } }
      ])
      .toArray();
    
    return NextResponse.json({
      cities: cities.map((city: any) => ({
        _id: city._id.toString(),
        name: city.name,
        countryId: city.countryId.toString(),
        country: {
          name: city.country.name,
          flag: city.country.flag
        }
      }))
    });
    
  } catch (error) {
    console.error('[API] Error fetching cities:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch cities' },
      { status: 500 }
    );
  }
}
