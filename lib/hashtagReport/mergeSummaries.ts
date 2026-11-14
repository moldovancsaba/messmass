// lib/hashtagReport/mergeSummaries.ts
// WHAT: Adds the per-event photo rollups (ai_analysis_summaries) of several events into one.
// WHY: A hashtag report spans many events. Every figure of a rollup is a sum over photos, so the rollups of several
//     events add up exactly: counts and count maps are summed, named lists are merged by name, and the one derived
//     figure (smiling share) is recalculated from the summed counts, never averaged.

import type { MeasuredPhotos } from './types';

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

export function emptyPhotos(): MeasuredPhotos {
  return {
    analysed: 0, withOptIn: null, tagged: 0, humanConfirmed: 0, humanCorrected: 0,
    people: { measured: 0, boxes: 0, faceBoxes: 0 },
    genders: {}, ageGroups: {}, emotions: {}, accessories: {}, merchandise: {},
    smiling: 0, demographicPeople: 0, moderation: { reviewed: 0, flagged: 0 },
  };
}

/**
 * Sum the rollups of several events. Brands and clubs are not carried over: a rollup lists the names a model guessed
 * ("Scarf", "Jacket"), and a name counts in this report only when it was read from the picture. `withOptIn` is counted
 * from the per-photo results by the measured layer, not from the rollups.
 */
export function mergePhotoSummaries(rollups: Rollup[]): MeasuredPhotos {
  const out = emptyPhotos();
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
  }
  return out;
}
