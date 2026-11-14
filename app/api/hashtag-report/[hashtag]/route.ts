// app/api/hashtag-report/[hashtag]/route.ts
// WHAT: The unified hashtag report as data: one answer for EVERY hashtag, built from Fanmass-measured data and Messmass
//     calculations only (lib/hashtagReport).
// WHY: The hashtag report pages read this one contract instead of each report assembling its own numbers. It is
//     gated like every other hashtag report: public unless the hashtag has a page password, then the shared page gate
//     answers 401 PAGE_PASSWORD_REQUIRED.

import { NextRequest, NextResponse } from 'next/server';
import config from '@/lib/config';
import clientPromise from '@/lib/mongodb';
import { requirePageAccess } from '@/lib/pageAccess';
import { buildHashtagReport } from '@/lib/hashtagReport';
import type { ReportDb } from '@/lib/hashtagReport/measured';

export const dynamic = 'force-dynamic';
// A hashtag with many events reads every event once; the host default of 15 seconds is too short for it
export const maxDuration = 60;

export async function GET(_request: NextRequest, context: { params: Promise<{ hashtag: string }> }) {
  try {
    const hashtag = decodeURIComponent((await context.params).hashtag || '').trim().replace(/^#/, '');
    if (!hashtag) return NextResponse.json({ success: false, error: 'A hashtag is required' }, { status: 400 });

    const denied = await requirePageAccess('hashtag', hashtag);
    if (denied) return denied;

    const client = await clientPromise;
    const report = await buildHashtagReport(client.db(config.dbName) as unknown as ReportDb, hashtag);
    return NextResponse.json(report);
  } catch (error) {
    console.error('Hashtag report API error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
