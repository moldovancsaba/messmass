// lib/hashtagReport/dashboard.ts
// WHAT: The Fanmass report shown in the interactive dashboard (charts, image proofs, territory map, demographics):
//     the dashboard's data with every hand-entered figure left out and the Fanmass figures put in.
// WHY: Owner 2026-11-14: "the proper fanmass report with the charts and image proofs the map and everything". Two kinds
//     of analytics never mix: the dashboard's clicker parts (photos taken, registrations, opt-ins, vetting, timeline,
//     funnel, typed match tables) stay in the clicker report; this keeps its Fanmass parts (the vision analysis with its
//     proofs) and feeds the header, the events and the map from the measured layer of the unified report.

import { buildDemographicsFromVision, detectSport } from '../interactiveReportAggregator';
import type { InteractiveReportData, MatchItem, VisionProgressData } from '../../components/theme/interactive-report/types';
import { proofNameKey } from './cameraProof';
import type { HashtagReport, NamedCount } from './types';

const EMPTY_SUMMARY: InteractiveReportData['summary'] = {
  totalPhotos: 0, hostessPhotos: 0, selfies: 0, hostessShare: 0, selfieShare: 0, totalRegistered: 0, totalOptIns: 0,
  optInRate: null, vettingApprovalRate: null, totalCtaClicks: 0, totalMatches: 0, touchpoints: { qr: 0, url: 0, social: 0 },
};

/** One Fanmass event as a dashboard row: its photo count is what Fanmass placed or analysed there, nothing typed. */
function eventRow(event: HashtagReport['measured']['events'][number]): MatchItem {
  return {
    id: event.id,
    matchName: event.name,
    cleanName: event.name.replace(/\s*#\s*/g, ' x ').trim(),
    date: event.date ?? '',
    partnerName: '',
    venue: '',
    sport: detectSport(event.name),
    // The map counts a venue's photos from this field; here it holds the Fanmass photos of the event: the drive photos
    // placed in it and its Camera photo results
    submitted: event.drivePhotos + event.cameraPhotos,
    approved: 0,
    rejected: 0,
    hostess: 0,
    selfies: event.drivePhotos + event.cameraPhotos,
    approvalRate: 0,
  };
}

const add = (...maps: Array<Record<string, number>>) => {
  const out: Record<string, number> = {};
  for (const map of maps) for (const [key, value] of Object.entries(map ?? {})) out[key] = (out[key] ?? 0) + (Number(value) || 0);
  return out;
};
const top = <K extends string>(map: Record<string, number>, key: K) =>
  Object.entries(map).filter(([, count]) => count > 0).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ [key]: name, count }) as Record<K, string> & { count: number });

/** Add the names read in another source to a vision list: counts of one name in any spelling are summed, the list's own
 * entry (with its logo) is kept, a new name is added as it was read. Sorted by count. */
function mergeNames<T extends { count: number }>(list: T[], extra: NamedCount[], nameOf: (row: T) => string, make: (row: NamedCount) => T): T[] {
  const out = list.map((row) => ({ ...row }));
  for (const row of extra) {
    const key = proofNameKey(row.name);
    const found = out.find((item) => proofNameKey(nameOf(item)) === key);
    if (found) found.count += row.count;
    else out.push(make(row));
  }
  return out.sort((a, b) => b.count - a.count);
}

/**
 * The Camera photo results of the report added to a vision document that covers the drive library only (the one Fanmass
 * published for the SZRT campaign): their photos, people, genders, ages, emotions, the names read in them and the proof
 * of those names (owner answer 501: Camera proof belongs next to the SZRT proof). Unchanged when Camera measured nothing.
 */
export function withCameraVision(vision: VisionProgressData, report: HashtagReport): VisionProgressData {
  const { photos, cameraProof } = report.measured;
  if (photos.analysed === 0 && cameraProof.length === 0) return vision;
  const { aggregates } = vision;
  const male = aggregates.genders.male + (photos.genders.male ?? 0);
  const female = aggregates.genders.female + (photos.genders.female ?? 0);
  const pct = (n: number) => (male + female > 0 ? Math.round((n / (male + female)) * 1000) / 10 : 0);
  const totalImages = vision.totalImages + photos.analysed;
  const processedCount = vision.processedCount + photos.analysed;
  return {
    ...vision,
    totalImages,
    processedCount,
    percent: totalImages > 0 ? Math.round((processedCount / totalImages) * 100) : 0,
    // Only when the published document counted its own photos with an opt-in, so the two counts cover the same photos
    ...(vision.optInImages !== undefined ? { optInImages: vision.optInImages + (photos.withOptIn ?? 0) } : {}),
    aggregates: {
      ...aggregates,
      totalPeople: aggregates.totalPeople + photos.people.measured,
      genders: { male, female, malePct: pct(male), femalePct: pct(female) },
      ageGroups: {
        children: aggregates.ageGroups.children + (photos.ageGroups.children ?? 0),
        teens: aggregates.ageGroups.teens + (photos.ageGroups.teens ?? 0),
        adults: aggregates.ageGroups.adults + (photos.ageGroups.adults ?? 0),
        seniors: aggregates.ageGroups.seniors + (photos.ageGroups.seniors ?? 0),
      },
      topBrands: mergeNames(aggregates.topBrands, photos.brands, (row) => row.brand, (row) => ({ brand: row.name, count: row.count })),
      topClubs: mergeNames(aggregates.topClubs, photos.clubs, (row) => row.club, (row) => ({ club: row.name, count: row.count })),
      topEmotions: top(add(Object.fromEntries(aggregates.topEmotions.map((row) => [row.emotion, row.count])), photos.emotions), 'emotion'),
    },
    cameraProof,
  };
}

/** The vision analysis of any hashtag, from the photos Messmass stores: the drive photos and the Camera photo results.
 * Used when Fanmass published no vision document for the scope (only the SZRT campaign has one). */
export function visionFromReport(report: HashtagReport): VisionProgressData | null {
  const { drive, photos } = report.measured;
  const analysed = drive.analysed + photos.analysed;
  if (analysed === 0) return null;
  const genders = add(drive.genders, photos.genders);
  const ages = add(drive.ageGroups, photos.ageGroups);
  const male = genders.male ?? 0;
  const female = genders.female ?? 0;
  const pct = (n: number) => (male + female > 0 ? Math.round((n / (male + female)) * 1000) / 10 : 0);
  return {
    totalImages: drive.photos + photos.analysed,
    processedCount: analysed,
    percent: drive.photos + photos.analysed > 0 ? Math.round((analysed / (drive.photos + photos.analysed)) * 100) : 0,
    status: 'idle',
    currentSport: '',
    currentFile: '',
    lastUpdated: report.generatedAt,
    optInImages: drive.withOptIn + (photos.withOptIn ?? 0),
    aggregates: {
      totalPeople: drive.people + photos.people.measured,
      genders: { male, female, malePct: pct(male), femalePct: pct(female) },
      ageGroups: { children: ages.children ?? 0, teens: ages.teens ?? 0, adults: ages.adults ?? 0, seniors: ages.seniors ?? 0 },
      topBrands: mergeNames(drive.brands.map((row) => ({ brand: row.name, count: row.count })), photos.brands, (row) => row.brand, (row) => ({ brand: row.name, count: row.count })),
      topClubs: mergeNames(drive.clubs.map((row) => ({ club: row.name, count: row.count })), photos.clubs, (row) => row.club, (row) => ({ club: row.name, count: row.count })),
      topEmotions: top(add(drive.emotions, photos.emotions), 'emotion'),
      sportsBreakdown: {},
    },
    recentImages: [],
    cameraProof: report.measured.cameraProof,
  };
}

export function fanmassDashboardData(base: InteractiveReportData | null, report: HashtagReport): InteractiveReportData {
  const label = report.scope.type === 'all' ? 'All events' : report.scope.tags.map((tag) => `#${tag}`).join(' + ');
  // The vision document Fanmass published for the scope (the SZRT campaign), with the scope's Camera results added (it
  // covers the drive library only), else the one the stored photos give
  const vision = base?.vision ? withCameraVision(base.vision, report) : visionFromReport(report);
  const events = report.measured.events.filter((event) => event.drivePhotos > 0 || event.hasPhotoResults);
  return {
    success: true,
    scope: base?.scope
      ? { ...base.scope, subtitle: `Visual analytics across ${label}: analysed photos, detected brand presence, club affiliations, and audience engagement.` }
      : { type: report.scope.type === 'all' ? 'global' : report.scope.type, id: report.scope.id, name: label },
    partner: base?.partner ?? { id: '', name: label, viewSlug: '', emoji: '📊' },
    style: base?.style ?? { name: 'default', heroBackground: '', pieColor1: '', pieColor2: '' },
    summary: { ...EMPTY_SUMMARY, totalMatches: report.coverage.events },
    timeline: [],
    matches: events.map(eventRow),
    sports: [],
    funnel: [],
    demographics: buildDemographicsFromVision(vision),
    vision,
  };
}
