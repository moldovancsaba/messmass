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

function formatMonthShort(ym: string): string {
  const [y, m] = ym.split('-');
  const idx = Number(m) - 1;
  if (!y || !Number.isFinite(idx) || idx < 0 || idx > 11) return ym;
  return `${MONTH_NAMES[idx]} '${y.slice(2)}`;
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

function ColumnChartSvg({
  data,
  maxValue,
  unitSuffix = '',
  barClass = styles.svgBarPrimary,
  yTicks = [0, 50, 100],
}: {
  data: Array<{ label: string; value: number; tooltip: string; subLabel?: string }>;
  maxValue: number;
  unitSuffix?: string;
  barClass?: string;
  yTicks?: number[];
}) {
  const W = 440;
  const H = 195;
  const padL = 38;
  const padR = 14;
  const padT = 22;
  const padB = 34;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const safeMax = Math.max(maxValue, 1);
  const step = plotW / Math.max(data.length, 1);
  const barW = Math.min(44, Math.max(14, step * 0.56));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={styles.svgChart} role="img" aria-label="Column chart">
      {yTicks.map((tick) => {
        const y = padT + plotH - (tick / safeMax) * plotH;
        return (
          <g key={tick}>
            <line x1={padL} y1={y} x2={W - padR} y2={y} className={styles.svgGridLine} />
            <text x={padL - 6} y={y + 3} textAnchor="end" className={styles.svgAxisText}>
              {tick}{unitSuffix}
            </text>
          </g>
        );
      })}
      <line x1={padL} y1={padT + plotH} x2={W - padR} y2={padT + plotH} className={styles.svgAxisLine} />

      {data.map((d, idx) => {
        const barH = Math.max(2, (d.value / safeMax) * plotH);
        const cx = padL + step * idx + step / 2;
        const x = cx - barW / 2;
        const y = padT + plotH - barH;
        return (
          <g key={d.label}>
            <rect x={x} y={y} width={barW} height={barH} rx={4} className={barClass}>
              <title>{d.tooltip}</title>
            </rect>
            <text x={cx} y={y - 5} textAnchor="middle" className={styles.svgValueLabel}>
              {d.value.toLocaleString()}{unitSuffix}
            </text>
            <text x={cx} y={padT + plotH + 14} textAnchor="middle" className={styles.svgAxisText}>
              {d.label}
            </text>
            {d.subLabel && (
              <text x={cx} y={padT + plotH + 26} textAnchor="middle" className={styles.svgAxisText}>
                {d.subLabel}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export default function MatchdayAnalyticsSuite({ matches, vision }: MatchdayAnalyticsSuiteProps) {
  // 1. Monthly Stadium Attendance & Fill Rate Trend
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
        label: formatMonthShort(row.month),
        avgFill: row.fillCount > 0 ? Math.round((row.fillSum / row.fillCount) * 10) / 10 : null,
      }));
  }, [matches]);

  // 2. Start Time vs Stadium Attendance
  const kickoffStats = useMemo(() => {
    const buckets: Array<{ key: string; label: string; minH: number; maxH: number }> = [
      { key: 'early', label: '<15:00', minH: 0, maxH: 14 },
      { key: 'afternoon', label: '15–17h', minH: 15, maxH: 17 },
      { key: 'evening', label: '18–19h', minH: 18, maxH: 19 },
      { key: 'night', label: '20:00+', minH: 20, maxH: 23 },
    ];
    const acc = buckets.map((b) => ({ ...b, matches: 0, attendance: 0, fillSum: 0, fillCount: 0 }));
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
          avgFill: b.fillCount > 0 ? Math.round((b.fillSum / b.fillCount) * 10) / 10 : 0,
          avgAttendance: Math.round(b.attendance / b.matches),
        })),
    };
  }, [matches]);

  // 3. Day-of-Week Turnout
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
        avgFill: r.fillCount > 0 ? Math.round((r.fillSum / r.fillCount) * 10) / 10 : 0,
        avgAttendance: Math.round(r.attendance / r.matches),
      }));
  }, [matches]);

  // 4. Precipitation & Wind Impact
  const weatherConditionsStats = useMemo(() => {
    const outdoor = matches.filter((m) => m.weather && !m.weather.isIndoor && getFillPct(m) !== null);
    if (outdoor.length === 0) return [];

    const avgFor = (list: MatchItem[]) => {
      const fills = list.map(getFillPct).filter((v): v is number => v !== null);
      return fills.length > 0 ? Math.round((fills.reduce((a, b) => a + b, 0) / fills.length) * 10) / 10 : 0;
    };

    const dry = outdoor.filter((m) => (m.weather?.precipitationMm ?? 0) === 0);
    const wet = outdoor.filter((m) => (m.weather?.precipitationMm ?? 0) > 0);
    const calm = outdoor.filter((m) => (m.weather?.windKmh ?? 0) < 15);
    const windy = outdoor.filter((m) => (m.weather?.windKmh ?? 0) >= 15);

    return [
      { label: 'Dry (0mm)', count: dry.length, avgFill: avgFor(dry) },
      { label: 'Rain (>0mm)', count: wet.length, avgFill: avgFor(wet) },
      { label: 'Calm (<15km/h)', count: calm.length, avgFill: avgFor(calm) },
      { label: 'Windy (≥15km/h)', count: windy.length, avgFill: avgFor(windy) },
    ].filter((r) => r.count > 0);
  }, [matches]);

  // 5. Sport-by-Sport Scatter/Bubble (Fill % vs Photos per 1k fans)
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
      .filter((r) => r.matches > 0 && r.fillCount > 0)
      .sort((a, b) => b.matches - a.matches)
      .map((r) => ({
        ...r,
        avgFill: Math.round((r.fillSum / r.fillCount) * 10) / 10,
        photosPer1k: r.attendance > 0 ? Math.round((r.photos / r.attendance) * 10000) / 10 : 0,
      }));
  }, [matches]);

  // 6. Score Margin vs Photo Activation
  const competitivenessStats = useMemo(() => {
    const scored = matches.filter(
      (m) => m.homeScore !== null && m.homeScore !== undefined && m.visitorScore !== null && m.visitorScore !== undefined
    );
    if (scored.length === 0) return [];
    const drawList = scored.filter((m) => m.homeScore === m.visitorScore);
    const closeList = scored.filter((m) => Math.abs((m.homeScore ?? 0) - (m.visitorScore ?? 0)) === 1);
    const decisiveList = scored.filter((m) => Math.abs((m.homeScore ?? 0) - (m.visitorScore ?? 0)) >= 2);
    const summarize = (label: string, list: MatchItem[]) => {
      if (list.length === 0) return null;
      const avgPhotos = Math.round(list.reduce((s, m) => s + (m.submitted || 0), 0) / list.length);
      return { label, count: list.length, avgPhotos };
    };
    return [
      summarize('±1 Goal', closeList),
      summarize('≥2 Margin', decisiveList),
      summarize('Draw', drawList),
    ].filter((r): r is NonNullable<typeof r> => Boolean(r));
  }, [matches]);

  // 7. Venue Capacity Tiers
  const capacityTierStats = useMemo(() => {
    const withCap = matches.filter((m) => (m.venueCapacity ?? 0) > 0 && (m.attendance ?? 0) > 0);
    if (withCap.length === 0) return [];
    const tiers = [
      { label: '<5k seats', list: withCap.filter((m) => (m.venueCapacity ?? 0) < 5000) },
      { label: '5k–12k', list: withCap.filter((m) => (m.venueCapacity ?? 0) >= 5000 && (m.venueCapacity ?? 0) <= 12000) },
      { label: '>12k seats', list: withCap.filter((m) => (m.venueCapacity ?? 0) > 12000) },
    ];
    return tiers
      .filter((t) => t.list.length > 0)
      .map((t) => {
        const fills = t.list.map(getFillPct).filter((v): v is number => v !== null);
        const avgFill = fills.length > 0 ? Math.round((fills.reduce((a, b) => a + b, 0) / fills.length) * 10) / 10 : 0;
        return { label: t.label, count: t.list.length, avgFill };
      });
  }, [matches]);

  // 8. Sport Vision Gender Stacked Chart
  const sportVisionStats = useMemo(() => {
    const breakdown = vision?.aggregates?.sportsBreakdown;
    if (!breakdown) return [];
    return Object.entries(breakdown)
      .filter(([, b]) => b.images > 0 && b.people > 0 && b.genders && b.genders.male + b.genders.female > 0)
      .sort((a, b) => b[1].images - a[1].images)
      .map(([sport, b]) => {
        const male = b.genders!.male;
        const female = b.genders!.female;
        const total = male + female;
        return {
          sport,
          malePct: Math.round((male / total) * 1000) / 10,
          femalePct: Math.round((female / total) * 1000) / 10,
          peoplePerPhoto: Math.round((b.people / b.images) * 10) / 10,
        };
      });
  }, [vision?.aggregates?.sportsBreakdown]);

  if (matches.length === 0) return null;

  // Monthly Combo Chart geometry
  const mW = 920;
  const mH = 230;
  const mPadL = 54;
  const mPadR = 44;
  const mPadT = 24;
  const mPadB = 38;
  const mPlotW = mW - mPadL - mPadR;
  const mPlotH = mH - mPadT - mPadB;
  const maxMonthAtt = Math.max(...monthlyStats.map((m) => m.attendance), 1);
  const mStep = mPlotW / Math.max(monthlyStats.length, 1);
  const mBarW = Math.min(34, Math.max(10, mStep * 0.58));

  const trendPoints = monthlyStats
    .map((row, idx) => {
      if (row.avgFill === null) return null;
      const cx = mPadL + mStep * idx + mStep / 2;
      const cy = mPadT + mPlotH - (row.avgFill / 100) * mPlotH;
      return { cx, cy, label: row.label, avgFill: row.avgFill };
    })
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  const maxPhotoScore = Math.max(...competitivenessStats.map((c) => c.avgPhotos), 10);
  const maxPhotosPer1k = Math.max(...sportStats.map((s) => s.photosPer1k), 10);

  return (
    <div className={styles.suiteStack}>
      {/* Tier 2 & 3: Photo Engagement & Crowd Composition First */}
      {sportVisionStats.length > 1 && (
        <article className={styles.bentoPanel}>
          <header className={styles.bentoPanelHeader}>
            <div className={styles.bentoPanelTitle}>
              <span className={styles.bentoPanelIcon} aria-hidden="true">📸</span>
              <h2 className={styles.gdsCardTitle}>Men vs. women in the crowd by sport</h2>
            </div>
            <span className={styles.bentoPanelStatus}>Primary: Male · Teal: Female</span>
          </header>
          <div className={styles.bentoPanelBody}>
            <p className={styles.bentoBenefit}>
              Compares gender balance and group size per photo across sports to guide sponsor targeting.
            </p>
            <svg viewBox={`0 0 ${880} ${sportVisionStats.length * 36 + 16}`} className={styles.svgChart} role="img" aria-label="Gender split by sport">
              {sportVisionStats.map((row, idx) => {
                const y = idx * 36 + 8;
                const barX = 120;
                const barMaxW = 480;
                const maleW = (row.malePct / 100) * barMaxW;
                const femaleW = Math.max(0, barMaxW - maleW);
                return (
                  <g key={row.sport}>
                    <text x={0} y={y + 16} className={styles.svgValueLabel}>
                      {row.sport}
                    </text>
                    <rect x={barX} y={y + 4} width={maleW} height={16} rx={3} className={styles.svgBarPrimary}>
                      <title>{`${row.sport}: ${row.malePct}% Male`}</title>
                    </rect>
                    <rect x={barX + maleW} y={y + 4} width={femaleW} height={16} rx={3} className={styles.svgBarTeal}>
                      <title>{`${row.sport}: ${row.femalePct}% Female`}</title>
                    </rect>
                    <text x={barX + barMaxW + 12} y={y + 16} className={styles.svgAxisText}>
                      {row.malePct}% M / {row.femalePct}% F · {row.peoplePerPhoto} p/photo
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </article>
      )}

      {/* 1. Monthly Stadium Attendance Column + Seat Occupancy Trend Line Chart */}
      {monthlyStats.length >= 2 && monthlyStats.some((r) => r.attendance > 0 || (r.avgFill ?? 0) > 0) && (
        <article className={styles.bentoPanel}>
          <header className={styles.bentoPanelHeader}>
            <div className={styles.bentoPanelTitle}>
              <span className={styles.bentoPanelIcon} aria-hidden="true">📅</span>
              <h2 className={styles.gdsCardTitle}>Monthly attendance &amp; stadium fill</h2>
            </div>
            <span className={styles.bentoPanelStatus}>
              Bars: Attendance · Line: Seat Occupancy % ({monthlyStats.length} months)
            </span>
          </header>
          <div className={styles.bentoPanelBody}>
            <p className={styles.bentoBenefit}>
              Tracks seasonal peaks and dips in crowd size so you can schedule big sponsor campaigns during top months.
            </p>
            <svg viewBox={`0 0 ${mW} ${mH}`} className={styles.svgChart} role="img" aria-label="Monthly stadium attendance and fill rate trend">
              {[0, 0.5, 1].map((frac) => {
                const y = mPadT + mPlotH - frac * mPlotH;
                const attTick = Math.round(maxMonthAtt * frac);
                const pctTick = Math.round(frac * 100);
                return (
                  <g key={frac}>
                    <line x1={mPadL} y1={y} x2={mW - mPadR} y2={y} className={styles.svgGridLine} />
                    <text x={mPadL - 6} y={y + 3} textAnchor="end" className={styles.svgAxisText}>
                      {attTick >= 1000 ? `${Math.round(attTick / 1000)}k` : attTick}
                    </text>
                    <text x={mW - mPadR + 6} y={y + 3} textAnchor="start" className={styles.svgAxisText}>
                      {pctTick}%
                    </text>
                  </g>
                );
              })}
              <line x1={mPadL} y1={mPadT + mPlotH} x2={mW - mPadR} y2={mPadT + mPlotH} className={styles.svgAxisLine} />

              {monthlyStats.map((row, idx) => {
                const barH = Math.max(2, (row.attendance / maxMonthAtt) * mPlotH);
                const cx = mPadL + mStep * idx + mStep / 2;
                const x = cx - mBarW / 2;
                const y = mPadT + mPlotH - barH;
                const showTickLabel = monthlyStats.length <= 12 || idx % 2 === 0;
                return (
                  <g key={row.month}>
                    <rect x={x} y={y} width={mBarW} height={barH} rx={3} className={styles.svgBarPrimary}>
                      <title>{`${row.label}: ${row.attendance.toLocaleString()} fans (${row.matches} matches, ${row.avgFill ?? 'n/a'}% fill, ${row.photos.toLocaleString()} photos)`}</title>
                    </rect>
                    {showTickLabel && (
                      <text x={cx} y={mPadT + mPlotH + 16} textAnchor="middle" className={styles.svgAxisText}>
                        {row.label}
                      </text>
                    )}
                  </g>
                );
              })}

              {trendPoints.length > 1 && (
                <polyline
                  points={trendPoints.map((p) => `${p.cx},${p.cy}`).join(' ')}
                  className={styles.svgTrendLine}
                />
              )}
              {trendPoints.map((p) => (
                <circle key={p.label} cx={p.cx} cy={p.cy} r={4} className={styles.svgTrendDot}>
                  <title>{`${p.label}: ${p.avgFill}% avg seat occupancy`}</title>
                </circle>
              ))}
            </svg>
          </div>
        </article>
      )}

      {/* Row A: Start Time vs Attendance + Day of Week Turnout */}
      {((kickoffStats.hasAnyTime && kickoffStats.rows.length > 0) || weekdayStats.length > 0) && (
      <div className={styles.bentoTwoCol}>
        {kickoffStats.hasAnyTime && kickoffStats.rows.length > 0 && (
        <article className={styles.bentoPanel}>
          <header className={styles.bentoPanelHeader}>
            <div className={styles.bentoPanelTitle}>
              <span className={styles.bentoPanelIcon} aria-hidden="true">🕒</span>
              <h2 className={styles.gdsCardTitle}>Best kickoff times for turnout</h2>
            </div>
            <span className={styles.bentoPanelStatus}>
              {`${kickoffStats.rows.length} windows`}
            </span>
          </header>
          <div className={styles.bentoPanelBody}>
            <p className={styles.bentoBenefit}>
              Shows which match start times fill the stands best so you can optimize scheduling and fan-zone hours.
            </p>
            <ColumnChartSvg
              data={kickoffStats.rows.map((r) => ({
                label: r.label,
                subLabel: `${r.matches}m`,
                value: r.avgFill,
                tooltip: `${r.label}: ${r.avgFill}% avg seat occupancy (${r.avgAttendance.toLocaleString()} avg attendance across ${r.matches} matches)`,
              }))}
              maxValue={100}
              unitSuffix="%"
              barClass={styles.svgBarTeal}
            />
          </div>
        </article>
        )}

        {weekdayStats.length >= 2 && weekdayStats.some((r) => r.avgFill > 0 || r.avgAttendance > 0) && (
          <article className={styles.bentoPanel}>
            <header className={styles.bentoPanelHeader}>
              <div className={styles.bentoPanelTitle}>
                <span className={styles.bentoPanelIcon} aria-hidden="true">📆</span>
                <h2 className={styles.gdsCardTitle}>Best days of the week for turnout</h2>
              </div>
              <span className={styles.bentoPanelStatus}>{weekdayStats.length} days</span>
            </header>
            <div className={styles.bentoPanelBody}>
              <p className={styles.bentoBenefit}>
                Compares weekday vs. weekend stadium fill so you know when fans are most likely to show up.
              </p>
              <ColumnChartSvg
                data={weekdayStats.map((r) => ({
                  label: r.label,
                  subLabel: `${r.matches}m`,
                  value: r.avgFill,
                  tooltip: `${r.label}: ${r.avgFill}% avg seat occupancy (${r.avgAttendance.toLocaleString()} avg attendance, ${r.matches} matches)`,
                }))}
                maxValue={100}
                unitSuffix="%"
              />
            </div>
          </article>
        )}
      </div>
      )}

      {/* Row B: Photo Engagement vs Seat Occupancy & Score Margin */}
      <div className={styles.bentoTwoCol}>
        {competitivenessStats.length >= 2 && (
          <article className={styles.bentoPanel}>
            <header className={styles.bentoPanelHeader}>
              <div className={styles.bentoPanelTitle}>
                <span className={styles.bentoPanelIcon} aria-hidden="true">⚡</span>
                <h2 className={styles.gdsCardTitle}>Do close games drive more photos?</h2>
              </div>
              <span className={styles.bentoPanelStatus}>Scored matches</span>
            </header>
            <div className={styles.bentoPanelBody}>
              <p className={styles.bentoBenefit}>
                Compares average fan photos in tight, nail-biting matches versus blowouts.
              </p>
              <ColumnChartSvg
                data={competitivenessStats.map((r) => ({
                  label: r.label,
                  subLabel: `${r.count}m`,
                  value: r.avgPhotos,
                  tooltip: `${r.label}: ${r.avgPhotos.toLocaleString()} avg photos (${r.count} matches)`,
                }))}
                maxValue={Math.ceil(maxPhotoScore * 1.15)}
                yTicks={[0, Math.round(maxPhotoScore * 0.5), Math.ceil(maxPhotoScore * 1.15)]}
              />
            </div>
          </article>
        )}

        {sportStats.length >= 2 && sportStats.some((r) => r.avgFill > 0) && (
          <article className={styles.bentoPanel}>
            <header className={styles.bentoPanelHeader}>
              <div className={styles.bentoPanelTitle}>
                <span className={styles.bentoPanelIcon} aria-hidden="true">🏅</span>
                <h2 className={styles.gdsCardTitle}>Crowd fill vs. fan photo rate</h2>
              </div>
              <span className={styles.bentoPanelStatus}>Bubble size = matches</span>
            </header>
            <div className={styles.bentoPanelBody}>
              <p className={styles.bentoBenefit}>
                Shows whether fuller stadiums also produce more fan photos per 1,000 attendees across sports.
              </p>
              <svg viewBox="0 0 440 195" className={styles.svgChart} role="img" aria-label="Sport fill rate vs photos per 1k fans">
                {[0, 50, 100].map((tick) => {
                  const y = 20 + 140 - (tick / 100) * 140;
                  return (
                    <g key={tick}>
                      <line x1={42} y1={y} x2={424} y2={y} className={styles.svgGridLine} />
                      <text x={36} y={y + 3} textAnchor="end" className={styles.svgAxisText}>
                        {Math.round((maxPhotosPer1k * tick) / 100)}
                      </text>
                    </g>
                  );
                })}
                <line x1={42} y1={160} x2={424} y2={160} className={styles.svgAxisLine} />
                <text x={233} y={185} textAnchor="middle" className={styles.svgAxisText}>
                  Avg Stadium Seat Occupancy (0% → 100%)
                </text>
                {sportStats.map((row, idx) => {
                  const cx = 42 + (row.avgFill / 100) * 370;
                  const cy = 20 + 140 - (row.photosPer1k / maxPhotosPer1k) * 140;
                  const r = Math.min(22, Math.max(8, 6 + Math.sqrt(row.matches) * 2.5));
                  return (
                    <g key={row.sport}>
                      <circle
                        cx={cx}
                        cy={cy}
                        r={r}
                        className={idx % 2 === 0 ? styles.svgBubblePrimary : styles.svgBubbleTeal}
                      >
                        <title>{`${row.sport}: ${row.avgFill}% fill, ${row.photosPer1k} photos/1k fans (${row.matches} matches)`}</title>
                      </circle>
                      <text x={cx} y={cy - r - 4} textAnchor="middle" className={styles.svgValueLabel}>
                        {row.sport}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </article>
        )}
      </div>

      {/* Row C: Venue Capacity Tier + Background Weather Context */}
      <div className={styles.bentoTwoCol}>
        {weatherConditionsStats.length >= 2 && (
          <article className={styles.bentoPanel}>
            <header className={styles.bentoPanelHeader}>
              <div className={styles.bentoPanelTitle}>
                <span className={styles.bentoPanelIcon} aria-hidden="true">🌧️</span>
                <h2 className={styles.gdsCardTitle}>Rain &amp; wind impact on outdoor games</h2>
              </div>
              <span className={styles.bentoPanelStatus}>Outdoor matches</span>
            </header>
            <div className={styles.bentoPanelBody}>
              <p className={styles.bentoBenefit}>
                Measures how much rain or strong wind reduces outdoor attendance compared to dry matchdays.
              </p>
              <ColumnChartSvg
                data={weatherConditionsStats.map((r) => ({
                  label: r.label,
                  subLabel: `${r.count}m`,
                  value: r.avgFill,
                  tooltip: `${r.label}: ${r.avgFill}% avg seat occupancy (${r.count} outdoor matches)`,
                }))}
                maxValue={100}
                unitSuffix="%"
                barClass={styles.svgBarTeal}
              />
            </div>
          </article>
        )}

        {capacityTierStats.length > 0 && (
          <article className={styles.bentoPanel}>
            <header className={styles.bentoPanelHeader}>
              <div className={styles.bentoPanelTitle}>
                <span className={styles.bentoPanelIcon} aria-hidden="true">🏛️</span>
                <h2 className={styles.gdsCardTitle}>How full are small vs. large venues?</h2>
              </div>
              <span className={styles.bentoPanelStatus}>{capacityTierStats.length} tiers</span>
            </header>
            <div className={styles.bentoPanelBody}>
              <p className={styles.bentoBenefit}>
                Shows whether smaller arenas sell out more consistently than mega-stadiums.
              </p>
              <ColumnChartSvg
                data={capacityTierStats.map((r) => ({
                  label: r.label,
                  subLabel: `${r.count}m`,
                  value: r.avgFill,
                  tooltip: `${r.label}: ${r.avgFill}% avg seat occupancy (${r.count} matches)`,
                }))}
                maxValue={100}
                unitSuffix="%"
                barClass={styles.svgBarTeal}
              />
            </div>
          </article>
        )}
      </div>
    </div>
  );
}
