// GET /api/derived-variable-config
// WHAT: Data-driven derived-total definitions for the event editor (gender/age/
//     merch totals + the remote-fans fallback). Non-sensitive display config.
// WHY: Replaces hardcoded totals in EditorDashboard so no variable name is
//     hardcoded; renames propagate via the /admin/kyc merge (rewrites [tokens] here).

import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';

export const runtime = 'nodejs';

const DEFAULT = {
  totals: [
    { key: 'totalGender', label: 'Gender total', formula: '[female]+[male]' },
    { key: 'totalUnder40', label: 'Under 40', formula: '[genAlpha]+[genYZ]' },
    { key: 'totalOver40', label: 'Over 40', formula: '[genX]+[boomer]' },
    { key: 'totalAge', label: 'Age total', formula: '[genAlpha]+[genYZ]+[genX]+[boomer]' },
    { key: 'totalMerch', label: 'Merch total', formula: '[merched]+[jersey]+[scarf]+[flags]+[baseballCap]+[other]' },
  ],
  fans: { remoteFansVar: 'remoteFans', stadiumVar: 'stadium', remoteFansFallbackFormula: '[indoor]+[outdoor]' },
};

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(config.dbName);
    const doc = await db.collection('derived_variable_config').findOne({ _id: 'default' as never });
    return NextResponse.json({ success: true, config: doc || DEFAULT });
  } catch {
    // never break the editor on a config read; fall back to the built-in defaults
    return NextResponse.json({ success: true, config: DEFAULT });
  }
}
