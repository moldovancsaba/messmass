'use client';
/* eslint-disable react/forbid-dom-props */

import React, { useMemo, useState } from 'react';
import styles from './interactive-report.module.css';

interface SportBreakdownItem {
  images: number;
  people: number;
  genders?: {
    male: number;
    female: number;
    malePct?: number;
    femalePct?: number;
  };
  ageGroups?: {
    children: number;
    teens: number;
    adults: number;
    seniors: number;
  };
}

interface FanmassSportsDemographicsProps {
  sportsBreakdown: Record<string, SportBreakdownItem>;
  totalPeople: number;
}

function sportIcon(sport: string): string {
  const low = sport.toLowerCase();
  if (low.includes('foot')) return '⚽';
  if (low.includes('basket')) return '🏀';
  if (low.includes('hockey')) return '🏒';
  if (low.includes('hand')) return '🤾';
  return '🏅';
}

/** Gender split from the measured counts. Null when no gender was measured; a true 0% stays 0%. */
function genderStats(data: SportBreakdownItem) {
  const male = data.genders?.male ?? 0;
  const female = data.genders?.female ?? 0;
  const total = male + female;
  if (total <= 0) return null;
  return {
    male,
    female,
    malePct: Number(((male / total) * 100).toFixed(1)),
    femalePct: Number(((female / total) * 100).toFixed(1)),
  };
}

/** Age-bracket split from the measured counts. Null when no age was measured. */
function ageStats(data: SportBreakdownItem) {
  const ag = data.ageGroups;
  if (!ag) return null;
  const total = ag.children + ag.teens + ag.adults + ag.seniors;
  if (total <= 0) return null;
  const adultsPct = Math.round((ag.adults / total) * 100);
  const teensPct = Math.round((ag.teens / total) * 100);
  const childrenPct = Math.round((ag.children / total) * 100);
  const seniorsPct = Math.max(0, 100 - (adultsPct + teensPct + childrenPct));
  return { ag, total, adultsPct, teensPct, childrenPct, seniorsPct };
}

export default function FanmassSportsDemographics({
  sportsBreakdown,
  totalPeople,
}: FanmassSportsDemographicsProps) {
  const [activeTab, setActiveTab] = useState<'comparison' | 'gender' | 'age'>('comparison');

  // Only sports that actually have data are listed, largest first.
  const sportsList = useMemo(
    () =>
      Object.entries(sportsBreakdown || {})
        .filter(([, d]) => d && (d.people > 0 || d.images > 0))
        .sort((a, b) => b[1].people - a[1].people)
        .map(([sport]) => sport),
    [sportsBreakdown]
  );

  // Findings are computed from the measured splits and only shown when at least two sports can be compared.
  const genderFinding = useMemo(() => {
    const rows = sportsList
      .map((sport) => ({ sport, g: genderStats(sportsBreakdown[sport]) }))
      .filter((r): r is { sport: string; g: NonNullable<ReturnType<typeof genderStats>> } => r.g !== null);
    if (rows.length < 2) return null;
    const topFemale = rows.reduce((a, b) => (b.g.femalePct > a.g.femalePct ? b : a));
    const topMale = rows.reduce((a, b) => (b.g.malePct > a.g.malePct ? b : a));
    if (topFemale.sport === topMale.sport) return null;
    return { topFemale, topMale };
  }, [sportsList, sportsBreakdown]);

  const youthFinding = useMemo(() => {
    const rows = sportsList
      .map((sport) => {
        const a = ageStats(sportsBreakdown[sport]);
        return a ? { sport, youthPct: a.childrenPct + a.teensPct } : null;
      })
      .filter((r): r is { sport: string; youthPct: number } => r !== null);
    if (rows.length < 2) return null;
    return rows.reduce((a, b) => (b.youthPct > a.youthPct ? b : a));
  }, [sportsList, sportsBreakdown]);

  return (
    <div className={styles.reportCard}>
      <div className={styles.cardHeader}>
        <div>
          <div className={styles.cardHeaderBadgeRow}>
            <span className={styles.cardSourceTag}>
              🔬 Visual Demographics Engine • Facial & Feature Recognition
            </span>
            <span className={styles.cardCountPill}>
              {totalPeople.toLocaleString()} People Analyzed
            </span>
          </div>
          <h3 className={styles.cardTitle}>
            🏆 Cross-Sport Demographics & Age Comparison
          </h3>
          <p className={styles.cardSubtitle}>
            Comparison of gender ratios and age brackets measured in the analysed photos, by sport.
          </p>
        </div>

        {/* View Toggle */}
        <div className={styles.granularityToggle}>
          <button
            onClick={() => setActiveTab('comparison')}
            className={`${styles.granularityBtn} ${
              activeTab === 'comparison' ? styles.granularityBtnActive : ''
            }`}
          >
            📊 Side-by-Side Comparison
          </button>
          <button
            onClick={() => setActiveTab('gender')}
            className={`${styles.granularityBtn} ${
              activeTab === 'gender' ? styles.granularityBtnActive : ''
            }`}
          >
            Gender Breakdown
          </button>
          <button
            onClick={() => setActiveTab('age')}
            className={`${styles.granularityBtn} ${
              activeTab === 'age' ? styles.granularityBtnActive : ''
            }`}
          >
            Age Brackets by Sport
          </button>
        </div>
      </div>

      {activeTab === 'comparison' ? (
        /* Unified Side-by-Side Comparison View */
        <div className={styles.compChartContainer}>
          {/* Chart 1: Gender Distribution Side-by-Side */}
          <div className={styles.compSectionCard}>
            <div className={styles.compSectionTitle}>
              <span>⚖️ Gender Balance Across Sports (with 50/50 Parity Line)</span>
              <div className={styles.compLegendRow}>
                <span className={styles.compLegendItem}>
                  <span className={styles.compLegendDot} style={{ background: '#0284c7' }} />
                  Male
                </span>
                <span className={styles.compLegendItem}>
                  <span className={styles.compLegendDot} style={{ background: '#ec4899' }} />
                  Female
                </span>
              </div>
            </div>

            <div className={styles.compRowsStack}>
              {sportsList.length === 0 && (
                <div style={{ padding: '16px', color: '#64748b', fontSize: '13px' }}>n/a</div>
              )}
              {sportsList.map((sport) => {
                const data = sportsBreakdown[sport];
                const g = genderStats(data);

                return (
                  <div key={sport} className={styles.compRowItem}>
                    <div className={styles.compSportLabelWrap}>
                      <span className={styles.compSportIcon}>{sportIcon(sport)}</span>
                      <div>
                        <div className={styles.compSportName}>{sport}</div>
                        <div className={styles.compSportPhotos}>{data.people.toLocaleString()} fans</div>
                      </div>
                    </div>

                    <div className={styles.compBarWrapper}>
                      <div className={styles.compSplitBar}>
                        {g && (
                          <>
                            <div
                              style={{
                                width: `${g.malePct}%`,
                                background: '#0284c7',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-start',
                                paddingLeft: '8px',
                                color: '#ffffff',
                                fontSize: '11px',
                                fontWeight: 700,
                                overflow: 'hidden',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {g.malePct > 15 ? `${g.malePct}%` : ''}
                            </div>
                            <div
                              style={{
                                width: `${g.femalePct}%`,
                                background: '#ec4899',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-end',
                                paddingRight: '8px',
                                color: '#ffffff',
                                fontSize: '11px',
                                fontWeight: 700,
                                overflow: 'hidden',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {g.femalePct > 15 ? `${g.femalePct}%` : ''}
                            </div>
                          </>
                        )}
                      </div>
                      <div className={styles.compParityMarkerLine} title="50% Gender Parity" />
                    </div>

                    <div style={{ fontSize: '11px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {g ? (
                        <>
                          <strong style={{ color: '#0284c7' }}>{g.malePct}%</strong> M •{' '}
                          <strong style={{ color: '#ec4899' }}>{g.femalePct}%</strong> F
                        </>
                      ) : (
                        'n/a'
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {genderFinding && (
              <div className={styles.compCallout}>
                <span>💡</span>
                <div>
                  <strong>Demographic Finding:</strong> {genderFinding.topFemale.sport} has the highest female share (
                  {genderFinding.topFemale.g.femalePct}%) and {genderFinding.topMale.sport} the highest male share (
                  {genderFinding.topMale.g.malePct}%) among the measured fans.
                </div>
              </div>
            )}
          </div>

          {/* Chart 2: Generational Age Bracket Stacked Distribution */}
          <div className={styles.compSectionCard}>
            <div className={styles.compSectionTitle}>
              <span>👥 Generational Breakdown Across Sports</span>
              <div className={styles.compLegendRow}>
                <span className={styles.compLegendItem}>
                  <span className={styles.compLegendDot} style={{ background: '#f59e0b' }} />
                  Children (&lt;13)
                </span>
                <span className={styles.compLegendItem}>
                  <span className={styles.compLegendDot} style={{ background: '#0284c7' }} />
                  Teens (14-18)
                </span>
                <span className={styles.compLegendItem}>
                  <span className={styles.compLegendDot} style={{ background: '#059669' }} />
                  Adults (19-55)
                </span>
                <span className={styles.compLegendItem}>
                  <span className={styles.compLegendDot} style={{ background: '#8b5cf6' }} />
                  Seniors (55+)
                </span>
              </div>
            </div>

            <div className={styles.compRowsStack}>
              {sportsList.length === 0 && (
                <div style={{ padding: '16px', color: '#64748b', fontSize: '13px' }}>n/a</div>
              )}
              {sportsList.map((sport) => {
                const data = sportsBreakdown[sport];
                const a = ageStats(data);

                return (
                  <div key={sport} className={styles.compRowItem}>
                    <div className={styles.compSportLabelWrap}>
                      <span className={styles.compSportIcon}>{sportIcon(sport)}</span>
                      <div>
                        <div className={styles.compSportName}>{sport}</div>
                        <div className={styles.compSportPhotos}>
                          {data.people.toLocaleString()} people
                        </div>
                      </div>
                    </div>

                    <div className={styles.compBarWrapper}>
                      <div className={styles.compSplitBar}>
                        {a && (
                          <>
                            <div
                              title={`Children: ${a.childrenPct}%`}
                              style={{
                                width: `${a.childrenPct}%`,
                                background: '#f59e0b',
                              }}
                            />
                            <div
                              title={`Teens: ${a.teensPct}%`}
                              style={{
                                width: `${a.teensPct}%`,
                                background: '#0284c7',
                              }}
                            />
                            <div
                              title={`Adults: ${a.adultsPct}%`}
                              style={{
                                width: `${a.adultsPct}%`,
                                background: '#059669',
                              }}
                            />
                            <div
                              title={`Seniors: ${a.seniorsPct}%`}
                              style={{
                                width: `${a.seniorsPct}%`,
                                background: '#8b5cf6',
                              }}
                            />
                          </>
                        )}
                      </div>
                    </div>

                    <div style={{ fontSize: '11px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {a ? (
                        <>
                          <span style={{ color: '#f59e0b' }}>{a.childrenPct}% Ch</span> •{' '}
                          <span style={{ color: '#0284c7' }}>{a.teensPct}% Te</span> •{' '}
                          <span style={{ color: '#059669' }}>{a.adultsPct}% Ad</span>
                        </>
                      ) : (
                        'n/a'
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {youthFinding && (
              <div className={styles.compCallout} style={{ background: '#eff6ff', borderColor: '#bfdbfe', color: '#1e40af' }}>
                <span>💡</span>
                <div>
                  <strong>Youth Insight:</strong> {youthFinding.sport} has the highest share of children and teenagers (
                  {youthFinding.youthPct}% of the people with a measured age).
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Detailed Grid of Sports Cards */
        <div className={styles.sportsDemoGrid}>
        {sportsList.length === 0 && (
          <div style={{ padding: '16px', color: '#64748b', fontSize: '13px' }}>n/a</div>
        )}
        {sportsList.map((sport) => {
          const data = sportsBreakdown[sport];
          const g = genderStats(data);
          const a = ageStats(data);

          const ageRows: Array<{ label: string; count: number; pct: number; fillClass: string }> = a
            ? [
                {
                  label: 'Adults (19-55)',
                  count: a.ag.adults,
                  pct: Math.round((a.ag.adults / a.total) * 100),
                  fillClass: styles.ageBarFillAdults,
                },
                {
                  label: 'Teens (14-18)',
                  count: a.ag.teens,
                  pct: Math.round((a.ag.teens / a.total) * 100),
                  fillClass: styles.ageBarFillTeens,
                },
                {
                  label: 'Children (<13)',
                  count: a.ag.children,
                  pct: Math.round((a.ag.children / a.total) * 100),
                  fillClass: styles.ageBarFillChildren,
                },
                {
                  label: 'Seniors (55+)',
                  count: a.ag.seniors,
                  pct: Math.round((a.ag.seniors / a.total) * 100),
                  fillClass: styles.ageBarFillSeniors,
                },
              ]
            : [];

          return (
            <div key={sport} className={styles.sportDemoCard}>
              {/* Card Header */}
              <div className={styles.sportCardHeader}>
                <div className={styles.sportCardTitleWrap}>
                  <span className={styles.sportCardIcon}>{sportIcon(sport)}</span>
                  <div>
                    <h4 className={styles.sportCardName}>{sport}</h4>
                  </div>
                </div>
                <div className={styles.sportVolumeBadge}>
                  <strong>{data.people.toLocaleString()}</strong> fans / {data.images.toLocaleString()} photos
                </div>
              </div>

              {activeTab === 'gender' ? (
                /* Gender Comparison View */
                g ? (
                  <div className={styles.sportGenderView}>
                    <div className={styles.genderSplitBar}>
                      <div
                        className={styles.genderSplitMale}
                        style={{ width: `${g.malePct}%` }}
                        title={`Male: ${g.malePct}%`}
                      />
                      <div
                        className={styles.genderSplitFemale}
                        style={{ width: `${g.femalePct}%` }}
                        title={`Female: ${g.femalePct}%`}
                      />
                    </div>

                    <div className={styles.genderStatsRow}>
                      <div className={styles.genderStatItem}>
                        <span className={styles.genderDotMale} />
                        <span className={styles.genderLabel}>Male</span>
                        <strong className={styles.genderVal}>{g.malePct}%</strong>
                        <span className={styles.genderCount}>({g.male.toLocaleString()})</span>
                      </div>
                      <div className={styles.genderStatItem}>
                        <span className={styles.genderDotFemale} />
                        <span className={styles.genderLabel}>Female</span>
                        <strong className={styles.genderVal}>{g.femalePct}%</strong>
                        <span className={styles.genderCount}>({g.female.toLocaleString()})</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={styles.sportGenderView}>n/a</div>
                )
              ) : a ? (
                /* Age Bracket Distribution View */
                <div className={styles.sportAgeView}>
                  <div className={styles.ageBarsStack}>
                    {ageRows.map((row) => (
                      <div key={row.label} className={styles.ageBarRow}>
                        <div className={styles.ageBarLabelGroup}>
                          <span>{row.label}</span>
                          <strong>
                            {row.pct}% ({row.count.toLocaleString()})
                          </strong>
                        </div>
                        <div className={styles.ageBarTrack}>
                          <div className={row.fillClass} style={{ width: `${row.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className={styles.sportAgeView}>n/a</div>
              )}
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}
