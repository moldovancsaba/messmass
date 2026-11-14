// lib/hashtagReport/calculated.ts
// WHAT: The Messmass calculations of the hashtag report. Pure functions over the measured layer.
// WHY: A calculation must say what it divided by what, so a reader can check it, and it must give nothing when the
//     counts cannot give a real share (a part larger than its whole, an empty whole, a count nobody measured).
//     There is no default, no cap and no estimate.

import { consistentRate } from '@/lib/consistentRate';
import type { CalculatedLayer, Calculation, MeasuredLayer } from './types';

/** The share of two counts as a percentage with one decimal; nothing when either count is unknown or they conflict. */
export function share(numerator: number | null | undefined, denominator: number | null | undefined, basis: string, part: string): Calculation {
  if (numerator === null || numerator === undefined || denominator === null || denominator === undefined) {
    return { value: null, numerator: numerator ?? null, denominator: denominator ?? null, basis, part };
  }
  const rate = consistentRate(numerator, denominator);
  return { value: rate === null ? null : Math.round(rate * 10) / 10, numerator, denominator, basis, part };
}

/** A counter that no event reported is unknown (null), not zero. */
function counter(layer: MeasuredLayer, name: string): number | null {
  return Object.prototype.hasOwnProperty.call(layer.counters, name) ? layer.counters[name] : null;
}

export function calculate(layer: MeasuredLayer): CalculatedLayer {
  const { photos } = layer;
  const taken = counter(layer, 'camera_images_taken');
  const approved = counter(layer, 'camera_images_approved');
  const rejected = counter(layer, 'camera_images_rejected');
  const decided = approved !== null && rejected !== null ? approved + rejected : null;
  const male = photos.genders.male ?? 0;
  const female = photos.genders.female ?? 0;

  const { drive } = layer;
  const placed = drive.placed > 0 ? drive.placed : null;
  return {
    driveConfidentShare: share(placed === null ? null : drive.placedOverHalf, placed, 'drive photos placed in events', 'photos placed with over 50% confidence'),
    driveAnalysedShare: share(placed === null ? null : drive.analysed, placed, 'drive photos placed in events', 'photos analysed'),
    driveOptInShare: share(placed === null ? null : drive.withOptIn, placed, 'drive photos placed in events', 'photos with a recorded opt-in'),
    analysedShare: share(photos.analysed > 0 ? photos.analysed : null, taken, 'photos taken', 'photos analysed'),
    approvalRate: share(approved, decided, 'photos decided in vetting', 'photos approved'),
    optInShare: share(photos.withOptIn, photos.analysed > 0 ? photos.analysed : null, 'photos analysed', 'photos with a recorded opt-in'),
    consentShare: share(counter(layer, 'camera_consents_accepted'), taken, 'photos taken', 'photos with an accepted consent'),
    maleShare: share(male + female > 0 ? male : null, male + female > 0 ? male + female : null, 'people with a measured gender', 'men'),
    smilingShare: share(photos.demographicPeople > 0 ? photos.smiling : null, photos.demographicPeople > 0 ? photos.demographicPeople : null, 'people with an observation', 'people smiling'),
    journeyCompletionRate: share(counter(layer, 'camera_journeys_completed'), counter(layer, 'camera_journey_opens'), 'journeys opened', 'journeys completed'),
  };
}
