import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import { getFranchiseInfo } from '../lib/brandEntityClustering';
import { rebuildFanmassPhotoEventSummary } from '../lib/fanmassPhotoAnalyses';

dotenv.config({ path: '.env.local' });

interface MatchFixture {
  id: string; // Mongo project ObjectId string or temporary slug
  isProjectDoc: boolean;
  name: string;
  cleanName: string;
  date: string;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  teams: string[];
}

interface PhotoItem {
  fileName: string;
  filePath: string;
  sport: string;
  mtime: number;
  dateStr: string;
  analyzed: boolean;
  analysisDoc?: any;
  matchedFixture?: MatchFixture;
  matchType?: 'anchor' | 'interpolated' | 'burst_expanded' | 'unallocated';
}

const SZRT_DIR = '/Users/Shared/Projects/szrt';
const SPORTS = ['Basketball', 'Football', 'Handball', 'Ice Hockey'];
const SESSION_GAP_MS = 30 * 60 * 1000; // 30 minutes

function sha256(val: string): string {
  return crypto.createHash('sha256').update(val).digest('hex');
}

interface TargetCluster {
  name: string;
  uri: string;
}

const CLUSTERS: TargetCluster[] = [
  {
    name: 'camaraclastar (PROD)',
    uri: 'mongodb+srv://moldovancsaba_db_user:wMP6z5B3ft5mmyI0@camaraclastar.koyedpi.mongodb.net/?retryWrites=true&w=majority&appName=camaraclastar',
  },
  {
    name: 'r96vlxs (SECONDARY)',
    uri: 'mongodb+srv://messmass:mirdob-5kykku-qozGym@messmass-cluster.r96vlxs.mongodb.net/?appName=messmass-cluster',
  },
];

async function main() {
  const isApply = process.argv.includes('--apply');
  console.log(`=== Bridge Local Machine Storage Photos to Messmass Events (Mode: ${isApply ? 'APPLY' : 'DRY RUN'}) ===\n`);

  for (const cluster of CLUSTERS) {
    console.log(`\n==================================================`);
    console.log(`Connecting to ${cluster.name}...`);
    const client = await MongoClient.connect(cluster.uri);
    const db = client.db('messmass');

  // 1. Load Vision Analyses
  console.log('[1] Loading vision analysis records...');
  const analyses = await db.collection('szrt_vision_analysis').find({}).toArray();
  console.log(`    Loaded ${analyses.length} vision analysis records.`);
  const analysisMap = new Map<string, any>();
  for (const a of analyses) {
    analysisMap.set(a.fileName, a);
  }

  // 2. Load existing projects and campaign fixtures
  console.log('[2] Loading existing match projects & campaign fixtures...');
  const allProjects = await db.collection('projects').find({}).toArray();
  const fixtures: MatchFixture[] = [];

  // Index existing standalone match projects
  for (const p of allProjects) {
    const eventName = p.eventName || '';
    if (!eventName || eventName.includes('Statisztika') || eventName.includes('AI Analytics') || eventName.includes('Take the Pledge')) {
      continue;
    }

    let sport = 'Football';
    const low = eventName.toLowerCase();
    if (low.includes('jégkorong') || low.includes('hoki') || low.includes('av19') || low.includes('chl')) sport = 'Ice Hockey';
    else if (low.includes('kézilabda') || low.includes('veszprém') || low.includes('szeged') || low.includes('ehf')) sport = 'Handball';
    else if (low.includes('kosárlabda') || low.includes('falco') || low.includes('sopron') || low.includes('fiba')) sport = 'Basketball';

    const clean = eventName.replace(/^[⚽🏀🏒🤾🎸\s]+/, '').replace(/#/g, ' vs ').trim();
    const teams = clean.split(/[#vsx-]/i).map(t => t.trim().toLowerCase()).filter(Boolean);

    fixtures.push({
      id: p._id.toString(),
      isProjectDoc: true,
      name: eventName,
      cleanName: clean,
      date: p.eventDate || '',
      sport,
      homeTeam: teams[0] || '',
      awayTeam: teams[1] || '',
      teams,
    });
  }

  // Also parse markdown campaign tables (e.g. Szerencsejáték Zrt.)
  for (const p of allProjects) {
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

        const clean = rawName.replace(/^[⚽🏀🏒🤾🎸\s]+/, '').replace(/#/g, ' vs ').trim();
        const teams = clean.split(/[#vsx-]/i).map(t => t.trim().toLowerCase()).filter(Boolean);

        // Check if this fixture matches an existing project doc
        const existingProject = fixtures.find(f => f.isProjectDoc && f.sport === sport && f.teams.length >= 2 && teams.length >= 2 &&
          ((f.teams[0].includes(teams[0]) || teams[0].includes(f.teams[0])) &&
           (f.teams[1].includes(teams[1]) || teams[1].includes(f.teams[1]))));

        if (!existingProject && !fixtures.some(f => f.cleanName === clean)) {
          fixtures.push({
            id: `temp_${clean}`,
            isProjectDoc: false,
            name: rawName,
            cleanName: clean,
            date,
            sport,
            homeTeam: teams[0] || '',
            awayTeam: teams[1] || '',
            teams,
          });
        }
      }
    }
  }

  console.log(`    Total target fixtures available: ${fixtures.length} (${fixtures.filter(f => f.isProjectDoc).length} standalone projects)`);

  // 3. Scan Local Storage Photos
  console.log('[3] Scanning local storage photos...');
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
        analysisDoc: analysis,
      });
    }
  }
  console.log(`    Scanned ${allPhotos.length} total local photos.`);

  // 4. Run Sequence Boundary Clustering
  console.log('[4] Running sequence boundary clustering...');
  const allocatedPhotos: PhotoItem[] = [];
  const unallocatedPhotos: PhotoItem[] = [];

  for (const sport of SPORTS) {
    const sportPhotos = allPhotos.filter((p) => p.sport === sport).sort((a, b) => a.mtime - b.mtime);
    if (sportPhotos.length === 0) continue;

    // Partition into temporal bursts
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

    // Analyze each session for anchors
    for (const session of sessions) {
      const sportFixtures = fixtures.filter((f) => f.sport === sport);
      const anchorMap = new Map<number, MatchFixture>();

      session.forEach((photo, idx) => {
        if (!photo.analyzed || !photo.analysisDoc?.clubs?.length) return;

        for (const rawClub of photo.analysisDoc.clubs) {
          const franchise = getFranchiseInfo(rawClub.toLowerCase().trim());
          const canonicalName = franchise?.name?.toLowerCase() || rawClub.toLowerCase();

          for (const fix of sportFixtures) {
            const fixTeams = fix.teams.map((t) => {
              const f = getFranchiseInfo(t);
              return f?.name?.toLowerCase() || t;
            });

            if (fixTeams.some((t) => t.includes(canonicalName) || canonicalName.includes(t))) {
              anchorMap.set(idx, fix);
              photo.matchedFixture = fix;
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
          unallocatedPhotos.push(p);
        });
        continue;
      }

      // Sequence boundary interpolation
      const anchorIndices = Array.from(anchorMap.keys()).sort((a, b) => a - b);
      const primaryFixture = anchorMap.get(anchorIndices[0])!;
      const firstAnchor = anchorIndices[0];
      const lastAnchor = anchorIndices[anchorIndices.length - 1];

      // Intermediate photos
      for (let k = firstAnchor + 1; k < lastAnchor; k++) {
        const photo = session[k];
        if (!photo.matchType) {
          photo.matchedFixture = primaryFixture;
          photo.matchType = 'interpolated';
        }
      }
      // Burst boundary expansion
      for (let k = 0; k < firstAnchor; k++) {
        const photo = session[k];
        photo.matchedFixture = primaryFixture;
        photo.matchType = 'burst_expanded';
      }
      for (let k = lastAnchor + 1; k < session.length; k++) {
        const photo = session[k];
        photo.matchedFixture = primaryFixture;
        photo.matchType = 'burst_expanded';
      }

      allocatedPhotos.push(...session);
    }
  }

  console.log(`    Successfully allocated: ${allocatedPhotos.length} photos`);
  console.log(`    Unallocated staging:   ${unallocatedPhotos.length} photos`);

  // 5. Ingest into fanmass_camera_photo_analyses
  console.log('\n[5] Bridging allocated analyzed photos to fanmass_camera_photo_analyses...');
  
  // Resolve or create project documents for fixtures that don't have a standalone project
  const fixtureToProjectId = new Map<string, ObjectId>();

  for (const fix of fixtures) {
    if (fix.isProjectDoc) {
      fixtureToProjectId.set(fix.cleanName, new ObjectId(fix.id));
    }
  }

  // For any campaign fixture needing a project doc
  for (const photo of allocatedPhotos) {
    if (!photo.matchedFixture) continue;
    const fix = photo.matchedFixture;
    if (!fixtureToProjectId.has(fix.cleanName)) {
      console.log(`    Creating standalone project document for: "${fix.cleanName}"`);
      const newProjectId = new ObjectId();
      if (isApply) {
        await db.collection('projects').insertOne({
          _id: newProjectId,
          eventName: fix.name,
          eventDate: fix.date || photo.dateStr,
          hashtags: ['tippmixreport2026', fix.sport.toLowerCase().replace(/\s+/g, '-')],
          stats: {
            allImages: 0,
            approvedImages: 0,
            remoteImages: 0,
            hostessImages: 0,
            selfies: 0,
            totalFans: 0,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      fixtureToProjectId.set(fix.cleanName, newProjectId);
    }
  }

  // Ingest analyzed photos into fanmass_camera_photo_analyses
  let ingestedCount = 0;
  const affectedEventIds = new Set<string>();
  const bulkOps: any[] = [];

  for (const photo of allocatedPhotos) {
    if (!photo.analyzed || !photo.analysisDoc || !photo.matchedFixture) continue;

    const eventIdObj = fixtureToProjectId.get(photo.matchedFixture.cleanName);
    if (!eventIdObj) continue;
    const eventId = eventIdObj.toString();
    affectedEventIds.add(eventId);

    const docId = `local_${sha256(photo.filePath)}`;
    const analysis = photo.analysisDoc;
    const peopleCount = analysis.peopleCount || 0;
    const genders = analysis.genders || {};
    const ageGroups = analysis.ageGroups || {};
    const emotions = analysis.emotions || [];
    const brands = (analysis.brands || []).map((b: string) => ({ name: b, count: 1 }));
    const clubs = (analysis.clubs || []).map((c: string) => ({ name: c, count: 1 }));

    const photoRecord = {
      _id: docId,
      eventId,
      messmassEventId: eventId,
      cameraPhotoId: `local_${photo.fileName.replace(/\.[^/.]+$/, '')}`,
      cameraEventId: `local_${eventId}`,
      cameraPartnerId: 'local_partner',
      fileName: photo.fileName,
      filePath: photo.filePath,
      source: 'local_storage',
      sourceType: 'local_storage',
      sourceRevision: 'local_v1',
      analysisGeneration: 1,
      status: 'completed',
      tombstone: false,
      receivedAt: analysis.analyzedAt || new Date(photo.mtime).toISOString(),
      analyzedAt: analysis.analyzedAt || new Date(photo.mtime).toISOString(),
      analysis: {
        analysisStage: 'deep',
        analysisDepth: 'full',
        personCount: peopleCount,
        displayPersonCount: 0,
        crowdEstimate: 0,
        sceneType: photo.sport,
        smilingCount: emotions.includes('smiling') ? peopleCount : 0,
        smilingPct: emotions.includes('smiling') ? 100 : 0,
        peopleAnalysisStatus: 'completed',
        demographics: {
          gender: {
            male: { count: genders.male || 0, pct: Math.round(((genders.male || 0) / (peopleCount || 1)) * 100) },
            female: { count: genders.female || 0, pct: Math.round(((genders.female || 0) / (peopleCount || 1)) * 100) },
            unknown: { count: 0, pct: 0 },
          },
          ageHistogram: {
            children: { count: ageGroups.children || 0, pct: 0 },
            teens: { count: ageGroups.teens || 0, pct: 0 },
            adults: { count: ageGroups.adults || 0, pct: 0 },
            seniors: { count: ageGroups.seniors || 0, pct: 0 },
          },
        },
      },
      boxes: {
        people: Array.from({ length: peopleCount }, (_, i) => ({ index: i + 1 })),
        faces: Array.from({ length: peopleCount }, (_, i) => ({ index: i + 1 })),
      },
      summary: {
        imageCounts: { total: 1, analyzed: 1 },
        peopleCounts: { measured: peopleCount, projected: peopleCount },
        genderProjection: { male: genders.male || 0, female: genders.female || 0 },
        ageProjection: ageGroups,
        brandMentions: brands,
        clubMentions: clubs,
        brandRegionCount: brands.length,
        brandRegionMentions: brands.map((b: any) => ({ name: b.name, count: 1, brandType: 'commercial' })),
        realPersonCount: peopleCount,
        moderation: {
          status: 'completed',
          flagged: false,
          severity: 'none',
          flags: [],
        },
      },
    };

    bulkOps.push({
      updateOne: {
        filter: { _id: docId },
        update: { $set: photoRecord },
        upsert: true,
      },
    });
    ingestedCount++;
  }

  if (isApply && bulkOps.length > 0) {
    console.log(`    Writing ${bulkOps.length} photo analysis records in batches...`);
    const batchSize = 500;
    for (let i = 0; i < bulkOps.length; i += batchSize) {
      const batch = bulkOps.slice(i, i + batchSize);
      await db.collection('fanmass_camera_photo_analyses').bulkWrite(batch, { ordered: false });
    }
  }

  console.log(`    Total photo analysis records staged/ingested: ${ingestedCount}`);
  console.log(`    Total affected events: ${affectedEventIds.size}`);

  if (isApply && affectedEventIds.size > 0) {
    console.log('\n[6] Rebuilding event summaries for affected events...');
    process.env.MONGODB_URI = cluster.uri;
    let rebuilt = 0;
    for (const eventId of affectedEventIds) {
      try {
        await rebuildFanmassPhotoEventSummary(eventId, { allowMissingProject: true });
        rebuilt++;
      } catch (err) {
        console.warn(`    Failed to rebuild summary for ${eventId}:`, err);
      }
    }
    console.log(`    Successfully rebuilt summaries for ${rebuilt} events.`);
  }

    console.log(`\nBridge process completed successfully for ${cluster.name}!`);
    await client.close();
  }

  console.log('\nBridge process completed successfully across all clusters!');
}

main().catch(console.error);
