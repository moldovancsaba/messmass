import {
  computeRelativeAge,
  formatReleaseDate,
  parseReleaseNotesMarkdown,
} from '../lib/releaseNotesParser';

describe('releaseNotesParser for Whats New page and API', () => {
  it('formats ISO dates and relative age labels', () => {
    expect(formatReleaseDate('2026-11-17')).toBe('November 17, 2026');
    expect(computeRelativeAge('2026-11-17', new Date('2026-11-17T12:00:00Z'))).toBe('Today');
    expect(computeRelativeAge('2026-11-16', new Date('2026-11-17T12:00:00Z'))).toBe('Yesterday');
  });

  it('parses release headings and classifies bullets into new/fix/changed/doc/security', () => {
    const sample = [
      '# {messmass} Release Notes',
      '## [v12.3.49] — 2026-11-17 — EMV and Club Clustering',
      '- **Added (EMV):** registered Brand Earned Media Value in `/admin/charts`.',
      '- **Fixed (Camera deliveries):** resolved 409 mismatch.',
      '- **Changed (AI Analytics):** added top navigation hub.',
      '- **Guide:** updated tutorial.',
    ].join('\n');

    const sections = parseReleaseNotesMarkdown(sample, new Date('2026-11-17T12:00:00Z'));
    expect(sections).toHaveLength(1);
    expect(sections[0].version).toBe('v12.3.49');
    expect(sections[0].counts).toEqual({ new: 1, fix: 1, changed: 1, security: 0, doc: 1 });
    expect(sections[0].items[0].scope).toBe('EMV');
  });
});
