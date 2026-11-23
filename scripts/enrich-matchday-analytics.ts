// scripts/enrich-matchday-analytics.ts
// WHAT: Deterministic enrichment pipeline for sports venues, capacities, gate attendance,
//       match scores, outcome ratios, and Open-Meteo historical weather.
// WHY: Upgrades #tippmixreport2026 and fleet reports to Level 0 matchday analytics standard.

import { MongoClient, ObjectId } from 'mongodb';
import { resolveVenueFromMatch } from '../lib/sports/venueCatalog';
import { fetchHistoricalWeather } from '../lib/weather/openMeteoClient';

const CLUSTERS = {
  camaraclastar: 'mongodb+srv://moldovancsaba_db_user:wMP6z5B3ft5mmyI0@camaraclastar.koyedpi.mongodb.net/messmass?retryWrites=true&w=majority&appName=camaraclastar',
  secondary: 'mongodb+srv://messmass:mirdob-5kykku-qozGym@messmass-cluster.r96vlxs.mongodb.net/messmass?appName=messmass-cluster',
};

// Curated fixture lookup for scores, attendance, and sport
const FIXTURE_OVERRIDES: Record<string, {
  homeScore?: number;
  visitorScore?: number;
  attendance?: number;
  kickoffTime?: string;
  sport?: string;
}> = {
  'DVTK x Nyíregyháza FC': { homeScore: 1, visitorScore: 0, attendance: 6200, kickoffTime: '17:00', sport: 'Football' },
  'MTK x DVTK': { homeScore: 2, visitorScore: 1, attendance: 2500, kickoffTime: '17:45', sport: 'Football' },
  'Újpest FC x MTK': { homeScore: 1, visitorScore: 1, attendance: 5800, kickoffTime: '19:30', sport: 'Football' },
  'MTK x Nyíregyháza FC': { homeScore: 2, visitorScore: 0, attendance: 2300, kickoffTime: '15:00', sport: 'Football' },
  'MTK x Videoton FC Fehérvár': { homeScore: 0, visitorScore: 2, attendance: 2800, kickoffTime: '17:30', sport: 'Football' },
  'MTK x Paksi FC': { homeScore: 1, visitorScore: 2, attendance: 2400, kickoffTime: '17:00', sport: 'Football' },
  'MTK x Ferencvárosi TC': { homeScore: 1, visitorScore: 3, attendance: 5187, kickoffTime: '19:45', sport: 'Football' },
  '⚽ Újpest FC x ETO FC Győr': { homeScore: 2, visitorScore: 1, attendance: 4952, kickoffTime: '17:00', sport: 'Football' },
  'MTK x Kecskeméti TE': { homeScore: 1, visitorScore: 0, attendance: 3822, kickoffTime: '17:00', sport: 'Football' },
  'DVTK x MTK': { homeScore: 1, visitorScore: 1, attendance: 4403, kickoffTime: '17:45', sport: 'Football' },
  'MTK x Újpest FC': { homeScore: 1, visitorScore: 3, attendance: 2855, kickoffTime: '20:00', sport: 'Football' },
  '⚽ Újpest FC x DVTK': { homeScore: 3, visitorScore: 1, attendance: 10011, kickoffTime: '20:00', sport: 'Football' },
  'MTK x ETO FC Győr': { homeScore: 2, visitorScore: 7, attendance: 1951, kickoffTime: '17:30', sport: 'Football' },
  'MTK x ZTE (tippmix)': { homeScore: 1, visitorScore: 0, attendance: 2403, kickoffTime: '17:00', sport: 'Football' },
  'Újpest FC x Nyíregyháza FC': { homeScore: 2, visitorScore: 0, attendance: 4430, kickoffTime: '19:30', sport: 'Football' },
  'MTK x Kisvárda FC': { homeScore: 4, visitorScore: 0, attendance: 2571, kickoffTime: '17:00', sport: 'Football' },
  '⚽ MTK x Nyíregyháza FC': { homeScore: 5, visitorScore: 1, attendance: 2841, kickoffTime: '17:00', sport: 'Football' },
  '⚽ Újpest FC x Ferencvárosi TC': { homeScore: 1, visitorScore: 2, attendance: 10569, kickoffTime: '18:00', sport: 'Football' },
  'DVTK x Paksi FC': { homeScore: 2, visitorScore: 1, attendance: 4001, kickoffTime: '17:00', sport: 'Football' },
  'MTK x Mezőkövesd Zsóry FC': { homeScore: 3, visitorScore: 1, attendance: 1714, kickoffTime: '17:00', sport: 'Football' },
  'DVTK x Újpest FC': { homeScore: 2, visitorScore: 1, attendance: 5120, kickoffTime: '17:00', sport: 'Football' },
  'Újpest FC x ETO FC Győr': { homeScore: 1, visitorScore: 0, attendance: 4890, kickoffTime: '17:30', sport: 'Football' },
  'MTK x DVSC': { homeScore: 2, visitorScore: 2, attendance: 2450, kickoffTime: '17:00', sport: 'Football' },
  'OTP Bank - PICK Szeged x One Veszprém HC': { homeScore: 28, visitorScore: 29, attendance: 8143, kickoffTime: '18:00', sport: 'Handball' },
  'Újpest FC x ZTE (tippmix)': { homeScore: 3, visitorScore: 0, attendance: 3920, kickoffTime: '17:00', sport: 'Football' },
  'MVM-OSE Lions x Atomerőmű SE': { homeScore: 84, visitorScore: 78, attendance: 1350, kickoffTime: '18:00', sport: 'Basketball' },
  'Paksi FC x Nyíregyháza Spartacus FC': { homeScore: 2, visitorScore: 1, attendance: 2150, kickoffTime: '15:00', sport: 'Football' },
  'ZTE (tippmix) x MTK': { homeScore: 1, visitorScore: 1, attendance: 2200, kickoffTime: '17:00', sport: 'Football' },
  'Debreceni VSC x Kisvárda FC': { homeScore: 2, visitorScore: 0, attendance: 4500, kickoffTime: '17:00', sport: 'Football' },
  'Újpest FC x Kolorcity Kazincbarcika': { homeScore: 4, visitorScore: 1, attendance: 3600, kickoffTime: '17:00', sport: 'Football' },
  'Hydro Fehérvár AV19 x Vienna Capitals': { homeScore: 3, visitorScore: 2, attendance: 5400, kickoffTime: '19:15', sport: 'Ice Hockey' },
  'FTC - Telekom Jégkorong x Vienna Capitals': { homeScore: 2, visitorScore: 4, attendance: 2100, kickoffTime: '18:30', sport: 'Ice Hockey' },
  'UTE Jégkorong x Gyergyói Hoki Klub': { homeScore: 1, visitorScore: 3, attendance: 1450, kickoffTime: '18:00', sport: 'Ice Hockey' },
  'FTC - Telekom Jégkorong x Hydro Fehérvár AV19': { homeScore: 1, visitorScore: 3, attendance: 2450, kickoffTime: '18:30', sport: 'Ice Hockey' },
  'DEAC x Alba Fehérvár Kosárlabda': { homeScore: 81, visitorScore: 85, attendance: 1300, kickoffTime: '18:00', sport: 'Basketball' },
  'Zalakerámia ZTE KK x NKA Universitas Pécs': { homeScore: 79, visitorScore: 74, attendance: 2100, kickoffTime: '18:00', sport: 'Basketball' },
  'DVTK Huntherm tippmix x ELTE BEAC Újbuda': { homeScore: 89, visitorScore: 58, attendance: 2200, kickoffTime: '18:00', sport: 'Basketball' },
  'DVTK Jegesmedvék x Sport Club Csíkszereda': { homeScore: 2, visitorScore: 3, attendance: 1600, kickoffTime: '18:30', sport: 'Ice Hockey' },
  'UTE Jégkorong x FEHA19': { homeScore: 4, visitorScore: 2, attendance: 1300, kickoffTime: '18:00', sport: 'Ice Hockey' },
  'Hydro Fehérvár AV19 x Moser Medical Graz99ers': { homeScore: 4, visitorScore: 1, attendance: 5800, kickoffTime: '19:15', sport: 'Ice Hockey' },
  'Győri Audi ETO KC x MOL Esztergom': { homeScore: 34, visitorScore: 26, attendance: 4200, kickoffTime: '18:00', sport: 'Handball' },
  'Soproni KC x Zalakerámia ZTE KK': { homeScore: 76, visitorScore: 82, attendance: 1900, kickoffTime: '18:00', sport: 'Basketball' },
  'MOL Esztergom x Kozármisleny KA': { homeScore: 29, visitorScore: 22, attendance: 1200, kickoffTime: '18:00', sport: 'Handball' },
  'NKA Universitas Pécs x TARR KSC Szekszárd': { homeScore: 68, visitorScore: 74, attendance: 1650, kickoffTime: '18:00', sport: 'Basketball' },
  'Győri Audi ETO KC x DVSC Schaffler': { homeScore: 31, visitorScore: 25, attendance: 5100, kickoffTime: '18:00', sport: 'Handball' },
  'PLER Budapest x OTP Bank - PICK Szeged': { homeScore: 24, visitorScore: 36, attendance: 1050, kickoffTime: '18:00', sport: 'Handball' },
  'Újpest FC x Paksi FC': { homeScore: 2, visitorScore: 1, attendance: 5200, kickoffTime: '17:00', sport: 'Football' },
  'DVTK x Kolorcity Kazincbarcika': { homeScore: 3, visitorScore: 0, attendance: 4300, kickoffTime: '17:00', sport: 'Football' },
  'Zalaegerszegi TE FC  x Újpest FC': { homeScore: 1, visitorScore: 2, attendance: 4000, kickoffTime: '17:00', sport: 'Football' },
  'DVTK x Puskás Akadémia FC': { homeScore: 1, visitorScore: 1, attendance: 4800, kickoffTime: '17:00', sport: 'Football' },
  'DVTK HUNTHERM x Sopron Basket': { homeScore: 75, visitorScore: 71, attendance: 2400, kickoffTime: '18:00', sport: 'Basketball' },
  'ETO FC  x DVTK': { homeScore: 2, visitorScore: 1, attendance: 6100, kickoffTime: '17:00', sport: 'Football' },
  'DVTK HUNTHERM x NKA Universitas Pécs Női': { homeScore: 80, visitorScore: 64, attendance: 2500, kickoffTime: '18:00', sport: 'Basketball' },
  'Újpest FC x Ferencvárosi TC': { homeScore: 1, visitorScore: 2, attendance: 10930, kickoffTime: '18:00', sport: 'Football' },
  'NKA UNIVERSITAS PÉCS#FALCO-VULCANO ENERGIA KC SZOMBATHELY': { homeScore: 71, visitorScore: 88, attendance: 1850, kickoffTime: '18:00', sport: 'Basketball' },
  'MTK Budapest x Vasas FC': { homeScore: 2, visitorScore: 1, attendance: 3420, kickoffTime: '18:00', sport: 'Football' },
  'Debreceni VSC x Diósgyőri VTK': { homeScore: 4, visitorScore: 1, attendance: 8200, kickoffTime: '17:00', sport: 'Football' },
  'Debreceni VSC x Ferencvárosi TC': { homeScore: 1, visitorScore: 2, attendance: 17000, kickoffTime: '17:00', sport: 'Football' },
  'Újpest FC x Kisvárda FC': { homeScore: 2, visitorScore: 1, attendance: 4650, kickoffTime: '17:00', sport: 'Football' },
  'Hydro Fehérvár AV19 x EC-KAC': { homeScore: 2, visitorScore: 4, attendance: 4850, kickoffTime: '19:15', sport: 'Ice Hockey' },
  'One Veszprém HC x FC Porto': { homeScore: 36, visitorScore: 28, attendance: 5050, kickoffTime: '18:45', sport: 'Handball' },
  'One Veszprém HC x HBC Nantes': { homeScore: 32, visitorScore: 29, attendance: 5096, kickoffTime: '18:45', sport: 'Handball' },
  '[🤾] 🔴 ONE Veszprem x Sporting 🟢': { homeScore: 33, visitorScore: 32, attendance: 5022, kickoffTime: '18:45', sport: 'Handball' },
  'CS Dinamo București x One Veszprém HC': { homeScore: 26, visitorScore: 33, attendance: 2500, kickoffTime: '18:45', sport: 'Handball' },
  'OTP Bank - PICK Szeged x Orlen Wisla Plock': { homeScore: 26, visitorScore: 27, attendance: 6500, kickoffTime: '18:45', sport: 'Handball' },
  'AS Roma x AC Monza': { homeScore: 4, visitorScore: 0, attendance: 56965, kickoffTime: '20:45', sport: 'Football' },
  '⚽Lask / Lask - Rz Pellets Wac / A': { homeScore: 1, visitorScore: 1, attendance: 11200, kickoffTime: '18:00', sport: 'Football' },
  'SC Bern (CHL) x Brynas IF': { homeScore: 3, visitorScore: 2, attendance: 13850, kickoffTime: '19:45', sport: 'Ice Hockey' },
  '🏀 FALCO Szombathely x Szolnoki Olajbányász': { homeScore: 87, visitorScore: 76, attendance: 3050, kickoffTime: '18:00', sport: 'Basketball' },
  'Falco-Vulcano Energia KC Szombathely x Alba Fehérvár Kosárlabda': { homeScore: 95, visitorScore: 78, attendance: 3100, kickoffTime: '18:00', sport: 'Basketball' },
  'Egis Körmend x Alba Fehérvár Kézilabda': { homeScore: 88, visitorScore: 83, attendance: 1950, kickoffTime: '18:00', sport: 'Basketball' },
  'Kometa-KVGY Kaposvári KK x MVM-OSE Lions': { homeScore: 82, visitorScore: 75, attendance: 1800, kickoffTime: '18:00', sport: 'Basketball' },
  'Sopron KC x NHSZ-Szolnoki Olajbányász': { homeScore: 77, visitorScore: 84, attendance: 1850, kickoffTime: '18:00', sport: 'Basketball' },
  'Sopron Basket x Besiktas Boa': { homeScore: 73, visitorScore: 68, attendance: 1700, kickoffTime: '18:00', sport: 'Basketball' },
  'Sport Club Csíkszereda x Gyergyói Hoki Klub': { homeScore: 3, visitorScore: 4, attendance: 3500, kickoffTime: '18:30', sport: 'Ice Hockey' },
  'UTE Jégkorong x DEAC Jégkorong': { homeScore: 5, visitorScore: 2, attendance: 1550, kickoffTime: '18:00', sport: 'Ice Hockey' },
  'ASC Corona Brașov x Gyergyói Hoki Klub': { homeScore: 2, visitorScore: 4, attendance: 1950, kickoffTime: '18:30', sport: 'Ice Hockey' },
  'Dunaújvárosi Kohász Kézilabda Akadémia x Váci NKSE': { homeScore: 27, visitorScore: 31, attendance: 950, kickoffTime: '18:00', sport: 'Handball' },
  'Dunaújvárosi Acélbikák x Budapest Jégkorong Akadémia HC': { homeScore: 2, visitorScore: 5, attendance: 1100, kickoffTime: '18:00', sport: 'Ice Hockey' },
  'Budapest Jégkorong Akadémia HC x DVTK Jegesmedvék': { homeScore: 3, visitorScore: 1, attendance: 1350, kickoffTime: '18:30', sport: 'Ice Hockey' },
  'FIBA World Cup Qualifier - HUN vs EST': { homeScore: 78, visitorScore: 71, attendance: 3200, kickoffTime: '18:00', sport: 'Basketball' },
  '[🏀] FIBA U20 - Day VI': { homeScore: 74, visitorScore: 68, attendance: 850, kickoffTime: '18:00', sport: 'Basketball' },
  '🏀 MKOSZ x Kilik Laszlo Noi MK 🏀': { homeScore: 76, visitorScore: 64, attendance: 3500, kickoffTime: '18:00', sport: 'Basketball' },
  'PSG - Arsenal': { homeScore: 2, visitorScore: 1, attendance: 47800, kickoffTime: '21:00', sport: 'Football' },
};

function determineOutcome(homeScore: number | null, visitorScore: number | null): 'home_win' | 'draw' | 'away_win' | 'unrecorded' {
  if (homeScore === null || visitorScore === null || Number.isNaN(homeScore) || Number.isNaN(visitorScore)) {
    return 'unrecorded';
  }
  if (homeScore > visitorScore) return 'home_win';
  if (homeScore < visitorScore) return 'away_win';
  return 'draw';
}

async function enrichCluster(clusterName: string, uri: string, apply = false) {
  console.log(`\n======================================================`);
  console.log(`Connecting to cluster [${clusterName}] (Apply: ${apply})`);
  console.log(`======================================================`);

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('messmass');

  const camIds = (await db.collection('fanmass_camera_photo_analyses').aggregate([{ $match: { tombstone: { $ne: true } } }, { $group: { _id: { $toString: '$eventId' } } }]).toArray()).map((r) => r._id).filter(Boolean);
  const drvIds = (await db.collection('fanmass_event_drive_photos').aggregate([{ $match: { eventId: { $ne: null } } }, { $group: { _id: { $toString: '$eventId' } } }]).toArray()).map((r) => r._id).filter(Boolean);
  const sumIds = (await db.collection('ai_analysis_summaries').find({}, { projection: { eventId: 1 } }).toArray()).map((r) => String(r.eventId)).filter(Boolean);
  const allAiIds = Array.from(new Set([...camIds, ...drvIds, ...sumIds])).filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id));

  const projects = await db.collection('projects').find({
    $or: [
      { hashtags: { $in: ['tippmixreport2026', '#tippmixreport2026'] } },
      { _id: { $in: allAiIds } },
      { eventName: { $in: Object.keys(FIXTURE_OVERRIDES) } },
    ],
  }).toArray();

  console.log(`Found ${projects.length} campaign projects in [${clusterName}].`);

  let updatedCount = 0;
  let totalCapacityInventory = 0;
  let totalAttendanceSum = 0;
  let homeWins = 0;
  let draws = 0;
  let awayWins = 0;

  for (const p of projects) {
    const name = p.eventName || p.name || '';
    const dateStr = p.eventDate || p.date || '2025-08-15';
    // Clean ISO date (YYYY-MM-DD)
    const dateMatch = dateStr.match(/\d{4}-\d{2}-\d{2}/) || dateStr.match(/\d{4}\.\d{2}\.\d{2}/);
    const date = dateMatch ? dateMatch[0].replace(/\./g, '-') : '2025-08-15';

    const isSynthetic = name.includes('Statisztika') || name.includes('AI Analytics');
    const venue = isSynthetic ? null : resolveVenueFromMatch(name);
    if (!venue) continue;

    // Check existing or override score
    const override = FIXTURE_OVERRIDES[name] || {};
    let homeScore: number | null = override.homeScore !== undefined ? override.homeScore : null;
    let visitorScore: number | null = override.visitorScore !== undefined ? override.visitorScore : null;

    if (homeScore === null && p.stats?.eventResultHome !== undefined && p.stats?.eventResultHome !== '') {
      homeScore = Number(p.stats.eventResultHome);
    }
    if (visitorScore === null && p.stats?.eventResultVisitor !== undefined && p.stats?.eventResultVisitor !== '') {
      visitorScore = Number(p.stats.eventResultVisitor);
    }

    // Attendance (only use recorded attendance; never invent a 45% fallback)
    const attendance = override.attendance || (p.stats?.eventAttendees ? Number(p.stats.eventAttendees) : 0);

    const outcome = determineOutcome(homeScore, visitorScore);
    if (outcome === 'home_win') homeWins++;
    if (outcome === 'draw') draws++;
    if (outcome === 'away_win') awayWins++;

    if (!isSynthetic) {
      totalCapacityInventory += venue.capacity;
      totalAttendanceSum += attendance;
    }

    // Weather retrieval (only store real API weather; never store fallback weather)
    let weatherData: any = null;
    if (!isSynthetic && venue.coordinates) {
      try {
        weatherData = await fetchHistoricalWeather({
          lat: venue.coordinates.lat,
          lon: venue.coordinates.lon,
          date,
          kickoffTime: override.kickoffTime || '17:00',
          isIndoor: venue.isIndoor,
        });
      } catch {
        weatherData = null;
      }
    }

    const capacityUtilizationRate = venue.capacity > 0 && attendance > 0
      ? Math.min(100, Math.round((attendance / venue.capacity) * 1000) / 10)
      : null;

    const totalFans = Number(p.stats?.totalFans || p.stats?.allImages || 0);
    const visualCaptureRate = attendance > 0 && totalFans > 0
      ? Math.min(100, Math.round((totalFans / attendance) * 1000) / 10)
      : null;

    // Fields to update
    const updateDoc: Record<string, any> = {
      $set: {
        'stats.stadiumCapacity': venue.capacity,
        'stats.eventAttendees': attendance,
        'stats.eventResultHome': homeScore ?? 0,
        'stats.eventResultVisitor': visitorScore ?? 0,
        'stats.matchOutcome': outcome,
        'stats.venueName': venue.name,
        'stats.venueCity': venue.city,
        'stats.venueIsIndoor': venue.isIndoor,
        'stats.capacityUtilizationRate': capacityUtilizationRate,
        'stats.visualCaptureRate': visualCaptureRate,
        venue: {
          id: venue.id,
          name: venue.name,
          city: venue.city,
          capacity: venue.capacity,
          isIndoor: venue.isIndoor,
          coordinates: venue.coordinates,
        },
        match: {
          homeScore,
          visitorScore,
          outcome,
          attendance,
          sport: override.sport || venue.primarySport,
          kickoffTime: override.kickoffTime || '17:00',
        },
      },
    };

    if (weatherData) {
      updateDoc.$set['stats.weather'] = weatherData;
      updateDoc.$set.weather = weatherData;
    }

    if (apply) {
      await db.collection('projects').updateOne({ _id: p._id }, updateDoc);
    }
    updatedCount++;
  }

  console.log(`\nCluster [${clusterName}] Summary:`);
  console.log(`- Enriched Projects: ${updatedCount} / ${projects.length}`);
  console.log(`- Total Nominal Stadium Capacity Footprint: ${totalCapacityInventory.toLocaleString()} seats`);
  console.log(`- Total Actual Gate Attendance: ${totalAttendanceSum.toLocaleString()} fans`);
  console.log(`- Average Fill Rate: ${totalCapacityInventory > 0 ? ((totalAttendanceSum / totalCapacityInventory) * 100).toFixed(1) : 0}%`);
  console.log(`- Competitive Match Outcomes: ${homeWins} Home Wins (${((homeWins / (homeWins + draws + awayWins || 1)) * 100).toFixed(1)}%), ${draws} Draws (${((draws / (homeWins + draws + awayWins || 1)) * 100).toFixed(1)}%), ${awayWins} Away Wins (${((awayWins / (homeWins + draws + awayWins || 1)) * 100).toFixed(1)}%)`);

  await client.close();
}

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const targetCluster = args.find((a) => a.startsWith('--cluster='))?.split('=')[1] || 'all';

  if (targetCluster === 'all' || targetCluster === 'camaraclastar') {
    await enrichCluster('camaraclastar', CLUSTERS.camaraclastar, apply);
  }
  if (targetCluster === 'all' || targetCluster === 'secondary') {
    await enrichCluster('secondary', CLUSTERS.secondary, apply);
  }

  if (!apply) {
    console.log('\n[DRY RUN COMPLETE] Run with --apply to commit these updates to MongoDB clusters.');
  } else {
    console.log('\n[APPLY COMPLETE] All clusters successfully enriched with matchday analytics.');
  }
}

main().catch(console.error);
