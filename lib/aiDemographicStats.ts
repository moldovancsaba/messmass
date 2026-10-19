// lib/aiDemographicStats.ts
// WHAT: Derives stable report variables from Fanmass's event summary.
// WHY: Messmass needs numeric fields as well as the complete nested summary:
//     reports can chart the values, while the AI report retains brand and club
//     names as lists instead of creating unstable name-specific variables.
// HOW: Closed category projections use counts and percentages; percentages
//     share the largest available demographic denominator. Merchandise uses a
//     fixed item taxonomy, and accessory counts are separate from demographics.

function sumValues(counts: unknown): number {
  if (!counts || typeof counts !== 'object') return 0;
  return Object.values(counts as Record<string, unknown>).reduce(
    (sum: number, n) => sum + (typeof n === 'number' ? n : 0),
    0
  );
}

function capitalize(key: string): string {
  return key.charAt(0).toUpperCase() + key.slice(1);
}

const GENDERS = ['male', 'female', 'unknown'];
const GENERATIONS = ['silent', 'boomer', 'genX', 'millennial', 'genZ', 'genAlpha', 'genBeta', 'unknown',
  // Retain report support for older summaries that used life-stage buckets.
  'children', 'teens', 'youngAdults', 'adults', 'older'];
const EMOTIONS = ['happy', 'sad', 'angry', 'surprised', 'neutral', 'fearful', 'disgusted', 'unknown'];
const ACCESSORIES = ['withCap', 'withoutCap', 'withGlasses', 'withoutGlasses'];
const MERCHANDISE_TYPES = ['jersey', 'kit', 'scarf', 'cap', 'flag', 'banner', 'logo', 'other'];

function countFields(prefix: string, counts: unknown, allowed: string[]): Record<string, number> {
  if (!counts || typeof counts !== 'object') return {};
  const values = counts as Record<string, unknown>;
  const out: Record<string, number> = {};
  for (const key of allowed) {
    const value = values[key];
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
      out[`fanmass${prefix}${capitalize(key)}Count`] = Math.round(value);
    }
  }
  return out;
}

// WHAT: One stats field per category key, as a percentage of the analysed
//     total — not a raw count, since "62% male" is what a report author
//     actually wants, and the raw count is already fanmassDemographicsAnalyzed.
function pctFields(prefix: string, counts: unknown, total: number, allowed: string[]): Record<string, number> {
  if (!counts || typeof counts !== 'object' || total <= 0) return {};
  const out: Record<string, number> = {};
  for (const key of allowed) {
    const value = (counts as Record<string, unknown>)[key];
    if (typeof value !== 'number' || value <= 0) continue;
    out[`fanmass${prefix}${capitalize(key)}Pct`] = Math.round((value / total) * 1000) / 10;
  }
  return out;
}

export function deriveFanmassDemographicStats(summary: Record<string, unknown>): Record<string, number> {
  const stats: Record<string, number> = {};

  const demographicsAnalyzed = Math.max(
    sumValues(summary.genderProjection),
    sumValues(summary.ageProjection),
    sumValues(summary.emotionProjection)
  );
  if (demographicsAnalyzed > 0) {
    stats.fanmassDemographicsAnalyzed = demographicsAnalyzed;
    Object.assign(stats, countFields('Gender', summary.genderProjection, GENDERS));
    Object.assign(stats, pctFields('Gender', summary.genderProjection, demographicsAnalyzed, GENDERS));
    Object.assign(stats, countFields('Age', summary.ageProjection, GENERATIONS));
    Object.assign(stats, pctFields('Age', summary.ageProjection, demographicsAnalyzed, GENERATIONS));
    Object.assign(stats, countFields('Emotion', summary.emotionProjection, EMOTIONS));
    Object.assign(stats, pctFields('Emotion', summary.emotionProjection, demographicsAnalyzed, EMOTIONS));
    Object.assign(stats, countFields('Accessory', summary.accessoryProjection, ACCESSORIES));
    Object.assign(stats, pctFields('Accessory', summary.accessoryProjection, demographicsAnalyzed, ACCESSORIES));
  }

  if (typeof summary.smilingPct === 'number') {
    stats.fanmassSmilingPct = summary.smilingPct;
    if (demographicsAnalyzed > 0) {
      stats.fanmassSmilingCount = Math.round((summary.smilingPct / 100) * demographicsAnalyzed);
    }
  }

  const brandCount = Array.isArray(summary.brandMentions) ? summary.brandMentions.length : 0;
  if (brandCount > 0) stats.fanmassBrandCount = brandCount;
  const brandMentionCount = sumMentionCounts(summary.brandMentions);
  if (brandMentionCount > 0) stats.fanmassBrandMentionCount = brandMentionCount;
  const clubCount = Array.isArray(summary.clubMentions) ? summary.clubMentions.length : 0;
  if (clubCount > 0) stats.fanmassClubCount = clubCount;
  const clubMentionCount = sumMentionCounts(summary.clubMentions);
  if (clubMentionCount > 0) stats.fanmassClubMentionCount = clubMentionCount;

  if (summary.merchandiseCounts && typeof summary.merchandiseCounts === 'object') {
    const merchandise = summary.merchandiseCounts as Record<string, unknown>;
    for (const itemType of MERCHANDISE_TYPES) {
      const value = merchandise[itemType];
      if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
        stats[`fanmassMerchandise${capitalize(itemType)}Count`] = Math.round(value);
      }
    }
  }

  return stats;
}

function sumMentionCounts(items: unknown): number {
  if (!Array.isArray(items)) return 0;
  return items.reduce((sum, item) => {
    if (!item || typeof item !== 'object') return sum;
    const value = (item as Record<string, unknown>).count;
    return sum + (typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.round(value) : 0);
  }, 0);
}

/** Include zeroes for the fixed report catalog so a refreshed snapshot clears stale old values. */
export function deriveCompleteFanmassReportStats(summary: Record<string, unknown>): Record<string, number> {
  const stats = deriveFanmassDemographicStats(summary);
  const imageCounts = (summary.imageCounts && typeof summary.imageCounts === 'object'
    ? summary.imageCounts
    : {}) as Record<string, unknown>;
  const peopleCounts = (summary.peopleCounts && typeof summary.peopleCounts === 'object'
    ? summary.peopleCounts
    : {}) as Record<string, unknown>;
  const images = typeof imageCounts.total === 'number' && Number.isFinite(imageCounts.total)
    ? Math.max(0, Math.round(imageCounts.total))
    : 0;
  const analyzedImages = typeof imageCounts.analyzed === 'number' && Number.isFinite(imageCounts.analyzed)
    ? Math.max(0, Math.round(imageCounts.analyzed))
    : 0;
  const progress = images > 0 ? Math.round(Math.min(100, (analyzedImages / images) * 100) * 10) / 10 : 0;
  stats.fanmassImages = images;
  stats.fanmassAnalyzedImages = analyzedImages;
  stats.fanmassImageCount = images;
  stats.fanmassAnalyzedImageCount = analyzedImages;
  stats.fanmassStatus = progress;
  stats.fanmassConfidence = typeof summary.confidence === 'number' && Number.isFinite(summary.confidence)
    ? Math.min(1, Math.max(0, summary.confidence))
    : (images > 0 ? analyzedImages / images : 0);
  stats.fanmassPeopleCount = typeof peopleCounts.measured === 'number' && Number.isFinite(peopleCounts.measured)
    ? Math.max(0, Math.round(peopleCounts.measured))
    : 0;
  stats.fanmassProjectedReach = typeof peopleCounts.projected === 'number' && Number.isFinite(peopleCounts.projected)
    ? Math.max(0, Math.round(peopleCounts.projected))
    : 0;
  stats.fanmassDemographicsAnalyzed ??= 0;
  stats.fanmassSmilingCount ??= 0;
  stats.fanmassSmilingPct ??= 0;
  stats.fanmassBrandCount ??= 0;
  stats.fanmassBrandMentionCount ??= 0;
  stats.fanmassClubCount ??= 0;
  stats.fanmassClubMentionCount ??= 0;

  for (const [prefix, categories] of [
    ['Gender', GENDERS], ['Age', GENERATIONS], ['Emotion', EMOTIONS], ['Accessory', ACCESSORIES],
  ] as const) {
    for (const category of categories) {
      const stem = `fanmass${prefix}${capitalize(category)}`;
      stats[`${stem}Count`] ??= 0;
      stats[`${stem}Pct`] ??= 0;
    }
  }
  for (const itemType of MERCHANDISE_TYPES) {
    stats[`fanmassMerchandise${capitalize(itemType)}Count`] ??= 0;
  }
  return stats;
}
