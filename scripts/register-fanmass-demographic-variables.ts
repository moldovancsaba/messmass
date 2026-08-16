// scripts/register-fanmass-demographic-variables.ts
// WHAT: One-off — registers the new demographic/brand-count fanmass
//     variables in variables_metadata, then backfills stats for every event
//     that already has a stored ai_analysis_summaries doc, so existing
//     analysed events show these variables immediately rather than waiting
//     for their next fanmass push.
// WHY: getAiVariables() already handles an unregistered-but-present variable
//     gracefully (shown with a warning), so registration isn't required for
//     correctness — it's here so a report author sees a clean catalog entry
//     instead of every new variable carrying "not registered" on day one.
// USAGE: npx tsx -r dotenv/config scripts/register-fanmass-demographic-variables.ts dotenv_config_path=.env.local

import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI!;
const MONGODB_DB = process.env.MONGODB_DB || process.env.DB_NAME || 'messmass';

// Mirrors the category keys actually observed across the 160 stored
// ai_analysis_summaries docs (checked directly, not guessed) — see
// lib/aiDemographicStats.ts for how these get derived from a live summary.
const GENDER_KEYS = ['male', 'female', 'unknown'];
const AGE_KEYS = ['children', 'youngAdults', 'adults', 'older', 'unknown'];
const EMOTION_KEYS = ['happy', 'angry', 'neutral', 'unknown'];

function capitalize(key: string): string {
  return key.charAt(0).toUpperCase() + key.slice(1);
}

function labelForCategoryKey(key: string): string {
  // youngAdults -> Young adults
  return capitalize(key.replace(/([A-Z])/g, ' $1').toLowerCase());
}

const NEW_VARIABLES: Array<{ name: string; label: string; type: 'count' | 'percentage' }> = [
  { name: 'fanmassDemographicsAnalyzed', label: 'Demographics analysed (people)', type: 'count' },
  { name: 'fanmassSmilingPct', label: 'Smiling (%)', type: 'percentage' },
  { name: 'fanmassBrandCount', label: 'Distinct brands detected', type: 'count' },
  { name: 'fanmassClubCount', label: 'Distinct clubs/federations detected', type: 'count' },
  ...GENDER_KEYS.map((k) => ({ name: `fanmassGender${capitalize(k)}Pct`, label: `Gender: ${labelForCategoryKey(k)} (%)`, type: 'percentage' as const })),
  ...AGE_KEYS.map((k) => ({ name: `fanmassAge${capitalize(k)}Pct`, label: `Age: ${labelForCategoryKey(k)} (%)`, type: 'percentage' as const })),
  ...EMOTION_KEYS.map((k) => ({ name: `fanmassEmotion${capitalize(k)}Pct`, label: `Emotion: ${labelForCategoryKey(k)} (%)`, type: 'percentage' as const })),
];

// Local copy of lib/aiDemographicStats.ts's derivation — a script can't
// import from lib/ through tsx without the app's path-alias resolution, and
// duplicating ~20 lines here is cheaper than wiring that up for a one-off.
function sumValues(counts: unknown): number {
  if (!counts || typeof counts !== 'object') return 0;
  return Object.values(counts as Record<string, unknown>).reduce(
    (sum: number, n) => sum + (typeof n === 'number' ? n : 0),
    0
  );
}
function pctFields(prefix: string, counts: unknown, total: number): Record<string, number> {
  if (!counts || typeof counts !== 'object' || total <= 0) return {};
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(counts as Record<string, unknown>)) {
    if (typeof value !== 'number' || value <= 0) continue;
    out[`fanmass${prefix}${capitalize(key)}Pct`] = Math.round((value / total) * 1000) / 10;
  }
  return out;
}
function deriveFanmassDemographicStats(summary: Record<string, unknown>): Record<string, number> {
  const stats: Record<string, number> = {};
  const demographicsAnalyzed = Math.max(
    sumValues(summary.genderProjection),
    sumValues(summary.ageProjection),
    sumValues(summary.emotionProjection)
  );
  if (demographicsAnalyzed > 0) {
    stats.fanmassDemographicsAnalyzed = demographicsAnalyzed;
    Object.assign(stats, pctFields('Gender', summary.genderProjection, demographicsAnalyzed));
    Object.assign(stats, pctFields('Age', summary.ageProjection, demographicsAnalyzed));
    Object.assign(stats, pctFields('Emotion', summary.emotionProjection, demographicsAnalyzed));
  }
  if (typeof summary.smilingPct === 'number') stats.fanmassSmilingPct = summary.smilingPct;
  const brandCount = Array.isArray(summary.brandMentions) ? summary.brandMentions.length : 0;
  if (brandCount > 0) stats.fanmassBrandCount = brandCount;
  const clubCount = Array.isArray(summary.clubMentions) ? summary.clubMentions.length : 0;
  if (clubCount > 0) stats.fanmassClubCount = clubCount;
  return stats;
}

async function main() {
  if (!MONGODB_URI) throw new Error('MONGODB_URI not found');
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  console.log(`Connected to ${MONGODB_DB}`);
  const db = client.db(MONGODB_DB);

  // --- 1. Register ---
  const varsCol = db.collection('variables_metadata');
  let registered = 0;
  for (const v of NEW_VARIABLES) {
    const existing = await varsCol.findOne({ name: v.name });
    if (existing) continue;
    const now = new Date().toISOString();
    await varsCol.insertOne({
      name: v.name,
      isSystem: true,
      type: v.type,
      category: 'AI analytics',
      label: v.label,
      derived: false,
      flags: { visibleInClicker: false, editableInManual: false },
      order: 999,
      createdAt: now,
      updatedAt: now,
    });
    registered++;
  }
  console.log(`Registered ${registered} new variable(s) (${NEW_VARIABLES.length - registered} already existed).`);

  // --- 2. Backfill ---
  const summaries = await db.collection('ai_analysis_summaries').find({}).toArray();
  let backfilled = 0;
  let skipped = 0;
  for (const doc of summaries) {
    const derived = deriveFanmassDemographicStats((doc.summary || {}) as Record<string, unknown>);
    if (Object.keys(derived).length === 0) {
      skipped++;
      continue;
    }
    if (!ObjectId.isValid(String(doc.eventId))) {
      skipped++;
      continue;
    }
    const receivedAt = new Date().toISOString();
    await db.collection('projects').updateOne(
      { _id: new ObjectId(String(doc.eventId)) },
      { $set: { ...Object.fromEntries(Object.entries(derived).map(([k, val]) => [`stats.${k}`, val])), aiLastAnalyzedAt: receivedAt } }
    );
    backfilled++;
  }
  console.log(`Backfilled stats for ${backfilled} event(s), skipped ${skipped} with no demographic/brand data.`);

  await client.close();
}

main().catch((err) => {
  console.error('ERR', err);
  process.exit(1);
});
