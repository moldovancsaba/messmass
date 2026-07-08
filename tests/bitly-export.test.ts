import { bitlyLinkToCsv, csvCell, bitlyExportFilename } from '@/lib/bitlyExport';

// WHAT: Verify Bitly link CSV serialization (#131)

describe('csvCell', () => {
  it('passes through plain values', () => {
    expect(csvCell('hello')).toBe('hello');
    expect(csvCell(42)).toBe('42');
  });
  it('renders null/undefined as empty', () => {
    expect(csvCell(undefined)).toBe('');
    expect(csvCell(null)).toBe('');
  });
  it('quotes and escapes commas, quotes, newlines', () => {
    expect(csvCell('a,b')).toBe('"a,b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell('line1\nline2')).toBe('"line1\nline2"');
  });
});

describe('bitlyExportFilename', () => {
  it('slugifies the bitlink', () => {
    expect(bitlyExportFilename({ bitlink: 'bit.ly/3fK8Lm2' })).toBe('bitly-bit.ly-3fK8Lm2.csv');
  });
  it('falls back when no bitlink', () => {
    expect(bitlyExportFilename({})).toBe('bitly-bitly-link.csv');
  });
});

describe('bitlyLinkToCsv', () => {
  const link = {
    bitlink: 'bit.ly/abc',
    title: 'Campaign, Q3',
    long_url: 'https://example.com/p',
    click_summary: { total: 120, unique: 90 },
    clicks_timeseries: [
      { date: '2026-07-01', clicks: 10 },
      { date: '2026-07-02', clicks: 20 },
    ],
    geo: { countries: [{ country: 'HU', clicks: 80 }, { country: 'RO', clicks: 40 }] },
    referrers: [{ referrer: 'instagram', clicks: 70 }],
    lastSyncAt: '2026-07-07T00:00:00.000Z',
  };

  it('includes summary, sections, and headers', () => {
    const csv = bitlyLinkToCsv(link);
    expect(csv).toContain('Bitlink,bit.ly/abc');
    expect(csv).toContain('Total Clicks,120');
    expect(csv).toContain('Unique Clicks,90');
    expect(csv).toContain('Daily Clicks');
    expect(csv).toContain('Date,Clicks');
    expect(csv).toContain('2026-07-01,10');
    expect(csv).toContain('Countries');
    expect(csv).toContain('HU,80');
    expect(csv).toContain('Referrers');
    expect(csv).toContain('instagram,70');
  });

  it('escapes commas in the title', () => {
    expect(bitlyLinkToCsv(link)).toContain('Title,"Campaign, Q3"');
  });

  it('is robust to missing sections', () => {
    const csv = bitlyLinkToCsv({ bitlink: 'bit.ly/x' });
    expect(csv).toContain('Bitlink,bit.ly/x');
    expect(csv).toContain('Total Clicks,0');
    expect(csv).toContain('Daily Clicks');
    expect(csv).toContain('Countries');
    expect(csv).toContain('Referrers');
  });
});
