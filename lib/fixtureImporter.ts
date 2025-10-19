// lib/fixtureImporter.ts
// WHAT: Import Football-Data.org fixtures into MongoDB and handle matching/creation hooks
// WHY: Cache fixtures for offline queries and enable automated event creation workflows

import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';
import { fetchFixtures, nowIsoMs } from '@/lib/footballDataApi';
import type { Db, Collection, ObjectId } from 'mongodb';
import type { FootballDataFixtureDoc, FootballDataMatchesResponse } from './footballData.types';

function toFixtureDoc(match: FootballDataMatchesResponse['matches'][number]): FootballDataFixtureDoc {
  return {
    fixtureId: match.id,
    competition: match.competition!,
    season: match.season,
    utcDate: match.utcDate,
    status: match.status,
    matchday: match.matchday,
    stage: match.stage,
    group: match.group ?? null,
    venue: (match as any).venue ?? null,
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    lastUpdated: (match as any).lastUpdated || nowIsoMs(),
    createdAt: nowIsoMs(),
    syncedAt: nowIsoMs(),
  };
}

export async function importFixtures(competitionIdOrCode: number | string, opts?: { status?: string; dateFrom?: string; dateTo?: string }) {
  const client = await clientPromise;
  const db: Db = client.db(config.dbName);
  const col: Collection<FootballDataFixtureDoc> = db.collection('football_data_fixtures');

  const resp = await fetchFixtures(competitionIdOrCode, opts);
  const docs = resp.matches.map(toFixtureDoc);

  let upserts = 0;
  for (const doc of docs) {
    const res = await col.updateOne(
      { fixtureId: doc.fixtureId },
      {
        $set: {
          competition: doc.competition,
          season: doc.season,
          utcDate: doc.utcDate,
          status: doc.status,
          matchday: doc.matchday,
          stage: doc.stage,
          group: doc.group,
          venue: doc.venue,
          homeTeam: doc.homeTeam,
          awayTeam: doc.awayTeam,
          lastUpdated: doc.lastUpdated,
          syncedAt: nowIsoMs(),
        },
        $setOnInsert: { createdAt: nowIsoMs() },
      },
      { upsert: true }
    );
    if (res.upsertedCount || res.modifiedCount) upserts++;
  }

  return { imported: docs.length, upserts };
}

// WHAT: Attempt to match cached fixtures to existing partners by Football-Data teamId
// WHY: Enable Sports Match Builder suggestions without manual linking
export async function matchFixturesToPartners() {
  const client = await clientPromise;
  const db: Db = client.db(config.dbName);
  const fixtures: Collection<FootballDataFixtureDoc> = db.collection('football_data_fixtures');
  const partners = db.collection('partners');

  const cursor = fixtures.find({ $or: [ { homePartnerId: { $exists: false } }, { awayPartnerId: { $exists: false } } ] }).limit(500);
  let matched = 0;
  while (await cursor.hasNext()) {
    const fix = await cursor.next();
    if (!fix) break;

    const updates: any = {};

    if (!fix.homePartnerId) {
      const home = await partners.findOne({ 'footballData.teamId': fix.homeTeam.id });
      if (home?._id) updates.homePartnerId = home._id;
    }
    if (!fix.awayPartnerId) {
      const away = await partners.findOne({ 'footballData.teamId': fix.awayTeam.id });
      if (away?._id) updates.awayPartnerId = away._id;
    }

    if (Object.keys(updates).length) {
      await fixtures.updateOne({ _id: fix._id }, { $set: updates });
      matched++;
    }
  }

  return { matched };
}

// WHAT: Create a draft partner from Football-Data team
// WHY: Allow event creation when opponent is not yet in partners DB
export async function createDraftPartnerFromTeam(team: { id: number; name: string; shortName?: string; tla?: string; crest?: string }) {
  const client = await clientPromise;
  const db: Db = client.db(config.dbName);
  const partners = db.collection('partners');

  // Check if already exists by footballData.teamId
  const exists = await partners.findOne({ 'footballData.teamId': team.id });
  if (exists) return { _id: exists._id as ObjectId };

  const now = nowIsoMs();
  const doc: any = {
    name: team.name,
    emoji: '⚽',
    hashtags: [],
    categorizedHashtags: {},
    footballData: {
      teamId: team.id,
      name: team.name,
      shortName: team.shortName || team.name,
      tla: team.tla || '',
      crest: team.crest || '',
      competitions: [],
      lastSynced: now
    },
    isDraft: true,
    createdAt: now,
    updatedAt: now
  };

  // Attempt crest upload to ImgBB if available
  try {
    if (team.crest) {
      const { uploadImageFromUrl } = await import('@/lib/imgbbApi');
      const up = await uploadImageFromUrl(team.crest, `partner-${team.name || team.tla || team.id}`);
      if (up.success && up.data?.url) {
        doc.logoUrl = up.data.url;
      }
    }
  } catch {
    // Non-blocking
  }

  const res = await partners.insertOne(doc);
  return { _id: res.insertedId };
}

// WHAT: Create draft project from a fixture when home partner exists
// WHY: Pre-populate events for planning, with metadata link to fixture
export async function createDraftProjectFromFixture(fixId: number) {
  const client = await clientPromise;
  const db: Db = client.db(config.dbName);
  const fixtures: Collection<FootballDataFixtureDoc> = db.collection('football_data_fixtures');
  const partners = db.collection('partners');
  const projects = db.collection('projects');

  const fix = await fixtures.findOne({ fixtureId: fixId });
  if (!fix) return { created: false, reason: 'fixture_not_found' };
  if (fix.projectId) return { created: false, reason: 'already_linked' };

  // Ensure home partner exists
  let homePartnerId = fix.homePartnerId as ObjectId | undefined;
  if (!homePartnerId) {
    const home = await partners.findOne({ 'footballData.teamId': fix.homeTeam.id });
    if (home?._id) homePartnerId = home._id as ObjectId;
  }
  if (!homePartnerId) return { created: false, reason: 'home_partner_missing' };

  // Ensure away partner exists or create draft
  let awayPartnerId = fix.awayPartnerId as ObjectId | undefined;
  if (!awayPartnerId) {
    const away = await partners.findOne({ 'footballData.teamId': fix.awayTeam.id });
    if (away?._id) {
      awayPartnerId = away._id as ObjectId;
    } else if (config.footballDataAutoCreatePartners) {
      const created = await createDraftPartnerFromTeam(fix.awayTeam);
      awayPartnerId = created._id;
      await fixtures.updateOne({ _id: fix._id }, { $set: { awayPartnerId } });
    }
  }

  // Build event name and date
  const home = await partners.findOne({ _id: homePartnerId });
  const away = awayPartnerId ? await partners.findOne({ _id: awayPartnerId }) : null;
  const homeName = home?.name || fix.homeTeam.name;
  const awayName = away?.name || fix.awayTeam.name;
  const eventName = `${homeName} x ${awayName}`;
  const eventDate = fix.utcDate.split('T')[0];

  // Merge hashtags: Partner1 all, Partner2 without location
  const categorized: Record<string, string[]> = {};
  const all: string[] = [];
  function mergeFromPartner(p: any, skipLocation = false) {
    if (!p) return;
    if (Array.isArray(p.hashtags)) all.push(...p.hashtags);
    if (p.categorizedHashtags) {
      for (const [cat, tags] of Object.entries(p.categorizedHashtags)) {
        if (skipLocation && cat.toLowerCase() === 'location') continue;
        categorized[cat] = Array.from(new Set([...(categorized[cat] || []), ...tags as string[]]));
      }
    }
  }
  mergeFromPartner(home, false);
  mergeFromPartner(away, true);

  const now = nowIsoMs();
  const projectDoc: any = {
    eventName,
    eventDate,
    hashtags: Array.from(new Set(all)),
    categorizedHashtags: categorized,
    stats: {
      remoteImages: 0, hostessImages: 0, selfies: 0,
      female: 0, male: 0, genAlpha: 0, genYZ: 0, genX: 0, boomer: 0,
      indoor: 0, outdoor: 0, stadium: 0,
      merched: 0, jersey: 0, scarf: 0, flags: 0, baseballCap: 0, other: 0,
    },
    partner1Id: homePartnerId,
    partner2Id: awayPartnerId,
    createdAt: now,
    updatedAt: now,
    isDraft: true,
    footballDataFixture: {
      fixtureId: fix.fixtureId,
      competition: { name: fix.competition.name, code: fix.competition.code },
      matchday: fix.matchday || null,
      status: fix.status,
      venue: fix.venue || null,
      linkedAt: now,
    }
  };

  const res = await projects.insertOne(projectDoc);
  await fixtures.updateOne({ _id: fix._id }, { $set: { projectId: res.insertedId, isDraftProject: true } });
  return { created: true, projectId: res.insertedId.toString() };
}

// WHAT: Bulk creation pass across cached fixtures
export async function autoCreateDraftsFromFixtures() {
  const client = await clientPromise;
  const db: Db = client.db(config.dbName);
  const fixtures: Collection<FootballDataFixtureDoc> = db.collection('football_data_fixtures');

  // Only SCHEDULED/TIMED fixtures without project link
  const cur = fixtures.find({ projectId: { $exists: false }, status: { $in: ['SCHEDULED', 'TIMED'] } }).limit(200);
  let created = 0;
  while (await cur.hasNext()) {
    const f = await cur.next();
    if (!f) break;
    // Only for fixtures where we have home partner; create away if missing
    if (!f.homePartnerId) continue;
    const res = await createDraftProjectFromFixture(f.fixtureId);
    if (res.created) created++;
  }
  return { created };
}
