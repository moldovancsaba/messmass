import type { Db } from 'mongodb';

type MetricType = 'count' | 'percentage' | 'numeric' | 'text';
type VariableDefinition = { name: string; label: string; type: MetricType; unit?: string; description: string; order: number };

const definitions: VariableDefinition[] = [];

function add(name: string, label: string, type: MetricType, description: string, unit?: string) {
  definitions.push({ name, label, type, description, order: 900 + definitions.length, ...(unit ? { unit } : {}) });
}

add('fanmassImages', 'Images in event', 'count', 'Total eligible images in the Fanmass batch.');
add('fanmassAnalyzedImages', 'Images analysed by Fanmass', 'count', 'Images with a completed Fanmass base analysis.');
add('fanmassImageCount', 'Images in event (legacy alias)', 'count', 'Compatibility alias for fanmassImages.');
add('fanmassAnalyzedImageCount', 'Images analysed by Fanmass (legacy alias)', 'count', 'Compatibility alias for fanmassAnalyzedImages.');
add('fanmassStatus', 'Analysis progress', 'percentage', 'Percentage of event images analysed by Fanmass (0–100).', '%');
add('fanmassAnalysisState', 'Analysis state', 'text', 'Fanmass event summary state: ready, partial, or running.');
add('fanmassPeopleCount', 'People detected by Fanmass', 'count', 'People detected across the analysed photos; photo detections are not deduplicated into unique attendees.');
add('fanmassProjectedReach', 'Projected people across event photos', 'count', 'Extrapolated people detections based on the analysed share of eligible event photos; not a unique-attendee count.');
add('fanmassConfidence', 'Photo analysis coverage', 'numeric', 'Share of eligible event photos analysed, from 0 to 1.');
add('fanmassDemographicsAnalyzed', 'People included in demographic analysis', 'count', 'Denominator used for Fanmass gender, age, emotion, accessory, and smile estimates.');
add('fanmassSmilingCount', 'People estimated smiling', 'count', 'Estimated number of analysed people smiling, derived from the reported smile percentage and demographic denominator.');
add('fanmassSmilingPct', 'People estimated smiling', 'percentage', 'Percentage of analysed people estimated to be smiling.', '%');
add('fanmassBrandCount', 'Distinct detected brands', 'count', 'Number of distinct brand names in the event summary.');
add('fanmassBrandMentionCount', 'Detected brand appearances', 'count', 'Sum of detected appearances across the reported brand names.');
add('fanmassClubCount', 'Distinct detected clubs', 'count', 'Number of distinct club names in the event summary.');
add('fanmassClubMentionCount', 'Detected club appearances', 'count', 'Sum of detected appearances across the reported club names.');

const categoryLabels: Record<string, string> = {
  male: 'Male', female: 'Female', unknown: 'Unknown',
  silent: 'Silent Generation', boomer: 'Baby Boomers', genX: 'Generation X', millennial: 'Millennials',
  genZ: 'Generation Z', genAlpha: 'Generation Alpha', genBeta: 'Generation Beta',
  children: 'Children (legacy age band)', teens: 'Teens (legacy age band)', youngAdults: 'Young adults (legacy age band)',
  adults: 'Adults (legacy age band)', older: 'Older adults (legacy age band)',
  happy: 'Happy', sad: 'Sad', angry: 'Angry', surprised: 'Surprised', neutral: 'Neutral', fearful: 'Fearful', disgusted: 'Disgusted',
  withCap: 'With cap', withoutCap: 'Without cap', withGlasses: 'With glasses', withoutGlasses: 'Without glasses',
};

function variablePart(key: string): string {
  return key.charAt(0).toUpperCase() + key.slice(1);
}

function addCategoryMetrics(prefix: string, keys: string[], group: string) {
  for (const key of keys) {
    const label = categoryLabels[key] || key;
    add(`fanmass${prefix}${variablePart(key)}Count`, `${group}: ${label} (count)`, 'count', `Fanmass-estimated ${group.toLowerCase()} count for ${label.toLowerCase()}.`);
    add(`fanmass${prefix}${variablePart(key)}Pct`, `${group}: ${label} (%)`, 'percentage', `Fanmass-estimated ${group.toLowerCase()} share for ${label.toLowerCase()}.`, '%');
  }
}

addCategoryMetrics('Gender', ['male', 'female', 'unknown'], 'Gender');
addCategoryMetrics('Age', ['silent', 'boomer', 'genX', 'millennial', 'genZ', 'genAlpha', 'genBeta', 'unknown', 'children', 'teens', 'youngAdults', 'adults', 'older'], 'Age group');
addCategoryMetrics('Emotion', ['happy', 'sad', 'angry', 'surprised', 'neutral', 'fearful', 'disgusted', 'unknown'], 'Emotion');
addCategoryMetrics('Accessory', ['withCap', 'withoutCap', 'withGlasses', 'withoutGlasses'], 'Accessories');

for (const [key, label] of [
  ['jersey', 'Jerseys'], ['kit', 'Kits'], ['scarf', 'Scarves'], ['cap', 'Caps and hats'],
  ['flag', 'Flags'], ['banner', 'Banners'], ['logo', 'Logos'], ['other', 'Other merchandise'],
] as const) {
  add(`fanmassMerchandise${variablePart(key)}Count`, `Merchandise: ${label}`, 'count', `Detected ${label.toLowerCase()} across analysed event photos.`);
}

const byName = new Map(definitions.map((definition) => [definition.name, definition]));

/** Register known report fields once without overwriting an admin's existing labels or flags. */
export async function ensureFanmassAnalyticsVariables(db: Db, names: Iterable<string>): Promise<void> {
  const now = new Date().toISOString();
  const selected = [...new Set(names)].flatMap((name) => {
    const definition = byName.get(name);
    if (!definition) return [];
    const fixStatusSemantics = name === 'fanmassStatus';
    const onInsert = {
      ...definition,
      isSystem: false,
      derived: false,
      flags: { visibleInClicker: false, editableInManual: false },
      createdAt: now,
      updatedAt: now,
      category: 'Fanmass',
    } as Record<string, unknown>;
    const update = fixStatusSemantics
      ? { type: 'percentage', derived: false, unit: '%', updatedAt: now }
      : undefined;
    if (fixStatusSemantics) {
      delete onInsert.type;
      delete onInsert.derived;
      delete onInsert.unit;
      delete onInsert.updatedAt;
    }
    return [{
      updateOne: {
        filter: { name: definition.name },
        update: {
          ...(update ? { $set: update } : {}),
          $setOnInsert: onInsert,
        },
        upsert: true,
      },
    }];
  });
  if (selected.length) {
    await db.collection('variables_metadata').bulkWrite(selected, { ordered: false });
  }
}
