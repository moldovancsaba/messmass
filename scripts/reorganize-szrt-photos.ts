// scripts/reorganize-szrt-photos.ts
// WHAT: Reorganizes SZRT/Tippmix AI-analyzed photos across the 177 real Tippmix match events
//       with strict sport fencing, exact 2-club / 1-club matching, zero synthetic-rollup pollution,
//       and deduplication across fanmass_camera_photo_analyses (local_storage) and fanmass_event_drive_photos.

import fs from 'fs';
import path from 'path';
import { MongoClient, ObjectId } from 'mongodb';
import { detectSport } from '../lib/interactiveReportAggregator';

const CLUSTERS = {
  camaraclastar:
    'mongodb+srv://moldovancsaba_db_user:wMP6z5B3ft5mmyI0@camaraclastar.koyedpi.mongodb.net/messmass?retryWrites=true&w=majority&appName=camaraclastar',
  secondary:
    'mongodb+srv://messmass:mirdob-5kykku-qozGym@messmass-cluster.r96vlxs.mongodb.net/messmass?appName=messmass-cluster',
};

const CLUB_PATTERNS: Array<{ key: string; pattern: RegExp }> = [
  { key: 'mtk', pattern: /\bmtk\b/i },
  { key: 'dvsc', pattern: /\bdvsc\b|debrecen/i },
  { key: 'dvtk', pattern: /\bdvtk\b|di[óo]sgy[őo]r|jegesmedv[ée]k|huntherm/i },
  { key: 'ftc', pattern: /ferencv[áa]ros|\bftc\b|fradi/i },
  { key: 'ujpest', pattern: /[úu]jpest|\bute\b/i },
  { key: 'eto', pattern: /\beto\b|gy[őo]r/i },
  { key: 'av19', pattern: /av19|hydro\s*feh[ée]rv[áa]r|alba\s*vol[áa]n/i },
  { key: 'fehervar_fc', pattern: /feh[ée]rv[áa]r\s*fc|videoton|\bvidi\b|mol\s*feh[ée]rv[áa]r/i },
  { key: 'feha19', pattern: /feha19/i },
  { key: 'pick_szeged', pattern: /pick\s*szeged|\bszeged\b/i },
  { key: 'veszprem', pattern: /veszpr[ée]m/i },
  { key: 'paks', pattern: /\bpaks/i },
  { key: 'zte', pattern: /\bzte\b|zalaegerszeg/i },
  { key: 'kisvarda', pattern: /kisv[áa]rda/i },
  { key: 'nyiregyhaza', pattern: /ny[íi]regyh[áa]za|spartacus/i },
  { key: 'kecskemet', pattern: /kecskem[ée]t|\bkte\b/i },
  { key: 'mezokovesd', pattern: /mez[őo]k[öo]vesd/i },
  { key: 'kazincbarcika', pattern: /kazincbarcika/i },
  { key: 'puskas_akademia', pattern: /pusk[áa]s\s*akad/i },
  { key: 'vasas', pattern: /\bvasas\b/i },
  { key: 'honved', pattern: /honv[ée]d/i },
  { key: 'haladas', pattern: /halad[áa]s/i },
  { key: 'falco', pattern: /\bfalco\b/i },
  { key: 'szolnok', pattern: /szolnok|olajb[áa]ny[áa]sz/i },
  { key: 'alba_basket', pattern: /alba\s*feh[ée]rv[áa]r/i },
  { key: 'sopron', pattern: /\bsopron\b/i },
  { key: 'pecs', pattern: /p[ée]cs|\bnka\b|peac/i },
  { key: 'ose', pattern: /\bose\b|oroszl[áa]ny/i },
  { key: 'kormend', pattern: /k[öo]rmend/i },
  { key: 'kaposvar', pattern: /kaposv[áa]r|kometa/i },
  { key: 'atomeromu', pattern: /atomer[őo]m[űu]|\base\b/i },
  { key: 'deac', pattern: /\bdeac\b/i },
  { key: 'pler', pattern: /\bpler\b/i },
  { key: 'esztergom', pattern: /esztergom/i },
  { key: 'vac', pattern: /\bv[áa]c\b|v[áa]ci\s*nkse/i },
  { key: 'dkka', pattern: /duna[úu]jv[áa]rosi\s*koh[áa]sz|\bdkka\b/i },
  { key: 'dab', pattern: /ac[ée]lbik[áa]k|\bdab\b/i },
  { key: 'bja', pattern: /budapest\s*j[ée]gkorong|\bbja\b|\bmac\b/i },
  { key: 'csikszereda', pattern: /cs[íi]kszereda/i },
  { key: 'brasov', pattern: /bra[șs]ov|corona/i },
  { key: 'szekszard', pattern: /szeksz[áa]rd|\bksc\b/i },
  { key: 'kac', pattern: /ec[\s-]*kac/i },
  { key: 'graz', pattern: /graz/i },
  { key: 'vienna', pattern: /vienna\s*capitals/i },
  { key: 'tatabanya', pattern: /tatab[áa]nya/i },
  { key: 'szedeak', pattern: /szede[áa]k/i },
  { key: 'hungary', pattern: /magyarorsz[áa]g|hungary|\bhun\b|v[áa]logatott|national\s*(handball|football|basketball)?\s*team/i },
];

const IGNORE_CLUB_MENTION = /szerencsej|tippmix|borsodi|hajr[áa]|green\s*and\s*white|ice\s*hockey|arena|stadion|csarnok|k[ée]zilabda\s*sz[öo]vets/i;

function extractClubKeys(text: string): string[] {
  if (!text || IGNORE_CLUB_MENTION.test(text)) return [];
  const found: string[] = [];
  for (const { key, pattern } of CLUB_PATTERNS) {
    if (pattern.test(text) && !found.includes(key)) {
      found.push(key);
    }
  }
  return found;
}

function extractPhotoClubKeys(names: string[]): string[] {
  const keys: string[] = [];
  for (const n of names) {
    for (const k of extractClubKeys(n)) {
      if (!keys.includes(k)) keys.push(k);
    }
  }
  return keys;
}

interface TippmixEvent {
  id: string;
  name: string;
  date: string;
  sport: string;
  clubKeys: string[];
  partner1: string | null;
  partner2: string | null;
  organizationIds: string[];
  isNationalTeam: boolean;
  targetWeight: number;
  assignedCount: number;
}

const SPORT_FEDERATION_ORG: Record<string, string> = {
  Football: '6af1c0000000000000000001',   // MLSZ
  Basketball: '6afd4d1727132886f7e7b49d', // MKOSZ
  Handball: '6af1c0000000000000000005',   // MKSZ
  'Ice Hockey': '6af1c0000000000000000007', // MJSZ
};
const TIPPMIX_ORG_ID = '6af1c2000000000000000001';

async function run(apply: boolean) {
  const client = new MongoClient(CLUSTERS.camaraclastar);
  await client.connect();
  const db = client.db('messmass');

  // 1. Load all real Tippmix match events (exclude synthetic Statisztika / AI Analytics)
  const rawProjects = await db.collection('projects').find({
    $or: [
      { hashtags: { $regex: /tippmix/i } },
      { fanmassHashtags: { $regex: /tippmix/i } },
      { 'categorizedHashtags.campaign': { $regex: /tippmix/i } },
      { eventName: /tippmix/i },
    ],
  }, { projection: { _id: 1, eventName: 1, eventDate: 1, categorizedHashtags: 1, partner1: 1, partner2: 1, organizationId: 1, organizationIds: 1, 'stats.allImages': 1 } }).toArray();

  const events: TippmixEvent[] = rawProjects
    .filter((p) => !/statisztika|ai analytics/i.test(p.eventName || ''))
    .map((p) => {
      const name = String(p.eventName || '');
      const sport = detectSport(`${name} ${(p.categorizedHashtags?.sport || []).join(' ')}`);
      const clubKeys = extractClubKeys(name);
      const isNationalTeam = clubKeys.includes('hungary') || /magyar|hungary|fiba|válogatott/i.test(name);
      const storedImgs = Number(p.stats?.allImages || 0);
      const targetWeight = isNationalTeam ? 10 : storedImgs >= 150 ? 3 : 1;
      const orgIds = new Set<string>(
        Array.isArray(p.organizationIds) ? p.organizationIds.map(String) : p.organizationId ? [String(p.organizationId)] : []
      );
      if (SPORT_FEDERATION_ORG[sport]) orgIds.add(SPORT_FEDERATION_ORG[sport]);
      orgIds.add(TIPPMIX_ORG_ID);
      return {
        id: String(p._id),
        name,
        date: String(p.eventDate || ''),
        sport,
        clubKeys,
        partner1: p.partner1 ? String(p.partner1) : null,
        partner2: p.partner2 ? String(p.partner2) : null,
        organizationIds: [...orgIds],
        isNationalTeam,
        targetWeight,
        assignedCount: 0,
      };
    });

  // Build (sport, clubKey) -> partnerId lookup from Tippmix events + partners collection
  const allPartners = await db.collection('partners').find({}, { projection: { _id: 1, name: 1 } }).toArray();
  const partnerByClubSport = new Map<string, string>();
  for (const ev of events) {
    const p1 = ev.partner1;
    const p2 = ev.partner2;
    const p1Name = allPartners.find((p) => String(p._id) === p1)?.name || '';
    const p2Name = allPartners.find((p) => String(p._id) === p2)?.name || '';
    for (const ck of ev.clubKeys) {
      const pat = CLUB_PATTERNS.find((c) => c.key === ck)?.pattern;
      if (!pat) continue;
      if (p1 && pat.test(p1Name) && !partnerByClubSport.has(`${ev.sport}:${ck}`)) {
        partnerByClubSport.set(`${ev.sport}:${ck}`, p1);
      } else if (p2 && pat.test(p2Name) && !partnerByClubSport.has(`${ev.sport}:${ck}`)) {
        partnerByClubSport.set(`${ev.sport}:${ck}`, p2);
      }
    }
  }
  for (const { key, pattern } of CLUB_PATTERNS) {
    for (const sport of ['Basketball', 'Football', 'Handball', 'Ice Hockey']) {
      if (!partnerByClubSport.has(`${sport}:${key}`)) {
        const match = allPartners.find((p) => pattern.test(String(p.name || '')));
        if (match) partnerByClubSport.set(`${sport}:${key}`, String(match._id));
      }
    }
  }

  const eventsBySport = new Map<string, TippmixEvent[]>();
  for (const ev of events) {
    const list = eventsBySport.get(ev.sport) || [];
    list.push(ev);
    eventsBySport.set(ev.sport, list);
  }
  console.log('Target Tippmix events:', events.length, Object.fromEntries([...eventsBySport.entries()].map(([k, v]) => [k, v.length])));

  // 2. Load all local_storage photos & drive photos, keyed by fileName
  const camDocs = await db.collection('fanmass_camera_photo_analyses').find({ source: 'local_storage', tombstone: { $ne: true } }).toArray();
  const drvDocs = await db.collection('fanmass_event_drive_photos').find({}).toArray();

  // Deduplicate camDocs by fileName (keep richest summary/boxes)
  const camByFile = new Map<string, any>();
  const duplicateCamIds: any[] = [];
  for (const c of camDocs) {
    const fn = String(c.fileName || c._id);
    const existing = camByFile.get(fn);
    if (!existing) {
      camByFile.set(fn, c);
    } else {
      const existingScore = (existing.summary?.brandMentions?.length || 0) + (existing.boxes?.people?.length || 0);
      const newScore = (c.summary?.brandMentions?.length || 0) + (c.boxes?.people?.length || 0);
      if (newScore > existingScore) {
        duplicateCamIds.push(existing._id);
        camByFile.set(fn, c);
      } else {
        duplicateCamIds.push(c._id);
      }
    }
  }
  console.log(`Cam local_storage: ${camDocs.length} total -> ${camByFile.size} unique (${duplicateCamIds.length} duplicates to remove)`);

  // Build unified photo list over all 11,312 drive photos
  interface PhotoTask {
    drvId: string;
    fileName: string;
    sport: string;
    mtimeMs: number;
    clubKeys: string[];
    newEventId: string | null;
    placeClubKey: string | null;
    placePartnerId: string | null;
    placeOrganizationIds: string[];
    burstId: string | null;
    confidence: number;
    method: string;
  }

  const SZRT_ROOT = '/Users/Shared/Projects/szrt';
  const tasks: PhotoTask[] = drvDocs.map((d) => {
    const drvId = String(d._id);
    const fileName = drvId.split('/').pop() || drvId;
    const sport = drvId.split('/')[0] || String(d.sport || 'Football');
    const cam = camByFile.get(fileName);
    const rawClubs: string[] = [
      ...(Array.isArray(d.analysis?.clubs) ? d.analysis.clubs : []),
      ...(Array.isArray(cam?.summary?.clubMentions) ? cam.summary.clubMentions.map((m: any) => m.name || m.club || '') : []),
    ];
    const clubKeys = extractPhotoClubKeys(rawClubs);
    let mtimeMs = 0;
    const localPath = path.join(SZRT_ROOT, sport, fileName);
    if (fs.existsSync(localPath)) {
      mtimeMs = fs.statSync(localPath).mtimeMs;
    } else if (cam?.receivedAt) {
      mtimeMs = new Date(cam.receivedAt).getTime() || 0;
    }
    return {
      drvId,
      fileName,
      sport,
      mtimeMs,
      clubKeys,
      newEventId: null,
      placeClubKey: null,
      placePartnerId: null,
      placeOrganizationIds: [],
      burstId: null,
      confidence: 0,
      method: 'unassigned',
    };
  });

  // Sort: 2-club photos first, then 1-club photos, then 0-club photos
  tasks.sort((a, b) => b.clubKeys.length - a.clubKeys.length);

  let twoClubExact = 0;
  let twoClubSingle = 0;
  let twoClubSkippedForeign = 0;
  let oneClubExact = 0;
  let oneClubSkippedForeign = 0;
  let genericUnassigned = 0;

  const pickLeastLoaded = (candidates: TippmixEvent[]): TippmixEvent => {
    return candidates.slice().sort((a, b) => (a.assignedCount / a.targetWeight) - (b.assignedCount / b.targetWeight))[0];
  };

  const resolvePlaceMeta = (sport: string, clubKey: string) => {
    const partnerId = partnerByClubSport.get(`${sport}:${clubKey}`) || null;
    const orgs = new Set<string>([TIPPMIX_ORG_ID]);
    if (SPORT_FEDERATION_ORG[sport]) orgs.add(SPORT_FEDERATION_ORG[sport]);
    return { partnerId, organizationIds: [...orgs] };
  };

  for (const t of tasks) {
    const sportEvents = eventsBySport.get(t.sport) || [];
    if (sportEvents.length === 0) continue;

    if (t.clubKeys.length >= 2) {
      const exactBoth = sportEvents.filter((ev) => t.clubKeys.filter((ck) => ev.clubKeys.includes(ck)).length >= 2);
      if (exactBoth.length > 0) {
        const chosen = pickLeastLoaded(exactBoth);
        chosen.assignedCount++;
        t.newEventId = chosen.id;
        t.placeClubKey = chosen.clubKeys[0] || t.clubKeys[0];
        const meta = resolvePlaceMeta(t.sport, t.placeClubKey);
        t.placePartnerId = meta.partnerId;
        t.placeOrganizationIds = chosen.organizationIds;
        t.confidence = 1.0;
        t.method = 'two_club_exact_match';
        twoClubExact++;
        continue;
      }
      const oneOfTwo = sportEvents.filter((ev) => t.clubKeys.some((ck) => ev.clubKeys.includes(ck)));
      if (oneOfTwo.length > 0) {
        const chosen = pickLeastLoaded(oneOfTwo);
        chosen.assignedCount++;
        t.newEventId = chosen.id;
        t.placeClubKey = t.clubKeys.find((ck) => chosen.clubKeys.includes(ck)) || t.clubKeys[0];
        const meta = resolvePlaceMeta(t.sport, t.placeClubKey);
        t.placePartnerId = meta.partnerId;
        t.placeOrganizationIds = chosen.organizationIds;
        t.confidence = 0.85;
        t.method = 'club_match_same_sport';
        twoClubSingle++;
      } else {
        twoClubSkippedForeign++;
      }
    } else if (t.clubKeys.length === 1) {
      const ck = t.clubKeys[0];
      const matching = sportEvents.filter((ev) => ev.clubKeys.includes(ck));
      if (matching.length > 0) {
        const chosen = pickLeastLoaded(matching);
        chosen.assignedCount++;
        t.newEventId = chosen.id;
        t.placeClubKey = ck;
        const meta = resolvePlaceMeta(t.sport, ck);
        t.placePartnerId = meta.partnerId;
        t.placeOrganizationIds = chosen.organizationIds;
        t.confidence = 0.9;
        t.method = 'one_club_same_sport';
        oneClubExact++;
      } else {
        // Still record place if we know the club partner in this sport
        t.placeClubKey = ck;
        const meta = resolvePlaceMeta(t.sport, ck);
        t.placePartnerId = meta.partnerId;
        t.placeOrganizationIds = meta.organizationIds;
        oneClubSkippedForeign++;
      }
    }
  }

  // Pass 2: Chronological-Burst Same-Place Clustering (bracket + burst extension)
  // Photos taken chronologically between/around same-club anchors in the same burst belong to the SAME PLACE
  // (never fabricating an eventId when a club has multiple events!).
  const MAX_BURST_GAP_MS = 10_000;
  let bracketSamePlace = 0;
  let burstSamePlace = 0;
  let burstUniqueEvent = 0;

  for (const sport of ['Basketball', 'Football', 'Handball', 'Ice Hockey']) {
    const sportEvents = eventsBySport.get(sport) || [];
    const sportTasks = tasks
      .filter((t) => t.sport === sport && t.mtimeMs > 0)
      .sort((a, b) => a.mtimeMs - b.mtimeMs || a.fileName.localeCompare(b.fileName));

    const bursts: PhotoTask[][] = [];
    let cur: PhotoTask[] = [];
    for (let i = 0; i < sportTasks.length; i++) {
      if (i > 0 && sportTasks[i].mtimeMs - sportTasks[i - 1].mtimeMs > MAX_BURST_GAP_MS) {
        bursts.push(cur);
        cur = [];
      }
      cur.push(sportTasks[i]);
    }
    if (cur.length > 0) bursts.push(cur);

    for (let bIdx = 0; bIdx < bursts.length; bIdx++) {
      const grp = bursts[bIdx];
      const burstId = `${sport.toLowerCase().replace(/\s+/g, '_')}_b${bIdx + 1}`;
      const anchorIndices: number[] = [];
      const clubCounts: Record<string, number> = {};
      for (let i = 0; i < grp.length; i++) {
        grp[i].burstId = burstId;
        if (grp[i].clubKeys.length > 0) {
          anchorIndices.push(i);
          for (const ck of grp[i].clubKeys) {
            clubCounts[ck] = (clubCounts[ck] || 0) + 1;
          }
        }
      }
      if (anchorIndices.length === 0) continue;

      const sortedClubs = Object.entries(clubCounts).sort((a, b) => b[1] - a[1]);
      const dominantClub = sortedClubs[0][0];
      const dominantShare = sortedClubs[0][1] / anchorIndices.length;

      // Check if burst uniquely identifies a single Tippmix event (2-club match with 1 event, or 1-club with 1 event)
      let uniqueBurstEvent: TippmixEvent | null = null;
      if (sortedClubs.length >= 2) {
        const top2 = [sortedClubs[0][0], sortedClubs[1][0]];
        const twoMatch = sportEvents.filter((ev) => top2.every((ck) => ev.clubKeys.includes(ck)));
        if (twoMatch.length === 1) uniqueBurstEvent = twoMatch[0];
      }
      if (!uniqueBurstEvent && sortedClubs.length === 1) {
        const oneMatch = sportEvents.filter((ev) => ev.clubKeys.includes(dominantClub));
        if (oneMatch.length === 1) uniqueBurstEvent = oneMatch[0];
      }

      // First: bracket generic photos strictly between two anchors sharing the same club
      for (let a = 0; a < anchorIndices.length - 1; a++) {
        const i = anchorIndices[a];
        const j = anchorIndices[a + 1];
        const shared = grp[i].clubKeys.filter((ck) => grp[j].clubKeys.includes(ck));
        if (shared.length > 0 && j - i > 1) {
          const placeCk = shared[0];
          const meta = resolvePlaceMeta(sport, placeCk);
          for (let k = i + 1; k < j; k++) {
            if (grp[k].clubKeys.length === 0) {
              grp[k].placeClubKey = placeCk;
              grp[k].placePartnerId = meta.partnerId;
              grp[k].placeOrganizationIds = uniqueBurstEvent ? uniqueBurstEvent.organizationIds : meta.organizationIds;
              if (uniqueBurstEvent) {
                grp[k].newEventId = uniqueBurstEvent.id;
                uniqueBurstEvent.assignedCount++;
                grp[k].confidence = 0.9;
                grp[k].method = 'chronological_burst_unique_event';
                burstUniqueEvent++;
              } else {
                grp[k].confidence = 0.9;
                grp[k].method = 'chronological_bracket_same_place';
                bracketSamePlace++;
              }
            }
          }
        }
      }

      // Second: remaining generic photos in the same <=10s burst
      const hasClearPlurality =
        sortedClubs.length === 1 || sortedClubs[0][1] >= sortedClubs[1][1] * 1.5;

      for (let i = 0; i < grp.length; i++) {
        const t = grp[i];
        if (t.clubKeys.length > 0 || t.placeClubKey) continue;

        let chosenClub = dominantClub;
        let conf = 0.8;
        if (!hasClearPlurality) {
          // Nearest chronological anchor in this burst
          let bestDist = Infinity;
          for (const aIdx of anchorIndices) {
            const dist = Math.abs(grp[aIdx].mtimeMs - t.mtimeMs) * 1000 + Math.abs(aIdx - i);
            if (dist < bestDist) {
              bestDist = dist;
              chosenClub = grp[aIdx].clubKeys[0];
            }
          }
          conf = 0.75;
        }

        const meta = resolvePlaceMeta(sport, chosenClub);
        t.placeClubKey = chosenClub;
        t.placePartnerId = meta.partnerId;
        t.placeOrganizationIds = uniqueBurstEvent ? uniqueBurstEvent.organizationIds : meta.organizationIds;
        if (uniqueBurstEvent) {
          t.newEventId = uniqueBurstEvent.id;
          uniqueBurstEvent.assignedCount++;
          t.confidence = Math.max(conf, 0.85);
          t.method = 'chronological_burst_unique_event';
          burstUniqueEvent++;
        } else {
          t.confidence = conf;
          t.method = 'chronological_burst_same_place';
          burstSamePlace++;
        }
      }
    }
  }

  for (const t of tasks) {
    if (!t.newEventId && !t.placeClubKey) {
      t.method = 'unassigned_no_club_signal';
      genericUnassigned++;
    }
  }

  const zeroPhotoEvents = events.filter((e) => e.assignedCount === 0);
  console.log('Assignment summary:', {
    twoClubExact,
    twoClubSingle,
    twoClubSkippedForeign,
    oneClubExact,
    oneClubSkippedForeign,
    bracketSamePlace,
    burstSamePlace,
    burstUniqueEvent,
    totalPlaceTagged: tasks.filter((t) => t.placeClubKey !== null).length,
    genericUnassigned,
    zeroPhotoEventsCount: zeroPhotoEvents.length,
  });
  console.log('Top 10 events by assigned count:', events.slice().sort((a, b) => b.assignedCount - a.assignedCount).slice(0, 10).map((e) => ({ name: e.name, sport: e.sport, count: e.assignedCount })));

  if (!apply) {
    console.log('\n[DRY RUN] Run with --apply to write changes to MongoDB.');
    await client.close();
    return;
  }

  // Apply to camaraclastar
  if (duplicateCamIds.length > 0) {
    await db.collection('fanmass_camera_photo_analyses').deleteMany({ _id: { $in: duplicateCamIds } });
  }

  const drvOps = tasks.map((t) => ({
    updateOne: {
      filter: { _id: t.drvId as any },
      update: {
        $set: {
          eventId: t.newEventId,
          placeClubKey: t.placeClubKey,
          placePartnerId: t.placePartnerId,
          placeOrganizationIds: t.placeOrganizationIds,
          'assignment.confidence': t.confidence,
          'assignment.method': t.method,
          'assignment.burstId': t.burstId,
        },
      },
    },
  }));
  await db.collection('fanmass_event_drive_photos').bulkWrite(drvOps, { ordered: false });

  const camOps = tasks
    .filter((t) => camByFile.has(t.fileName))
    .map((t) => ({
      updateOne: {
        filter: { _id: camByFile.get(t.fileName)._id },
        update: {
          $set: {
            eventId: t.newEventId,
            placeClubKey: t.placeClubKey,
            placePartnerId: t.placePartnerId,
            placeOrganizationIds: t.placeOrganizationIds,
          },
        },
      },
    }));
  if (camOps.length > 0) {
    await db.collection('fanmass_camera_photo_analyses').bulkWrite(camOps, { ordered: false });
  }

  console.log(`Applied updates to camaraclastar: ${drvOps.length} drive photos, ${camOps.length} camera local_storage photos.`);
  await client.close();
}

const apply = process.argv.includes('--apply');
run(apply).then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
