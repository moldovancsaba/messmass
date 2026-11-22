// scripts/reorganize-szrt-photos.ts
// WHAT: Reorganizes SZRT/Tippmix AI-analyzed photos across the 177 real Tippmix match events
//       with strict sport fencing, exact 2-club / 1-club matching, zero synthetic-rollup pollution,
//       and deduplication across fanmass_camera_photo_analyses (local_storage) and fanmass_event_drive_photos.

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
  isNationalTeam: boolean;
  targetWeight: number;
  assignedCount: number;
}

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
  }, { projection: { _id: 1, eventName: 1, eventDate: 1, categorizedHashtags: 1, 'stats.allImages': 1 } }).toArray();

  const events: TippmixEvent[] = rawProjects
    .filter((p) => !/statisztika|ai analytics/i.test(p.eventName || ''))
    .map((p) => {
      const name = String(p.eventName || '');
      const sport = detectSport(`${name} ${(p.categorizedHashtags?.sport || []).join(' ')}`);
      const clubKeys = extractClubKeys(name);
      const isNationalTeam = clubKeys.includes('hungary') || /magyar|hungary|fiba|válogatott/i.test(name);
      const storedImgs = Number(p.stats?.allImages || 0);
      const targetWeight = isNationalTeam ? 10 : storedImgs >= 150 ? 3 : 1;
      return {
        id: String(p._id),
        name,
        date: String(p.eventDate || ''),
        sport,
        clubKeys,
        isNationalTeam,
        targetWeight,
        assignedCount: 0,
      };
    });

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
    clubKeys: string[];
    newEventId: string | null;
    confidence: number;
    method: string;
  }

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
    return { drvId, fileName, sport, clubKeys, newEventId: null, confidence: 0, method: 'unassigned' };
  });

  // Sort: 2-club photos first, then 1-club photos, then 0-club photos
  tasks.sort((a, b) => b.clubKeys.length - a.clubKeys.length);

  let twoClubExact = 0;
  let twoClubSingle = 0;
  let twoClubSkippedForeign = 0;
  let oneClubExact = 0;
  let oneClubSkippedForeign = 0;
  let genericDistributed = 0;

  const pickLeastLoaded = (candidates: TippmixEvent[]): TippmixEvent => {
    return candidates.slice().sort((a, b) => (a.assignedCount / a.targetWeight) - (b.assignedCount / b.targetWeight))[0];
  };

  for (const t of tasks) {
    const sportEvents = eventsBySport.get(t.sport) || [];
    if (sportEvents.length === 0) continue;

    if (t.clubKeys.length >= 2) {
      // Look for an event in THIS sport that has at least 2 matching clubs
      const exactBoth = sportEvents.filter((ev) => t.clubKeys.filter((ck) => ev.clubKeys.includes(ck)).length >= 2);
      if (exactBoth.length > 0) {
        const chosen = pickLeastLoaded(exactBoth);
        chosen.assignedCount++;
        t.newEventId = chosen.id;
        t.confidence = 1.0;
        t.method = 'two_club_exact_match';
        twoClubExact++;
        continue;
      }
      // Else only match an event in THIS sport that contains at least one of the 2 clubs (NEVER a 3rd club!)
      const oneOfTwo = sportEvents.filter((ev) => t.clubKeys.some((ck) => ev.clubKeys.includes(ck)));
      if (oneOfTwo.length > 0) {
        const chosen = pickLeastLoaded(oneOfTwo);
        chosen.assignedCount++;
        t.newEventId = chosen.id;
        t.confidence = 0.85;
        t.method = 'club_match_same_sport';
        twoClubSingle++;
      } else {
        // Foreign / unmatched clubs (e.g. Barcelona vs Real Madrid jersey) -> keep unassigned rather than polluting a 3rd club
        twoClubSkippedForeign++;
      }
    } else if (t.clubKeys.length === 1) {
      const ck = t.clubKeys[0];
      const matching = sportEvents.filter((ev) => ev.clubKeys.includes(ck));
      if (matching.length > 0) {
        const chosen = pickLeastLoaded(matching);
        chosen.assignedCount++;
        t.newEventId = chosen.id;
        t.confidence = 0.9;
        t.method = 'one_club_same_sport';
        oneClubExact++;
      } else {
        oneClubSkippedForeign++;
      }
    } else {
      // 0 clubs identified -> NEVER fabricate per-match counts by round-robinning.
      // Leave eventId: null (campaign/sport-level library photo only).
      t.newEventId = null;
      t.confidence = 0;
      t.method = 'unassigned_no_club_signal';
      genericDistributed++;
    }
  }

  const zeroPhotoEvents = events.filter((e) => e.assignedCount === 0);
  console.log('Assignment summary:', {
    twoClubExact,
    twoClubSingle,
    twoClubSkippedForeign,
    oneClubExact,
    oneClubSkippedForeign,
    genericDistributed,
    zeroPhotoEventsCount: zeroPhotoEvents.length,
    zeroPhotoEvents: zeroPhotoEvents.map((e) => `${e.sport}: ${e.name}`),
  });
  console.log('Top 10 events by assigned count:', events.slice().sort((a, b) => b.assignedCount - a.assignedCount).slice(0, 10).map((e) => ({ name: e.name, sport: e.sport, count: e.assignedCount })));
  console.log('Bottom 5 events by assigned count:', events.slice().sort((a, b) => a.assignedCount - b.assignedCount).slice(0, 5).map((e) => ({ name: e.name, sport: e.sport, count: e.assignedCount })));

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
          'assignment.confidence': t.confidence,
          'assignment.method': t.method,
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
