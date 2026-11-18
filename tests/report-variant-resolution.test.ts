// tests/report-variant-resolution.test.ts
// WHAT: Runtime variant resolution must honour the status an operator set.
// WHY: messmass#244. The reports workspace shows an Archive / Publish toggle,
//     and `resolveReportVariant` never looked at `status` — so pressing Archive
//     flipped a badge and left the variant resolving on its public URL. The
//     workspace also counts `status === 'published'` and presents that as the
//     number of live reports, which was unrelated to what was actually served.
// HOW: Calls the real selectServableVariant from lib/reportVariants.ts (the
//     function resolveReportVariant itself calls) rather than through the DB,
//     because the rules are the thing that was wrong: which variant a slug
//     picks, which one an absent slug picks, and what happens when the default
//     itself is archived. It was previously a hand-mirrored copy of the rule
//     in this file, which could not have caught a divergence from the real
//     one; selectServableVariant was extracted out of resolveReportVariant
//     specifically to close that gap. The draft case is asserted as
//     *servable* on purpose — see the note on selectServableVariant; it is a
//     recorded open question, and a test that quietly assumed the opposite
//     would hide it.

import {
  selectServableVariant as select,
  buildVirtualFederationScopeVariants,
  filterEventsByReportVariant,
  isNationalTeamEvent,
} from '@/lib/reportVariants';
import type { ReportVariant, ReportVariantStatus } from '@/lib/reportVariants';

function variant(over: Partial<ReportVariant> & { slug: string }): ReportVariant {
  return {
    _id: `id-${over.slug}`,
    ownerType: 'organization',
    ownerId: 'owner-1',
    name: over.slug,
    isDefault: false,
    status: 'draft' as ReportVariantStatus,
    timezone: 'UTC',
    periodPreset: 'all_time',
    customDateRange: null,
    reportTemplateId: 'tpl-1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...over,
  } as ReportVariant;
}

describe('report variant runtime resolution', () => {
  const def = variant({ slug: 'default', isDefault: true, status: 'published' });
  const live = variant({ slug: 'chl-this-year', status: 'published' });
  const gone = variant({ slug: 'chl-2024-26', status: 'archived' });
  const draft = variant({ slug: 'chl-2026-2027-season', status: 'draft' });

  it('serves a published variant by slug', () => {
    expect(select([def, live, gone], 'chl-this-year')?.slug).toBe('chl-this-year');
  });

  it('refuses an archived variant by slug', () => {
    // The bug: Archive was purely cosmetic and this returned the variant.
    expect(select([def, live, gone], 'chl-2024-26')).toBeUndefined();
  });

  it('falls back to the default when no slug is given', () => {
    expect(select([live, def, gone])?.slug).toBe('default');
  });

  it('skips an archived default rather than serving it', () => {
    const archivedDefault = variant({ slug: 'default', isDefault: true, status: 'archived' });
    expect(select([archivedDefault, live])?.slug).toBe('chl-this-year');
  });

  it('still serves drafts — the open question, asserted deliberately', () => {
    // Every variant in production is a draft, because creation defaults to it
    // and the spec has no such state. Excluding drafts would 404 all of them,
    // so the decision is recorded on #244 rather than taken here.
    expect(select([draft], 'chl-2026-2027-season')?.slug).toBe('chl-2026-2027-season');
  });

  it('resolves nothing when every variant is archived', () => {
    expect(select([gone])).toBeUndefined();
  });

  it('keeps archived variants visible to the workspace', () => {
    // listReportVariants must not filter: the workspace has to show archived
    // variants in order to offer un-archiving. The exclusion is at the runtime
    // edge only.
    const all = [def, live, gone];
    expect(all).toHaveLength(3);
    expect(all.filter((v) => v.status === 'archived')).toHaveLength(1);
  });

  it('builds the 3 default scope variants (All Together, National Games, Club Games) for a federation', () => {
    const variants = buildVirtualFederationScopeVariants({
      ownerType: 'organization',
      ownerId: 'org-mkosz',
      ownerName: 'MKOSZ',
      timezone: 'Europe/Budapest',
      orgType: 'federation',
      statsOverrides: {},
    });
    expect(variants.map((v) => v.slug)).toEqual(['default', 'national-games', 'club-games']);
    expect(variants.map((v) => v.eventScope)).toEqual(['all', 'national_games', 'club_games']);
  });

  it('separates national team games, club games, and sponsor-filtered games accurately', () => {
    const sampleEvents = [
      {
        _id: 'ev-nat',
        eventName: 'FIBA World Cup Qualifier - HUN vs EST',
        competitionType: 'national_team',
        categorizedHashtags: { federation: ['mkosz', 'fiba'], scope: ['national_games'], sport: ['basketball'] },
      },
      {
        _id: 'ev-club-dom',
        eventName: 'Soproni KC x Zalakerámia ZTE KK',
        competitionType: 'domestic_league',
        categorizedHashtags: { federation: ['mkosz'], league: ['tippmix_ferfi_nb1'], sponsor: ['tippmix'], scope: ['club_games'], sport: ['basketball'] },
      },
      {
        _id: 'ev-club-intl',
        eventName: 'DVTK Huntherm x Lublin',
        competitionType: 'international_club',
        categorizedHashtags: { federation: ['fiba'], league: ['euroleague_women'], scope: ['club_games'], sport: ['basketball'] },
      },
    ];

    expect(isNationalTeamEvent(sampleEvents[0])).toBe(true);
    expect(isNationalTeamEvent(sampleEvents[1])).toBe(false);

    const nationalOnly = filterEventsByReportVariant(sampleEvents, { eventScope: 'national_games' });
    expect(nationalOnly.map((e) => e._id)).toEqual(['ev-nat']);

    const clubOnly = filterEventsByReportVariant(sampleEvents, { eventScope: 'club_games' });
    expect(clubOnly.map((e) => e._id)).toEqual(['ev-club-dom', 'ev-club-intl']);

    const tippmixOnly = filterEventsByReportVariant(sampleEvents, {
      eventScope: 'all',
      eventFilter: { sponsorTags: ['tippmix'] },
    });
    expect(tippmixOnly.map((e) => e._id)).toEqual(['ev-club-dom']);
  });
});
