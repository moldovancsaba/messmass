// tests/fanmass-dashboard.test.ts
// WHAT: The Fanmass report in the interactive dashboard keeps the Fanmass parts and no hand-entered figure.
// WHY: Owner 2026-11-14: the proper Fanmass report (charts, image proofs, map) while clicker and Fanmass reports never mix.

import { fanmassDashboardData, visionFromReport } from '@/lib/hashtagReport/dashboard';
import { readDriveSummary } from '@/lib/hashtagReport/measured';
import { mergePhotoSummaries } from '@/lib/hashtagReport/mergeSummaries';
import { driveFacet } from './helpers/driveFacet';
import type { HashtagReport } from '@/lib/hashtagReport/types';

const drive = readDriveSummary(driveFacet([
  { eventId: 'e1', assignment: { confidence: 1 }, optIn: { received: true }, analysis: { people: 3, genders: { male: 2, female: 1 }, ageGroups: { adults: 3 }, emotions: { happy: 2 }, brands: ['Veolia'], clubs: ['DVTK'] } },
  { eventId: 'e1', assignment: { confidence: 1 }, optIn: { received: true }, analysis: null },
])).drive;
const report: HashtagReport = {
  success: true,
  scope: { type: 'hashtag', id: 'tippmixreport2026', tags: ['tippmixreport2026'] },
  generatedAt: '2026-11-14T00:00:00.000Z',
  measured: {
    events: [
      { id: 'e1', name: 'DVTK#ÚJPEST FC', date: '2025-11-02', hasCounters: false, hasPhotoResults: false, drivePhotos: 2, joinedBy: 'hashtag' },
      { id: 'e2', name: 'NOVEMBER Statisztika', date: null, hasCounters: false, hasPhotoResults: false, drivePhotos: 0, joinedBy: 'hashtag' },
    ],
    counters: {},
    photos: mergePhotoSummaries([]),
    drive,
  },
  calculated: {} as HashtagReport['calculated'],
  coverage: { events: 2, eventsWithCounters: 0, eventsWithPhotoResults: 0, eventsWithDrivePhotos: 1 },
};

const clicker = {
  success: true,
  scope: { type: 'hashtag' as const, id: 'tippmixreport2026', name: 'Szerencsejáték Zrt.', emoji: '🍀' },
  partner: { id: 'p', name: 'Szerencsejáték Zrt.', viewSlug: 'szrt', emoji: '🍀' },
  style: { name: 'szrt', heroBackground: 'green', pieColor1: '', pieColor2: '' },
  summary: { totalPhotos: 14569, hostessPhotos: 9324, selfies: 5245, hostessShare: 64, selfieShare: 36, totalRegistered: 13572, totalOptIns: 20130, optInRate: null, vettingApprovalRate: 97.6, totalCtaClicks: 5, totalMatches: 106, touchpoints: { qr: 1, url: 2, social: 3 } },
  timeline: [{ id: 't' } as never],
  matches: [{ id: 'm', submitted: 211, selfies: 35 } as never],
  sports: [{ sport: 'Football' } as never],
  funnel: [{ step: 'x', value: 1, detail: '' }],
  demographics: { male: 391, female: 159, totalAudience: 550, maleRatio: 71, femaleRatio: 29, generations: [] },
  vision: { totalImages: 11312, processedCount: 2643, percent: 23, status: 'idle' as const, currentSport: '', currentFile: '', lastUpdated: '', aggregates: { totalPeople: 8431, genders: { male: 4645, female: 3777, malePct: 55, femalePct: 45 }, ageGroups: { children: 129, teens: 21, adults: 52, seniors: 13 }, topBrands: [], topClubs: [], topEmotions: [], sportsBreakdown: {} }, recentImages: [] },
};

describe('the Fanmass report in the dashboard', () => {
  it('keeps the published vision and the scope header, and no hand-entered figure', () => {
    const data = fanmassDashboardData(clicker, report);
    expect(data.vision).toBe(clicker.vision);
    expect(data.partner.name).toBe('Szerencsejáték Zrt.');
    expect(data.timeline).toEqual([]);
    expect(data.funnel).toEqual([]);
    expect(data.sports).toEqual([]);
    expect(data.summary).toMatchObject({ totalPhotos: 0, totalRegistered: 0, totalOptIns: 0, vettingApprovalRate: null, totalMatches: 2 });
    // Demographics come from the vision, not from the typed counts
    expect(data.demographics?.male).toBe(4645);
    for (const typed of ['14569', '13572', '20130', '"submitted":211', '391']) expect(JSON.stringify(data)).not.toContain(typed);
  });

  it('lists the events with Fanmass photos for the map, their photos counted by Fanmass', () => {
    const data = fanmassDashboardData(clicker, report);
    expect(data.matches.map((m) => [m.cleanName, m.selfies])).toEqual([['DVTK x ÚJPEST FC', 2]]);
  });

  it('builds the vision from the stored photos when Fanmass published none for the scope', () => {
    const vision = visionFromReport(report)!;
    expect(vision).toMatchObject({ totalImages: 2, processedCount: 1, optInImages: 2 });
    expect(vision.aggregates).toMatchObject({ totalPeople: 3, genders: { male: 2, female: 1 }, ageGroups: { adults: 3 }, topBrands: [{ brand: 'Veolia', count: 1 }], topClubs: [{ club: 'DVTK', count: 1 }], topEmotions: [{ emotion: 'happy', count: 2 }] });
    expect(fanmassDashboardData(null, report).vision).toEqual(vision);
  });
});
