'use client';
/* eslint-disable react/forbid-dom-props */

import React, { useEffect, useMemo, useState } from 'react';
import { VisionProgressData } from './types';
import FanmassBrandsMatrix from './FanmassBrandsMatrix';
import FanmassSportsDemographics from './FanmassSportsDemographics';
import FanmassClubsMatrix from './FanmassClubsMatrix';
import FanmassSentimentAtmosphere from './FanmassSentimentAtmosphere';
import TerritoryMapCanvas from './TerritoryMapCanvas';
import { MatchItem } from './types';
import styles from './interactive-report.module.css';

/** A vision run counts as live only while its document was updated within this window. */
const LIVE_WINDOW_MS = 15 * 60 * 1000;

interface FanmassVisionSectionProps {
  vision: VisionProgressData;
  /** Slug the report routes understand (hashtag scopes carry their hashtag- prefix). */
  partnerSlug?: string;
  partnerName?: string;
  compact?: boolean;
  matches?: MatchItem[];
  onExploreDashboard?: () => void;
  onViewTerritoryMap?: () => void;
}

function sportIcon(sport: string): string {
  const low = sport.toLowerCase();
  if (low.includes('foot')) return '⚽';
  if (low.includes('basket')) return '🏀';
  if (low.includes('hockey')) return '🏒';
  if (low.includes('hand')) return '🤾';
  return '🏅';
}

/** Gender split from measured counts; null when nothing was measured. */
function genderView(g?: { male: number; female: number; malePct?: number; femalePct?: number } | null) {
  if (!g) return null;
  const total = g.male + g.female;
  if (total <= 0) return null;
  return {
    malePct: g.malePct ?? Number(((g.male / total) * 100).toFixed(1)),
    femalePct: g.femalePct ?? Number(((g.female / total) * 100).toFixed(1)),
  };
}

export default function FanmassVisionSection({
  vision: initialVision,
  partnerSlug,
  partnerName,
  compact = false,
  matches,
  onExploreDashboard,
  onViewTerritoryMap,
}: FanmassVisionSectionProps) {
  const [vision, setVision] = useState<VisionProgressData>(initialVision);
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  const reportSlug = partnerSlug || null;

  // Keep the clock current so a stalled run stops being shown as live
  useEffect(() => {
    const tick = setInterval(() => setNowMs(Date.now()), 30000);
    return () => clearInterval(tick);
  }, []);

  const lastUpdatedMs = Date.parse(vision.lastUpdated);
  const isRunning =
    vision.status === 'running' &&
    Number.isFinite(lastUpdatedMs) &&
    nowMs - lastUpdatedMs <= LIVE_WINDOW_MS;

  // Poll for live stream updates every 3 seconds while running
  useEffect(() => {
    if (!isRunning || !reportSlug) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/interactive-report/${reportSlug}`);
        if (res.ok) {
          const json = await res.json();
          const liveVision = json.vision || json.data?.vision;
          if (liveVision) {
            setVision((prev) => ({
              ...prev,
              ...liveVision,
              aggregates: {
                ...(prev.aggregates || {}),
                ...(liveVision.aggregates || {}),
              },
            }));
          }
        }
      } catch {
        // Silently continue polling on network jitter
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isRunning, reportSlug]);

  const { aggregates, recentImages } = vision;

  // Sports that actually appear in the data, largest first
  const sportKeys = useMemo(
    () =>
      Object.entries(aggregates.sportsBreakdown || {})
        .filter(([, d]) => d && d.images > 0)
        .sort((a, b) => b[1].images - a[1].images)
        .map(([sport]) => sport),
    [aggregates.sportsBreakdown]
  );

  // Selected sport data slice. A sport with no figure for a block shows n/a, never the overall figure.
  const isAll = selectedSport === 'all';
  const activeSportData = !isAll ? aggregates.sportsBreakdown?.[selectedSport] ?? null : null;

  const displayPeople = isAll ? aggregates.totalPeople : activeSportData?.people ?? null;
  const displayGender = genderView(isAll ? aggregates.genders : activeSportData?.genders);
  const displayAge = isAll ? aggregates.ageGroups : activeSportData?.ageGroups ?? null;

  // Sport-specific brands & emotions
  const displayBrands = isAll ? aggregates.topBrands : activeSportData?.topBrands ?? [];
  const displayBrandCount = isAll
    ? aggregates.topBrands.length
    : activeSportData?.distinctBrandsCount ?? displayBrands.length;

  const displayEmotions = isAll ? aggregates.topEmotions : activeSportData?.topEmotions ?? [];

  // Share of non-neutral emotions among all detected emotions
  const celebrationValence = (() => {
    const totalEmotionsCount = displayEmotions.reduce((acc, e) => acc + e.count, 0);
    if (totalEmotionsCount <= 0) return 'n/a';
    const positiveCount = displayEmotions
      .filter((e) => e.emotion.toLowerCase() !== 'neutral' && e.emotion.toLowerCase() !== 'focused')
      .reduce((acc, e) => acc + e.count, 0);
    return `${((positiveCount / totalEmotionsCount) * 100).toFixed(1)}%`;
  })();

  const filteredRecentImages = isAll
    ? recentImages
    : (recentImages || []).filter((img) => img.sport.toLowerCase() === selectedSport.toLowerCase());

  return (
    <div className={styles.visionCard}>
      {/* Executive Results Banner */}
      <div className={styles.visionHeader}>
        <div className={styles.visionTitleWrap}>
          <div className={styles.visionBeaconRow}>
            <span className={`${styles.liveBeacon} ${isRunning ? styles.liveBeaconActive : ''}`} />
            <span className={styles.liveBadge}>
              {isRunning ? 'FANMASS AI VISION ENGINE • STREAMING' : 'FANMASS VISUAL ANALYTICS'}
            </span>
            {sportKeys.length > 0 && (
              <span className={styles.visionSportChip}>
                {sportKeys.map((sp) => `${sportIcon(sp)} ${sp}`).join(' • ')}
              </span>
            )}
          </div>
          <h2 className={styles.visionTitle}>
            Computer Vision & Fan Intelligence
          </h2>
          <p className={styles.visionSubtitle}>
            Sponsor emblems, apparel brands, age demographics, and fan celebration valence detected in{' '}
            {vision.totalImages <= 0
              ? 'the fan photos'
              : vision.processedCount >= vision.totalImages
                ? `all ${vision.totalImages.toLocaleString()} fan photos`
                : `the ${vision.processedCount.toLocaleString()} of ${vision.totalImages.toLocaleString()} fan photos analysed so far`}.
          </p>
        </div>

        {/* Live Processing Counter */}
        <div className={styles.visionProgressStats}>
          <div className={styles.visionCounterVal}>
            {vision.processedCount.toLocaleString()}{' '}
            <span className={styles.visionCounterTotal}>
              of {vision.totalImages.toLocaleString()}
            </span>
          </div>
          <div className={styles.visionCounterPercent}>
            {vision.percent}% of photos processed
          </div>
          {vision.optInImages !== undefined && (
            <div className={styles.visionCounterPercent}>
              {vision.optInImages.toLocaleString()} of {vision.totalImages.toLocaleString()} photos with a recorded opt-in
            </div>
          )}
        </div>
      </div>

      {/* Subtle Progress Fill */}
      <div className={styles.visionTrack}>
        <div
          className={styles.visionFill}
          style={{ width: `${Math.max(0, Math.min(100, vision.percent))}%` }}
        />
      </div>

      {/* 1. Sport Drilldown Filter */}
      <div className={styles.sportFilterBar}>
        <span className={styles.sportFilterLabel}>
          🏆 Sport Drilldown:
        </span>
        <button
          onClick={() => setSelectedSport('all')}
          className={`${styles.sportFilterBtn} ${
            selectedSport === 'all' ? styles.sportFilterBtnActive : ''
          }`}
        >
          All Sports <span className={styles.sportFilterBadge}>{vision.processedCount}</span>
        </button>
        {sportKeys.map((sp) => {
          const spData = aggregates.sportsBreakdown[sp];
          return (
            <button
              key={sp}
              onClick={() => setSelectedSport(sp)}
              className={`${styles.sportFilterBtn} ${
                selectedSport === sp ? styles.sportFilterBtnActive : ''
              }`}
            >
              {sportIcon(sp)} {sp}{' '}
              {spData && (
                <span className={styles.sportFilterBadge}>{spData.images}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* 4 Pillars Executive KPI Highlights */}
      <div className={styles.visionGrid}>
        {/* KPI 1: People Detected */}
        <div className={styles.visionMiniCard}>
          <div className={styles.miniCardIcon}>👥</div>
          <div className={styles.miniCardTitle}>
            {isAll ? 'People Detected' : `${selectedSport} People`}
          </div>
          <div className={styles.miniCardVal}>
            {displayPeople === null ? 'n/a' : displayPeople.toLocaleString()}
          </div>
          <div className={styles.miniCardSub}>
            {displayGender
              ? `${displayGender.malePct}% Male / ${displayGender.femalePct}% Female`
              : 'n/a'}
          </div>
          <div className={styles.agePillsGroup}>
            {displayAge ? (
              <>
                <span className={styles.agePill}>Adults: {displayAge.adults.toLocaleString()}</span>
                <span className={styles.agePill}>Teens: {displayAge.teens.toLocaleString()}</span>
                <span className={styles.agePill}>Children: {displayAge.children.toLocaleString()}</span>
                <span className={styles.agePill}>Seniors: {displayAge.seniors.toLocaleString()}</span>
              </>
            ) : (
              <span className={styles.agePill}>Age: n/a</span>
            )}
          </div>
        </div>

        {/* KPI 2: Detected Brands & Logos */}
        <div className={styles.visionMiniCard}>
          <div className={styles.miniCardIcon}>🏷️</div>
          <div className={styles.miniCardTitle}>
            {isAll ? 'Detected Brands & Logos' : `${selectedSport} Brands & Logos`}
          </div>
          <div className={styles.miniCardVal}>
            {displayBrandCount} Brands
          </div>
          <div className={styles.miniCardSub}>
            {isAll ? 'Sponsor emblems, kits & arena partner signage' : `Sponsor emblems & kit wear in ${selectedSport}`}
          </div>
          <div className={styles.tagChipsWrap}>
            {displayBrands.slice(0, 5).map((b) => (
              <span key={b.brand} className={styles.brandChip}>
                {b.brand} ({b.count})
              </span>
            ))}
          </div>
        </div>

        {/* KPI 3: Valence & Atmosphere */}
        <div className={styles.visionMiniCard}>
          <div className={styles.miniCardIcon}>😊</div>
          <div className={styles.miniCardTitle}>
            {isAll ? 'Atmosphere & Valence' : `${selectedSport} Atmosphere`}
          </div>
          <div className={styles.miniCardVal}>
            {celebrationValence}
          </div>
          <div className={styles.miniCardSub}>
            {isAll ? 'Share of positive emotions among detected emotions' : `Share of positive emotions in ${selectedSport}`}
          </div>
          <div className={styles.tagChipsWrap}>
            {displayEmotions.slice(0, 4).map((e) => (
              <span key={e.emotion} className={styles.emotionChip}>
                {e.emotion} ({e.count})
              </span>
            ))}
          </div>
        </div>

        {/* KPI 4: Sports covered */}
        <div className={styles.visionMiniCard}>
          <div className={styles.miniCardIcon}>🏆</div>
          <div className={styles.miniCardTitle}>
            {isAll ? 'Sports Covered' : `Active Sport: ${selectedSport}`}
          </div>
          <div className={styles.miniCardVal}>
            {isAll
              ? `${sportKeys.length} ${sportKeys.length === 1 ? 'Sport' : 'Sports'}`
              : `${activeSportData ? activeSportData.images.toLocaleString() : 'n/a'} Photos Analyzed`}
          </div>
          <div className={styles.miniCardSub}>
            {isAll ? sportKeys.join(', ') || 'n/a' : `Photos analysed in ${selectedSport}`}
          </div>
          <div className={styles.tagChipsWrap}>
            {sportKeys.map((sp) => (
              <span
                key={sp}
                className={`${styles.clubChip} ${selectedSport === sp ? styles.brandTagSponsor : ''}`}
              >
                {sportIcon(sp)} {sp}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* View Full Dashboard Call-to-Action for Overview mode, or Full Suite of Visual Analytics Charts */}
      {compact ? (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
          <button
            onClick={onExploreDashboard}
            className={styles.viewFunnelBtn}
            style={{ padding: '12px 24px', fontSize: '13px', borderRadius: '9999px', cursor: 'pointer' }}
          >
            Explore Dedicated Visual Intelligence Dashboard (Brand Logos &amp; Demographics) ➔
          </button>
          {onViewTerritoryMap && (
            <button
              onClick={onViewTerritoryMap}
              className={styles.resetBtn}
              style={{
                padding: '12px 24px',
                fontSize: '13px',
                borderRadius: '9999px',
                cursor: 'pointer',
                borderColor: '#3b82f6',
                color: '#1d4ed8',
                background: '#eff6ff',
                fontWeight: 600,
              }}
            >
              🗺️ Open Interactive Territory &amp; Venues Map ➔
            </button>
          )}
        </div>
      ) : (
        <>
          {/* 1. Brand Exposure & Sponsor Recognition Matrix with Logos */}
          <FanmassBrandsMatrix
            brands={aggregates.topBrands}
            totalPhotosProcessed={vision.processedCount}
          />

          {/* 2. Cross-Sport Demographics & Age Comparison (with Side-by-Side Unified View) */}
          <FanmassSportsDemographics
            sportsBreakdown={aggregates.sportsBreakdown}
            totalPeople={aggregates.totalPeople}
          />

          {/* 3. Club Allegiance & Fan Jersey Detection Matrix */}
          <FanmassClubsMatrix
            clubs={aggregates.topClubs || []}
            totalPhotosProcessed={vision.processedCount}
          />

          {/* 4. Fan Sentiment & Stadium Atmosphere Index */}
          <FanmassSentimentAtmosphere
            emotions={aggregates.topEmotions}
            totalPeople={aggregates.totalPeople}
          />

          {/* 5. Geographic Activation & Territory Distribution Map */}
          {matches && matches.length > 0 && (
            <div style={{ position: 'relative' }}>
              {reportSlug && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                  <a
                    href={`/interactive-report/${reportSlug}/map`}
                    className={styles.resetBtn}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      borderRadius: '9999px',
                      background: '#0f2c4a',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 700,
                      textDecoration: 'none',
                      boxShadow: '0 4px 10px rgba(15, 44, 74, 0.2)',
                    }}
                  >
                    🗺️ Launch Fullscreen Dedicated Territory Analytics Page ↗
                  </a>
                </div>
              )}
              <TerritoryMapCanvas
                matches={matches || []}
                vision={vision}
                partnerSlug={partnerSlug}
                partnerName={partnerName}
                embedded={true}
              />
            </div>
          )}

          {/* 6. Live Analyzed Stream (Curated Detections) */}
          {filteredRecentImages && filteredRecentImages.length > 0 && (
            <div className={styles.recentStreamWrap}>
              <div className={styles.recentStreamHeader}>
                <div>
                  <h4 className={styles.recentStreamTitle}>
                    📸 Live Analyzed Stream ({isAll ? 'Latest Detections' : `${selectedSport} Detections`})
                  </h4>
                  <p className={styles.cardSubtitle}>
                    Sample extracted selfie observations showing detected people, recognized brands, emotions, and scenes.
                  </p>
                </div>
                {isRunning && (
                  <div className={styles.activeFileInfo}>
                    <span className={styles.activeFileLabel}>Analyzing Now:</span>{' '}
                    <strong className={styles.activeFileName}>
                      {vision.currentSport} / {vision.currentFile || 'Batch...'}
                    </strong>
                  </div>
                )}
              </div>

              <div className={styles.recentCardsGrid}>
                {filteredRecentImages.map((img) => (
                  <div key={img.fileName} className={styles.recentItemCard}>
                    <div className={styles.recentItemTop}>
                      <span className={styles.recentSportBadge}>{img.sport}</span>
                      <span className={styles.recentPeopleCount}>
                        👤 {img.peopleCount} {img.peopleCount === 1 ? 'person' : 'people'}
                      </span>
                    </div>
                    {img.scene && <div className={styles.recentItemScene}>{img.scene}</div>}
                    <div className={styles.recentItemMeta}>
                      {img.brands.length > 0 && (
                        <div className={styles.recentTagRow}>
                          <span className={styles.recentTagLabel}>Brands:</span>{' '}
                          {img.brands.join(', ')}
                        </div>
                      )}
                      {img.emotions.length > 0 && (
                        <div className={styles.recentTagRow}>
                          <span className={styles.recentTagLabel}>Emotions:</span>{' '}
                          {img.emotions.join(', ')}
                        </div>
                      )}
                    </div>
                    <div className={styles.recentFileFooter}>{img.fileName}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
