// scripts/migrate-multi-org-competitions.ts
// WHAT: Migrates league pseudo-organizations into canonical `competitions` under their
//       true governing Federations, backfills multi-parent `projects.organizationIds[]`
//       and structured `projects.competition`, and seeds filtered `report_variants`.

import { MongoClient, ObjectId } from 'mongodb';
import { resolveCompetitionFromProject } from '../lib/sportCompetitions';
import { requireMessmassUri } from './lib/singleClusterConfig';

const LEAGUE_ORG_REMAP: Record<string, { federationOrgId: string; sport: string; format: string; division: string; tierLabel: string; tierLevel: number | null; sponsorTitle?: string }> = {
  '6af1c1000000000000000001': { federationOrgId: '6af1c0000000000000000001', sport: 'football', format: 'league', division: 'men', tierLabel: 'NB I', tierLevel: 1, sponsorTitle: 'OTP Bank' },
  '6af1c1000000000000000002': { federationOrgId: '6af1c0000000000000000001', sport: 'football', format: 'league', division: 'men', tierLabel: 'NB II', tierLevel: 2, sponsorTitle: 'Merkantil Bank' },
  '6af1c1000000000000000003': { federationOrgId: '6af1c0000000000000000001', sport: 'football', format: 'cup', division: 'men', tierLabel: 'Magyar Kupa', tierLevel: null, sponsorTitle: 'MOL' },
  '6af1c1000000000000000004': { federationOrgId: '6afd4d1727132886f7e7b49d', sport: 'basketball', format: 'league', division: 'men', tierLabel: 'NB I. A', tierLevel: 1, sponsorTitle: 'Tippmix' },
  '6af1c1000000000000000005': { federationOrgId: '6afd4d1727132886f7e7b49d', sport: 'basketball', format: 'league', division: 'women', tierLabel: 'NB I. A', tierLevel: 1, sponsorTitle: 'Tippmix' },
  '6af1c1000000000000000006': { federationOrgId: '6af1c0000000000000000005', sport: 'handball', format: 'league', division: 'men', tierLabel: 'NB I', tierLevel: 1, sponsorTitle: 'K&H' },
  '6af1c1000000000000000007': { federationOrgId: '6af1c0000000000000000007', sport: 'ice_hockey', format: 'league', division: 'men', tierLabel: 'Erste Liga', tierLevel: 1 },
  '6af1c1000000000000000008': { federationOrgId: '6af1c0000000000000000004', sport: 'football', format: 'cup', division: 'men', tierLabel: 'UEFA Champions League', tierLevel: null },
  '6af1c1000000000000000009': { federationOrgId: '6af1c0000000000000000004', sport: 'football', format: 'qualifier', division: 'men', tierLabel: 'European Qualifiers', tierLevel: null },
};

const FEDERATION_SLUG_MAP: Record<string, string> = {
  mlsz: '6af1c0000000000000000001',
  mkosz: '6afd4d1727132886f7e7b49d',
  mksz: '6af1c0000000000000000005',
  mrsz: '6af1c0000000000000000006',
  mjsz: '6af1c0000000000000000007',
  uefa: '6af1c0000000000000000004',
  fiba: '6af1c0000000000000000010',
  pzpn: '6af1c0000000000000000008',
  zprp: '6af1c0000000000000000009',
  sihf: '6a5e7c5196099ffc8fdcf564',
  chl: '69eb65379539a431fc3b8265',
  european_aquatics: '6af1c0000000000000000003',
};

const SPONSOR_SLUG_MAP: Record<string, string> = {
  tippmix: '6af1c2000000000000000001',
  szrt: '6af1c2000000000000000001',
  mol: '6af1c2000000000000000002',
};

async function migrateCluster(name: string, uri: string, apply: boolean) {
  console.log(`\n=== Migrating cluster [${name}] (apply=${apply}) ===`);
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('messmass');

  // 1. Mark the 9 league pseudo-orgs as status: 'migrated' & seed canonical competitions
  let migratedOrgs = 0;
  for (const [leagueOrgId, meta] of Object.entries(LEAGUE_ORG_REMAP)) {
    const orgDoc = await db.collection('organizations').findOne({ _id: new ObjectId(leagueOrgId) });
    if (orgDoc) {
      if (apply) {
        await db.collection('competitions').updateOne(
          { slug: orgDoc.slug },
          {
            $set: {
              name: orgDoc.name,
              slug: orgDoc.slug,
              governingOrgId: new ObjectId(meta.federationOrgId),
              sport: meta.sport,
              format: meta.format,
              division: meta.division,
              tierLabel: meta.tierLabel,
              tierLevel: meta.tierLevel,
              sponsorTitle: meta.sponsorTitle || null,
              updatedAt: new Date().toISOString(),
            },
            $setOnInsert: { createdAt: new Date().toISOString() },
          },
          { upsert: true }
        );
        await db.collection('organizations').updateOne(
          { _id: new ObjectId(leagueOrgId) },
          {
            $set: {
              status: 'migrated',
              'metadata.migratedToOrgId': meta.federationOrgId,
              updatedAt: new Date().toISOString(),
            },
          }
        );
      }
      migratedOrgs++;
    }
  }

  // 2. Backfill projects.organizationIds[] and projects.competition
  const projects = await db.collection('projects').find({}).toArray();
  let updatedProjects = 0;
  let multiOrgProjects = 0;

  const bulkOps: any[] = [];
  for (const p of projects) {
    const orgIdSet = new Set<string>();
    const rawOrgId = p.organizationId ? String(p.organizationId) : '';
    let primaryOrgId = rawOrgId;

    if (rawOrgId && LEAGUE_ORG_REMAP[rawOrgId]) {
      primaryOrgId = LEAGUE_ORG_REMAP[rawOrgId].federationOrgId;
      orgIdSet.add(primaryOrgId);
    } else if (rawOrgId && ObjectId.isValid(rawOrgId)) {
      orgIdSet.add(rawOrgId);
    }

    const cat = (p.categorizedHashtags || {}) as Record<string, string[]>;
    for (const fed of cat.federation || []) {
      const mapped = FEDERATION_SLUG_MAP[String(fed).toLowerCase()];
      if (mapped) orgIdSet.add(mapped);
    }
    for (const sp of cat.sponsor || []) {
      const mapped = SPONSOR_SLUG_MAP[String(sp).toLowerCase()];
      if (mapped) orgIdSet.add(mapped);
    }
    const hashtags = Array.isArray(p.hashtags) ? p.hashtags.map((h: unknown) => String(h).toLowerCase()) : [];
    if (hashtags.some((h) => h.includes('tippmix')) || /tippmix/i.test(String(p.eventName || ''))) {
      orgIdSet.add(SPONSOR_SLUG_MAP.tippmix);
    }

    const organizationIds = Array.from(orgIdSet)
      .filter((id) => ObjectId.isValid(id))
      .map((id) => new ObjectId(id));

    if (organizationIds.length > 1) multiOrgProjects++;

    const competition = resolveCompetitionFromProject(p);
    const setFields: Record<string, any> = {
      organizationIds,
      competition,
    };
    if (primaryOrgId && primaryOrgId !== rawOrgId && ObjectId.isValid(primaryOrgId)) {
      setFields.organizationId = new ObjectId(primaryOrgId);
    }

    bulkOps.push({
      updateOne: {
        filter: { _id: p._id },
        update: { $set: setFields },
      },
    });
    updatedProjects++;
  }

  if (apply && bulkOps.length > 0) {
    await db.collection('projects').bulkWrite(bulkOps, { ordered: false });
  }

  // 3. Seed clean report_variants under MKOSZ and MLSZ
  const now = new Date().toISOString();
  const variantsToSeed = [
    // MKOSZ
    { ownerId: '6afd4d1727132886f7e7b49d', slug: 'ferfi-nb1-a', name: 'Férfi Bajnokság — NB I. A', eventFilter: { sportTags: ['basketball'], formats: ['league'], divisions: ['men'], tierLabels: ['NB I. A'], excludeSyntheticRollups: true } },
    { ownerId: '6afd4d1727132886f7e7b49d', slug: 'noi-nb1-a', name: 'Női Bajnokság — NB I. A', eventFilter: { sportTags: ['basketball'], formats: ['league'], divisions: ['women'], tierLabels: ['NB I. A'], excludeSyntheticRollups: true } },
    { ownerId: '6afd4d1727132886f7e7b49d', slug: 'magyar-kupa', name: 'MKOSZ Magyar Kupa', eventFilter: { sportTags: ['basketball'], formats: ['cup'], excludeSyntheticRollups: true } },
    { ownerId: '6afd4d1727132886f7e7b49d', slug: 'nemzeti-valogatott', name: 'Nemzeti Válogatott (FIBA)', eventFilter: { sportTags: ['basketball'], formats: ['qualifier', 'tournament'], excludeSyntheticRollups: true } },
    // MLSZ
    { ownerId: '6af1c0000000000000000001', slug: 'nb1', name: 'NB I (Férfi Bajnokság)', eventFilter: { sportTags: ['football'], formats: ['league'], tierLabels: ['NB I'], excludeSyntheticRollups: true } },
    { ownerId: '6af1c0000000000000000001', slug: 'nb2', name: 'NB II (Férfi Bajnokság)', eventFilter: { sportTags: ['football'], formats: ['league'], tierLabels: ['NB II'], excludeSyntheticRollups: true } },
    { ownerId: '6af1c0000000000000000001', slug: 'mol-magyar-kupa', name: 'MOL Magyar Kupa', eventFilter: { sportTags: ['football'], formats: ['cup'], excludeSyntheticRollups: true } },
  ];

  if (apply) {
    for (const v of variantsToSeed) {
      await db.collection('report_variants').updateOne(
        { ownerType: 'organization', ownerId: v.ownerId, slug: v.slug },
        {
          $set: {
            name: v.name,
            eventFilter: v.eventFilter,
            status: 'published',
            updatedAt: now,
          },
          $setOnInsert: {
            ownerType: 'organization',
            ownerId: v.ownerId,
            slug: v.slug,
            isDefault: false,
            timezone: 'Europe/Budapest',
            periodPreset: 'all_time',
            customDateRange: null,
            statsOverrides: {},
            createdAt: now,
          },
        },
        { upsert: true }
      );
    }
    await db.collection('report_snapshots').deleteMany({});
  }

  console.log(`Cluster [${name}] summary:`, { migratedOrgs, updatedProjects, multiOrgProjects, seededVariants: variantsToSeed.length });
  await client.close();
}

async function main() {
  const apply = process.argv.includes('--apply');
  await migrateCluster('messmass', requireMessmassUri(), apply);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
