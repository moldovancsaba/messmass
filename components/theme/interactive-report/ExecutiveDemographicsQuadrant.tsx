'use client';
/* eslint-disable react/forbid-dom-props */

import React, { useState } from 'react';
import Link from 'next/link';
import styles from './executive-view.module.css';

interface DemographicsQuadrantProps {
  /** Gender counts from the vision analysis; null when none were measured. */
  genders: {
    male: number;
    female: number;
    malePct: number;
    femalePct: number;
  } | null;
  /** Age-group counts from the vision analysis; null when none were measured. */
  ageGroups: {
    children: number;
    teens: number;
    adults: number;
    seniors: number;
  } | null;
  /** People detected in the analysed images; null when unknown. */
  totalPeople: number | null;
  topEmotions: Array<{ emotion: string; count: number }>;
  merchandise?: Array<{ item: string; count: number; percentage: number }>;
  /** Distinct venue names of this scope's events. */
  venues?: string[];
  /** Slug of the scope (hashtag-<name>, event-<slug> or partner slug); null hides the map page link. */
  reportSlug?: string | null;
  onViewTerritoryMap: () => void;
}

const MAX_VENUES_LISTED = 6;

export default function ExecutiveDemographicsQuadrant({
  genders,
  ageGroups,
  totalPeople,
  topEmotions,
  merchandise,
  venues = [],
  reportSlug = null,
  onViewTerritoryMap,
}: DemographicsQuadrantProps) {
  const [merchViewMode, setMerchViewMode] = useState<'bars' | 'pie'>('bars');

  // Gender: shown only when at least one person was classified.
  const hasGenders = genders !== null && genders.male + genders.female > 0;

  // Age calculations: shown only when at least one person was classified.
  const totalAgeCount = ageGroups
    ? (ageGroups.children || 0) +
      (ageGroups.teens || 0) +
      (ageGroups.adults || 0) +
      (ageGroups.seniors || 0)
    : 0;
  const hasAgeGroups = ageGroups !== null && totalAgeCount > 0;

  const getAgePct = (count: number) =>
    totalAgeCount > 0 ? Math.round((count / totalAgeCount) * 1000) / 10 : 0;

  const childPct = getAgePct(ageGroups?.children || 0);
  const teenPct = getAgePct(ageGroups?.teens || 0);
  const adultPct = getAgePct(ageGroups?.adults || 0);
  const seniorPct = getAgePct(ageGroups?.seniors || 0);

  // Expression calculations: share of detected expressions other than neutral / focused.
  const totalEmotionsCount = topEmotions.reduce((acc, e) => acc + e.count, 0);
  const positiveCount = topEmotions
    .filter((e) => e.emotion.toLowerCase() !== 'neutral' && e.emotion.toLowerCase() !== 'focused')
    .reduce((acc, e) => acc + e.count, 0);
  const hasValence = totalEmotionsCount > 0;
  const happyPct = hasValence ? Math.round((positiveCount / totalEmotionsCount) * 1000) / 10 : 0;
  const neutralPct = hasValence ? Math.round((100 - happyPct) * 10) / 10 : 0;

  // Merchandise calculation, from detected items only:
  // 1. Fan adoption rate: count / totalPeople (each in its own row)
  // 2. Merchandise ratio: count / totalMerchItems (where sum = 100% on the pie chart)
  const rawMerchList = (merchandise || []).map((m) => {
    let icon = '🏷️';
    const low = m.item.toLowerCase();
    if (low.includes('jersey') || low.includes('kit')) icon = '👕';
    else if (low.includes('scarf')) icon = '🧣';
    else if (low.includes('banner')) icon = '🚩';
    else if (low.includes('flag')) icon = '🏁';
    else if (low.includes('cap') || low.includes('hat')) icon = '🧢';
    return { item: m.item, icon, count: m.count };
  });
  const hasMerch = rawMerchList.length > 0;
  const peopleBase = totalPeople !== null && totalPeople > 0 ? totalPeople : null;

  const totalMerchCount = rawMerchList.reduce((acc, m) => acc + m.count, 0);

  const MERCH_COLORS: Record<string, string> = {
    Jersey: '#2563eb', // blue
    Logo: '#f59e0b', // amber
    Banner: '#ef4444', // red
    Scarf: '#8b5cf6', // purple
    Flag: '#10b981', // emerald
    'Cap / Hat': '#06b6d4', // cyan
  };

  const processedMerch = rawMerchList.map((m) => {
    // 1. Ratio between merches (summing to 100% across all merch items)
    const sharePct = totalMerchCount > 0
      ? Math.round((m.count / totalMerchCount) * 1000) / 10
      : 0;
    // 2. Adoption rate individually relative to the people detected (null without a base)
    const fanAdoptionPct = peopleBase !== null
      ? Math.round((m.count / peopleBase) * 1000) / 10
      : null;
    const color = MERCH_COLORS[m.item] || '#64748b';

    return {
      ...m,
      sharePct,
      fanAdoptionPct,
      color,
    };
  });

  // Generate SVG donut slices for the 100% Merch Ratio view
  let cumulativeAngle = 0;
  const donutSlices = processedMerch.map((item) => {
    const angle = (item.sharePct / 100) * 360;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angle;
    cumulativeAngle = endAngle;

    // Convert angles (-90 deg from positive x is top)
    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((endAngle - 90) * Math.PI) / 180;
    const cx = 70;
    const cy = 70;
    const rOuter = 62;
    const rInner = 38;

    const x1 = cx + rOuter * Math.cos(startRad);
    const y1 = cy + rOuter * Math.sin(startRad);
    const x2 = cx + rOuter * Math.cos(endRad);
    const y2 = cy + rOuter * Math.sin(endRad);
    const x3 = cx + rInner * Math.cos(endRad);
    const y3 = cy + rInner * Math.sin(endRad);
    const x4 = cx + rInner * Math.cos(startRad);
    const y4 = cy + rInner * Math.sin(startRad);

    const largeArc = angle > 180 ? 1 : 0;
    const pathD = `M ${x1} ${y1} A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${rInner} ${rInner} 0 ${largeArc} 0 ${x4} ${y4} Z`;

    return {
      ...item,
      pathD,
    };
  });

  const hasAnyMeasurement = hasGenders || hasAgeGroups || hasValence || hasMerch;
  const hasVenues = venues.length > 0;
  const listedVenues = venues.slice(0, MAX_VENUES_LISTED);
  const hiddenVenueCount = venues.length - listedVenues.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Quadrant cards: each one only renders when it has measured data */}
      {hasAnyMeasurement && (
      <div className={styles.demographicsQuadrant}>
        {/* Card 1: Gender Mix */}
        {hasGenders && genders && (
        <div className={styles.quadrantCard}>
          <div className={styles.quadrantHeader}>
            <div>
              <h4 className={styles.quadrantTitle}>
                <span>👥 Gender Mix</span>
              </h4>
              <div className={styles.quadrantSubtitle}>
                Based on people detected in analyzed images
              </div>
            </div>
            {totalPeople !== null && (
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>
                👤 {totalPeople.toLocaleString()}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, justifyContent: 'center' }}>
            {/* Male */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                <span>Male</span>
                <span style={{ color: '#2563eb' }}>{genders.malePct}% ({genders.male.toLocaleString()})</span>
              </div>
              <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${genders.malePct}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #3b82f6, #6366f1)',
                    borderRadius: '9999px',
                  }}
                />
              </div>
            </div>

            {/* Female */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                <span>Female</span>
                <span style={{ color: '#a855f7' }}>{genders.femalePct}% ({genders.female.toLocaleString()})</span>
              </div>
              <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${genders.femalePct}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #a855f7, #ec4899)',
                    borderRadius: '9999px',
                  }}
                />
              </div>
            </div>

            {totalPeople !== null && (
              <div style={{ marginTop: '8px', paddingTop: '12px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b' }}>
                <span>Total People Detected</span>
                <strong style={{ color: '#0f2c4a' }}>{totalPeople.toLocaleString()}</strong>
              </div>
            )}
          </div>
        </div>
        )}

        {/* Card 2: Age Groups & Expressions */}
        {(hasAgeGroups || hasValence) && (
        <div className={styles.quadrantCard}>
          <div className={styles.quadrantHeader}>
            <div>
              <h4 className={styles.quadrantTitle}>
                <span>🎂 Age Groups & Expressions</span>
              </h4>
              <div className={styles.quadrantSubtitle}>
                Age groups and expressions detected in analyzed images
              </div>
            </div>
            {hasValence && (
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#10b981' }}>
                {happyPct}% Positive
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {hasAgeGroups && ageGroups && (
            <>
            {/* Children */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#334155', marginBottom: '4px' }}>
                <span>Children (&lt;14)</span>
                <strong>{childPct}% ({ageGroups.children.toLocaleString()})</strong>
              </div>
              <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                <div style={{ width: `${childPct}%`, height: '100%', background: '#38bdf8', borderRadius: '9999px' }} />
              </div>
            </div>

            {/* Young Adults */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#334155', marginBottom: '4px' }}>
                <span>Young Adults (15-24)</span>
                <strong>{teenPct}% ({ageGroups.teens.toLocaleString()})</strong>
              </div>
              <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                <div style={{ width: `${teenPct}%`, height: '100%', background: '#6366f1', borderRadius: '9999px' }} />
              </div>
            </div>

            {/* Adults */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#334155', marginBottom: '4px' }}>
                <span>Adults (25-54)</span>
                <strong>{adultPct}% ({ageGroups.adults.toLocaleString()})</strong>
              </div>
              <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                <div style={{ width: `${adultPct}%`, height: '100%', background: '#818cf8', borderRadius: '9999px' }} />
              </div>
            </div>

            {/* Older Adults */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#334155', marginBottom: '4px' }}>
                <span>Older Adults (55+)</span>
                <strong>{seniorPct}% ({ageGroups.seniors.toLocaleString()})</strong>
              </div>
              <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                <div style={{ width: `${seniorPct}%`, height: '100%', background: '#a855f7', borderRadius: '9999px' }} />
              </div>
            </div>

            </>
            )}

            {/* Expression Row: share of detected expressions other than neutral / focused */}
            {hasValence && (
            <div
              style={{
                marginTop: '6px',
                padding: '8px 12px',
                borderRadius: '10px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #3b82f6, #a855f7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    boxShadow: '0 0 10px rgba(168, 85, 247, 0.4)',
                  }}
                >
                  😊
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
                    Positive Expressions
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>
                    {neutralPct}% Neutral / Focused
                  </div>
                </div>
              </div>
              <span style={{ fontSize: '14px', fontWeight: 800, color: '#10b981' }}>
                {happyPct}%
              </span>
            </div>
            )}
          </div>
        </div>
        )}

        {/* Card 3: Merchandise Item Types (Dual View: Bar Chart + 100% Pie Chart) */}
        {hasMerch && (
        <div className={styles.quadrantCard}>
          <div className={styles.quadrantHeader}>
            <div>
              <h4 className={styles.quadrantTitle}>
                <span>👕 Merchandise Analysis</span>
              </h4>
              <div className={styles.quadrantSubtitle}>
                {merchViewMode === 'bars'
                  ? peopleBase !== null
                    ? `Share of people detected (${peopleBase.toLocaleString()} people)`
                    : 'Detected item types'
                  : 'Ratio between detected item types (Sum = 100%)'}
              </div>
            </div>
            <div className={styles.merchHeaderActions}>
              <div className={styles.merchToggleGroup}>
                <button
                  type="button"
                  className={merchViewMode === 'bars' ? styles.merchToggleActive : styles.merchToggleBtn}
                  onClick={() => setMerchViewMode('bars')}
                  title="Each item counted individually against the total people detected"
                >
                  📊 % of Fans
                </button>
                <button
                  type="button"
                  className={merchViewMode === 'pie' ? styles.merchToggleActive : styles.merchToggleBtn}
                  onClick={() => setMerchViewMode('pie')}
                  title="Share breakdown across detected merchandise items (Sum = 100%)"
                >
                  🥧 100% Pie
                </button>
              </div>
            </div>
          </div>

          {merchViewMode === 'bars' ? (
            <div>
              <div className={styles.merchTableHeader}>
                <span style={{ width: '100px' }}>Item</span>
                <span style={{ flex: 1 }}>Fan Adoption</span>
                <span className={styles.merchPercentCol}>% Fans</span>
                <span className={styles.merchShareTag}>Item Share</span>
                <span className={styles.merchCountCol}>Count</span>
              </div>
              <div className={styles.merchList}>
                {processedMerch.map((m) => (
                  <div key={m.item} className={styles.merchRow}>
                    <div className={styles.merchLabel}>
                      <span>{m.icon}</span>
                      <span>{m.item}</span>
                    </div>
                    <div className={styles.merchBarTrack}>
                      <div
                        className={styles.merchBarFill}
                        style={{
                          width: `${Math.min(100, m.fanAdoptionPct ?? 0)}%`,
                          background: m.color,
                        }}
                      />
                    </div>
                    <span className={styles.merchPercentCol}>
                      {m.fanAdoptionPct !== null ? `${m.fanAdoptionPct}%` : 'n/a'}
                    </span>
                    <span className={styles.merchShareTag} title={`${m.sharePct}% of all detected merchandise items`}>
                      {m.sharePct}% mix
                    </span>
                    <span className={styles.merchCountCol}>
                      {m.count.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
              <div className={styles.merchFootnote}>
                <span>💡</span>
                <span>
                  {peopleBase !== null ? (
                    <>
                      <strong>Share of people detected:</strong> Each item counted individually against {peopleBase.toLocaleString()} people detected.
                    </>
                  ) : (
                    <>
                      <strong>Detected items:</strong> Counts per item type. No people total is available for this scope.
                    </>
                  )}
                </span>
              </div>
            </div>
          ) : (
            <div>
              <div className={styles.pieChartContainer}>
                <div className={styles.pieChartSvgWrap}>
                  <svg width="140" height="140" viewBox="0 0 140 140">
                    {donutSlices.map((slice) => (
                      <path
                        key={slice.item}
                        d={slice.pathD}
                        fill={slice.color}
                        stroke="#ffffff"
                        strokeWidth="1.5"
                      >
                        <title>{`${slice.item}: ${slice.sharePct}% (${slice.count.toLocaleString()} items)`}</title>
                      </path>
                    ))}
                    <text
                      x="70"
                      y="66"
                      textAnchor="middle"
                      fontSize="16"
                      fontWeight="800"
                      fill="#0f2c4a"
                    >
                      100%
                    </text>
                    <text
                      x="70"
                      y="80"
                      textAnchor="middle"
                      fontSize="9"
                      fontWeight="700"
                      fill="#64748b"
                    >
                      MERCH MIX
                    </text>
                  </svg>
                </div>

                <div className={styles.pieLegend}>
                  {processedMerch.map((m) => (
                    <div key={m.item} className={styles.pieLegendItem}>
                      <div
                        className={styles.pieLegendDot}
                        style={{ background: m.color }}
                      />
                      <div className={styles.pieLegendLabel}>
                        <span>{m.icon}</span>
                        <span>{m.item}</span>
                      </div>
                      <span className={styles.pieLegendPct}>
                        {m.sharePct}%
                      </span>
                      <span className={styles.pieLegendCount}>
                        {m.count.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className={styles.merchFootnote}>
                <span>🥧</span>
                <span>
                  <strong>Merchandise ratio:</strong> Distribution across {totalMerchCount.toLocaleString()} total detected items (Sum = 100%).
                </span>
              </div>
            </div>
          )}
        </div>
        )}
      </div>
      )}

      {/* Territory Deep Link Preview Card: venue names come from this scope's events */}
      {hasVenues && (
      <div className={styles.territoryCard}>
        <div className={styles.territoryInfo}>
          <span className={styles.territoryBadge}>
            Venue Footprint
          </span>
          <h3 className={styles.territoryTitle}>
            🗺️ Geographic Distribution & Venue Coverage
          </h3>
          <p className={styles.territoryDesc}>
            {venues.length.toLocaleString()} {venues.length === 1 ? 'venue' : 'venues'} in this scope: {listedVenues.join(', ')}
            {hiddenVenueCount > 0 ? ` and ${hiddenVenueCount.toLocaleString()} more` : ''}. Explore them on the map.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {reportSlug && (
            <Link
              href={`/interactive-report/${reportSlug}/map`}
              className={styles.territoryCtaBtn}
            >
              Open Dedicated Map View ↗
            </Link>
          )}
          <button
            type="button"
            onClick={onViewTerritoryMap}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '10px',
              padding: '10px 16px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'background 0.15s ease',
              whiteSpace: 'nowrap',
            }}
          >
            Switch to Map Tab
          </button>
        </div>
      </div>
      )}
    </div>
  );
}
