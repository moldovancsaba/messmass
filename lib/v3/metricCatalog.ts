// lib/v3/metricCatalog.ts
// WHAT: The v1 metric catalog for the sponsorship data warehouse -- messmass#232.
// WHY: The org picked v3's MetricDefinition/MetricValue model as the
//     foundation (2026-09-17), and picked which field categories belong in
//     v1: fan/engagement metrics, ad-value/ROI estimates, Bitly click data,
//     and partner/event identifiers. This is that catalog, made real rather
//     than left as a category list -- each entry classified raw/derived/
//     valuation, extending the one existing precedent for that distinction
//     (lib/googleSheets/dynamicMapping.ts's `computed: true` tagging) rather
//     than inventing a new scheme.
// HOW: `classification` is not a MetricDefinition schema field (the Mongoose
//     model doesn't have one) -- it's stored in `metadata.classification`,
//     which the schema already supports as a free-form bag. Adding a real
//     column for something this schema doesn't need yet would be the
//     opposite of Phase A discipline.

import connectV3 from '@/lib/mongoose-v3';
import V3MetricDefinition from '@/lib/models/v3/MetricDefinition';

export type MetricClassification = 'raw' | 'derived' | 'valuation';

export interface MetricCatalogEntry {
  key: string;
  name: string;
  type: 'number' | 'currency' | 'percentage' | 'duration';
  unit: string;
  classification: MetricClassification;
  /** Why this classification, and where the number comes from -- shown to a BI consumer, not just internal doc. */
  description: string;
}

export const METRIC_CATALOG: MetricCatalogEntry[] = [
  {
    key: 'total-fans',
    name: 'Total Fans',
    type: 'number',
    unit: 'people',
    classification: 'raw',
    description: 'Attendance count as recorded on the event (stadium + remote).',
  },
  {
    key: 'total-images',
    name: 'Total Images',
    type: 'number',
    unit: 'images',
    classification: 'raw',
    description: 'Photos captured across remote, hostess, and selfie sources.',
  },
  {
    key: 'total-merched',
    name: 'Merchandise Reach',
    type: 'number',
    unit: 'people',
    classification: 'raw',
    description: 'Attendees wearing or holding merchandise, as recorded on the event.',
  },
  {
    key: 'ad-value-estimate',
    name: 'Ad Value (Est.)',
    type: 'currency',
    unit: 'EUR',
    classification: 'valuation',
    // Disclosure basis: see messmass#226 -- synthetic estimate, not measured ad spend.
    description: 'Synthetic estimate from organic engagement counts and fixed CPM constants -- not measured ad spend.',
  },
  {
    key: 'bitly-clicks',
    name: 'Bitly Clicks',
    type: 'number',
    unit: 'clicks',
    classification: 'raw',
    description: 'Total measured clicks across every Bitly link associated with this event.',
  },
];

export function findMetricCatalogEntry(key: string): MetricCatalogEntry | undefined {
  return METRIC_CATALOG.find((m) => m.key === key);
}

/** Upserts every catalog entry into v3_metric_definitions -- idempotent, safe to call repeatedly (e.g. before every sync). */
export async function seedMetricDefinitions(): Promise<number> {
  await connectV3();

  let written = 0;
  for (const entry of METRIC_CATALOG) {
    await V3MetricDefinition.findOneAndUpdate(
      { key: entry.key },
      {
        $set: {
          name: entry.name,
          type: entry.type,
          unit: entry.unit,
          metadata: { classification: entry.classification, description: entry.description },
        },
      },
      { upsert: true }
    );
    written += 1;
  }
  return written;
}
