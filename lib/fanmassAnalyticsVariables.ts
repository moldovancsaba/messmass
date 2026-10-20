import type { Db } from 'mongodb';

type MetricType = 'count' | 'percentage';
type VariableDefinition = { name: string; label: string; type: MetricType; unit?: string; description: string; order: number };

const definitions: VariableDefinition[] = [];

function add(name: string, label: string, type: MetricType, description: string, unit?: string) {
  definitions.push({ name, label, type, description, order: 900 + definitions.length, ...(unit ? { unit } : {}) });
}

add('fanmassPhotoResultsReceived', 'Photo analysis results received', 'count', 'Completed one-photo analyses stored by Messmass. This is a received-result count, not the event photo total.');
add('fanmassPeopleDetections', 'People detections', 'count', 'Person detections summed across the received photo analyses. Detections are not unique attendees.');
add('fanmassPersonBoxes', 'Person boxes', 'count', 'Person bounding boxes returned across the received photo analyses.');
add('fanmassFaceBoxes', 'Face boxes', 'count', 'Face bounding boxes returned across the received photo analyses.');
add('fanmassDemographicPeopleMeasured', 'People with demographic observations', 'count', 'People represented in the returned gender, age, or emotion observations.');
add('fanmassSmilingCount', 'People detected smiling', 'count', 'Smile detections summed across the received photo analyses.');
add('fanmassSmilingPct', 'People detected smiling', 'percentage', 'Smile detections as a share of the demographic observations in received photos.', '%');
add('fanmassBrandTypesDetected', 'Distinct brand labels', 'count', 'Distinct brand labels observed in received photo analyses.');
add('fanmassBrandAppearances', 'Brand appearances', 'count', 'Brand detections summed across the received photo analyses.');
add('fanmassClubTypesDetected', 'Distinct club labels', 'count', 'Distinct club/federation labels observed in received photo analyses.');
add('fanmassClubAppearances', 'Club and federation appearances', 'count', 'Club and federation detections summed across the received photo analyses.');
add('fanmassModerationPhotosReviewed', 'Photos with a completed content check', 'count', 'Received photos for which Fanmass returned a completed prohibited-content check.');
add('fanmassModerationFlaggedPhotos', 'Photos flagged for review', 'count', 'Received photos flagged by the completed prohibited-content check.');
add('fanmassModerationFlaggedPct', 'Flagged photos', 'percentage', 'Flagged photos as a share of received photos with a completed content check.', '%');

const prohibitedLabels: Record<string, string> = {
  nudity: 'Nudity', sexualContent: 'Sexual content', middleFinger: 'Obscene gesture',
  hateSymbols: 'Hate symbols', hateWords: 'Hate words or text', alcohol: 'Alcohol',
  drugs: 'Drugs', violence: 'Violence', weapons: 'Weapons', other: 'Other',
};
for (const [key, label] of Object.entries(prohibitedLabels)) {
  add(`fanmassProhibited${variablePart(key)}Count`, `Prohibited content: ${label}`, 'count', `Photo-level ${label.toLowerCase()} flags across received photos. A photo may contribute to more than one category.`);
}
for (const severity of ['none', 'low', 'medium', 'high']) {
  add(`fanmassModeration${variablePart(severity)}Count`, `Content check severity: ${severity}`, 'count', `Received photos with a completed content check and ${severity} severity.`);
}

const categoryLabels: Record<string, string> = {
  male: 'Male', female: 'Female', unknown: 'Unknown',
  silent: 'Silent Generation', boomer: 'Baby Boomers', genX: 'Generation X', millennial: 'Millennials',
  genZ: 'Generation Z', genAlpha: 'Generation Alpha', genBeta: 'Generation Beta',
  happy: 'Happy', sad: 'Sad', angry: 'Angry', surprised: 'Surprised', neutral: 'Neutral', fearful: 'Fearful', disgusted: 'Disgusted',
  withCap: 'With cap', withoutCap: 'Without cap', withGlasses: 'With glasses', withoutGlasses: 'Without glasses',
};

function variablePart(key: string): string {
  return key.charAt(0).toUpperCase() + key.slice(1);
}

function addCategoryMetrics(prefix: string, keys: string[], group: string) {
  for (const key of keys) {
    const label = categoryLabels[key] || key;
    const description = `Photo-level ${group.toLowerCase()} detections labelled ${label.toLowerCase()}, summed across the received photo analyses.`;
    add(`fanmass${prefix}${variablePart(key)}Count`, `${group}: ${label} detections`, 'count', description);
    add(`fanmass${prefix}${variablePart(key)}Pct`, `${group}: ${label} share`, 'percentage', `${description} The percentage denominator is the returned sample for that attribute.`, '%');
  }
}

addCategoryMetrics('Gender', ['male', 'female', 'unknown'], 'Gender');
addCategoryMetrics('Age', ['silent', 'boomer', 'genX', 'millennial', 'genZ', 'genAlpha', 'genBeta', 'unknown'], 'Age group');
addCategoryMetrics('Emotion', ['happy', 'sad', 'angry', 'surprised', 'neutral', 'fearful', 'disgusted', 'unknown'], 'Emotion');
addCategoryMetrics('Accessory', ['withCap', 'withoutCap', 'withGlasses', 'withoutGlasses'], 'Accessories');

for (const [key, label] of [
  ['jersey', 'Jerseys'], ['kit', 'Kits'], ['scarf', 'Scarves'], ['cap', 'Caps and hats'],
  ['flag', 'Flags'], ['banner', 'Banners'], ['logo', 'Logos'], ['other', 'Other merchandise'],
] as const) {
  add(`fanmassMerchandise${variablePart(key)}Count`, `Merchandise: ${label}`, 'count', `${label} detections summed across the received photo analyses.`);
}

for (const [key, label] of [
  ['clothing', 'Clothing'], ['shoes', 'Shoes'], ['bag', 'Bags'],
  ['accessory', 'Accessories'], ['logo', 'Logos'], ['other', 'Other'],
] as const) {
  add(`fanmassBrandAppearance${variablePart(key)}Count`, `Brand appearances: ${label}`, 'count', `${label} item detections in commercial brand appearances across the received photo analyses.`);
}

const byName = new Map(definitions.map((definition) => [definition.name, definition]));

/** Keep the active report catalogue aligned with the per-photo result contract. */
export async function ensureFanmassAnalyticsVariables(db: Db, names: Iterable<string>): Promise<void> {
  const now = new Date().toISOString();
  const operations = [...new Set(names)].flatMap((name) => {
    const definition = byName.get(name);
    if (!definition) return [];
    const { name: variableName, ...metadata } = definition;
    return [{
      updateOne: {
        filter: { name: variableName },
        update: {
          $set: {
            ...metadata,
            category: 'Fanmass photo results',
            isSystem: false,
            derived: false,
            flags: { visibleInClicker: false, editableInManual: false },
            updatedAt: now,
          },
          $setOnInsert: { name: variableName, createdAt: now },
        },
        upsert: true,
      },
    }];
  });
  if (operations.length) {
    await db.collection('variables_metadata').bulkWrite(operations, { ordered: false });
  }
}

export const FANMASS_PHOTO_VARIABLE_NAMES = new Set(byName.keys());
