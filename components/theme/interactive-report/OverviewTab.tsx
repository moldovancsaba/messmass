'use client';
/* eslint-disable react/forbid-dom-props */

import React, { useState, useMemo } from 'react';
import { InteractiveReportData } from './types';
import D3TimelineScrubber from './D3TimelineScrubber';
import ExecutiveHeroKpis from './ExecutiveHeroKpis';
import ExecutivePodiumGrid, { ClubPodiumStat, CommercialBrandStat } from './ExecutivePodiumGrid';
import ExecutiveDemographicsQuadrant from './ExecutiveDemographicsQuadrant';
import ConnectedSelfiesModal from './ConnectedSelfiesModal';
import BrandDetailModal from './BrandDetailModal';
import AllBrandsModal from './AllBrandsModal';
import AllClubsModal from './AllClubsModal';
import {
  getFranchiseInfo,
  isSportFranchise,
  isVenue,
  canonicalizeClub,
  isGenericVisionDescription,
} from '@/lib/brandEntityClustering';
import { getReportSlug } from './reportSlug';
import styles from './interactive-report.module.css';

interface OverviewTabProps {
  data: InteractiveReportData;
  selectedPeriodId: string | null;
  onSelectPeriod: (id: string | null) => void;
  onViewBubble: () => void;
  onViewFunnel: () => void;
  onViewTerritoryMap?: () => void;
}

const SPORT_ICONS: Record<string, string> = {
  Football: '⚽',
  'Ice Hockey': '🏒',
  Basketball: '🏀',
  Handball: '🤾',
};

const SPORT_COLORS: Record<string, string> = {
  Football: '#059669',
  'Ice Hockey': '#0284c7',
  Basketball: '#b45309',
  Handball: '#e11d48',
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
}: OverviewTabProps) {
  const { summary, sports, timeline, vision } = data;

  // Active sport filter state for Executive View drill-down
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [selectedClubForModal, setSelectedClubForModal] = useState<ClubPodiumStat | null>(null);
  const [selectedBrandForModal, setSelectedBrandForModal] = useState<CommercialBrandStat | null>(null);
  const [isAllBrandsOpen, setIsAllBrandsOpen] = useState(false);
  const [isAllClubsOpen, setIsAllClubsOpen] = useState(false);

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

  const reportSlug = getReportSlug(data);
  const scopeName = data.scope?.name || data.partner.name || '';

  // Distinct venue names of this scope's events, in order of appearance.
  const venues = useMemo(() => {
    const seen = new Set<string>();
    for (const match of data.matches || []) {
      const venue = (match.venue || '').trim();
      if (venue) seen.add(venue);
    }
    return Array.from(seen);
  }, [data.matches]);

  // Strict separation: Filter commercial brands vs sports clubs
  const filteredBrands = useMemo(() => {
    const rawBrands = (!isAll && activeSportBreakdown?.topBrands && activeSportBreakdown.topBrands.length > 0)
      ? activeSportBreakdown.topBrands
      : (vision?.aggregates?.topBrands || []);
    return rawBrands.filter((b) => {
      if (!b.brand || b.count <= 0) return false;
      return !isSportFranchise(b.brand) && !isVenue(b.brand);
    });
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
          EXECUTIVE DASHBOARD SECTION
          Features:
          1. Hero KPI band with sport switcher (only cards with stored data)
          2. Dual podiums (#1 Gold, #2 Silver, #3 Bronze) for brands and clubs (vision data only)
          3. Demographics quadrant + geographic map launcher
          4. Interactive connected selfies modal drill-down
          ========================================================================= */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* 1. Header & Hero KPI Band */}
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
        />

        {/* 2. Dual Podiums: Commercial Brands vs Clubs & Competitions (vision scopes only) */}
        {vision && (
          <ExecutivePodiumGrid
            brands={filteredBrands}
            clubs={filteredClubs}
            totalPhotosProcessed={analyzedImages ?? 0}
            onSelectClub={(club) => setSelectedClubForModal(club)}
            onSelectBrand={(brand) => setSelectedBrandForModal(brand)}
            onViewAllBrands={() => setIsAllBrandsOpen(true)}
            onViewAllClubs={() => setIsAllClubsOpen(true)}
          />
        )}

        {/* 3. Demographics, expressions, merchandise & territory card: each part hides without data */}
        <ExecutiveDemographicsQuadrant
          genders={currentGenders}
          ageGroups={currentAgeGroups}
          totalPeople={fanAppearances}
          topEmotions={vision?.aggregates?.topEmotions || []}
          merchandise={vision?.aggregates?.merchandise}
          venues={venues}
          reportSlug={reportSlug}
          onViewTerritoryMap={onViewTerritoryMap}
        />
      </div>

      {/* Connected Selfies Modal (Launched when any club in the podium or list is clicked) */}
      <ConnectedSelfiesModal
        club={selectedClubForModal}
        onClose={() => setSelectedClubForModal(null)}
      />

      {/* Brand Detail Modal (Launched when any brand is clicked) */}
      <BrandDetailModal
        brand={selectedBrandForModal}
        totalPhotosProcessed={analyzedImages ?? 0}
        recentImages={vision?.recentImages || []}
        onClose={() => setSelectedBrandForModal(null)}
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
                  style={{ background: SPORT_COLORS[s.sport] || '#64748b' }}
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
    </div>
  );
}
