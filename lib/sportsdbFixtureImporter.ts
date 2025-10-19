// lib/sportsdbFixtureImporter.ts
// WHAT: Import TheSportsDB fixtures for partners and create draft projects with strict rules
// WHY: SportsDB is the primary source for scheduling; enforce that home partner must exist

import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';
import type { Db, Collection, ObjectId } from 'mongodb';
import type { SportsDbEvent } from '@/lib/sportsDbTypes';
import { fetchTeamUpcomingEvents, lookupTeam } from '@/lib/sportsDbApi';
import { nowIsoMs } from '@/lib/footballDataApi';

export interface SportsDbFixtureDoc {
  _id?: ObjectId;
  eventId: string;                 // SportsDB idEvent
  leagueId?: string | null;
  leagueName?: string | null;
  season?: string | null;
  date: string;                    // YYYY-MM-DD
  time?: string | null;            // HH:mm:ss
  timestamp?: string | null;       // ISO timestamp
  status?: string | null;          // Not Started / Finished
  venueId?: string | null;
  venue?: string | null;

  // Teams
  homeTeam: { id?: string | null; name?: string | null };
  awayTeam: { id?: string | null; name?: string | null };

  // Partner mapping
  homePartnerId?: ObjectId;
  awayPartnerId?: ObjectId;

  // Project association
  projectId?: ObjectId;
  isDraftProject?: boolean;

  createdAt: string;
  updatedAt: string;
}

export async function importUpcomingForPartner(partnerId: ObjectId, teamId: string) {
  const client = await clientPromise;
  const db: Db = client.db(config.dbName);
  const fixtures: Collection<SportsDbFixtureDoc> = db.collection('sportsdb_fixtures');

  const events: SportsDbEvent[] = await fetchTeamUpcomingEvents(teamId);
  const now = nowIsoMs();
  let upserts = 0;
  for (const ev of events) {
    const doc: Partial<SportsDbFixtureDoc> = {
      eventId: ev.idEvent,
      leagueId: ev.idLeague || null,
      leagueName: ev.strLeague || null,
      season: ev.strSeason || null,
      date: ev.dateEvent || (ev.strTimestamp ? ev.strTimestamp.split('T')[0] : ''),
      time: ev.strTime || null,
      timestamp: ev.strTimestamp || null,
      status: ev.strStatus || 'Not Started',
      venueId: ev.idVenue || null,
      venue: ev.strVenue || null,
      homeTeam: { id: ev.idHomeTeam || null, name: ev.strHomeTeam || null },
      awayTeam: { id: ev.idAwayTeam || null, name: ev.strAwayTeam || null },
      updatedAt: now,
    } as any;

    const res = await fixtures.updateOne(
      { eventId: ev.idEvent },
      { $set: doc, $setOnInsert: { createdAt: now } },
      { upsert: true }
    );
    if (res.upsertedCount || res.modifiedCount) upserts++;
  }
  return { imported: events.length, upserts };
}

export async function matchSportsDbFixturesToPartners() {
  const client = await clientPromise;
  const db: Db = client.db(config.dbName);
  const fixtures = db.collection('sportsdb_fixtures');
  const partners = db.collection('partners');

  const cur = fixtures.find({ $or: [ { homePartnerId: { $exists: false } }, { awayPartnerId: { $exists: false } } ] }).limit(500);
  let matched = 0;
  while (await cur.hasNext()) {
    const f: any = await cur.next();
    if (!f) break;

    const updates: any = {};
    if (!f.homePartnerId && f.homeTeam?.id) {
      const home = await partners.findOne({ 'sportsDb.teamId': f.homeTeam.id });
      if (home?._id) updates.homePartnerId = home._id;
    }
    if (!f.awayPartnerId && f.awayTeam?.id) {
      const away = await partners.findOne({ 'sportsDb.teamId': f.awayTeam.id });
      if (away?._id) updates.awayPartnerId = away._id;
    }

    if (Object.keys(updates).length) {
      await fixtures.updateOne({ _id: f._id }, { $set: updates });
      matched++;
    }
  }
  return { matched };
}

export async function createDraftPartnerFromSportsDbTeam(teamId: string) {
  const client = await clientPromise;
  const db: Db = client.db(config.dbName);
  const partners = db.collection('partners');

  const existing = await partners.findOne({ 'sportsDb.teamId': teamId });
  if (existing) return { _id: existing._id as ObjectId };

  const team = await lookupTeam(teamId);
  if (!team) throw new Error('sportsdb_team_not_found');

  const now = nowIsoMs();
  const doc: any = {
    name: team.strTeam,
    emoji: '⚽',
    hashtags: [],
    categorizedHashtags: {},
    sportsDb: {
      teamId: team.idTeam,
      strTeam: team.strTeam,
      strTeamShort: team.strTeamShort,
      strAlternate: team.strAlternate,
      strSport: team.strSport,
      strLeague: team.strLeague,
      leagueId: team.idLeague,
      strStadium: team.strStadium,
      intFormedYear: team.intFormedYear,
      strCountry: team.strCountry,
      strTeamBadge: team.strTeamBadge,
      lastSynced: now,
    },
    isDraft: true,
    createdAt: now,
    updatedAt: now,
  };

  // Upload badge if present
  try {
    if (team.strTeamBadge) {
      const { uploadImageFromUrl } = await import('@/lib/imgbbApi');
      const up = await uploadImageFromUrl(team.strTeamBadge, `partner-${team.strTeam}-${team.idTeam}`);
      if (up.success && up.data?.url) {
        doc.logoUrl = up.data.url;
      }
    }
  } catch {}

  const res = await partners.insertOne(doc);
  return { _id: res.insertedId };
}

// WHAT: Create draft project from SportsDB fixture
// WHY: SportsDB is primary; enforce home partner must exist; away may be draft
export async function createDraftProjectFromSportsDbFixture(eventId: string) {
  const client = await clientPromise;
  const db: Db = client.db(config.dbName);
  const fixtures = db.collection('sportsdb_fixtures');
  const partners = db.collection('partners');
  const projects = db.collection('projects');

  const fix: any = await fixtures.findOne({ eventId });
  if (!fix) return { created: false, reason: 'fixture_not_found' };
  if (fix.projectId) return { created: false, reason: 'already_linked' };

  // Enforce: home partner must exist
  let homePartnerId = fix.homePartnerId as ObjectId | undefined;
  if (!homePartnerId && fix.homeTeam?.id) {
    const home = await partners.findOne({ 'sportsDb.teamId': fix.homeTeam.id });
    if (home?._id) homePartnerId = home._id as ObjectId;
  }
  if (!homePartnerId) return { created: false, reason: 'home_partner_missing' };

  // Away partner: try to find, else create draft from SportsDB if allowed
  let awayPartnerId = fix.awayPartnerId as ObjectId | undefined;
  if (!awayPartnerId && fix.awayTeam?.id) {
    const away = await partners.findOne({ 'sportsDb.teamId': fix.awayTeam.id });
    if (away?._id) {
      awayPartnerId = away._id as ObjectId;
    } else if (config.footballDataAutoCreatePartners) {
      const created = await createDraftPartnerFromSportsDbTeam(fix.awayTeam.id);
      awayPartnerId = created._id;
      await fixtures.updateOne({ _id: fix._id }, { $set: { awayPartnerId } });
    }
  }

  const home = await partners.findOne({ _id: homePartnerId });
  const away = awayPartnerId ? await partners.findOne({ _id: awayPartnerId }) : null;
  const homeName = home?.name || fix.homeTeam?.name || 'Home';
  const awayName = away?.name || fix.awayTeam?.name || 'Away';

  const eventName = `${homeName} x ${awayName}`;
  const eventDate = fix.date;

  const now = nowIsoMs();
  const projectDoc: any = {
    eventName,
    eventDate,
    hashtags: [],
    categorizedHashtags: {},
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
    sportsDbFixture: {
      eventId: fix.eventId,
      league: fix.leagueName || null,
      venue: fix.venue || null,
      status: fix.status || null,
      linkedAt: now,
    }
  };

  const res = await projects.insertOne(projectDoc);
  await fixtures.updateOne({ _id: fix._id }, { $set: { projectId: res.insertedId, isDraftProject: true } });
  return { created: true, projectId: res.insertedId.toString() };
}

export async function syncSportsDbForAllPartners() {
  const client = await clientPromise;
  const db: Db = client.db(config.dbName);
  const partners = db.collection('partners');

  const cur = partners.find({ 'sportsDb.teamId': { $exists: true, $ne: null } }).project({ _id: 1, 'sportsDb.teamId': 1 }).limit(500);
  let imported = 0; let upserts = 0;
  while (await cur.hasNext()) {
    const p: any = await cur.next();
    if (!p) break;
    const res = await importUpcomingForPartner(p._id, p.sportsDb.teamId);
    imported += res.imported; upserts += res.upserts;
    // small delay to respect rate limit window
    await new Promise(r => setTimeout(r, 500));
  }
  return { imported, upserts };
}
