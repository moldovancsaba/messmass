// lib/hashtagReport/mergeSummaries.ts
// WHAT: Adds the per-event photo rollups (ai_analysis_summaries) of several events into one.
// WHY: A hashtag report spans many events. Every figure of a rollup is a sum over photos, so the rollups of several
//     events add up exactly: counts and count maps are summed, named lists are merged by name, and the one derived
//     figure (smiling share) is recalculated from the summed counts, never averaged.

import type { MeasuredPhotos, NamedCount } from './types';

type Rollup = Record<string, unknown>;

const num = (value: unknown): number => (typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0);

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function addCounts(target: Record<string, number>, source: unknown): void {
  for (const [key, raw] of Object.entries(record(source))) {
    const count = num(raw);
    if (count > 0) target[key] = (target[key] ?? 0) + count;
  }
}

function addNamed(target: Map<string, number>, source: unknown): void {
  if (!Array.isArray(source)) return;
  for (const raw of source) {
    const row = record(raw);
    const name = typeof row.name === 'string' ? row.name.trim() : '';
    const count = num(row.count);
    if (name && count > 0) target.set(name, (target.get(name) ?? 0) + count);
  }
}

function named(source: Map<string, number>): NamedCount[] {
  return [...source.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, 100);
}

export function emptyPhotos(): MeasuredPhotos {
  return {
    analysed: 0, withOptIn: 0, humanConfirmed: 0, humanCorrected: 0,
    people: { measured: 0, boxes: 0, faceBoxes: 0 },
    genders: {}, ageGroups: {}, emotions: {}, accessories: {}, merchandise: {},
    smiling: 0, demographicPeople: 0, brands: [], clubs: [], moderation: { reviewed: 0, flagged: 0 },
  };
}

/** Sum the rollups of several events. `withOptIn` is null as soon as one rollup does not carry the opt-in count. */
export function mergePhotoSummaries(rollups: Rollup[]): MeasuredPhotos {
  const out = emptyPhotos();
  const brands = new Map<string, number>();
  const clubs = new Map<string, number>();
  for (const rollup of rollups) {
    out.analysed += num(rollup.photoResultsReceived);
    out.humanConfirmed += num(rollup.humanConfirmedPhotos);
    out.humanCorrected += num(rollup.humanCorrectedPhotos);
    out.people.measured += num(record(rollup.peopleCounts).measured);
    out.people.boxes += num(rollup.personBoxes);
    out.people.faceBoxes += num(rollup.faceBoxes);
    out.smiling += num(rollup.smilingCount);
    out.demographicPeople += num(rollup.demographicPeopleMeasured);
    out.moderation.reviewed += num(rollup.moderationPhotosReviewed);
    out.moderation.flagged += num(rollup.moderationFlaggedPhotos);
    addCounts(out.genders, rollup.genderProjection);
    addCounts(out.ageGroups, rollup.ageProjection);
    addCounts(out.emotions, rollup.emotionProjection);
    addCounts(out.accessories, rollup.accessoryProjection);
    addCounts(out.merchandise, rollup.merchandiseCounts);
    addNamed(brands, rollup.brandMentions);
    addNamed(clubs, rollup.clubMentions);
    if (out.withOptIn !== null) {
      out.withOptIn = typeof rollup.optInPhotos === 'number' ? out.withOptIn + num(rollup.optInPhotos) : null;
    }
  }
  out.brands = named(brands);
  out.clubs = named(clubs);
  return out;
}
