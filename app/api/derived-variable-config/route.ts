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
  // WHAT: Estimate manual-clicker fields from fanmass's AI-detected demographics when the
  //     manual clicker was never used for this event.
  // WHY: male/female are raw headcounts from the operator's clicker; fanmassGenderMalePct/
  //     fanmassGenderFemalePct are AI percentages of a DIFFERENT, usually much larger,
  //     photo-sampled population (fanmassDemographicsAnalyzed) — different units, different
  //     population, so they can never be merged into one field (unlike a name-typo dupe).
  //     But on events where nobody used the clicker (male=0 AND female=0, confirmed against
  //     4 real events) while fanmass DID run, the operator's zero is a "never recorded" default,
  //     not a real "zero fans" measurement — an estimate from the AI data is strictly better
  //     than showing zero fans attended.
  // HOW: The "should I use the fallback" decision (are ALL triggerVars exactly 0?) is a JS
  //     condition (EditorDashboard.tsx) — this formula engine has no IF/ternary. Only the
  //     estimate arithmetic itself is formula-driven, so a rename of any of these variables
  //     still propagates via the /admin/kyc merge like everything else in this config.
  fallbackGroups: [
    {
      label: 'Gender (fanmass AI estimate when the manual clicker was never used)',
      triggerVars: ['male', 'female'],
      entries: [
        { key: 'male', label: 'Male (fanmass estimate)', formula: '([fanmassGenderMalePct]/100)*[fanmassDemographicsAnalyzed]' },
        { key: 'female', label: 'Female (fanmass estimate)', formula: '([fanmassGenderFemalePct]/100)*[fanmassDemographicsAnalyzed]' },
      ],
    },
  ],
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
