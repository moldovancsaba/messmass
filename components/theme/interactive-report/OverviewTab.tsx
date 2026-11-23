'use client';
/* eslint-disable react/forbid-dom-props */

import React, { useState, useMemo } from 'react';
import { InteractiveReportData } from './types';
import D3TimelineScrubber from './D3TimelineScrubber';
import ExecutiveHeroKpis from './ExecutiveHeroKpis';
import { ClubPodiumStat, CommercialBrandStat } from './ExecutivePodiumGrid';
import ExecutiveBentoGrid from './ExecutiveBentoGrid';
import ConnectedSelfiesModal from './ConnectedSelfiesModal';
import BrandDetailModal from './BrandDetailModal';
import AllBrandsModal from './AllBrandsModal';
import AllClubsModal from './AllClubsModal';
import {
  getFranchiseInfo,
  isSportFranchise,
  isVenue,
  canonicalizeClub,
  mergeBrandVariants,
} from '@/lib/brandEntityClustering';
import StadiumCapacityChart from './StadiumCapacityChart';
import MatchOutcomesChart from './MatchOutcomesChart';
import WeatherTurnoutCorrelationMatrix from './WeatherTurnoutCorrelationMatrix';
import MatchdayAnalyticsSuite from './MatchdayAnalyticsSuite';
import ChartLibraryShowcase from './ChartLibraryShowcase';
import MessmassAlgorithmsSuite from './MessmassAlgorithmsSuite';
import SportsExecutiveInsights from './SportsExecutiveInsights';
import { REPORT_CHART_PALETTE } from '@/lib/theme/interactiveReportPalette';
import styles from './interactive-report.module.css';

const SPORT_COLORS: Record<string, string> = {
  Football: REPORT_CHART_PALETTE.blue,
  'Ice Hockey': REPORT_CHART_PALETTE.teal,
  Basketball: REPORT_CHART_PALETTE.amber,
  Handball: REPORT_CHART_PALETTE.rose,
};

interface OverviewTabProps {
  data: InteractiveReportData;
  selectedPeriodId: string | null;
  onSelectPeriod: (id: string | null) => void;
  onViewBubble: () => void;
  onViewFunnel: () => void;
  onViewTerritoryMap?: () => void;
  onViewMatches?: () => void;
  isFanmass?: boolean;
  primaryColor?: string;
  accentColor?: string;
}

const SPORT_ICONS: Record<string, string> = {
  Football: '⚽',
  'Ice Hockey': '🏒',
  Basketball: '🏀',
  Handball: '🤾',
};

function resolveClubSport(name: string, explicitSport?: string): string {
  if (explicitSport && explicitSport !== 'Multi-Sport') return explicitSport;
  const info = getFranchiseInfo(name);
  if (info && info.sport !== 'Multi-Sport') return info.sport;

  const low = name.toLowerCase();
  if (
    low.includes('sopron') ||
    low.includes('falco') ||
    low.includes('körmend') ||
    low.includes('szolnok') ||
    low.includes('ose lions') ||
    low.includes('kaposvár') ||
    low.includes('atomerőmű')
  ) {
    return 'Basketball';
  }
  if (
    low.includes('fehérvár av19') ||
    low.includes('hockey') ||
    low.includes('jégkorong') ||
    low.includes('bja') ||
    low.includes('mac')
  ) {
    return 'Ice Hockey';
  }
  if (
    low.includes('győri audi') ||
    low.includes('eto kc') ||
    low.includes('rail cargo') ||
    low.includes('szeged') ||
    low.includes('pick') ||
    low.includes('veszprém') ||
    low.includes('veszprem') ||
    low.includes('pler') ||
    low.includes('handball')
  ) {
    return 'Handball';
  }
  if (
    low.includes('ferencváros') ||
    low.includes('fradi') ||
    low.includes('ftc') ||
    low.includes('újpest') ||
    low.includes('fehérvár fc') ||
    low.includes('honvéd') ||
    low.includes('haladás') ||
    low.includes('győr') ||
    low.includes('kozármisleny') ||
    low.includes('dvsc') ||
    low.includes('real madrid') ||
    low.includes('barcelona') ||
    low.includes('boca') ||
    low.includes('celtic') ||
    low.includes('hajduk')
  ) {
    return 'Football';
  }
  return 'Other';
}

export default function OverviewTab({
  data,
  selectedPeriodId,
  onSelectPeriod,
  onViewBubble,
  onViewFunnel,
  onViewTerritoryMap = onViewBubble,
  onViewMatches,
  isFanmass = false,
  primaryColor,
  accentColor,
}: OverviewTabProps) {
  const { summary, sports, timeline, vision } = data;

  // Active sport filter state for Executive View drill-down
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [partnerMatchScope, setPartnerMatchScope] = useState<'home' | 'all'>('home');
  const [selectedClubForModal, setSelectedClubForModal] = useState<ClubPodiumStat | null>(null);
  const [selectedBrandForModal, setSelectedBrandForModal] = useState<CommercialBrandStat | null>(null);
  const [isAllBrandsOpen, setIsAllBrandsOpen] = useState(false);
  const [isAllClubsOpen, setIsAllClubsOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);

  const isPartnerScope = data.scope?.type === 'partner';
  const { homeMatches, awayMatches, hasPartnerHomeAllSplit, scopedMatches } = useMemo(() => {
    const all = data.matches || [];
    if (!isPartnerScope || all.length === 0) {
      return { homeMatches: all, awayMatches: [] as typeof all, hasPartnerHomeAllSplit: false, scopedMatches: all };
    }
    const home = all.filter((m) => m.partnerRole !== 'away');
    const away = all.filter((m) => m.partnerRole === 'away');
    const hasSplit = home.length > 0 && away.length > 0;
    return {
      homeMatches: home,
      awayMatches: away,
      hasPartnerHomeAllSplit: hasSplit,
      scopedMatches: hasSplit && partnerMatchScope === 'home' ? home : all,
    };
  }, [data.matches, isPartnerScope, partnerMatchScope]);

  // Selected period override if active
  const activePeriod = selectedPeriodId ? timeline.find((t) => t.id === selectedPeriodId) : null;

  // Executive slice computation
  const isAll = selectedSport === 'all';
  const activeSportBreakdown =
    !isAll && vision?.aggregates?.sportsBreakdown
      ? vision.aggregates.sportsBreakdown[selectedSport]
      : null;

  // Sports present in the vision data drive the switcher; none means no switcher.
  const sportOptions = useMemo(() => {
    const breakdown = vision?.aggregates?.sportsBreakdown;
    if (!breakdown) return [];
    return Object.entries(breakdown)
      .filter(([, b]) => b.images > 0 || b.people > 0)
      .sort((a, b) => b[1].images - a[1].images)
      .map(([sport]) => sport);
  }, [vision?.aggregates?.sportsBreakdown]);

  // Vision-derived figures are null when this scope has no vision data (n/a, never an estimate).
  const analyzedImages: number | null = vision
    ? activeSportBreakdown
      ? activeSportBreakdown.images
      : vision.processedCount
    : null;

  const fanAppearances: number | null = vision
    ? activeSportBreakdown
      ? activeSportBreakdown.people
      : vision.aggregates?.totalPeople ?? null
    : null;

  const registeredFans = summary.totalRegistered > 0 ? summary.totalRegistered : null;
  const resolvedOptIns = vision?.marketingOptInImages !== undefined
    ? vision.marketingOptInImages
    : Math.max(summary.totalOptIns, vision?.optInImages ?? 0);
  const resolvedRegistered = summary.totalRegistered > 0 ? summary.totalRegistered : (vision?.optInImages ?? 0);
  const resolvedCtaClicks = summary.totalCtaClicks > 0 ? summary.totalCtaClicks : (vision?.ctaClickImages ?? 0);
  const resolvedPhotosProcessed = analyzedImages ?? (summary.totalPhotos > 0 ? summary.totalPhotos : 0);

  const scopeName = data.scope?.name || data.partner.name || '';

  // Strict separation: Filter commercial brands vs sports clubs
  const filteredBrands = useMemo(() => {
    const rawBrands = (!isAll && activeSportBreakdown?.topBrands && activeSportBreakdown.topBrands.length > 0)
      ? activeSportBreakdown.topBrands
      : (vision?.aggregates?.topBrands || []);
    return mergeBrandVariants(rawBrands.filter((b) => {
      if (!b.brand || b.count <= 0) return false;
      return !isSportFranchise(b.brand) && !isVenue(b.brand);
    }));
  }, [isAll, activeSportBreakdown?.topBrands, vision?.aggregates?.topBrands]);

  const filteredClubs = useMemo(() => {
    const rawClubs = vision?.aggregates?.topClubs || [];
    const clubMap = new Map<string, ClubPodiumStat>();
    const partnerIdToKey = new Map<string, string>();

    for (const c of rawClubs) {
      if (!c.club || c.count <= 0) continue;
      const canonical = canonicalizeClub(c.club);
      if (!canonical) continue;

      const canonicalName = canonical.canonicalName;
      const canonicalKey = canonicalName.toLowerCase().trim();
      let targetKey = canonicalKey;
      if (c.partnerId && partnerIdToKey.has(c.partnerId)) {
        targetKey = partnerIdToKey.get(c.partnerId)!;
      }

      const existing = clubMap.get(targetKey);
      if (existing) {
        existing.count += c.count;
        if (!existing.logoUrl && c.logoUrl) existing.logoUrl = c.logoUrl;
        if (!existing.partnerId && c.partnerId) existing.partnerId = c.partnerId;
        if (!existing.partnerName && c.partnerName) existing.partnerName = c.partnerName;
        if (!existing.partnerSlug && c.partnerSlug) existing.partnerSlug = c.partnerSlug;
      } else {
        clubMap.set(targetKey, {
          ...c,
          club: c.partnerName || canonicalName,
          sport: c.sport || canonical.franchise?.sport,
        });
        if (c.partnerId) {
          partnerIdToKey.set(c.partnerId, targetKey);
        }
      }
    }

    const uniqueClubs = Array.from(clubMap.values()).sort((a, b) => b.count - a.count);

    if (isAll) return uniqueClubs;
    return uniqueClubs.filter((c) => {
      const sp = resolveClubSport(c.club, c.sport);
      return sp.toLowerCase() === selectedSport.toLowerCase();
    });
  }, [vision?.aggregates?.topClubs, isAll, selectedSport]);

  // Demographics slice: measured counts only; null when nothing was measured.
  const currentGenders = useMemo(() => {
    const source = activeSportBreakdown?.genders ?? vision?.aggregates?.genders ?? null;
    if (!source) return null;
    const total = source.male + source.female;
    if (total <= 0) return null;
    return {
      male: source.male,
      female: source.female,
      malePct: source.malePct ?? Math.round((source.male / total) * 1000) / 10,
      femalePct: source.femalePct ?? Math.round((source.female / total) * 1000) / 10,
    };
  }, [activeSportBreakdown, vision?.aggregates?.genders]);

  const currentAgeGroups = useMemo(
    () => activeSportBreakdown?.ageGroups ?? vision?.aggregates?.ageGroups ?? null,
    [activeSportBreakdown, vision?.aggregates?.ageGroups]
  );

  // Touchpoint proportions: only computable when at least one touchpoint was recorded.
  const totalTouchpoints =
    summary.touchpoints.social + summary.touchpoints.url + summary.touchpoints.qr;
  const toPct = (count: number) => Math.round((count / totalTouchpoints) * 1000) / 10;
  const socialPct = totalTouchpoints > 0 ? toPct(summary.touchpoints.social) : 0;
  const urlPct = totalTouchpoints > 0 ? toPct(summary.touchpoints.url) : 0;
  const qrPct = totalTouchpoints > 0 ? toPct(summary.touchpoints.qr) : 0;

  const visibleSports = sports.filter((s) => s.matchesCount > 0 || s.photos > 0);

  // Takeaways are sentences built from the stored figures; each one only appears when its data exists.
  const takeaways: Array<{ title: string; text: string }> = [];
  if (summary.optInRate !== null) {
    takeaways.push({
      title: 'Opt-In Conversion',
      text: `${summary.optInRate}% of registered fans opted in to marketing (${summary.totalOptIns.toLocaleString()} of ${summary.totalRegistered.toLocaleString()}).`,
    });
  }
  if (summary.totalPhotos > 0 && summary.hostessPhotos > 0 && summary.selfies > 0) {
    takeaways.push({
      title: 'Photo Sources',
      text: `Hostesses took ${summary.hostessShare}% of the ${summary.totalPhotos.toLocaleString()} photos; fan selfies accounted for ${summary.selfieShare}%.`,
    });
  }
  const topEvents = [...(data.matches || [])]
    .filter((m) => m.submitted > 0)
    .sort((a, b) => b.submitted - a.submitted)
    .slice(0, 3);
  if (topEvents.length > 0) {
    takeaways.push({
      title: 'Highest Photo Volume',
      text: topEvents.map((m) => `${m.cleanName} (${m.submitted.toLocaleString()} photos)`).join(', ') + '.',
    });
  }
  if (summary.vettingApprovalRate !== null) {
    takeaways.push({
      title: 'Photo Vetting',
      text: `${summary.vettingApprovalRate}% of submitted photos were approved in photo vetting.`,
    });
  }

  return (
    <div className={styles.funnelList}>
      {/* =========================================================================
          EXECUTIVE DASHBOARD 6-ACT NARRATIVE FLOW (Important -> Interesting)
          Act 1: Executive Bottom Line & Macro Hero
          Act 2: Audience Conversion Funnel (Venue -> Gate -> Photo -> Opt-in)
          Act 3: Commercial Valuation & Digital Conversion (Sponsor CPL + Pop-up CTR)
          Act 4: Audience DNA & Merch Buying Affinity (Demographics + Merchandise)
          Act 5: Visual Brand Visibility & Club Podiums (Podiums + Photo Proof)
          Act 6: Sporting Context & Environmental Intelligence (Venue & Weather)
          Act 7: Tactical Verification (Timeline Scrubber & Touchpoints)
          ========================================================================= */}
      <div className={styles.suiteStack}>
        {/* ACT 1: Executive Bottom Line (Only in non-Fanmass clicker mode; Fanmass mode uses the unified SzrtHeader KPI strip) */}
        {!isFanmass ? (
          <ExecutiveHeroKpis
            title={scopeName}
            subtitle={data.scope?.subtitle}
            selectedSport={selectedSport}
            onSelectSport={setSelectedSport}
            sportOptions={sportOptions}
            registeredFans={registeredFans}
            analyzedImages={analyzedImages}
            fanAppearances={fanAppearances}
            scopeLabel={scopeName}
            eventCount={summary.totalMatches > 0 ? summary.totalMatches : null}
            isRunning={vision?.status === 'running'}
            lastUpdated={vision?.lastUpdated ?? null}
            matchdayAnalytics={data.matchdayAnalytics}
          />
        ) : sportOptions.length >= 2 ? (
          <div className={`${styles.executiveCard} ${styles.gdsRowBetween}`}>
            <span className={styles.gdsEyebrow}>Filter by Sport</span>
            <div className={styles.gdsRow}>
              {['all', ...sportOptions].map((sport) => {
                const isActive = selectedSport.toLowerCase() === sport.toLowerCase();
                return (
                  <button
                    key={sport}
                    type="button"
                    onClick={() => setSelectedSport(sport)}
                    className={`${styles.sportFilterBtn} ${isActive ? styles.sportFilterBtnActive : ''}`}
                  >
                    {sport === 'all' ? '🏆 All Sports' : `${SPORT_ICONS[sport] || '🏅'} ${sport}`}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* ACT 2: Top Where the Money Is — Executive Bento (Photos, Demographics, Emotions, Brands, Clubs) + Commercial & Media Valuation */}
        <ExecutiveBentoGrid
          scopeName={scopeName}
          eventsCount={summary.totalMatches > 0 ? summary.totalMatches : (scopedMatches.length)}
          totalPhotos={summary.totalPhotos}
          analyzedImages={analyzedImages}
          fanAppearances={fanAppearances}
          registeredFans={registeredFans}
          resolvedOptIns={resolvedOptIns}
          resolvedRegistered={resolvedRegistered}
          resolvedCtaClicks={resolvedCtaClicks}
          optInRate={summary.optInRate}
          vettingApprovalRate={summary.vettingApprovalRate}
          genders={currentGenders}
          ageGroups={currentAgeGroups}
          brands={filteredBrands}
          clubs={filteredClubs}
          indoorMatchesCount={data.matchdayAnalytics?.indoorMatchesCount ?? 0}
          outdoorMatchesCount={data.matchdayAnalytics?.outdoorMatchesCount ?? 0}
          totalVenueCapacity={data.matchdayAnalytics?.totalVenueCapacity ?? 0}
          totalGateAttendance={data.matchdayAnalytics?.totalGateAttendance ?? 0}
          topEmotions={vision?.aggregates?.topEmotions || []}
          onSelectBrand={(brand) => setSelectedBrandForModal(brand)}
          onSelectClub={(club) => setSelectedClubForModal(club)}
          onViewAllBrands={() => setIsAllBrandsOpen(true)}
          onViewAllClubs={() => setIsAllClubsOpen(true)}
          onViewFunnel={onViewFunnel}
          onViewTerritoryMap={onViewTerritoryMap}
        />

        <MessmassAlgorithmsSuite
          data={data}
          fanAppearances={fanAppearances}
          resolvedOptIns={resolvedOptIns}
          resolvedPhotosProcessed={resolvedPhotosProcessed}
          resolvedCtaClicks={resolvedCtaClicks}
          clubsCountSum={filteredClubs.reduce((s, c) => s + c.count, 0)}
          primaryColor={primaryColor}
        />

        {/* ACT 3: Executive Next-Activation Decisions Strip */}
        {(() => {
          const topBrand = [...filteredBrands].sort((a, b) => b.count - a.count)[0] ?? null;
          const topMatch = topEvents[0] ?? null;
          const topMatchShare =
            topMatch && summary.totalPhotos > 0
              ? Math.round((topMatch.submitted / summary.totalPhotos) * 1000) / 10
              : null;

          return (
            <section className={styles.decisionsPanel} aria-label="Next activation decisions">
              <div className={styles.decisionsIdentity}>
                <span className={`${styles.decisionsKicker} ${styles.gdsEyebrow}`}>
                  NEXT ACTIVATION
                </span>
                <span className={`${styles.decisionsHeading} ${styles.gdsCardTitle}`}>
                  Decisions
                </span>
              </div>
              <div className={styles.decisionList}>
                <div className={styles.decisionItem}>
                  <div className={styles.gdsEyebrow}>COMMERCIAL · BRAND EXPOSURE</div>
                  <div className={styles.gdsCardTitle}>
                    {topBrand ? `Review ${topBrand.brand} placement` : 'Run AI Vision brand scan'}
                  </div>
                  <div className={styles.gdsCaption}>
                    {topBrand
                      ? `${topBrand.count.toLocaleString()} AI-detected appearances${analyzedImages ? ` across ${analyzedImages.toLocaleString()} analyzed images` : ''}. Click any brand bar or podium card to inspect sample frames.`
                      : 'No commercial brand logos counted in this scope yet. Process event photos in AI Vision to quantify sponsor exposure.'}
                  </div>
                </div>

                <div className={styles.decisionItem}>
                  <div className={styles.gdsEyebrow}>EVENTS · PHOTO CONCENTRATION</div>
                  <div className={styles.gdsCardTitle}>
                    {topMatch ? `Benchmark ${topMatch.cleanName}` : 'Capture fixture-level volume'}
                  </div>
                  <div className={styles.gdsCaption}>
                    {topMatch
                      ? `${topMatch.submitted.toLocaleString()} submitted photos${topMatchShare !== null ? ` (${topMatchShare}% of scope total)` : ''}. Open the fixture AI report to inspect peak fan activation.`
                      : 'No fixture-level submitted photos recorded in this scope yet.'}
                  </div>
                </div>

                <div className={styles.decisionItem}>
                  <div className={styles.gdsEyebrow}>CONVERSION · OPT-IN FUNNEL</div>
                  <div className={styles.gdsCardTitle}>
                    {summary.optInRate !== null && summary.totalRegistered > 0
                      ? `${summary.optInRate}% marketing opt-in`
                      : 'Track gate-to-opt-in funnel'}
                  </div>
                  <div className={styles.gdsCaption}>
                    {summary.optInRate !== null && summary.totalRegistered > 0
                      ? `${summary.totalOptIns.toLocaleString()} of ${summary.totalRegistered.toLocaleString()} registered fans opted in. Review the Conversion Funnel tab to isolate drop-off stages.`
                      : `${summary.totalPhotos.toLocaleString()} total photos recorded in this scope. Connect registration and opt-in tracking to measure conversion.`}
                  </div>
                </div>
              </div>
            </section>
          );
        })()}

        {/* ACT 3: Analyzed Events & Partner HOME vs ALL Comparison */}
        {isFanmass && scopedMatches.length > 0 && (
          <article className={styles.bentoPanel}>
            <header className={styles.bentoPanelHeader}>
              <div className={styles.bentoPanelTitle}>
                <span className={styles.bentoPanelIcon} aria-hidden="true">📋</span>
                <h2 className={styles.gdsCardTitle}>
                  {hasPartnerHomeAllSplit && partnerMatchScope === 'home'
                    ? `Home fixtures & event reports (${scopedMatches.length})`
                    : `Analyzed fixtures & event reports (${scopedMatches.length})`}
                </h2>
              </div>
              {onViewMatches && scopedMatches.length > 8 && (
                <button
                  type="button"
                  onClick={onViewMatches}
                  className={styles.actionLinkBtn}
                >
                  View All {scopedMatches.length} Events →
                </button>
              )}
            </header>
            <div className={styles.bentoPanelBody}>
              <div className={styles.tableScroll}>
              <table className={styles.tableRoot}>
                <thead>
                  <tr className={styles.tableHeadRow}>
                    <th className={styles.thCell}>Event / Fixture</th>
                    <th className={styles.thCell}>Date</th>
                    <th className={styles.thCell}>Venue</th>
                    <th className={styles.thCell}>Score</th>
                    <th className={styles.thCell}>Attendance</th>
                    <th className={styles.thCell}>Fan Photos</th>
                  </tr>
                </thead>
                <tbody>
                  {[...scopedMatches]
                    .sort((a, b) => (b.submitted ?? 0) - (a.submitted ?? 0) || (b.attendance ?? 0) - (a.attendance ?? 0))
                    .slice(0, 8)
                    .map((m, idx) => {
                    const hasScore = m.homeScore !== null && m.homeScore !== undefined && m.visitorScore !== null && m.visitorScore !== undefined;
                    const hasEventId = Boolean(m.id && /^[a-f0-9]{24}$/i.test(m.id));
                    const teamParts = m.cleanName.split(/\s+[x×#]\s+/i);
                    return (
                      <tr key={m.id || idx} className={`${styles.tableRow} ${idx % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd}`}>
                        <td className={`${styles.thCell} ${styles.matchTitle}`}>
                          {hasEventId ? (
                            <a href={`/interactive-report/event/${m.id}`} className={styles.gdsMatchLink}>
                              <span>{teamParts[0]}</span>
                              {teamParts.length > 1 && (
                                <span className={styles.gdsMatchAway}>vs {teamParts.slice(1).join(' × ')}</span>
                              )}
                            </a>
                          ) : (
                            <>
                              <div>{teamParts[0]}</div>
                              {teamParts.length > 1 && (
                                <div className={styles.gdsMatchAway}>vs {teamParts.slice(1).join(' × ')}</div>
                              )}
                            </>
                          )}
                        </td>
                        <td className={`${styles.thCell} ${styles.gdsNum} ${styles.gdsNowrap}`}>{m.date || '—'}</td>
                        <td className={styles.thCell}>{m.venue || '—'}</td>
                        <td className={`${styles.thCell} ${styles.gdsNum} ${styles.gdsNowrap}`}>{hasScore ? `${m.homeScore} : ${m.visitorScore}` : '—'}</td>
                        <td className={`${styles.thCell} ${styles.gdsNum} ${styles.gdsNowrap}`}>{m.attendance && m.attendance > 0 ? m.attendance.toLocaleString() : '—'}</td>
                        <td className={`${styles.thCell} ${styles.gdsNum} ${styles.gdsNowrap}`}>{m.submitted.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            </div>
          </article>
        )}

        {/* ACT 5: Sporting Context, HOME vs ALL Split & General Statistics (Weather, Trends, Deep-Dive Charts) */}
        {hasPartnerHomeAllSplit && (
          <div className={`${styles.executiveCard} ${styles.gdsRowBetween}`}>
            <span className={styles.gdsEyebrow}>Fixture Scope (Home Primary vs. All incl. Team 2)</span>
            <div className={styles.gdsRow}>
              <button
                type="button"
                onClick={() => setPartnerMatchScope('home')}
                className={`${styles.sportFilterBtn} ${partnerMatchScope === 'home' ? styles.sportFilterBtnActive : ''}`}
              >
                🏠 Home Only ({homeMatches.length})
              </button>
              <button
                type="button"
                onClick={() => setPartnerMatchScope('all')}
                className={`${styles.sportFilterBtn} ${partnerMatchScope === 'all' ? styles.sportFilterBtnActive : ''}`}
              >
                🏟️ All incl. Team 2 ({(data.matches || []).length})
              </button>
            </div>
          </div>
        )}

        {isFanmass && data.matches && data.matches.length > 0 && (
          <SportsExecutiveInsights
            matches={data.matches}
            partnerName={data.partner?.name || scopeName}
            scopeType={data.scope?.type}
            totalPhotosProcessed={resolvedPhotosProcessed}
            totalPeopleDetected={fanAppearances ?? 0}
            totalBrandsDetected={filteredBrands.length}
          />
        )}

        {(data.matchdayAnalytics || scopedMatches.length > 0) && (
          <div className={styles.bentoTwoCol}>
            <StadiumCapacityChart matches={scopedMatches} analytics={partnerMatchScope === 'home' && hasPartnerHomeAllSplit ? undefined : data.matchdayAnalytics} />
            {data.scope?.type !== 'event' && scopedMatches.length > 1 && (
              <MatchOutcomesChart
                matches={scopedMatches}
                scopeType={data.scope?.type}
                partnerName={data.partner?.name || scopeName}
                analytics={partnerMatchScope === 'home' && hasPartnerHomeAllSplit ? undefined : data.matchdayAnalytics}
              />
            )}
          </div>
        )}

        {scopedMatches.length > 0 && (
          <>
            <MatchdayAnalyticsSuite matches={scopedMatches} vision={vision} />
            <ChartLibraryShowcase
              matches={scopedMatches}
              vision={vision}
              brands={filteredBrands}
              clubs={filteredClubs}
              primaryColor={primaryColor}
              accentColor={accentColor}
            />
          </>
        )}

        {scopedMatches.some((m) => m.weather && m.attendance) && (
          <WeatherTurnoutCorrelationMatrix matches={scopedMatches} />
        )}
      </div>

      {/* Connected Selfies Modal (Launched when any club in the podium or list is clicked) */}
      <ConnectedSelfiesModal
        club={selectedClubForModal}
        onClose={() => setSelectedClubForModal(null)}
        cameraProof={vision?.cameraProof}
      />

      {/* Brand Detail Modal (Launched when any brand is clicked) */}
      <BrandDetailModal
        brand={selectedBrandForModal}
        totalPhotosProcessed={analyzedImages ?? 0}
        recentImages={vision?.recentImages || []}
        onClose={() => setSelectedBrandForModal(null)}
        cameraProof={vision?.cameraProof}
      />

      {/* All Brands Directory Modal */}
      <AllBrandsModal
        isOpen={isAllBrandsOpen}
        brands={filteredBrands}
        totalPhotosProcessed={analyzedImages ?? 0}
        onSelectBrand={(b) => {
          setSelectedBrandForModal(b);
          setIsAllBrandsOpen(false);
        }}
        onClose={() => setIsAllBrandsOpen(false)}
      />

      {/* All Clubs Directory Modal */}
      <AllClubsModal
        isOpen={isAllClubsOpen}
        clubs={filteredClubs}
        totalPhotosProcessed={analyzedImages ?? 0}
        onSelectClub={(c) => {
          setSelectedClubForModal(c);
          setIsAllClubsOpen(false);
        }}
        onClose={() => setIsAllClubsOpen(false)}
      />

      {/* Active Period Filter Indicator */}
      {activePeriod && (
        <div className={styles.periodFilterBanner}>
          <div>
            <span className={styles.filterLabel}>
              Active Campaign Period:
            </span>{' '}
            <strong className={styles.filterValue}>{activePeriod.name}</strong>
            <div className={styles.cardSubtitle} style={{ marginTop: '4px' }}>
              📸 {activePeriod.allPhotos.toLocaleString()} Total Photos ({activePeriod.hostessPhotos.toLocaleString()} Hostess • {activePeriod.selfies.toLocaleString()} Selfies) • 👥 {activePeriod.registered.toLocaleString()} Registered{activePeriod.optInRate !== null ? ` (${activePeriod.optInRate}% Opt-in)` : ''}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {activePeriod.slug && (
              <a
                href={`/report/${activePeriod.slug}`}
                target="_blank"
                rel="noreferrer"
                className={styles.resetBtn}
                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                Open Period Report ↗
              </a>
            )}
            <button
              onClick={() => onSelectPeriod(null)}
              className={styles.clearFilterBtn}
            >
              Show All Campaigns ✕
            </button>
          </div>
        </div>
      )}

      {/* D3 Timeline Scrubber */}
      <D3TimelineScrubber
        timeline={timeline}
        selectedPeriodId={selectedPeriodId}
        onSelectPeriod={onSelectPeriod}
      />

      {/* Sports Breakdown Grid: only sports with recorded activity */}
      {visibleSports.length > 0 && (
        <div>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>
              🏆 Photo Activity by Sport
            </h3>
            <button
              onClick={onViewBubble}
              className={styles.actionLinkBtn}
            >
              Explore in Bubble View →
            </button>
          </div>

          <div className={styles.sportsGrid}>
            {visibleSports.map((s) => (
              <div key={s.sport} className={styles.sportCard}>
                <div
                  className={styles.sportTopBar}
                  style={{ background: SPORT_COLORS[s.sport] || REPORT_CHART_PALETTE.slate }}
                />
                <div className={styles.sportHeader}>
                  <span className={styles.sportIcon}>{SPORT_ICONS[s.sport] || '🏅'}</span>
                  <span className={styles.matchesBadge}>
                    {s.matchesCount} {s.matchesCount === 1 ? 'Match' : 'Matches'}
                  </span>
                </div>
                <h4 className={styles.sportName}>
                  {s.sport}
                </h4>
                <div className={styles.sportPhotos}>
                  {s.photos.toLocaleString()} <span className={styles.sportPhotosUnit}>photos</span>
                </div>
                <div className={styles.sportStats}>
                  <strong>{s.approved.toLocaleString()}</strong> approved • <strong>{s.hostessRatio}%</strong> hostess assist
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Discovery Touchpoints & Takeaways: each card only renders with stored data */}
      {(totalTouchpoints > 0 || takeaways.length > 0) && (
        <div className={styles.twoColGrid}>
          {/* Touchpoint Acquisition */}
          {totalTouchpoints > 0 && (
            <div className={styles.reportCard}>
              <h3 className={styles.cardTitle}>
                📱 Fan Acquisition Touchpoints
              </h3>
              <div className={styles.generationList}>
                <div>
                  <div className={styles.generationHeader}>
                    <span>Social Links</span>
                    <strong>
                      {summary.touchpoints.social.toLocaleString()} ({socialPct}%)
                    </strong>
                  </div>
                  <div className={styles.genBarTrack}>
                    <div
                      className={styles.maleBar}
                      style={{ width: `${socialPct}%`, height: '100%' }}
                    />
                  </div>
                </div>

                <div>
                  <div className={styles.generationHeader}>
                    <span>Web URL & Match Links</span>
                    <strong>
                      {summary.touchpoints.url.toLocaleString()} ({urlPct}%)
                    </strong>
                  </div>
                  <div className={styles.genBarTrack}>
                    <div
                      className={styles.genBarFillHighlight}
                      style={{ width: `${urlPct}%`, height: '100%' }}
                    />
                  </div>
                </div>

                <div>
                  <div className={styles.generationHeader}>
                    <span>QR Codes</span>
                    <strong>
                      {summary.touchpoints.qr.toLocaleString()} ({qrPct}%)
                    </strong>
                  </div>
                  <div className={styles.genBarTrack}>
                    <div
                      className={styles.genBarFill}
                      style={{ width: `${qrPct}%`, height: '100%' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Takeaways computed from the report data */}
          {takeaways.length > 0 && (
            <div className={styles.reportCard}>
              <h3 className={styles.cardTitle}>
                🎯 Key Takeaways
              </h3>
              <ul className={styles.cardSubtitle}>
                {takeaways.map((t) => (
                  <li key={t.title}>
                    <strong>{t.title}:</strong> {t.text}
                  </li>
                ))}
              </ul>

              <div className={styles.tableScroll}>
                <button
                  onClick={onViewFunnel}
                  className={styles.actionLinkBtn}
                >
                  Analyze Conversion Funnel →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Methodological Notes & Source Audit Footer */}
      <div className={styles.bentoFooterLine}>
        <p className={styles.gdsCaption}>
          <strong>{scopeName || 'Messmass'}</strong> · Detection counts represent AI-recognized visual occurrences, not unique audience reach or confirmed revenue.
        </p>
        <button
          type="button"
          className={styles.bentoNotesBtn}
          aria-expanded={notesOpen}
          onClick={() => setNotesOpen((v) => !v)}
        >
          <span>Metric definitions</span>
          <span>{notesOpen ? '−' : '+'}</span>
        </button>
      </div>

      {notesOpen && (
        <aside className={styles.bentoNotesDrawer}>
          <h3 className={styles.gdsCardTitle}>Source and measurement definitions</h3>
          <ul className={styles.bentoNotesList}>
            <li>
              <strong>Analyzed images &amp; people detections:</strong>{' '}
              {resolvedPhotosProcessed.toLocaleString()} photos processed
              {fanAppearances !== null ? ` with ${fanAppearances.toLocaleString()} detected face/person appearances` : ''}.
              People detections may include repeated appearances across frames.
            </li>
            <li>
              <strong>Consent &amp; marketing opt-in denominators:</strong>{' '}
              {resolvedRegistered > 0
                ? `${resolvedOptIns.toLocaleString()} opt-ins out of ${resolvedRegistered.toLocaleString()} registered records.`
                : `${resolvedOptIns.toLocaleString()} opt-ins recorded.`}
            </li>
            <li>
              <strong>Sample-based visual classifications:</strong>{' '}
              Gender and age distributions reflect AI-classified face samples in this scope and are not general stadium attendance demographics.
            </li>
          </ul>
        </aside>
      )}
    </div>
  );
}
