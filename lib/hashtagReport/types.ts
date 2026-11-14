// lib/hashtagReport/types.ts
// WHAT: The contract of the unified hashtag report: what is measured, what is calculated from it, and how much of the
//     hashtag's events the measurement covers.
// WHY: One report must work for EVERY hashtag, and it must contain no manually entered number. So it is built in
//     three strictly separated layers (see lib/hashtagReport/index.ts): the measured layer holds only what machines
//     wrote (Fanmass photo results and the counters Camera writes), the calculated layer holds only Messmass
//     calculations over the measured layer, and nothing typed by a person (clicker stats, sheet imports, typed
//     tables) can enter either of them.

/** The sums of the per-photo Fanmass results over all events of the hashtag. Every figure is a sum over photos. */
export interface MeasuredPhotos {
  /** Photo results stored by Messmass (one per analysed photo). */
  analysed: number;
  /** Analysed photos whose stored result carries a recorded opt-in (counted from the per-photo results). */
  withOptIn: number | null;
  humanConfirmed: number;
  humanCorrected: number;
  people: { measured: number; boxes: number; faceBoxes: number };
  genders: Record<string, number>;
  ageGroups: Record<string, number>;
  emotions: Record<string, number>;
  accessories: Record<string, number>;
  merchandise: Record<string, number>;
  smiling: number;
  /** People with a gender, age or emotion observation: the denominator of the demographic shares. */
  demographicPeople: number;
  moderation: { reviewed: number; flagged: number };
}

/** The sums of the counters Camera writes onto the events (names start with camera_). Absent when no event has it. */
export type MeasuredCounters = Record<string, number>;

export interface HashtagEvent {
  id: string;
  name: string;
  date: string | null;
  /** The event has at least one machine-written counter. */
  hasCounters: boolean;
  /** The event has at least one stored Fanmass photo result. */
  hasPhotoResults: boolean;
}

export interface MeasuredLayer {
  events: HashtagEvent[];
  photos: MeasuredPhotos;
  counters: MeasuredCounters;
}

/** One calculation: the value and the two counts it was calculated from, or nothing when it cannot be calculated. */
export interface Calculation {
  /** A percentage with one decimal, or null when the counts cannot give a real share. */
  value: number | null;
  numerator: number | null;
  denominator: number | null;
  /** What the denominator counts, in words a reader can check ("photos analysed"). */
  basis: string;
  /** What the numerator counts ("photos with a recorded opt-in"). */
  part: string;
}

export interface CalculatedLayer {
  /** Photos analysed out of photos taken. */
  analysedShare: Calculation;
  /** Photos approved out of photos decided (approved plus rejected) in vetting. */
  approvalRate: Calculation;
  /** Analysed photos with a recorded opt-in. */
  optInShare: Calculation;
  /** Photos taken whose participant accepted at least one consent. */
  consentShare: Calculation;
  /** Men among the people with a measured gender. */
  maleShare: Calculation;
  /** People detected smiling among the people with an observation. */
  smilingShare: Calculation;
  /** Journeys completed out of journeys opened. */
  journeyCompletionRate: Calculation;
}

export interface HashtagReport {
  success: true;
  scope: { type: 'hashtag'; id: string };
  generatedAt: string;
  measured: MeasuredLayer;
  calculated: CalculatedLayer;
  /** How much of the hashtag the measurement covers, so a missing figure is read as "not measured", not as zero. */
  coverage: { events: number; eventsWithCounters: number; eventsWithPhotoResults: number };
}
