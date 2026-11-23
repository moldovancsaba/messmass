'use client';

import React, { useState } from 'react';
import { CommercialBrandStat, ClubPodiumStat } from './ExecutivePodiumGrid';
import styles from './interactive-report.module.css';

export interface ExecutiveBentoGridProps {
  scopeName: string;
  eventsCount: number;
  totalPhotos: number;
  analyzedImages: number | null;
  fanAppearances: number | null;
  registeredFans: number | null;
  resolvedOptIns: number;
  resolvedRegistered: number;
  resolvedCtaClicks: number;
  optInRate: number | null;
  vettingApprovalRate: number | null;
  genders: {
    male: number;
    female: number;
    malePct: number;
    femalePct: number;
  } | null;
  ageGroups: {
    children: number;
    teens: number;
    adults: number;
    seniors: number;
  } | null;
  brands: CommercialBrandStat[];
  clubs: ClubPodiumStat[];
  indoorMatchesCount?: number;
  outdoorMatchesCount?: number;
  totalVenueCapacity?: number;
  totalGateAttendance?: number;
  topEmotions?: Array<{ emotion: string; count: number }>;
  onSelectBrand: (brand: CommercialBrandStat) => void;
  onSelectClub: (club: ClubPodiumStat) => void;
  onViewAllBrands: () => void;
  onViewAllClubs: () => void;
  onViewFunnel: () => void;
  onViewTerritoryMap: () => void;
}

export default function ExecutiveBentoGrid({
  scopeName,
  eventsCount,
  totalPhotos,
  analyzedImages,
  fanAppearances,
  registeredFans,
  resolvedOptIns,
  resolvedRegistered,
  resolvedCtaClicks,
  optInRate,
  vettingApprovalRate,
  genders,
  ageGroups,
  brands,
  clubs,
  indoorMatchesCount = 0,
  outdoorMatchesCount = 0,
  totalVenueCapacity = 0,
  totalGateAttendance = 0,
  topEmotions = [],
  onSelectBrand,
  onSelectClub,
  onViewAllBrands,
  onViewAllClubs,
  onViewFunnel,
  onViewTerritoryMap,
}: ExecutiveBentoGridProps) {
  const [rankingTab, setRankingTab] = useState<'brands' | 'clubs'>(
    brands.length > 0 ? 'brands' : 'clubs'
  );

  // Audience calculations
  const genderTotal = genders ? genders.male + genders.female : 0;
  const malePct = genders ? genders.malePct : 0;
  const femalePct = genders ? genders.femalePct : 0;

  const ageRows = ageGroups
    ? [
        { label: 'Children', count: ageGroups.children },
        { label: 'Teenagers', count: ageGroups.teens },
        { label: 'Adults', count: ageGroups.adults },
        { label: 'Seniors', count: ageGroups.seniors },
      ]
    : [];
  const ageTotal = ageRows.reduce((sum, r) => sum + r.count, 0);

  // Funnel calculations
  const stage1Val = analyzedImages ?? totalPhotos;
  const stage2Val = fanAppearances ?? registeredFans ?? 0;
  const stage3Val = resolvedOptIns;
  const computedOptInPct =
    optInRate !== null
      ? optInRate
      : resolvedRegistered > 0 && resolvedOptIns > 0 && resolvedOptIns <= resolvedRegistered
        ? Math.round((resolvedOptIns / resolvedRegistered) * 1000) / 10
        : null;

  // Brand Protection / Consent calculations
  const hasVetting = vettingApprovalRate !== null;
  const refusedPct = hasVetting ? Math.max(0, Math.round((100 - vettingApprovalRate) * 10) / 10) : 0;
  const consentPct =
    resolvedRegistered > 0 && resolvedOptIns > 0
      ? Math.min(100, Math.round((resolvedOptIns / resolvedRegistered) * 1000) / 10)
      : null;

  // Rankings (Brands / Clubs)
  const sortedBrands = [...brands].sort((a, b) => b.count - a.count);
  const sortedClubs = [...clubs].sort((a, b) => b.count - a.count);
  const activeItems =
    rankingTab === 'brands'
      ? sortedBrands.map((b) => ({ key: b.brand, name: b.brand, count: b.count, rawBrand: b, rawClub: null }))
      : sortedClubs.map((c) => ({ key: c.club, name: c.club, count: c.count, rawBrand: null, rawClub: c }));

  // Location / Atmosphere split
  const totalVenueCoded = indoorMatchesCount + outdoorMatchesCount;
  const indoorPct = totalVenueCoded > 0 ? Math.round((indoorMatchesCount / totalVenueCoded) * 1000) / 10 : 0;
  const outdoorPct = totalVenueCoded > 0 ? Math.round((outdoorMatchesCount / totalVenueCoded) * 1000) / 10 : 0;
  const topEmotion = topEmotions[0] ?? null;

  // Commercial & Merchandise
  const topCommercialBrands = sortedBrands.slice(0, 4);
  const maxCommercialCount = topCommercialBrands[0]?.count || 1;
  const topClubsList = sortedClubs.slice(0, 4);
  const maxClubCount = topClubsList[0]?.count || 1;

  return (
    <section className={styles.bentoGrid} aria-label={`${scopeName} executive bento overview`}>
      {/* 1. AUDIENCE COMPOSITION */}
      <article className={`${styles.bentoPanel} ${styles.bentoAudience}`}>
        <header className={styles.bentoPanelHeader}>
          <div className={styles.bentoPanelTitle}>
            <span className={styles.bentoPanelIcon} aria-hidden="true">👥</span>
            <h2 className={styles.gdsCardTitle}>Audience Demographics</h2>
          </div>
          <span className={styles.bentoPanelStatus}>
            {genderTotal > 0 ? `${genderTotal.toLocaleString()} faces` : 'No face sample'}
          </span>
        </header>
        <div className={styles.bentoPanelBody}>
          <p className={styles.bentoBenefit}>
            Shows the age and gender of fans in your photos so sponsors can tailor campaigns to the right audience.
          </p>
          {genders && genderTotal > 0 ? (
            <div className={styles.bentoDonutMajor}>
              <div className={styles.bentoDonut}>
                <svg viewBox="0 0 42 42" className={styles.donutSvg} aria-hidden="true">
                  <circle cx="21" cy="21" r="15.9155" className={styles.donutTrack} />
                  <circle
                    cx="21"
                    cy="21"
                    r="15.9155"
                    className={styles.donutArcPrimary}
                    strokeDasharray={`${malePct} ${Math.max(0, 100 - malePct)}`}
                  />
                </svg>
                <div className={styles.bentoDonutCenter}>
                  <strong className={`${styles.gdsCardTitle} ${styles.gdsNum}`}>{malePct}%</strong>
                  <span className={styles.gdsCaption}>Male</span>
                </div>
              </div>
              <div className={styles.bentoLegend}>
                <div className={styles.bentoLegendRow}>
                  <span className={styles.bentoLegendDotPrimary} />
                  <div>
                    <div className={`${styles.gdsCardTitle} ${styles.gdsNum}`}>{malePct}%</div>
                    <div className={styles.gdsCaption}>Male ({genders.male.toLocaleString()})</div>
                  </div>
                </div>
                <div className={styles.bentoLegendRow}>
                  <span className={styles.bentoLegendDotMuted} />
                  <div>
                    <div className={`${styles.gdsCardTitle} ${styles.gdsNum}`}>{femalePct}%</div>
                    <div className={styles.gdsCaption}>Female ({genders.female.toLocaleString()})</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.gdsCaption}>No gender classifications measured in this scope.</div>
          )}

          {ageTotal > 0 && (
            <>
              <div className={styles.bentoSubhead}>
                <strong className={styles.gdsCaption}>Age groups</strong>
                <span className={styles.gdsCaption}>{ageTotal.toLocaleString()} samples</span>
              </div>
              <div className={styles.bentoBarList}>
                {ageRows.map((row) => {
                  const pct = Math.round((row.count / ageTotal) * 1000) / 10;
                  return (
                    <div key={row.label} className={styles.bentoBarRow}>
                      <span className={styles.gdsCaption}>{row.label}</span>
                      <div className={styles.bentoBarTrackWrap}>
                        <svg viewBox="0 0 100 8" preserveAspectRatio="none" className={styles.bentoBarSvg} aria-hidden="true">
                          <rect x="0" y="0" width={Math.max(2, pct)} height="8" rx="0" className={styles.bentoBarFillRect} />
                        </svg>
                      </div>
                      <span className={`${styles.gdsCaption} ${styles.gdsNum}`}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
          <div className={styles.bentoFootnote}>
            Model classifications, not attendance demographics.
          </div>
        </div>
      </article>

      {/* 2. ACTIVATION & FUNNEL */}
      <article className={`${styles.bentoPanel} ${styles.bentoActivation}`}>
        <header className={styles.bentoPanelHeader}>
          <div className={styles.bentoPanelTitle}>
            <span className={styles.bentoPanelIcon} aria-hidden="true">📈</span>
            <h2 className={styles.gdsCardTitle}>Fan Journey: Attendance to Opt-In</h2>
          </div>
          <span className={styles.bentoPanelStatus}>
            {eventsCount > 0 ? `${eventsCount} ${eventsCount === 1 ? 'match' : 'matches'}` : 'Scope'}
          </span>
        </header>
        <div className={styles.bentoPanelBody}>
          <p className={styles.bentoBenefit}>
            Pinpoints where fans drop off between attending a match, taking a photo, and opting in to hear from you.
          </p>
          {totalVenueCapacity > 0 && totalGateAttendance > 0 ? (
            <div className={styles.bentoFunnelSteps}>
              <div className={styles.bentoFunnelStage}>
                <div className={styles.bentoFunnelInfo}>
                  <span className={styles.bentoFunnelTitle}>Stadium capacity</span>
                  <span className={styles.bentoFunnelSub}>Nominal seat inventory</span>
                </div>
                <strong className={styles.bentoFunnelVal}>{totalVenueCapacity.toLocaleString()}</strong>
              </div>
              <div className={`${styles.bentoFunnelStage} ${styles.bentoFunnelStage2}`}>
                <div className={styles.bentoFunnelInfo}>
                  <span className={styles.bentoFunnelTitle}>Gate attendance</span>
                  <span className={styles.bentoFunnelSub}>
                    {Math.round((totalGateAttendance / totalVenueCapacity) * 1000) / 10}% utilization
                  </span>
                </div>
                <strong className={styles.bentoFunnelVal}>{totalGateAttendance.toLocaleString()}</strong>
              </div>
              <div className={`${styles.bentoFunnelStage} ${styles.bentoFunnelStage3}`}>
                <div className={styles.bentoFunnelInfo}>
                  <span className={styles.bentoFunnelTitle}>Photo audience</span>
                  <span className={styles.bentoFunnelSub}>
                    {stage2Val > 0 && totalGateAttendance > 0
                      ? `${Math.round((stage2Val / totalGateAttendance) * 1000) / 10}% photo participation`
                      : 'Detected fans'}
                  </span>
                </div>
                <strong className={styles.bentoFunnelVal}>
                  {stage2Val > 0 ? stage2Val.toLocaleString() : 'n/a'}
                </strong>
              </div>
              <div className={`${styles.bentoFunnelStage} ${styles.bentoFunnelStage4}`}>
                <div className={styles.bentoFunnelInfo}>
                  <span className={styles.bentoFunnelTitle}>Image usage rights</span>
                  <span className={styles.bentoFunnelSub}>Consented photos</span>
                </div>
                <strong className={styles.bentoFunnelVal}>
                  {resolvedRegistered > 0 ? resolvedRegistered.toLocaleString() : 'n/a'}
                </strong>
              </div>
              <div className={`${styles.bentoFunnelStage} ${styles.bentoFunnelStage5}`}>
                <div className={styles.bentoFunnelInfo}>
                  <span className={styles.bentoFunnelTitle}>Marketing opt-ins</span>
                  <span className={styles.bentoFunnelSub}>
                    {computedOptInPct !== null ? `${computedOptInPct}% opt-in rate` : 'Consented leads'}
                  </span>
                </div>
                <strong className={styles.bentoFunnelVal}>
                  {stage3Val > 0 ? stage3Val.toLocaleString() : 'n/a'}
                </strong>
              </div>
            </div>
          ) : (
            <div className={styles.bentoFunnelSteps}>
              <div className={styles.bentoFunnelStage}>
                <div className={styles.bentoFunnelInfo}>
                  <span className={styles.bentoFunnelTitle}>Photos captured</span>
                  <span className={styles.bentoFunnelSub}>Submitted &amp; analyzed</span>
                </div>
                <strong className={styles.bentoFunnelVal}>
                  {stage1Val > 0 ? stage1Val.toLocaleString() : 'n/a'}
                </strong>
              </div>
              <div className={`${styles.bentoFunnelStage} ${styles.bentoFunnelStage2}`}>
                <div className={styles.bentoFunnelInfo}>
                  <span className={styles.bentoFunnelTitle}>People engaged</span>
                  <span className={styles.bentoFunnelSub}>
                    {fanAppearances !== null ? 'Face appearances' : 'Registered fans'}
                  </span>
                </div>
                <strong className={styles.bentoFunnelVal}>
                  {stage2Val > 0 ? stage2Val.toLocaleString() : 'n/a'}
                </strong>
              </div>
              <div className={`${styles.bentoFunnelStage} ${styles.bentoFunnelStage3}`}>
                <div className={styles.bentoFunnelInfo}>
                  <span className={styles.bentoFunnelTitle}>Marketing opt-ins</span>
                  <span className={styles.bentoFunnelSub}>Consented leads</span>
                </div>
                <strong className={styles.bentoFunnelVal}>
                  {stage3Val > 0 ? stage3Val.toLocaleString() : 'n/a'}
                </strong>
              </div>
            </div>
          )}

          <div className={styles.bentoFunnelSummary}>
            <span className={styles.gdsCaption}>
              {computedOptInPct !== null ? 'Opt-in conversion' : 'Conversion drill-down'}
            </span>
            <button type="button" onClick={onViewFunnel} className={styles.actionLinkBtn}>
              {computedOptInPct !== null ? `${computedOptInPct}% · Details →` : 'Open Funnel →'}
            </button>
          </div>
        </div>
      </article>

      {/* 3. BRAND PROTECTION & CONSENT */}
      <article className={`${styles.bentoPanel} ${styles.bentoProtection}`}>
        <header className={styles.bentoPanelHeader}>
          <div className={styles.bentoPanelTitle}>
            <span className={styles.bentoPanelIcon} aria-hidden="true">🛡️</span>
            <h2 className={styles.gdsCardTitle}>Image Rights Consent</h2>
          </div>
          <span className={styles.bentoPanelStatus}>
            {hasVetting ? 'Moderation' : 'Consent check'}
          </span>
        </header>
        <div className={styles.bentoPanelBody}>
          <p className={styles.bentoBenefit}>
            Confirms fans accepted privacy terms and image rights so you can safely reuse photos in marketing.
          </p>
          {hasVetting ? (
            <div className={styles.bentoDonutMajor}>
              <div className={styles.bentoDonut}>
                <svg viewBox="0 0 42 42" className={styles.donutSvg} aria-hidden="true">
                  <circle cx="21" cy="21" r="15.9155" className={styles.donutTrack} />
                  <circle
                    cx="21"
                    cy="21"
                    r="15.9155"
                    className={styles.donutArcSuccess}
                    strokeDasharray={`${vettingApprovalRate} ${Math.max(0, 100 - vettingApprovalRate)}`}
                  />
                </svg>
                <div className={styles.bentoDonutCenter}>
                  <strong className={`${styles.gdsCardTitle} ${styles.gdsNum}`}>{vettingApprovalRate}%</strong>
                  <span className={styles.gdsCaption}>Approved</span>
                </div>
              </div>
              <div className={styles.bentoLegend}>
                <div className={styles.bentoLegendRow}>
                  <span className={styles.bentoLegendDotSuccess} />
                  <div>
                    <div className={`${styles.gdsCardTitle} ${styles.gdsNum}`}>{vettingApprovalRate}%</div>
                    <div className={styles.gdsCaption}>Approved</div>
                  </div>
                </div>
                <div className={styles.bentoLegendRow}>
                  <span className={styles.bentoLegendDotMuted} />
                  <div>
                    <div className={`${styles.gdsCardTitle} ${styles.gdsNum}`}>{refusedPct}%</div>
                    <div className={styles.gdsCaption}>Refused</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.bentoConsentList}>
              <div className={styles.bentoConsentRow}>
                <div className={styles.bentoConsentHead}>
                  <span className={styles.gdsCardTitle}>Marketing Opt-In</span>
                  <strong className={`${styles.gdsCardTitle} ${styles.gdsNum}`}>
                    {consentPct !== null ? `${consentPct}%` : 'n/a'}
                  </strong>
                </div>
                <div className={styles.gdsCaption}>
                  {resolvedRegistered > 0
                    ? `${resolvedOptIns.toLocaleString()} of ${resolvedRegistered.toLocaleString()} records`
                    : `${resolvedOptIns.toLocaleString()} opted in`}
                </div>
                {consentPct !== null && (
                  <div className={styles.bentoBarTrackWrap}>
                    <svg viewBox="0 0 100 8" preserveAspectRatio="none" className={styles.bentoBarSvg} aria-hidden="true">
                      <rect x="0" y="0" width={Math.max(2, consentPct)} height="8" rx="0" className={styles.bentoBarFillTeal} />
                    </svg>
                  </div>
                )}
              </div>

              {resolvedCtaClicks > 0 && (
                <div className={styles.bentoConsentRow}>
                  <div className={styles.bentoConsentHead}>
                    <span className={styles.gdsCardTitle}>Link Clicks</span>
                    <strong className={`${styles.gdsCardTitle} ${styles.gdsNum}`}>
                      {resolvedCtaClicks.toLocaleString()}
                    </strong>
                  </div>
                  <div className={styles.gdsCaption}>
                    {resolvedRegistered > 0
                      ? `${Math.round((resolvedCtaClicks / resolvedRegistered) * 1000) / 10}% click-through`
                      : 'Sponsor portal interactions'}
                  </div>
                </div>
              )}
            </div>
          )}
          <div className={styles.bentoFootnote}>
            Consent and moderation counts are shown with exact source denominators.
          </div>
        </div>
      </article>

      {/* 4. TOP DETECTIONS / RANKINGS */}
      <article className={`${styles.bentoPanel} ${styles.bentoRankings}`}>
        <header className={styles.bentoPanelHeader}>
          <div className={styles.bentoPanelTitle}>
            <span className={styles.bentoPanelIcon} aria-hidden="true">🏆</span>
            <h2 className={styles.gdsCardTitle}>Sponsor Brands &amp; Clubs</h2>
          </div>
          {sortedBrands.length > 0 && sortedClubs.length > 0 && (
            <div className={styles.bentoToggle} role="tablist" aria-label="Ranking type">
              <button
                type="button"
                role="tab"
                aria-selected={rankingTab === 'brands'}
                onClick={() => setRankingTab('brands')}
                className={`${styles.bentoToggleBtn} ${rankingTab === 'brands' ? styles.bentoToggleBtnActive : ''}`}
              >
                Brands
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={rankingTab === 'clubs'}
                onClick={() => setRankingTab('clubs')}
                className={`${styles.bentoToggleBtn} ${rankingTab === 'clubs' ? styles.bentoToggleBtnActive : ''}`}
              >
                Clubs
              </button>
            </div>
          )}
        </header>
        <div className={styles.bentoPanelBody}>
          <p className={styles.bentoBenefit}>
            Ranks the sponsors and teams seen most often in fan photos, proving real matchday visibility.
          </p>
          {activeItems.length >= 3 ? (
            <div className={styles.bentoPodiumArea}>
              {[activeItems[1], activeItems[0], activeItems[2]].map((item, idx) => {
                const place = idx === 1 ? 1 : idx === 0 ? 2 : 3;
                const plinthClass =
                  place === 1
                    ? styles.bentoPlinthGold
                    : place === 2
                      ? styles.bentoPlinthSilver
                      : styles.bentoPlinthBronze;
                const handleOpen = () => {
                  if (item.rawBrand) onSelectBrand(item.rawBrand);
                  else if (item.rawClub) onSelectClub(item.rawClub);
                };
                return (
                  <div
                    key={item.key}
                    role="button"
                    tabIndex={0}
                    onClick={handleOpen}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleOpen();
                      }
                    }}
                    className={styles.bentoPodiumUnit}
                  >
                    <div className={`${styles.bentoPlinth} ${plinthClass}`}>
                      <span className={styles.gdsEyebrow}>#{place}</span>
                      <strong className={`${styles.gdsSectionKpi} ${styles.gdsNum}`}>
                        {item.count.toLocaleString()}
                      </strong>
                      <span className={styles.gdsCaption}>{item.name}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : activeItems.length > 0 ? (
            <div
              role="button"
              tabIndex={0}
              onClick={() => {
                const first = activeItems[0];
                if (first.rawBrand) onSelectBrand(first.rawBrand);
                else if (first.rawClub) onSelectClub(first.rawClub);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  const first = activeItems[0];
                  if (first.rawBrand) onSelectBrand(first.rawBrand);
                  else if (first.rawClub) onSelectClub(first.rawClub);
                }
              }}
              className={styles.bentoSummaryStat}
            >
              <span className={styles.gdsEyebrow}>
                {activeItems.length === 1 ? 'ONLY RECORDED' : 'TOP DETECTED'}
              </span>
              <strong className={styles.gdsCardTitle}>{activeItems[0].name}</strong>
              <span className={`${styles.gdsSectionKpi} ${styles.gdsNum}`}>
                {activeItems[0].count.toLocaleString()}
              </span>
              <span className={styles.gdsCaption}>
                {activeItems[0].count === 1 ? 'detection' : 'detections'} · click to inspect
              </span>
            </div>
          ) : (
            <div className={styles.gdsCaption}>No detections counted in this scope.</div>
          )}

          <div className={styles.bentoFootnote}>
            <button
              type="button"
              onClick={rankingTab === 'brands' ? onViewAllBrands : onViewAllClubs}
              className={styles.actionLinkBtn}
            >
              {rankingTab === 'brands'
                ? `View all ${sortedBrands.length} ${sortedBrands.length === 1 ? 'brand' : 'brands'} →`
                : `View all ${sortedClubs.length} ${sortedClubs.length === 1 ? 'club' : 'clubs'} →`}
            </button>
          </div>
        </div>
      </article>

      {/* 5. FAN LOCATION & ATMOSPHERE */}
      <article className={`${styles.bentoPanel} ${styles.bentoLocation}`}>
        <header className={styles.bentoPanelHeader}>
          <div className={styles.bentoPanelTitle}>
            <span className={styles.bentoPanelIcon} aria-hidden="true">📍</span>
            <h2 className={styles.gdsCardTitle}>Venue Type &amp; Fan Sentiment</h2>
          </div>
          <button type="button" onClick={onViewTerritoryMap} className={styles.actionLinkBtn}>
            Map →
          </button>
        </header>
        <div className={styles.bentoPanelBody}>
          <p className={styles.bentoBenefit}>
            Shows whether photos come from indoor arenas or outdoor stadiums alongside the crowd mood.
          </p>
          {totalVenueCoded > 0 ? (
            <div className={styles.bentoDonutMajor}>
              <div className={styles.bentoDonut}>
                <svg viewBox="0 0 42 42" className={styles.donutSvg} aria-hidden="true">
                  <circle cx="21" cy="21" r="15.9155" className={styles.donutTrack} />
                  <circle
                    cx="21"
                    cy="21"
                    r="15.9155"
                    className={styles.donutArcPrimary}
                    strokeDasharray={`${indoorPct} ${Math.max(0, 100 - indoorPct)}`}
                  />
                </svg>
                <div className={styles.bentoDonutCenter}>
                  <strong className={`${styles.gdsCardTitle} ${styles.gdsNum}`}>{indoorPct}%</strong>
                  <span className={styles.gdsCaption}>Indoor</span>
                </div>
              </div>
              <div className={styles.bentoLegend}>
                <div className={styles.bentoLegendRow}>
                  <span className={styles.bentoLegendDotPrimary} />
                  <div>
                    <div className={`${styles.gdsCardTitle} ${styles.gdsNum}`}>{indoorPct}%</div>
                    <div className={styles.gdsCaption}>Indoor ({indoorMatchesCount})</div>
                  </div>
                </div>
                <div className={styles.bentoLegendRow}>
                  <span className={styles.bentoLegendDotMuted} />
                  <div>
                    <div className={`${styles.gdsCardTitle} ${styles.gdsNum}`}>{outdoorPct}%</div>
                    <div className={styles.gdsCaption}>Outdoor ({outdoorMatchesCount})</div>
                  </div>
                </div>
              </div>
            </div>
          ) : topEmotion ? (
            <div className={styles.bentoSummaryStat}>
              <span className={styles.gdsEyebrow}>DOMINANT FAN SENTIMENT</span>
              <strong className={styles.gdsSectionTitle}>{topEmotion.emotion}</strong>
              <span className={styles.gdsCaption}>
                {topEmotion.count.toLocaleString()} face detections
              </span>
            </div>
          ) : (
            <div className={styles.gdsCaption}>No venue environment split recorded in this scope.</div>
          )}
        </div>
      </article>

      {/* 6. COMMERCIAL INTELLIGENCE */}
      <article className={`${styles.bentoPanel} ${styles.bentoCommercial}`}>
        <header className={styles.bentoPanelHeader}>
          <div className={styles.bentoPanelTitle}>
            <span className={styles.bentoPanelIcon} aria-hidden="true">📊</span>
            <h2 className={styles.gdsCardTitle}>Sponsor Brand Visibility</h2>
          </div>
          <span className={styles.bentoPanelStatus}>Brand exposures</span>
        </header>
        <div className={styles.bentoPanelBody}>
          <p className={styles.bentoBenefit}>
            Click any brand to see the real fan photos where its logo appeared—ready-made proof for sponsor renewals.
          </p>
          <div className={styles.bentoCommercialGrid}>
          <div className={styles.bentoBarList}>
            {topCommercialBrands.length > 0 ? (
              topCommercialBrands.map((b) => {
                const pct = Math.round((b.count / maxCommercialCount) * 100);
                return (
                  <div
                    key={b.brand}
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelectBrand(b)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectBrand(b);
                      }
                    }}
                    className={`${styles.bentoBarRow} ${styles.bentoBarRowClickable}`}
                  >
                    <span className={styles.gdsBody}>{b.brand}</span>
                    <div className={styles.bentoBarTrackWrap}>
                      <svg viewBox="0 0 100 8" preserveAspectRatio="none" className={styles.bentoBarSvg} aria-hidden="true">
                        <rect x="0" y="0" width={Math.max(4, pct)} height="8" rx="0" className={styles.bentoBarFillRect} />
                      </svg>
                    </div>
                    <strong className={`${styles.gdsBody} ${styles.gdsNum}`}>{b.count.toLocaleString()}</strong>
                  </div>
                );
              })
            ) : (
              <div className={styles.gdsCaption}>No commercial brands detected yet.</div>
            )}
          </div>
          <div className={styles.bentoCommercialSide}>
            <div className={styles.bentoSummaryStat}>
              <strong className={`${styles.gdsSectionTitle} ${styles.gdsNum}`}>
                {sortedBrands.length.toLocaleString()}
              </strong>
              <span className={styles.gdsCaption}>Distinct brands detected</span>
            </div>
            <div className={styles.bentoSummaryStat}>
              <strong className={`${styles.gdsSectionTitle} ${styles.gdsNum}`}>
                {eventsCount > 0 ? eventsCount.toLocaleString() : 'n/a'}
              </strong>
              <span className={styles.gdsCaption}>Events in portfolio</span>
            </div>
          </div>
        </div>
        </div>
      </article>

      {/* 7. CLUB & APPAREL INTELLIGENCE */}
      <article className={`${styles.bentoPanel} ${styles.bentoMerchandise}`}>
        <header className={styles.bentoPanelHeader}>
          <div className={styles.bentoPanelTitle}>
            <span className={styles.bentoPanelIcon} aria-hidden="true">🛍️</span>
            <h2 className={styles.gdsCardTitle}>Team Merchandise</h2>
          </div>
        </header>
        <div className={styles.bentoPanelBody}>
          <p className={styles.bentoBenefit}>
            Counts jerseys, scarves, and club badges worn by fans—showing which teams drive the strongest merch loyalty.
          </p>
          <div className={styles.bentoMerchGrid}>
          <div className={styles.bentoMerchFeature}>
            <strong className={`${styles.gdsSectionKpi} ${styles.gdsNum}`}>
              {sortedClubs.length.toLocaleString()}
            </strong>
            <span className={styles.gdsCaption}>Club labels</span>
          </div>
          <div className={styles.bentoBarList}>
            {topClubsList.length > 0 ? (
              topClubsList.map((c) => {
                const pct = Math.round((c.count / maxClubCount) * 100);
                return (
                  <div
                    key={c.club}
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelectClub(c)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectClub(c);
                      }
                    }}
                    className={`${styles.bentoBarRow} ${styles.bentoBarRowClickable}`}
                  >
                    <span className={styles.gdsCaption}>{c.club}</span>
                    <div className={styles.bentoBarTrackWrap}>
                      <svg viewBox="0 0 100 8" preserveAspectRatio="none" className={styles.bentoBarSvg} aria-hidden="true">
                        <rect x="0" y="0" width={Math.max(4, pct)} height="8" rx="0" className={styles.bentoBarFillTeal} />
                      </svg>
                    </div>
                    <strong className={`${styles.gdsCaption} ${styles.gdsNum}`}>{c.count.toLocaleString()}</strong>
                  </div>
                );
              })
            ) : (
              <div className={styles.gdsCaption}>No club apparel detections counted.</div>
            )}
          </div>
        </div>
        </div>
      </article>
    </section>
  );
}
