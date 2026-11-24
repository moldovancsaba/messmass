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
function eventRow(event: HashtagReport['measured']['events'][number], baseMatch?: MatchItem): MatchItem {
  return {
    id: event.id,
    matchName: event.name,
    cleanName: event.name.replace(/\s*#\s*/g, ' x ').trim(),
    date: event.date ?? baseMatch?.date ?? '',
    ...(baseMatch?.kickoffTime ? { kickoffTime: baseMatch.kickoffTime } : {}),
    partnerName: baseMatch?.partnerName ?? '',
    venue: baseMatch?.venue ?? '',
    venueCapacity: baseMatch?.venueCapacity,
    attendance: baseMatch?.attendance,
    homeScore: baseMatch?.homeScore,
    visitorScore: baseMatch?.visitorScore,
    outcome: baseMatch?.outcome,
    weather: baseMatch?.weather,
    capacityUtilizationRate: baseMatch?.capacityUtilizationRate,
    visualCaptureRate: baseMatch?.visualCaptureRate,
    sport: baseMatch?.sport ?? detectSport(event.name),
    // The map counts a venue's photos from this field; here it holds the Fanmass photos of the event: the drive photos
    // placed in it and its Camera photo results
    submitted: event.drivePhotos + event.cameraPhotos,
    approved: baseMatch?.approved ?? 0,
    rejected: baseMatch?.rejected ?? 0,
    hostess: baseMatch?.hostess ?? 0,
    selfies: event.drivePhotos + event.cameraPhotos,
    approvalRate: baseMatch?.approvalRate ?? 0,
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
  const optInImages = drive.withOptIn + (photos.withOptIn ?? 0);
  const marketingOptInImages = photos.withMarketingOptIn !== undefined && photos.withMarketingOptIn !== null
    ? drive.withOptIn + photos.withMarketingOptIn
    : undefined;
  const ctaClickImages = photos.withCtaClicks && photos.withCtaClicks > 0 ? photos.withCtaClicks : undefined;
  return {
    totalImages: drive.photos + photos.analysed,
    processedCount: analysed,
    percent: drive.photos + photos.analysed > 0 ? Math.round((analysed / (drive.photos + photos.analysed)) * 100) : 0,
    status: 'idle',
    currentSport: '',
    currentFile: '',
    lastUpdated: report.generatedAt,
    optInImages,
    ...(marketingOptInImages !== undefined ? { marketingOptInImages } : {}),
    ...(ctaClickImages !== undefined ? { ctaClickImages } : {}),
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
  const label = report.scope.type === 'all'
    ? 'All events'
    : report.scope.tags.length > 0
      ? report.scope.tags.map((tag) => `#${tag}`).join(' + ')
      : (base?.scope?.name || base?.partner?.name || report.scope.id);
  // The vision document Fanmass published for the scope (the SZRT campaign), with the scope's Camera results added (it
  // covers the drive library only), else the enriched vision from base (or raw visionFromReport when base is null)
  const isSzrtCampaignBase = Boolean(base?.vision && (report.scope.type === 'all' || report.scope.id.toLowerCase() === 'tippmixreport2026' || base?.scope?.id?.toLowerCase() === 'tippmixreport2026' || base?.partner?.viewSlug === 'szrt'));
  const fromReport = !base?.vision ? visionFromReport(report) : null;
  const vision = base?.vision
    ? (isSzrtCampaignBase ? withCameraVision(base.vision, report) : base.vision)
    : fromReport && (base?.summary?.totalPhotos ?? 0) > fromReport.totalImages
      ? { ...fromReport, totalImages: Math.max(fromReport.totalImages, base!.summary.totalPhotos) }
      : fromReport;
  const events = report.measured.events.filter((event) => event.drivePhotos > 0 || event.hasPhotoResults);
  const baseMatches = base?.matches || [];
  const baseMatchMap = new Map(baseMatches.map((m) => [m.id, m]));
  for (const m of baseMatches) {
    const name = m.cleanName || m.matchName;
    if (name) {
      const cleanKey = name.toLowerCase().replace(/[^a-z0-9]/g, '');
      baseMatchMap.set(cleanKey, m);
      if (m.date) {
        const normDate = m.date.replace(/\./g, '-').replace(/-$/, '').trim();
        baseMatchMap.set(`${cleanKey}__${normDate}`, m);
      }
    }
  }

  const mergedMatches = events.length > 0
    ? events.map((event) => {
        const key = (event.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const normDate = (event.date || '').replace(/\./g, '-').replace(/-$/, '').trim();
        const bm = baseMatchMap.get(event.id) || (normDate ? baseMatchMap.get(`${key}__${normDate}`) : undefined) || baseMatchMap.get(key);
        return eventRow(event, bm);
      })
    : baseMatches;

  // Recompute matchdayAnalytics strictly over the Fanmass-analyzed events when events.length > 0
  let matchdayAnalytics = base?.matchdayAnalytics;
  if (events.length > 0) {
    let totalVenueCapacity = 0;
    let totalGateAttendance = 0;
    let visualCaptureSum = 0;
    let visualCaptureCount = 0;
    let homeWins = 0;
    let draws = 0;
    let awayWins = 0;
    let tempSum = 0;
    let tempCount = 0;
    let outdoorMatchesCount = 0;
    let indoorMatchesCount = 0;

    for (const m of mergedMatches) {
      const cap = m.venueCapacity && m.venueCapacity > 0 ? m.venueCapacity : 0;
      let att = m.attendance && m.attendance > 0 ? m.attendance : 0;
      if (cap > 0 && att > cap * 1.1) att = cap;
      if (cap > 0) totalVenueCapacity += cap;
      if (att > 0) totalGateAttendance += att;
      if (m.visualCaptureRate !== undefined && m.visualCaptureRate !== null) {
        visualCaptureSum += m.visualCaptureRate;
        visualCaptureCount++;
      }
      if (m.outcome === 'home_win') homeWins++;
      else if (m.outcome === 'draw') draws++;
      else if (m.outcome === 'away_win') awayWins++;
      if (m.weather) {
        tempSum += m.weather.tempC;
        tempCount++;
        if (m.weather.isIndoor) indoorMatchesCount++;
        else outdoorMatchesCount++;
      }
    }
    const completedMatches = homeWins + draws + awayWins;
    matchdayAnalytics = {
      totalVenueCapacity,
      totalGateAttendance,
      avgCapacityUtilization: totalVenueCapacity > 0 ? Math.round((totalGateAttendance / totalVenueCapacity) * 1000) / 10 : 0,
      avgVisualCaptureRate: visualCaptureCount > 0 ? Math.round((visualCaptureSum / visualCaptureCount) * 10) / 10 : 0,
      homeWins,
      draws,
      awayWins,
      homeWinRate: completedMatches > 0 ? Math.round((homeWins / completedMatches) * 1000) / 10 : 0,
      drawRate: completedMatches > 0 ? Math.round((draws / completedMatches) * 1000) / 10 : 0,
      awayWinRate: completedMatches > 0 ? Math.round((awayWins / completedMatches) * 1000) / 10 : 0,
      avgTemperatureC: tempCount > 0 ? Math.round((tempSum / tempCount) * 10) / 10 : null,
      outdoorMatchesCount,
      indoorMatchesCount,
    };
  }

  return {
    success: true,
    scope: base?.scope
      ? { ...base.scope, subtitle: `Visual analytics across ${label}: analysed photos, detected brand presence, club affiliations, and audience engagement.` }
      : { type: report.scope.type === 'all' ? 'global' : report.scope.type, id: report.scope.id, name: label },
    partner: base?.partner ?? { id: '', name: label, viewSlug: '', emoji: '📊' },
    style: base?.style ?? { name: 'default', heroBackground: '', pieColor1: '', pieColor2: '' },
    summary: base?.summary
      ? {
          ...base.summary,
          vettingApprovalRate: null,
          totalMatches: report.coverage.events,
        }
      : {
          ...EMPTY_SUMMARY,
          totalMatches: report.coverage.events,
        },
    timeline: [],
    matches: mergedMatches,
    sports: [],
    funnel: base?.funnel ?? [],
    demographics: buildDemographicsFromVision(vision),
    vision,
    matchdayAnalytics,
  };
}
