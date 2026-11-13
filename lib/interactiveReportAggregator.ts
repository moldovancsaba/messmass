import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import config from '@/lib/config';
import { findPartnerByIdentifier } from '@/lib/partnerIdentifier';
import { consistentRate } from '@/lib/consistentRate';
import {
  InteractiveReportData,
  MatchItem,
  TimelinePeriod,
  ScopeHeader,
  VisionProgressData,
  DemographicsData,
} from '@/components/theme/interactive-report/types';
import {
  isSportFranchise,
  isVenue,
  getBrandCluster,
  getFranchiseInfo,
  canonicalizeClub,
  isGenericVisionDescription,
} from '@/lib/brandEntityClustering';
import { INTERACTIVE_REPORT_THEME } from '@/lib/theme/interactiveReportPalette';
import {
  getCachedReportSnapshot,
  saveReportSnapshot,
} from '@/lib/reportSnapshotManager';


export const SZRT_CAMPAIGN_NAMES = [
  "NOVEMBER Statisztika",
  "DECEMBER Statisztika",
  "JANUÁR Statisztika",
  "FEBRUÁR Statisztika",
  "2026. január 2 - 6. Statisztika",
  "2026. január 7 - 12. Statisztika",
  "2026. január 13 - 20. Statisztika",
  "2026. január 21 - 26. Statisztika",
  "2026. január 27 - február 2. Statisztika",
  "2026. február 3. - február 10. Statisztika",
  "2026. február 10 - február 17. Statisztika",
  "2026. február 18 - február 28. Statisztika",
  "ICE Hockey AI Analytics",
  "Handball AI Analytics",
  "Football AI Analytics",
  "Basketball AI Analytics",
];
const campaignNames = SZRT_CAMPAIGN_NAMES;

/** Tenant that owns the SZRT / Tippmix campaign data and its vision analysis. */
export const SZRT_ORGANIZATION_ID = 'org_szrt';

/** Escapes user-supplied text before it is placed inside a RegExp. */
function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** True when the identifier names the SZRT / Tippmix campaign scope. */
export function isSzrtScopeIdentifier(identifier: string): boolean {
  const id = (identifier || '').trim().replace(/^#/, '');
  const low = id.toLowerCase();
  return (
    low === 'szrt' ||
    low === 'szerencsejatek' ||
    low === 'tippmixreport2026' ||
    id === 'ec9bb989-cb0f-4d5a-b22b-c3a1829cd3fd' ||
    id === '694a96990ad78323bea10660'
  );
}

/**
 * The vision analysis document (szrt_vision_progress) belongs to the SZRT campaign only.
 * It may be attached to a report only when the resolved scope is that campaign and the
 * caller is not scoped to another tenant.
 */
function isSzrtVisionScope(
  scopeType: 'hashtag' | 'partner' | 'event' | 'global',
  scopeIdentifier: string,
  organizationId?: string
): boolean {
  if (organizationId && organizationId !== SZRT_ORGANIZATION_ID) return false;
  // The global report holds everything, so the SZRT vision analysis is part of it (still only once a person approved it)
  if (scopeType === 'global') return true;
  if (scopeType !== 'hashtag' && scopeType !== 'partner') return false;
  return isSzrtScopeIdentifier(scopeIdentifier);
}

/**
 * The vision analysis is shown only after a person has checked its content and set
 * `publishApproved: true` on the szrt_progress document. Until then no AI-derived brand,
 * club, people or audience figure is shown to a viewer.
 */
export function isVisionPublishable(doc: any): boolean {
  return Boolean(doc) && doc.publishApproved === true;
}

/** Reads a stored count; anything that is not a finite number counts as 0. */
function toCount(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Parses a count out of a markdown table cell; null when the cell holds no digits. */
function parseCellCount(cell: string | undefined): number | null {
  if (!cell) return null;
  const digits = cell.replace(/\D/g, '');
  if (!digits) return null;
  const n = parseInt(digits, 10);
  return Number.isFinite(n) ? n : null;
}

/** Sport label from event/partner text. Anything that is not recognised is 'Other'. */
function detectSport(text: string): MatchItem['sport'] {
  const combined = text.toLowerCase();
  if (
    combined.includes('jégkorong') ||
    combined.includes('hoki') ||
    combined.includes('av19') ||
    combined.includes('erste liga') ||
    combined.includes('titánok') ||
    combined.includes('vsv')
  ) {
    return 'Ice Hockey';
  }
  if (
    combined.includes('kézilabda') ||
    combined.includes('veszprém') ||
    combined.includes('szeged') ||
    combined.includes('nb1 kézi') ||
    combined.includes('handball')
  ) {
    return 'Handball';
  }
  if (
    combined.includes('kosárlabda') ||
    combined.includes('huntherm') ||
    combined.includes('falco') ||
    combined.includes('alba') ||
    combined.includes('fiba') ||
    combined.includes('basketball')
  ) {
    return 'Basketball';
  }
  if (
    combined.includes('labdarúgó') ||
    combined.includes('labdarugo') ||
    combined.includes('futball') ||
    combined.includes('football') ||
    combined.includes('soccer')
  ) {
    return 'Football';
  }
  return 'Other';
}

/**
 * Demographics from the vision model's measured gender and age counts.
 * Returns null when no people were measured.
 */
function buildDemographicsFromVision(vision: VisionProgressData | null): DemographicsData | null {
  if (!vision) return null;
  const { genders, ageGroups, totalPeople } = vision.aggregates;

  const male = toCount(genders?.male);
  const female = toCount(genders?.female);
  const genderTotal = male + female;

  const ageCounts = {
    children: toCount(ageGroups?.children),
    teens: toCount(ageGroups?.teens),
    adults: toCount(ageGroups?.adults),
    seniors: toCount(ageGroups?.seniors),
  };
  const ageTotal = ageCounts.children + ageCounts.teens + ageCounts.adults + ageCounts.seniors;

  if (genderTotal === 0 && ageTotal === 0) return null;

  const pct = (count: number, total: number) =>
    total > 0 ? Number(((count / total) * 100).toFixed(1)) : 0;

  const generations =
    ageTotal > 0
      ? [
          { label: 'Children', count: ageCounts.children },
          { label: 'Teens', count: ageCounts.teens },
          { label: 'Adults', count: ageCounts.adults },
          { label: 'Seniors', count: ageCounts.seniors },
        ].map((g) => ({ label: g.label, count: g.count, percent: pct(g.count, ageTotal) }))
      : [];

  const maleRatio = pct(male, genderTotal);

  return {
    male,
    female,
    totalAudience: toCount(totalPeople) || Math.max(genderTotal, ageTotal),
    maleRatio,
    femaleRatio: genderTotal > 0 ? Number((100 - maleRatio).toFixed(1)) : 0,
    generations,
  };
}

export interface ReportScopeQuery {
  type: 'hashtag' | 'partner' | 'event' | 'global';
  identifier: string;
  organizationId?: string;
  sportFilter?: string;
}

export async function getScopedInteractiveReportData(
  query: ReportScopeQuery
): Promise<InteractiveReportData | null> {
  const client = await clientPromise;
  const db = client.db(config.dbName);

  const scopeType = query.type;
  const rawId = query.identifier.trim();
  const scopeIdentifier = rawId.replace(/^#/, '');
  const sportFilter = query.sportFilter || 'all';

  // 0. Check materialized snapshot cache for <50ms SSR latency (INV-001 tenant fenced)
  try {
    const cached = await getCachedReportSnapshot({
      scopeType,
      scopeIdentifier,
      sportFilter,
      organizationId: query.organizationId,
    });
    if (cached) {
      // The live vision overlay is only valid for the SZRT campaign scope
      if (cached.vision && isSzrtVisionScope(scopeType, scopeIdentifier, query.organizationId)) {
        try {
          const liveDoc = await db.collection('szrt_vision_progress').findOne({ _id: 'szrt_progress' as any });
          if (!isVisionPublishable(liveDoc)) {
            cached.vision = null;
            cached.demographics = null;
          } else if (liveDoc) {
            cached.vision.processedCount = liveDoc.processedCount || cached.vision.processedCount;
            cached.vision.percent = liveDoc.percent || cached.vision.percent;
            cached.vision.status = liveDoc.status || cached.vision.status;
            cached.vision.currentSport = liveDoc.currentSport || cached.vision.currentSport;
            cached.vision.currentFile = liveDoc.currentFile || cached.vision.currentFile;
            cached.vision.lastUpdated = liveDoc.lastUpdated || cached.vision.lastUpdated;
            if (liveDoc.aggregates?.sportsBreakdown) {
              cached.vision.aggregates.sportsBreakdown = liveDoc.aggregates.sportsBreakdown;
            }
            if (liveDoc.aggregates?.totalPeople) {
              cached.vision.aggregates.totalPeople = liveDoc.aggregates.totalPeople;
            }
            if (liveDoc.aggregates?.genders) {
              cached.vision.aggregates.genders = liveDoc.aggregates.genders;
            }
            if (liveDoc.aggregates?.ageGroups) {
              cached.vision.aggregates.ageGroups = liveDoc.aggregates.ageGroups;
            }
            // Demographics are derived from the vision aggregates, so they follow the live numbers
            cached.demographics = buildDemographicsFromVision(cached.vision);
          }
        } catch {
          // fallback to snapshot numbers
        }
      }
      return cached;
    }
  } catch (err) {
    console.warn('Snapshot cache lookup warning:', err);
  }

  // 1. Resolve Scope & Target Projects via modular Scope Resolver (INV-001)
  const resolvedScope = await resolveScopeProjectIds(scopeType, rawId, query.organizationId, db);
  if (resolvedScope.resolvedEventIds.length === 0) {
    if (scopeType === "partner" && !resolvedScope.partner) return null;
    if (scopeType === "event") return null;
  }

  const { partner, campaignProjects, scopeHeader } = resolvedScope;

  // 2. Resolve partner style
  let style = null;
  if (partner?.styleId) {
    style =
      (await db.collection('report_styles').findOne({ _id: new ObjectId(partner.styleId) })) ||
      (await db.collection('reportStyles').findOne({ _id: new ObjectId(partner.styleId) }));
  }

  // 3. Find partner name lookup
  const allPartners = await db.collection('partners').find({}).toArray().catch(() => []);
  const partnerNameMap = new Map<string, string>();
  for (const tp of allPartners) {
    partnerNameMap.set(String(tp._id), tp.name);
  }

  // 4. Parse matches from markdown tables and individual projects
  const matchesMap = new Map<string, MatchItem>();
  // Matches whose approved count was actually recorded (needed for an honest approval rate)
  const vettedMatchKeys = new Set<string>();

  for (const p of campaignProjects) {
    const rawTable = p.stats?.szerencsejatekTop10;
    if (typeof rawTable !== 'string' || !rawTable.includes('|')) continue;
    const lines = rawTable.trim().split('\n');
    if (lines.length < 3) continue;

    const headers = lines[0].split('|').map((h: string) => h.trim().toLowerCase()).filter(Boolean);
    const colIdx = {
      name: headers.findIndex((h: string) => h.includes('esemény') || h.includes('meccs')),
      date: headers.findIndex((h: string) => h.includes('dátum')),
      partner: headers.findIndex((h: string) => h.includes('partner')),
      venue: headers.findIndex((h: string) => h.includes('helyszín')),
      submitted: headers.findIndex((h: string) => h.includes('beérkezett')),
      approved: headers.findIndex((h: string) => h.includes('elfogadott')),
      rejected: headers.findIndex((h: string) => h.includes('elutasított')),
      hostess: headers.findIndex((h: string) => h.includes('hostess')),
    };

    for (let i = 2; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line.includes('|') || line.includes('---')) continue;
      const cols = line
        .split('|')
        .map((c: string) => c.trim())
        .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
      if (cols.length < 3) continue;

      const rawMatchName = colIdx.name !== -1 && cols[colIdx.name] ? cols[colIdx.name] : cols[0];
      if (!rawMatchName || rawMatchName === '0') continue;

      const date = colIdx.date !== -1 && cols[colIdx.date] ? cols[colIdx.date] : '';
      const partnerName = colIdx.partner !== -1 && cols[colIdx.partner] ? cols[colIdx.partner] : '';
      const venue = colIdx.venue !== -1 && cols[colIdx.venue] ? cols[colIdx.venue] : '';
      const submitted = (colIdx.submitted !== -1 ? parseCellCount(cols[colIdx.submitted]) : null) ?? 0;
      const storedApproved = colIdx.approved !== -1 ? parseCellCount(cols[colIdx.approved]) : null;
      // An approved count above the submitted count cannot be a real approval: it is dropped (0, no vetting data)
      const approvedCell = storedApproved !== null && storedApproved <= submitted ? storedApproved : null;
      const approved = approvedCell ?? 0;
      const rejected = (colIdx.rejected !== -1 ? parseCellCount(cols[colIdx.rejected]) : null) ?? 0;
      const hostess = (colIdx.hostess !== -1 ? parseCellCount(cols[colIdx.hostess]) : null) ?? 0;
      const selfies = Math.max(0, submitted - hostess);
      const hasVettingData = approvedCell !== null && submitted > 0;
      const approvalRate = hasVettingData ? Math.round((approved / submitted) * 100) : 0;

      const sport = detectSport(`${rawMatchName} ${partnerName} ${venue}`);

      const cleanName = rawMatchName

        .replace(/^[⚽ððð¤¾ð¸\s]+/, '')
        .replace(/#/g, ' vs ')
        .trim();

      const key = `${rawMatchName.toLowerCase().replace(/[^a-z0-9]/g, '')}__${date}`;
      const cpStats = p.stats || {};
      // A later row with the same key replaces the earlier one, so its vetting status replaces too
      if (hasVettingData) vettedMatchKeys.add(key);
      else vettedMatchKeys.delete(key);

      matchesMap.set(key, {
        id: key,
        matchName: rawMatchName,
        cleanName,
        date,
        partnerName,
        venue,
        sport,
        submitted,
        approved,
        rejected,
        hostess,
        selfies,
        approvalRate,
        demographics: {
          male: cpStats.male || 0,
          female: cpStats.female || 0,
          genAlpha: cpStats.genAlpha || 0,
          genYZ: cpStats.genYZ || 0,
          genX: cpStats.genX || 0,
          boomer: cpStats.boomer || 0,
        },
      });
    }
  }

  // Ingest individual match activations
  for (const p of campaignProjects) {
    if (campaignNames.includes(p.eventName)) continue;
    const s = p.stats || {};
    const submitted =
      toCount(s.allImages) || toCount(s.approvedImages) || toCount(s.remoteImages) + toCount(s.hostessImages);
    if (!submitted || submitted <= 0) continue;

    const date = (p.eventDate || '').replace(/\./g, '-').replace(/-$/, '').trim();
    const cleanName = p.eventName.replace(/^[⚽ððð¤¾ð¸\s]+/, '').replace(/#/g, ' vs ').trim();
    const key = `${p.eventName.toLowerCase().replace(/[^a-z0-9]/g, '')}__${date}`;

    if (!matchesMap.has(key)) {
      const partnerName =
        partnerNameMap.get(String(p.partner1Id)) ||
        partnerNameMap.get(String(p.partner2Id)) ||
        '';
      const hostess = toCount(s.hostessImages) || toCount(s.szerencsejatekHostessAllphotos);
      // approved is only known when the event stored a count; it never defaults to the submitted count
      // An approved count above the submitted count cannot be a real approval: it is dropped (0, no vetting data)
      const storedApproved = toCount(s.approvedImages);
      const approved = storedApproved <= submitted ? storedApproved : 0;
      const hasVettingData = approved > 0;
      const rejected = toCount(s.rejectedImages) || (hasVettingData ? Math.max(0, submitted - approved) : 0);

      const sport = detectSport(`${p.eventName} ${partnerName}`);
      if (hasVettingData) vettedMatchKeys.add(key);

      matchesMap.set(key, {
        id: key,
        matchName: p.eventName,
        cleanName,
        date,
        partnerName,
        venue: '',
        sport,
        submitted,
        approved,
        rejected,
        hostess,
        selfies: Math.max(0, submitted - hostess),
        approvalRate: hasVettingData && submitted > 0 ? Math.round((approved / submitted) * 100) : 0,
        demographics: {
          male: s.male || 0,
          female: s.female || 0,
          genAlpha: s.genAlpha || 0,
          genYZ: s.genYZ || 0,
          genX: s.genX || 0,
          boomer: s.boomer || 0,
        },
      });
    }
  }

  const matchesList = Array.from(matchesMap.values()).sort((a, b) => b.submitted - a.submitted);

  // 5. Build timeline periods
  const timelinePeriods: TimelinePeriod[] = campaignProjects
    .filter((p) => campaignNames.includes(p.eventName))
    .map((p) => {
      const s = p.stats || {};
      const isMonthly = [
        'NOVEMBER Statisztika',
        'DECEMBER Statisztika',
        'JANUÁR Statisztika',
        'FEBRUÁR Statisztika',
      ].includes(p.eventName);
      const isSport = p.eventName.includes('AI Analytics');
      const type: TimelinePeriod['type'] = isMonthly ? 'monthly' : isSport ? 'sport' : 'weekly';

      let shortName = p.eventName
        .replace(' Statisztika', '')
        .replace(' AI Analytics', '')
        .replace('2026. ', '');

      if (isMonthly) {
        if (p.eventName.includes('NOVEMBER')) shortName = "Nov '25";
        else if (p.eventName.includes('DECEMBER')) shortName = "Dec '25";
        else if (p.eventName.includes('JANUÁR')) shortName = "Jan '26";
        else if (p.eventName.includes('FEBRUÁR')) shortName = "Feb '26";
      } else if (type === 'weekly') {
        shortName = shortName
          .replace('január', 'Jan')
          .replace('február', 'Feb')
          .replace(/\.$/, '')
          .trim();
      }

      const allPhotos = s.szerencsejatekAllusersAllphotos || s.allImages || 0;
      const hostessPhotos = s.szerencsejatekHostessAllphotos || 0;
      const selfies = Math.max(0, allPhotos - hostessPhotos);
      const registered = s.szerencsejatekAllRegistered || 0;
      const optIns = s.szerencsejatekMarketingOptInNumber || 0;
      // Derived from the same counts that are shown next to it; the stored percentage field is
      // not trusted because it can disagree with the stored counts. null = counts conflict.
      const optInShare = consistentRate(optIns, registered);
      const optInRate = optInShare !== null ? Math.round(optInShare) : null;
      const cta1 = s.szerencsejatekMarketingCTA01 || 0;
      const cta2 = s.szerencsejatekMarketingCTA02 || 0;

      return {
        id: String(p._id),
        name: p.eventName,
        shortName,
        type,
        date: p.eventDate || '',
        slug: p.viewSlug || '',
        allPhotos,
        hostessPhotos,
        selfies,
        registered,
        optIns,
        optInRate,
        qr: s.szerencsejatekFunnelQR || 0,
        url: s.szerencsejatekFunnelURL || 0,
        social: s.szerencsejatekFunnelSocial || 0,
        cta1,
        cta2,
        ctaTotal: cta1 + cta2,
      };
    });

  // 6. Aggregate global totals across the 4 primary monthly cycles
  // The monthly cycles hold the SZRT campaign's own totals (registrations, opt-ins, CTA clicks, touchpoints: stored
  // for that campaign only). The all-data scope does not take its photo headline from them, because that would present
  // one campaign's figures as everything: its photos come from every event, and the CTA clicks and touchpoints, which
  // only the campaign stores, stay n/a.
  const cyclePeriods = timelinePeriods.filter((t) => t.type === 'monthly');
  const monthlyPeriods = scopeType === 'global' ? [] : cyclePeriods;
  // Registrations and opt-ins: the SZRT campaign's cycles count once, and every event outside the campaign adds the
  // two counts it stored itself (userRegistration, marketingOptin). Campaign events are skipped there, their opt-ins are
  // already inside the cycles, so nothing is counted twice.
  const otherEvents =
    scopeType === 'global'
      ? campaignProjects.filter(
          (p) =>
            !campaignNames.includes(p.eventName) &&
            !(Array.isArray(p.hashtags) && p.hashtags.includes('tippmixreport2026')) &&
            !/tippmix/i.test(String(p.eventName ?? '')),
        )
      : [];
  const sumStat = (key: string) => otherEvents.reduce((acc, p) => acc + toCount(p.stats?.[key]), 0);
  // One source per event: the opt-ins an operator or sheet stored (marketingOptin), else the photos with a received
  // opt-in that Camera counted for the event (camera_consents_accepted)
  const otherEventOptIns = otherEvents.reduce(
    (acc, p) => acc + (toCount(p.stats?.marketingOptin) || toCount(p.stats?.camera_consents_accepted)),
    0,
  );
  const computedTotalPhotos = monthlyPeriods.reduce((acc, cur) => acc + cur.allPhotos, 0);
  const computedHostessPhotos = monthlyPeriods.reduce((acc, cur) => acc + cur.hostessPhotos, 0);
  const computedSelfies = Math.max(0, computedTotalPhotos - computedHostessPhotos);
  const computedTotalRegistered = cyclePeriods.reduce((acc, cur) => acc + cur.registered, 0) + sumStat('userRegistration');
  const computedTotalOptIns = cyclePeriods.reduce((acc, cur) => acc + cur.optIns, 0) + otherEventOptIns;
  const computedTotalCta1 = monthlyPeriods.reduce((acc, cur) => acc + cur.cta1, 0);
  const computedTotalCta2 = monthlyPeriods.reduce((acc, cur) => acc + cur.cta2, 0);

  const qrTotal = monthlyPeriods.reduce((acc, cur) => acc + cur.qr, 0);
  const urlTotal = monthlyPeriods.reduce((acc, cur) => acc + cur.url, 0);
  const socialTotal = monthlyPeriods.reduce((acc, cur) => acc + cur.social, 0);

  // Fallback for non-monthly campaign scopes
  const matchSubmitted = matchesList.reduce((acc, cur) => acc + cur.submitted, 0);
  const matchHostess = matchesList.reduce((acc, cur) => acc + cur.hostess, 0);

  // Photo vetting: only matches that recorded an approved count take part in the rate
  const vettedMatches = matchesList.filter((m) => vettedMatchKeys.has(m.id));
  const vettedSubmitted = vettedMatches.reduce((acc, cur) => acc + cur.submitted, 0);
  const vettedApproved = vettedMatches.reduce((acc, cur) => acc + cur.approved, 0);

  const totalPhotos = computedTotalPhotos > 0 ? computedTotalPhotos : matchSubmitted;
  const hostessPhotos = computedHostessPhotos > 0 ? computedHostessPhotos : matchHostess;
  const selfies = computedSelfies > 0 ? computedSelfies : Math.max(0, totalPhotos - hostessPhotos);
  const totalRegistered = computedTotalRegistered;
  const totalOptIns = computedTotalOptIns;
  const totalCtaClicks = computedTotalCta1 + computedTotalCta2;

  // Approved / submitted in photo vetting; null when no match recorded an approved count
  // (matches whose stored approved count exceeds the submitted count are left out above, so no cap is needed)
  const vettingApprovalRate = consistentRate(vettedApproved, vettedSubmitted);

  // Opt-ins / registered, the same two counts that are printed next to it;
  // null when nobody registered or the stored opt-ins exceed the registrations
  const weightedOptInRate = consistentRate(totalOptIns, totalRegistered);

  // 7. Sports Breakdown
  // Only sports that occur in the scope are listed
  const sportsMap: Record<
    string,
    { count: number; photos: number; approved: number; hostess: number }
  > = {};

  for (const m of matchesList) {
    if (!sportsMap[m.sport]) {
      sportsMap[m.sport] = { count: 0, photos: 0, approved: 0, hostess: 0 };
    }
    sportsMap[m.sport].count += 1;
    sportsMap[m.sport].photos += m.submitted;
    sportsMap[m.sport].approved += m.approved;
    sportsMap[m.sport].hostess += m.hostess;
  }

  const sportsBreakdown = Object.entries(sportsMap).map(([sport, d]) => ({
    sport,
    matchesCount: d.count,
    photos: d.photos,
    approved: d.approved,
    hostess: d.hostess,
    hostessRatio: d.photos > 0 ? Math.round((d.hostess / d.photos) * 100) : 0,
  }));

  // 8. Funnel steps (every value and detail comes from stored counts)
  const funnelSteps = [
    {
      step: 'Discovery & Engagement',
      value: qrTotal + urlTotal + socialTotal,
      detail: `QR (${qrTotal.toLocaleString()}), Web URL (${urlTotal.toLocaleString()}), Social (${socialTotal.toLocaleString()})`,
    },
    {
      step: 'Photo Submissions',
      value: totalPhotos,
      detail: `${hostessPhotos.toLocaleString()} Hostess Assisted + ${selfies.toLocaleString()} Direct Selfies`,
    },
    {
      step: 'Approved in Photo Vetting',
      value: vettedApproved,
      detail:
        vettingApprovalRate !== null
          ? `${vettingApprovalRate.toFixed(1)}% of submitted photos approved in photo vetting`
          : 'n/a (no photo vetting data)',
    },
    {
      step: 'Account Registrations',
      value: totalRegistered,
      detail: `${totalRegistered.toLocaleString()} Accounts Registered`,
    },
    {
      step: 'Marketing Opt-In',
      value: totalOptIns,
      detail:
        weightedOptInRate !== null
          ? `${weightedOptInRate.toFixed(1)}% Opt-In to Marketing Campaigns`
          : totalRegistered > 0
            ? 'Opt-in rate n/a (stored opt-ins exceed stored registrations)'
            : totalOptIns > 0
              ? 'Opt-in rate n/a (no stored registrations to compare)'
              : 'n/a (no opt-ins stored)',
    },
    {
      step: 'CTA Click Conversions',
      value: totalCtaClicks,
      detail: `${computedTotalCta1.toLocaleString()} Primary CTA + ${computedTotalCta2.toLocaleString()} Secondary CTA`,
    },
  ];

  // 9. Fanmass Vision Analysis. The vision document describes the SZRT campaign only,
  // so every other scope gets no vision data at all.
  let vision: VisionProgressData | null = null;
  try {
    const visionDoc = isSzrtVisionScope(scopeType, scopeIdentifier, query.organizationId)
      ? await db.collection('szrt_vision_progress').findOne({ _id: 'szrt_progress' as any })
      : null;

    if (visionDoc && isVisionPublishable(visionDoc)) {
      // Fetch official brand assets for unified logo resolution
      const brandAssets = await db.collection('brand_assets').find({}).toArray().catch(() => []);
      const brandMap = new Map<string, any>();
      for (const asset of brandAssets) {
        if (asset.canonicalSlug) brandMap.set(asset.canonicalSlug, asset);
        if (asset.name) brandMap.set(asset.name.toLowerCase().trim(), asset);
        if (asset.aliases && Array.isArray(asset.aliases)) {
          for (const a of asset.aliases) {
            brandMap.set(String(a).toLowerCase().trim(), asset);
          }
        }
      }

      const enrichedBrands = (visionDoc.aggregates?.topBrands || [])
        .filter((b: any) => {
          return !isSportFranchise(b.brand) && !isVenue(b.brand);
        })
        .map((b: any) => {
          const norm = (b.brand || '').toLowerCase().trim();
          const normSlug = norm.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
          const match = brandMap.get(norm) || brandMap.get(normSlug);
          const cluster = getBrandCluster(b.brand);

          return {
            brand: b.brand,
            count: b.count,
            logoUrl: match?.logoUrl || undefined,
            darkLogoUrl: match?.darkLogoUrl || undefined,
            category: match?.category || cluster.label,
            accentColor: match?.accentColor || undefined,
          };
        });

      const cleanClubs = (visionDoc.aggregates?.topClubs || []).filter((c: any) => {
        const norm = (c.club || '').toLowerCase().trim();
        if (
          norm.includes('szerencsej') ||
          norm === 'tippmix' ||
          norm === 'mol' ||
          norm === 'nike' ||
          norm === 'adidas' ||
          norm === 'puma'
        ) {
          return false;
        }
        return true;
      });

      const matchClubToPartner = (club: string, partners: any[]) => {
        const low = club.toLowerCase().trim();
        if (!low || low === 'n/a' || low === 'none') return null;

        if (low.includes('debrecen') || low.includes('dvsc')) {
          return partners.find(
            (p) =>
              p.name &&
              (p.name.toLowerCase().includes('debrecen') || p.name.toLowerCase().includes('dvsc'))
          );
        }
        if (low.includes('nyíregyház') || low.includes('nyiregyhaz') || low.includes('szpari')) {
          return partners.find(
            (p) =>
              p.name &&
              (p.name.toLowerCase().includes('nyíregyház') ||
                p.name.toLowerCase().includes('nyiregyhaz'))
          );
        }
        if (low.includes('dvtk')) {
          return (
            partners.find(
              (p) => p.name && p.name.toLowerCase().includes('dvtk') && (p.logoUrl || p.logo)
            ) || partners.find((p) => p.name && p.name.toLowerCase().includes('dvtk'))
          );
        }
        if (low.includes('veszprém') || low.includes('veszprem')) {
          return partners.find(
            (p) =>
              p.name &&
              (p.name.toLowerCase().includes('veszprém') || p.name.toLowerCase().includes('veszprem'))
          );
        }
        if (
          low.includes('fehérvár fc') ||
          low.includes('fehervar fc') ||
          low === 'fehérvár' ||
          low.includes('videoton')
        ) {
          return partners.find(
            (p) =>
              p.name &&
              (p.name.toLowerCase().includes('videoton') ||
                p.name.toLowerCase().includes('fehérvár fc'))
          );
        }
        if (
          low.includes('hydro fehérvár') ||
          low.includes('fehérvár av19') ||
          low.includes('av19')
        ) {
          return (
            partners.find((p) => p.name && p.name.toLowerCase().includes('av19')) ||
            partners.find((p) => p.name && p.name.toLowerCase().includes('alba fehérvár'))
          );
        }
        if (low.includes('sopron')) {
          return (
            partners.find((p) => p.name && p.name.toLowerCase().includes('soproni kc')) ||
            partners.find((p) => p.name && p.name.toLowerCase().includes('sopron'))
          );
        }
        if (low.includes('falco')) {
          return partners.find((p) => p.name && p.name.toLowerCase().includes('falco'));
        }
        if (low.includes('körmend') || low.includes('kormend')) {
          return partners.find(
            (p) =>
              p.name &&
              (p.name.toLowerCase().includes('körmend') || p.name.toLowerCase().includes('kormend'))
          );
        }
        if (low.includes('szolnok')) {
          return partners.find((p) => p.name && p.name.toLowerCase().includes('szolnok'));
        }
        if (low.includes('kaposvár') || low.includes('kaposvar')) {
          return partners.find(
            (p) =>
              p.name &&
              (p.name.toLowerCase().includes('kaposvár') ||
                p.name.toLowerCase().includes('kaposvari'))
          );
        }
        if (low.includes('ose') || low.includes('oroszlány')) {
          return partners.find((p) => p.name && p.name.toLowerCase().includes('ose lions'));
        }
        if (low.includes('szeged') || low.includes('pick')) {
          return partners.find(
            (p) =>
              p.name &&
              (p.name.toLowerCase().includes('pick szeged') ||
                p.name.toLowerCase().includes('szeged'))
          );
        }
        if (low.includes('ferencváros') || low.includes('fradi') || low.includes('ftc')) {
          return partners.find(
            (p) =>
              p.name &&
              (p.name.toLowerCase().includes('ferencváros') || p.name.toLowerCase().includes('ftc'))
          );
        }
        if (low.includes('újpest') || low.includes('ujpest') || low.includes('ute')) {
          return partners.find(
            (p) =>
              p.name &&
              (p.name.toLowerCase().includes('újpest') || p.name.toLowerCase().includes('ujpest'))
          );
        }
        if (low.includes('haladás') || low.includes('haladas')) {
          return partners.find(
            (p) =>
              p.name &&
              (p.name.toLowerCase().includes('haladás') || p.name.toLowerCase().includes('haladas'))
          );
        }
        if (low.includes('honvéd') || low.includes('honved') || low.includes('kispest')) {
          return (
            partners.find((p) => p.name && p.name.toLowerCase().includes('budapest honvéd')) ||
            partners.find((p) => p.name && p.name.toLowerCase().includes('honvéd'))
          );
        }
        if (low.includes('eto') || low.includes('győr') || low.includes('gyor')) {
          if (low.includes('audi') || low.includes('kc') || low.includes('kézi') || low.includes('kezi') || low.includes('handball')) {
            return (
              partners.find((p) => p.name && p.name.toLowerCase().includes('audi eto')) ||
              partners.find((p) => p.name && p.name.toLowerCase().includes('eto') && p.emoji === 'ð¤¾')
            );
          }
          if (low.includes('uni') || low.includes('kosár')) {
            return partners.find((p) => p.name && p.name.toLowerCase().includes('uni győr'));
          }
          if (low.includes('fc') || low.includes('labdarúg') || low.includes('foci')) {
            return (
              partners.find((p) => p.name && (p.name.toLowerCase().includes('eto fc') || p.name.toLowerCase().includes('győr')) && p.emoji === '⚽') ||
              partners.find((p) => p.name && p.name.toLowerCase().includes('eto fc'))
            );
          }
          return (
            partners.find((p) => p.name && p.name.toLowerCase().includes('audi eto')) ||
            partners.find((p) => p.name && p.name.toLowerCase().includes('eto fc')) ||
            partners.find((p) => p.name && (p.name.toLowerCase().includes('eto') || p.name.toLowerCase().includes('győr')))
          );
        }
        return null;
      }

      // Group and sum by canonical club name to eliminate duplicates (INV-003, INV-001)
      const canonicalClubMap = new Map<
        string,
        {
          club: string;
          count: number;
          aliases: string[];
          sport?: string;
        }
      >();

      for (const c of cleanClubs) {
        if (!c.club) continue;
        const canonical = canonicalizeClub(c.club);
        if (!canonical) continue; // Skip generic vision descriptions, artifacts, non-entities

        const canonicalName = canonical.canonicalName;
        const existing = canonicalClubMap.get(canonicalName);
        if (existing) {
          existing.count += c.count;
          if (!existing.aliases.includes(c.club)) {
            existing.aliases.push(c.club);
          }
        } else {
          canonicalClubMap.set(canonicalName, {
            club: canonicalName,
            count: c.count,
            aliases: [c.club],
            sport: canonical.franchise?.sport,
          });
        }
      }

      const rawEnrichedClubs = Array.from(canonicalClubMap.values())
        .map((c) => {
          const matched = matchClubToPartner(c.club, allPartners);
          const sport =
            c.sport ||
            matched?.sportsDb?.strSport ||
            (matched?.categorizedHashtags?.sport?.[0]
              ? matched.categorizedHashtags.sport[0].charAt(0).toUpperCase() +
                matched.categorizedHashtags.sport[0].slice(1)
              : undefined);

          return {
            club: c.club,
            count: c.count,
            logoUrl:
              matched?.logoUrl ||
              matched?.logo ||
              matched?.sportsDb?.strTeamBadge ||
              matched?.sportsDb?.badge ||
              undefined,
            partnerId: matched?._id ? String(matched._id) : undefined,
            partnerSlug: matched?.viewSlug || undefined,
            partnerName: matched?.name || undefined,
            sport,
            homeVenue: matched?.sportsDb?.strStadium || undefined,
            venueCapacity:
              matched?.sportsDb?.intStadiumCapacity || matched?.sportsDb?.venueCapacity || undefined,
            website: matched?.sportsDb?.strWebsite || matched?.sportsDb?.website || undefined,
          };
        });

      // Deduplicate and merge by partner or canonical display identity (INV-003, INV-001)
      const uniqueClubEntityMap = new Map<string, (typeof rawEnrichedClubs)[0]>();
      const partnerIdToKey = new Map<string, string>();
      for (const item of rawEnrichedClubs) {
        // Canonical entity key ensures items with and without partnerId merge cleanly
        const canonicalKey = (item.partnerName || item.club).toLowerCase().trim();
        let targetKey = canonicalKey;
        if (item.partnerId && partnerIdToKey.has(item.partnerId)) {
          targetKey = partnerIdToKey.get(item.partnerId)!;
        }

        const existing = uniqueClubEntityMap.get(targetKey);
        if (existing) {
          existing.count += item.count;
          if (!existing.logoUrl && item.logoUrl) existing.logoUrl = item.logoUrl;
          if (!existing.partnerName && item.partnerName) existing.partnerName = item.partnerName;
          if (!existing.partnerId && item.partnerId) existing.partnerId = item.partnerId;
          if (!existing.partnerSlug && item.partnerSlug) existing.partnerSlug = item.partnerSlug;
          if (!existing.homeVenue && item.homeVenue) existing.homeVenue = item.homeVenue;
          if (!existing.website && item.website) existing.website = item.website;
        } else {
          uniqueClubEntityMap.set(targetKey, { ...item });
          if (item.partnerId) {
            partnerIdToKey.set(item.partnerId, targetKey);
          }
        }
      }

      const enrichedClubs = Array.from(uniqueClubEntityMap.values()).sort((a, b) => b.count - a.count);

      // Enrich sport-specific brand assets and metrics in sportsBreakdown
      const rawSportsBreakdown = visionDoc.aggregates?.sportsBreakdown || {};
      const enrichedSportsBreakdown: Record<string, any> = {};
      for (const [sKey, sVal] of Object.entries(rawSportsBreakdown)) {
        const valObj = sVal as any;
        const sTopBrands = (valObj.topBrands || []).map((b: any) => {
          const match = brandMap.get(b.brand) || brandMap.get(b.brand.toLowerCase());
          return {
            brand: b.brand,
            count: b.count,
            logoUrl: match?.logoUrl || undefined,
          };
        });
        enrichedSportsBreakdown[sKey] = {
          ...valObj,
          topBrands: sTopBrands,
        };
      }

      vision = {
        totalImages: toCount(visionDoc.totalImages),
        processedCount: toCount(visionDoc.processedCount),
        percent: toCount(visionDoc.percent),
        status: visionDoc.status || 'idle',
        currentSport: visionDoc.currentSport || '',
        currentFile: visionDoc.currentFile || '',
        lastUpdated: visionDoc.lastUpdated || '',
        ...(visionDoc.optIn ? { optInImages: toCount(visionDoc.optIn.images) } : {}),
        aggregates: {
          totalPeople: toCount(visionDoc.aggregates?.totalPeople),
          genders: visionDoc.aggregates?.genders || {
            male: 0,
            female: 0,
            malePct: 0,
            femalePct: 0,
          },
          ageGroups: visionDoc.aggregates?.ageGroups || {
            children: 0,
            teens: 0,
            adults: 0,
            seniors: 0,
          },
          topBrands: enrichedBrands,
          topClubs: enrichedClubs,
          topVenues: visionDoc.aggregates?.topVenues || [],
          topEmotions: visionDoc.aggregates?.topEmotions || [],
          merchandise: visionDoc.aggregates?.merchandise || undefined,
          sportsBreakdown: enrichedSportsBreakdown,
        },
        recentImages: (Array.isArray(visionDoc.recentImages) ? visionDoc.recentImages : []).map(
          (img: any) => ({
            fileName: img.fileName,
            sport: img.sport,
            peopleCount: toCount(img.peopleCount),
            emotions: img.emotions || [],
            brands: img.brands || [],
            clubs: img.clubs || [],
            scene: img.scene || '',
          })
        ),
      };
    }
  } catch (err) {
    console.error('Failed to load vision progress:', err);
  }

  // 10. Demographics come from what the vision model measured; no measurement, no demographics
  const demographics = buildDemographicsFromVision(vision);

  const finalResult: InteractiveReportData = {
    success: true,
    scope: scopeHeader,
    partner: {
      id: String(partner?._id || scopeHeader.id),
      name: scopeHeader.name,
      viewSlug: partner?.viewSlug || scopeHeader.viewSlug || scopeHeader.id,
      emoji: scopeHeader.emoji || 'ð',
    },
    style: {
      name: style?.name || 'Default',
      heroBackground: style?.heroBackground || INTERACTIVE_REPORT_THEME.heroBackground,
      pieColor1: style?.pieColor1 || INTERACTIVE_REPORT_THEME.pieColor1,
      pieColor2: style?.pieColor2 || INTERACTIVE_REPORT_THEME.pieColor2,
    },
    summary: {
      totalPhotos,
      hostessPhotos,
      selfies,
      hostessShare: totalPhotos > 0 ? Math.round((hostessPhotos / totalPhotos) * 100) : 0,
      selfieShare: totalPhotos > 0 ? Math.round((selfies / totalPhotos) * 100) : 0,
      totalRegistered,
      totalOptIns,
      optInRate: weightedOptInRate !== null ? Number(weightedOptInRate.toFixed(1)) : null,
      vettingApprovalRate:
        vettingApprovalRate !== null ? Number(vettingApprovalRate.toFixed(1)) : null,
      totalCtaClicks,
      totalMatches: matchesList.length,
      touchpoints: {
        qr: qrTotal,
        url: urlTotal,
        social: socialTotal,
      },
    },
    timeline: timelinePeriods,
    matches: matchesList,
    sports: sportsBreakdown,
    funnel: funnelSteps,
    demographics,
    vision,
  };

  // Cache snapshot asynchronously for sub-50ms SSR latency
  try {
    await saveReportSnapshot(
      {
        scopeType,
        scopeIdentifier,
        sportFilter,
        organizationId: query.organizationId,
      },
      finalResult,
      3600 // 1 hour TTL
    );
  } catch (snapErr) {
    console.warn('Failed to cache report snapshot:', snapErr);
  }

  return finalResult;
}

export async function getInteractiveReportData(
  partnerSlug: string
): Promise<InteractiveReportData | null> {
  const lower = (partnerSlug || '').toLowerCase().trim();

  // 1. Hashtag scope detection
  if (
    lower === 'szrt' ||
    lower === 'szerencsejatek' ||
    lower === 'ec9bb989-cb0f-4d5a-b22b-c3a1829cd3fd' ||
    lower === '694a96990ad78323bea10660' ||
    lower === 'tippmixreport2026' ||
    lower === '#tippmixreport2026' ||
    lower.startsWith('hashtag-') ||
    lower.startsWith('#')
  ) {
    const hashtag = lower.replace(/^#|^hashtag-/, '');
    return getScopedInteractiveReportData({
      type: 'hashtag',
      identifier: hashtag === 'szrt' || hashtag === 'szerencsejatek' ? 'tippmixreport2026' : hashtag,
    });
  }

  // 2. Event scope detection
  if (lower.startsWith('event-')) {
    return getScopedInteractiveReportData({
      type: 'event',
      identifier: lower.replace(/^event-/, ''),
    });
  }

  // 3. Partner scope detection
  const cleanPartnerSlug = lower.replace(/^partner-/, '');
  return getScopedInteractiveReportData({
    type: 'partner',
    identifier: cleanPartnerSlug,
  });
}


export type ScopeType = "hashtag" | "partner" | "event" | "global";

export interface ScopeResolutionResult {
  scopeType: ScopeType;
  identifier: string;
  organizationId?: string;
  resolvedEventIds: string[];
  scopeMetadata: {
    title: string;
    description?: string;
    partnerId?: string;
    hashtag?: string;
    totalEvents: number;
  };
  partner?: any;
  campaignProjects: any[];
  scopeHeader: ScopeHeader;
}

export interface UniversalAggregateMetrics {
  scope: ScopeResolutionResult;
  totalPhotos: number;
  totalAttendeesDetected: number;
  genderRatio: { male: number; female: number };
  ageDistribution: Record<string, number>;
  emotionBreakdown: Record<string, number>;
  topClubs: Array<{ clubId: string; name: string; count: number; emvEur: number }>;
  topSponsors: Array<{ brandId: string; name: string; count: number; emvEur: number }>;
  generatedAt: string;
}

/** The project fields getScopedInteractiveReportData reads. The global scope fetches nothing else. */
const GLOBAL_PROJECT_FIELDS = Object.fromEntries(
  [
    'eventName', 'eventDate', 'viewSlug', 'slug', 'partner1Id', 'partner2Id', 'organizationId', 'hashtags',
    ...[
      'userRegistration', 'marketingOptin', 'camera_consents_accepted',
      'allImages', 'approvedImages', 'rejectedImages', 'remoteImages', 'hostessImages',
      'male', 'female', 'genAlpha', 'genYZ', 'genX', 'boomer',
      'szerencsejatekTop10', 'szerencsejatekHostessAllphotos', 'szerencsejatekAllusersAllphotos',
      'szerencsejatekAllRegistered', 'szerencsejatekMarketingOptInNumber',
      'szerencsejatekMarketingCTA01', 'szerencsejatekMarketingCTA02',
      'szerencsejatekFunnelQR', 'szerencsejatekFunnelURL', 'szerencsejatekFunnelSocial',
    ].map((key) => `stats.${key}`),
  ].map((field) => [field, 1]),
);

export async function resolveScopeProjectIds(
  scopeType: ScopeType,
  identifier: string,
  organizationId?: string,
  dbInstance?: any
): Promise<ScopeResolutionResult> {
  const client = await clientPromise;
  const db = dbInstance || client.db(config.dbName);

  const rawId = (identifier || "").trim();
  const scopeIdentifier = rawId.replace(/^#/, "");

  const isSzrtIdentifier = isSzrtScopeIdentifier(scopeIdentifier);

  let partner: any = null;
  let campaignProjects: any[] = [];
  let scopeHeader: ScopeHeader;

  const campaignNames = [
    "NOVEMBER Statisztika",
    "DECEMBER Statisztika",
    "JANUÁR Statisztika",
    "FEBRUÁR Statisztika",
    "2026. január 2 - 6. Statisztika",
    "2026. január 7 - 12. Statisztika",
    "2026. január 13 - 20. Statisztika",
    "2026. január 21 - 26. Statisztika",
    "2026. január 27 - február 2. Statisztika",
    "2026. február 3. - február 10. Statisztika",
    "2026. február 10 - február 17. Statisztika",
    "2026. február 18 - február 28. Statisztika",
    "ICE Hockey AI Analytics",
    "Handball AI Analytics",
    "Football AI Analytics",
    "Basketball AI Analytics",
  ];

  if ((scopeType === "hashtag" && isSzrtIdentifier) || (scopeType === "partner" && isSzrtIdentifier)) {
    if (organizationId && organizationId !== SZRT_ORGANIZATION_ID) {
      return {
        scopeType,
        identifier: scopeIdentifier,
        organizationId,
        resolvedEventIds: [],
        scopeMetadata: {
          title: `#${scopeIdentifier}`,
          description: "No events accessible in this tenant partition.",
          totalEvents: 0,
        },
        partner: null,
        campaignProjects: [],
        scopeHeader: {
          type: scopeType === "hashtag" ? "hashtag" : "partner",
          id: scopeIdentifier,
          name: `#${scopeIdentifier}`,
          viewSlug: scopeIdentifier,
          emoji: "🔒",
          subtitle: "Zero events accessible in this tenant partition.",
          organizationId,
        },
      };
    }

    partner = await db.collection("partners").findOne({
      $or: [
        { viewSlug: "ec9bb989-cb0f-4d5a-b22b-c3a1829cd3fd" },
        { name: /szerencsejáték/i },
        ...(ObjectId.isValid("694a96990ad78323bea10660") ? [{ _id: new ObjectId("694a96990ad78323bea10660") }] : []),
      ],
    });

    const tippmixPartners = await db
      .collection("partners")
      .find({ name: /tippmix/i })
      .toArray();
    const tippmixPartnerIds = tippmixPartners.map((p: any) => p._id);
    const tippmixPartnerIdStrings = tippmixPartnerIds.map((id: any) => String(id));

    campaignProjects = await db
      .collection("projects")
      .find({
        $or: [
          { hashtags: "tippmixreport2026" },
          { eventName: { $in: campaignNames } },
          { eventName: /tippmix/i },
          { partner1Id: { $in: [...tippmixPartnerIds, ...tippmixPartnerIdStrings] as any } },
          { partner2Id: { $in: [...tippmixPartnerIds, ...tippmixPartnerIdStrings] as any } },
          { partner1: { $in: [...tippmixPartnerIds, ...tippmixPartnerIdStrings] as any } },
          { partner2: { $in: [...tippmixPartnerIds, ...tippmixPartnerIdStrings] as any } },
        ],
      })
      .sort({ eventDate: 1 })
      .toArray();

    scopeHeader = {
      type: scopeType === "hashtag" ? "hashtag" : "partner",
      id: scopeType === "hashtag" ? "tippmixreport2026" : (partner?.viewSlug || "szrt"),
      name: partner?.name || "Szerencsejáték Zrt.",
      viewSlug: "szrt",
      emoji: partner?.emoji || "🎯",
      subtitle:
        "Consolidated fan engagement, photo activation volume, and marketing opt-in conversion metrics across national sports events (#tippmixreport2026).",
      organizationId: partner?.organizationId ? String(partner.organizationId) : (organizationId || SZRT_ORGANIZATION_ID),
    };
  } else if (scopeType === "hashtag") {
    const hashtagFilter: any = {
      $or: [
        { hashtags: scopeIdentifier },
        { hashtags: `#${scopeIdentifier}` },
        { hashtags: { $regex: new RegExp(`^#?${escapeRegex(scopeIdentifier)}$`, "i") } },
      ],
    };
    if (organizationId) {
      hashtagFilter.organizationId = organizationId;
    }

    campaignProjects = await db
      .collection("projects")
      .find(hashtagFilter)
      .sort({ eventDate: 1 })
      .toArray();

    scopeHeader = {
      type: "hashtag",
      id: scopeIdentifier,
      name: `#${scopeIdentifier}`,
      viewSlug: scopeIdentifier,
      emoji: "🏷️",
      subtitle: `Consolidated interactive analytics and audience telemetry across #${scopeIdentifier} events.`,
      organizationId,
    };
  } else if (scopeType === "global") {
    // Everything Messmass holds, every project of every organization, in the same report as the others. The report
    // is behind a page password or an admin session (app/global-report): it spans clients, so it is never public.
    // Only the fields the report reads are fetched (a project's full stats document is large, and every project
    // is loaded here), and the sort happens here too, so the database never has to sort whole documents.
    campaignProjects = await db
      .collection("projects")
      .find(organizationId ? { organizationId } : {}, { projection: GLOBAL_PROJECT_FIELDS })
      .toArray();
    campaignProjects.sort((a: any, b: any) => String(a.eventDate ?? "").localeCompare(String(b.eventDate ?? "")));

    scopeHeader = {
      type: "global",
      id: "all",
      name: "All data",
      viewSlug: "all",
      emoji: "🌍",
      subtitle:
        "Everything Messmass collects: fan engagement, photo activation volume, opt-in conversion and Fanmass visual intelligence across all events, partners and organizations.",
      organizationId,
    };
  } else if (scopeType === "partner") {
    if (organizationId) {
      partner = await db.collection("partners").findOne({
        organizationId,
        $or: [
          { viewSlug: scopeIdentifier },
          { slug: scopeIdentifier },
          { name: new RegExp(`^${escapeRegex(scopeIdentifier)}$`, "i") },
          ...(ObjectId.isValid(scopeIdentifier) ? [{ _id: new ObjectId(scopeIdentifier) }] : []),
        ],
      });
    } else {
      partner = await findPartnerByIdentifier(db as any, scopeIdentifier);
    }

    if (!partner) {
      return {
        scopeType,
        identifier: scopeIdentifier,
        organizationId,
        resolvedEventIds: [],
        scopeMetadata: {
          title: `Partner: ${scopeIdentifier}`,
          description: "Partner not found.",
          totalEvents: 0,
        },
        partner: null,
        campaignProjects: [],
        scopeHeader: {
          type: "partner",
          id: scopeIdentifier,
          name: scopeIdentifier,
          viewSlug: scopeIdentifier,
          emoji: "🛡️",
          subtitle: `Partner not found.`,
          organizationId,
        },
      };
    }

    const partnerId = partner._id;
    const partnerIdStr = String(partner._id);

    const partnerProjectFilter: any = {
      $or: [
        { partner1Id: partnerId },
        { partner2Id: partnerId },
        { partner1Id: partnerIdStr },
        { partner2Id: partnerIdStr },
        { partner1: partnerId },
        { partner2: partnerId },
        { partner1: partnerIdStr },
        { partner2: partnerIdStr },
      ],
    };
    if (organizationId) {
      partnerProjectFilter.organizationId = organizationId;
    }

    campaignProjects = await db
      .collection("projects")
      .find(partnerProjectFilter)
      .sort({ eventDate: 1 })
      .toArray();

    scopeHeader = {
      type: "partner",
      id: String(partner._id),
      name: partner.name,
      viewSlug: partner.viewSlug || scopeIdentifier,
      emoji: partner.emoji || "🛡️",
      subtitle: `Official Partner Engagement & Activation Report for ${partner.name}.`,
      organizationId: partner.organizationId ? String(partner.organizationId) : organizationId,
    };
  } else {
    // Event scope
    let project = null;
    const eventFilter: any = {};
    if (ObjectId.isValid(scopeIdentifier)) {
      eventFilter._id = new ObjectId(scopeIdentifier);
    } else {
      eventFilter.slug = scopeIdentifier;
    }
    if (organizationId) {
      eventFilter.organizationId = organizationId;
    }

    project = await db.collection("projects").findOne(eventFilter);

    if (!project) {
      return {
        scopeType,
        identifier: scopeIdentifier,
        organizationId,
        resolvedEventIds: [],
        scopeMetadata: {
          title: `Event: ${scopeIdentifier}`,
          description: "Event not found.",
          totalEvents: 0,
        },
        partner: null,
        campaignProjects: [],
        scopeHeader: {
          type: "event",
          id: scopeIdentifier,
          name: scopeIdentifier,
          viewSlug: scopeIdentifier,
          emoji: "🏟️",
          subtitle: `Event not found.`,
          organizationId,
        },
      };
    }

    campaignProjects = [project];
    scopeHeader = {
      type: "event",
      id: String(project._id),
      name: project.eventName || "Event Analytics Report",
      viewSlug: project.slug || scopeIdentifier,
      emoji: "🏟️",
      subtitle: `Match telemetry, photo activation, and attendee demographics for ${project.eventName}.`,
      organizationId: project.organizationId ? String(project.organizationId) : organizationId,
    };
  }

  return {
    scopeType,
    identifier: scopeIdentifier,
    organizationId,
    resolvedEventIds: campaignProjects.map((p: any) => String(p._id)),
    scopeMetadata: {
      title: scopeHeader.name,
      description: scopeHeader.subtitle,
      partnerId: partner ? String(partner._id) : undefined,
      hashtag: scopeType === "hashtag" ? scopeIdentifier : undefined,
      totalEvents: campaignProjects.length,
    },
    partner,
    campaignProjects,
    scopeHeader,
  };
}
