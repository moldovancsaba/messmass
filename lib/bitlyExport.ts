// WHAT: Serialize a Bitly link's cached analytics into a shareable CSV artifact (#131)
// WHY: Bitly evidence rides along in report CSVs, but there was no way to export a single
//      link's full click/geo/referrer/timeseries breakdown for stakeholder reporting.
//      Pure + dependency-free so it is unit-testable and reuses the DB-cached data (no Bitly call).

type ClickSummary = { total?: number; unique?: number };
type TimeseriesPoint = { date?: string; clicks?: number };
type CountryPoint = { country?: string; clicks?: number };
type ReferrerPoint = { referrer?: string; clicks?: number };

export interface BitlyExportLink {
  bitlink?: string;
  long_url?: string;
  title?: string;
  click_summary?: ClickSummary;
  clicks_timeseries?: TimeseriesPoint[];
  geo?: { countries?: CountryPoint[] };
  referrers?: ReferrerPoint[];
  lastSyncAt?: string;
}

/**
 * WHAT: RFC-4180-style cell escaping.
 * WHY: Titles/URLs/referrers can contain commas, quotes, or newlines.
 */
export function csvCell(value: unknown): string {
  const s = value === undefined || value === null ? '' : String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * WHAT: Build a sectioned CSV (Summary / Daily Clicks / Countries / Referrers) for one link.
 * WHY: One file that packages every cached dimension for reuse in reporting.
 */
export function bitlyLinkToCsv(link: BitlyExportLink): string {
  const lines: string[] = [];
  const row = (...cells: unknown[]) => lines.push(cells.map(csvCell).join(','));

  row('Bitly Link Analytics Export');
  row('Bitlink', link.bitlink ?? '');
  row('Title', link.title ?? '');
  row('Long URL', link.long_url ?? '');
  row('Total Clicks', link.click_summary?.total ?? 0);
  row('Unique Clicks', link.click_summary?.unique ?? '');
  row('Last Sync', link.lastSyncAt ?? '');
  lines.push('');

  row('Daily Clicks');
  row('Date', 'Clicks');
  for (const p of link.clicks_timeseries ?? []) {
    row(p.date ?? '', p.clicks ?? 0);
  }
  lines.push('');

  row('Countries');
  row('Country', 'Clicks');
  for (const c of link.geo?.countries ?? []) {
    row(c.country ?? '', c.clicks ?? 0);
  }
  lines.push('');

  row('Referrers');
  row('Referrer', 'Clicks');
  for (const r of link.referrers ?? []) {
    row(r.referrer ?? '', r.clicks ?? 0);
  }

  return lines.join('\n');
}

/**
 * WHAT: Safe download filename for a link's export.
 * WHY: Bitlinks contain '/'; strip to a filesystem-safe slug.
 */
export function bitlyExportFilename(link: BitlyExportLink): string {
  const slug = (link.bitlink || 'bitly-link').replace(/[^a-zA-Z0-9._-]+/g, '-');
  return `bitly-${slug}.csv`;
}
