// tests/helpers/driveFacet.ts
// WHAT: What driveSummaryPipeline (lib/hashtagReport/measured.ts) returns for a list of drive photo rows, computed in JS.
// WHY: Unit tests have no database. The rule here (counts add, whole positive numbers per photo, names once per photo,
//     only analysed photos give a breakdown) was checked equal to the pipeline on a real MongoDB on 2026-11-14.

type Row = Record<string, any>;
const whole = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.round(v) : 0);

export function driveFacet(rows: Row[]) {
  const totals = { photos: 0, placed: 0, placedOverHalf: 0, withOptIn: 0, analysed: 0, people: 0 };
  const maps: Record<'genders' | 'ageGroups' | 'emotions' | 'brands' | 'clubs' | 'events', Map<unknown, number>> = {
    genders: new Map(), ageGroups: new Map(), emotions: new Map(), brands: new Map(), clubs: new Map(), events: new Map(),
  };
  const bump = (map: Map<unknown, number>, key: unknown, by = 1) => map.set(key, (map.get(key) ?? 0) + by);
  for (const r of rows) {
    totals.photos += 1;
    bump(maps.events, r.eventId ?? null);
    if (r.eventId) {
      totals.placed += 1;
      if (typeof r.assignment?.confidence === 'number' && r.assignment.confidence > 0.5) totals.placedOverHalf += 1;
    }
    if (r.optIn?.received === true) totals.withOptIn += 1;
    const a = r.analysis;
    if (!a || typeof a !== 'object') continue;
    totals.analysed += 1;
    totals.people += whole(a.people);
    for (const field of ['genders', 'ageGroups', 'emotions'] as const) {
      for (const [k, v] of Object.entries(a[field] && typeof a[field] === 'object' ? a[field] : {})) if (whole(v) > 0) bump(maps[field], k, whole(v));
    }
    for (const field of ['brands', 'clubs'] as const) for (const name of new Set(Array.isArray(a[field]) ? a[field] : [])) bump(maps[field], name);
  }
  const rowsOf = (map: Map<unknown, number>) => [...map].map(([_id, count]) => ({ _id, count }));
  return {
    totals: rows.length ? [totals] : [],
    genders: rowsOf(maps.genders), ageGroups: rowsOf(maps.ageGroups), emotions: rowsOf(maps.emotions),
    brands: rowsOf(maps.brands), clubs: rowsOf(maps.clubs), events: rowsOf(maps.events),
  };
}

/** A collection mock's aggregate for fanmass_event_drive_photos over the rows a $match filter selects. */
export function driveAggregate(rowsFor: (match: Record<string, any>) => Row[]) {
  return (pipeline: Array<Record<string, any>>) => ({
    toArray: async () => {
      const rows = rowsFor(pipeline[0].$match);
      // The placement lookup groups by event; the summary is one $facet document
      if (pipeline[1]?.$group) return [...new Set(rows.map((r) => r.eventId ?? null))].map((_id) => ({ _id }));
      return [driveFacet(rows)];
    },
  });
}
