// WHAT: Aggregate Bitly metrics for partner-level KYC
// WHY: Partners need to see total Bitly performance across all their events
// HOW: Sum metrics from all events associated with this partner

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getAdminUser } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: partnerId } = await params;
  try {
    const user = await getAdminUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!ObjectId.isValid(partnerId)) {
      return NextResponse.json({ success: false, error: 'Invalid partner ID' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(config.dbName);

    // Get all events for this partner
    const events = await db.collection('projects').find({
      $or: [
        { partnerId: new ObjectId(partnerId) },
        { partner1Id: new ObjectId(partnerId) },
        { partner2Id: new ObjectId(partnerId) },
      ]
    }).toArray();

    // Aggregate ALL Bitly metrics (Growth tier only)
    let totalClicks = 0, uniqueClicks = 0;
    const countryClicks = { US: 0, GB: 0, CA: 0, IT: 0, DE: 0 };
    const referrerClicks = {
      facebook: 0,
      instagram: 0,
      twitter: 0,
      linkedin: 0,
      direct: 0,
      qrcode: 0,
      google: 0,
      instagramApp: 0,
      facebookMobile: 0,
    };

    events.forEach(event => {
      const stats = event.stats || {};
      totalClicks += stats.bitlyTotalClicks || 0;
      uniqueClicks += stats.bitlyUniqueClicks || 0;

      // Aggregate countries (Growth tier available)
      countryClicks.US += stats.bitlyClicksByCountryUS || 0;
      countryClicks.GB += stats.bitlyClicksByCountryGB || 0;
      countryClicks.CA += stats.bitlyClicksByCountryCA || 0;
      countryClicks.IT += stats.bitlyClicksByCountryIT || 0;
      countryClicks.DE += stats.bitlyClicksByCountryDE || 0;

      // Aggregate referrers (Growth tier available)
      referrerClicks.facebook += stats.bitlyClicksFromFacebook || 0;
      referrerClicks.instagram += stats.bitlyClicksFromInstagram || 0;
      referrerClicks.twitter += stats.bitlyClicksFromTwitter || 0;
      referrerClicks.linkedin += stats.bitlyClicksFromLinkedIn || 0;
      referrerClicks.direct += stats.bitlyClicksFromDirect || 0;
      referrerClicks.qrcode += stats.bitlyClicksFromQRCode || 0;
      referrerClicks.google += stats.bitlyClicksFromGoogle || 0;
      referrerClicks.instagramApp += stats.bitlyClicksFromInstagramApp || 0;
      referrerClicks.facebookMobile += stats.bitlyClicksFromFacebookMobile || 0;
    });

    // Build aggregated stats (Growth tier variables only)
    const aggregated: any = {
      bitlyTotalClicks: totalClicks,
      bitlyUniqueClicks: uniqueClicks,
      // Countries
      bitlyClicksByCountryUS: countryClicks.US,
      bitlyClicksByCountryGB: countryClicks.GB,
      bitlyClicksByCountryCA: countryClicks.CA,
      bitlyClicksByCountryIT: countryClicks.IT,
      bitlyClicksByCountryDE: countryClicks.DE,
      // Platform referrers
      bitlyClicksFromFacebook: referrerClicks.facebook,
      bitlyClicksFromInstagram: referrerClicks.instagram,
      bitlyClicksFromTwitter: referrerClicks.twitter,
      bitlyClicksFromLinkedIn: referrerClicks.linkedin,
      bitlyClicksFromDirect: referrerClicks.direct,
      bitlyClicksFromQRCode: referrerClicks.qrcode,
      bitlyClicksFromGoogle: referrerClicks.google,
      // Domain referrers
      bitlyClicksFromInstagramApp: referrerClicks.instagramApp,
      bitlyClicksFromFacebookMobile: referrerClicks.facebookMobile,
      // Derived metrics
      bitlySocialClicks: referrerClicks.facebook + referrerClicks.instagram + referrerClicks.twitter,
    };

    return NextResponse.json({
      success: true,
      partnerId,
      eventCount: events.length,
      aggregated,
    });

  } catch (error) {
    console.error('[GET /api/partners/[id]/bitly-kyc] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
