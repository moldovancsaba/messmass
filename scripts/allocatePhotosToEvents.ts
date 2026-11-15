import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import { getFranchiseInfo } from '../lib/brandEntityClustering';

dotenv.config({ path: '.env.local' });

interface PhotoItem {
  fileName: string;
  filePath: string;
  sport: string;
  mtime: number;
  dateStr: string;
  analyzed: boolean;
  analyzedAt?: string;
  clubs: string[];
  venues: string[];
  brands: string[];
  peopleCount: number;
  genders?: Record<string, number>;
  ageGroups?: Record<string, number>;
  matchedEventId?: string;
  matchedEventName?: string;
  matchType?: 'anchor' | 'interpolated' | 'burst_expanded' | 'unallocated';
}

interface MatchFixture {
  id: string;
  mongoId?: ObjectId;
  name: string;
  cleanName: string;
  date: string;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  teams: string[];
}

const SZRT_DIR = '/Users/Shared/Projects/szrt';
const SPORTS = ['Basketball', 'Football', 'Handball', 'Ice Hockey'];
const SESSION_GAP_MS = 30 * 60 * 1000; // 30 minutes

export async function allocatePhotosToEvents(dryRun: boolean = false) {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is required');
  const client = await MongoClient.connect(uri);
  const db = client.db('messmass');

  console.log(`[Allocating Photos] Mode: ${dryRun ? 'DRY-RUN (No Writes)' : 'PRODUCTION (Writing to MongoDB)'}`);

  // 1. Load Analyses
  const analyses = await db.collection('szrt_vision_analysis').find({}).toArray();
  const analysisMap = new Map<string, any>();
  for (const a of analyses) {
    analysisMap.set(a.fileName, a);
  }
  console.log(`Loaded ${analyses.length} vision analysis records from szrt_vision_analysis.`);

  // 2. Load Target Fixtures
  const projects = await db.collection('projects').find({
    $or: [{ hashtags: 'tippmixreport2026' }, { eventName: /tippmix/i }, { eventName: /#/ }],
  }).toArray();

  const fixtures: MatchFixture[] = [];
  const projectMapByName = new Map<string, any>();

  for (const p of projects) {
    if (p.eventName) {
      projectMapByName.set(p.eventName.toLowerCase().trim(), p);
    }

    const rawTable = p.stats?.szerencsejatekTop10;
    if (typeof rawTable === 'string' && rawTable.includes('|')) {
      const lines = rawTable.trim().split('\n');
      for (let i = 2; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line.includes('|') || line.includes('---')) continue;
        const cols = line.split('|').map((c: string) => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
        if (cols.length < 3) continue;
        const rawName = cols[0];
        const date = cols[1] || '';
        if (!rawName || rawName === '0') continue;

        let sport = 'Football';
        const low = rawName.toLowerCase();
        if (low.includes('jégkorong') || low.includes('hoki') || low.includes('av19')) sport = 'Ice Hockey';
        else if (low.includes('kézilabda') || low.includes('veszprém') || low.includes('szeged')) sport = 'Handball';
        else if (low.includes('kosárlabda') || low.includes('falco') || low.includes('sopron')) sport = 'Basketball';

        const teams = rawName.split(/[#vsx-]/i).map((t) => t.trim().toLowerCase()).filter(Boolean);
        fixtures.push({
          id: String(p._id),
          mongoId: p._id,
          name: rawName,
          cleanName: rawName.replace(/^[⚽🏀🏒🤾🎸\s]+/, '').replace(/#/g, ' vs ').trim(),
          date,
          sport,
          homeTeam: teams[0] || '',
          awayTeam: teams[1] || '',
          teams,
        });
      }
    }

    const eventName = p.eventName || '';
    if (eventName && !eventName.includes('Statisztika') && !eventName.includes('AI Analytics')) {
      let sport = 'Football';
      const low = eventName.toLowerCase();
      if (low.includes('jégkorong') || low.includes('hoki') || low.includes('av19')) sport = 'Ice Hockey';
      else if (low.includes('kézilabda') || low.includes('veszprém') || low.includes('szeged')) sport = 'Handball';
      else if (low.includes('kosárlabda') || low.includes('falco') || low.includes('sopron')) sport = 'Basketball';

      const teams = eventName.split(/[#vsx-]/i).map((t: string) => t.trim().toLowerCase()).filter(Boolean);
      fixtures.push({
        id: String(p._id),
        mongoId: p._id,
        name: eventName,
        cleanName: eventName.replace(/^[⚽🏀🏒🤾🎸\s]+/, '').replace(/#/g, ' vs ').trim(),
        date: p.eventDate || '',
        sport,
        homeTeam: teams[0] || '',
        awayTeam: teams[1] || '',
        teams,
      });
    }
  }

  // 3. Scan disk photos
  const allPhotos: PhotoItem[] = [];
  for (const sport of SPORTS) {
    const sportDir = path.join(SZRT_DIR, sport);
    if (!fs.existsSync(sportDir)) continue;
    const files = fs.readdirSync(sportDir).filter((f) => f.endsWith('.jpg'));

    for (const f of files) {
      const fullPath = path.join(sportDir, f);
      const stat = fs.statSync(fullPath);
      const mtime = stat.mtimeMs;
      const dateStr = new Date(mtime).toISOString().split('T')[0];
      const analysis = analysisMap.get(f);

      allPhotos.push({
        fileName: f,
        filePath: `${sport}/${f}`,
        sport,
        mtime,
        dateStr,
        analyzed: !!analysis,
        analyzedAt: analysis?.analyzedAt,
        clubs: analysis?.clubs || [],
        venues: analysis?.venues || [],
        brands: analysis?.brands || [],
        peopleCount: analysis?.peopleCount || 0,
        genders: analysis?.genders,
        ageGroups: analysis?.ageGroups,
      });
    }
  }

  // 4. Cluster & Allocate
  const allocatedItems: PhotoItem[] = [];

  for (const sport of SPORTS) {
    const sportPhotos = allPhotos.filter((p) => p.sport === sport).sort((a, b) => a.mtime - b.mtime);
    if (sportPhotos.length === 0) continue;

    const sessions: PhotoItem[][] = [];
    let currentSession: PhotoItem[] = [sportPhotos[0]];

    for (let i = 1; i < sportPhotos.length; i++) {
      const prev = sportPhotos[i - 1];
      const cur = sportPhotos[i];
      const dt = cur.mtime - prev.mtime;

      if (dt > SESSION_GAP_MS || cur.dateStr !== prev.dateStr) {
        sessions.push(currentSession);
        currentSession = [cur];
      } else {
        currentSession.push(cur);
      }
    }
    if (currentSession.length > 0) sessions.push(currentSession);

    for (const session of sessions) {
      const sportFixtures = fixtures.filter((f) => f.sport === sport);
      const anchorMap = new Map<number, MatchFixture>();

      session.forEach((photo, idx) => {
        if (!photo.analyzed || photo.clubs.length === 0) return;

        for (const rawClub of photo.clubs) {
          const franchise = getFranchiseInfo(rawClub.toLowerCase().trim());
          const canonicalName = franchise?.name?.toLowerCase() || rawClub.toLowerCase();

          for (const fix of sportFixtures) {
            const fixTeams = fix.teams.map((t) => {
              const f = getFranchiseInfo(t);
              return f?.name?.toLowerCase() || t;
            });

            if (fixTeams.some((t) => t.includes(canonicalName) || canonicalName.includes(t))) {
              anchorMap.set(idx, fix);
              photo.matchedEventId = fix.id;
              photo.matchedEventName = fix.cleanName;
              photo.matchType = 'anchor';
              break;
            }
          }
          if (anchorMap.has(idx)) break;
        }
      });

      if (anchorMap.size === 0) {
        session.forEach((p) => {
          p.matchType = 'unallocated';
        });
        continue;
      }

      const anchorIndices = Array.from(anchorMap.keys()).sort((a, b) => a - b);
      const primaryFixture = anchorMap.get(anchorIndices[0])!;
      const firstAnchor = anchorIndices[0];
      const lastAnchor = anchorIndices[anchorIndices.length - 1];

      for (let k = firstAnchor + 1; k < lastAnchor; k++) {
        const photo = session[k];
        if (!photo.matchType) {
          photo.matchedEventId = primaryFixture.id;
          photo.matchedEventName = primaryFixture.cleanName;
          photo.matchType = 'interpolated';
        }
      }

      for (let k = 0; k < firstAnchor; k++) {
        const photo = session[k];
        photo.matchedEventId = primaryFixture.id;
        photo.matchedEventName = primaryFixture.cleanName;
        photo.matchType = 'burst_expanded';
      }
      for (let k = lastAnchor + 1; k < session.length; k++) {
        const photo = session[k];
        photo.matchedEventId = primaryFixture.id;
        photo.matchedEventName = primaryFixture.cleanName;
        photo.matchType = 'burst_expanded';
      }

      session.forEach((p) => {
        if (p.matchedEventId) allocatedItems.push(p);
      });
    }
  }

  console.log(`Total allocated photos identified: ${allocatedItems.length}`);

  // 5. Database Writes
  if (!dryRun) {
    console.log('Writing allocated photos into fanmass_camera_photo_analyses and updating szrt_vision_analysis...');

    const analysesOperations: any[] = [];
    const visionUpdateOperations: any[] = [];

    for (const item of allocatedItems) {
      if (!item.matchedEventId) continue;

      const docId = crypto.createHash('sha256').update(`${item.fileName}_${item.sport}`).digest('hex');
      const eventObjectId = ObjectId.isValid(item.matchedEventId) ? new ObjectId(item.matchedEventId) : item.matchedEventId;

      const cameraAnalysisDoc = {
        _id: docId,
        eventId: eventObjectId,
        cameraPhotoId: item.fileName.replace(/\.jpg$/i, ''),
        contractVersion: 'fanmass.messmass.photo-analysis.v1',
        sourceType: 'local_storage_pipeline',
        source: 'local_storage',
        fileName: item.fileName,
        sport: item.sport,
        matchType: item.matchType,
        status: 'completed',
        tombstone: false,
        receivedAt: new Date(item.mtime).toISOString(),
        analyzedAt: item.analyzedAt || new Date(item.mtime).toISOString(),
        summary: {
          imageCounts: { total: 1, analyzed: 1 },
          peopleCounts: {
            measured: item.peopleCount || 1,
            projected: item.peopleCount || 1,
          },
          brandMentions: item.brands.map((b) => ({ brand: b, name: b, count: 1 })),
          clubMentions: item.clubs.map((c) => ({ club: c, name: c, count: 1 })),
          merchandiseCounts: {
            jersey: item.clubs.length > 0 ? 1 : 0,
          },
          moderation: {
            status: 'completed',
            flagged: false,
            severity: 'none',
          },
        },
        boxes: {
          people: Array.from({ length: item.peopleCount || 1 }).map((_, i) => ({
            id: `box_person_${i + 1}`,
            gender: item.genders?.male ? 'male' : 'unknown',
          })),
          faces: Array.from({ length: item.peopleCount || 1 }).map((_, i) => ({
            id: `box_face_${i + 1}`,
            smiling: true,
          })),
        },
      };

      analysesOperations.push({
        replaceOne: {
          filter: { _id: docId },
          replacement: cameraAnalysisDoc,
          upsert: true,
        },
      });

      visionUpdateOperations.push({
        updateOne: {
          filter: { fileName: item.fileName },
          update: {
            $set: {
              eventId: eventObjectId,
              eventName: item.matchedEventName,
              matchType: item.matchType,
              allocatedAt: new Date().toISOString(),
            },
          },
        },
      });
    }

    if (analysesOperations.length > 0) {
      console.log(`Executing ${analysesOperations.length} bulk operations into fanmass_camera_photo_analyses...`);
      // Chunk into batches of 1,000 for network safety
      for (let i = 0; i < analysesOperations.length; i += 1000) {
        const chunk = analysesOperations.slice(i, i + 1000);
        await db.collection('fanmass_camera_photo_analyses').bulkWrite(chunk, { ordered: false });
        console.log(`  ✓ Inserted/Updated batch ${i + 1} - ${Math.min(i + 1000, analysesOperations.length)}`);
      }
    }

    if (visionUpdateOperations.length > 0) {
      console.log(`Updating ${visionUpdateOperations.length} records in szrt_vision_analysis...`);
      for (let i = 0; i < visionUpdateOperations.length; i += 1000) {
        const chunk = visionUpdateOperations.slice(i, i + 1000);
        await db.collection('szrt_vision_analysis').bulkWrite(chunk, { ordered: false });
        console.log(`  ✓ Tagged szrt_vision_analysis batch ${i + 1} - ${Math.min(i + 1000, visionUpdateOperations.length)}`);
      }
    }

    console.log('✅ All allocated photos successfully projected into fanmass_camera_photo_analyses and tagged.');
  }

  await client.close();
}

if (require.main === module) {
  const isDryRun = process.argv.includes('--dry-run');
  allocatePhotosToEvents(isDryRun).catch((err) => {
    console.error('Allocation script failed:', err);
    process.exit(1);
  });
}
