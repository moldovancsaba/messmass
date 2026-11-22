'use client';

import React, { useMemo } from 'react';
import { MatchItem, VisionProgressData } from './types';
import styles from './interactive-report.module.css';

interface MatchdayAnalyticsSuiteProps {
  matches: MatchItem[];
  vision?: VisionProgressData | null;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatMonthLabel(ym: string): string {
  const [y, m] = ym.split('-');
  const idx = Number(m) - 1;
  if (!y || !Number.isFinite(idx) || idx < 0 || idx > 11) return ym;
  return `${MONTH_NAMES[idx]} ${y}`;
}

function getFillPct(m: MatchItem): number | null {
  if (typeof m.capacityUtilizationRate === 'number' && Number.isFinite(m.capacityUtilizationRate)) {
    return Math.min(100, Math.max(0, m.capacityUtilizationRate));
  }
  if (m.attendance && m.venueCapacity && m.venueCapacity > 0) {
    return Math.min(100, Math.round((m.attendance / m.venueCapacity) * 1000) / 10);
  }
  return null;
}

export default function MatchdayAnalyticsSuite({ matches, vision }: MatchdayAnalyticsSuiteProps) {
  // 1. Monthly Stadium Attendance Breakdown
  const monthlyStats = useMemo(() => {
    const map = new Map<
      string,
      { month: string; matches: number; attendance: number; capacity: number; photos: number; fillSum: number; fillCount: number }
    >();
    for (const m of matches) {
      const ym = (m.date || '').replace(/\./g, '-').slice(0, 7);
      if (!/^\d{4}-\d{2}$/.test(ym)) continue;
      const cur = map.get(ym) ?? { month: ym, matches: 0, attendance: 0, capacity: 0, photos: 0, fillSum: 0, fillCount: 0 };
      cur.matches += 1;
      cur.attendance += m.attendance || 0;
      cur.capacity += m.venueCapacity || 0;
      cur.photos += m.submitted || 0;
      const fill = getFillPct(m);
      if (fill !== null) {
        cur.fillSum += fill;
        cur.fillCount += 1;
      }
      map.set(ym, cur);
    }
    return Array.from(map.values())
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((row) => ({
        ...row,
        label: formatMonthLabel(row.month),
        avgFill: row.fillCount > 0 ? Math.round((row.fillSum / row.fillCount) * 10) / 10 : null,
        avgAttendance: row.matches > 0 ? Math.round(row.attendance / row.matches) : 0,
      }));
  }, [matches]);

  // 2. Start Time vs Stadium Attendance
  const kickoffStats = useMemo(() => {
    const buckets: Array<{ key: string; label: string; minH: number; maxH: number }> = [
      { key: 'early', label: 'Early (<15:00)', minH: 0, maxH: 14 },
      { key: 'afternoon', label: 'Afternoon (15:00–17:59)', minH: 15, maxH: 17 },
      { key: 'evening', label: 'Evening (18:00–19:59)', minH: 18, maxH: 19 },
      { key: 'night', label: 'Night (20:00+)', minH: 20, maxH: 23 },
    ];
    const acc = buckets.map((b) => ({ ...b, matches: 0, attendance: 0, fillSum: 0, fillCount: 0, photos: 0 }));
    let hasAnyTime = false;
    for (const m of matches) {
      if (!m.kickoffTime) continue;
      const hour = Number(m.kickoffTime.split(':')[0]);
      if (!Number.isFinite(hour)) continue;
      hasAnyTime = true;
      const bucket = acc.find((b) => hour >= b.minH && hour <= b.maxH);
      if (!bucket) continue;
      bucket.matches += 1;
      bucket.attendance += m.attendance || 0;
      bucket.photos += m.submitted || 0;
      const fill = getFillPct(m);
      if (fill !== null) {
        bucket.fillSum += fill;
        bucket.fillCount += 1;
      }
    }
    return {
      hasAnyTime,
      rows: acc
        .filter((b) => b.matches > 0)
        .map((b) => ({
          ...b,
          avgFill: b.fillCount > 0 ? Math.round((b.fillSum / b.fillCount) * 10) / 10 : null,
          avgAttendance: Math.round(b.attendance / b.matches),
        })),
    };
  }, [matches]);

  // 3. Day-of-Week Attendance & Photo Activation
  const weekdayStats = useMemo(() => {
    const map = new Map<number, { dayIdx: number; label: string; matches: number; attendance: number; fillSum: number; fillCount: number; photos: number }>();
    for (const m of matches) {
      const cleanDate = (m.date || '').replace(/\./g, '-').slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) continue;
      const d = new Date(`${cleanDate}T12:00:00Z`);
      const dayIdx = d.getUTCDay();
      const cur = map.get(dayIdx) ?? { dayIdx, label: DAY_NAMES[dayIdx], matches: 0, attendance: 0, fillSum: 0, fillCount: 0, photos: 0 };
      cur.matches += 1;
      cur.attendance += m.attendance || 0;
      cur.photos += m.submitted || 0;
      const fill = getFillPct(m);
      if (fill !== null) {
        cur.fillSum += fill;
        cur.fillCount += 1;
      }
      map.set(dayIdx, cur);
    }
    const order = [1, 2, 3, 4, 5, 6, 0];
    return order
      .map((idx) => map.get(idx))
      .filter((r): r is NonNullable<typeof r> => Boolean(r && r.matches > 0))
      .map((r) => ({
        ...r,
        avgFill: r.fillCount > 0 ? Math.round((r.fillSum / r.fillCount) * 10) / 10 : null,
        avgAttendance: Math.round(r.attendance / r.matches),
        avgPhotos: Math.round(r.photos / r.matches),
      }));
  }, [matches]);

  // 4. Precipitation & Wind Impact (Outdoor matches with weather)
  const weatherConditionsStats = useMemo(() => {
    const outdoor = matches.filter((m) => m.weather && !m.weather.isIndoor && getFillPct(m) !== null);
    if (outdoor.length === 0) return null;

    const avgFor = (list: MatchItem[]) => {
      if (list.length === 0) return null;
      const fills = list.map(getFillPct).filter((v): v is number => v !== null);
      return fills.length > 0 ? Math.round((fills.reduce((a, b) => a + b, 0) / fills.length) * 10) / 10 : null;
    };

    const dry = outdoor.filter((m) => (m.weather?.precipitationMm ?? 0) === 0);
    const wet = outdoor.filter((m) => (m.weather?.precipitationMm ?? 0) > 0);
    const calm = outdoor.filter((m) => (m.weather?.windKmh ?? 0) < 15);
    const windy = outdoor.filter((m) => (m.weather?.windKmh ?? 0) >= 15);

    return [
      { label: 'Dry (0 mm)', count: dry.length, avgFill: avgFor(dry) },
      { label: 'Rain (>0 mm)', count: wet.length, avgFill: avgFor(wet) },
      { label: 'Calm (<15 km/h)', count: calm.length, avgFill: avgFor(calm) },
      { label: 'Windy (≥15 km/h)', count: windy.length, avgFill: avgFor(windy) },
    ].filter((r) => r.count > 0 && r.avgFill !== null);
  }, [matches]);

  // 5. Sport-by-Sport Attendance & Photo Capture Density
  const sportStats = useMemo(() => {
    const map = new Map<string, { sport: string; matches: number; attendance: number; fillSum: number; fillCount: number; photos: number }>();
    for (const m of matches) {
      const sp = m.sport || 'Other';
      const cur = map.get(sp) ?? { sport: sp, matches: 0, attendance: 0, fillSum: 0, fillCount: 0, photos: 0 };
      cur.matches += 1;
      cur.attendance += m.attendance || 0;
      cur.photos += m.submitted || 0;
      const fill = getFillPct(m);
      if (fill !== null) {
        cur.fillSum += fill;
        cur.fillCount += 1;
      }
      map.set(sp, cur);
    }
    return Array.from(map.values())
      .filter((r) => r.matches > 0)
      .sort((a, b) => b.matches - a.matches)
      .map((r) => ({
        ...r,
        avgFill: r.fillCount > 0 ? Math.round((r.fillSum / r.fillCount) * 10) / 10 : null,
        photosPer1k: r.attendance > 0 ? Math.round((r.photos / r.attendance) * 10000) / 10 : null,
      }));
  }, [matches]);

  // 6. Score Margin & Competitiveness vs Photo Activation
  const competitivenessStats = useMemo(() => {
    const scored = matches.filter(
      (m) =>
        m.homeScore !== null &&
        m.homeScore !== undefined &&
        m.visitorScore !== null &&
        m.visitorScore !== undefined
    );
    if (scored.length === 0) return [];

    const drawList = scored.filter((m) => m.homeScore === m.visitorScore);
    const closeList = scored.filter((m) => Math.abs((m.homeScore ?? 0) - (m.visitorScore ?? 0)) === 1);
    const decisiveList = scored.filter((m) => Math.abs((m.homeScore ?? 0) - (m.visitorScore ?? 0)) >= 2);

    const summarize = (label: string, list: MatchItem[]) => {
      if (list.length === 0) return null;
      const avgPhotos = Math.round(list.reduce((s, m) => s + (m.submitted || 0), 0) / list.length);
      const fills = list.map(getFillPct).filter((v): v is number => v !== null);
      const avgFill = fills.length > 0 ? Math.round((fills.reduce((a, b) => a + b, 0) / fills.length) * 10) / 10 : null;
      return { label, count: list.length, avgPhotos, avgFill };
    };

    return [
      summarize('One-score thriller (±1)', closeList),
      summarize('Decisive margin (≥2)', decisiveList),
      summarize('Drawn fixture', drawList),
    ].filter((r): r is NonNullable<typeof r> => Boolean(r));
  }, [matches]);

  // 7. Venue Capacity Tier vs Capture Efficiency
  const capacityTierStats = useMemo(() => {
    const withCap = matches.filter((m) => (m.venueCapacity ?? 0) > 0 && (m.attendance ?? 0) > 0);
    if (withCap.length === 0) return [];
    const tiers = [
      { label: 'Intimate (<5,000)', list: withCap.filter((m) => (m.venueCapacity ?? 0) < 5000) },
      { label: 'Mid-size (5,000–12,000)', list: withCap.filter((m) => (m.venueCapacity ?? 0) >= 5000 && (m.venueCapacity ?? 0) <= 12000) },
      { label: 'Major (>12,000)', list: withCap.filter((m) => (m.venueCapacity ?? 0) > 12000) },
    ];
    return tiers
      .filter((t) => t.list.length > 0)
      .map((t) => {
        const fills = t.list.map(getFillPct).filter((v): v is number => v !== null);
        const avgFill = fills.length > 0 ? Math.round((fills.reduce((a, b) => a + b, 0) / fills.length) * 10) / 10 : 0;
        const totAtt = t.list.reduce((s, m) => s + (m.attendance || 0), 0);
        const totPhotos = t.list.reduce((s, m) => s + (m.submitted || 0), 0);
        const photosPer1k = totAtt > 0 ? Math.round((totPhotos / totAtt) * 10000) / 10 : 0;
        return { label: t.label, count: t.list.length, avgFill, photosPer1k };
      });
  }, [matches]);

  // 8. Sport-by-Sport Fan Sentiment & Demographics (Vision)
  const sportVisionStats = useMemo(() => {
    const breakdown = vision?.aggregates?.sportsBreakdown;
    if (!breakdown) return [];
    return Object.entries(breakdown)
      .filter(([, b]) => b.images > 0 && b.people > 0)
      .sort((a, b) => b[1].images - a[1].images)
      .map(([sport, b]) => {
        const male = b.genders?.male ?? 0;
        const female = b.genders?.female ?? 0;
        const gTotal = male + female;
        const malePct = gTotal > 0 ? Math.round((male / gTotal) * 1000) / 10 : null;
        return {
          sport,
          images: b.images,
          people: b.people,
          peoplePerPhoto: Math.round((b.people / b.images) * 100) / 100,
          malePct,
          valence: typeof b.valence === 'number' ? Math.round(b.valence * 10) / 10 : null,
        };
      });
  }, [vision?.aggregates?.sportsBreakdown]);

  if (matches.length === 0) return null;

  const maxMonthlyAtt = Math.max(...monthlyStats.map((m) => m.attendance), 1);
  const maxCompPhotos = Math.max(...competitivenessStats.map((c) => c.avgPhotos), 1);

  return (
    <div className={styles.suiteStack}>
      {/* Row A: Monthly Stadium Attendance + Start Time vs Attendance */}
      <div className={styles.bentoTwoCol}>
        {monthlyStats.length > 0 && (
          <article className={styles.bentoPanel}>
            <header className={styles.bentoPanelHeader}>
              <div className={styles.bentoPanelTitle}>
                <span className={styles.bentoPanelIcon} aria-hidden="true">📅</span>
                <h2 className={styles.gdsCardTitle}>Monthly stadium attendance breakdown</h2>
              </div>
              <span className={styles.bentoPanelStatus}>{monthlyStats.length} months</span>
            </header>
            <div className={styles.bentoPanelBody}>
              <div className={styles.bentoBarList}>
                {monthlyStats.map((row) => {
                  const pct = row.attendance > 0 ? Math.round((row.attendance / maxMonthlyAtt) * 100) : 0;
                  return (
                    <div key={row.month} className={styles.bentoVenueRow}>
                      <div className={styles.bentoVenueHead}>
                        <span className={styles.gdsBody}>
                          <strong>{row.label}</strong>
                          <span className={styles.gdsCaption}> · {row.matches} {row.matches === 1 ? 'match' : 'matches'} · {row.photos.toLocaleString()} photos</span>
                        </span>
                        <span className={`${styles.gdsCaption} ${styles.gdsNum}`}>
                          {row.attendance > 0 ? `${row.attendance.toLocaleString()} fans` : 'n/a'}
                          {row.avgFill !== null ? ` (${row.avgFill}% fill)` : ''}
                        </span>
                      </div>
                      <svg viewBox="0 0 100 8" preserveAspectRatio="none" className={styles.bentoBarSvg} aria-hidden="true">
                        <rect x="0" y="0" width="100" height="8" rx="4" className={styles.bentoBarTrackRect} />
                        <rect x="0" y="0" width={Math.max(2, pct)} height="8" rx="4" className={styles.bentoBarFillRect} />
                      </svg>
                    </div>
                  );
                })}
              </div>
            </div>
          </article>
        )}

        {/* Start Time vs Stadium Attendance */}
        <article className={styles.bentoPanel}>
          <header className={styles.bentoPanelHeader}>
            <div className={styles.bentoPanelTitle}>
              <span className={styles.bentoPanelIcon} aria-hidden="true">🕒</span>
              <h2 className={styles.gdsCardTitle}>Start time vs. stadium attendance</h2>
            </div>
            <span className={styles.bentoPanelStatus}>
              {kickoffStats.hasAnyTime ? `${kickoffStats.rows.length} windows` : 'Kickoff time'}
            </span>
          </header>
          <div className={styles.bentoPanelBody}>
            {kickoffStats.hasAnyTime && kickoffStats.rows.length > 0 ? (
              <div className={styles.bentoBarList}>
                {kickoffStats.rows.map((row) => (
                  <div key={row.key} className={styles.bentoVenueRow}>
                    <div className={styles.bentoVenueHead}>
                      <span className={styles.gdsBody}>
                        <strong>{row.label}</strong>
                        <span className={styles.gdsCaption}> · {row.matches} {row.matches === 1 ? 'match' : 'matches'}</span>
                      </span>
                      <span className={`${styles.gdsCaption} ${styles.gdsNum}`}>
                        {row.avgAttendance.toLocaleString()} avg gate
                        {row.avgFill !== null ? ` (${row.avgFill}% fill)` : ''}
                      </span>
                    </div>
                    <svg viewBox="0 0 100 8" preserveAspectRatio="none" className={styles.bentoBarSvg} aria-hidden="true">
                      <rect x="0" y="0" width="100" height="8" rx="4" className={styles.bentoBarTrackRect} />
                      <rect x="0" y="0" width={Math.max(2, row.avgFill ?? 0)} height="8" rx="4" className={styles.bentoBarFillTeal} />
                    </svg>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.bentoSummaryStat}>
                <span className={styles.gdsEyebrow}>KICKOFF TIMESTAMP AUDIT</span>
                <strong className={styles.gdsCardTitle}>Start times not recorded on legacy fixtures</strong>
                <span className={styles.gdsCaption}>
                  Fixture dates are stored without kickoff hours for this portfolio. New Football-Data and match imports automatically populate kickoff times for this breakdown.
                </span>
              </div>
            )}
          </div>
        </article>
      </div>

      {/* Row B: Day of Week Turnout + Precipitation & Wind Impact */}
      <div className={styles.bentoTwoCol}>
        {weekdayStats.length > 0 && (
          <article className={styles.bentoPanel}>
            <header className={styles.bentoPanelHeader}>
              <div className={styles.bentoPanelTitle}>
                <span className={styles.bentoPanelIcon} aria-hidden="true">📆</span>
                <h2 className={styles.gdsCardTitle}>Day-of-week turnout &amp; photo volume</h2>
              </div>
              <span className={styles.bentoPanelStatus}>{weekdayStats.length} days</span>
            </header>
            <div className={styles.bentoPanelBody}>
              <div className={styles.bentoBarList}>
                {weekdayStats.map((row) => (
                  <div key={row.dayIdx} className={styles.bentoVenueRow}>
                    <div className={styles.bentoVenueHead}>
                      <span className={styles.gdsBody}>
                        <strong>{row.label}</strong>
                        <span className={styles.gdsCaption}> · {row.matches} matches · {row.avgPhotos.toLocaleString()} avg photos</span>
                      </span>
                      <span className={`${styles.gdsCaption} ${styles.gdsNum}`}>
                        {row.avgAttendance > 0 ? `${row.avgAttendance.toLocaleString()} avg` : 'n/a'}
                        {row.avgFill !== null ? ` · ${row.avgFill}%` : ''}
                      </span>
                    </div>
                    <svg viewBox="0 0 100 8" preserveAspectRatio="none" className={styles.bentoBarSvg} aria-hidden="true">
                      <rect x="0" y="0" width="100" height="8" rx="4" className={styles.bentoBarTrackRect} />
                      <rect x="0" y="0" width={Math.max(2, row.avgFill ?? 0)} height="8" rx="4" className={styles.bentoBarFillRect} />
                    </svg>
                  </div>
                ))}
              </div>
            </div>
          </article>
        )}

        {weatherConditionsStats && weatherConditionsStats.length > 0 && (
          <article className={styles.bentoPanel}>
            <header className={styles.bentoPanelHeader}>
              <div className={styles.bentoPanelTitle}>
                <span className={styles.bentoPanelIcon} aria-hidden="true">🌧️</span>
                <h2 className={styles.gdsCardTitle}>Precipitation &amp; wind vs. outdoor fill rate</h2>
              </div>
              <span className={styles.bentoPanelStatus}>Outdoor fixtures</span>
            </header>
            <div className={styles.bentoPanelBody}>
              <div className={styles.bentoBarList}>
                {weatherConditionsStats.map((row) => (
                  <div key={row.label} className={styles.bentoVenueRow}>
                    <div className={styles.bentoVenueHead}>
                      <span className={styles.gdsBody}>
                        <strong>{row.label}</strong>
                        <span className={styles.gdsCaption}> · {row.count} {row.count === 1 ? 'match' : 'matches'}</span>
                      </span>
                      <span className={`${styles.gdsCaption} ${styles.gdsNum}`}>{row.avgFill}% avg fill</span>
                    </div>
                    <svg viewBox="0 0 100 8" preserveAspectRatio="none" className={styles.bentoBarSvg} aria-hidden="true">
                      <rect x="0" y="0" width="100" height="8" rx="4" className={styles.bentoBarTrackRect} />
                      <rect x="0" y="0" width={Math.max(2, row.avgFill ?? 0)} height="8" rx="4" className={styles.bentoBarFillTeal} />
                    </svg>
                  </div>
                ))}
              </div>
            </div>
          </article>
        )}
      </div>

      {/* Row C: Sport Attendance & Capture + Score Margin Competitiveness */}
      <div className={styles.bentoTwoCol}>
        {sportStats.length > 0 && (
          <article className={styles.bentoPanel}>
            <header className={styles.bentoPanelHeader}>
              <div className={styles.bentoPanelTitle}>
                <span className={styles.bentoPanelIcon} aria-hidden="true">🏅</span>
                <h2 className={styles.gdsCardTitle}>Sport-by-sport fill rate &amp; capture density</h2>
              </div>
              <span className={styles.bentoPanelStatus}>{sportStats.length} sports</span>
            </header>
            <div className={styles.bentoPanelBody}>
              <div className={styles.bentoBarList}>
                {sportStats.map((row) => (
                  <div key={row.sport} className={styles.bentoVenueRow}>
                    <div className={styles.bentoVenueHead}>
                      <span className={styles.gdsBody}>
                        <strong>{row.sport}</strong>
                        <span className={styles.gdsCaption}>
                          {' '}· {row.matches} matches{row.photosPer1k !== null ? ` · ${row.photosPer1k} photos/1k fans` : ''}
                        </span>
                      </span>
                      <span className={`${styles.gdsCaption} ${styles.gdsNum}`}>
                        {row.avgFill !== null ? `${row.avgFill}% fill` : `${row.photos.toLocaleString()} photos`}
                      </span>
                    </div>
                    <svg viewBox="0 0 100 8" preserveAspectRatio="none" className={styles.bentoBarSvg} aria-hidden="true">
                      <rect x="0" y="0" width="100" height="8" rx="4" className={styles.bentoBarTrackRect} />
                      <rect x="0" y="0" width={Math.max(2, row.avgFill ?? 0)} height="8" rx="4" className={styles.bentoBarFillRect} />
                    </svg>
                  </div>
                ))}
              </div>
            </div>
          </article>
        )}

        {competitivenessStats.length > 0 && (
          <article className={styles.bentoPanel}>
            <header className={styles.bentoPanelHeader}>
              <div className={styles.bentoPanelTitle}>
                <span className={styles.bentoPanelIcon} aria-hidden="true">⚡</span>
                <h2 className={styles.gdsCardTitle}>Score margin vs. fan photo activation</h2>
              </div>
              <span className={styles.bentoPanelStatus}>Scored fixtures</span>
            </header>
            <div className={styles.bentoPanelBody}>
              <div className={styles.bentoBarList}>
                {competitivenessStats.map((row) => {
                  const pct = Math.round((row.avgPhotos / maxCompPhotos) * 100);
                  return (
                    <div key={row.label} className={styles.bentoVenueRow}>
                      <div className={styles.bentoVenueHead}>
                        <span className={styles.gdsBody}>
                          <strong>{row.label}</strong>
                          <span className={styles.gdsCaption}>
                            {' '}· {row.count} matches{row.avgFill !== null ? ` · ${row.avgFill}% fill` : ''}
                          </span>
                        </span>
                        <span className={`${styles.gdsCaption} ${styles.gdsNum}`}>{row.avgPhotos.toLocaleString()} avg photos</span>
                      </div>
                      <svg viewBox="0 0 100 8" preserveAspectRatio="none" className={styles.bentoBarSvg} aria-hidden="true">
                        <rect x="0" y="0" width="100" height="8" rx="4" className={styles.bentoBarTrackRect} />
                        <rect x="0" y="0" width={Math.max(2, pct)} height="8" rx="4" className={styles.bentoBarFillTeal} />
                      </svg>
                    </div>
                  );
                })}
              </div>
            </div>
          </article>
        )}
      </div>

      {/* Row D: Venue Capacity Tiers + Sport Vision Demographics & Sentiment */}
      {(capacityTierStats.length > 0 || sportVisionStats.length > 1) && (
        <div className={styles.bentoTwoCol}>
          {capacityTierStats.length > 0 && (
            <article className={styles.bentoPanel}>
              <header className={styles.bentoPanelHeader}>
                <div className={styles.bentoPanelTitle}>
                  <span className={styles.bentoPanelIcon} aria-hidden="true">🏛️</span>
                  <h2 className={styles.gdsCardTitle}>Venue capacity tier vs. capture rate</h2>
                </div>
                <span className={styles.bentoPanelStatus}>{capacityTierStats.length} tiers</span>
              </header>
              <div className={styles.bentoPanelBody}>
                <div className={styles.bentoBarList}>
                  {capacityTierStats.map((row) => (
                    <div key={row.label} className={styles.bentoVenueRow}>
                      <div className={styles.bentoVenueHead}>
                        <span className={styles.gdsBody}>
                          <strong>{row.label}</strong>
                          <span className={styles.gdsCaption}> · {row.count} matches · {row.photosPer1k} photos/1k fans</span>
                        </span>
                        <span className={`${styles.gdsCaption} ${styles.gdsNum}`}>{row.avgFill}% fill</span>
                      </div>
                      <svg viewBox="0 0 100 8" preserveAspectRatio="none" className={styles.bentoBarSvg} aria-hidden="true">
                        <rect x="0" y="0" width="100" height="8" rx="4" className={styles.bentoBarTrackRect} />
                        <rect x="0" y="0" width={Math.max(2, row.avgFill)} height="8" rx="4" className={styles.bentoBarFillRect} />
                      </svg>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          )}

          {sportVisionStats.length > 1 && (
            <article className={styles.bentoPanel}>
              <header className={styles.bentoPanelHeader}>
                <div className={styles.bentoPanelTitle}>
                  <span className={styles.bentoPanelIcon} aria-hidden="true">📸</span>
                  <h2 className={styles.gdsCardTitle}>Audience density &amp; gender by sport</h2>
                </div>
                <span className={styles.bentoPanelStatus}>AI Vision</span>
              </header>
              <div className={styles.bentoPanelBody}>
                <div className={styles.bentoBarList}>
                  {sportVisionStats.map((row) => (
                    <div key={row.sport} className={styles.bentoVenueRow}>
                      <div className={styles.bentoVenueHead}>
                        <span className={styles.gdsBody}>
                          <strong>{row.sport}</strong>
                          <span className={styles.gdsCaption}>
                            {' '}· {row.peoplePerPhoto} people/photo
                            {row.valence !== null ? ` · ${row.valence}% positive` : ''}
                          </span>
                        </span>
                        <span className={`${styles.gdsCaption} ${styles.gdsNum}`}>
                          {row.malePct !== null ? `${row.malePct}% M` : `${row.people.toLocaleString()} people`}
                        </span>
                      </div>
                      <svg viewBox="0 0 100 8" preserveAspectRatio="none" className={styles.bentoBarSvg} aria-hidden="true">
                        <rect x="0" y="0" width="100" height="8" rx="4" className={styles.bentoBarTrackRect} />
                        <rect x="0" y="0" width={Math.max(2, row.malePct ?? 50)} height="8" rx="4" className={styles.bentoBarFillTeal} />
                      </svg>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          )}
        </div>
      )}
    </div>
  );
}
