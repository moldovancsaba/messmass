// Derive Messmass report variables from the event's stored per-photo results.
// Values are detections in received photos; this module never estimates the
// event's unprocessed-photo denominator, unique attendees, or projected reach.

function sumValues(value: unknown): number {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return 0;
  return Object.values(value as Record<string, unknown>).reduce<number>(
    (sum, item) => sum + (typeof item === 'number' && Number.isFinite(item) ? Math.max(0, item) : 0),
    0,
  );
}

function capitalize(key: string): string {
  return key.charAt(0).toUpperCase() + key.slice(1);
}

const GENDERS = ['male', 'female', 'unknown'];
const AGE_GROUPS = ['silent', 'boomer', 'genX', 'millennial', 'genZ', 'genAlpha', 'genBeta', 'unknown'];
const EMOTIONS = ['happy', 'sad', 'angry', 'surprised', 'neutral', 'fearful', 'disgusted', 'unknown'];
const ACCESSORIES = ['withCap', 'withoutCap', 'withGlasses', 'withoutGlasses'];
const MERCHANDISE_TYPES = ['jersey', 'kit', 'scarf', 'cap', 'flag', 'banner', 'logo', 'other'];
const BRAND_APPEARANCE_TYPES = ['clothing', 'shoes', 'bag', 'accessory', 'logo', 'other'];
const PROHIBITED_CONTENT_CATEGORIES = [
  'nudity', 'sexualContent', 'middleFinger', 'hateSymbols', 'hateWords',
  'alcohol', 'drugs', 'violence', 'weapons', 'other',
];
const MODERATION_SEVERITIES = ['none', 'low', 'medium', 'high'];

function countFields(prefix: string, value: unknown, allowed: string[]): Record<string, number> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const values = value as Record<string, unknown>;
  const result: Record<string, number> = {};
  for (const key of allowed) {
    const count = values[key];
    if (typeof count === 'number' && Number.isFinite(count) && count >= 0) {
      result[`fanmass${prefix}${capitalize(key)}Count`] = Math.round(count);
    }
  }
  return result;
}

function pctFields(prefix: string, value: unknown, denominator: number, allowed: string[]): Record<string, number> {
  if (!value || typeof value !== 'object' || Array.isArray(value) || denominator <= 0) return {};
  const values = value as Record<string, unknown>;
  const result: Record<string, number> = {};
  for (const key of allowed) {
    const count = values[key];
    if (typeof count === 'number' && Number.isFinite(count) && count >= 0) {
      result[`fanmass${prefix}${capitalize(key)}Pct`] = Math.round((count / denominator) * 1000) / 10;
    }
  }
  return result;
}

function sumMentionCounts(value: unknown): number {
  if (!Array.isArray(value)) return 0;
  return value.reduce((sum, item) => {
    if (!item || typeof item !== 'object') return sum;
    const count = (item as Record<string, unknown>).count;
    return sum + (typeof count === 'number' && Number.isFinite(count) && count > 0 ? Math.round(count) : 0);
  }, 0);
}

/** Flat report values projected by Messmass from its per-photo result rows. */
export function deriveCompleteFanmassReportStats(summary: Record<string, unknown>): Record<string, number> {
  const result: Record<string, number> = {};
  const people = summary.peopleCounts && typeof summary.peopleCounts === 'object'
    ? summary.peopleCounts as Record<string, unknown>
    : {};
  const detections = typeof people.measured === 'number' && Number.isFinite(people.measured)
    ? Math.max(0, Math.round(people.measured))
    : 0;
  const demographicSample = Math.max(
    sumValues(summary.genderProjection),
    sumValues(summary.ageProjection),
    sumValues(summary.emotionProjection),
  );

  result.fanmassPeopleDetections = detections;
  result.fanmassPersonBoxes = typeof summary.personBoxes === 'number' && Number.isFinite(summary.personBoxes)
    ? Math.max(0, Math.round(summary.personBoxes))
    : 0;
  result.fanmassFaceBoxes = typeof summary.faceBoxes === 'number' && Number.isFinite(summary.faceBoxes)
    ? Math.max(0, Math.round(summary.faceBoxes))
    : 0;
  result.fanmassDemographicPeopleMeasured = demographicSample;
  result.fanmassSmilingCount = typeof summary.smilingCount === 'number' && Number.isFinite(summary.smilingCount)
    ? Math.max(0, Math.round(summary.smilingCount))
    : 0;
  if (typeof summary.smilingPct === 'number' && Number.isFinite(summary.smilingPct)) {
    result.fanmassSmilingPct = Math.max(0, Math.min(100, summary.smilingPct));
  }

  for (const [prefix, field, categories] of [
    ['Gender', 'genderProjection', GENDERS],
    ['Age', 'ageProjection', AGE_GROUPS],
    ['Emotion', 'emotionProjection', EMOTIONS],
    ['Accessory', 'accessoryProjection', ACCESSORIES],
  ] as const) {
    Object.assign(result, countFields(prefix, summary[field], categories));
    Object.assign(result, pctFields(prefix, summary[field], demographicSample, categories));
  }

  const brands = Array.isArray(summary.brandMentions) ? summary.brandMentions : [];
  const clubs = Array.isArray(summary.clubMentions) ? summary.clubMentions : [];
  const brandRegions = Array.isArray(summary.brandRegionMentions) ? summary.brandRegionMentions : [];
  result.fanmassBrandTypesDetected = brands.length;
  result.fanmassBrandAppearances = sumMentionCounts(brands);
  result.fanmassBrandRegionDetections = typeof summary.brandRegionCount === 'number' && Number.isFinite(summary.brandRegionCount)
    ? Math.max(0, Math.round(summary.brandRegionCount))
    : 0;
  result.fanmassBrandRegionNamesDetected = brandRegions.length;
  result.fanmassBrandRegionNamedAppearances = sumMentionCounts(brandRegions);
  for (const [prefix, field, categories] of [
    ['BrandRegionType', 'brandRegionTypes', ['sports', 'fashion', 'unknown']],
    ['BrandRegionItemType', 'brandRegionItemTypes', ['jersey', 'kit', 'scarf', 'cap', 'flag', 'banner', 'shoes', 'clothing', 'bag', 'accessory', 'logo', 'other']],
  ] as const) {
    Object.assign(result, countFields(prefix, summary[field], [...categories]));
  }
  result.fanmassClubTypesDetected = clubs.length;
  result.fanmassClubAppearances = sumMentionCounts(clubs);

  const merchandise = summary.merchandiseCounts && typeof summary.merchandiseCounts === 'object'
    ? summary.merchandiseCounts as Record<string, unknown>
    : {};
  for (const itemType of MERCHANDISE_TYPES) {
    const count = merchandise[itemType];
    result[`fanmassMerchandise${capitalize(itemType)}Count`] =
      typeof count === 'number' && Number.isFinite(count) ? Math.max(0, Math.round(count)) : 0;
  }

  result.fanmassModerationPhotosReviewed = typeof summary.moderationPhotosReviewed === 'number' && Number.isFinite(summary.moderationPhotosReviewed)
    ? Math.max(0, Math.round(summary.moderationPhotosReviewed))
    : 0;
  result.fanmassModerationFlaggedPhotos = typeof summary.moderationFlaggedPhotos === 'number' && Number.isFinite(summary.moderationFlaggedPhotos)
    ? Math.max(0, Math.round(summary.moderationFlaggedPhotos))
    : 0;
  if (result.fanmassModerationPhotosReviewed > 0) {
    result.fanmassModerationFlaggedPct = Math.round((result.fanmassModerationFlaggedPhotos / result.fanmassModerationPhotosReviewed) * 1000) / 10;
  }
  for (const category of PROHIBITED_CONTENT_CATEGORIES) {
    const count = (summary.prohibitedContentCounts as Record<string, unknown> | undefined)?.[category];
    result[`fanmassProhibited${capitalize(category)}Count`] =
      typeof count === 'number' && Number.isFinite(count) ? Math.max(0, Math.round(count)) : 0;
  }
  for (const severity of MODERATION_SEVERITIES) {
    const count = (summary.moderationSeverityCounts as Record<string, unknown> | undefined)?.[severity];
    result[`fanmassModeration${capitalize(severity)}Count`] =
      typeof count === 'number' && Number.isFinite(count) ? Math.max(0, Math.round(count)) : 0;
  }
  const brandAppearanceTypes = summary.brandAppearanceTypes && typeof summary.brandAppearanceTypes === 'object'
    ? summary.brandAppearanceTypes as Record<string, unknown>
    : {};
  for (const itemType of BRAND_APPEARANCE_TYPES) {
    const count = brandAppearanceTypes[itemType];
    result[`fanmassBrandAppearance${capitalize(itemType)}Count`] =
      typeof count === 'number' && Number.isFinite(count) ? Math.max(0, Math.round(count)) : 0;
  }
  return result;
}
