// lib/aiDemographicStats.ts
// WHAT: Derives flat, report-buildable stats variables from a fanmass analysis
//     summary's demographic and brand data.
// WHY: Only 6 scalar fanmassX variables existed (images/people/confidence/
//     status) plus 7 sparse per-merch-type counts — none of gender, age,
//     emotion, smiling, or brand/club coverage were ever turned into a
//     variable a report could use, despite being real, populated data on
//     every event with a demographics pass. Brand/club NAMES stay out of
//     scope deliberately: they're a dynamic, per-event set (Nike this event,
//     Adidas the next), which cannot be flattened into fixed variable names
//     the way a closed category set (three genders, five age bands) can.
// HOW: Pure function over the same summary shape AiEventReportView.tsx
//     already renders — gender/age/emotion are percentages of whichever
//     projection has the most people (they should agree; see
//     AiEventReportView's own demographicsAnalyzed for the same reasoning),
//     brand/club are total counts, not the mentions themselves.

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

// WHAT: One stats field per category key, as a percentage of the analysed
//     total — not a raw count, since "62% male" is what a report author
//     actually wants, and the raw count is already fanmassDemographicsAnalyzed.
function pctFields(prefix: string, counts: unknown, total: number): Record<string, number> {
  if (!counts || typeof counts !== 'object' || total <= 0) return {};
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(counts as Record<string, unknown>)) {
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
    Object.assign(stats, pctFields('Gender', summary.genderProjection, demographicsAnalyzed));
    Object.assign(stats, pctFields('Age', summary.ageProjection, demographicsAnalyzed));
    Object.assign(stats, pctFields('Emotion', summary.emotionProjection, demographicsAnalyzed));
  }

  if (typeof summary.smilingPct === 'number') {
    stats.fanmassSmilingPct = summary.smilingPct;
  }

  const brandCount = Array.isArray(summary.brandMentions) ? summary.brandMentions.length : 0;
  if (brandCount > 0) stats.fanmassBrandCount = brandCount;
  const clubCount = Array.isArray(summary.clubMentions) ? summary.clubMentions.length : 0;
  if (clubCount > 0) stats.fanmassClubCount = clubCount;

  return stats;
}
