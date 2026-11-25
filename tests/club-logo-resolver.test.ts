import { ObjectId } from 'mongodb';
import {
  loadCentralizedClubRegistry,
  slugifyClub,
  syncClubAssetAcrossEntities,
} from '@/lib/clubLogoResolver';
import { enrichInteractiveReportLogos } from '@/lib/brandLogoResolver';
import { adminNavSections } from '@/lib/adminNavigation';

describe('Centralized Club Logos Registry & Menu Placement', () => {
  it('places Club Logos in Entities immediately before Brand Logos', () => {
    const entitiesGroup = adminNavSections.find((s) => s.key === 'entities');
    expect(entitiesGroup).toBeDefined();
    const items = entitiesGroup!.items || [];
    const clubLogosIdx = items.findIndex((c) => c.path === '/admin/club-logos');
    const brandLogosIdx = items.findIndex((c) => c.path === '/admin/brand-assets');

    expect(clubLogosIdx).toBeGreaterThanOrEqual(0);
    expect(brandLogosIdx).toBeGreaterThan(clubLogosIdx);
    expect(brandLogosIdx - clubLogosIdx).toBe(1);
    expect(items[clubLogosIdx].label).toBe('Club Logos');
  });

  it('resolves centralized club, national team, and federation SVG logos by ID, alias, and slug', async () => {
    const partnerId = new ObjectId('65a000000000000000000001');
    const orgId = new ObjectId('65a000000000000000000002');

    const mockCollections: Record<string, any[]> = {
      club_assets: [
        {
          name: 'FC Bayern Munich',
          canonicalSlug: 'fc-bayern-munich',
          aliases: ['fcb', 'bayern munich', 'fc bayern münchen'],
          logoUrl: 'https://cdn.example/logos/bayern.svg',
          entityKind: 'club',
          sport: 'Football',
        },
        {
          name: 'Germany',
          canonicalSlug: 'germany',
          aliases: ['deutschland', 'dfb'],
          logoUrl: 'https://cdn.example/logos/germany.svg',
          entityKind: 'national_team',
          sport: 'Football',
        },
        {
          name: 'Champions Hockey League',
          canonicalSlug: 'champions-hockey-league',
          aliases: ['chl'],
          logoUrl: 'https://cdn.example/logos/chl.svg',
          entityKind: 'federation',
          organizationId: orgId,
        },
      ],
      partners: [
        {
          _id: partnerId,
          name: 'Ferencvárosi TC',
          logoUrl: 'https://cdn.example/logos/ftc.svg',
        },
      ],
      organizations: [
        {
          _id: orgId,
          name: 'Champions Hockey League',
          slug: 'champions-hockey-league',
          logoUrl: '',
        },
      ],
      club_canonical_mappings: [
        { alias: 'sky blue army', targetClub: 'Coventry City FC' },
      ],
    };

    const mockDb = {
      collection: (name: string) => ({
        find: () => ({
          toArray: async () => mockCollections[name] || [],
        }),
      }),
    };

    const registry = await loadCentralizedClubRegistry(mockDb as any);

    expect(registry.resolveLogo({ name: 'FCB' })).toBe('https://cdn.example/logos/bayern.svg');
    expect(registry.resolveLogo({ name: 'Deutschland' })).toBe('https://cdn.example/logos/germany.svg');
    expect(registry.resolveLogo({ organizationId: orgId })).toBe('https://cdn.example/logos/chl.svg');
    expect(registry.resolveLogo({ partnerId })).toBe('https://cdn.example/logos/ftc.svg');
    expect(slugifyClub('Atlético Madrid')).toBe('atletico-madrid');
  });

  it('filters out non-club costume/prop/OCR noise while attaching official nation and club SVGs in AI Reports', async () => {
    const mockCollections: Record<string, any[]> = {
      brand_assets: [
        { name: 'Mr Vegas', canonicalSlug: 'mr-vegas', aliases: ['mr vegas'], logoUrl: 'https://cdn.example/mr-vegas.svg' },
      ],
      brand_canonical_mappings: [],
      club_assets: [
        {
          name: 'Germany',
          canonicalSlug: 'germany',
          aliases: ['germany', 'deutschland'],
          logoUrl: 'https://cdn.example/germany.svg',
          entityKind: 'national_team',
          sport: 'Football',
        },
        {
          name: 'Great Britain',
          canonicalSlug: 'great-britain',
          aliases: ['gbr', 'great britain'],
          logoUrl: 'https://cdn.example/gbr.svg',
          entityKind: 'national_team',
        },
        {
          name: 'Coventry City FC',
          canonicalSlug: 'coventry-city-fc',
          aliases: ['sky blue army', 'coventry city'],
          logoUrl: 'https://cdn.example/coventry.svg',
          entityKind: 'club',
          sport: 'Football',
        },
      ],
      partners: [],
      organizations: [],
      club_canonical_mappings: [],
    };

    const mockDb = {
      collection: (name: string) => ({
        find: () => ({
          toArray: async () => mockCollections[name] || [],
        }),
      }),
    };

    const rawReport: any = {
      scope: { type: 'event', id: '6af4222bf67f343074248810', name: 'Mr Vegas Grand Slam of Darts 2026' },
      vision: {
        totalImages: 445,
        processedCount: 445,
        percent: 100,
        status: 'complete',
        aggregates: {
          topBrands: [{ brand: 'Mr Vegas', count: 14 }],
          topClubs: [
            { club: 'Germany', count: 1 },
            { club: 'GBR', count: 1 },
            { club: 'Sky Blue Army', count: 1 },
            { club: 'Minion', count: 3 },
            { club: 'Beard', count: 2 },
            { club: 'S', count: 5 },
            { club: 'Nun Habit', count: 1 },
            { club: 'Random Unverified Noise Phrase', count: 1 },
          ],
          sportsBreakdown: {},
        },
      },
    };

    const enriched = await enrichInteractiveReportLogos(mockDb as any, rawReport);
    const clubs = enriched.vision!.aggregates.topClubs;

    expect(clubs.map((c: any) => c.club)).toEqual([
      'Germany',
      'Great Britain',
      'Coventry City FC',
    ]);
    expect(clubs.find((c: any) => c.club === 'Germany')?.logoUrl).toBe('https://cdn.example/germany.svg');
    expect(clubs.find((c: any) => c.club === 'Great Britain')?.logoUrl).toBe('https://cdn.example/gbr.svg');
    expect(clubs.find((c: any) => c.club === 'Coventry City FC')?.logoUrl).toBe('https://cdn.example/coventry.svg');
  });

  it('propagates logo updates across partners, organizations, v3_entities, and v3_organizations via surgical $set', async () => {
    const pId = new ObjectId('65b000000000000000000011');
    const oId = new ObjectId('65b000000000000000000022');
    const updates: Array<{ coll: string; filter: any; update: any }> = [];

    const mockDb = {
      collection: (name: string) => ({
        find: () => ({
          toArray: async () => {
            if (name === 'partners') return [{ _id: pId, name: 'Serie A' }];
            if (name === 'organizations') return [{ _id: oId, name: 'Serie A', slug: 'serie-a' }];
            return [];
          },
        }),
        updateMany: async (filter: any, update: any) => {
          updates.push({ coll: name, filter, update });
          return { modifiedCount: 1 };
        },
        deleteMany: async () => ({ deletedCount: 0 }),
      }),
    };

    const res = await syncClubAssetAcrossEntities(mockDb as any, {
      name: 'Serie A',
      canonicalSlug: 'serie-a',
      logoUrl: 'https://cdn.example/serie-a.svg',
      aliases: ['lega serie a'],
    });

    expect(res.updatedPartnerIds).toEqual([pId.toString()]);
    expect(res.updatedOrgIds).toEqual([oId.toString()]);
    expect(updates.find((u) => u.coll === 'partners')?.update.$set.logoUrl).toBe('https://cdn.example/serie-a.svg');
    expect(updates.find((u) => u.coll === 'organizations')?.update.$set.logoUrl).toBe('https://cdn.example/serie-a.svg');
  });
});
