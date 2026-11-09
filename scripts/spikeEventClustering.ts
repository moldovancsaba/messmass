import fs from 'fs';
import path from 'path';
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
  clubs: string[];
  venues: string[];
  brands: string[];
  peopleCount: number;
  matchedEventId?: string;
  matchedEventName?: string;
  matchType?: 'anchor' | 'interpolated' | 'burst_expanded' | 'unallocated';
}

interface MatchFixture {
  id: string;
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

async function runClusteringSpike() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is required');
  const client = await MongoClient.connect(uri);
  const db = client.db('messmass');

  console.log('=== Step 1: Loading Analyzed Photos from MongoDB Atlas ===');
  const analyses = await db.collection('szrt_vision_analysis').find({}).toArray();
  console.log(`Loaded ${analyses.length} vision analysis records.`);

  const analysisMap = new Map<string, any>();
  for (const a of analyses) {
    analysisMap.set(a.fileName, a);
  }

  console.log('=== Step 2: Loading Target Match Fixtures from Projects ===');
  const projects = await db.collection('projects').find({
    $or: [{ hashtags: 'tippmixreport2026' }, { eventName: /tippmix/i }, { eventName: /#/ }],
  }).toArray();

  const fixtures: MatchFixture[] = [];

  // Parse markdown tables from campaign projects
  for (const p of projects) {
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

        const teams = rawName.split(/[#vsx-]/i).map(t => t.trim().toLowerCase()).filter(Boolean);
        fixtures.push({
          id: `${rawName}__${date}`,
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

    // Also include standard projects
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

  console.log(`Loaded ${fixtures.length} distinct target fixtures across all 4 sports.`);

  console.log('=== Step 3: Scanning Disk Files and Extracting Chronological Metadata ===');
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
        clubs: analysis?.clubs || [],
        venues: analysis?.venues || [],
        brands: analysis?.brands || [],
        peopleCount: analysis?.peopleCount || 0,
      });
    }
  }

  console.log(`Indexed ${allPhotos.length} total local storage photos.`);

  console.log('=== Step 4: Executing Sequence Boundary Clustering Engine ===');
  const resultsBySport: Record<string, {
    totalPhotos: number;
    analyzedPhotos: number;
    sessionsCount: number;
    allocatedPhotos: number;
    anchorPhotos: number;
    interpolatedPhotos: number;
    burstExpandedPhotos: number;
    unallocatedPhotos: number;
    eventBreakdown: Record<string, number>;
  }> = {};

  for (const sport of SPORTS) {
    const sportPhotos = allPhotos.filter((p) => p.sport === sport).sort((a, b) => a.mtime - b.mtime);
    if (sportPhotos.length === 0) continue;

    // 4.1 Partition into Sessions / Bursts
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

    let anchorCount = 0;
    let interpolatedCount = 0;
    let burstExpandedCount = 0;
    let unallocatedCount = 0;
    const eventCounts: Record<string, number> = {};

    // 4.2 For each session, find anchors & interpolate
    for (const session of sessions) {
      const sportFixtures = fixtures.filter((f) => f.sport === sport);

      // Find anchor index mapping: Map<photoIndex, fixture>
      const anchorMap = new Map<number, MatchFixture>();

      session.forEach((photo, idx) => {
        if (!photo.analyzed || photo.clubs.length === 0) return;

        for (const rawClub of photo.clubs) {
          const franchise = getFranchiseInfo(rawClub.toLowerCase().trim());
          const canonicalName = franchise?.name?.toLowerCase() || rawClub.toLowerCase();

          // Match against fixtures
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
              anchorCount++;
              break;
            }
          }
          if (anchorMap.has(idx)) break;
        }
      });

      if (anchorMap.size === 0) {
        // No anchors detected in session; marks as unallocated pool
        session.forEach((p) => {
          p.matchType = 'unallocated';
          unallocatedCount++;
        });
        continue;
      }

      // 4.3 Sequence Boundary Interpolation
      const anchorIndices = Array.from(anchorMap.keys()).sort((a, b) => a - b);
      const primaryFixture = anchorMap.get(anchorIndices[0])!;

      const firstAnchor = anchorIndices[0];
      const lastAnchor = anchorIndices[anchorIndices.length - 1];

      // Interpolate all intermediate photos between first and last anchor
      for (let k = firstAnchor + 1; k < lastAnchor; k++) {
        const photo = session[k];
        if (!photo.matchType) {
          photo.matchedEventId = primaryFixture.id;
          photo.matchedEventName = primaryFixture.cleanName;
          photo.matchType = 'interpolated';
          interpolatedCount++;
        }
      }

      // Expand to burst start & end
      for (let k = 0; k < firstAnchor; k++) {
        const photo = session[k];
        photo.matchedEventId = primaryFixture.id;
        photo.matchedEventName = primaryFixture.cleanName;
        photo.matchType = 'burst_expanded';
        burstExpandedCount++;
      }
      for (let k = lastAnchor + 1; k < session.length; k++) {
        const photo = session[k];
        photo.matchedEventId = primaryFixture.id;
        photo.matchedEventName = primaryFixture.cleanName;
        photo.matchType = 'burst_expanded';
        burstExpandedCount++;
      }

      const assignedCount = session.length;
      eventCounts[primaryFixture.cleanName] = (eventCounts[primaryFixture.cleanName] || 0) + assignedCount;
    }

    resultsBySport[sport] = {
      totalPhotos: sportPhotos.length,
      analyzedPhotos: sportPhotos.filter((p) => p.analyzed).length,
      sessionsCount: sessions.length,
      allocatedPhotos: anchorCount + interpolatedCount + burstExpandedCount,
      anchorPhotos: anchorCount,
      interpolatedPhotos: interpolatedCount,
      burstExpandedPhotos: burstExpandedCount,
      unallocatedPhotos: unallocatedCount,
      eventBreakdown: eventCounts,
    };
  }

  console.log('\n======================================================');
  console.log('🎯 SPIKE RESULTS: SEQUENCE BOUNDARY CLUSTERING SUMMARY');
  console.log('======================================================\n');

  let totalAllocated = 0;
  let totalAnchors = 0;
  let totalInterpolated = 0;
  let totalExpanded = 0;
  let totalUnallocated = 0;

  for (const [sport, res] of Object.entries(resultsBySport)) {
    console.log(`🏅 SPORT: ${sport.toUpperCase()}`);
    console.log(`  - Total Photos:          ${res.totalPhotos.toLocaleString()}`);
    console.log(`  - Analyzed by VLM:       ${res.analyzedPhotos.toLocaleString()}`);
    console.log(`  - Temporal Sessions:     ${res.sessionsCount}`);
    console.log(`  - Allocated to Events:   ${res.allocatedPhotos.toLocaleString()} (${Math.round((res.allocatedPhotos / res.totalPhotos) * 100)}%)`);
    console.log(`    ├─ Confirmed Anchors:  ${res.anchorPhotos.toLocaleString()}`);
    console.log(`    ├─ Interpolated:       ${res.interpolatedPhotos.toLocaleString()}`);
    console.log(`    └─ Burst-Expanded:     ${res.burstExpandedPhotos.toLocaleString()}`);
    console.log(`  - Unallocated Staging:   ${res.unallocatedPhotos.toLocaleString()}`);
    console.log(`  - Top Allocated Events:`);
    Object.entries(res.eventBreakdown)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([evt, cnt]) => {
        console.log(`     • ${evt}: ${cnt.toLocaleString()} photos`);
      });
    console.log('');

    totalAllocated += res.allocatedPhotos;
    totalAnchors += res.anchorPhotos;
    totalInterpolated += res.interpolatedPhotos;
    totalExpanded += res.burstExpandedPhotos;
    totalUnallocated += res.unallocatedPhotos;
  }

  console.log('======================================================');
  console.log(`GLOBAL TOTALS (${allPhotos.length} Photos):`);
  console.log(`  ✅ Successfully Allocated: ${totalAllocated.toLocaleString()} (${Math.round((totalAllocated / allPhotos.length) * 100)}%)`);
  console.log(`     ├─ Direct Anchors:      ${totalAnchors.toLocaleString()}`);
  console.log(`     ├─ Sequence Inferred:   ${totalInterpolated.toLocaleString()}`);
  console.log(`     └─ Burst Boundary:      ${totalExpanded.toLocaleString()}`);
  console.log(`  ⏳ Unallocated Staging:    ${totalUnallocated.toLocaleString()}`);
  console.log('======================================================\n');

  await client.close();
}

runClusteringSpike().catch((err) => {
  console.error('Spike failed:', err);
  process.exit(1);
});
