import { enrichInteractiveReportLogos } from '@/lib/brandLogoResolver';
import { fanmassDashboardData } from '@/lib/hashtagReport/dashboard';
import { calculate } from '@/lib/hashtagReport/calculated';
import { mergePhotoSummaries } from '@/lib/hashtagReport/mergeSummaries';
import { readDriveSummary } from '@/lib/hashtagReport/measured';
import { driveFacet } from './helpers/driveFacet';
import type { HashtagReport } from '@/lib/hashtagReport/types';

describe('enrichInteractiveReportLogos', () => {
  it('enriches hashtag report vision brands and clubs from the unified brand_assets and partners registry', async () => {
    const drive = readDriveSummary(
      driveFacet([
        {
          eventId: 'e1',
          assignment: { confidence: 1 },
          optIn: { received: true },
          analysis: {
            peopleCount: 3,
            genders: { male: 2, female: 1 },
            ageGroups: { adults: 3 },
            emotions: { happy: 3 },
            brands: ['Hydro', 'Adidas', 'quechua', 'OTP Bank'],
            clubs: ['Ferencváros', 'Arsenal'],
          },
        },
      ])
    ).drive;

    const measured = {
      events: [
        {
          id: 'e1',
          name: 'FTC x DVSC',
          date: '2026-03-01',
          hasCounters: false,
          hasPhotoResults: false,
          drivePhotos: 1,
          cameraPhotos: 0,
          joinedBy: 'hashtag' as const,
        },
      ],
      counters: {},
      photos: mergePhotoSummaries([]),
      drive,
      cameraProof: [],
      months: [],
    };

    const report: HashtagReport = {
      success: true,
      scope: { type: 'hashtag', id: 'tippmixreport2026', tags: ['tippmixreport2026'] },
      generatedAt: '2026-11-24T00:00:00.000Z',
      measured,
      calculated: calculate(measured),
      coverage: { events: 1, eventsWithCounters: 0, eventsWithPhotoResults: 0, eventsWithDrivePhotos: 1 },
    };

    const rawDashboard = fanmassDashboardData(null, report);
    expect(rawDashboard.vision?.aggregates.topBrands[0].logoUrl).toBeUndefined();

    const mockCollections: Record<string, any[]> = {
      brand_assets: [
        { name: 'Hydro', canonicalSlug: 'hydro', aliases: ['hydro'], logoUrl: 'data:image/svg+xml;base64,H', category: 'industry' },
        { name: 'Adidas', canonicalSlug: 'adidas', aliases: ['adidas'], logoUrl: 'data:image/svg+xml;base64,A', category: 'sportswear' },
        { name: 'Decathlon', canonicalSlug: 'decathlon', aliases: ['decathlon', 'quechua', 'kipsta'], logoUrl: 'data:image/svg+xml;base64,D', category: 'retail' },
        { name: 'OTP Bank', canonicalSlug: 'otp-bank', aliases: ['otp bank'], logoUrl: 'data:image/svg+xml;base64,O', category: 'banking' },
      ],
      brand_canonical_mappings: [],
      partners: [
        { _id: 'p1', name: 'Ferencvárosi TC', logoUrl: 'https://cdn.example/logos/ftc.svg', viewSlug: 'ftc' },
        { _id: 'p2', name: 'Arsenal FC', logoUrl: 'https://cdn.example/logos/arsenal.svg', viewSlug: 'arsenal' },
      ],
    };

    const mockDb = {
      collection: (name: string) => ({
        find: () => ({
          toArray: async () => mockCollections[name] || [],
        }),
      }),
    };

    const enriched = await enrichInteractiveReportLogos(mockDb as any, rawDashboard);
    const brands = enriched.vision!.aggregates.topBrands;
    expect(brands.find((b) => b.brand === 'Hydro')?.logoUrl).toBe('data:image/svg+xml;base64,H');
    expect(brands.find((b) => b.brand === 'Adidas')?.logoUrl).toBe('data:image/svg+xml;base64,A');
    expect(brands.find((b) => b.brand === 'Decathlon')?.logoUrl).toBe('data:image/svg+xml;base64,D');
    expect(brands.find((b) => b.brand === 'OTP Bank')?.logoUrl).toBe('data:image/svg+xml;base64,O');

    const clubs = enriched.vision!.aggregates.topClubs;
    expect(clubs.find((c) => c.club === 'Ferencvárosi TC')?.logoUrl).toBe('https://cdn.example/logos/ftc.svg');
    expect(clubs.find((c) => c.club === 'Arsenal')?.logoUrl).toBe('https://cdn.example/logos/arsenal.svg');
  });
});
